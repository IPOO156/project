<script setup lang="ts">
import type { StarRecord } from '@/shared/types/types'
import { Award, CheckCircle, Clock, XCircle } from 'lucide-vue-next'
// StarSection - 奖项报名审核情况
// 竞赛之星/科研之星/双创之星报名状态展示，查看/编辑弹窗支持修改后重新提交
import { computed, onMounted, ref, watch } from 'vue'
import { useAwardReviewStore } from '@/app/stores/stores'
import StatusTag from '@/shared/ui/StatusTag.vue'
import { canEditStar, filterStarRecords } from '../composables/useStarMockData'
import StarDialog from './StarDialog.vue'

const awardReviewStore = useAwardReviewStore()

const starTabs = [
  { key: 'all', label: '全部' },
  { key: 'competitionStar', label: '竞赛之星' },
  { key: 'scientificStar', label: '科研之星' },
  { key: 'innovationStar', label: '双创之星' },
]

const activeTab = ref<string>('all')

// ── 数据源（来自 awardReviewStore，由 API 层填充） ──
const allRecords = computed(() => awardReviewStore.allRecords)

// ── 统计卡片（从 store 数据派生） ──
const stats = computed(() => {
  const data = allRecords.value.filter((r) => r.status !== 'draft')
  return [
    {
      label: '待审核',
      value: data.filter((r) => r.status === 'submitted').length,
      icon: Clock,
      color: '#d4a574',
    },
    {
      label: '已通过',
      value: data.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      label: '已驳回',
      value: data.filter((r) => r.status === 'rejected').length,
      icon: XCircle,
      color: '#ef4444',
    },
  ]
})

const filteredRecords = computed(() => filterStarRecords(allRecords.value, activeTab.value))

const pageNum = ref(1)
const pageSize = ref(10)

const paginatedRecords = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const total = computed(() => filteredRecords.value.length)

function handlePageChange(page: number) {
  pageNum.value = page
}
function handleSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
}
function handleTabChange(tab: string | number) {
  activeTab.value = String(tab)
  pageNum.value = 1
  bumpTableAnimation()
}

watch(
  [pageNum, pageSize, filteredRecords],
  () => {
    bumpTableAnimation()
  },
  { flush: 'post' },
)

// 详情/编辑弹窗
const dialogVisible = ref(false)
const dialogMode = ref<'view' | 'edit'>('view')
const dialogRecord = ref<StarRecord | null>(null)
const tableKey = ref(0)
const successPulse = ref(false)

function bumpTableAnimation() {
  tableKey.value++
}

function triggerSuccessPulse() {
  successPulse.value = true
  setTimeout(() => {
    successPulse.value = false
  }, 520)
}

function handleView(row: StarRecord) {
  dialogRecord.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

function handleEdit(row: StarRecord) {
  dialogRecord.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function handleSaved(_id: string) {
  if (dialogRecord.value) {
    Object.assign(dialogRecord.value, { status: 'submitted' })
  }
  bumpTableAnimation()
  triggerSuccessPulse()
}

onMounted(() => {
  awardReviewStore.fetchAll()
})
</script>

<template>
  <div class="star-section">
    <!-- 页面头部 -->
    <header class="star-section__hero">
      <div class="star-section__hero-main">
        <div class="star-section__hero-icon">
          <Award :size="28" />
        </div>
        <div>
          <h1 class="star-section__hero-title">奖项审核</h1>
          <p class="star-section__hero-subtitle">
            查看竞赛之星/科研之星/双创之星的报名审核状态，待审核或被驳回的报名可修改后重新提交
          </p>
        </div>
      </div>
      <div class="star-section__hero-stats">
        <div v-for="stat in stats" :key="stat.label" class="star-section__hero-stat">
          <div class="star-section__hero-stat-main" :style="{ color: stat.color }">
            <component :is="stat.icon" :size="18" />
            <span class="star-section__hero-stat-value">{{ stat.value }}</span>
          </div>
          <span class="star-section__hero-stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </header>

    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in starTabs" :key="tab.key" :label="tab.label" :name="tab.key" />
    </el-tabs>

    <div :key="tableKey" class="star-section__card mc-card">
      <el-table
        :data="paginatedRecords"
        class="mc-table mc-table--staggered"
        :class="{ 'is-success-pulse': successPulse }"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="报名标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="typeLabel" label="报名类型" width="120" />
        <el-table-column prop="applicant" label="报名人" width="100" />
        <el-table-column prop="submitDate" label="提交日期" width="120" />
        <el-table-column prop="semester" label="学期" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"
            ><StatusTag :status="(row as StarRecord).status" size="small"
          /></template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canEditStar((row as StarRecord).status)"
              type="warning"
              link
              size="small"
              @click="handleEdit(row as StarRecord)"
              >编辑</el-button
            >
            <el-button
              v-else
              type="primary"
              link
              size="small"
              @click="handleView(row as StarRecord)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > 0" class="star-section__pagination mc-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 详情/编辑弹窗 -->
    <StarDialog
      v-model="dialogVisible"
      :record="dialogRecord"
      :mode="dialogMode"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.star-section {
  @include message-theme-vars;

  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: $mc-font-body;
  color: var(--mc-text);

  // ── hero 头部 ──
  &__hero {
    @include mc-fade-in;

    background: var(--mc-card);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius);
    padding: 24px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    box-shadow: var(--mc-shadow);
  }

  &__hero-main {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__hero-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--mc-gold);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__hero-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__hero-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--mc-text-secondary);
  }

  &__hero-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__hero-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 90px;
    padding: 10px 16px;
    background: var(--mc-bg);
    border: 1px solid var(--mc-border);
    border-radius: 8px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: var(--mc-gold);
      box-shadow: 0 2px 8px var(--mc-primary-fade);
    }
  }

  &__hero-stat-main {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__hero-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__hero-stat-label {
    font-size: 12px;
    color: var(--mc-text-secondary);
  }

  // ── 表格卡片 ──
  &__card {
    @include mc-fade-in(0.1s);
    @include mc-card;

    padding: 0;
    overflow: hidden;

    :deep(.el-table) {
      @include mc-table;
    }
  }

  &__pagination {
    @include mc-pagination;

    margin: 0 16px 16px;
  }
}

// ── 行级 stagger 动画（:deep 直接穿透 el-table__row，避免 :deep(.el-table) 的同级元素 bug） ──
.mc-table--staggered {
  --mc-row-duration: 0.54s;
  --mc-row-delay: 0.05s;
  --mc-row-offset: -28px;

  :deep(.el-table__row) {
    --_duration: var(--mc-row-duration, 0.6s);
    --_delay: var(--mc-row-delay, 0.08s);
    --_easing: var(--mc-row-easing, #{$ease-emphasized});

    opacity: 0;
    will-change: transform, opacity;
    animation: table-row-brush var(--_duration) var(--_easing) both;
  }

  @for $i from 1 through 24 {
    :deep(.el-table__body .el-table__row:nth-child(#{$i})) {
      animation-delay: calc((#{$i} - 1) * var(--_delay));
    }
  }
}

// ── 保存成功脉冲（琥珀金） ──
.is-success-pulse {
  animation: star-table-pulse 0.52s ease;
}

@keyframes star-table-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(212, 165, 116, 0);
    transform: translateY(0);
  }
  40% {
    box-shadow: 0 10px 30px rgba(212, 165, 116, 0.18);
    transform: translateY(-2px);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(212, 165, 116, 0);
    transform: translateY(0);
  }
}
</style>
