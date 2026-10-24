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
 * - /teacher/archives/overview（教师端组织档案汇总，维度全校/学院/专业/班级 + 下钻）
 * - /teacher/archives（教师端学生档案列表，支持组织/状态/学期/关键词筛选）
 * 以上两项与管理端 /admin/archives* 的参数、响应字段完全一致，差别仅在鉴权口径
 * （教师按 role_scopes 限定范围，管理端不限制）。
 * 仍为 admin 端点、待后端补教师端接口的部分：
 * - /admin/archives/{archiveId}（档案详情，教师身份会 403，详见 openDetail）
 * - /admin/statistics/overview（档案汇总统计看板，见 StatisticsOverview.vue）
 * 行内「学生档案」按钮进入 /teacher/student-detail/{userId}（教师端 /teacher/students/*）。
 * 学期下拉与学院/专业/班级范围来自 /common/semesters + /auth/me scopes。
 *
 * 页面按区块拆分为子组件（仅通过 props 传入数据、emit 回传事件）：
 * ArchiveFilterSection / ArchiveKpiSection / ArchiveOverviewTable /
 * ArchiveDetailTable / ArchiveDetailDrawer。
 */
import { ElMessage } from 'element-plus'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getArchiveDetail,
  getSemesters,
  getTeacherArchiveOverview,
  listTeacherArchives,
} from '@/shared/api/teacher-api'
import { scopeCascade, useScopeFilter } from '@/shared/composables/useScopeFilter'
import ArchiveDetailDrawer from './ArchiveDetailDrawer.vue'
import ArchiveDetailTable from './ArchiveDetailTable.vue'
import ArchiveFilterSection from './ArchiveFilterSection.vue'
import ArchiveKpiSection from './ArchiveKpiSection.vue'
import ArchiveOverviewTable from './ArchiveOverviewTable.vue'
import StatisticsOverview from './StatisticsOverview.vue'

defineOptions({ name: 'ArchiveView' })

const router = useRouter()

/** 进入学生成长档案详情（/teacher/students/{userId}） */
function openStudentArchive(row: ArchiveAdminListItem) {
  if (!row.userId) {
    ElMessage.warning('该档案缺少学生信息')
    return
  }
  void router.push(`/teacher/student-detail/${row.userId}`)
}

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

/** 组织范围下拉项（学院/专业/班级，来自 /auth/me 的 scopes） */
const { colleges, majors, classes } = useScopeFilter()

const DIMENSION_ORG_TYPE: Record<string, number | undefined> = {
  全校: undefined,
  学院: 2,
  专业: 3,
  班级: 4,
}

const dimension = ref('全校')
/** 组织维度 → 学院/专业/班级下拉显隐 */
const cascade = computed(() => scopeCascade(DIMENSION_ORG_TYPE[dimension.value]))
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

/** 筛选子组件回传字段补丁，合并回当前筛选条件 */
function handleFiltersUpdate(patch: Partial<typeof filters>) {
  Object.assign(filters, patch)
}

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
    const res = await getTeacherArchiveOverview({
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

/* ── 档案列表（/teacher/archives）── */

const listLoading = ref(false)
const list = ref<ArchiveAdminListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)

async function loadList() {
  listLoading.value = true
  try {
    const res = await listTeacherArchives({
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

/** 切换每页条数：回到第一页并重新拉取列表 */
function handleSizeChange(s: number) {
  perPage.value = s
  page.value = 1
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

/* ── 档案详情（/admin/archives/{id}）：教师端暂无等价接口，教师身份调用会 403，
      待后端补 /teacher/archives/{archiveId} 后改接；此处保留现状（详见文件头注释）── */

const detailDrawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ArchiveAdminDetail | null>(null)

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

    <ArchiveFilterSection
      v-model:dimension="dimension"
      :filters="filters"
      :semesters="semesters"
      :loading-semesters="loadingSemesters"
      :colleges="colleges"
      :majors="majors"
      :classes="classes"
      :cascade="cascade"
      :has-active-filter="hasActiveFilter"
      @update:filters="handleFiltersUpdate"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ArchiveKpiSection :kpis="kpis" />

    <ArchiveOverviewTable :dimension="dimension" :rows="overviewRows" :loading="overviewLoading" />

    <!-- 统计看板（自带筛选，置于下方作为补充） -->
    <StatisticsOverview class="archive-view__stats" />

    <ArchiveDetailTable
      :list="list"
      :loading="listLoading"
      :total="total"
      :page="page"
      :per-page="perPage"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @open-student-archive="openStudentArchive"
      @open-detail="openDetail"
    />

    <ArchiveDetailDrawer
      v-model="detailDrawerVisible"
      :loading="detailLoading"
      :detail="detail"
      @closed="handleDrawerClosed"
    />
  </div>
</template>

<style scoped lang="scss">
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
}
</style>
