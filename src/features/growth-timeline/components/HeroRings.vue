<script setup lang="ts">
import type { GrowthExperience } from '../timelineConstants'
import type { ElectronItem, RingItem, TooltipState } from './HeroRings.types'
import { ChevronDown } from 'lucide-vue-next'
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  toRef,
  watch,
} from 'vue'
import { useRingEffects } from '../composables/useRingEffects'
import { useSemesterRings } from '../composables/useSemesterRings'
import HeroRingsElectrons from './HeroRingsElectrons.vue'
import HeroRingsFooter from './HeroRingsFooter.vue'
import HeroRingsNucleus from './HeroRingsNucleus.vue'
import HeroRingsOrbit from './HeroRingsOrbit.vue'
import HeroRingsParticles from './HeroRingsParticles.vue'
import HeroRingsTooltip from './HeroRingsTooltip.vue'

interface Props {
  experiences: GrowthExperience[]
  selectedId?: string | null
  paused?: boolean
  reverseTrigger?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  paused: false,
  reverseTrigger: 0,
})

const emit = defineEmits<{
  select: [id: string, pos: { x: number; y: number }]
  add: []
  scrollToGrowth: []
  reverseComplete: [id: string]
}>()

const BASE_RADIUS = 52
const RING_STEP = 18

const { rings: semesterRings, findRingForExperience, semesterLabel } = useSemesterRings()

const rings = computed<RingItem[]>(() => {
  return semesterRings.value.map((ring, index) => {
    const r = BASE_RADIUS + index * RING_STEP
    return {
      r,
      color: ring.color,
      dasharray: Math.round(2 * Math.PI * r),
      delay: 0.2 + index * 0.25,
    }
  })
})

const electronAngles = ref<Record<string, number>>({})

function getSubOrbitOffsets(_count: number): number[] {
  // 同一 level 的经历严格落在同一主轨道上，不随数量增加而偏移，
  // 确保所有电子都分布在对应年轮圈的中心圆周上
  return [0]
}

function initElectronAngles() {
  const byLevel = new Map<number, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    // 学期只认后端；缺失时按事件日期推导入学年轮，仅用于小球定位
    const ring = findRingForExperience(exp)
    if (!ring) return
    if (!byLevel.has(ring.level)) {
      byLevel.set(ring.level, [])
    }
    byLevel.get(ring.level)!.push(exp)
  })
  const nextAngles: Record<string, number> = {}
  byLevel.forEach((exps) => {
    const n = exps.length
    // 每个经历独立占一个角度槽，沿同一主轨道均匀分布，避免聚集
    exps.forEach((exp, i) => {
      const angle = (i / n) * 360
      nextAngles[exp.id] = electronAngles.value[exp.id] ?? angle
    })
  })
  electronAngles.value = nextAngles
}

watch(() => props.experiences, initElectronAngles, { immediate: true, deep: true })

const electrons = computed<ElectronItem[]>(() => {
  const byLevel = new Map<number, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    const ring = findRingForExperience(exp)
    if (!ring) return
    if (!byLevel.has(ring.level)) {
      byLevel.set(ring.level, [])
    }
    byLevel.get(ring.level)!.push(exp)
  })
  const result: ElectronItem[] = []
  byLevel.forEach((exps, level) => {
    const ringIndex = Math.max(0, level - 1)
    const ringDef = rings.value[ringIndex]
    if (!ringDef) {
      return
    }
    const n = exps.length
    const offsets = getSubOrbitOffsets(n)
    const k = offsets.length
    exps.forEach((exp, i) => {
      const subOrbitIndex = i % k
      // 每个经历独立占一个角度槽，沿同一主轨道均匀分布
      const angle = (i / n) * 360
      result.push({
        id: exp.id,
        title: exp.title,
        date: exp.date.replace(/-/g, '.'),
        semester: exp.semester,
        color: ringDef.color,
        radius: ringDef.r + offsets[subOrbitIndex],
        speed: 0.04 + level * 0.01,
        angle: electronAngles.value[exp.id] ?? angle,
        level,
        subOrbitIndex,
      })
    })
  })
  return result
})

let rafId: number | null = null

function tick() {
  if (!props.paused) {
    const updated: Record<string, number> = {}
    electrons.value.forEach((electron) => {
      updated[electron.id] = (electronAngles.value[electron.id] + electron.speed) % 360
    })
    electronAngles.value = updated
  }
  rafId = requestAnimationFrame(tick)
}

const electronsVisible = ref(false)
const scrollY = ref(0)

/**
 * 滚动视差：只作用在 .hero-rings__system 这一层（环 + 小球 + 中心按钮同处一个
 * 变换矩阵），层内不再有第二套缩放，避免小球与年轮圈错位。
 * zoom 与响应式缩放 --hero-scale（渲染尺寸 / 400）相互独立，互不复用。
 */
const RING_ZOOM_MAX = 1.1
const RING_ZOOM_RATE = 0.00015
const RING_OPACITY_BASE = 0.5
const RING_OPACITY_RATE = 0.001

const reducedMotion = ref(false)
let motionQuery: MediaQueryList | null = null

function syncReducedMotion(event?: MediaQueryListEvent) {
  reducedMotion.value = event ? event.matches : (motionQuery?.matches ?? false)
}

const ringZoom = computed(() =>
  reducedMotion.value ? 1 : Math.min(1 + scrollY.value * RING_ZOOM_RATE, RING_ZOOM_MAX),
)

const ringOpacity = computed(() =>
  reducedMotion.value
    ? RING_OPACITY_BASE
    : Math.max(0, RING_OPACITY_BASE - scrollY.value * RING_OPACITY_RATE),
)

const systemParallaxStyle = computed(() => ({
  '--ring-zoom': ringZoom.value.toFixed(4),
  '--ring-parallax-opacity': ringOpacity.value.toFixed(4),
}))

const heroRingsRef = ref<HTMLElement | null>(null)

/**
 * 实际滚动发生在外层 .layout__content（overflow-y: auto），
 * window 本身不滚动、window.scrollY 恒为 0，因此需要找到真正的滚动容器。
 * 从 hero 节点向上取最近的可滚动祖先；找不到再退回 window。
 */
function resolveScrollContainer(): HTMLElement | null {
  let parent = heroRingsRef.value?.parentElement ?? null
  let firstScrollable: HTMLElement | null = null
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      // 注意：只设 overflow-x: hidden 的容器（如 .growth-timeline-page）会被浏览器
      // 把 overflow-y 提升为 auto，但内容并不在其中滚动（scrollHeight === clientHeight）。
      // 因此优先取「真正有滚动余量」的那一层（通常是 .layout__content）。
      if (parent.scrollHeight > parent.clientHeight + 1) return parent
      firstScrollable ??= parent
    }
    parent = parent.parentElement
  }
  return firstScrollable
}

let scrollTarget: HTMLElement | null = null
let scrollBound = false

function handleScroll() {
  scrollY.value = scrollTarget ? scrollTarget.scrollTop : window.scrollY
}

function bindScroll() {
  if (scrollBound) return
  scrollTarget = resolveScrollContainer()
  if (scrollTarget) {
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
  } else {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
  scrollBound = true
  handleScroll()
}

function unbindScroll() {
  if (!scrollBound) return
  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', handleScroll)
  } else {
    window.removeEventListener('scroll', handleScroll)
  }
  scrollTarget = null
  scrollBound = false
}

const tooltip = ref<TooltipState>({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  date: '',
  semester: '',
})

function updateTooltipPosition(event: MouseEvent) {
  const container = heroRingsRef.value
  if (!container) {
    return
  }
  const rect = container.getBoundingClientRect()
  tooltip.value.x = event.clientX - rect.left
  tooltip.value.y = event.clientY - rect.top + 20
}

function handleElectronEnter(event: MouseEvent, electron: ElectronItem) {
  tooltip.value = {
    visible: true,
    x: tooltip.value.x,
    y: tooltip.value.y,
    title: electron.title,
    date: electron.date,
    semester: semesterLabel(electron.semester),
  }
  updateTooltipPosition(event)
}

function handleElectronMove(event: MouseEvent) {
  if (!tooltip.value.visible) {
    return
  }
  updateTooltipPosition(event)
}

function handleElectronLeave() {
  tooltip.value.visible = false
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
  setTimeout(() => {
    electronsVisible.value = true
  }, 2000)
  bindScroll()
  // 滚动联动动效（非 CSS keyframe）单独尊重系统的「减少动效」偏好：
  // 开启后 zoom 固定为 1、透明度固定回基线，不做滚动视差。
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncReducedMotion()
  motionQuery.addEventListener('change', syncReducedMotion)
})

// keep-alive 缓存后滚动容器可能变化：激活时重新绑定并取一次当前滚动位置
onActivated(bindScroll)
onDeactivated(unbindScroll)

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  unbindScroll()
  motionQuery?.removeEventListener('change', syncReducedMotion)
  motionQuery = null
})

function handleElectronClick(event: MouseEvent, id: string) {
  const target = event.currentTarget as HTMLElement | null
  const rect = target?.getBoundingClientRect()
  const pos = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: 0, y: 0 }
  selectedElectronAngle.value = electronAngles.value[id] ?? 0
  emit('select', id, pos)
}

const selectedIdRef = computed(() => props.selectedId ?? null)
const selectedElectronAngle = ref(0)
const { extinguishedRings } = useRingEffects(
  toRef(props, 'experiences'),
  selectedIdRef,
  toRef(props, 'reverseTrigger'),
  selectedElectronAngle,
  (id) => emit('reverseComplete', id),
)
</script>

<template>
  <section id="hero" ref="heroRingsRef" class="hero-rings">
    <div class="hero-rings__halo" aria-hidden="true" />
    <HeroRingsParticles />
    <div class="hero-rings__bg" aria-hidden="true">
      <svg viewBox="0 0 400 400" width="600" height="600">
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="var(--gt-ring-mid, #8b6340)"
          stroke-width="0.5"
          opacity="0.04"
        />
        <circle
          cx="200"
          cy="200"
          r="220"
          fill="none"
          stroke="var(--gt-sage, #5a7c5a)"
          stroke-width="0.5"
          opacity="0.03"
        />
        <circle
          cx="200"
          cy="200"
          r="260"
          fill="none"
          stroke="var(--gt-gold, #c8943e)"
          stroke-width="0.5"
          opacity="0.02"
        />
      </svg>
    </div>

    <div class="hero-rings__system" :style="systemParallaxStyle">
      <HeroRingsOrbit :rings="rings" :extinguished-rings="extinguishedRings" />
      <HeroRingsNucleus @add="emit('add')" />
      <HeroRingsElectrons
        :electrons="electrons"
        :selected-id="selectedId"
        :visible="electronsVisible"
        @enter="handleElectronEnter"
        @move="handleElectronMove"
        @leave="handleElectronLeave"
        @click="handleElectronClick"
      />
    </div>

    <div class="hero-rings__content">
      <div class="hero-rings__top">
        <h1 class="hero-rings__title">
          <span class="hero-rings__title-accent">成长</span>
          <span class="hero-rings__title-sub">时间轴</span>
        </h1>
      </div>

      <div class="hero-rings__poem">
        <div class="hero-rings__poem-scroll hero-rings__poem-scroll--left" aria-hidden="true">
          <span
            v-for="(char, i) in '如同树木以年轮记录岁月'"
            :key="`l-${i}`"
            class="hero-rings__char"
            :style="{ '--char-index': i }"
            >{{ char }}</span
          >
        </div>
        <div class="hero-rings__poem-scroll hero-rings__poem-scroll--right" aria-hidden="true">
          <span
            v-for="(char, i) in '每一圈都是成长的印记'"
            :key="`r-${i}`"
            class="hero-rings__char"
            :style="{ '--char-index': i }"
            >{{ char }}</span
          >
        </div>
      </div>

      <div class="hero-rings__footer">
        <HeroRingsFooter :experiences="experiences" />
      </div>
    </div>

    <HeroRingsTooltip :tooltip="tooltip" />

    <button class="hero-rings__scroll" aria-label="向下滚动" @click="emit('scrollToGrowth')">
      <ChevronDown :size="20" />
    </button>
  </section>
</template>

<style scoped lang="scss">
.hero-rings {
  // --hero-scale 必须等于「渲染尺寸 / viewBox 尺寸(400)」，
  // 小球的圆周定位依赖它，改 --hero-svg-size 时两者要同步改。
  --hero-scale: 1.75;
  --hero-svg-size: 700px;
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  overflow: hidden;
}

.hero-rings__system {
  // 滚动视差变量由模板内联注入（--ring-zoom 与 --hero-scale 分离）：
  // 环、球、中心按钮共享同一个 transform，层内不存在第二个缩放。
  --ring-zoom: 1;
  --ring-parallax-opacity: 0.5;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(var(--ring-zoom));
  opacity: var(--ring-parallax-opacity);
  transform-origin: center;
  z-index: 1;
}

.hero-rings__bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0.6;
  z-index: 0;
}

.hero-rings__halo {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.hero-rings__halo::before,
.hero-rings__halo::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.hero-rings__halo::before {
  top: 18%;
  left: 16%;
  width: 48vh;
  height: 48vh;
  background: radial-gradient(
    circle,
    var(--gt-halo-gold, rgba(200, 148, 62, 0.28)) 0%,
    transparent 70%
  );
  opacity: 0.5;
  animation: haloBreathe 10s ease-in-out infinite alternate;
}

.hero-rings__halo::after {
  bottom: 14%;
  right: 18%;
  width: 42vh;
  height: 42vh;
  background: radial-gradient(
    circle,
    var(--gt-halo-green, rgba(90, 124, 90, 0.24)) 0%,
    transparent 70%
  );
  opacity: 0.4;
  animation: haloBreathe 12s ease-in-out infinite alternate-reverse;
}

@keyframes haloBreathe {
  from {
    transform: scale(1);
    opacity: 0.35;
  }
  to {
    transform: scale(1.12);
    opacity: 0.5;
  }
}

/* 兜底规则已移至 src/assets/styles/motion-override.scss 统一管理
   （项目内"强制启用动画"开关可一键覆盖） */

.hero-rings__content {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 5rem 3rem 4.5rem;
  pointer-events: none;
}

.hero-rings__top,
.hero-rings__poem {
  opacity: 0;
  animation: fadeSlideUp 1s $ease-emphasized forwards;
  pointer-events: auto;
}

.hero-rings__top {
  animation-delay: 0.6s;
}

.hero-rings__title {
  font-family: var(--gt-font-display);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
  user-select: none;

  &-accent {
    color: var(--gt-accent, #8b6340);
  }

  &-sub {
    color: var(--bark-dark, #2d1e12);
  }
}

.hero-rings__poem {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
  z-index: 4;
}

.hero-rings__poem-scroll {
  position: absolute;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  transform: translateY(-50%);
}

.hero-rings__poem-scroll--left {
  left: clamp(1.5rem, 5vw, 4rem);
}

.hero-rings__poem-scroll--right {
  right: clamp(1.5rem, 5vw, 4rem);
}

.hero-rings__char {
  font-family: var(--gt-font-display);
  font-size: clamp(1.1rem, 1.9vw, 1.35rem);
  font-weight: 500;
  color: var(--bark-dark, #2d1e12);
  letter-spacing: 0;
  line-height: 1;
  opacity: 0;
  transform: translateY(-18px);
  animation: charDropIn 0.55s $ease-emphasized forwards;
  animation-delay: calc(0.9s + var(--char-index, 0) * 0.08s);
}

@keyframes charDropIn {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
  to {
    opacity: 0.85;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  // 窄屏按可用宽度收紧年轮：400 × 0.9 = 360px，最外圈直径 320px，
  // 375 / 390 下都能完整成环，不再被 hero 的 overflow 裁掉左右两侧。
  .hero-rings {
    --hero-scale: 0.9;
    --hero-svg-size: 360px;
  }

  .hero-rings__poem-scroll {
    gap: 0.55rem;
  }

  .hero-rings__poem-scroll--left {
    left: 0.75rem;
  }

  .hero-rings__poem-scroll--right {
    right: 0.75rem;
  }

  .hero-rings__char {
    font-size: 0.9rem;
  }
}

@media (max-width: 340px) {
  // 320px 级超窄屏：400 × 0.75 = 300px，最外圈直径 267px，左右各留 26px 不裁切。
  // 注意与 .hero-rings 的 --hero-scale 保持同一份来源，小球定位依赖它。
  .hero-rings {
    --hero-scale: 0.75;
    --hero-svg-size: 300px;
  }
}

.hero-rings__scroll {
  position: absolute;
  bottom: 2.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--bark-light, #8b6340);
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  animation: fadeSlideUp 0.8s ease 2s forwards;
}

.hero-rings__scroll svg {
  width: 20px;
  height: 20px;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scrollBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(6px);
  }
}
</style>
