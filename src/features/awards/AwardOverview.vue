<script setup lang="ts">
import VChart from 'vue-echarts'
import { computed, onMounted, ref } from 'vue'
import { Award, CircleCheck, Clock, TrendingUp } from 'lucide-vue-next'
import { useSubmissionStore } from '@/app/stores/stores'
import { APPLICATION_TYPE_MAP, APPLICATION_STATUS } from '@/shared/constants/dict'
import type { SubmissionRecord } from '@/shared/types/types'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

const submissionStore = useSubmissionStore()

// ── 统计数据 ──
const totalCount = computed(() => submissionStore.filteredRecords.length)
const pendingCount = computed(() => submissionStore.filteredRecords.filter(r => r.status === 'submitted').length)
const approvedCount = computed(() => submissionStore.filteredRecords.filter(r => r.status === 'approved').length)

// 本学期新增（取最新学期）
const currentSemester = computed(() => {
  const sorted = [...submissionStore.filteredRecords].sort((a, b) => b.submitDate.localeCompare(a.submitDate))
  return sorted[0]?.semester ?? '2024-2025-1'
})
const semesterCount = computed(() =>
  submissionStore.filteredRecords.filter(r => r.semester === currentSemester.value).length,
)

// ── 饼图：按奖项类型分布（只统计奖项报名模块） ──
const awardTypes = ['competitionStar', 'innovationStar', 'scientificProject', 'softwareCopyright', 'paper']
const pieOption = computed(() => {
  const typeMap = APPLICATION_TYPE_MAP as Record<string, string>
  const data = awardTypes
    .map((type) => {
      const count = submissionStore.filteredRecords.filter(r => r.type === type).length
      return { name: typeMap[type] ?? type, value: count }
    })
    .filter(d => d.value > 0)

  return {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data,
    }],
  }
})

// ── 柱状图：按状态分布 ──
const barOption = computed(() => {
  const statusMap = APPLICATION_STATUS as Record<string, { label: string }>
  const statusList = ['draft', 'submitted', 'approved', 'rejected']
  const data = statusList.map((status) => {
    const count = submissionStore.filteredRecords.filter(r => r.status === status).length
    return { name: statusMap[status]?.label ?? status, value: count }
  })

  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: data.map(d => d.name), axisLabel: { fontSize: 12 } },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' },
          ],
        },
      },
      barWidth: 40,
    }],
  }
})

// ── 折线图：按学期趋势 ──
const lineOption = computed(() => {
  const semesterMap = new Map<string, number>()
  submissionStore.filteredRecords.forEach((r) => {
    semesterMap.set(r.semester, (semesterMap.get(r.semester) ?? 0) + 1)
  })
  const sorted = [...semesterMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: sorted.map(([s]) => s), axisLabel: { fontSize: 11, rotate: 15 } },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [{
      type: 'line',
      data: sorted.map(([, c]) => c),
      smooth: true,
      lineStyle: { width: 3, color: '#67c23a' },
      areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(103,194,58,0.25)' }, { offset: 1, color: 'rgba(103,194,58,0.02)' }] } },
      itemStyle: { color: '#67c23a' },
    }],
  }
})

// ── 最近动态 ──
const recentRecords = computed(() =>
  [...submissionStore.filteredRecords]
    .sort((a, b) => b.submitDate.localeCompare(a.submitDate))
    .slice(0, 6),
)

onMounted(() => {
  if (submissionStore.filteredRecords.length === 0)
    submissionStore.fetchRecords()
})
</script>

<template>
  <PageContainer>
    <PageHeader title="奖项总览" subtitle="奖项报名数据的可视化概览" />

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">总提交数</p>
              <p class="stat-card__value">{{ totalCount }}</p>
            </div>
            <div class="stat-card__icon" style="background: #409eff15; color: #409eff">
              <Award :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">待审核</p>
              <p class="stat-card__value">{{ pendingCount }}</p>
            </div>
            <div class="stat-card__icon" style="background: #e6a23c15; color: #e6a23c">
              <Clock :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">已通过</p>
              <p class="stat-card__value">{{ approvedCount }}</p>
            </div>
            <div class="stat-card__icon" style="background: #67c23a15; color: #67c23a">
              <CircleCheck :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">本学期新增</p>
              <p class="stat-card__value">{{ semesterCount }}</p>
            </div>
            <div class="stat-card__icon" style="background: #1e3a5f15; color: #1e3a5f">
              <TrendingUp :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 饼图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">奖项类型分布</span>
          </template>
          <VChart :option="pieOption" class="chart" autoresize />
        </el-card>
      </el-col>

      <!-- 柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">提交状态分布</span>
          </template>
          <VChart :option="barOption" class="chart" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 折线图 -->
      <el-col :span="14">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">学期提交趋势</span>
          </template>
          <VChart :option="lineOption" class="chart" autoresize />
        </el-card>
      </el-col>

      <!-- 最近动态 -->
      <el-col :span="10">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">近期报名动态</span>
          </template>
          <div class="activities">
            <div
              v-for="(rec, idx) in recentRecords"
              :key="idx"
              class="activity-item"
            >
              <div class="activity-item__dot" :class="`activity-item__dot--${rec.status}`" />
              <div class="activity-item__content">
                <p class="activity-item__text">{{ rec.title }}</p>
                <span class="activity-item__meta">{{ rec.typeLabel }} · {{ rec.submitDate }}</span>
              </div>
              <StatusTag :status="rec.status" size="small" />
            </div>
            <el-empty v-if="recentRecords.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </PageContainer>
</template>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.chart-card {
  margin-bottom: 16px;

  .chart-title {
    font-size: 15px;
    font-weight: 600;
  }
}

.chart {
  width: 100%;
  height: 280px;
}

.activities {
  max-height: 280px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-light);

  &:last-child {
    border-bottom: none;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--draft { background: #909399; }
    &--submitted { background: #e6a23c; }
    &--approved { background: #67c23a; }
    &--rejected { background: #f56c6c; }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__text {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
