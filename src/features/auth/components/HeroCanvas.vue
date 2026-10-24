<script setup lang="ts">
import {
  Award,
  BookOpen,
  FileCheck,
  GraduationCap,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  loginType: 'student' | 'admin'
  mouseX: number
  mouseY: number
}>()

function getFloatCardStyle(depth: number) {
  const px = (props.mouseX / window.innerWidth - 0.5) * 2
  const py = (props.mouseY / window.innerHeight - 0.5) * 2
  return {
    marginLeft: `${px * depth * 0.35}px`,
    marginTop: `${py * depth * 0.35}px`,
  }
}

const vaultStyle = computed(() => {
  const px = (props.mouseX / window.innerWidth - 0.5) * 2
  const py = (props.mouseY / window.innerHeight - 0.5) * 2
  return { transform: `translate(calc(-50% + ${px * 6}px), calc(-50% + ${py * 6}px))` }
})

const floatCards = computed(() => {
  if (props.loginType === 'student') {
    return [
      {
        title: '学业档案',
        meta: '已归档 · 6 学期',
        icon: GraduationCap,
        top: '14%',
        right: '6%',
        depth: 20,
        delay: '0s',
      },
      {
        title: '荣誉证书',
        meta: '12 份 · 待确认',
        icon: Award,
        top: '42%',
        right: '18%',
        depth: 14,
        delay: '1.2s',
      },
      {
        title: '实践记录',
        meta: '2024 · 暑期',
        icon: FileCheck,
        bottom: '24%',
        left: '7%',
        depth: 24,
        delay: '0.6s',
      },
      {
        title: '科研成果',
        meta: '3 篇 · 已发表',
        icon: Sparkles,
        bottom: '12%',
        right: '20%',
        depth: 16,
        delay: '1.8s',
      },
    ]
  }
  return [
    {
      title: '审核队列',
      meta: '24 条 · 待处理',
      icon: Shield,
      top: '14%',
      right: '6%',
      depth: 20,
      delay: '0s',
    },
    {
      title: '数据总览',
      meta: '实时同步中',
      icon: Layers,
      top: '42%',
      right: '3%',
      depth: 14,
      delay: '1.2s',
    },
    {
      title: '通知公告',
      meta: '8 条未读',
      icon: BookOpen,
      bottom: '24%',
      left: '7%',
      depth: 24,
      delay: '0.6s',
    },
    {
      title: '系统状态',
      meta: '运行正常',
      icon: Zap,
      bottom: '12%',
      right: '20%',
      depth: 16,
      delay: '1.8s',
    },
  ]
})
</script>

<template>
  <!-- 浮动卡片 -->
  <div class="login__float-cards">
    <div
      v-for="card in floatCards"
      :key="card.title"
      class="login__float-card"
      :style="{
        top: card.top,
        right: card.right,
        bottom: card.bottom,
        left: card.left,
        animationDelay: card.delay,
        ...getFloatCardStyle(card.depth),
      }"
    >
      <div class="login__float-icon">
        <component :is="card.icon" :size="16" />
      </div>
      <div class="login__float-title">{{ card.title }}</div>
      <div class="login__float-meta">{{ card.meta }}</div>
      <div class="login__float-lines">
        <span class="u-w-80pct"></span>
        <span class="u-w-55pct"></span>
        <span class="u-w-70pct"></span>
      </div>
    </div>
  </div>

  <!-- 旋转档案环 -->
  <div class="login__vault-visual" :style="vaultStyle">
    <div class="login__vault-ring login__vault-ring--one"></div>
    <div class="login__vault-ring login__vault-ring--two"></div>
    <div class="login__vault-ring login__vault-ring--three"></div>
    <div class="login__vault-ring login__vault-ring--four"></div>
    <div class="login__vault-ring login__vault-ring--five"></div>
    <div class="login__vault-dot login__vault-dot--one"></div>
    <div class="login__vault-dot login__vault-dot--two"></div>
    <div class="login__vault-dot login__vault-dot--three"></div>
    <div class="login__vault-core">
      <div class="login__vault-core-inner"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ---- 浮动卡片 ---- */
.login__float-cards {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.login__float-card {
  position: absolute;
  padding: 14px;
  border-radius: 14px;
  background: var(--login-float-bg);
  border: 1px solid var(--login-border);
  backdrop-filter: blur(10px);
  box-shadow:
    0 12px 30px -6px var(--login-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  width: 160px;
  animation: cardFloatGentle 9s ease-in-out infinite;
  transition:
    transform 0.4s ease-out,
    opacity 0.3s ease;
  opacity: 0.92;
}

.login__float-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--login-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  color: var(--login-accent);
}

.login--light .login__float-icon {
  color: #2563eb;
}

.login__float-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--login-text);
  letter-spacing: 0.3px;
  transition: color 0.5s ease;
}

.login__float-meta {
  font-size: 10px;
  color: var(--login-text-faint);
  margin-top: 3px;
  letter-spacing: 0.3px;
  transition: color 0.5s ease;
}

.login__float-lines {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    height: 3px;
    border-radius: 2px;
    background: var(--login-border);
    display: block;
  }
}

/* ---- 旋转档案环 ---- */
.login__vault-visual {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 560px;
  height: 560px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
  animation: vaultFadeIn 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease-out;
}

.login__vault-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px solid var(--login-ring-color);
  transform: translate(-50%, -50%);

  &--one {
    width: 560px;
    height: 560px;
    margin: -280px 0 0 -280px;
    border-style: dashed;
    opacity: 0.5;
    animation: vaultSpin 90s linear infinite;
  }

  &--two {
    width: 460px;
    height: 460px;
    margin: -230px 0 0 -230px;
    opacity: 0.6;
    animation: vaultSpinReverse 70s linear infinite;
  }

  &--three {
    width: 360px;
    height: 360px;
    margin: -180px 0 0 -180px;
    border-style: dashed;
    opacity: 0.55;
    animation: vaultSpin 55s linear infinite;
  }

  &--four {
    width: 260px;
    height: 260px;
    margin: -130px 0 0 -130px;
    opacity: 0.65;
    animation: vaultSpinReverse 40s linear infinite;
  }

  &--five {
    width: 160px;
    height: 160px;
    margin: -80px 0 0 -80px;
    border-style: dashed;
    opacity: 0.5;
    animation: vaultSpin 30s linear infinite;
  }
}

.login__vault-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--login-accent);
  opacity: 0.8;

  &--one {
    margin: -2.5px 0 0 277.5px;
    animation: vaultSpin 90s linear infinite;
  }

  &--two {
    margin: -232.5px 0 0 -2.5px;
    animation: vaultSpinReverse 70s linear infinite;
  }

  &--three {
    margin: -2.5px 0 0 -182.5px;
    animation: vaultSpin 55s linear infinite reverse;
  }
}

.login__vault-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  margin: -35px 0 0 -35px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--login-aurora-one) 0%, transparent 65%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: vaultCorePulse 4s ease-in-out infinite;
}

.login__vault-core-inner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--login-accent);
  opacity: 0.85;
  animation: vaultCoreGlow 3s ease-in-out infinite;
}

/* ============================================================
   Keyframes
   ============================================================ */
@keyframes cardFloatGentle {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 0.92;
  }
  25% {
    transform: translate3d(4px, -10px, 0) rotate(0.4deg);
    opacity: 1;
  }
  50% {
    transform: translate3d(-2px, -18px, 0) rotate(-0.3deg);
    opacity: 0.95;
  }
  75% {
    transform: translate3d(-5px, -8px, 0) rotate(0.2deg);
    opacity: 1;
  }
}

@keyframes vaultFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes vaultSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes vaultSpinReverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes vaultCorePulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.9;
  }
}

@keyframes vaultCoreGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.75;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.95;
  }
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1200px) {
  .login__vault-visual,
  .login__float-cards {
    display: none;
  }
}
</style>
