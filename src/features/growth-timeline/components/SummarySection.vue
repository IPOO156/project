<script setup lang="ts">
import type { Ref } from 'vue'
import type { GrowthExperience } from '../constants'
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
  color: #8b6340;
  margin-bottom: 0.8rem;
}

.summary-header p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.2rem;
  color: #9a8474;
  margin-bottom: 3rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-card {
  padding: 2rem;
  border-radius: 16px;
  background: rgba(255, 252, 247, 0.6);
  border: 1px solid rgba(61, 43, 31, 0.08);
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
}

.summary-card.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.summary-card:nth-child(1).is-revealed {
  transition-delay: 0.1s;
}
.summary-card:nth-child(2).is-revealed {
  transition-delay: 0.2s;
}
.summary-card:nth-child(3).is-revealed {
  transition-delay: 0.3s;
}
.summary-card:nth-child(4).is-revealed {
  transition-delay: 0.4s;
}

.summary-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 16px 48px rgba(26, 18, 10, 0.08),
    0 0 0 1px rgba(139, 99, 64, 0.08);
}

.summary-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 600;
  color: #2d1e12;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.summary-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #9a8474;
}

.summary-closing {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  color: #9a8474;
  margin: 3rem auto 0;
  max-width: 520px;
  line-height: 1.8;
  letter-spacing: 1px;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s,
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s;
}

.summary-closing.is-revealed {
  opacity: 1;
  transform: translateY(0);
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
</style>
