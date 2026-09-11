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
  max-width: 680px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.growth-quote.is-visible .quote-block {
  opacity: 1;
  transform: translateY(0);
}

.quote-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem;
  color: var(--gt-text-quote, #5a4a3a);
  line-height: 1.7;
  margin: 0 0 1.2rem;
  letter-spacing: 1px;
}

.quote-attribution {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 3px;
  text-transform: uppercase;
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
