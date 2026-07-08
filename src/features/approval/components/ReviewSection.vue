<script setup lang="ts">
import type { ColumnDef, TypeColumnConfig } from './review-columns'
import { ElMessage } from 'element-plus'
import { Search } from 'lucide-vue-next'
/**
 * ReviewSection - 个人档案信息申报状态
 *
 * Tab 形式展示 10 个申报类型的提交状态。
 * 查看弹窗展示完整的类型特有字段内容，
 * 编辑在弹窗内转为可编辑表单，修改后重新提交。
 */
import { computed, reactive, ref, watch } from 'vue'
import { useSubmissionStore } from '@/app/stores/stores'
import DictColumn from '@/shared/ui/DictColumn.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'
import { useAllReviewMockData, useReviewMockData } from '../composables/useReviewMockData'
import {
  DECLARATION_TYPE_KEYS,
  DECLARATION_TYPE_LABELS,
  REVIEW_COLUMNS,
  STATUS_FILTER_OPTIONS,
} from './review-columns'

const submissionStore = useSubmissionStore()

/** 已驳回或待审核可编辑 */
function canEdit(status: string): boolean {
  return status === 'submitted' || status === 'rejected'
}

// ── 详情/编辑弹窗 ──
const detailVisible = ref(false)
const detailMode = ref<'view' | 'edit'>('view')
const detailRecord = ref<any>(null)
const editForm = reactive<Record<string, any>>({})
const saving = ref(false)

function getConfigForType(type: string): TypeColumnConfig | null {
  return REVIEW_COLUMNS[type] || null
}

/** 查看模式：根据记录类型展示完整字段 */
const detailFields = computed(() => {
  const record = detailRecord.value
  if (!record) return []
  const config = getConfigForType(record.type)
  if (!config) return []

  return config.columns.map((c: ColumnDef) => {
    let value = record[c.prop]
    if (c.dictOptions && typeof value === 'string') {
      const opt = c.dictOptions.find((o) => o.value === value)
      value = opt ? opt.label : value
    }
    if (c.type === 'status' || c.prop === 'status') {
      value = record.status
    }
    return { label: c.label, prop: c.prop, value: value ?? '-', type: c.type }
  })
})

/** 编辑模式：可编辑的列（排除状态列） */
const editColumns = computed(() => {
  const record = detailRecord.value
  if (!record) return []
  const config = getConfigForType(record.type)
  if (!config) return []
  return config.columns.filter((c) => c.type !== 'status' && c.prop !== 'status')
})

function handleView(row: any) {
  detailRecord.value = row
  detailMode.value = 'view'
  detailVisible.value = true
}

function handleEdit(row: any) {
  detailRecord.value = row
  detailMode.value = 'edit'
  Object.keys(editForm).forEach((k) => delete editForm[k])
  const config = getConfigForType(row.type)
  if (config) {
    for (const c of config.columns) {
      if (c.prop !== 'status' && row[c.prop] !== undefined) {
        editForm[c.prop] = row[c.prop]
      }
    }
  }
  detailVisible.value = true
}

function handleSave() {
  saving.value = true
  setTimeout(() => {
    if (detailRecord.value) {
      Object.assign(detailRecord.value, { ...editForm, status: 'submitted' })
    }
    saving.value = false
    detailVisible.value = false
    ElMessage.success('修改已保存，等待重新审核')
  }, 400)
}

// ── Tab 状态 ──
const activeTab = ref<string>('all')

const tabList = computed(() => {
  const tabs: { key: string; label: string }[] = [{ key: 'all', label: '全部' }]
  for (const key of DECLARATION_TYPE_KEYS) {
    tabs.push({ key, label: DECLARATION_TYPE_LABELS[key] || key })
  }
  return tabs
})

// ── 数据源 ──
const allData = useAllReviewMockData()

const currentConfig = computed<TypeColumnConfig | null>(() => {
  if (activeTab.value === 'all') return null
  return REVIEW_COLUMNS[activeTab.value] || null
})

const rawRecords = computed(() => {
  if (activeTab.value === 'all') return allData.value
  return useReviewMockData(activeTab.value).value
})

// ── 过滤状态 ──
const keyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)
const dynamicFilters = ref<Record<string, any>>({})

// ── 分页 ──
const pageNum = ref(1)
const pageSize = ref(10)

const tabPageState = ref<Record<string, { pageNum: number; pageSize: number }>>({})

function getPageState(tab: string) {
  if (!tabPageState.value[tab]) {
    tabPageState.value[tab] = { pageNum: 1, pageSize: 10 }
  }
  return tabPageState.value[tab]
}

// ── 过滤逻辑 ──
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
function handleTabChange(tab: string | number) {
  activeTab.value = String(tab)
  const state = getPageState(activeTab.value)
  pageNum.value = state.pageNum
  pageSize.value = state.pageSize
  dynamicFilters.value = {}
}

watch(activeTab, () => {
  const state = getPageState(activeTab.value)
  pageNum.value = state.pageNum
  pageSize.value = state.pageSize
  keyword.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  dateRange.value = null
  dynamicFilters.value = {}
})

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
</script>

<template>
  <div class="review-section">
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

    <!-- 表格 -->
    <el-table
      v-loading="submissionStore.loading"
      :data="paginatedRecords"
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

    <div v-if="total > 0" class="review-section__pagination">
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

    <!-- 详情/编辑弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailMode === 'edit' ? '编辑申报信息' : '申报详情'"
      width="640px"
    >
      <!-- 查看模式 -->
      <template v-if="detailRecord && detailMode === 'view'">
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="f in detailFields" :key="f.prop" :label="f.label">
            <template v-if="f.type === 'status'">
              <StatusTag :status="detailRecord.status" size="small" />
            </template>
            <span v-else>{{ f.value }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 编辑模式 -->
      <template v-if="detailRecord && detailMode === 'edit'">
        <el-alert title="编辑说明" type="warning" :closable="false" show-icon class="mb-16">
          <p>修改后提交将进入待审核状态，请确保信息准确。</p>
        </el-alert>
        <el-form :model="editForm" label-width="120px">
          <el-form-item v-for="col in editColumns" :key="col.prop" :label="col.label">
            <el-select
              v-if="col.dictOptions"
              v-model="editForm[col.prop]"
              placeholder="请选择"
              class="form-control"
            >
              <el-option
                v-for="opt in col.dictOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-date-picker
              v-else-if="col.type === 'date'"
              v-model="editForm[col.prop]"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
            <el-input
              v-else
              v-model="editForm[col.prop]"
              :placeholder="`请输入${col.label}`"
              class="form-control"
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="detailMode === 'edit'"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.review-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
}

.filter-input {
  width: 200px;
}
.filter-select {
  width: 160px;
}
.filter-date {
  width: 240px;
}
.form-control {
  width: 360px;
}

:deep(.mb-16) {
  margin-bottom: 16px;
}
</style>
