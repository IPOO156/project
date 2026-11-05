<script setup lang="ts">
/**
 * PieChart - 看板环形图组件
 *
 * 展示类型/状态分布占比，与 BoardCharts / TrendChart 同风格。
 */
import { PieChart as EChartsPie } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
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
    title: '分布',
  },
)

use([CanvasRenderer, EChartsPie, TooltipComponent, LegendComponent])

interface ChartItem {
  name: string
  value: number
}

/** 项目浅色系配色，与看板整体一致 */
const COLORS = ['#2d5a87', '#10b981', '#e6a23c', '#ef4444', '#8b5cf6', '#06b6d4']

const option = computed(() => ({
  tooltip: {
    trigger: 'item' as const,
    formatter: '{b}: {c} ({d}%)',
  },
  legend: { bottom: 0, textStyle: { fontSize: 12, color: '#64748b' } },
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 }, scale: false },
      data: props.data
        .filter((d) => d.value > 0)
        .map((d, i) => ({
          ...d,
          itemStyle: { color: COLORS[i % COLORS.length] },
        })),
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
