import type { Ref } from 'vue'
import type { GrowthExperience } from '../timelineConstants'
import { computed, ref, watch } from 'vue'
import { useSemesterRings } from './useSemesterRings'

export function useRingEffects(
  experiences: Ref<GrowthExperience[]>,
  selectedId: Ref<string | null>,
  reverseTrigger: Ref<number>,
  selectedAngle: Ref<number>,
  onComplete: (id: string) => void,
) {
  const { rings, findRingForExperience } = useSemesterRings()
  const ringCount = computed(() => rings.value.length)
  const extinguishedRings = ref<Set<number>>(new Set())
  const isReversing = ref(false)
  let reverseTimeouts: ReturnType<typeof setTimeout>[] = []

  // 与 HeroRings.vue 中 ringExtinguish 动画保持一致（2s）：
  // 与正向加载 ringDrawIn 的层间间隔 0.25s 对齐，
  // 外层先熄，按顺序依次启动，多圈可以同时回缩，形成加载的精确镜像。
  const REVERSE_STEP_MS = 250
  const EXTINGUISH_DURATION_MS = 2000

  // ringExtinguish 的缓动是 $ease-standard = cubic-bezier(0.4, 0, 0.2, 1)，
  // 线条前沿的角度进度是时间的非线性函数（前段快、后段慢）。
  // 展开时刻必须按同一条曲线的反函数求解，否则按 x = 角度/360 线性近似，
  // 前沿已经扫过小球一大截（实测最多超前约 96°）详情才展开。
  const EASE_STANDARD_P1X = 0.4
  const EASE_STANDARD_P1Y = 0
  const EASE_STANDARD_P2X = 0.2
  const EASE_STANDARD_P2Y = 1

  function bezierAxis(t: number, p1: number, p2: number) {
    const inv = 1 - t
    return 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t
  }

  /** 已知动画的进度（角度占比），反解出对应的时间进度（0~1），与 CSS 缓动一致 */
  function easeStandardProgressToTime(progress: number) {
    const target = Math.min(Math.max(progress, 0), 1)
    if (target <= 0) return 0
    if (target >= 1) return 1
    let low = 0
    let high = 1
    // 曲线的 y 轴单调递增，二分 24 次即可到浮点精度
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2
      if (bezierAxis(mid, EASE_STANDARD_P1Y, EASE_STANDARD_P2Y) < target) {
        low = mid
      } else {
        high = mid
      }
    }
    return bezierAxis((low + high) / 2, EASE_STANDARD_P1X, EASE_STANDARD_P2X)
  }

  function getSelectedRingIndex() {
    if (!selectedId.value) return -1
    const exp = experiences.value.find((e) => e.id === selectedId.value)
    if (!exp) return -1
    // 与小球定位保持同一套年轮解析：学期缺失时按日期推断，避免回缩动画错圈
    const ring = findRingForExperience(exp)
    return Math.max(0, (ring?.level ?? 1) - 1)
  }

  function clearReverseTimeouts() {
    reverseTimeouts.forEach(clearTimeout)
    reverseTimeouts = []
  }

  function runReverseAnimation() {
    const targetIndex = getSelectedRingIndex()
    if (targetIndex < 0) return

    // 避免重复触发导致时序混乱
    if (isReversing.value) return

    isReversing.value = true
    clearReverseTimeouts()

    const maxIndex = ringCount.value - 1
    // 外层先熄，逐层向内传递；CSS 中 ringExtinguish 是 ringDrawIn 的精确反向，
    // 线条从加载终点柔和地回缩，形成“逆旋转/回卷”感。
    // 被点击电子所在的环也参与回缩，在线条回缩到电子位置时展开经历。
    for (let i = maxIndex; i >= targetIndex; i--) {
      const delay = (maxIndex - i) * REVERSE_STEP_MS
      reverseTimeouts.push(
        setTimeout(() => {
          extinguishedRings.value.add(i)
        }, delay),
      )
    }

    const extinguishCount = Math.max(0, maxIndex - targetIndex + 1)
    const totalDuration =
      extinguishCount > 0 ? (extinguishCount - 1) * REVERSE_STEP_MS + EXTINGUISH_DURATION_MS : 0

    // 计算目标环回缩线条到达电子位置的时间：
    // SVG circle stroke 起点在 3 点钟方向，擦除前沿顺时针移动；
    // CSS rotate 角度从 12 点钟方向顺时针测量，因此相对 3 点钟的偏移为 angle - 90。
    const targetStartDelay = (maxIndex - targetIndex) * REVERSE_STEP_MS
    const relativeAngle = (((selectedAngle.value - 90) % 360) + 360) % 360
    const meetDuration =
      targetStartDelay + easeStandardProgressToTime(relativeAngle / 360) * EXTINGUISH_DURATION_MS

    let completeFired = false
    reverseTimeouts.push(
      setTimeout(() => {
        if (!completeFired && selectedId.value) {
          completeFired = true
          onComplete(selectedId.value)
        }
      }, meetDuration),
    )

    reverseTimeouts.push(
      setTimeout(() => {
        isReversing.value = false
        clearReverseTimeouts()
      }, totalDuration),
    )
  }

  function restoreRings() {
    isReversing.value = false
    clearReverseTimeouts()
    extinguishedRings.value.clear()
  }

  watch(reverseTrigger, (next, prev) => {
    if (next && next !== prev && selectedId.value && !isReversing.value) runReverseAnimation()
  })

  watch(selectedId, (next, prev) => {
    if (!next && prev) {
      restoreRings()
      return
    }
    if (next && next !== prev) {
      isReversing.value = false
      clearReverseTimeouts()
      extinguishedRings.value.clear()
    }
  })

  return {
    extinguishedRings,
    restoreRings,
  }
}
