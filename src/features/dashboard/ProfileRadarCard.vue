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

const radarLegendItems = computed(() => {
  const items = [
    { label: '当前画像', color: '#2d5a87' },
    { label: '目标值', color: '#94a3b8' },
  ]
  if (hasAnyComparison.value) items.push({ label: '上一阶段', color: '#a855f7' })
  return items
})

/** 进度条百分比：分数按 0–100 截断，避免数据异常时轨道溢出 */
function clampScore(value: number) {
  return Math.max(0, Math.min(100, value))
}

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
    radar: {
      radius: '70%',
      center: ['50%', '50%'],
      splitNumber: 5,
      axisName: {
        color: radarTextColor.value,
        fontSize: 12,
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
  <section class="profile-card" aria-label="多维度画像评估">
    <header class="profile-card__head">
      <h2 class="profile-card__title">多维度画像评估</h2>
      <span class="profile-card__meta">
        规则版本 {{ indicatorMeta.ruleVersion }} · 计算时间 {{ indicatorMeta.calculatedAt }} ·
        数据完整度
        {{ indicatorMeta.completeness }}
      </span>
      <button type="button" class="link-btn" @click="emit('viewProfile')">查看档案概览</button>
    </header>

    <div
      class="profile-card__body"
      :class="{ 'profile-card__body--empty': profileSummary.length === 0 }"
    >
      <div class="profile-chart">
        <div
          class="profile-chart__canvas"
          role="button"
          tabindex="0"
          aria-label="查看个人档案"
          @click="emit('viewProfile')"
          @keydown.enter="emit('viewProfile')"
          @keydown.space.prevent="emit('viewProfile')"
        >
          <VChart
            v-if="radarOption"
            class="profile-chart__echart"
            :option="radarOption"
            autoresize
          />
          <div v-else class="profile-chart__empty">
            <svg class="profile-chart__grid" viewBox="0 0 120 100" aria-hidden="true">
              <polygon points="60,8 110,44 91,92 29,92 10,44" />
              <polygon points="60,26 94,51 81,84 39,84 26,51" />
              <polygon points="60,44 78,58 71,76 49,76 42,58" />
              <line x1="60" y1="8" x2="60" y2="92" />
              <line x1="110" y1="44" x2="29" y2="92" />
              <line x1="91" y1="92" x2="10" y2="44" />
            </svg>
            <p class="profile-chart__empty-title">暂无维度数据</p>
            <p class="profile-chart__empty-sub">完成首次评估后生成五维画像</p>
          </div>
        </div>
        <div v-if="radarOption" class="profile-chart__legend">
          <span v-for="item in radarLegendItems" :key="item.label">
            <i :style="{ background: item.color }" />{{ item.label }}
          </span>
        </div>
      </div>

      <div v-if="profileSummary.length > 0" class="dims">
        <div v-for="item in profileSummary" :key="item.label" class="dim">
          <div class="dim__top">
            <span class="dim__label">{{ item.label }}</span>
            <span class="dim__score">{{ item.current }}<i>分</i></span>
            <span v-if="item.hasBaseline" class="dim__delta" :class="item.deltaClass">
              {{ item.deltaLabel }} {{ item.deltaSign }}{{ item.deltaFromPrevious }}分
            </span>
            <span v-else class="dim__delta is-flat">暂无环比数据</span>
            <button type="button" class="dim__ask" @click="emit('openIndicator', item.label)">
              查看计算说明
            </button>
          </div>
          <div class="dim__track">
            <span class="dim__fill" :style="{ width: `${clampScore(item.current)}%` }" />
            <span class="dim__target" :style="{ left: `${clampScore(item.target)}%` }" />
          </div>
          <div class="dim__gap">距目标 {{ item.gapToTarget }}分</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.profile-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.profile-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.profile-card__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.profile-card__meta {
  min-width: 0;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-btn {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: $font-size-base;
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

.profile-card__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  padding: 8px 16px 12px;
}

.profile-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

// 空态没有右侧五维列表，让空态图形占满整行居中，避免右侧留下大片空白
.profile-card__body--empty {
  grid-template-columns: minmax(0, 1fr);
}

.profile-chart__canvas {
  cursor: pointer;
}

.profile-chart__echart {
  width: 300px;
  height: 186px;
}

.profile-chart__empty {
  width: 300px;
  height: 186px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-placeholder);
}

.profile-chart__grid {
  width: 104px;
  height: 86px;
  fill: none;
  stroke: var(--el-border-color);
  stroke-width: 1.2;
  stroke-dasharray: 3 3;
}

.profile-chart__empty-title {
  margin: 4px 0 0;
  font-size: $font-size-base;
  color: var(--el-text-color-secondary);
}

.profile-chart__empty-sub {
  margin: 0;
  font-size: $font-size-xs;
}

.profile-chart__legend {
  display: flex;
  gap: 14px;
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  i {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    display: inline-block;
  }
}

.dims {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 14px;
  align-content: stretch;
  min-width: 0;
}

.dim {
  min-width: 0;
  padding: 3px 10px 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;

  // 五维数据在 2 列里会多出一个：让第 5 个占满整行，避免留下半排空白
  &:nth-child(5) {
    grid-column: 1 / -1;
  }

  &__top {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
  }

  &__label {
    flex: 1;
    min-width: 0;
    font-size: $font-size-base;
    color: var(--el-text-color-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__score {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    i {
      margin-left: 1px;
      font-size: $font-size-xs;
      font-weight: 400;
      font-style: normal;
      color: var(--el-text-color-placeholder);
    }
  }

  &__delta {
    font-size: $font-size-xs;
    white-space: nowrap;

    &.is-up {
      color: #16a34a;
    }

    &.is-down {
      color: #dc2626;
    }

    /* 持平 / 无环比基线：沿用父级次级文字色，不套用涨跌色 */
    &.is-flat {
      color: var(--el-text-color-secondary);
    }
  }

  &__ask {
    padding: 0;
    border: 0;
    background: transparent;
    font-size: $font-size-xs;
    color: var(--el-color-primary);
    cursor: pointer;
    white-space: nowrap;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }

  &__track {
    position: relative;
    height: 6px;
    margin-top: 4px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    overflow: hidden;
  }

  &__fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: var(--el-color-primary);
  }

  &__target {
    position: absolute;
    top: -1px;
    width: 2px;
    height: 7px;
    background: var(--el-text-color-secondary);
  }

  &__gap {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
  }
}

@media (max-width: 1200px) {
  .profile-card__body {
    grid-template-columns: 1fr;
  }

  .profile-chart__echart,
  .profile-chart__empty {
    width: 100%;
    height: 260px;
  }
}

@media (max-width: 768px) {
  .profile-card__meta {
    display: none;
  }

  .dims {
    grid-template-columns: 1fr;
  }

  .dim:nth-child(5) {
    grid-column: auto;
  }

  .dims__foot {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
