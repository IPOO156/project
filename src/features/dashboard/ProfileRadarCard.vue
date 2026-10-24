<script setup lang="ts">
import type { ProfileDimension } from '@/shared/types/types'
import { RadarChart } from 'echarts/charts'
import { LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { useThemeStore } from '@/app/stores/stores'

const props = defineProps<{
  dimensions: ProfileDimension[]
  comparedSemesterMap: Map<string, string>
  hasPreviousFromApi: boolean | null
  indicatorMeta: { ruleVersion: string; calculatedAt: string; completeness: string }
}>()

const emit = defineEmits<{
  (e: 'viewProfile'): void
  (e: 'openIndicator', label: string): void
}>()

use([CanvasRenderer, RadarComponent, RadarChart, TooltipComponent, LegendComponent])

const themeStore = useThemeStore()

const hasProfileDimensions = computed(() => props.dimensions.length > 0)

/**
 * 维度画像 + 环比文案。
 *
 * 判据取 `comparedSemesterId != null`（id 是权威键，学期名仅用于展示）：
 * 后端在无上期数据时返回 `comparedSemesterId: null`、`comparedSemesterName: null`，
 * 但 `radarChart.previous` 仍是 `[0,0,0]` 而非 null。若拿它直接相减，会得到
 * 「较上阶段 +20分」这种**前端编造出来的趋势**（把「没有上期数据」当成了「上期考 0 分」）。
 * 这与 app/stores/archive.ts 中「无环比数据时 previous 与 current 相同（前端不编造趋势）」
 * 的既有口径一致 —— store 层做了防护，此处这条路径此前绕过了它。
 *
 * 后端已在 `radarChart` 下发显式开关 `hasPrevious`（见 3.1 雷达图环比口径），
 * 该开关为 boolean 时即为**权威判据**（父页面以 hasPreviousFromApi 传入）；
 * 对比学期 Map 退为「取对比学期名做文案」的用途，不再单独决定有无基线。
 */
const profileSummary = computed(() => {
  const comparedMap = props.comparedSemesterMap
  const apiHasPrevious = props.hasPreviousFromApi
  return props.dimensions.map((item) => {
    // 无环比基线时不产出任何环比文案与颜色，模板据此不渲染该区域（前端不编造趋势）。
    // 后端给了显式开关就以它为准；开关缺省（老后端）时才退回「对比学期名是否存在」。
    const comparedSemesterName = comparedMap.get(item.label)
    const hasBaseline = apiHasPrevious ?? comparedSemesterName != null
    const deltaFromPrevious = hasBaseline ? item.current - item.previous : 0
    return {
      label: item.label,
      current: item.current,
      target: item.target,
      previous: item.previous,
      hasBaseline,
      deltaFromPrevious,
      // 开关为 true 但某维度没给对比学期名时退回通用文案，避免拼出「较undefined学期」
      deltaLabel: hasBaseline ? `较${comparedSemesterName ?? '上阶段'}学期` : '',
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
 * 画出来就是一条贴在圆心的假基线（与「较上阶段 +20分」同源，见 profileSummary）。
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
      indicator: props.dimensions.map((item) => ({
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
            value: props.dimensions.map((item) => item.current),
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
            value: props.dimensions.map((item) => item.target),
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
                  value: props.dimensions.map((item) => item.previous),
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
</script>

<template>
  <el-card class="dashboard__section dashboard__section--radar">
    <template #header>
      <div class="dashboard__section-header">
        <span class="section-title">多维度画像评估</span>
        <span class="indicator-meta">
          规则版本 {{ indicatorMeta.ruleVersion }} · 计算时间 {{ indicatorMeta.calculatedAt }} ·
          数据完整度 {{ indicatorMeta.completeness }}
          <el-button link type="primary" @click="emit('viewProfile')">查看档案概览</el-button>
        </span>
      </div>
    </template>
    <div class="radar-panel">
      <div class="radar-panel__chart-wrap" @click="emit('viewProfile')">
        <VChart v-if="radarOption" class="radar-panel__chart" :option="radarOption" autoresize />
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
                @click="emit('openIndicator', item.label)"
                >查看计算说明</el-button
              >
            </div>
          </div>
          <div class="radar-metric__meta">
            <span v-if="item.hasBaseline" class="radar-metric__delta" :class="item.deltaClass">
              {{ item.deltaLabel }} {{ item.deltaSign }}{{ item.deltaFromPrevious }}分
            </span>
            <span v-else class="radar-metric__delta is-flat">暂无环比数据</span>
            <span class="radar-metric__gap">距目标 {{ item.gapToTarget }}分</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.dashboard__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
