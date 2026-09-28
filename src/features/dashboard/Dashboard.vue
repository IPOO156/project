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
  useHomeStore,
  useSubmissionStore,
  useThemeStore,
} from '@/app/stores/stores'
import { useScoreIndicator } from '@/shared/composables/composables'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'
import QuickEntries from './components/QuickEntries.vue'
import QuickEntrySettings from './components/QuickEntrySettings.vue'
import StatsOverview from './components/StatsOverview.vue'
import { useQuickEntries } from './composables/useQuickEntries'

use([CanvasRenderer, RadarComponent, RadarChart, TooltipComponent, LegendComponent])

const router = useRouter()
const activityStore = useActivityStore()
const archiveStore = useArchiveStore()
const homeStore = useHomeStore()
const submissionStore = useSubmissionStore()
const themeStore = useThemeStore()
const { visibleEntries, recordClick, refreshPool, updateOrder, toggleHidden } = useQuickEntries()
const showSettings = ref(false)

const {
  indicators: scoreIndicators,
  indicatorVisible,
  indicatorLoading,
  indicatorTitle,
  indicatorCalculationId,
  openIndicator,
  closeIndicator,
} = useScoreIndicator()

// ── 从 store 派生展示数据（数据由 API 层填充 store） ──

// 学期均绩：所有课程按学分加权平均 GPA
const overallGpa = computed(() => {
  const grades = archiveStore.grades
  const totalCredits = grades.reduce((s, g) => s + g.credits, 0)
  if (totalCredits === 0) return '0.00'
  const weighted = grades.reduce((s, g) => s + g.gpa * g.credits, 0)
  return (weighted / totalCredits).toFixed(2)
})

// 统计卡片：优先使用 /home/dashboard 数据，缺失时回退本地 store；本地也无数据则显示「--」
const statsCards = computed(() => {
  const home = homeStore.data
  const records = submissionStore.records
  const total = records.length > 0 ? records.length : '--'
  const approved = records.length > 0 ? records.filter((r) => r.status === 'approved').length : '--'
  const pending = records.length > 0 ? records.filter((r) => r.status === 'pending').length : '--'
  return [
    {
      label: '申报总数',
      value: home?.applicationTotal ?? total,
      icon: FileText,
      color: themeStore.isDark ? '#60a5fa' : '#2d5a87',
      path: '/applications',
    },
    {
      label: '已通过',
      value: home?.approvedCount ?? approved,
      icon: Award,
      color: '#10b981',
      path: '/approval/pending',
    },
    {
      label: '待审批',
      value: home?.pendingCount ?? pending,
      icon: Clock,
      color: '#d4a574',
      path: '/approval/pending',
    },
    {
      label: '学期均绩',
      value: home?.currentGpa ?? (archiveStore.grades.length > 0 ? overallGpa.value : '--'),
      icon: TrendingUp,
      color: '#d4a574',
      path: '/profile/info',
    },
  ]
})

// 多维度画像：优先使用 /home/dashboard radarChart，缺失时回退 archiveStore
const profileDimensions = computed(() => {
  const home = homeStore.data
  if (home?.radarChart?.dimensions && home.radarChart.dimensions.length > 0) {
    const { dimensions, current, target, previous } = home.radarChart
    return dimensions.map((d: any, i: number) => ({
      label: d.name,
      current: current[i] ?? 0,
      target: target[i] ?? 0,
      previous: previous[i] ?? 0,
    }))
  }
  return archiveStore.dimensions
})

const hasProfileDimensions = computed(() => profileDimensions.value.length > 0)

/**
 * 有环比基线的维度 → 对比学期名。
 *
 * 判据取 `comparedSemesterId != null`（id 是权威键，学期名仅用于展示）：
 * 后端在无上期数据时返回 `comparedSemesterId: null`、`comparedSemesterName: null`，
 * 但 `radarChart.previous` 仍是 `[0,0,0]` 而非 null。若拿它直接相减，会得到
 * 「较上阶段 +20分」这种**前端编造出来的趋势**（把「没有上期数据」当成了「上期考 0 分」）。
 * 这与 app/stores/archive.ts 中「无环比数据时 previous 与 current 相同（前端不编造趋势）」
 * 的既有口径一致 —— store 层做了防护，此处这条路径此前绕过了它。
 *
 * 待后端补 `deltaAvailable` 或让 previous 在无数据时返回 null 后，可改用该显式开关。
 */
const comparedSemesterMap = computed(() => {
  const map = new Map<string, string>()
  for (const ind of homeStore.data?.indicators ?? []) {
    if (ind.dimensionName && ind.comparedSemesterId != null) {
      map.set(ind.dimensionName, ind.comparedSemesterName ?? '上阶段')
    }
  }
  return map
})

const indicatorMeta = computed(() => {
  const first = homeStore.data?.indicators?.[0]
  const rate = homeStore.data?.dataCompleteness?.rate
  return {
    ruleVersion: first?.ruleVersion == null ? '--' : `v${first.ruleVersion}`,
    calculatedAt: first?.calculatedAt ?? '--',
    completeness: rate == null ? '--' : `${Math.round(rate <= 1 ? rate * 100 : rate)}%`,
  }
})

const profileSummary = computed(() => {
  const comparedMap = comparedSemesterMap.value
  return profileDimensions.value.map((item) => {
    // 无环比基线时不产出任何环比文案与颜色，模板据此不渲染该区域（前端不编造趋势）
    const comparedSemesterName = comparedMap.get(item.label)
    const hasBaseline = comparedSemesterName != null
    const deltaFromPrevious = hasBaseline ? item.current - item.previous : 0
    return {
      label: item.label,
      current: item.current,
      target: item.target,
      previous: item.previous,
      hasBaseline,
      deltaFromPrevious,
      deltaLabel: hasBaseline ? `较${comparedSemesterName}学期` : '',
      gapToTarget: item.target - item.current,
      // 持平时既非上升也非下降，不再套用 is-up 的绿色（此前 +0 会被渲染成上升态）
      deltaClass: deltaFromPrevious > 0 ? 'is-up' : deltaFromPrevious < 0 ? 'is-down' : 'is-flat',
      deltaSign: deltaFromPrevious > 0 ? '+' : '',
    }
  })
})

/**
 * 是否存在任一维度的环比基线。
 * 为 false 时雷达不绘制「上一阶段」系列 —— previous 此时是后端填的 [0,0,0]，
 * 画出来就是一条贴在圆心的假基线（与「较上阶段 +20分」同源，见 comparedSemesterMap）。
 */
const hasAnyComparison = computed(() => profileSummary.value.some((item) => item.hasBaseline))

const radarLegend = computed(() =>
  hasAnyComparison.value ? ['当前画像', '目标值', '上一阶段'] : ['当前画像', '目标值'],
)

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
      data: radarLegend.value,
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
          // 无环比基线时不追加该系列（否则画出一条全 0 的假基线）
          ...(hasAnyComparison.value
            ? [
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
              ]
            : []),
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

function onStatCardClick(path: string) {
  void router.push(path)
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
  homeStore.fetchDashboard()
  activityStore.fetchActivities()
  // 档案与申报数据：若已缓存则不重复拉取
  if (archiveStore.dimensions.length === 0) archiveStore.fetchArchive()
  if (submissionStore.records.length === 0) submissionStore.fetchRecords()
})
</script>

<template>
  <div class="dashboard">
    <StatsOverview :cards="statsCards" @card-click="onStatCardClick" />

    <el-row :gutter="16" class="dashboard__main">
      <el-col :span="13" class="dashboard__col">
        <el-card class="dashboard__section dashboard__section--radar">
          <template #header>
            <div class="dashboard__section-header">
              <span class="section-title">多维度画像评估</span>
              <span class="indicator-meta">
                规则版本 {{ indicatorMeta.ruleVersion }} · 计算时间
                {{ indicatorMeta.calculatedAt }} · 数据完整度 {{ indicatorMeta.completeness }}
                <el-button link type="primary" @click="onStatCardClick('/profile/info')"
                  >查看档案概览</el-button
                >
              </span>
            </div>
          </template>
          <div class="radar-panel">
            <div class="radar-panel__chart-wrap" @click="onStatCardClick('/profile/info')">
              <VChart
                v-if="radarOption"
                class="radar-panel__chart"
                :option="radarOption"
                autoresize
              />
              <div v-else class="radar-panel__chart radar-panel__chart--empty">
                <el-empty description="暂无维度数据" :image-size="80" />
              </div>
            </div>
            <div v-if="profileSummary.length > 0" class="radar-panel__summary">
              <div v-for="item in profileSummary" :key="item.label" class="radar-metric">
                <div class="radar-metric__title-row">
                  <span class="radar-metric__label">{{ item.label }}</span>
                  <div class="radar-metric__score-group">
                    <span class="radar-metric__score">{{ item.current }}分</span>
                    <el-button
                      class="radar-metric__link"
                      link
                      type="primary"
                      @click="openIndicator(item.label, item.label)"
                      >查看计算说明</el-button
                    >
                  </div>
                </div>
                <div class="radar-metric__meta">
                  <span
                    v-if="item.hasBaseline"
                    class="radar-metric__delta"
                    :class="item.deltaClass"
                  >
                    {{ item.deltaLabel }} {{ item.deltaSign }}{{ item.deltaFromPrevious }}分
                  </span>
                  <span v-else class="radar-metric__delta is-flat">暂无环比数据</span>
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
                <div class="activity-item__title-row">
                  <p class="activity-item__text">{{ act.text }}</p>
                  <StatusTag :status="act.status" size="small" />
                </div>
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
    <ScoreIndicatorDialog
      :visible="indicatorVisible"
      :loading="indicatorLoading"
      :title="indicatorTitle"
      :indicators="scoreIndicators"
      :calculation-id="indicatorCalculationId"
      @close="closeIndicator"
    />
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

.indicator-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.radar-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 1fr);
  gap: $spacing-lg;
  align-items: center;
}

.radar-panel__chart-wrap {
  cursor: pointer;
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

.radar-metric__score-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radar-metric__link {
  font-size: 12px;
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

/* 持平 / 无环比基线：沿用父级 --el-text-color-secondary，不套用涨跌色 */
.radar-metric__delta.is-flat {
  color: var(--el-text-color-secondary);
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

  &__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
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
