<script setup lang="ts">
import type { TypeColumnConfig } from './review-columns'
import { CheckCircle, Clock, FileText, Search, XCircle } from 'lucide-vue-next'
// ReviewSection - 个人档案信息申报状态
// Tab形式展示10个申报类型，查看/编辑弹窗支持修改后重新提交
import { computed, onMounted, ref, watch } from 'vue'
import { useReviewStore, useSubmissionStore } from '@/app/stores/stores'
import DictColumn from '@/shared/ui/DictColumn.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'
import {
  DECLARATION_TYPE_KEYS,
  DECLARATION_TYPE_LABELS,
  REVIEW_COLUMNS,
  STATUS_FILTER_OPTIONS,
} from './review-columns'
import ReviewDialog from './ReviewDialog.vue'

const submissionStore = useSubmissionStore()
const reviewStore = useReviewStore()

/** 已驳回或待审核可编辑 */
function canEdit(status: string): boolean {
  return status === 'submitted' || status === 'rejected'
}

// ── 详情/编辑弹窗 ──
const dialogVisible = ref(false)
const dialogMode = ref<'view' | 'edit'>('view')
const dialogRecord = ref<any>(null)
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

function handleView(row: any) {
  dialogRecord.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

function handleEdit(row: any) {
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

// Tab 状态
const activeTab = ref<string>('all')

const tabList = computed(() => {
  const tabs: { key: string; label: string }[] = [{ key: 'all', label: '全部' }]
  for (const key of DECLARATION_TYPE_KEYS) {
    tabs.push({ key, label: DECLARATION_TYPE_LABELS[key] || key })
  }
  return tabs
})

// 数据源（来自 reviewStore，数据由 API 层填充）
const rawRecords = computed(() => {
  if (activeTab.value === 'all') return reviewStore.allRecords
  return reviewStore.typeRecords[activeTab.value] ?? []
})

// 统计卡片（从 store 数据派生）
const stats = computed(() => {
  const data = reviewStore.allRecords
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

const currentConfig = computed<TypeColumnConfig | null>(() => {
  if (activeTab.value === 'all') return null
  return REVIEW_COLUMNS[activeTab.value] || null
})

// 过滤状态
const keyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)
const dynamicFilters = ref<Record<string, any>>({})

// 分页
const pageNum = ref(1)
const pageSize = ref(10)

const tabPageState = ref<Record<string, { pageNum: number; pageSize: number }>>({})

function getPageState(tab: string) {
  if (!tabPageState.value[tab]) {
    tabPageState.value[tab] = { pageNum: 1, pageSize: 10 }
  }
  return tabPageState.value[tab]
}

// 过滤逻辑
const filteredRecords = computed(() => {
  let records = rawRecords.value

  // 过滤掉草稿状态
  records = records.filter((r) => r.status !== 'draft')

  if (activeTab.value === 'all') {
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      records = records.filter(
        (r) => r.title.toLowerCase().includes(kw) || (r.typeLabel || '').toLowerCase().includes(kw),
      )
    }
    if (typeFilter.value) records = records.filter((r) => r.type === typeFilter.value)
    if (statusFilter.value) records = records.filter((r) => r.status === statusFilter.value)
    if (dateRange.value?.[0] && dateRange.value?.[1]) {
      const [start, end] = dateRange.value
      records = records.filter((r) => r.submitDate >= start && r.submitDate <= end)
    }
  } else {
    const filters = dynamicFilters.value
    const config = currentConfig.value
    if (!config) return records

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const textProps = config.columns
        .filter((c) => !c.dictOptions && c.type !== 'status')
        .map((c) => c.prop)
      records = records.filter((r) =>
        textProps.some((prop) => {
          const val = r[prop]
          return val && String(val).toLowerCase().includes(kw)
        }),
      )
    }
    for (const f of config.filters) {
      if (f.type === 'select' && filters[f.key]) {
        records = records.filter((r) => r[f.key] === filters[f.key])
      }
    }
  }

  return records
})

const total = computed(() => filteredRecords.value.length)

const paginatedRecords = computed(() => {
  const state = getPageState(activeTab.value)
  const start = (state.pageNum - 1) * state.pageSize
  return filteredRecords.value.slice(start, start + state.pageSize)
})

// ── 事件 ──
async function handleTabChange(tab: string | number) {
  activeTab.value = String(tab)
  const state = getPageState(activeTab.value)
  pageNum.value = state.pageNum
  pageSize.value = state.pageSize
  dynamicFilters.value = {}
  // 切换到具体类型时，确保该类型数据已加载
  if (activeTab.value !== 'all' && !reviewStore.typeRecords[activeTab.value]) {
    await reviewStore.fetchByType(activeTab.value)
  }
}

watch(activeTab, async () => {
  const state = getPageState(activeTab.value)
  pageNum.value = state.pageNum
  pageSize.value = state.pageSize
  keyword.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  dateRange.value = null
  dynamicFilters.value = {}
  // 确保数据已加载
  if (activeTab.value !== 'all' && !reviewStore.typeRecords[activeTab.value]) {
    await reviewStore.fetchByType(activeTab.value)
  }
  bumpTableAnimation()
})

watch(
  [pageNum, pageSize, filteredRecords],
  () => {
    bumpTableAnimation()
  },
  { flush: 'post' },
)

function handlePageChange(page: number) {
  getPageState(activeTab.value).pageNum = page
  pageNum.value = page
}

function handleSizeChange(size: number) {
  const state = getPageState(activeTab.value)
  state.pageSize = size
  state.pageNum = 1
  pageSize.value = size
}

function handleReset() {
  keyword.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  dateRange.value = null
  dynamicFilters.value = {}
}

const typeOptions = computed(() =>
  DECLARATION_TYPE_KEYS.map((k) => ({ value: k, label: DECLARATION_TYPE_LABELS[k] || k })),
)

// 初始化：加载全部审核记录
onMounted(() => {
  reviewStore.fetchAll()
})
</script>

<template>
  <div class="review-section">
    <!-- 页面头部 -->
    <header class="review-section__hero">
      <div class="review-section__hero-main">
        <div class="review-section__hero-icon">
          <FileText :size="28" />
        </div>
        <div>
          <h1 class="review-section__hero-title">申报审核</h1>
          <p class="review-section__hero-subtitle">
            查看各类型申报信息的提交状态与审核进度。待审核或被驳回的申报可点击编辑修改后重新提报
          </p>
        </div>
      </div>
      <div class="review-section__hero-stats">
        <div v-for="stat in stats" :key="stat.label" class="review-section__hero-stat">
          <div class="review-section__hero-stat-main" :style="{ color: stat.color }">
            <component :is="stat.icon" :size="18" />
            <span class="review-section__hero-stat-value">{{ stat.value }}</span>
          </div>
          <span class="review-section__hero-stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </header>

    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in tabList" :key="tab.key" :label="tab.label" :name="tab.key" />
    </el-tabs>

    <!-- 过滤区域 -->
    <div class="review-section__filters">
      <template v-if="activeTab === 'all'">
        <el-input
          v-model="keyword"
          placeholder="搜索关键词"
          :prefix-icon="Search"
          clearable
          class="filter-input"
        />
        <el-select v-model="typeFilter" placeholder="模块类型" clearable class="filter-select">
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态" clearable class="filter-select">
          <el-option
            v-for="opt in STATUS_FILTER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-date"
          value-format="YYYY-MM-DD"
        />
        <el-button @click="handleReset">重置</el-button>
      </template>
      <template v-else-if="currentConfig">
        <template v-for="f in currentConfig.filters" :key="f.key">
          <el-input
            v-if="f.type === 'input'"
            v-model="dynamicFilters[f.key]"
            :placeholder="f.placeholder || `搜索${f.label}`"
            :prefix-icon="Search"
            clearable
            class="filter-input"
          />
          <el-select
            v-else-if="f.type === 'select'"
            v-model="dynamicFilters[f.key]"
            :placeholder="f.label"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="opt in f.options || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>
        <el-button @click="handleReset">重置</el-button>
      </template>
    </div>

    <!-- 表格卡片 -->
    <div :key="tableKey" v-loading="submissionStore.loading" class="review-section__card mc-card">
      <el-table
        :data="paginatedRecords"
        class="mc-table mc-table--staggered"
        :class="{ 'is-success-pulse': successPulse }"
        stripe
        style="width: 100%"
      >
        <template v-if="activeTab === 'all'">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="模块类型" width="120">
            <template #default="{ row }">
              <DictColumn :value="row.type" :options="typeOptions as any" />
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="submitDate" label="提交日期" width="120" />
          <el-table-column prop="semester" label="学期" width="110" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><StatusTag :status="row.status" size="small" /></template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canEdit(row.status)"
                type="warning"
                link
                size="small"
                @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button v-else type="primary" link size="small" @click="handleView(row)"
                >查看</el-button
              >
            </template>
          </el-table-column>
        </template>
        <template v-else-if="currentConfig">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column
            v-for="col in currentConfig.columns"
            :key="col.prop"
            :label="col.label"
            :prop="col.prop"
            :width="col.width"
            :min-width="col.minWidth"
            :show-overflow-tooltip="col.showOverflowTooltip"
          >
            <template #default="{ row }">
              <DictColumn
                v-if="col.dictOptions"
                :value="row[col.prop]"
                :options="col.dictOptions as any"
              />
              <StatusTag v-else-if="col.type === 'status'" :status="row[col.prop]" size="small" />
              <span v-else>{{ row[col.prop] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canEdit(row.status)"
                type="warning"
                link
                size="small"
                @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button v-else type="primary" link size="small" @click="handleView(row)"
                >查看</el-button
              >
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div v-if="total > 0" class="review-section__pagination mc-pagination">
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
    <ReviewDialog
      v-model="dialogVisible"
      :record="dialogRecord"
      :mode="dialogMode"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.review-section {
  @include message-theme-vars;

  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: $mc-font-body;
  color: var(--mc-text);

  // hero 头部
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
    background: var(--mc-wood);
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
      border-color: var(--mc-wood);
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

  // 工具栏
  &__filters {
    @include mc-fade-in(0.05s);

    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    background: var(--mc-card);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius);
  }

  // 表格卡片
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

// 行级 stagger 动画
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

// 保存成功脉冲
.is-success-pulse {
  animation: review-table-pulse 0.52s ease;
}

@keyframes review-table-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(30, 58, 95, 0);
    transform: translateY(0);
  }
  40% {
    box-shadow: 0 10px 30px rgba(30, 58, 95, 0.12);
    transform: translateY(-2px);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(30, 58, 95, 0);
    transform: translateY(0);
  }
}

// 输入控件
.filter-input {
  width: 200px;
}
.filter-select {
  width: 160px;
}
.filter-date {
  width: 240px;
}
</style>
