<script setup lang="ts">
/**
 * AwardBoard - 奖项看板
 *
 * 统计总览 + 柱状图 + 学期趋势 + 完整度网格。
 */
import { Check, Medal, Plus, TrendingUp, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import BoardCharts from './components/BoardCharts.vue'
import TrendChart from './components/TrendChart.vue'
import { useStarMockData } from './composables/useStarMockData'

const router = useRouter()
const allData = useStarMockData()

const totalCount = computed(() => allData.value.length)
const currentSemester = computed(() => {
  const sorted = [...allData.value].sort((a, b) => b.submitDate?.localeCompare(a.submitDate) || 0)
  return sorted[0]?.semester || '2024-2025-2'
})
const semesterCount = computed(
  () => allData.value.filter((r) => r.semester === currentSemester.value).length,
)

const STAR_TYPE_LABELS: Record<string, string> = {
  competitionStar: '竞赛之星',
  scientificProject: '科研之星（项目）',
  softwareCopyright: '科研之星（软著）',
  paper: '科研之星（论文）',
  innovationStar: '双创之星',
}

const typeData = computed(() => {
  const map = new Map<string, number>()
  allData.value.forEach((r) => {
    const label = STAR_TYPE_LABELS[r.type] || r.typeLabel || r.type
    map.set(label, (map.get(label) || 0) + 1)
  })
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
})

const trendData = computed(() => {
  const map = new Map<string, number>()
  allData.value.forEach((r) => {
    if (r.semester) map.set(r.semester, (map.get(r.semester) || 0) + 1)
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([semester, count]) => ({ semester, count }))
})

const STAR_TYPES_CONFIG = [
  { key: 'competitionStar', label: '竞赛之星', path: '/awards/competition-star' },
  { key: 'scientificStar', label: '科研之星', path: '/awards/scientific-star' },
  { key: 'innovationStar', label: '双创之星', path: '/awards/innovation-star' },
]
const SCIENTIFIC_SUB_TYPES = ['scientificProject', 'softwareCopyright', 'paper']

const completenessList = computed(() => {
  return STAR_TYPES_CONFIG.map((cfg) => {
    let hasData = false
    if (cfg.key === 'scientificStar')
      hasData = allData.value.some((r) => SCIENTIFIC_SUB_TYPES.includes(r.type))
    else hasData = allData.value.some((r) => r.type === cfg.key)
    return { ...cfg, hasData }
  })
})

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <PageContainer>
    <PageHeader title="奖项看板" subtitle="总览各之星报名情况，快速了解参与度" />

    <el-row :gutter="16" class="stats-row">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">报名总数</p>
              <p class="stat-card__value">{{ totalCount }}</p>
            </div>
            <div class="stat-card__icon"><Medal :size="24" /></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">本学期新增</p>
              <p class="stat-card__value">{{ semesterCount }}</p>
            </div>
            <div class="stat-card__icon"><TrendingUp :size="24" /></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="14"><BoardCharts :data="typeData" title="各类型报名数量" /></el-col>
      <el-col :span="10"><TrendChart :data="trendData" title="各学期报名趋势" /></el-col>
    </el-row>

    <el-card class="completeness-card">
      <template #header>
        <div class="completeness-header">
          <span class="completeness-title">参与度总览</span>
          <span class="completeness-sub"
            >已参与 {{ completenessList.filter((c) => c.hasData).length }}/{{
              completenessList.length
            }}
            项</span
          >
        </div>
      </template>
      <el-row :gutter="12">
        <el-col v-for="item in completenessList" :key="item.key" :span="8" class="completeness-col">
          <div
            class="completeness-item"
            :class="{ 'is-filled': item.hasData }"
            @click="goTo(item.path)"
          >
            <div class="completeness-item__icon">
              <Check v-if="item.hasData" :size="18" class="check" />
              <X v-else :size="18" class="cross" />
            </div>
            <div class="completeness-item__label">{{ item.label }}</div>
            <el-button
              :type="item.hasData ? 'primary' : 'default'"
              size="small"
              link
              @click.stop="goTo(item.path)"
            >
              {{ item.hasData ? '查看' : '去报名' }}
              <Plus :size="12" style="margin-left: 2px" />
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>
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
    margin-bottom: 4px;
  }
  &__value {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
  }
  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
.completeness-card {
  margin-bottom: 16px;
}
.completeness-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.completeness-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.completeness-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.completeness-col {
  margin-bottom: 12px;
}
.completeness-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  &:hover {
    border-color: #94a3b8;
    background: #fff;
  }
  &.is-filled {
    border-color: #d4edda;
    background: #f0fdf4;
    &:hover {
      border-color: #10b981;
    }
    .check {
      color: #10b981;
    }
  }
  .cross {
    color: #94a3b8;
  }
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
  }
  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-align: center;
  }
}
</style>
