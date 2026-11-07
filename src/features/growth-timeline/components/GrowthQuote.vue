<script setup lang="ts">
import { ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'

const quoteRef = ref<HTMLElement | null>(null)
const { isVisible } = useScrollReveal(quoteRef, {
  threshold: 0.3,
  rootMargin: '0px 0px -60px 0px',
  once: true,
})
</script>

<template>
  <section ref="quoteRef" class="growth-quote" :class="{ 'is-visible': isVisible }">
    <blockquote class="quote-block">
      <p class="quote-text">“时间不是流逝，而是生长；每一圈年轮，都是未来的伏笔。”</p>
      <cite class="quote-attribution">— 致一路向前的自己</cite>
    </blockquote>
  </section>
</template>

<style scoped lang="scss">
.growth-quote {
  position: relative;
  z-index: 2;
  padding: 5rem 2rem;
  text-align: center;
}

.quote-block {
  /* 引文是一整句，容器放宽到接近内容区宽度，避免末字被挤到第二行 */
  max-width: 1000px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 1s $ease-emphasized,
    transform 1s $ease-emphasized;
}

.growth-quote.is-visible .quote-block {
  opacity: 1;
  transform: translateY(0);
}

.quote-text {
  font-family: var(--gt-font-display);
  /* 桌面端随视口轻微缩放，保证整句保持一排 */
  font-size: clamp(1.15rem, 1.45vw, 1.5rem);
  font-weight: 500;
  color: var(--gt-text-quote, #5a4a3a);
  line-height: 1.8;
  margin: 0 0 1.2rem;
  letter-spacing: 1px;
}

.quote-attribution {
  font-family: var(--gt-font-ui);
  font-size: 0.78rem;
  letter-spacing: 1px;
  color: var(--text-light, #9a8474);
  font-style: normal;
}

@media (max-width: 768px) {
  .growth-quote {
    padding: 3.5rem 1.5rem;
  }

  .quote-text {
    font-size: 1.25rem;
  }
}
</style>
