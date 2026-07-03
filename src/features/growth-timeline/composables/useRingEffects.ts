import type { Ref } from 'vue'
import type { GrowthExperience } from '../constants'
import { computed, ref, watch } from 'vue'
import { findRingBySemester, SEMESTER_RINGS } from '../constants'

export function useRingEffects(
  experiences: Ref<GrowthExperience[]>,
  selectedId: Ref<string | null>,
  reverseTrigger: Ref<number>,
  selectedAngle: Ref<number>,
  onComplete: (id: string) => void,
) {
  const ringCount = computed(() => SEMESTER_RINGS.length)
  const extinguishedRings = ref<Set<number>>(new Set())
  const isReversing = ref(false)
  let reverseTimeouts: ReturnType<typeof setTimeout>[] = []

  // 与 HeroRings.vue 中 ringExtinguish 动画保持一致（2s）：
  // 与正向加载 ringDrawIn 的层间间隔 0.25s 对齐，
  // 外层先熄，按顺序依次启动，多圈可以同时回缩，形成加载的精确镜像。
  const REVERSE_STEP_MS = 250
  const EXTINGUISH_DURATION_MS = 2000

  function getSelectedRingIndex() {
    if (!selectedId.value) return -1
    const exp = experiences.value.find((e) => e.id === selectedId.value)
    if (!exp) return -1
    const ring = findRingBySemester(exp.semester)
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
    const meetDuration = targetStartDelay + (relativeAngle / 360) * EXTINGUISH_DURATION_MS

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
