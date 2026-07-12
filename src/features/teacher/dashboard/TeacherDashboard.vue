<script setup lang="ts">
/**
 * TeacherDashboard - 教师端首页仪表盘
 *
 * 根据角色展示不同内容：
 * - 超级管理员/管理员：系统总览数据 + 快捷管理入口
 * - 审核员：待审核材料汇总 + 审核通道
 * - 课任教师：所教班级档案概况
 */
import {
  BookOpen,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'

const router = useRouter()
const userStore = useUserStore()

const currentRole = computed(() => userStore.currentRole)
const userName = computed(() => userStore.userName)

// ── Mock 统计卡片 ──
const statsCards = computed(() => {
  const role = currentRole.value
  if (role === 'super_admin' || role === 'admin') {
    return [
      { label: '学生总数', value: 2846, icon: Users, color: 'var(--el-color-primary)' },
      { label: '教师总数', value: 186, icon: BookOpen, color: 'var(--el-color-success)' },
      { label: '今日操作', value: 237, icon: TrendingUp, color: 'var(--el-color-warning)' },
      { label: '待审核材料', value: 42, icon: ClipboardCheck, color: 'var(--el-color-danger)' },
    ]
  }
  if (role === 'reviewer') {
    return [
      { label: '待审核（院级）', value: 18, icon: UserCheck, color: 'var(--el-color-primary)' },
      { label: '待审核（系级）', value: 24, icon: UserCheck, color: 'var(--el-color-warning)' },
      { label: '今日已审核', value: 15, icon: ClipboardCheck, color: 'var(--el-color-success)' },
      { label: '审核通过率', value: '86%', icon: TrendingUp, color: 'var(--el-color-primary)' },
    ]
  }
  // teacher
  return [
    { label: '所教班级', value: 3, icon: BookOpen, color: 'var(--el-color-primary)' },
    { label: '学生总数', value: 126, icon: Users, color: 'var(--el-color-success)' },
    { label: '本学期填报', value: 98, icon: FileText, color: 'var(--el-color-warning)' },
    { label: '优秀档案', value: 32, icon: Eye, color: 'var(--el-color-danger)' },
  ]
})

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

const recentLogs = ref([
  { user: '李老师', action: '导出2024级学生档案', time: '10:32', status: 'success' },
  { user: '王审核员', action: '通过张三的竞赛申报', time: '10:15', status: 'approved' },
  { user: '赵老师', action: '查看计科2401班档案', time: '09:48', status: 'info' },
  { user: '系统', action: '自动备份完成', time: '03:00', status: 'success' },
])
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
            <div
              class="stat-card__icon"
              :style="{ background: `${card.color}15`, color: card.color }"
            >
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
              <div
                class="quick-link-card__icon"
                :style="{
                  background: 'var(--el-color-primary-light-9)',
                  color: 'var(--el-color-primary)',
                }"
              >
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

  &__welcome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color));
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-lg;
    padding: $spacing-xl $spacing-2xl;
  }

  &__greeting {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__date {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__role-tag {
    display: inline-block;
    padding: 4px 14px;
    background: var(--el-color-primary);
    color: #fff;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
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
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
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
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-base;
    border-color: var(--el-color-primary-light-7);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
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
</style>
