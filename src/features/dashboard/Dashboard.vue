<script setup lang="ts">
import { RadarChart } from 'echarts/charts'
import { LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
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
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'

use([CanvasRenderer, RadarComponent, RadarChart, TooltipComponent, LegendComponent])

const router = useRouter()
const userStore = useUserStore()

// ── Mock 数据（接口联调后替换） ──

// 统计卡片
const statsCards = ref([
  { label: '申报总数', value: 12, icon: FileText, color: '#409eff' },
  { label: '已通过', value: 8, icon: Award, color: '#67c23a' },
  { label: '待审批', value: 3, icon: Clock, color: '#e6a23c' },
  { label: '学期均绩', value: '3.82', icon: TrendingUp, color: '#1e3a5f' },
])

// 快捷入口
const quickEntries = [
  { label: '学科竞赛', path: '/applications?tab=competition', icon: Trophy, color: '#e74c3c' },
  { label: '社会实践', path: '/applications?tab=social-practice', icon: Users, color: '#3498db' },
  { label: '奖学金', path: '/applications?tab=scholarship', icon: Star, color: '#f39c12' },
  { label: '成长时间轴', path: '/growth-timeline', icon: BookOpen, color: '#2ecc71' },
]

// 最近动态 (模拟数据)
const recentActivities = ref([
  { type: 'submitted', text: '学科竞赛申报已提交', time: '2026-06-28 14:30' },
  { type: 'approved', text: '社会实践申报已通过', time: '2026-06-25 10:20' },
  { type: 'submitted', text: '奖学金申请已提交', time: '2026-06-20 16:45' },
  { type: 'rejected', text: '创新创业申报需修改', time: '2026-06-18 09:00' },
  { type: 'approved', text: '荣誉证书登记已通过', time: '2026-06-15 11:30' },
])

const profileDimensions = [
  { label: '学业成绩', current: 88, target: 92, previous: 81 },
  { label: '竞赛实践', current: 75, target: 90, previous: 68 },
  { label: '科研创新', current: 60, target: 82, previous: 52 },
  { label: '社会工作', current: 85, target: 88, previous: 78 },
  { label: '综合素质', current: 80, target: 90, previous: 72 },
]

const profileSummary = computed(() => {
  return profileDimensions.map((item) => {
    const deltaFromPrevious = item.current - item.previous
    return {
      label: item.label,
      current: item.current,
      target: item.target,
      previous: item.previous,
      deltaFromPrevious,
      gapToTarget: item.target - item.current,
      deltaClass: deltaFromPrevious >= 0 ? 'is-up' : 'is-down',
      deltaSign: deltaFromPrevious >= 0 ? '+' : '',
    }
  })
})

const radarOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    borderWidth: 0,
    textStyle: { color: '#fff' },
  },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      color: '#64748b',
      fontSize: 12,
    },
    data: ['当前画像', '目标值', '上一阶段'],
  },
  radar: {
    radius: '62%',
    center: ['50%', '44%'],
    splitNumber: 5,
    axisName: {
      color: '#334155',
      fontSize: 13,
    },
    splitLine: {
      lineStyle: {
        color: ['rgba(148, 163, 184, 0.12)'],
      },
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(248, 250, 252, 0.70)', 'rgba(241, 245, 249, 0.45)'],
      },
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(148, 163, 184, 0.18)',
      },
    },
    indicator: profileDimensions.map((item) => ({
      name: item.label,
      max: 100,
    })),
  },
  series: [
    {
      type: 'radar',
      symbol: 'circle',
      symbolSize: 7,
      data: [
        {
          value: profileDimensions.map((item) => item.current),
          name: '当前画像',
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.20)',
          },
          lineStyle: {
            color: '#409eff',
            width: 3,
          },
          itemStyle: {
            color: '#409eff',
          },
        },
        {
          value: profileDimensions.map((item) => item.target),
          name: '目标值',
          lineStyle: {
            color: '#94a3b8',
            width: 2,
            type: 'dashed',
          },
          areaStyle: {
            color: 'transparent',
          },
          itemStyle: {
            color: '#94a3b8',
          },
        },
        {
          value: profileDimensions.map((item) => item.previous),
          name: '上一阶段',
          lineStyle: {
            color: '#a855f7',
            width: 2,
          },
          areaStyle: {
            color: 'rgba(168, 85, 247, 0.08)',
          },
          itemStyle: {
            color: '#a855f7',
          },
        },
      ],
    },
  ],
}))

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__welcome">
      <div class="dashboard__welcome-text">
        <h2>欢迎回来，{{ userStore.userName }}同学</h2>
        <p>
          {{ userStore.userInfo?.major }} · {{ userStore.userInfo?.className }} · 学号
          {{ userStore.studentId }}
        </p>
      </div>
      <div class="dashboard__welcome-time">
        <span>{{ todayLabel }}</span>
      </div>
    </div>

    <el-row :gutter="16" class="dashboard__stats">
      <el-col v-for="card in statsCards" :key="card.label" :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">{{ card.label }}</p>
              <p class="stat-card__value">{{ card.value }}</p>
            </div>
            <!-- 图标背景/颜色依赖卡片数据中的动态色值，故使用内联样式 -->
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

    <el-row :gutter="16" class="dashboard__main">
      <el-col :span="14">
        <el-card class="dashboard__section dashboard__section--radar">
          <template #header>
            <span class="section-title">多维度画像评估</span>
          </template>
          <div class="radar-panel">
            <VChart class="radar-panel__chart" :option="radarOption" autoresize />
            <div class="radar-panel__summary">
              <div v-for="item in profileSummary" :key="item.label" class="radar-metric">
                <div class="radar-metric__title-row">
                  <span class="radar-metric__label">{{ item.label }}</span>
                  <span class="radar-metric__score">{{ item.current }}分</span>
                </div>
                <div class="radar-metric__meta">
                  <span class="radar-metric__delta" :class="item.deltaClass">
                    较上阶段 {{ item.deltaSign }}{{ item.deltaFromPrevious }}
                  </span>
                  <span class="radar-metric__gap">距目标 {{ item.gapToTarget }}分</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="dashboard__section">
          <template #header>
            <span class="section-title">快捷入口</span>
          </template>
          <el-row :gutter="12">
            <el-col v-for="entry in quickEntries" :key="entry.label" :span="12">
              <el-card shadow="hover" class="quick-entry" @click="router.push(entry.path)">
                <div class="quick-entry__body">
                  <!-- 图标背景/颜色依赖入口数据中的动态色值，故使用内联样式 -->
                  <div
                    class="quick-entry__icon"
                    :style="{ background: `${entry.color}15`, color: entry.color }"
                  >
                    <component :is="entry.icon" :size="20" />
                  </div>
                  <span class="quick-entry__label">{{ entry.label }}</span>
                  <ArrowRight :size="14" class="quick-entry__arrow" />
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

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

.radar-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.9fr);
  gap: 20px;
  align-items: stretch;
}

.radar-panel__chart {
  height: 360px;
  width: 100%;
}

.radar-panel__summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-content: center;
}

.radar-metric {
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.radar-metric__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.radar-metric__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.radar-metric__score {
  font-size: 18px;
  font-weight: 700;
  color: #1e3a5f;
}

.radar-metric__meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.radar-metric__delta.is-up {
  color: #16a34a;
}

.radar-metric__delta.is-down {
  color: #dc2626;
}

.quick-entry {
  margin-bottom: 12px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

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

    &--submitted {
      background: #e6a23c;
    }
    &--approved {
      background: #67c23a;
    }
    &--rejected {
      background: #f56c6c;
    }
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

@media (max-width: 1200px) {
  .radar-panel {
    grid-template-columns: 1fr;
  }

  .radar-panel__chart {
    height: 320px;
  }

  .radar-panel__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .radar-panel__summary {
    grid-template-columns: 1fr;
  }
}
</style>
