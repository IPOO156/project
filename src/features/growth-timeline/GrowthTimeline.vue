<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { RefreshCw } from 'lucide-vue-next'
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
  isSyncing,
  autoSync,
  selectExperience,
  openForm,
  addExperience,
  deleteExperience,
  syncFromSources,
  setAutoSync,
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
  ElMessageBox.confirm('确定删除该成长经历吗？删除后无法恢复。', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteExperience(id)
    })
    .catch(() => {})
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
          <div class="timeline-sync">
            <button
              type="button"
              class="sync-btn"
              :disabled="isSyncing"
              @click.stop="syncFromSources"
            >
              <RefreshCw :size="14" :class="{ spinning: isSyncing }" />
              <span>{{ isSyncing ? '同步中…' : '同步其他模块经历' }}</span>
            </button>
            <label class="sync-auto">
              <input
                type="checkbox"
                :checked="autoSync"
                @change="setAutoSync(($event.target as HTMLInputElement).checked)"
              />
              <span>自动同步</span>
            </label>
          </div>
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
  min-height: calc(100vh - #{$header-height});
  width: 100%;
  margin: 0;
  background-color: var(--gt-bg-page);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  background-size: 512px 512px;
  overflow-x: hidden;
  opacity: 0;
  animation: pageFadeIn 0.8s ease forwards;
  user-select: none;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.growth-timeline-page :deep(input),
.growth-timeline-page :deep(textarea),
.growth-timeline-page :deep(.el-input__inner) {
  user-select: auto;
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
  padding: 4rem 3rem;
}

.sb-line {
  flex: 1;
  height: 1px;
  background: var(--el-border-color-light);
}

.sb-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sb-icon svg {
  width: 16px;
  height: 16px;
  fill: var(--gt-gold);
  opacity: 0.3;
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
  width: 1.5px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    transparent,
    var(--gt-ring-soft) 5%,
    var(--gt-ring-mid) 50%,
    var(--gt-ring-soft) 95%,
    transparent
  );
  opacity: 0.2;
}

.timeline-intro {
  text-align: center;
  margin-bottom: 5rem;
  opacity: 0;
  animation: fadeSlideUp 0.8s ease 0.3s forwards;
}

.timeline-intro p {
  font-size: 1.2rem;
  color: var(--gt-text-quote);
  margin: 0;
  font-weight: 400;
  letter-spacing: 1.5px;
}

.timeline-sync {
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 100px;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-mid, #6b5443);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.sync-btn:hover:not(:disabled) {
  background: #fff;
  border-color: var(--ring-color, var(--bark-light, #8b6340));
  color: var(--ring-color, var(--bark-light, #8b6340));
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sync-auto {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 1px;
  color: var(--text-light, #9a8474);
  cursor: pointer;
}

.sync-auto input {
  accent-color: var(--gt-accent, #8b6340);
  cursor: pointer;
}

/* 夜间模式下的同步按钮与自动同步标签 */
[data-theme='dark'] .sync-btn {
  background: rgba(var(--gt-card-rgb, 30 28 26), 0.85);
  border-color: rgba(var(--gt-bark-rgb, 200 180 160), 0.2);
  color: var(--text-mid, #d4c4b0);
}

[data-theme='dark'] .sync-btn:hover:not(:disabled) {
  background: rgba(var(--gt-card-rgb, 30 28 26), 0.95);
  border-color: var(--gt-accent, #d4a574);
  color: var(--gt-accent, #d4a574);
}

[data-theme='dark'] .sync-auto {
  color: var(--text-light, #a89a8a);
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

@media (prefers-reduced-motion: reduce) {
  .timeline-intro {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
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
