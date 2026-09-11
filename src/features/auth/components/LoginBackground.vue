<script setup lang="ts"></script>

<template>
  <div class="login__bg-layer">
    <div class="login__grid"></div>
    <div class="login__aurora login__aurora--one"></div>
    <div class="login__aurora login__aurora--two"></div>
    <div class="login__aurora login__aurora--three"></div>
    <div class="login__ring login__ring--one"></div>
    <div class="login__ring login__ring--two"></div>
    <div class="login__ring login__ring--three"></div>
    <div class="login__veil"></div>
    <div class="login__noise"></div>
  </div>
</template>

<style scoped lang="scss">
.login__bg-layer,
.login__veil,
.login__noise,
.login__grid,
.login__aurora,
.login__ring {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login__bg-layer {
  z-index: 0;
}

.login__veil {
  background: linear-gradient(90deg, rgba(6, 11, 22, 0.08) 0%, rgba(6, 11, 22, 0.24) 100%);
  z-index: 1;
}

.login--light .login__veil {
  opacity: 0.25;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.28) 100%);
}

.login__noise {
  opacity: 0.08;
  z-index: 1;
  background-image:
    linear-gradient(var(--login-grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--login-grid-color) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: radial-gradient(circle at center, black, transparent 78%);
  transition: opacity 0.9s ease;
}

.login--light .login__noise {
  opacity: 0.05;
}

.login__grid {
  z-index: 0;
  inset: auto 0 0 0;
  height: 44%;
  background:
    linear-gradient(var(--login-grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--login-grid-color) 1px, transparent 1px);
  background-size: 48px 48px;
  transform: perspective(960px) rotateX(74deg);
  transform-origin: bottom;
  opacity: 0.14;
  mask-image: linear-gradient(to top, black 0%, transparent 86%);
  animation: gridFloat 18s linear infinite;
  transition: opacity 0.9s ease;
}

.login--light .login__grid {
  opacity: 0.08;
}

.login__aurora {
  z-index: 0;
  filter: blur(80px);
  opacity: 0.75;
  mix-blend-mode: screen;

  &--one {
    inset: -12% auto auto -10%;
    width: 36rem;
    height: 36rem;
    background: radial-gradient(circle, var(--login-aurora-one) 0%, transparent 72%);
    animation: auroraFloat 18s ease-in-out infinite alternate;
  }

  &--two {
    inset: auto -8% 8% auto;
    width: 32rem;
    height: 32rem;
    background: radial-gradient(circle, var(--login-aurora-two) 0%, transparent 70%);
    animation: auroraFloatReverse 22s ease-in-out infinite alternate;
  }

  &--three {
    inset: 34% auto auto 30%;
    width: 24rem;
    height: 24rem;
    background: radial-gradient(circle, var(--login-aurora-three) 0%, transparent 72%);
    animation: pulseGlow 12s ease-in-out infinite;
  }
}

.login--light .login__aurora {
  mix-blend-mode: normal;
  opacity: 0.9;
}

.login__ring {
  z-index: 0;
  margin: auto;
  border: 1px solid var(--login-ring-color);
  border-radius: 50%;

  &--one {
    width: 34rem;
    height: 34rem;
    inset: auto auto 4% -6%;
    animation: spinSlow 32s linear infinite;
  }

  &--two {
    width: 26rem;
    height: 26rem;
    inset: 6% auto auto 12%;
    animation: spinReverse 24s linear infinite;
  }

  &--three {
    width: 42rem;
    height: 42rem;
    inset: auto auto -18% 4%;
    border-style: dashed;
    animation: spinSlow 45s linear infinite;
  }
}

@keyframes auroraFloat {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(40px, 36px, 0) scale(1.1);
  }
}

@keyframes auroraFloatReverse {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-42px, -24px, 0) scale(1.08);
  }
}

@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
}

@keyframes spinSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinReverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes gridFloat {
  from {
    background-position:
      0 0,
      0 0;
  }
  to {
    background-position:
      0 48px,
      48px 0;
  }
}
</style>
