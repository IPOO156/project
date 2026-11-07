<script setup lang="ts">
import type { Ref } from 'vue'
import type { GrowthExperience } from '../timelineConstants'
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

      <div class="summary-grid" :class="{ 'is-revealed': isVisible }">
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
  font-family: var(--gt-font-ui);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  color: var(--gt-accent, #8b6340);
  margin-bottom: 0.8rem;
}

.summary-header p {
  font-family: var(--gt-font-display);
  font-size: 1.15rem;
  color: var(--text-light, #9a8474);
  margin-bottom: 3rem;
}

/* 四组数据收敛为一块统一浅底统计面板，颜色只由品牌 token 决定 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.14);
  border-radius: $radius-2xl;
  background: var(--gt-card);
  box-shadow:
    0 2px 8px rgba(var(--gt-shadow-rgb, 26 18 10), 0.05),
    0 12px 32px rgba(var(--gt-shadow-rgb, 26 18 10), 0.06);
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s $ease-emphasized,
    transform 0.7s $ease-emphasized;
}

.summary-grid.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.summary-card {
  position: relative;
  padding: 2rem 1.25rem;
  border-left: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  background: transparent;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.6s $ease-emphasized,
    transform 0.6s $ease-emphasized,
    background-color 0.3s $ease-standard;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.summary-card:first-child {
  border-left: none;
}

/* 顶部金色短线：整块面板唯一的强调色，替代原来的四块高饱和大色块 */
.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: var(--gt-accent, #d4a574);
  opacity: 0.75;
  transform: translateX(-50%);
}

.summary-card.is-revealed {
  opacity: 1;
  transform: translateY(0);
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
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.03);
}

.summary-value {
  font-family: var(--gt-font-mono);
  font-size: 2.75rem;
  font-weight: 500;
  color: var(--mc-primary, #1e3a5f);
  line-height: 1;
  margin-bottom: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.summary-label {
  font-family: var(--gt-font-ui);
  font-size: 0.8rem;
  letter-spacing: 1px;
  color: var(--text-light, #64748b);
  margin-top: auto;
}

.summary-closing {
  font-family: var(--gt-font-display);
  font-size: 1.05rem;
  color: var(--text-light, #9a8474);
  margin: 3rem auto 0;
  max-width: 520px;
  line-height: 1.9;
  letter-spacing: 1px;
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s $ease-emphasized 0.4s,
    transform 0.7s $ease-emphasized 0.4s;
}

.summary-closing.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 2×2 布局补上横向分隔线，避免只有奇数项有左边线 */
  .summary-card:nth-child(3) {
    border-left: none;
    border-top: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  }

  .summary-card:nth-child(4) {
    border-top: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  }

  [data-theme='dark'] .summary-card:nth-child(3),
  [data-theme='dark'] .summary-card:nth-child(4) {
    border-top-color: rgba(var(--gt-bark-rgb, 96 165 250), 0.16);
  }

  .summary-card {
    min-height: 130px;
    padding: 1.6rem 1rem;
  }

  .summary-value {
    font-size: 2.25rem;
  }

  .summary-closing {
    font-size: 1rem;
    margin-top: 2rem;
  }
}

/* 夜间模式：面板沿用全站蓝灰卡面，不再单独使用四套晚霞色 */
[data-theme='dark'] .summary-grid {
  border-color: rgba(var(--gt-bark-rgb, 96 165 250), 0.2);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.18),
    0 12px 32px rgba(0, 0, 0, 0.24);
}

[data-theme='dark'] .summary-card {
  border-left-color: rgba(var(--gt-bark-rgb, 96 165 250), 0.16);
}

[data-theme='dark'] .summary-card:hover {
  background: rgba(var(--gt-bark-rgb, 96 165 250), 0.06);
}

[data-theme='dark'] .summary-value {
  color: var(--el-text-color-primary, #f1f5f9);
}

[data-theme='dark'] .summary-label {
  color: var(--text-light, #94a3b8);
}

[data-theme='dark'] .summary-header p,
[data-theme='dark'] .summary-closing {
  color: var(--text-light, #a89a8a);
}
</style>
