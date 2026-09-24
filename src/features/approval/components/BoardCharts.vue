<script setup lang="ts">
/**
 * BoardCharts - 看板图表组件
 *
 * 使用柱状图展示各类型数量对比，配色使用项目浅色系。
 */
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    data?: ChartItem[]
    title?: string
  }>(),
  {
    data: () => [],
    title: '类型分布',
  },
)

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent])

interface ChartItem {
  name: string
  value: number
}

const option = computed(() => ({
  tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
  grid: { left: 50, right: 20, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: props.data.map((d) => d.name),
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: {
      fontSize: 12,
      color: '#64748b',
      interval: 0,
      rotate: props.data.length > 6 ? 25 : 0,
    },
  },
  yAxis: {
    type: 'value' as const,
    minInterval: 1,
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  series: [
    {
      type: 'bar',
      data: props.data.map((d) => ({
        value: d.value,
        itemStyle: {
          color: '#2d5a87',
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barWidth: 32,
    },
  ],
}))
</script>

<template>
  <el-card class="chart-card">
    <template #header>
      <span class="chart-title">{{ title }}</span>
    </template>
    <VChart v-if="data.length" :option="option" class="chart" autoresize />
    <el-empty v-else description="暂无数据" :image-size="60" />
  </el-card>
</template>

<style scoped lang="scss">
.chart-card {
  margin-bottom: 16px;

  .chart-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
  }
}

.chart {
  width: 100%;
  height: 280px;
}
</style>
