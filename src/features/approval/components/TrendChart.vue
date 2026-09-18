<script setup lang="ts">
/**
 * TrendChart - 学期趋势折线图
 *
 * 展示各学期申报/报名数量的变化趋势。
 */
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    data?: TrendItem[]
    title?: string
  }>(),
  {
    data: () => [],
    title: '学期趋势',
  },
)

use([CanvasRenderer, LineChart, TooltipComponent, GridComponent])

interface TrendItem {
  semester: string
  count: number
}

function formatSemester(s: string): string {
  return s.replace(/-(\d)$/, '第$1学期')
}

const option = computed(() => ({
  tooltip: {
    trigger: 'axis' as const,
    formatter: (params: any) => {
      const p = params[0]
      return `${formatSemester(p.name)}<br/>提交数：${p.value}`
    },
  },
  grid: { left: 50, right: 20, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: props.data.map((d) => formatSemester(d.semester)),
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: { fontSize: 11, color: '#64748b' },
  },
  yAxis: {
    type: 'value' as const,
    minInterval: 1,
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  series: [
    {
      type: 'line',
      data: props.data.map((d) => d.count),
      smooth: true,
      lineStyle: { width: 2.5, color: '#2d5a87' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45, 90, 135, 0.15)' },
            { offset: 1, color: 'rgba(45, 90, 135, 0.01)' },
          ],
        },
      },
      itemStyle: { color: '#2d5a87' },
      symbol: 'circle' as const,
      symbolSize: 6,
    },
  ],
}))
</script>

<template>
  <el-card class="trend-card">
    <template #header>
      <span class="trend-title">{{ title }}</span>
    </template>
    <VChart v-if="data.length" :option="option" class="chart" autoresize />
    <el-empty v-else description="暂无数据" :image-size="60" />
  </el-card>
</template>

<style scoped lang="scss">
.trend-card {
  margin-bottom: 16px;

  .trend-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
  }
}

.chart {
  width: 100%;
  height: 240px;
}
</style>
