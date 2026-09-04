<script setup lang="ts">
/**
 * CollegeReview - 材料审核
 *
 * 数据源：review.getReviewList（申报记录，接口不可用时回退 Mock）。
 * 列表区接入 ReviewList + ReviewDetailPanel + useReviewOperations，
 * 支持学院/年级/班级/申报类型/关键词/提交时间筛选，通过、退回修改与批量操作。
 */
import type { ReviewRecord } from '@/shared/types/types'
import { Check, ClipboardList, TrendingUp, X } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import { useUserStore } from '@/app/stores/stores'
import { getReviewList } from '@/shared/api/review'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
import ReviewDetailPanel from './components/ReviewDetailPanel.vue'
import ReviewList from './components/ReviewList.vue'
import { useReviewOperations } from './composables/useReviewOperations'

interface ReviewAttachment {
  name: string
  url: string
}

interface ReviewHistoryItem {
  action?: string
  reviewer?: string
  comment?: string
  time?: string
}

interface ReviewItem {
  id: string
  name: string
  studentId: string
  className: string
  grade: string
  college: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: string
  duplicate: boolean
  history: ReviewHistoryItem[]
  formData: Record<string, unknown>
  attachments: ReviewAttachment[]
}

interface ReviewFilters {
  college: string
  grade: string
  className: string
  type: string
  keyword: string
  dateRange: [string, string] | null
}

const META_FIELDS = new Set([
  'id',
  'name',
  'studentId',
  'className',
  'grade',
  'college',
  'major',
  'type',
  'typeLabel',
  'title',
  'submitDate',
  'semester',
  'status',
  'duplicate',
  'history',
  'formData',
  'attachments',
  'proofMaterials',
  'sourcePath',
])

const userStore = useUserStore()
const { me } = useTeacherMe()

const { reviewComment, templates, isProcessing, approve, reject, batchApprove, batchReject } =
  useReviewOperations()

const colleges = computed(() => uniqueScopeNames(2))
const grades = computed(() => uniqueScopeNames(6))
const classes = computed(() => uniqueScopeNames(4))

function uniqueScopeNames(scopeType: number): string[] {
  const names: string[] = []
  for (const s of me.value?.scopes ?? []) {
    if (s.scopeType === scopeType && s.scopeName) names.push(s.scopeName)
  }
  return [...new Set(names)]
}

const typeOptions = Object.entries(APPLICATION_TYPE_MAP).map(([value, label]) => ({ label, value }))

const filters: ReviewFilters = reactive({
  college: '',
  grade: '',
  className: '',
  type: '',
  keyword: '',
  dateRange: null,
})

const canReview = computed(
  () => userStore.isSuperAdmin || userStore.isAdmin || userStore.isReviewer,
)

// ── 审核统计（从列表数据派生）──
const allRecords = ref<ReviewRecord[]>([])
const stats = computed(() => {
  const records = allRecords.value
  const today = todayString()
  return [
    {
      label: '待审核',
      value: countByStatus(records, ['submitted', 'pending']),
      icon: ClipboardList,
      color: 'var(--el-color-warning)',
    },
    {
      label: '今日新增',
      value: records.filter((r) => (r.submitDate || '').slice(0, 10) === today).length,
      icon: TrendingUp,
      color: 'var(--el-color-primary)',
    },
    {
      label: '已通过',
      value: countByStatus(records, ['approved']),
      icon: Check,
      color: 'var(--el-color-success)',
    },
    {
      label: '已退回',
      value: countByStatus(records, ['rejected']),
      icon: X,
      color: 'var(--el-color-danger)',
    },
  ]
})

// ── 待审核列表 ──
const listItems = ref<ReviewItem[]>([])
const initialLoaded = ref(false)

onMounted(async () => {
  try {
    allRecords.value = await getReviewList()
  } catch {
    allRecords.value = []
  }
  listItems.value = allRecords.value
    .filter((r) => r.status === 'submitted' || r.status === 'pending')
    .map(toReviewItem)
  initialLoaded.value = true
})

const apiUnavailable = computed(() => initialLoaded.value && allRecords.value.length === 0)

const visibleItems = computed(() => {
  const { college, grade, className, type, keyword, dateRange } = filters
  return listItems.value.filter((item) => {
    if (college && item.college !== college) return false
    if (grade && item.grade !== grade) return false
    if (className && item.className !== className) return false
    if (type && item.type !== type) return false
    if (keyword) {
      const kw = keyword.toLowerCase()
      const haystack =
        `${item.title} ${item.name} ${item.studentId} ${item.typeLabel}`.toLowerCase()
      if (!haystack.includes(kw)) return false
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      if (item.submitDate < dateRange[0] || item.submitDate > dateRange[1]) return false
    }
    return true
  })
})

// ── 详情弹窗 ──
const detailVisible = ref(false)
const detailIndex = ref(-1)
const currentRecord = computed(() => visibleItems.value[detailIndex.value] ?? null)

const selectedIds = ref<Set<string | number>>(new Set())
const selectedItems = computed(() => listItems.value.filter((i) => selectedIds.value.has(i.id)))

function openDetail(item: ReviewItem) {
  const idx = visibleItems.value.findIndex((i) => i.id === item.id)
  detailIndex.value = idx < 0 ? 0 : idx
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
}

function onPrev() {
  if (detailIndex.value > 0) detailIndex.value--
}

function onNext() {
  if (detailIndex.value < visibleItems.value.length - 1) detailIndex.value++
}

function clampDetailIndex() {
  if (detailIndex.value >= visibleItems.value.length) {
    detailIndex.value = Math.max(0, visibleItems.value.length - 1)
  }
}

function removeSelected(id: string | number) {
  if (selectedIds.value.has(id)) {
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
  }
  clampDetailIndex()
}

function clearSelection() {
  selectedIds.value = new Set()
}

function resetFilters() {
  filters.college = ''
  filters.grade = ''
  filters.className = ''
  filters.type = ''
  filters.keyword = ''
  filters.dateRange = null
}

// ── 审核操作 ──
async function onApprove() {
  if (!currentRecord.value) return
  const item = currentRecord.value
  const ok = await approve(item, listItems.value)
  if (ok) removeSelected(item.id)
}

async function onReject() {
  if (!currentRecord.value) return
  const item = currentRecord.value
  const ok = await reject(item, listItems.value)
  if (ok) removeSelected(item.id)
}

async function onListItemApprove(item: ReviewItem) {
  const ok = await approve(item, listItems.value)
  if (ok) removeSelected(item.id)
}

function onListItemReject(item: ReviewItem) {
  openDetail(item)
}

async function onBatchApprove() {
  await batchApprove(selectedItems.value, listItems.value)
  clearSelection()
}

async function onBatchReject(reason: string) {
  await batchReject(selectedItems.value, listItems.value, reason)
  clearSelection()
}

function pickTemplate(text: string) {
  reviewComment.value = text
}

// ── 工具函数 ──
function toggleSelect(id: string | number) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleAll(checked: boolean) {
  if (!checked) {
    clearSelection()
    return
  }
  selectedIds.value = new Set(visibleItems.value.map((i) => i.id))
}

function countByStatus(records: ReviewRecord[], statuses: string[]): number {
  return records.filter((r) => statuses.includes(r.status)).length
}

function toReviewItem(record: ReviewRecord): ReviewItem {
  const formData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (META_FIELDS.has(key) || value === undefined || value === null || value === '') continue
    formData[key] = value
  }
  return {
    id: String(record.id),
    name: record.name || '',
    studentId: record.studentId || '',
    className: record.className || '',
    grade: record.grade || '',
    college: record.college || '',
    type: record.type,
    typeLabel: record.typeLabel,
    title: record.title,
    submitDate: (record.submitDate || '').slice(0, 10),
    semester: record.semester || '',
    status: record.status,
    duplicate: Boolean(record.duplicate),
    history: Array.isArray(record.history) ? record.history : [],
    formData,
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
  }
}

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">材料审核 · Review</p>
        <h2 class="mc-page-head__title">材料审核</h2>
        <p class="mc-page-head__desc">
          审核学生提交的申报材料，支持查看个人与材料详情、通过或退回修改。接口不可用时以本地数据兜底展示。
        </p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col v-for="s in stats" :key="s.label" :xs="12" :sm="6">
        <div class="mc-card review-stat">
          <div class="mc-card__body review-stat__body">
            <div>
              <p class="review-stat__label">{{ s.label }}</p>
              <p class="review-stat__value mc-num">{{ s.value }}</p>
            </div>
            <div class="review-stat__icon" :style="{ '--chip': s.color }">
              <component :is="s.icon" :size="20" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="学院">
          <el-select
            v-model="filters.college"
            placeholder="全部学院"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="filters.grade" placeholder="全部年级" clearable style="width: 150px">
            <el-option v-for="g in grades" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select
            v-model="filters.className"
            placeholder="全部班级"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in classes" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="姓名 / 学号 / 标题"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-loading="!initialLoaded" class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">待审核材料</span>
      </div>
      <div class="mc-card__body">
        <div v-if="apiUnavailable" class="mc-empty">
          <div class="mc-empty__icon"><ClipboardList :size="24" /></div>
          <p class="mc-empty__title">待审核数据待后端就绪</p>
          <p class="mc-empty__desc">
            待审核列表、审核详情、通过/退回修改与批量操作依赖申报记录接口，
            接口就绪后自动加载。审核操作界面已按契约预留。
          </p>
        </div>
        <ReviewList
          v-else
          :items="visibleItems"
          :selected-ids="selectedIds"
          :is-admin="canReview"
          :is-processing="isProcessing"
          @toggle="toggleSelect"
          @toggle-all="toggleAll"
          @batch-reject="onBatchReject"
          @batch-approve="onBatchApprove"
          @view-detail="openDetail"
          @approve="onListItemApprove"
          @reject="onListItemReject"
        />
      </div>
    </div>

    <ReviewDetailPanel
      :visible="detailVisible"
      :record="currentRecord"
      @close="closeDetail"
      @prev="onPrev"
      @next="onNext"
    >
      <template #actions>
        <div class="mc-review-actions">
          <el-input
            v-model="reviewComment"
            placeholder="退回原因（必填）"
            clearable
            class="mc-review-actions__reason"
          />
          <el-popover placement="top" :width="260" trigger="click">
            <template #reference>
              <el-button size="small">常用退回原因</el-button>
            </template>
            <div class="mc-review-actions__templates">
              <el-button
                v-for="t in templates"
                :key="t.label"
                size="small"
                text
                @click="pickTemplate(t.text)"
              >
                {{ t.label }}
              </el-button>
            </div>
          </el-popover>
          <el-button type="success" size="small" :loading="isProcessing" @click="onApprove">
            通过
          </el-button>
          <el-button type="danger" size="small" :loading="isProcessing" @click="onReject">
            退回修改
          </el-button>
        </div>
      </template>
    </ReviewDetailPanel>
  </div>
</template>

<style scoped lang="scss">
.review-stat {
  height: 100%;
  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
  &__icon {
    width: 44px;
    height: 44px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chip, var(--el-color-primary));
    background: color-mix(in srgb, var(--chip, var(--el-color-primary)) 12%, transparent);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--chip, var(--el-color-primary)) 18%, transparent);
  }
}

.mc-review-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
  &__reason {
    width: 200px;
  }
  &__templates {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
