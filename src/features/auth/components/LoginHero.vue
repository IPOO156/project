<script setup lang="ts">
import HeroCanvas from './HeroCanvas.vue'
import HeroCopy from './HeroCopy.vue'

defineProps<{
  loginType: 'student' | 'admin'
  mouseX: number
  mouseY: number
}>()
</script>

<template>
  <section class="login__hero">
    <HeroCopy :login-type="loginType" :mouse-x="mouseX" :mouse-y="mouseY" />
    <HeroCanvas :login-type="loginType" :mouse-x="mouseX" :mouse-y="mouseY" />
  </section>
</template>

<style scoped lang="scss">
/* ---- 布局 ---- */
.login__hero {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 72px 7vw;
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1200px) {
  .login__hero {
    min-height: 58vh;
    padding: 64px 32px 24px;
  }
}

@media (max-width: 768px) {
  .login__hero {
    min-height: auto;
    padding: 20px 20px 16px;
  }
}
</style>
