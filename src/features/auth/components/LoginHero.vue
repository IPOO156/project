<script setup lang="ts">
import {
  Award,
  BookOpen,
  Clock,
  FileCheck,
  GraduationCap,
  Layers,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import logoIcon from '@/assets/logo/logo-icon.png'

const props = defineProps<{
  loginType: 'student' | 'admin'
  mouseX: number
  mouseY: number
}>()

const currentTime = ref('00:00:00')
let clockInterval: number | null = null

/* ===================== 响应式数据 ===================== */
const parallaxStyle = computed(() => {
  const px = (props.mouseX / window.innerWidth - 0.5) * 2
  const py = (props.mouseY / window.innerHeight - 0.5) * 2
  return { transform: `translate(${px * -5}px, ${py * -5}px)` }
})

const heroTextStyle = computed(() => {
  const px = (props.mouseX / window.innerWidth - 0.5) * 2
  const py = (props.mouseY / window.innerHeight - 0.5) * 2
  return { transform: `translate(${px * -2}px, ${py * -2}px)` }
})

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

const sceneTitle = computed(() =>
  props.loginType === 'student' ? '连接你的成长档案宇宙' : '进入校园数字治理中枢',
)
const sceneSubtitle = computed(() =>
  props.loginType === 'student'
    ? '从荣誉成果到成长轨迹，在一个沉浸式入口里展开属于你的数字档案旅程。'
    : '面向管理与审核场景的高效控制入口，让档案流转、评审与通知协同有序运转。',
)
const sceneEyebrow = computed(() =>
  props.loginType === 'student'
    ? 'Student Archive Experience Portal'
    : 'Campus Governance Control Gateway',
)

const sceneFeatures = computed(() => {
  const studentFeatures = [
    { title: '成长轨迹', desc: '记录荣誉、实践、科研与发展进程', icon: Sparkles },
    { title: '成果资产', desc: '统一沉淀竞赛、证书与档案成果', icon: Shield },
    { title: '智能陪伴', desc: '以更便捷的方式获取校园数字服务', icon: BookOpen },
  ]
  const adminFeatures = [
    { title: '审核中枢', desc: '高效处理报名、评审与进度流转', icon: Shield },
    { title: '数据视野', desc: '从档案状态到消息触达一屏掌控', icon: Layers },
    { title: '协同体验', desc: '统一入口承载稳定、可信的管理操作', icon: Sparkles },
  ]
  return props.loginType === 'student' ? studentFeatures : adminFeatures
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
        right: '3%',
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

const statsData = computed(() => {
  if (props.loginType === 'student') {
    return [
      { num: '2,840+', label: '在校学生', icon: Users },
      { num: '12,580', label: '档案条目', icon: Layers },
      { num: '99.9%', label: '服务可用', icon: Zap },
    ]
  }
  return [
    { num: '386', label: '待审申请', icon: FileCheck },
    { num: '12,580', label: '学生档案', icon: Users },
    { num: '99.99%', label: '系统稳定', icon: Zap },
  ]
})

/* ===================== 时钟 ===================== */
function updateClock() {
  const n = new Date()
  currentTime.value = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`
}

onMounted(() => {
  updateClock()
  clockInterval = window.setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})
</script>

<template>
  <section class="login__hero">
    <div class="login__hero-inner" :style="heroTextStyle">
      <!-- 品牌标签 -->
      <div class="login__brand-chip">
        <span class="login__brand-chip-dot"></span>
        <span>{{ sceneEyebrow }}</span>
      </div>

      <!-- Logo -->
      <div class="login__brand-mark" :style="parallaxStyle">
        <img :src="logoIcon" alt="档鉴未来" class="login__brand-logo" />
      </div>

      <!-- 文字 -->
      <div class="login__hero-copy">
        <p class="login__hero-kicker">学生档鉴未来</p>
        <h1 class="login__hero-title">
          <span :key="`t-${loginType}`" class="login__hero-title-text">{{ sceneTitle }}</span>
        </h1>
        <p class="login__hero-subtitle">
          <span :key="`s-${loginType}`" class="login__hero-subtitle-text">{{ sceneSubtitle }}</span>
        </p>
      </div>

      <!-- 特性卡片 -->
      <div class="login__feature-grid">
        <article v-for="feature in sceneFeatures" :key="feature.title" class="login__feature-card">
          <div class="login__feature-icon">
            <component :is="feature.icon" :size="18" />
          </div>
          <div>
            <h3 class="login__feature-title">{{ feature.title }}</h3>
            <p class="login__feature-desc">{{ feature.desc }}</p>
          </div>
        </article>
      </div>

      <!-- 底部统计 -->
      <div class="login__hero-footer">
        <div class="login__stats-row">
          <div v-for="stat in statsData" :key="stat.label" class="login__stat-item">
            <div class="login__stat-icon">
              <component :is="stat.icon" :size="14" />
            </div>
            <div class="login__stat-num">{{ stat.num }}</div>
            <div class="login__stat-label">{{ stat.label }}</div>
          </div>
        </div>
        <div class="login__footer-info">
          <span class="login__footer-clock">
            <Clock :size="12" />
            <span>{{ currentTime }}</span>
          </span>
          <span class="login__footer-dot"></span>
          <span>加密传输</span>
          <span class="login__footer-dot"></span>
          <span>安全认证</span>
          <span class="login__footer-dot"></span>
          <span>&copy; 2026</span>
        </div>
      </div>
    </div>

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
          <span style="width: 80%"></span>
          <span style="width: 55%"></span>
          <span style="width: 70%"></span>
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

/* ---- 文字区 ---- */
.login__hero-inner {
  max-width: 760px;
  animation: heroEnter 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 2;
  transition: transform 0.25s ease-out;
}

.login__brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--login-surface-soft);
  border: 1px solid var(--login-border);
  color: var(--login-text-soft);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(14px);
  animation: fadeUp 1s ease both;
  transition:
    background-color 0.5s ease,
    border-color 0.5s ease,
    color 0.5s ease;
}

.login__brand-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9cd2ff 0%, #f3c87b 100%);
  animation: dotPulse 2.4s ease-in-out infinite;
}

.login__brand-mark {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 28px 0 36px;
  display: grid;
  place-items: center;
  border-radius: 34px;
  background: var(--login-surface-soft);
  border: 1px solid var(--login-border);
  backdrop-filter: blur(16px);
  box-shadow:
    0 24px 80px var(--login-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  animation: fadeUp 1.05s ease both;
  transition:
    background-color 0.5s ease,
    border-color 0.5s ease,
    box-shadow 0.5s ease,
    transform 0.25s ease-out;
}

.login__brand-logo {
  width: 112px;
  height: 112px;
  object-fit: contain;
}

/* 全局 dark 模式下 logo 滤镜 */
:global(html.dark) .login__brand-logo {
  filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 255, 255, 0.15));
}

.login__hero-copy {
  margin-bottom: 42px;
}

.login__hero-kicker {
  margin: 0 0 18px;
  font-size: 13px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--login-text-faint);
  animation: fadeUp 1.1s ease both;
  transition: color 0.5s ease;
}

.login__hero-title {
  margin: 0;
  max-width: 720px;
  font-size: clamp(42px, 5vw, 68px);
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--login-text);
  animation: fadeUp 1.2s ease both;
  transition: color 0.5s ease;
  min-height: 2.4em;
}

.login__hero-title-text {
  display: block;
  animation: textSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.login__hero-subtitle {
  margin: 24px 0 0;
  max-width: 640px;
  font-size: 17px;
  line-height: 1.8;
  color: var(--login-text-soft);
  animation: fadeUp 1.3s ease both;
  transition: color 0.5s ease;
  min-height: 3.6em;
}

.login__hero-subtitle-text {
  display: block;
  animation: textSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.05s;
}

/* ---- 特性卡片 ---- */
.login__feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.login__feature-card {
  position: relative;
  padding: 22px 20px;
  border-radius: 24px;
  background: var(--login-surface-soft);
  border: 1px solid var(--login-border);
  backdrop-filter: blur(18px);
  box-shadow:
    0 22px 44px var(--login-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  animation: fadeUp 1.35s ease both;
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.45s ease,
    box-shadow 0.45s ease,
    background-color 0.5s ease,
    opacity 0.35s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      transparent 46%,
      rgba(236, 198, 126, 0.08)
    );
    opacity: 0;
    transition: opacity 0.45s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.01);
    border-color: var(--login-border-strong);
    box-shadow:
      0 32px 60px var(--login-card-shadow),
      0 0 0 1px rgba(236, 198, 126, 0.08);

    &::after {
      opacity: 1;
    }
  }
}

.login--light .login__feature-card::after {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.06),
    transparent 46%,
    rgba(251, 191, 36, 0.06)
  );
}

.login__feature-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 18px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--login-btn-primary-1), var(--login-btn-primary-2));
  box-shadow: 0 12px 22px var(--login-btn-shadow);
}

.login__feature-title {
  margin: 0 0 10px;
  font-size: 16px;
  color: var(--login-text);
  transition: color 0.5s ease;
}

.login__feature-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--login-text-soft);
  transition: color 0.5s ease;
}

/* ---- 底部信息 ---- */
.login__hero-footer {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid var(--login-border);
  animation: fadeUp 1.5s ease both;
  transition: border-color 0.6s ease;
}

.login__stats-row {
  display: flex;
  gap: 40px;
  margin-bottom: 22px;
}

.login__stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  animation: fadeUp 0.8s ease forwards;
}

.login__stat-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--login-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--login-accent);
  margin-bottom: 6px;
  transition:
    background-color 0.6s ease,
    color 0.6s ease;
}

.login__stat-num {
  font-size: 22px;
  font-weight: 600;
  color: var(--login-text);
  line-height: 1;
  letter-spacing: -0.02em;
  transition: color 0.5s ease;
}

.login__stat-label {
  font-size: 11px;
  color: var(--login-text-faint);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.5s ease;
}

.login__footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--login-text-faint);
  letter-spacing: 0.3px;
}

.login__footer-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--login-text-soft);
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  transition: color 0.5s ease;

  svg {
    color: var(--login-accent);
  }
}

.login__footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--login-text-faint);
  opacity: 0.5;
}

/* ============================================================
   Keyframes
   ============================================================ */
@keyframes heroEnter {
  from {
    opacity: 0;
    transform: translateX(-36px) scale(0.98);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes textSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

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
  .login__hero {
    min-height: 58vh;
    padding: 64px 32px 24px;
  }

  .login__vault-visual,
  .login__float-cards {
    display: none;
  }

  .login__feature-grid {
    grid-template-columns: 1fr;
  }

  .login__stats-row {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .login__hero {
    min-height: auto;
    padding: 72px 20px 16px;
  }

  .login__hero-title {
    font-size: 36px;
  }

  .login__hero-subtitle {
    font-size: 15px;
  }

  .login__brand-mark {
    width: 88px;
    height: 88px;
    margin-bottom: 28px;
  }

  .login__stats-row {
    gap: 16px;
    flex-wrap: wrap;
  }

  .login__stat-num {
    font-size: 18px;
  }

  .login__footer-info {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
