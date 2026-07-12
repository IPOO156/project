<script setup lang="ts">
import type { QuickEntry } from './composables/useQuickEntries'
import { RadarChart } from 'echarts/charts'
import { LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage } from 'element-plus'
import { Award, Clock, FileText, TrendingUp } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { useRouter } from 'vue-router'
import {
  useActivityStore,
  useArchiveStore,
  useSubmissionStore,
  useThemeStore,
} from '@/app/stores/stores'
import QuickEntries from './components/QuickEntries.vue'
import QuickEntrySettings from './components/QuickEntrySettings.vue'
import StatsOverview from './components/StatsOverview.vue'
import { useQuickEntries } from './composables/useQuickEntries'

use([CanvasRenderer, RadarComponent, RadarChart, TooltipComponent, LegendComponent])

const router = useRouter()
const activityStore = useActivityStore()
const archiveStore = useArchiveStore()
const submissionStore = useSubmissionStore()
const themeStore = useThemeStore()
const { visibleEntries, recordClick, refreshPool, updateOrder, toggleHidden } = useQuickEntries()
const showSettings = ref(false)

// ── 从 store 派生展示数据（数据由 API 层填充 store） ──

// 学期均绩：所有课程按学分加权平均 GPA
const overallGpa = computed(() => {
  const grades = archiveStore.grades
  const totalCredits = grades.reduce((s, g) => s + g.credits, 0)
  if (totalCredits === 0) return '0.00'
  const weighted = grades.reduce((s, g) => s + g.gpa * g.credits, 0)
  return (weighted / totalCredits).toFixed(2)
})

// 统计卡片：申报数据来自 submissionStore，均绩来自 archiveStore
const statsCards = computed(() => {
  const records = submissionStore.records
  return [
    {
      label: '申报总数',
      value: records.length,
      icon: FileText,
      color: themeStore.isDark ? '#60a5fa' : '#2d5a87',
    },
    {
      label: '已通过',
      value: records.filter((r) => r.status === 'approved').length,
      icon: Award,
      color: '#10b981',
    },
    {
      label: '待审批',
      value: records.filter((r) => r.status === 'submitted').length,
      icon: Clock,
      color: '#d4a574',
    },
    { label: '学期均绩', value: overallGpa.value, icon: TrendingUp, color: '#d4a574' },
  ]
})

// 多维度画像：直接读取 store 的 ProfileDimension（{ label, current, target, previous }）
const profileDimensions = computed(() => archiveStore.dimensions)

const hasProfileDimensions = computed(() => profileDimensions.value.length > 0)

const profileSummary = computed(() => {
  return profileDimensions.value.map((item) => {
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

const radarTextColor = computed(() => (themeStore.isDark ? '#94a3b8' : '#334155'))
const radarAxisColor = computed(() => (themeStore.isDark ? '#334155' : 'rgba(148, 163, 184, 0.18)'))
const radarSplitColor = computed(() =>
  themeStore.isDark ? '#1e293b' : 'rgba(148, 163, 184, 0.12)',
)
const radarAreaColors = computed(() =>
  themeStore.isDark
    ? ['rgba(30, 41, 59, 0.70)', 'rgba(15, 23, 42, 0.45)']
    : ['rgba(248, 250, 252, 0.70)', 'rgba(241, 245, 249, 0.45)'],
)
const radarTooltipBg = computed(() =>
  themeStore.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(17, 24, 39, 0.92)',
)

const radarOption = computed(() => {
  if (!hasProfileDimensions.value) {
    return null
  }

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: radarTooltipBg.value,
      borderWidth: 0,
      textStyle: { color: '#fff' },
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: radarTextColor.value,
        fontSize: 12,
      },
      data: ['当前画像', '目标值', '上一阶段'],
    },
    radar: {
      radius: '62%',
      center: ['50%', '44%'],
      splitNumber: 5,
      axisName: {
        color: radarTextColor.value,
        fontSize: 13,
      },
      splitLine: {
        lineStyle: {
          color: radarSplitColor.value,
        },
      },
      splitArea: {
        areaStyle: {
          color: radarAreaColors.value,
        },
      },
      axisLine: {
        lineStyle: {
          color: radarAxisColor.value,
        },
      },
      indicator: profileDimensions.value.map((item) => ({
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
            value: profileDimensions.value.map((item) => item.current),
            name: '当前画像',
            areaStyle: {
              color: 'rgba(45, 90, 135, 0.20)',
            },
            lineStyle: {
              color: '#2d5a87',
              width: 3,
            },
            itemStyle: {
              color: '#2d5a87',
            },
          },
          {
            value: profileDimensions.value.map((item) => item.target),
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
            value: profileDimensions.value.map((item) => item.previous),
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
  }
})

const recentActivities = computed(() => activityStore.filteredActivities.slice(0, 5))

async function onEntryClick(entry: QuickEntry) {
  recordClick(entry.path)
  try {
    await router.push(entry.path)
  } catch {
    ElMessage.error('页面跳转失败，请稍后重试')
  }
}

function onQuickRefresh() {
  refreshPool()
}

function onToggleHidden(id: string) {
  toggleHidden(id)
}

function onUpdateOrder(orderedIds: string[]) {
  updateOrder(orderedIds)
}

onMounted(() => {
  activityStore.fetchActivities()
  // 档案与申报数据：若已缓存则不重复拉取
  if (archiveStore.dimensions.length === 0) archiveStore.fetchArchive()
  if (submissionStore.records.length === 0) submissionStore.fetchRecords()
})
</script>

<template>
  <div class="dashboard">
    <StatsOverview :cards="statsCards" />

    <el-row :gutter="16" class="dashboard__main">
      <el-col :span="13" class="dashboard__col">
        <el-card class="dashboard__section dashboard__section--radar">
          <template #header>
            <span class="section-title">多维度画像评估</span>
          </template>
          <div class="radar-panel">
            <VChart
              v-if="radarOption"
              class="radar-panel__chart"
              :option="radarOption"
              autoresize
            />
            <div v-else class="radar-panel__chart radar-panel__chart--empty">
              <el-empty description="暂无维度数据" :image-size="80" />
            </div>
            <div v-if="profileSummary.length > 0" class="radar-panel__summary">
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

      <el-col :span="11" class="dashboard__col">
        <QuickEntries
          :entries="visibleEntries"
          @entry-click="onEntryClick"
          @refresh="onQuickRefresh"
          @toggle-hidden="onToggleHidden"
          @update-order="onUpdateOrder"
          @open-settings="showSettings = true"
        />

        <el-card class="dashboard__section dashboard__section--activities">
          <template #header>
            <div class="dashboard__section-header">
              <span class="section-title">最近动态</span>
              <el-button link type="primary" @click="router.push('/messages/activities')">
                查看全部
              </el-button>
            </div>
          </template>
          <div v-loading="activityStore.loading" class="activities">
            <div v-for="act in recentActivities" :key="act.id" class="activity-item">
              <div class="activity-item__dot" :class="`activity-item__dot--${act.type}`" />
              <div class="activity-item__content">
                <p class="activity-item__text">{{ act.text }}</p>
                <span class="activity-item__time">{{ act.time }}</span>
              </div>
            </div>
            <el-empty
              v-if="!activityStore.loading && recentActivities.length === 0"
              description="暂无动态"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <QuickEntrySettings v-model:visible="showSettings" />
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;

  &__main {
    flex: 1;
    min-height: 0;
    margin-bottom: 0;
  }

  &__col {
    display: flex;
    flex-direction: column;
    height: 100%;

    /* 左列单卡片撑满 */
    &:first-child :deep(.el-card) {
      flex: 1;
    }
  }

  &__col:last-child :deep(.el-card) {
    flex: 1;
  }

  &__col:last-child :deep(.quick-entries-card) {
    flex: 0 0 auto;
  }

  &__section {
    margin-bottom: 12px;

    &--activities {
      margin-bottom: 0;
    }
  }

  &__charts {
    margin-bottom: 12px;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.radar-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 1fr);
  gap: $spacing-lg;
  align-items: center;
}

.radar-panel__chart {
  height: 260px;
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
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
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
  color: var(--el-color-primary);
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

    &--draft {
      background: #909399;
    }
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
