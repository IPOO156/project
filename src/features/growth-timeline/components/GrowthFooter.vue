<script setup lang="ts"></script>

<template>
  <footer class="growth-footer">
    <div class="footer-leaf-row">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.61 2,11.61C5.5,8.5 10.5,7 17,8Z"
        />
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.61 2,11.61C5.5,8.5 10.5,7 17,8Z"
        />
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.61 2,11.61C5.5,8.5 10.5,7 17,8Z"
        />
      </svg>
    </div>
    <p class="footer-text">— 致每一个不曾放弃生长的你 —</p>
  </footer>
</template>

<style scoped lang="scss">
.growth-footer {
  text-align: center;
  padding: 3rem 2rem 4rem;
  position: relative;
  z-index: 2;
}

.footer-leaf-row {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 2rem;
  opacity: 0.15;
}

.footer-leaf-row svg {
  width: 14px;
  height: 14px;
  fill: var(--gt-sage, #5a7c5a);
}

.footer-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.85rem;
  color: var(--text-light, #9a8474);
  font-style: italic;
}

@media (max-width: 768px) {
  .growth-footer {
    padding: 2rem 1rem 3rem;
  }
}
</style>
