<script setup lang="ts">
import type { PublicStatistics } from '@/shared/api/common'
import { BookOpen, Clock, FileCheck, Layers, Shield, Sparkles, Users, Zap } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import logoIcon from '@/assets/logo/logo-icon.png'
import { getPublicStatistics } from '@/shared/api/common'

const props = defineProps<{
  loginType: 'student' | 'admin'
  mouseX: number
  mouseY: number
}>()

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
const sceneKicker = computed(() =>
  props.loginType === 'student' ? '学生档鉴未来' : '教师档鉴未来',
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

/** 11.1 登录页公开统计实时数据；接口未实现/失败时为 null，回退下方原展示数据 */
const liveStats = ref<PublicStatistics | null>(null)

function formatCount(n: number | undefined): string {
  return n != null ? n.toLocaleString('en-US') : '—'
}

const statsData = computed(() => {
  const s = liveStats.value
  if (props.loginType === 'student') {
    return [
      { num: s ? `${formatCount(s.studentCount)}+` : '2,840+', label: '在校学生', icon: Users },
      { num: s ? formatCount(s.archiveCount) : '12,580', label: '档案条目', icon: Layers },
      { num: s?.serviceAvailability || '99.9%', label: '服务可用', icon: Zap },
    ]
  }
  return [
    {
      num: s ? formatCount(s.pendingApplicationCount) : '386',
      label: '待审申请',
      icon: FileCheck,
    },
    { num: s ? formatCount(s.archiveCount) : '12,580', label: '学生档案', icon: Users },
    { num: s?.systemStability || '99.99%', label: '系统稳定', icon: Zap },
  ]
})

const currentTime = ref('00:00:00')
let clockInterval: number | null = null

/* ===================== 时钟 ===================== */
function updateClock() {
  const n = new Date()
  currentTime.value = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`
}

onMounted(async () => {
  updateClock()
  clockInterval = window.setInterval(updateClock, 1000)
  // 11.1 登录页公开统计：接口未实现（404 已静默）或失败时保留原展示数据
  try {
    liveStats.value = await getPublicStatistics()
  } catch {
    /* 静默：保留硬编码兜底 */
  }
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})
</script>

<template>
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
      <p class="login__hero-kicker">{{ sceneKicker }}</p>
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
</template>

<style scoped lang="scss">
/* ---- 文字区 ---- */
.login__hero-inner {
  max-width: 760px;
  animation: heroEnter 1.2s $ease-emphasized;
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
  position: relative;
  z-index: 3;
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
  text-wrap: balance;
}

.login__hero-title-text {
  display: block;
  text-wrap: balance;
  animation: textSlideIn 0.45s $ease-out-quint;
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
  animation: textSlideIn 0.35s $ease-out-quint 0.05s;
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
    transform 0.45s $ease-out-quint,
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

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1200px) {
  .login__feature-grid {
    grid-template-columns: 1fr;
  }

  .login__stats-row {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .login__hero-title {
    font-size: 28px;
  }

  .login__hero-subtitle {
    font-size: 14px;
    margin-top: 12px;
  }

  .login__brand-mark {
    width: 64px;
    height: 64px;
    margin: 16px 0 20px;
  }

  .login__hero-copy {
    margin-bottom: 0;
  }

  .login__feature-grid,
  .login__hero-footer {
    display: none;
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
