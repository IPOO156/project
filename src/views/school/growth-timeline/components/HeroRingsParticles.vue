<template>
  <div class="hero-rings__particles" aria-hidden="true">
    <span v-for="n in 12" :key="n" class="hero-rings__particle" />
  </div>
</template>

<style scoped lang="scss">
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

html.dark .hero-rings__particles {
  filter: brightness(1.35);
}
</style>
