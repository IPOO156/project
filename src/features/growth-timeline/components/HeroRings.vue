<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import type { ElectronItem, RingItem, TooltipState } from './HeroRings.types'
import { ChevronDown } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { useRingEffects } from '../composables/useRingEffects'
import { findRingBySemester, getSemesterDisplayLabel, SEMESTER_RINGS } from '../timeline-constants'
import HeroRingsElectrons from './HeroRingsElectrons.vue'
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

const rings = computed<RingItem[]>(() => {
  return SEMESTER_RINGS.map((ring, index) => {
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

function initElectronAngles() {
  const byLevel = new Map<number, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    const ring = findRingBySemester(exp.semester)
    const level = ring?.level ?? 1
    if (!byLevel.has(level)) {
      byLevel.set(level, [])
    }
    byLevel.get(level)!.push(exp)
  })
  const nextAngles: Record<string, number> = {}
  byLevel.forEach((exps) => {
    exps.forEach((exp, i) => {
      const baseAngle = (i / Math.max(exps.length, 1)) * 360
      nextAngles[exp.id] = electronAngles.value[exp.id] ?? baseAngle
    })
  })
  electronAngles.value = nextAngles
}

watch(() => props.experiences, initElectronAngles, { immediate: true, deep: true })

const electrons = computed<ElectronItem[]>(() => {
  const byLevel = new Map<number, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    const ring = findRingBySemester(exp.semester)
    const level = ring?.level ?? 1
    if (!byLevel.has(level)) {
      byLevel.set(level, [])
    }
    byLevel.get(level)!.push(exp)
  })
  const result: ElectronItem[] = []
  byLevel.forEach((exps, level) => {
    const ringIndex = Math.max(0, level - 1)
    const ringDef = rings.value[ringIndex]
    if (!ringDef) {
      return
    }
    exps.forEach((exp) => {
      result.push({
        id: exp.id,
        title: exp.title,
        date: exp.date.replace(/-/g, '.'),
        semester: exp.semester,
        color: ringDef.color,
        radius: ringDef.r,
        speed: 0.04 + level * 0.01,
        angle: electronAngles.value[exp.id] ?? 0,
        level,
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

function handleScroll() {
  scrollY.value = window.scrollY
}

const heroRingsRef = ref<HTMLElement | null>(null)

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
    semester: getSemesterDisplayLabel(electron.semester),
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
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  window.removeEventListener('scroll', handleScroll)
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
          stroke="#8b6340"
          stroke-width="0.5"
          opacity="0.04"
        />
        <circle
          cx="200"
          cy="200"
          r="220"
          fill="none"
          stroke="#5a7c5a"
          stroke-width="0.5"
          opacity="0.03"
        />
        <circle
          cx="200"
          cy="200"
          r="260"
          fill="none"
          stroke="#c8943e"
          stroke-width="0.5"
          opacity="0.02"
        />
      </svg>
    </div>

    <div class="hero-rings__system">
      <HeroRingsOrbit :rings="rings" :extinguished-rings="extinguishedRings" :scroll-y="scrollY" />
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
      <h1 class="hero-rings__title">年轮<em>生长记</em></h1>
      <p class="hero-rings__desc">
        如同树木以年轮记录岁月，每一圈都是成长的印记，记录着阳光与风雨。
      </p>
      <div class="hero-rings__data-row">
        <div class="hero-rings__data-item">
          <div class="hero-rings__data-value">{{ experiences.length }}</div>
          <div class="hero-rings__data-unit">Experiences</div>
        </div>
        <div class="hero-rings__data-item">
          <div class="hero-rings__data-value">{{ SEMESTER_RINGS.length }}</div>
          <div class="hero-rings__data-unit">Rings</div>
        </div>
        <div class="hero-rings__data-item">
          <div class="hero-rings__data-value">
            {{ experiences.reduce((sum, e) => sum + e.skills.length, 0) }}
          </div>
          <div class="hero-rings__data-unit">Skills</div>
        </div>
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
  --hero-scale: 1.75;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  overflow: hidden;
}

.hero-rings__system {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: radial-gradient(circle, rgba(200, 148, 62, 0.28) 0%, rgba(200, 148, 62, 0) 70%);
  opacity: 0.5;
  animation: haloBreathe 10s ease-in-out infinite alternate;
}

.hero-rings__halo::after {
  bottom: 14%;
  right: 18%;
  width: 42vh;
  height: 42vh;
  background: radial-gradient(circle, rgba(90, 124, 90, 0.24) 0%, rgba(90, 124, 90, 0) 70%);
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

.hero-rings__content {
  position: relative;
  z-index: 10;
  pointer-events: none;
}

.hero-rings__title,
.hero-rings__desc,
.hero-rings__data-row {
  opacity: 0;
  animation: fadeSlideUp 0.8s ease forwards;
  pointer-events: auto;
}

.hero-rings__title {
  animation-delay: 0.6s;
}

.hero-rings__title em {
  font-style: italic;
  color: var(--bark-mid, #5c3d28);
  display: block;
}

.hero-rings__desc {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-weight: 300;
  color: var(--text-mid, #6b5443);
  max-width: 420px;
  line-height: 2;
  margin: 1.8rem auto 0;
  animation-delay: 0.9s;
}

.hero-rings__data-row {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 3rem;
  animation-delay: 1.2s;
}

.hero-rings__data-item {
  text-align: center;
}

.hero-rings__data-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--bark-dark, #2d1e12);
  line-height: 1;
}

.hero-rings__data-unit {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-light, #9a8474);
  margin-top: 0.3rem;
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
