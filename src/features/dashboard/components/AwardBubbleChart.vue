<script setup lang="ts">
import dayjs from 'dayjs'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    data: AwardBubble[]
    isDark?: boolean
    height?: number
  }>(),
  {
    isDark: false,
    height: 280,
  },
)

use([CanvasRenderer, ScatterChart, TooltipComponent, LegendComponent, GridComponent])

export interface AwardBubble {
  name: string
  level: string
  score: number
  date: string
}

const LEVEL_SCORE: Record<string, number> = {
  国家级: 100,
  省部级: 80,
  省级: 80,
  校级: 60,
  院级: 40,
}

const LEVEL_COLOR: Record<string, string> = {
  国家级: '#e6a23c',
  省部级: '#2d5a87',
  省级: '#2d5a87',
  校级: '#67c23a',
  院级: '#909399',
}

const textColor = computed(() => (props.isDark ? '#94a3b8' : '#64748b'))
const axisColor = computed(() => (props.isDark ? '#334155' : '#e2e8f0'))
const tooltipBg = computed(() =>
  props.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(17, 24, 39, 0.92)',
)

function getLevelScore(level: string): number {
  return LEVEL_SCORE[level] ?? 20
}

function getLevelColor(level: string): string {
  return LEVEL_COLOR[level] ?? '#909399'
}

const minDate = computed(() => {
  if (props.data.length === 0) return dayjs()
  return props.data.reduce((min, item) => {
    const current = dayjs(item.date)
    return current.isBefore(min) ? current : min
  }, dayjs(props.data[0].date))
})

const scatterData = computed(() => {
  return props.data.map((item) => {
    const months = dayjs(item.date).diff(minDate.value, 'month', true)
    const score = getLevelScore(item.level)
    return {
      name: item.name,
      level: item.level,
      date: item.date,
      value: [months, score, score / 4 + 8],
      itemStyle: { color: getLevelColor(item.level) },
    }
  })
})

const legendData = computed(() => {
  const levels = Array.from(new Set(props.data.map((d) => d.level)))
  return levels.map((level) => ({
    name: level,
    icon: 'circle',
    itemStyle: { color: getLevelColor(level) },
  }))
})

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: tooltipBg.value,
    borderWidth: 0,
    textStyle: { color: '#fff' },
    formatter: (params: any) => {
      const d = params.data
      return `<div style="font-weight:600;margin-bottom:4px;">${d.name}</div>
              <div>级别：${d.level}</div>
              <div>时间：${d.date}</div>`
    },
  },
  legend: {
    data: legendData.value.map((l) => l.name),
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: textColor.value, fontSize: 12 },
  },
  grid: {
    left: 56,
    right: 24,
    top: 24,
    bottom: 44,
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    name: '时间轴（月）',
    nameTextStyle: { color: textColor.value, fontSize: 12 },
    splitLine: { lineStyle: { color: axisColor.value, type: 'dashed' } },
    axisLine: { lineStyle: { color: axisColor.value } },
    axisLabel: { color: textColor.value, fontSize: 12, formatter: '{value} 月' },
    min: 0,
  },
  yAxis: {
    type: 'value',
    name: '影响力',
    nameTextStyle: { color: textColor.value, fontSize: 12 },
    min: 0,
    max: 120,
    splitLine: { lineStyle: { color: axisColor.value, type: 'dashed' } },
    axisLine: { lineStyle: { color: axisColor.value } },
    axisLabel: { color: textColor.value, fontSize: 12 },
  },
  series: [
    {
      type: 'scatter',
      symbolSize: (data: number[]) => data[2],
      data: scatterData.value,
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    },
  ],
}))
</script>

<template>
  <VChart
    class="award-bubble-chart"
    :option="option"
    :style="{ height: `${height}px` }"
    autoresize
  />
</template>

<style scoped lang="scss">
.award-bubble-chart {
  width: 100%;
}
</style>
