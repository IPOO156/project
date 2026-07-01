<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import UiCard from '../../../components/ui/UiCard.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import { studentArchiveCategories } from '../../student/nav'
import { useArchiveStore } from '../../student/archiveStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const { records, stats, categorySummary } = useArchiveStore()
const chartRef = ref(null)
const chartInstance = ref(null)

const reviewRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.ok / stats.value.total) * 100)
})

const chartData = computed(() => ({
  categories: studentArchiveCategories.map(c => c.label),
  counts: studentArchiveCategories.map(c =>
    records.value.filter(r => r.category === c.key).length
  ),
}))

const semesterDistribution = computed(() => {
  const map = {}
  records.value.forEach(r => {
    map[r.semester] = (map[r.semester] || 0) + 1
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})

const topCategories = computed(() =>
  categorySummary.value
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
)

async function renderChart() {
  await nextTick()
  if (!chartRef.value) return

  try {
    const echarts = (await import('echarts')).default
    if (chartInstance.value) chartInstance.value.dispose()
    chartInstance.value = echarts.init(chartRef.value)

    chartInstance.value.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: chartData.value.categories,
        axisLabel: { fontSize: 11, color: '#64748b', interval: 0, rotate: 30 },
        axisLine: { lineStyle: { color: '#dde3ea' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#eef1f4' } },
        axisLabel: { fontSize: 11, color: '#64748b' },
      },
      series: [{
        type: 'bar',
        data: chartData.value.counts,
        itemStyle: {
          color: '#1a8a7a',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: { color: '#0f5c51' },
        },
      }],
    })
  } catch {}
}

onMounted(renderChart)
watch(() => records.value.length, renderChart)
</script>

<template>
  <div class="statsPage">
    <div class="pageHeader">
      <div>
        <h1 class="pageTitle">统计分析</h1>
        <p class="pageSub">档案数据可视化展示</p>
      </div>
    </div>

    <div class="summaryGrid">
      <UiCard class="summaryCard">
        <div class="summaryVal">{{ stats.total }}</div>
        <div class="summaryLabel">档案总数</div>
      </UiCard>
      <UiCard class="summaryCard">
        <div class="summaryVal">{{ stats.fileTotal }}</div>
        <div class="summaryLabel">材料总数</div>
      </UiCard>
      <UiCard class="summaryCard">
        <div class="summaryVal">{{ reviewRate }}%</div>
        <div class="summaryLabel">通过率</div>
      </UiCard>
      <UiCard class="summaryCard">
        <div class="summaryVal">{{ semesterDistribution.length }}</div>
        <div class="summaryLabel">覆盖学期</div>
      </UiCard>
    </div>

    <div class="grid2">
      <UiCard padding="lg" class="chartCard">
        <div class="cardHeader">
          <h2 class="cardTitle">分类统计</h2>
        </div>
        <div ref="chartRef" class="chart"></div>
      </UiCard>

      <UiCard padding="lg">
        <div class="cardHeader">
          <h2 class="cardTitle">分类排名</h2>
        </div>
        <div class="rankList">
          <div
            v-for="(cat, i) in topCategories"
            :key="cat.key"
            class="rankItem"
            @click="router.push(`/student/archive/${cat.key}`)"
          >
            <span class="rankNum" :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }">
              {{ i + 1 }}
            </span>
            <LineIcon :name="cat.icon" :size="14" />
            <span class="rankLabel">{{ cat.label }}</span>
            <span class="rankCount">{{ cat.count }} 项</span>
            <div class="rankBar">
              <div class="rankBarFill" :style="{ width: `${(cat.count / topCategories[0]?.count || 1) * 100}%` }"></div>
            </div>
          </div>
          <div v-if="topCategories.length === 0" class="emptySmall">暂无数据</div>
        </div>
      </UiCard>
    </div>

    <UiCard padding="lg">
      <div class="cardHeader">
        <h2 class="cardTitle">学期分布</h2>
      </div>
      <div class="semesterList">
        <div v-for="[semester, count] in semesterDistribution" :key="semester" class="semesterItem">
          <span class="semesterLabel">{{ semester }}</span>
          <div class="semesterBarWrap">
            <div class="semesterBar" :style="{ width: `${(count / semesterDistribution[0][1]) * 100}%` }"></div>
            <span class="semesterCount">{{ count }} 条</span>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.statsPage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.pageTitle { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.pageSub { font-size: 14px; color: var(--muted); }

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.summaryCard {
  text-align: center;
  padding: 20px !important;
}

.summaryVal {
  font-size: 32px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1.1;
  margin-bottom: 4px;
}

.summaryLabel { font-size: 13px; color: var(--muted); }

.grid2 {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 18px;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cardTitle { font-size: 16px; font-weight: 700; }

.chartCard { min-height: 320px; }

.chart {
  width: 100%;
  height: 280px;
}

.rankList { display: flex; flex-direction: column; gap: 8px; }

.rankItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.rankItem:hover { background: var(--bg); }

.rankNum {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  background: var(--bg);
  color: var(--muted);
  flex-shrink: 0;
}

.rankNum.gold { background: #fef3c7; color: #b45309; }
.rankNum.silver { background: #f1f5f9; color: #475467; }
.rankNum.bronze { background: #fef2e6; color: #c2410c; }

.rankLabel { flex: 1; font-size: 13px; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rankCount { font-size: 12px; color: var(--muted); font-weight: 600; flex-shrink: 0; }

.rankBar { width: 80px; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
.rankBarFill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }

.emptySmall { padding: 24px; text-align: center; color: var(--muted); }

.semesterList { display: flex; flex-direction: column; gap: 12px; }

.semesterItem {
  display: flex;
  align-items: center;
  gap: 16px;
}

.semesterLabel {
  width: 200px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.semesterBarWrap {
  flex: 1;
  height: 30px;
  background: var(--bg);
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}

.semesterBar {
  height: 100%;
  background: var(--accent-light);
  border-radius: var(--radius);
  transition: width 0.6s ease;
}

.semesterCount {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-dark);
}

@media (max-width: 1200px) {
  .summaryGrid { grid-template-columns: repeat(2, 1fr); }
  .grid2 { grid-template-columns: 1fr; }
}
</style>
