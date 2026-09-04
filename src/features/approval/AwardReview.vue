<script setup lang="ts">
/**
 * AwardBoard - 奖项看板（三个之星报名）
 *
 * 统计总览 + 奖项类型分布 + 提交状态分布 + 学期趋势 + 参与度网格。
 * 数据源：GET /awards/overview（真实聚合统计，字段与后端一致）。
 */
import { Check, CircleCheck, Clock, Medal, Plus, TrendingUp, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAwardsOverview } from '@/shared/api/awards'
import { APPLICATION_STATUS } from '@/shared/constants/dict'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import PieChart from './components/PieChart.vue'
import TrendChart from './components/TrendChart.vue'

const router = useRouter()

/** GET /awards/overview 返回结构 */
interface AwardsOverview {
  totalSubmissions: number
  pendingReview: number
  approved: number
  newThisSemester: number
  typeDistribution: Record<string, number>
  statusDistribution: Record<string, number>
  semesterTrend: Array<{ semesterId: number; semesterName: string; count: number }>
}

const overview = ref<AwardsOverview | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    overview.value = await getAwardsOverview()
  } finally {
    loading.value = false
  }
})

const totalCount = computed(() => overview.value?.totalSubmissions ?? 0)
const pendingCount = computed(() => overview.value?.pendingReview ?? 0)
const approvedCount = computed(() => overview.value?.approved ?? 0)
const newThisSemester = computed(() => overview.value?.newThisSemester ?? 0)

/** 后端 typeDistribution key（下划线）→ 中文名 */
const STAR_TYPE_LABELS: Record<string, string> = {
  competition_star: '竞赛之星',
  research_star: '科研之星',
  innovation_star: '双创之星',
}

const typeData = computed(() =>
  Object.entries(overview.value?.typeDistribution ?? {})
    .map(([key, value]) => ({ name: STAR_TYPE_LABELS[key] ?? key, value }))
    .filter((d) => d.value > 0),
)

const statusData = computed(() => {
  const statusMap = APPLICATION_STATUS as Record<string, { label: string }>
  return Object.entries(overview.value?.statusDistribution ?? {})
    .map(([key, value]) => ({ name: statusMap[key]?.label ?? key, value }))
    .filter((d) => d.value > 0)
})

const trendData = computed(() =>
  (overview.value?.semesterTrend ?? [])
    .map((t) => ({ semester: t.semesterName, count: t.count }))
    .filter((t) => t.semester),
)

const STAR_TYPES_CONFIG = [
  { key: 'competition_star', label: '竞赛之星', path: '/awards/competition-star' },
  { key: 'research_star', label: '科研之星', path: '/awards/scientific-star' },
  { key: 'innovation_star', label: '双创之星', path: '/awards/innovation-star' },
]

const completenessList = computed(() =>
  STAR_TYPES_CONFIG.map((cfg) => ({
    ...cfg,
    hasData: (overview.value?.typeDistribution?.[cfg.key] ?? 0) > 0,
  })),
)

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <PageContainer>
    <PageHeader title="奖项看板" subtitle="总览各之星报名情况，快速了解参与度" />

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
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
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">待审核</p>
              <p class="stat-card__value">{{ pendingCount }}</p>
            </div>
            <div class="stat-card__icon stat-card__icon--warning"><Clock :size="24" /></div>
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
            <div class="stat-card__icon stat-card__icon--success"><CircleCheck :size="24" /></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">本学期新增</p>
              <p class="stat-card__value">{{ newThisSemester }}</p>
            </div>
            <div class="stat-card__icon stat-card__icon--primary"><TrendingUp :size="24" /></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12"><PieChart :data="typeData" title="奖项类型分布" /></el-col>
      <el-col :span="12"><PieChart :data="statusData" title="提交状态分布" /></el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24"><TrendChart :data="trendData" title="各学期报名趋势" /></el-col>
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

    &--warning {
      background: #e6a23c15;
      color: #e6a23c;
    }
    &--success {
      background: #67c23a15;
      color: #67c23a;
    }
    &--primary {
      background: #409eff15;
      color: var(--el-color-primary);
    }
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
