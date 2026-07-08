<script setup lang="ts">
import type { Ref } from 'vue'
import type { GrowthExperience } from '../timeline-constants'
import { computed, ref, watch } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'

interface Props {
  experiences: GrowthExperience[]
}

const props = defineProps<Props>()

const sectionRef = ref<HTMLElement | null>(null)
const { isVisible } = useScrollReveal(sectionRef, {
  threshold: 0.3,
  once: true,
})

const totalSkills = computed(() => props.experiences.reduce((sum, e) => sum + e.skills.length, 0))
const avgGrowth = computed(() => {
  return props.experiences.length
    ? Math.round(
        props.experiences.reduce((sum, e) => sum + e.skills.reduce((s, k) => s + k.growth, 0), 0) /
          Math.max(totalSkills.value, 1),
      )
    : 0
})

const displayExperiences = ref(0)
const displayTotalSkills = ref(0)
const displayAvgGrowth = ref(0)

function animateValue(targetRef: Ref<number>, target: number, duration = 1200) {
  const startTime = performance.now()
  const startValue = targetRef.value
  const diff = target - startValue

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - (1 - progress) ** 3
    targetRef.value = Math.round(startValue + diff * ease)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

watch(isVisible, (visible) => {
  if (!visible) return
  animateValue(displayExperiences, props.experiences.length)
  animateValue(displayTotalSkills, totalSkills.value)
  animateValue(displayAvgGrowth, avgGrowth.value)
})

watch(
  () => props.experiences.length,
  (newVal) => {
    if (isVisible.value) animateValue(displayExperiences, newVal)
  },
)

watch(totalSkills, (newVal) => {
  if (isVisible.value) animateValue(displayTotalSkills, newVal)
})

watch(avgGrowth, (newVal) => {
  if (isVisible.value) animateValue(displayAvgGrowth, newVal)
})
</script>

<template>
  <section id="summary" ref="sectionRef" class="summary-section">
    <div class="summary-inner">
      <div class="summary-header">
        <h2>成长总结</h2>
        <p>每一次经历，都是年轮上的一道光。</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card" :class="{ 'is-revealed': isVisible }">
          <div class="summary-value">{{ displayExperiences }}</div>
          <div class="summary-label">经历</div>
        </div>
        <div class="summary-card" :class="{ 'is-revealed': isVisible }">
          <div class="summary-value">{{ displayTotalSkills }}</div>
          <div class="summary-label">技能</div>
        </div>
        <div class="summary-card" :class="{ 'is-revealed': isVisible }">
          <div class="summary-value">{{ displayAvgGrowth }}%</div>
          <div class="summary-label">平均成长</div>
        </div>
        <div class="summary-card" :class="{ 'is-revealed': isVisible }">
          <div class="summary-value">∞</div>
          <div class="summary-label">潜力</div>
        </div>
      </div>

      <p class="summary-closing" :class="{ 'is-revealed': isVisible }">
        年轮会记住每一次努力，下一段故事，由你续写。
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.summary-section {
  position: relative;
  z-index: 2;
  padding: 6rem 2rem;
}

.summary-inner {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
}

.summary-header h2 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 8px;
  text-transform: uppercase;
  color: var(--gt-accent, #8b6340);
  margin-bottom: 0.8rem;
}

.summary-header p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.2rem;
  color: var(--text-light, #9a8474);
  margin-bottom: 3rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-card {
  padding: 2.25rem 1.5rem;
  border-radius: 16px;
  background: var(--gt-card-bg);
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.22);
  box-shadow:
    0 2px 8px rgba(var(--gt-shadow-rgb, 26 18 10), 0.06),
    0 12px 32px rgba(var(--gt-shadow-rgb, 26 18 10), 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  opacity: 0;
  transform: translateY(40px) scale(0.96);
  filter: blur(4px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

/* 四张卡片分别配色 */
.summary-card:nth-child(1) {
  --gt-card-bg: #6b8fa3;
}

.summary-card:nth-child(2) {
  --gt-card-bg: #7a9e6b;
}

.summary-card:nth-child(3) {
  --gt-card-bg: #b8945c;
}

.summary-card:nth-child(4) {
  --gt-card-bg: #8b6b9e;
}

.summary-card.is-revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.summary-card:nth-child(1).is-revealed {
  transition-delay: 0.1s;
}
.summary-card:nth-child(2).is-revealed {
  transition-delay: 0.22s;
}
.summary-card:nth-child(3).is-revealed {
  transition-delay: 0.34s;
}
.summary-card:nth-child(4).is-revealed {
  transition-delay: 0.46s;
}

.summary-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 8px 24px rgba(var(--gt-shadow-rgb, 26 18 10), 0.08),
    0 24px 56px rgba(var(--gt-shadow-rgb, 26 18 10), 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.summary-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  margin-bottom: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.summary-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.92);
  margin-top: auto;
}

.summary-closing {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  color: var(--text-light, #9a8474);
  margin: 3rem auto 0;
  max-width: 520px;
  line-height: 1.8;
  letter-spacing: 1px;
  opacity: 0;
  transform: translateY(24px);
  filter: blur(3px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.55s,
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.55s,
    filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.55s;
}

.summary-closing.is-revealed {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-closing {
    font-size: 1rem;
    margin-top: 2rem;
  }
}

/* 夜间模式适配：增强卡片与背景的区分度 */
html.dark .summary-card:nth-child(1) {
  background: #4a6270;
}

html.dark .summary-card:nth-child(2) {
  background: #546b48;
}

html.dark .summary-card:nth-child(3) {
  background: #7a643e;
}

html.dark .summary-card:nth-child(4) {
  background: #5e4870;
}

html.dark .summary-card {
  border-color: rgba(var(--gt-bark-rgb, 200 180 160), 0.28);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.18),
    0 12px 32px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

html.dark .summary-card:hover {
  border-color: rgba(var(--gt-bark-rgb, 200 180 160), 0.36);
}

html.dark .summary-value {
  color: #fff;
}

html.dark .summary-label {
  color: rgba(255, 255, 255, 0.9);
}

html.dark .summary-header p,
html.dark .summary-closing {
  color: var(--text-light, #a89a8a);
}
</style>
