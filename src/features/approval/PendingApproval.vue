<script setup lang="ts">
/**
 * DeclarationBoard - 申报看板（个人档案信息申报）
 *
 * 统计总览 + 各类型申报数量 + 提交状态分布 + 学期趋势 + 档案完整度网格。
 * 数据源：submissionStore.filteredRecords（GET /activities 真实数据），仅统计 10 个申报类型。
 */
import { Check, CircleCheck, Clock, FileText, Plus, TrendingUp, X } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/app/stores/stores'
import { ARCHIVE_TYPE_ALIASES } from '@/shared/api/submission'
import { APPLICATION_STATUS } from '@/shared/constants/dict'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import BoardCharts from './components/BoardCharts.vue'
import PieChart from './components/PieChart.vue'
import { DECLARATION_TYPE_KEYS, DECLARATION_TYPE_LABELS } from './components/review-columns'
import TrendChart from './components/TrendChart.vue'

const router = useRouter()
const submissionStore = useSubmissionStore()

/** 后端 archive_type 别名 → 前端 type key（如 academic_competition → competition），对齐 useFormRecords */
const ALIAS_TO_TYPE: Record<string, string> = {}
for (const [type, aliases] of Object.entries(ARCHIVE_TYPE_ALIASES)) {
  ALIAS_TO_TYPE[type] = type
  for (const alias of aliases) ALIAS_TO_TYPE[alias] = type
}
const DECLARATION_TYPE_SET = new Set<string>(DECLARATION_TYPE_KEYS)

function normalizeType(type: string): string {
  return ALIAS_TO_TYPE[type] ?? type
}

/** 仅统计 10 个申报类型的真实记录 */
const declarationRecords = computed(() =>
  submissionStore.filteredRecords.filter((r) => DECLARATION_TYPE_SET.has(normalizeType(r.type))),
)

const totalCount = computed(() => declarationRecords.value.length)
const pendingCount = computed(
  () => declarationRecords.value.filter((r) => r.status === 'pending').length,
)
const approvedCount = computed(
  () => declarationRecords.value.filter((r) => r.status === 'approved').length,
)

const currentSemester = computed(() => {
  const sorted = [...declarationRecords.value].sort((a, b) =>
    b.submitDate.localeCompare(a.submitDate),
  )
  return sorted[0]?.semester || '2024-2025-2'
})
const semesterCount = computed(
  () => declarationRecords.value.filter((r) => r.semester === currentSemester.value).length,
)

const typeData = computed(() => {
  const map = new Map<string, number>()
  declarationRecords.value.forEach((r) => {
    const type = normalizeType(r.type)
    const label = DECLARATION_TYPE_LABELS[type] || type
    map.set(label, (map.get(label) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

const statusData = computed(() => {
  const statusMap = APPLICATION_STATUS as Record<string, { label: string }>
  const map = new Map<string, number>()
  declarationRecords.value.forEach((r) => {
    const label = statusMap[r.status]?.label ?? r.status
    map.set(label, (map.get(label) || 0) + 1)
  })
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
})

const trendData = computed(() => {
  const map = new Map<string, number>()
  declarationRecords.value.forEach((r) => {
    if (r.semester) map.set(r.semester, (map.get(r.semester) || 0) + 1)
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([semester, count]) => ({ semester, count }))
})

const completenessList = computed(() => {
  return DECLARATION_TYPE_KEYS.map((key) => {
    const label = DECLARATION_TYPE_LABELS[key] || key
    const hasData = declarationRecords.value.some((r) => normalizeType(r.type) === key)
    const pathMap: Record<string, string> = {
      competition: '/applications?tab=competition',
      innovation: '/applications?tab=innovation',
      research: '/applications?tab=research',
      scholarship: '/applications?tab=scholarship',
      certificate: '/applications?tab=certificate',
      internship: '/applications?tab=internship',
      organization: '/applications?tab=organization',
      training: '/applications?tab=training',
      socialPractice: '/applications?tab=social-practice',
      bookReport: '/applications?tab=book-report',
    }
    return { key, label, hasData, path: pathMap[key] || '/applications' }
  })
})

onMounted(() => {
  if (submissionStore.filteredRecords.length === 0) submissionStore.fetchRecords()
})

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <PageContainer>
    <PageHeader title="申报看板" subtitle="总览各类型申报情况，快速了解档案完整度" />

    <el-alert
      v-if="submissionStore.loadError"
      title="申报数据加载失败，请检查网络后重试"
      type="error"
      show-icon
      :closable="false"
      class="board-error"
    />

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">申报总数</p>
              <p class="stat-card__value">{{ totalCount }}</p>
            </div>
            <div class="stat-card__icon"><FileText :size="24" /></div>
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
              <p class="stat-card__value">{{ semesterCount }}</p>
            </div>
            <div class="stat-card__icon stat-card__icon--primary"><TrendingUp :size="24" /></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="14"><BoardCharts :data="typeData" title="各类型申报数量" /></el-col>
      <el-col :span="10"><PieChart :data="statusData" title="提交状态分布" /></el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24"><TrendChart :data="trendData" title="各学期申报趋势" /></el-col>
    </el-row>

    <el-card class="completeness-card">
      <template #header>
        <div class="completeness-header">
          <span class="completeness-title">档案完整度总览</span>
          <span class="completeness-sub"
            >已填写 {{ completenessList.filter((c) => c.hasData).length }}/{{
              completenessList.length
            }}
            项</span
          >
        </div>
      </template>
      <el-row :gutter="12">
        <el-col v-for="item in completenessList" :key="item.key" :span="6" class="completeness-col">
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
              {{ item.hasData ? '查看' : '去填写' }}
              <Plus :size="12" style="margin-left: 2px" />
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </PageContainer>
</template>

<style scoped lang="scss">
.board-error {
  margin-bottom: 16px;
}
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
