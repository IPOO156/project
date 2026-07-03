<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import ExperienceDetail from './components/ExperienceDetail.vue'
import ExperienceForm from './components/ExperienceForm.vue'
import GrowthFooter from './components/GrowthFooter.vue'
import GrowthQuote from './components/GrowthQuote.vue'
import HeroRings from './components/HeroRings.vue'
import ProgressDots from './components/ProgressDots.vue'
import SummarySection from './components/SummarySection.vue'
import TimelineNode from './components/TimelineNode.vue'
import { useGrowthTimeline } from './composables/useGrowthTimeline'
import { findRingBySemester } from './timeline-constants'

const {
  experiences,
  selectedExperience,
  selectedId,
  formVisible,
  selectExperience,
  openForm,
  addExperience,
  deleteExperience,
} = useGrowthTimeline()

const BASE_RADIUS = 52
const RING_STEP = 18
const HERO_SCALE = 1.75

const orbitPaused = ref(false)
let expandTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (expandTimer) {
    clearTimeout(expandTimer)
    expandTimer = null
  }
})
const expandOrigin = ref<{ x: number; y: number } | null>(null)
const showDetail = ref(false)
const reverseTrigger = ref(0)
const selectedElectronPos = ref<{ x: number; y: number } | null>(null)
const pendingDeleteId = ref<string | null>(null)

function getHeroScale() {
  return window.innerWidth <= 768 ? 1.05 : HERO_SCALE
}

function getSystemCenter() {
  const hero = document.getElementById('hero')
  if (!hero) {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }
  const rect = hero.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function handleElectronSelect(id: string, pos: { x: number; y: number }) {
  selectExperience(id)
  selectedElectronPos.value = pos
  orbitPaused.value = true
  reverseTrigger.value++

  // 清理可能存在的旧定时器
  if (expandTimer) {
    clearTimeout(expandTimer)
    expandTimer = null
  }
}

function handleReverseComplete(_id: string) {
  // 目标轨道回缩线条到达电子位置时展开详情
  if (!showDetail.value && selectedElectronPos.value) {
    expandOrigin.value = { x: selectedElectronPos.value.x, y: selectedElectronPos.value.y }
    showDetail.value = true
    orbitPaused.value = true
  }
}

function handleNodeClick(id: string) {
  selectExperience(id)
  const exp = experiences.value.find((e) => e.id === id)
  if (!exp) return
  const ring = findRingBySemester(exp.semester)
  const index = Math.max(0, (ring?.level ?? 1) - 1)
  const radius = (BASE_RADIUS + index * RING_STEP) * getHeroScale()
  const center = getSystemCenter()
  expandOrigin.value = { x: center.x, y: center.y - radius }
  showDetail.value = true
}

function handleCloseDetail() {
  showDetail.value = false
}

function handleDeleteExperience(id: string) {
  if (showDetail.value && selectedId.value === id) {
    pendingDeleteId.value = id
    handleCloseDetail()
    return
  }
  deleteExperience(id)
}

function handleDetailClosed() {
  if (expandTimer) {
    clearTimeout(expandTimer)
    expandTimer = null
  }
  if (pendingDeleteId.value) {
    deleteExperience(pendingDeleteId.value)
    pendingDeleteId.value = null
  }
  selectExperience(null)
  orbitPaused.value = false
  expandOrigin.value = null
  selectedElectronPos.value = null
}

function scrollToSection(section: 'hero' | 'growth' | 'summary') {
  const el = document.getElementById(section)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth' })
}

function handleScrollToGrowth() {
  scrollToSection('growth')
}
</script>

<template>
  <div class="growth-timeline-page">
    <ProgressDots :experiences="experiences" />

    <HeroRings
      :experiences="experiences"
      :selected-id="selectedId"
      :paused="orbitPaused"
      :reverse-trigger="reverseTrigger"
      @select="handleElectronSelect"
      @reverse-complete="handleReverseComplete"
      @add="openForm"
      @scroll-to-growth="handleScrollToGrowth"
    />

    <section id="growth" class="timeline-section">
      <div class="section-break">
        <div class="sb-line" />
        <div class="sb-icon">
          <svg viewBox="0 0 24 24">
            <path
              d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.61 2,11.61C5.5,8.5 10.5,7 17,8Z"
            />
          </svg>
        </div>
        <div class="sb-line" />
      </div>

      <div class="timeline-wrap">
        <div class="vine-spine" />

        <div class="timeline-intro">
          <p>每一圈年轮，都有一段故事</p>
        </div>

        <TimelineNode
          v-for="(exp, index) in experiences"
          :key="exp.id"
          :experience="exp"
          :index="index"
          :is-odd="index % 2 === 0"
          :is-selected="selectedId === exp.id"
          @click="handleNodeClick"
          @delete="handleDeleteExperience"
        />
      </div>
    </section>

    <GrowthQuote />
    <SummarySection :experiences="experiences" />
    <GrowthFooter />

    <ExperienceForm v-model:visible="formVisible" @submit="addExperience" />
    <ExperienceDetail
      v-if="selectedExperience"
      :visible="showDetail"
      :experience="selectedExperience"
      :expand-origin="expandOrigin"
      @close="handleCloseDetail"
      @closed="handleDetailClosed"
      @delete="handleDeleteExperience"
    />
  </div>
</template>

<style scoped lang="scss">
.growth-timeline-page {
  position: relative;
  min-height: 100vh;
  background-color: #f4efe6;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  background-size: 512px 512px;
  overflow-x: hidden;
  border-radius: $radius-lg;
}

.timeline-section {
  position: relative;
  z-index: 2;
  padding: 2rem 2rem 5rem;
}

.section-break {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  padding: 5rem 3rem;
}

.sb-line {
  flex: 1;
  height: 1px;
  background: rgba(61, 43, 31, 0.08);
}

.sb-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sb-icon svg {
  width: 18px;
  height: 18px;
  fill: #5a7c5a;
  opacity: 0.4;
}

.timeline-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 2rem 8rem;
  position: relative;
}

.vine-spine {
  position: absolute;
  left: 50%;
  top: 120px;
  bottom: 80px;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    transparent,
    #a88560 5%,
    #8b6340 50%,
    #a88560 95%,
    transparent
  );
  opacity: 0.15;
}

.timeline-intro {
  text-align: center;
  margin-bottom: 6rem;
  opacity: 0;
  animation: fadeSlideUp 0.8s ease 0.3s forwards;
}

.timeline-intro p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem;
  color: #8b6340;
  margin: 0;
  letter-spacing: 2px;
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

@media (max-width: 768px) {
  .timeline-section {
    padding: 1rem 1rem 3rem;
  }

  .section-break {
    padding: 3rem 1.5rem;
  }

  .timeline-wrap {
    padding: 0 1rem 5rem;
  }

  .vine-spine {
    left: 25px;
  }

  .timeline-intro {
    margin-bottom: 4rem;
  }

  .timeline-intro p {
    font-size: 1.1rem;
    letter-spacing: 1px;
  }
}
</style>
