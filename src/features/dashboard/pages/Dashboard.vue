<script setup lang="ts">
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  FileText,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores'

const router = useRouter()
const userStore = useUserStore()

// 统计卡片
const statsCards = ref([
  { label: '申报总数', value: 12, icon: FileText, color: '#409eff' },
  { label: '已通过', value: 8, icon: Award, color: '#67c23a' },
  { label: '待审批', value: 3, icon: Clock, color: '#e6a23c' },
  { label: '学期均绩', value: '3.82', icon: TrendingUp, color: '#1e3a5f' },
])

// 快捷入口
const quickEntries = [
  { label: '学科竞赛', path: '/applications/competition', icon: Trophy, color: '#e74c3c' },
  { label: '社会实践', path: '/applications/social-practice', icon: Users, color: '#3498db' },
  { label: '奖学金', path: '/applications/scholarship', icon: Star, color: '#f39c12' },
  { label: '成长时间轴', path: '/profile/timeline', icon: BookOpen, color: '#2ecc71' },
]

// 最近动态 (模拟数据)
const recentActivities = ref([
  { type: 'submitted', text: '学科竞赛申报已提交', time: '2026-06-28 14:30' },
  { type: 'approved', text: '社会实践申报已通过', time: '2026-06-25 10:20' },
  { type: 'submitted', text: '奖学金申请已提交', time: '2026-06-20 16:45' },
  { type: 'rejected', text: '创新创业申报需修改', time: '2026-06-18 09:00' },
  { type: 'approved', text: '荣誉证书登记已通过', time: '2026-06-15 11:30' },
])

// 多维度画像（模拟数据）
const profileDimensions = ref([
  { label: '学业成绩', score: 88, color: '#409eff' },
  { label: '竞赛实践', score: 75, color: '#67c23a' },
  { label: '科研创新', score: 60, color: '#e6a23c' },
  { label: '社会工作', score: 85, color: '#f56c6c' },
  { label: '综合素质', score: 80, color: '#9b59b6' },
])
</script>

<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="dashboard__welcome">
      <div class="dashboard__welcome-text">
        <h2>欢迎回来，{{ userStore.userName }}同学</h2>
        <p>{{ userStore.userInfo?.major }} · {{ userStore.userInfo?.className }} · 学号 {{ userStore.studentId }}</p>
      </div>
      <div class="dashboard__welcome-time">
        <span>{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="dashboard__stats">
      <el-col v-for="card in statsCards" :key="card.label" :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">{{ card.label }}</p>
              <p class="stat-card__value">{{ card.value }}</p>
            </div>
            <div class="stat-card__icon" :style="{ background: `${card.color}15`, color: card.color }">
              <component :is="card.icon" :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard__main">
      <!-- 多维度画像 -->
      <el-col :span="14">
        <el-card class="dashboard__section">
          <template #header>
            <span class="section-title">多维度画像评估</span>
          </template>
          <div class="radar-section">
            <div v-for="dim in profileDimensions" :key="dim.label" class="dimension-bar">
              <div class="dimension-bar__header">
                <span class="dimension-bar__label">{{ dim.label }}</span>
                <span class="dimension-bar__score">{{ dim.score }}分</span>
              </div>
              <el-progress
                :percentage="dim.score"
                :color="dim.color"
                :stroke-width="12"
                :format="() => ''"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 快捷入口 -->
      <el-col :span="10">
        <el-card class="dashboard__section">
          <template #header>
            <span class="section-title">快捷入口</span>
          </template>
          <el-row :gutter="12">
            <el-col v-for="entry in quickEntries" :key="entry.label" :span="12">
              <el-card
                shadow="hover"
                class="quick-entry"
                @click="router.push(entry.path)"
              >
                <div class="quick-entry__body">
                  <div class="quick-entry__icon" :style="{ background: `${entry.color}15`, color: entry.color }">
                    <component :is="entry.icon" :size="20" />
                  </div>
                  <span class="quick-entry__label">{{ entry.label }}</span>
                  <ArrowRight :size="14" class="quick-entry__arrow" />
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <!-- 最近动态 -->
        <el-card class="dashboard__section dashboard__section--activities">
          <template #header>
            <span class="section-title">最近动态</span>
          </template>
          <div class="activities">
            <div v-for="(act, idx) in recentActivities" :key="idx" class="activity-item">
              <div class="activity-item__dot" :class="`activity-item__dot--${act.type}`" />
              <div class="activity-item__content">
                <p class="activity-item__text">{{ act.text }}</p>
                <span class="activity-item__time">{{ act.time }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  &__welcome {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;

    &-text {
      h2 {
        font-size: 22px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 6px;
      }

      p {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    &-time {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  &__stats {
    margin-bottom: 20px;
  }

  &__section {
    margin-bottom: 16px;

    &--activities {
      margin-bottom: 0;
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
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
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

.dimension-bar {
  margin-bottom: 18px;

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__score {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
}

.quick-entry {
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    .quick-entry__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }

  &__arrow {
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s;
    color: var(--el-text-color-secondary);
  }
}

.activities {
  max-height: 240px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-light);

  &:last-child {
    border-bottom: none;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;

    &--submitted { background: #e6a23c; }
    &--approved { background: #67c23a; }
    &--rejected { background: #f56c6c; }
  }

  &__content {
    flex: 1;
    min-width: 0;

    p {
      font-size: 14px;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
