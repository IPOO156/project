<script setup lang="ts">
import type { GrowthExperience } from '../constants'
import { ChevronDown, Plus } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { useRingEffects } from '../composables/useRingEffects'
import { findRingBySemester, getSemesterDisplayLabel, SEMESTER_RINGS } from '../constants'

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
  (e: 'select', id: string, pos: { x: number; y: number }): void
  (e: 'add'): void
  (e: 'scrollToGrowth'): void
  (e: 'reverseComplete', id: string): void
}>()

const CENTER = 200
const BASE_RADIUS = 52
const RING_STEP = 18

interface RingItem {
  r: number
  color: string
  dasharray: number
  delay: number
}

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

interface ElectronItem {
  id: string
  title: string
  date: string
  semester: string
  color: string
  radius: number
  speed: number
  angle: number
  level: number
}

const electronAngles = ref<Record<string, number>>({})

function initElectronAngles() {
  const byLevel = new Map<number, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    const ring = findRingBySemester(exp.semester)
    const level = ring?.level ?? 1
    if (!byLevel.has(level)) byLevel.set(level, [])
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
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level)!.push(exp)
  })
  const result: ElectronItem[] = []
  byLevel.forEach((exps, level) => {
    const ringIndex = Math.max(0, level - 1)
    const ringDef = rings.value[ringIndex]
    if (!ringDef) return
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

function parallaxScale(index: number) {
  return Math.min(1 + scrollY.value * 0.0004 * (index + 1), 1.3).toFixed(3)
}

function parallaxOpacity() {
  return Math.max(0, 0.5 - scrollY.value * 0.001).toFixed(3)
}

const heroRingsRef = ref<HTMLElement | null>(null)

interface TooltipState {
  visible: boolean
  x: number
  y: number
  title: string
  date: string
  semester: string
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
  if (!container) return
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
  if (!tooltip.value.visible) return
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
  if (rafId) cancelAnimationFrame(rafId)
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
    <div class="hero-rings__particles" aria-hidden="true">
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
      <span class="hero-rings__particle" />
    </div>
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

    <div class="hero-rings__system" :class="{ 'is-paused': paused }">
      <svg class="hero-rings__svg" :viewBox="`0 0 ${CENTER * 2} ${CENTER * 2}`">
        <g
          v-for="(ring, index) in rings"
          :key="ring.r"
          class="hero-rings__ring-wrap"
          :style="{
            transform: `scale(${parallaxScale(index)})`,
            opacity: parallaxOpacity(),
          }"
        >
          <circle
            class="hero-rings__ring"
            :class="{ 'is-extinguished': extinguishedRings.has(index) }"
            :cx="CENTER"
            :cy="CENTER"
            :r="ring.r"
            fill="none"
            :stroke="ring.color"
            stroke-width="1"
            stroke-linecap="round"
            :stroke-dasharray="`${ring.dasharray} ${ring.dasharray}`"
            :stroke-dashoffset="ring.dasharray"
            :style="{
              '--ring-dasharray': `${ring.dasharray}px`,
              'animation-delay': `${ring.delay}s`,
            }"
          />
        </g>
      </svg>

      <div class="hero-rings__nucleus" @click="emit('add')">
        <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--1" />
        <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--2" />
        <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--3" />
        <button class="hero-rings__nucleus-core" aria-label="添加经历" @click.stop="emit('add')">
          <Plus :size="20" />
        </button>
      </div>

      <div
        v-for="electron in electrons"
        :key="electron.id"
        class="hero-rings__electron-orbit"
        :class="{
          'is-selected': props.selectedId === electron.id,
          'is-visible': electronsVisible,
        }"
        :style="{
          '--orbit-radius': `${electron.radius}px`,
          '--electron-angle': `${electron.angle}deg`,
          '--electron-level': electron.level,
        }"
      >
        <button
          class="hero-rings__electron"
          :style="{ '--electron-color': electron.color }"
          @click.stop="handleElectronClick($event, electron.id)"
          @mouseenter="handleElectronEnter($event, electron)"
          @mousemove="handleElectronMove($event)"
          @mouseleave="handleElectronLeave"
        >
          <span class="hero-rings__electron-visual" aria-hidden="true" />
        </button>
      </div>
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

    <div
      class="hero-rings__tooltip"
      :class="{ 'is-visible': tooltip.visible }"
      :style="{
        '--tooltip-x': `${tooltip.x}px`,
        '--tooltip-y': `${tooltip.y}px`,
      }"
    >
      <div class="hero-rings__tooltip-title">{{ tooltip.title }}</div>
      <div class="hero-rings__tooltip-meta">
        <span class="hero-rings__tooltip-date">{{ tooltip.date }}</span>
        <span class="hero-rings__tooltip-divider" aria-hidden="true">·</span>
        <span class="hero-rings__tooltip-semester">{{ tooltip.semester }}</span>
      </div>
    </div>

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
.hero-rings__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}
.hero-rings__particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(200, 148, 62, 0.55);
  box-shadow: 0 0 8px 1px rgba(200, 148, 62, 0.4);
  opacity: 0;
  animation: particleFloat 7s ease-in-out infinite;
}
@keyframes particleFloat {
  0%,
  100% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5);
  }
  20% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.35;
    transform: translate(var(--drift-x, 18px), var(--drift-y, -35px)) scale(1);
  }
  80% {
    opacity: 0.15;
  }
}
.hero-rings__particle:nth-child(1) {
  top: 24%;
  left: 20%;
  --drift-x: 20px;
  --drift-y: -40px;
  animation-duration: 8s;
  animation-delay: 0s;
}
.hero-rings__particle:nth-child(2) {
  top: 36%;
  left: 14%;
  --drift-x: 30px;
  --drift-y: -20px;
  animation-duration: 9s;
  animation-delay: 1.2s;
  background: rgba(139, 99, 64, 0.5);
  box-shadow: 0 0 8px 1px rgba(139, 99, 64, 0.35);
}
.hero-rings__particle:nth-child(3) {
  top: 18%;
  left: 76%;
  --drift-x: -18px;
  --drift-y: -50px;
  animation-duration: 10s;
  animation-delay: 0.6s;
}
.hero-rings__particle:nth-child(4) {
  top: 44%;
  left: 84%;
  --drift-x: -24px;
  --drift-y: -30px;
  animation-duration: 8.5s;
  animation-delay: 2.1s;
  background: rgba(124, 154, 110, 0.5);
  box-shadow: 0 0 8px 1px rgba(124, 154, 110, 0.35);
}
.hero-rings__particle:nth-child(5) {
  top: 62%;
  left: 24%;
  --drift-x: 16px;
  --drift-y: -44px;
  animation-duration: 7.5s;
  animation-delay: 3s;
}
.hero-rings__particle:nth-child(6) {
  top: 70%;
  left: 72%;
  --drift-x: -20px;
  --drift-y: -36px;
  animation-duration: 9.5s;
  animation-delay: 1.8s;
  background: rgba(139, 99, 64, 0.5);
  box-shadow: 0 0 8px 1px rgba(139, 99, 64, 0.35);
}
.hero-rings__particle:nth-child(7) {
  top: 28%;
  left: 62%;
  --drift-x: 14px;
  --drift-y: -60px;
  animation-duration: 8s;
  animation-delay: 4.2s;
  background: rgba(124, 154, 110, 0.5);
  box-shadow: 0 0 8px 1px rgba(124, 154, 110, 0.35);
}
.hero-rings__particle:nth-child(8) {
  top: 52%;
  left: 10%;
  --drift-x: 34px;
  --drift-y: -26px;
  animation-duration: 10s;
  animation-delay: 2.7s;
}
.hero-rings__particle:nth-child(9) {
  top: 76%;
  left: 68%;
  --drift-x: 10px;
  --drift-y: -28px;
  animation-duration: 7s;
  animation-delay: 3.6s;
  background: rgba(124, 154, 110, 0.5);
  box-shadow: 0 0 8px 1px rgba(124, 154, 110, 0.35);
}
.hero-rings__particle:nth-child(10) {
  top: 14%;
  left: 42%;
  --drift-x: 26px;
  --drift-y: -34px;
  animation-duration: 9s;
  animation-delay: 0.9s;
}
.hero-rings__particle:nth-child(11) {
  top: 84%;
  left: 44%;
  --drift-x: -16px;
  --drift-y: -48px;
  animation-duration: 8.5s;
  animation-delay: 4.8s;
  background: rgba(139, 99, 64, 0.5);
  box-shadow: 0 0 8px 1px rgba(139, 99, 64, 0.35);
}
.hero-rings__particle:nth-child(12) {
  top: 48%;
  left: 48%;
  --drift-x: 6px;
  --drift-y: -24px;
  animation-duration: 6.5s;
  animation-delay: 2.4s;
}
.hero-rings__svg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 700px;
  height: 700px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.hero-rings__ring-wrap {
  transform-origin: center;
  transform-box: fill-box;
}
.hero-rings__ring {
  transform-origin: center;
  opacity: 0;
  animation: ringDrawIn 2s ease forwards;
}
.hero-rings__ring.is-extinguished {
  animation: ringExtinguish 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 0s !important;
}
@keyframes ringDrawIn {
  from {
    stroke-dashoffset: var(--ring-dasharray);
    opacity: 0;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
@keyframes ringExtinguish {
  0% {
    stroke-dashoffset: 0;
    stroke-width: 2.5;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: calc(var(--ring-dasharray) * -1);
    stroke-width: 0;
    opacity: 0;
  }
}
.hero-rings__nucleus {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 5;
}
.hero-rings__nucleus-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--bark-light, #8b6340);
  opacity: 0.4;
  animation: nucleusBreath 4s ease-in-out infinite;
}
.hero-rings__nucleus-ring--2 {
  inset: 8px;
  opacity: 0.25;
  animation-delay: 1s;
}
.hero-rings__nucleus-ring--3 {
  inset: 16px;
  opacity: 0.15;
  animation-delay: 2s;
}
@keyframes nucleusBreath {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.2;
  }
}
.hero-rings__nucleus-core {
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(
    circle at 30% 30%,
    var(--bark-soft, #a88560),
    var(--bark-mid, #5c3d28)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-parchment, #f4efe6);
  box-shadow: 0 4px 20px rgba(92, 61, 40, 0.25);
  transition: transform 0.3s ease;
  cursor: pointer;
}
.hero-rings__nucleus:hover .hero-rings__nucleus-core,
.hero-rings__nucleus-core:hover {
  transform: scale(1.1);
}
.hero-rings__electron-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotate(var(--electron-angle, 0deg));
  pointer-events: none;
  z-index: 4;
}
.hero-rings__electron {
  --electron-y: calc(var(--orbit-radius, 100px) * var(--hero-scale) * -1);
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  pointer-events: auto;
  background: transparent;
  opacity: 0;
  transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(0);
}
.hero-rings__electron-orbit.is-visible .hero-rings__electron {
  animation: electronPopIn 0.55s cubic-bezier(0.16, 1.6, 0.3, 1) forwards;
  animation-delay: calc((var(--electron-level, 1) - 1) * 0.12s);
}
@keyframes electronPopIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(1);
  }
}
.hero-rings__electron::after {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: transparent;
}
.hero-rings__electron-visual {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 22% 16%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0) 28%),
    radial-gradient(ellipse at 28% 24%, rgba(255, 252, 247, 0.78) 0%, rgba(255, 252, 247, 0) 46%),
    radial-gradient(
      circle at 34% 34%,
      #fff8e8 0%,
      var(--electron-color, #c8943e) 45%,
      #7a5235 80%,
      #3d2416 100%
    );
  box-shadow:
    inset -5px -5px 12px rgba(0, 0, 0, 0.42),
    inset 4px 4px 10px rgba(255, 252, 247, 0.68),
    inset 0 0 8px rgba(0, 0, 0, 0.14),
    0 0 0 1.5px rgba(255, 252, 247, 0.5),
    0 0 0 3px rgba(255, 252, 247, 0.22),
    0 6px 14px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s ease;
  will-change: transform, box-shadow;
}
.hero-rings__electron-visual::before {
  content: '';
  position: absolute;
  top: 12%;
  left: 16%;
  width: 34%;
  height: 26%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  filter: blur(0.4px);
  transform: rotate(-40deg);
  pointer-events: none;
}
.hero-rings__electron:hover .hero-rings__electron-visual,
.hero-rings__electron-orbit.is-selected .hero-rings__electron-visual {
  transform: scale(1.45);
  box-shadow:
    inset -5px -5px 14px rgba(0, 0, 0, 0.34),
    inset 4px 4px 12px rgba(255, 252, 247, 0.72),
    inset 0 0 10px rgba(0, 0, 0, 0.12),
    0 0 0 2px rgba(255, 252, 247, 0.65),
    0 0 0 5px rgba(255, 252, 247, 0.25),
    0 8px 20px rgba(0, 0, 0, 0.2);
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
.hero-rings__tooltip {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate3d(calc(var(--tooltip-x, 0)), calc(var(--tooltip-y, 0)), 0) translateX(-50%);
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  background: rgba(45, 30, 18, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(255, 252, 247, 0.1) inset;
  color: var(--bg-parchment, #f4efe6);
  max-width: 220px;
  text-align: left;
}
.hero-rings__tooltip::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(45, 30, 18, 0.92);
  pointer-events: none;
}
.hero-rings__tooltip.is-visible {
  opacity: 1;
  visibility: visible;
}
.hero-rings__tooltip-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff8e8;
  line-height: 1.35;
  margin-bottom: 0.2rem;
}
.hero-rings__tooltip-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: rgba(244, 239, 230, 0.72);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.3px;
}
.hero-rings__tooltip-divider {
  opacity: 0.5;
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
