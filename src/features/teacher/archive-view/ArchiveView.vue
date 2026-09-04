<script setup lang="ts">
import type {
  ArchiveAdminDetail,
  ArchiveAdminListItem,
  ArchiveOverviewRow,
  SemesterItem,
} from '@/shared/types/teacher'
/**
 * ArchiveView - 档案查看 / 档案汇总总览
 * 对接后端：
 * - /admin/archives/overview（组织档案汇总，维度全校/学院/专业/班级 + 下钻）
 * - /admin/archives（学生档案列表，支持组织/状态/学期/关键词筛选）
 * - /admin/archives/{archiveId}（档案详情）
 * 学期下拉与学院/专业/班级范围来自 /common/semesters + /auth/me scopes。
 */
import { ElMessage } from 'element-plus'
import { Eye, FileSearch, Filter, RefreshCw, Search } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref } from 'vue'
import {
  getArchiveDetail,
  getArchiveOverview,
  getSemesters,
  listArchives,
} from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import StatisticsOverview from './components/StatisticsOverview.vue'

defineOptions({ name: 'ArchiveView' })

/**
 * 单条组织档案在状态分布条中的占比（按总数归一化，避免除 0）。
 */
function ratioWidth(row: ArchiveOverviewRow, key: 'approved' | 'pending' | 'rejected' | 'draft') {
  const total = row.totalArchives ?? 0
  if (!total) return 0
  const map = {
    approved: row.approvedCount ?? 0,
    pending: row.pendingCount ?? 0,
    rejected: row.rejectedCount ?? 0,
    draft: row.draftCount ?? 0,
  }
  return Math.max(0, Math.min(100, (map[key] / total) * 100))
}

const { me } = useTeacherMe()

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

const colleges = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 2 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `学院 ${s.scopeId}` })),
)
const majors = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 3 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `专业 ${s.scopeId}` })),
)
const classes = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 4 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `班级 ${s.scopeId}` })),
)

const dimensionOptions = ['全校', '学院', '专业', '班级']
const DIMENSION_ORG_TYPE: Record<string, number | undefined> = {
  全校: undefined,
  学院: 2,
  专业: 3,
  班级: 4,
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 0, label: '草稿' },
  { value: 1, label: '待审批' },
  { value: 2, label: '通过' },
  { value: 3, label: '已退回' },
  { value: 4, label: '已撤销' },
]

function statusTagType(status: number | null) {
  return status === 2 ? 'success' : status === 3 ? 'danger' : status === 1 ? 'warning' : 'info'
}

function statusLabel(status: number | null) {
  return statusOptions.find((s) => s.value === status)?.label ?? '-'
}

const dimension = ref('全校')
const filters = reactive({
  semesterId: undefined as number | undefined,
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
  grade: '',
  keyword: '',
  status: '' as number | '',
})

const hasActiveFilter = computed(() =>
  Boolean(
    filters.semesterId ||
    filters.collegeId ||
    filters.majorId ||
    filters.classId ||
    filters.grade ||
    filters.keyword ||
    filters.status !== '' ||
    dimension.value !== '全校',
  ),
)

/* ── 组织汇总（/admin/archives/overview）── */

const overviewLoading = ref(false)
const overviewRows = ref<ArchiveOverviewRow[]>([])
const kpis = reactive({
  studentCount: 0,
  archiveCount: 0,
  approvedCount: 0,
  pendingCount: 0,
  rejectedCount: 0,
  submittedCount: 0,
})

async function loadOverview() {
  overviewLoading.value = true
  try {
    const orgType = DIMENSION_ORG_TYPE[dimension.value]
    let orgId: number | undefined
    if (dimension.value === '学院') orgId = filters.collegeId
    else if (dimension.value === '专业') orgId = filters.majorId
    else if (dimension.value === '班级') orgId = filters.classId
    const res = await getArchiveOverview({
      semesterId: filters.semesterId,
      orgType,
      orgId,
      grade: filters.grade || undefined,
    })
    overviewRows.value = res.rows ?? []
    kpis.studentCount = overviewRows.value.reduce((sum, r) => sum + (r.studentCount ?? 0), 0)
    kpis.archiveCount = overviewRows.value.reduce((sum, r) => sum + (r.totalArchives ?? 0), 0)
    kpis.approvedCount = overviewRows.value.reduce((sum, r) => sum + (r.approvedCount ?? 0), 0)
    kpis.pendingCount = overviewRows.value.reduce((sum, r) => sum + (r.pendingCount ?? 0), 0)
    kpis.rejectedCount = overviewRows.value.reduce((sum, r) => sum + (r.rejectedCount ?? 0), 0)
    kpis.submittedCount = overviewRows.value.reduce((sum, r) => sum + (r.submittedCount ?? 0), 0)
  } catch {
    overviewRows.value = []
    Object.assign(kpis, {
      studentCount: 0,
      archiveCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      submittedCount: 0,
    })
  } finally {
    overviewLoading.value = false
  }
}

/* ── 档案列表（/admin/archives）── */

const listLoading = ref(false)
const list = ref<ArchiveAdminListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)

async function loadList() {
  listLoading.value = true
  try {
    const res = await listArchives({
      page: page.value,
      per_page: perPage.value,
      semesterId: filters.semesterId,
      collegeId: filters.collegeId,
      majorId: filters.majorId,
      classId: filters.classId,
      grade: filters.grade || undefined,
      keyword: filters.keyword || undefined,
      status: filters.status === '' ? undefined : (filters.status as number),
    })
    list.value = res.list
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    listLoading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  void loadList()
}

function handleSearch() {
  page.value = 1
  void loadOverview()
  void loadList()
}

function handleReset() {
  dimension.value = '全校'
  filters.semesterId = undefined
  filters.collegeId = undefined
  filters.majorId = undefined
  filters.classId = undefined
  filters.grade = ''
  filters.keyword = ''
  filters.status = ''
  page.value = 1
  void loadOverview()
  void loadList()
}

/* ── 档案详情（/admin/archives/{id}）── */

const detailDrawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ArchiveAdminDetail | null>(null)

function renderValue(v: unknown) {
  if (v == null) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

async function openDetail(row: ArchiveAdminListItem) {
  detailDrawerVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getArchiveDetail(row.archiveId)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function handleDrawerClosed() {
  detail.value = null
}

const detailEntries = computed(() => {
  if (!detail.value?.details) return []
  return Object.entries(detail.value.details)
})

onMounted(async () => {
  loadingSemesters.value = true
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
    ElMessage.warning('学期加载失败')
  } finally {
    loadingSemesters.value = false
  }
  void loadOverview()
  void loadList()
})
</script>

<template>
  <div class="mc-page archive-view">
    <!-- 页头：标题 + 数据范围 + 操作入口 -->
    <header class="mc-page-head archive-view__head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">档案查看</h2>
        <p class="mc-page-head__desc">
          按年级 / 学院 / 专业 / 班级查看档案聚合汇总，并下钻到学生档案明细。
        </p>
      </div>
      <div class="mc-page-head__actions archive-view__head-actions">
        <div class="archive-view__head-chip">
          <span class="archive-view__head-chip-label">维度</span>
          <span class="archive-view__head-chip-value">{{ dimension }}</span>
        </div>
        <div class="archive-view__head-chip">
          <span class="archive-view__head-chip-label">学期</span>
          <span class="archive-view__head-chip-value">
            {{
              filters.semesterId
                ? (semesters.find((s) => s.value === filters.semesterId)?.label ?? '-')
                : '全部'
            }}
          </span>
        </div>
      </div>
    </header>

    <!-- 筛选区 -->
    <section class="mc-card archive-view__filters">
      <div class="mc-card__head archive-view__filters-head">
        <span class="mc-card__title">
          <Filter :size="14" />
          筛选条件
        </span>
        <div class="archive-view__filters-meta">
          <span v-if="hasActiveFilter" class="archive-view__filters-tag">已应用筛选</span>
          <span v-else class="archive-view__filters-tag is-muted">未筛选</span>
        </div>
      </div>
      <div class="mc-card__body archive-view__filters-body">
        <div class="archive-view__filter-group">
          <p class="archive-view__filter-group-title">组织范围</p>
          <div class="archive-view__filter-row">
            <el-select
              v-model="dimension"
              class="archive-view__select archive-view__select--narrow"
            >
              <el-option v-for="d in dimensionOptions" :key="d" :label="d" :value="d" />
            </el-select>
            <el-select
              v-model="filters.semesterId"
              placeholder="全部学期"
              clearable
              :loading="loadingSemesters"
              class="archive-view__select"
            >
              <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-select
              v-if="dimension === '学院' || dimension === '专业' || dimension === '班级'"
              v-model="filters.collegeId"
              clearable
              placeholder="全部学院"
              class="archive-view__select"
            >
              <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select
              v-if="dimension === '专业' || dimension === '班级'"
              v-model="filters.majorId"
              clearable
              placeholder="全部专业"
              class="archive-view__select"
            >
              <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
            </el-select>
            <el-select
              v-if="dimension === '班级'"
              v-model="filters.classId"
              clearable
              placeholder="全部班级"
              class="archive-view__select"
            >
              <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-input
              v-model="filters.grade"
              clearable
              placeholder="年级，如 2023级"
              class="archive-view__select archive-view__select--narrow"
            />
          </div>
        </div>

        <div class="archive-view__filter-group">
          <p class="archive-view__filter-group-title">档案明细</p>
          <div class="archive-view__filter-row">
            <el-select
              v-model="filters.status"
              class="archive-view__select archive-view__select--narrow"
            >
              <el-option
                v-for="s in statusOptions"
                :key="String(s.value)"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
            <el-input
              v-model="filters.keyword"
              placeholder="姓名 / 学号 / 档案标题"
              clearable
              class="archive-view__select archive-view__select--wide"
            >
              <template #prefix>
                <Search :size="14" />
              </template>
            </el-input>
            <div class="archive-view__filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- KPI 摘要 -->
    <section class="archive-view__kpis" aria-label="档案汇总概览">
      <article class="archive-view__kpi archive-view__kpi--primary">
        <p class="archive-view__kpi-label">覆盖学生</p>
        <p class="archive-view__kpi-value mc-num">
          {{ kpis.studentCount }}
          <span class="archive-view__kpi-unit">人</span>
        </p>
        <p class="archive-view__kpi-foot">档案组织范围下的学生数量</p>
      </article>
      <article class="archive-view__kpi">
        <p class="archive-view__kpi-label">档案总数</p>
        <p class="archive-view__kpi-value mc-num">
          {{ kpis.archiveCount }}
          <span class="archive-view__kpi-unit">份</span>
        </p>
        <p class="archive-view__kpi-foot">含已提交的全部档案记录</p>
      </article>
      <article class="archive-view__kpi archive-view__kpi--success">
        <p class="archive-view__kpi-label">已通过</p>
        <p class="archive-view__kpi-value mc-num">
          {{ kpis.approvedCount }}
          <span class="archive-view__kpi-unit">份</span>
        </p>
        <p class="archive-view__kpi-foot">审批通过的档案数量</p>
      </article>
      <article class="archive-view__kpi archive-view__kpi--warning">
        <p class="archive-view__kpi-label">待审批</p>
        <p class="archive-view__kpi-value mc-num">
          {{ kpis.pendingCount }}
          <span class="archive-view__kpi-unit">份</span>
        </p>
        <p class="archive-view__kpi-foot">提交后等待审批的档案</p>
      </article>
      <article class="archive-view__kpi archive-view__kpi--danger">
        <p class="archive-view__kpi-label">已退回</p>
        <p class="archive-view__kpi-value mc-num">
          {{ kpis.rejectedCount }}
          <span class="archive-view__kpi-unit">份</span>
        </p>
        <p class="archive-view__kpi-foot">需要修改后重新提交</p>
      </article>
    </section>

    <!-- 组织汇总表 -->
    <section class="mc-card archive-view__overview">
      <div class="mc-card__head">
        <span class="mc-card__title">组织汇总 · {{ dimension }}</span>
        <span class="archive-view__count">{{ overviewRows.length }} 个组织</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="overviewLoading" :data="overviewRows" stripe style="width: 100%">
          <el-table-column prop="orgName" label="组织" min-width="160" />
          <el-table-column label="学生数" width="90" align="center">
            <template #default="{ row }">
              <span class="mc-num">{{ row.studentCount ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="档案 / 通过率" min-width="280" align="left">
            <template #default="{ row }">
              <div class="archive-view__ratio">
                <div class="archive-view__ratio-meta">
                  <span class="archive-view__ratio-total mc-num">
                    {{ row.totalArchives ?? 0 }}
                    <span class="archive-view__ratio-unit">份</span>
                  </span>
                  <span v-if="row.totalArchives" class="archive-view__ratio-percent mc-num">
                    {{ Math.round(((row.approvedCount ?? 0) / row.totalArchives) * 100) }}%
                  </span>
                </div>
                <div class="archive-view__ratio-bar">
                  <span
                    class="archive-view__ratio-bar-seg is-success"
                    :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'approved')}%` }"
                  />
                  <span
                    class="archive-view__ratio-bar-seg is-warning"
                    :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'pending')}%` }"
                  />
                  <span
                    class="archive-view__ratio-bar-seg is-danger"
                    :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'rejected')}%` }"
                  />
                  <span
                    class="archive-view__ratio-bar-seg is-draft"
                    :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'draft')}%` }"
                  />
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态分布" min-width="160">
            <template #default="{ row }">
              <div class="archive-view__status-stack">
                <span class="archive-view__status-pill is-success">
                  通过 {{ row.approvedCount ?? 0 }}
                </span>
                <span class="archive-view__status-pill is-warning">
                  待 {{ row.pendingCount ?? 0 }}
                </span>
                <span class="archive-view__status-pill is-danger">
                  退 {{ row.rejectedCount ?? 0 }}
                </span>
                <span class="archive-view__status-pill is-muted">
                  稿 {{ row.draftCount ?? 0 }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型分布" min-width="200">
            <template #default="{ row }">
              <div v-if="row.archiveTypeDistribution?.length" class="archive-view__types">
                <span
                  v-for="t in row.archiveTypeDistribution"
                  :key="t.archiveType"
                  class="archive-view__type-chip"
                >
                  <span class="archive-view__type-name">{{ t.archiveType }}</span>
                  <span class="archive-view__type-count mc-num">{{ t.count }}</span>
                </span>
              </div>
              <span v-else class="archive-view__empty-cell">-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!overviewLoading && !overviewRows.length" description="暂无汇总数据" />
      </div>
    </section>

    <!-- 统计看板（自带筛选，置于下方作为补充） -->
    <StatisticsOverview class="archive-view__stats" />

    <!-- 档案明细 -->
    <section class="mc-card archive-view__detail-list">
      <div class="mc-card__head">
        <span class="mc-card__title">
          <FileSearch :size="14" />
          档案明细
        </span>
        <span class="archive-view__count">{{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="listLoading" :data="list" stripe style="width: 100%">
          <el-table-column label="档案" min-width="220">
            <template #default="{ row }">
              <div class="archive-view__doc">
                <span class="archive-view__doc-type">{{ row.archiveTypeName ?? '-' }}</span>
                <span class="archive-view__doc-title">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="学生 / 学号" width="160">
            <template #default="{ row }">
              <div class="archive-view__student">
                <span class="archive-view__student-name">{{ row.studentName ?? '-' }}</span>
                <span class="archive-view__student-no mc-num">{{ row.studentNo ?? '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="组织归属" min-width="200">
            <template #default="{ row }">
              <div class="archive-view__org">
                <span v-if="row.collegeName" class="archive-view__org-node">{{
                  row.collegeName
                }}</span>
                <span v-if="row.majorName" class="archive-view__org-node is-soft">{{
                  row.majorName
                }}</span>
                <span v-if="row.className" class="archive-view__org-node is-soft">{{
                  row.className
                }}</span>
                <span
                  v-if="!row.collegeName && !row.majorName && !row.className"
                  class="archive-view__empty-cell"
                  >-</span
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="grade" label="年级" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.grade" class="archive-view__grade">{{ row.grade }}</span>
              <span v-else class="archive-view__empty-cell">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small" effect="light">
                {{ row.statusLabel ?? statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submittedAt" label="提交时间" width="160">
            <template #default="{ row }">{{ row.submittedAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                :icon="Eye"
                @click="openDetail(row as ArchiveAdminListItem)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="archive-view__pagination">
          <el-pagination
            :current-page="page"
            :page-size="perPage"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
            @size-change="
              (s) => {
                perPage = s
                page = 1
                void loadList()
              }
            "
          />
        </div>
      </div>
    </section>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="档案详情"
      size="56%"
      :destroy-on-close="true"
      class="archive-view__drawer"
      @closed="handleDrawerClosed"
    >
      <div v-loading="detailLoading" class="archive-view__drawer-body">
        <template v-if="detail">
          <!-- 顶部摘要 -->
          <div class="archive-view__drawer-hero">
            <div class="archive-view__drawer-hero-meta">
              <span class="archive-view__drawer-type">{{ detail.archiveTypeName }}</span>
              <el-tag :type="statusTagType(detail.status)" size="small" effect="light">
                {{ detail.statusLabel ?? statusLabel(detail.status) }}
              </el-tag>
            </div>
            <h3 class="archive-view__drawer-title">{{ detail.title }}</h3>
            <div class="archive-view__drawer-hero-line">
              <span>{{ detail.student?.name ?? '-' }}</span>
              <span class="archive-view__drawer-dot">·</span>
              <span class="mc-num">{{ detail.student?.studentNo ?? '-' }}</span>
              <span
                v-if="
                  detail.student?.collegeName ||
                  detail.student?.majorName ||
                  detail.student?.className
                "
                class="archive-view__drawer-dot"
                >·</span
              >
              <span
                v-if="
                  detail.student?.collegeName ||
                  detail.student?.majorName ||
                  detail.student?.className
                "
              >
                {{
                  [
                    detail.student?.collegeName,
                    detail.student?.majorName,
                    detail.student?.className,
                  ]
                    .filter(Boolean)
                    .join(' / ')
                }}
              </span>
            </div>
          </div>

          <!-- 基本信息 -->
          <section class="archive-view__drawer-section">
            <p class="archive-view__drawer-section-title">基本信息</p>
            <el-descriptions :column="2" border size="small" class="archive-view__drawer-desc">
              <el-descriptions-item label="学期">{{
                detail.semesterName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="获得时间">{{
                detail.obtainedAt ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{
                detail.submittedAt ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="审核人">{{
                detail.auditorName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item v-if="detail.rejectedReason" label="退回原因" :span="2">
                <span class="archive-view__rejected">{{ detail.rejectedReason }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <!-- 扩展字段 -->
          <section v-if="detailEntries.length" class="archive-view__drawer-section">
            <p class="archive-view__drawer-section-title">
              扩展字段
              <span class="archive-view__drawer-section-count">{{ detailEntries.length }} 项</span>
            </p>
            <ul class="archive-view__kv">
              <li v-for="[key, value] in detailEntries" :key="key" class="archive-view__kv-item">
                <span class="archive-view__kv-key">{{ key }}</span>
                <span class="archive-view__kv-value">{{ renderValue(value) }}</span>
              </li>
            </ul>
          </section>

          <el-empty v-if="!detailEntries.length" description="暂无扩展字段" :image-size="72" />
        </template>
        <el-empty v-else-if="!detailLoading" description="暂无详情数据" :image-size="72" />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/assets/styles/variables.scss' as *;

.archive-view {
  /* ── 页头右侧：当前维度/学期 chip ── */
  &__head-actions {
    align-items: stretch;
  }
  &__head-chip {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 8px 14px;
    border-radius: $radius-lg;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    min-width: 96px;
  }
  &__head-chip-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  &__head-chip-value {
    margin-top: 2px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  /* ── 筛选区：分组视觉 ── */
  &__filters-head {
    .mc-card__title {
      gap: 6px;
    }
  }
  &__filters-meta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__filters-tag {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }
  &__filters-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    padding-top: 14px;
    padding-bottom: 18px;
  }
  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  &__filter-group-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--el-text-color-secondary);
  }
  &__filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: $spacing-md;
    align-items: center;
  }
  &__filter-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    justify-content: flex-end;
    grid-column: span 2;
    @media (max-width: 900px) {
      grid-column: span 1;
      justify-content: flex-start;
    }
  }
  &__select {
    width: 100%;
    &--narrow {
      max-width: 180px;
    }
    &--wide {
      grid-column: span 2;
    }
  }

  /* ── KPI 卡（横向 5 列）── */
  &__kpis {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $spacing-lg;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  &__kpi {
    position: relative;
    padding: 18px 20px 16px;
    border-radius: $radius-lg;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    overflow: hidden;
    transition:
      transform 0.25s $ease-standard,
      box-shadow 0.25s $ease-standard,
      border-color 0.25s $ease-standard;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 14px;
      bottom: 14px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--el-color-primary-light-7);
    }

    &:hover {
      transform: translateY(-2px);
      border-color: rgba($color-accent, 0.3);
      box-shadow: 0 4px 14px -6px rgba($color-primary, 0.15);
    }

    &--primary::before {
      background: var(--el-color-primary);
    }
    &--success::before {
      background: $color-success;
    }
    &--warning::before {
      background: $color-warning;
    }
    &--danger::before {
      background: $color-danger;
    }
  }
  &__kpi-label {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
  }
  &__kpi-value {
    margin: 6px 0 4px;
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.15;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  &__kpi-unit {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
  &__kpi-foot {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 1.5;
  }

  /* ── 数量徽标 ── */
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__empty-cell {
    color: var(--el-text-color-placeholder);
  }

  /* ── 组织汇总：通过率条 + 状态胶囊 ── */
  &__ratio {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 200px;
  }
  &__ratio-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }
  &__ratio-total {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
  &__ratio-unit {
    font-size: 11px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    margin-left: 2px;
  }
  &__ratio-percent {
    color: $color-success;
    font-weight: 600;
  }
  &__ratio-bar {
    display: flex;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: var(--el-fill-color-light);
  }
  &__ratio-bar-seg {
    height: 100%;
    transition: width 0.4s $ease-emphasized;

    &.is-success {
      background: $color-success;
    }
    &.is-warning {
      background: $color-warning;
    }
    &.is-danger {
      background: $color-danger;
    }
    &.is-draft {
      background: var(--el-color-primary-light-7);
    }
  }
  &__status-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__status-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;

    &.is-success {
      background: rgba($color-success, 0.12);
      color: color.adjust($color-success, $lightness: -8%);
    }
    &.is-warning {
      background: rgba($color-warning, 0.14);
      color: color.adjust($color-warning, $lightness: -10%);
    }
    &.is-danger {
      background: rgba($color-danger, 0.12);
      color: color.adjust($color-danger, $lightness: -6%);
    }
    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }

  /* ── 类型分布 chip ── */
  &__types {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__type-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-8);
  }
  &__type-count {
    font-weight: 600;
    background: var(--el-bg-color);
    padding: 0 4px;
    border-radius: 3px;
  }

  /* ── 档案明细 ── */
  &__doc {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__doc-type {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  &__doc-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__student {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__student-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  &__student-no {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__org {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__org-node {
    display: inline-flex;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    &.is-soft {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }
  &__grade {
    display: inline-block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }

  /* ── 详情抽屉 ── */
  &__drawer-body {
    padding: 4px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }
  &__drawer-hero {
    padding: 20px 22px;
    border-radius: $radius-lg;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border: 1px solid var(--el-color-primary-light-8);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      right: -40px;
      top: -40px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba($color-accent, 0.16), transparent 70%);
    }
  }
  &__drawer-hero-meta {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: 8px;
  }
  &__drawer-type {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  &__drawer-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: -0.01em;
  }
  &__drawer-hero-line {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  &__drawer-dot {
    color: var(--el-text-color-placeholder);
  }
  &__drawer-section-title {
    margin: 0 0 $spacing-sm;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 12px;
      border-radius: 0 3px 3px 0;
      background: var(--el-color-primary);
    }
  }
  &__drawer-section-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
  &__drawer-desc {
    :deep(.el-descriptions__label) {
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }
  }
  &__rejected {
    color: $color-danger;
  }

  /* 扩展字段：定义列表样式 */
  &__kv {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-lg;
    overflow: hidden;
    background: var(--el-bg-color);
  }
  &__kv-item {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: $spacing-lg;
    padding: 12px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    &:nth-child(odd) {
      background: var(--el-fill-color-light);
    }
  }
  &__kv-key {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    word-break: break-all;
  }
  &__kv-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    word-break: break-word;
    line-height: 1.6;
  }
}
</style>
