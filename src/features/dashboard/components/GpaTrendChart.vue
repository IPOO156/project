<script setup lang="ts">
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    data: GpaPoint[]
    isDark?: boolean
    height?: number
  }>(),
  {
    isDark: false,
    height: 280,
  },
)

use([CanvasRenderer, LineChart, TooltipComponent, LegendComponent, GridComponent])

export interface GpaPoint {
  semester: string
  gpa: number
  score: number
}

const textColor = computed(() => (props.isDark ? '#94a3b8' : '#64748b'))
const axisColor = computed(() => (props.isDark ? '#334155' : '#e2e8f0'))
const tooltipBg = computed(() =>
  props.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(17, 24, 39, 0.92)',
)

const semesters = computed(() =>
  props.data.map((item) => {
    const parts = item.semester.split('-')
    if (parts.length >= 3) {
      const year = parts[0].slice(-2)
      const term = parts[2] === '1' ? '上' : '下'
      return `${year}${term}`
    }
    return item.semester
  }),
)

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: tooltipBg.value,
    borderWidth: 0,
    textStyle: { color: '#fff' },
    formatter: (params: any[]) => {
      const semester = props.data[params[0].dataIndex]?.semester ?? ''
      const lines = params.map((p) => {
        const marker = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`
        return `${marker}${p.seriesName}: ${p.value}`
      })
      return `<div style="font-weight:600;margin-bottom:4px;">${semester}</div>${lines.join('<br>')}`
    },
  },
  legend: {
    data: ['绩点', '平均分'],
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: textColor.value, fontSize: 12 },
  },
  grid: {
    left: 56,
    right: 56,
    top: 40,
    bottom: 56,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: semesters.value,
    name: '学期',
    nameLocation: 'middle',
    nameGap: 32,
    axisLine: { lineStyle: { color: axisColor.value } },
    axisLabel: { color: textColor.value, fontSize: 12 },
    axisTick: { show: false },
    nameTextStyle: {
      color: textColor.value,
      fontSize: 12,
    },
  },
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 5,
      name: '绩点',
      nameTextStyle: {
        color: textColor.value,
        fontSize: 12,
        align: 'right',
        padding: [0, 8, 0, 0],
      },
      splitLine: { lineStyle: { color: axisColor.value, type: 'dashed' } },
      axisLabel: { color: textColor.value, fontSize: 12 },
      axisLine: { show: true, lineStyle: { color: axisColor.value } },
    },
    {
      type: 'value',
      min: 0,
      max: 100,
      name: '平均分',
      nameTextStyle: {
        color: textColor.value,
        fontSize: 12,
        align: 'left',
        padding: [0, 0, 0, 8],
      },
      splitLine: { show: false },
      axisLabel: { color: textColor.value, fontSize: 12 },
      axisLine: { show: true, lineStyle: { color: axisColor.value } },
    },
  ],
  series: [
    {
      name: '绩点',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      yAxisIndex: 0,
      data: props.data.map((item) => item.gpa),
      lineStyle: { color: '#2d5a87', width: 3 },
      itemStyle: { color: '#2d5a87', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45, 90, 135, 0.25)' },
            { offset: 1, color: 'rgba(45, 90, 135, 0.02)' },
          ],
        },
      },
    },
    {
      name: '平均分',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      yAxisIndex: 1,
      data: props.data.map((item) => item.score),
      lineStyle: { color: '#d4a574', width: 2 },
      itemStyle: { color: '#d4a574', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(212, 165, 116, 0.20)' },
            { offset: 1, color: 'rgba(212, 165, 116, 0.02)' },
          ],
        },
      },
    },
  ],
}))
</script>

<template>
  <div class="gpa-trend-chart">
    <VChart :option="option" :style="{ height: `${height}px` }" autoresize />
  </div>
</template>

<style scoped lang="scss">
.gpa-trend-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
