<script setup lang="ts">
/**
 * TeacherDashboard - 教师端首页仪表盘
 *
 * 数据来源（能接就接，均为后端真实接口）：
 *   - 欢迎区：userStore（登录后已写入）
 *   - 未读消息：GET /messages
 *   - 数据范围：GET /auth/me 的 scopes
 *   - 最近操作：管理员 → GET /admin/logs/system；其余角色 → 最近消息
 */
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardCheck,
  Download,
  Eye,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import { getSystemLogs, listMessages } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { TEACHER_ROLE_LABELS } from '@/shared/types/types'

const router = useRouter()
const userStore = useUserStore()
const { me } = useTeacherMe()

const currentRole = computed(() => userStore.currentRole)
const userName = computed(() => userStore.userName)
const isAdmin = computed(() => userStore.isSuperAdmin || userStore.isAdmin)
const roleLabel = computed(() =>
  currentRole.value ? (TEACHER_ROLE_LABELS[currentRole.value] ?? '') : '',
)

// ── 真实统计数据 ──
const unreadCount = ref<number | null>(null)
const scopeText = ref('')
const recentTotal = ref<number | null>(null)

/** 数据范围摘要：从 /auth/me scopes 派生「X 学院 · Y 专业」 */
function buildScopeText() {
  const scopes = me.value?.scopes ?? []
  const colleges = new Set(
    scopes
      .filter((s) => s.scopeType === 2)
      .map((s) => s.scopeName)
      .filter(Boolean),
  )
  const majors = new Set(
    scopes
      .filter((s) => s.scopeType === 3)
      .map((s) => s.scopeName)
      .filter(Boolean),
  )
  const parts: string[] = []
  if (colleges.size) parts.push(`${colleges.size} 学院`)
  if (majors.size) parts.push(`${majors.size} 专业`)
  scopeText.value = parts.length ? parts.join(' · ') : '全校'
}

async function loadStats() {
  try {
    const msg = await listMessages({ page: 1, per_page: 1 })
    unreadCount.value = msg.unread
  } catch {
    unreadCount.value = null
  }
  buildScopeText()
  if (isAdmin.value) {
    try {
      const logs = await getSystemLogs({ page: 1, per_page: 1 })
      recentTotal.value = logs.total
    } catch {
      recentTotal.value = null
    }
  } else {
    recentTotal.value = null
  }
}

const statsCards = computed(() => [
  {
    label: '未读消息',
    value: unreadCount.value ?? '—',
    icon: Bell,
    color: 'var(--el-color-primary)',
  },
  {
    label: '数据范围',
    value: scopeText.value || '—',
    icon: MapPin,
    color: 'var(--el-color-success)',
  },
  {
    label: isAdmin.value ? '系统操作' : '消息总数',
    value: recentTotal.value ?? '—',
    icon: Activity,
    color: 'var(--el-color-warning)',
  },
  { label: '当前角色', value: roleLabel.value, icon: Users, color: 'var(--el-color-danger)' },
])

const quickLinks = computed(() => {
  const role = currentRole.value
  const links: { label: string; icon: any; path: string; desc: string }[] = [
    { label: '档案查看', icon: Eye, path: '/teacher/archive-view', desc: '查看学生档案信息' },
    {
      label: '档案导出',
      icon: Download,
      path: '/teacher/archive-export',
      desc: '导出学生档案数据',
    },
  ]
  if (role === 'reviewer' || role === 'super_admin' || role === 'admin') {
    links.push({
      label: '材料审核',
      icon: ClipboardCheck,
      path: '/teacher/material-review',
      desc: '审核学生提交的材料',
    })
    links.push({
      label: '成果热力图',
      icon: TrendingUp,
      path: '/teacher/heat-map',
      desc: '学生成果数据可视化',
    })
  }
  if (role === 'super_admin' || role === 'admin') {
    links.push({
      label: '账号管理',
      icon: Users,
      path: '/teacher/account-management',
      desc: '管理学生与教师账号',
    })
    links.push({
      label: '表单自定义',
      icon: BookOpen,
      path: '/teacher/form-customization',
      desc: '维护申报菜单与模板',
    })
  }
  return links
})

const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
})

// ── 最近动态：管理员看系统日志，其余角色看最近消息 ──
interface RecentItem {
  user: string
  action: string
  time: string
  status: 'success' | 'info' | 'warning'
}
const recentLogs = ref<RecentItem[]>([])

async function loadRecent() {
  if (isAdmin.value) {
    try {
      const logs = await getSystemLogs({ page: 1, per_page: 5 })
      recentLogs.value = logs.list.map((l) => ({
        user: l.operatorName ?? '系统',
        action: l.description ?? `${l.module ?? ''}${l.action ?? ''}`,
        time: l.createdAt ? l.createdAt.slice(11, 16) : '',
        status: 'success' as const,
      }))
    } catch {
      recentLogs.value = []
    }
  } else {
    try {
      const msg = await listMessages({ page: 1, per_page: 5 })
      recentLogs.value = msg.list.map((m) => ({
        user: m.senderName ?? '系统',
        action: m.title,
        time: m.createdAt ? m.createdAt.slice(11, 16) : '',
        status: (m.isImportant ? 'warning' : 'info') as RecentItem['status'],
      }))
    } catch {
      recentLogs.value = []
    }
  }
}

onMounted(() => {
  void loadStats()
  void loadRecent()
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- 欢迎区域 -->
    <div class="teacher-dashboard__welcome">
      <div class="teacher-dashboard__welcome-text">
        <h2 class="teacher-dashboard__greeting">欢迎回来，{{ userName }}</h2>
        <p class="teacher-dashboard__date">{{ todayDate }}</p>
      </div>
      <div class="teacher-dashboard__welcome-role">
        <span class="teacher-dashboard__role-tag">
          {{
            userStore.isSuperAdmin
              ? '超级管理员'
              : userStore.isAdmin
                ? '管理员'
                : userStore.isReviewer
                  ? '审核员'
                  : '课任教师'
          }}
        </span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="teacher-dashboard__stats">
      <el-col v-for="card in statsCards" :key="card.label" :xs="12" :sm="6" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">{{ card.label }}</p>
              <p class="stat-card__value">{{ card.value }}</p>
            </div>
            <div class="stat-card__icon" :style="{ '--chip': card.color }">
              <component :is="card.icon" :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主体区域 -->
    <el-row :gutter="16" class="teacher-dashboard__main">
      <!-- 快捷入口 -->
      <el-col :span="14" class="teacher-dashboard__col">
        <el-card class="teacher-dashboard__section">
          <template #header>
            <span class="section-title">快捷操作</span>
          </template>
          <div class="quick-link-grid">
            <div
              v-for="link in quickLinks"
              :key="link.path"
              class="quick-link-card"
              @click="router.push(link.path)"
            >
              <div class="quick-link-card__icon">
                <component :is="link.icon" :size="22" />
              </div>
              <span class="quick-link-card__label">{{ link.label }}</span>
              <span class="quick-link-card__desc">{{ link.desc }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近操作 -->
      <el-col :span="10" class="teacher-dashboard__col">
        <el-card class="teacher-dashboard__section">
          <template #header>
            <span class="section-title">最近操作</span>
          </template>
          <div class="recent-logs">
            <div v-for="(log, i) in recentLogs" :key="i" class="recent-logs__item">
              <div class="recent-logs__dot" :class="`recent-logs__dot--${log.status}`" />
              <div class="recent-logs__content">
                <p class="recent-logs__action">{{ log.action }}</p>
                <span class="recent-logs__meta">{{ log.user }} · {{ log.time }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.teacher-dashboard {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  // 统计卡片逐项入场
  &__stats :deep(.el-col) {
    opacity: 0;
    transform: translateY(12px);
    animation: dash-card-enter 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    @for $i from 1 through 4 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.08}s;
      }
    }
  }

  &__welcome {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    background: linear-gradient(120deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 62%);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-xl;
    padding: $spacing-xl $spacing-2xl;

    // 右上角品牌金晕，营造档案册质感
    &::after {
      content: '';
      position: absolute;
      right: -60px;
      top: -60px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba($color-accent, 0.16), transparent 70%);
      pointer-events: none;
    }
  }

  &__greeting {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__date {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__role-tag {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 16px;
    background: linear-gradient(135deg, var(--el-color-primary), $color-primary-light);
    color: #fff;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba($color-primary, 0.22);

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $color-accent-light;
    }
  }

  &__stats {
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
  }

  &__col {
    display: flex;
    flex-direction: column;
  }

  &__section {
    flex: 1;
    margin-bottom: 0;

    :deep(.el-card__body) {
      height: calc(100% - 56px);
    }
  }
}

.stat-card {
  transition: all 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  cursor: default;

  &:active {
    transform: scale(0.98);
  }

  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    // 用 CSS 变量注入语义色，统一生成淡色底 + 描边 + 高光
    background: color-mix(in srgb, var(--chip, var(--el-color-primary)) 12%, transparent);
    color: var(--chip, var(--el-color-primary));
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--chip, var(--el-color-primary)) 16%, transparent);
    transition: transform 0.25s $ease-standard;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-link-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.quick-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-base;
    border-color: var(--el-color-primary-light-7);
  }

  &:active {
    transform: scale(0.97);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--el-color-primary-light-9), rgba($color-accent, 0.16));
    color: var(--el-color-primary);
    box-shadow: inset 0 0 0 1px rgba($color-accent, 0.28);
    transition: transform 0.25s $ease-standard;
  }

  &:hover &__icon {
    transform: scale(1.06) rotate(-3deg);
  }

  &__label {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}

.recent-logs {
  &__item {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md 0;
    border-bottom: 1px solid var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;

    &--success,
    &--approved {
      background: var(--el-color-success);
    }

    &--info {
      background: var(--el-text-color-disabled);
    }

    &--warning {
      background: var(--el-color-warning);
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__action {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

// 卡片入场
@keyframes dash-card-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .teacher-dashboard__stats :deep(.el-col) {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
