<script setup lang="ts">
import type {
  DashboardStatistics,
  SemesterItem,
  TeacherDashboardData,
  TeacherDashboardOverview,
} from '@/shared/types/teacher'
/**
 * TeacherDashboard - 教师端工作台
 *
 * 数据来源（均为后端真实接口）：
 *   - 数据范围：GET /auth/me 的 scopes
 *   - 待办/今日审核/最近审核动态：GET /teacher/dashboard（教师端）
 *   - 数据概览：GET /teacher/statistics/dashboard（教师端）
 *   - 统计快照刷新：POST /teacher/statistics/refresh（教师端）
 *   - 最近操作：管理员 → GET /admin/logs/system（教师端无等价接口）；其余角色 → 最近消息
 *
 * 视觉遵循办公风：页头 → KPI 条 → 数据概览 → 待办/快捷入口 → 最近操作，
 * 不做渐变欢迎区、图标卡片或入场动画。
 */
import { ElMessage } from 'element-plus'
import { RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import {
  getSemesters,
  getStatisticsDashboard,
  getSystemLogs,
  getTeacherDashboardOverview,
  getTeacherStatisticsDashboard,
  listMessages,
  refreshAdminStatistics,
  refreshTeacherStatistics,
} from '@/shared/api/teacher-api'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { AUDIT_ACTIONS } from '@/shared/constants/dict'
import { useDashboardOption } from './useDashboardOption'

const router = useRouter()
const userStore = useUserStore()
const { me } = useTeacherMe()
const { canAccessAny, canAccessModule, roleLabel, menuGroups } = useTeacherAuthz()

const userName = computed(() => userStore.userName)
// 管理端接口按后端真实鉴权码判定（admin 角色直通）
const useAdminStats = computed(() => canAccessAny(['statistics:view']))
const canViewSystemLogs = computed(() => canAccessAny(['log:view']))

const scopeText = ref('')

/** 数据范围摘要：从 /auth/me scopes 派生「X 学院 · Y 专业」 */
function buildScopeText() {
  const scopes = me.value?.scopes ?? []
  const colleges = new Set(
    scopes
      .filter((s) => s.scopeType === 2)
      .map((s) => s.scopeName)
      .filter(Boolean),
  )
  const majors = new Set(
    scopes
      .filter((s) => s.scopeType === 3)
      .map((s) => s.scopeName)
      .filter(Boolean),
  )
  const parts: string[] = []
  if (colleges.size) parts.push(`${colleges.size} 学院`)
  if (majors.size) parts.push(`${majors.size} 专业`)
  scopeText.value = parts.length ? parts.join(' · ') : '全校'
}

// ── 数据概览（/teacher/statistics/dashboard）──
const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)
const dashSemesterId = ref<number | undefined>(undefined)
const dashboardLoading = ref(false)
const dashboardData = ref<DashboardStatistics | TeacherDashboardData | null>(null)

// 类型隔离：两套 KPI 字段不同，按角色分开访问
const teacherDash = computed(() => dashboardData.value as TeacherDashboardData | null)
const adminDash = computed(() => dashboardData.value as DashboardStatistics | null)

async function loadSemesters() {
  loadingSemesters.value = true
  try {
    semesters.value = await getSemesters()
    // 默认带出当前学期，避免「刷新快照」前还要先手动选学期
    if (dashSemesterId.value == null) {
      dashSemesterId.value = semesters.value.find((s) => s.isCurrent === 1)?.value
    }
  } catch {
    semesters.value = []
  } finally {
    loadingSemesters.value = false
  }
}

async function loadDashboard() {
  dashboardLoading.value = true
  try {
    // 持 statistics:view（或 admin 角色）调 /admin/statistics/dashboard（全校数据），
    // 其余教师调 /teacher/statistics/dashboard（学院范围）
    dashboardData.value = useAdminStats.value
      ? await getStatisticsDashboard({ semesterId: dashSemesterId.value })
      : await getTeacherStatisticsDashboard({ semesterId: dashSemesterId.value })
  } catch {
    dashboardData.value = null
  } finally {
    dashboardLoading.value = false
  }
}

// ── 待办工作台（GET /teacher/dashboard）──
const dashboardOverview = ref<TeacherDashboardOverview | null>(null)
const overviewLoading = ref(false)

async function loadDashboardOverview() {
  overviewLoading.value = true
  try {
    dashboardOverview.value = await getTeacherDashboardOverview()
  } catch {
    dashboardOverview.value = null
  } finally {
    overviewLoading.value = false
  }
}

/** 统计快照刷新 —— 管理员走 /admin/statistics/refresh，教师走 /teacher/statistics/refresh */
async function handleRefreshSnapshot() {
  if (!dashSemesterId.value) {
    ElMessage.warning('请先选择学期')
    return
  }
  overviewLoading.value = true
  try {
    if (useAdminStats.value) {
      await refreshAdminStatistics({ semesterId: dashSemesterId.value })
    } else {
      await refreshTeacherStatistics({ semesterId: dashSemesterId.value })
    }
    ElMessage.success('统计快照已刷新')
    await Promise.all([loadDashboard(), loadDashboardOverview()])
  } catch {
    /* 拦截器已提示 */
  } finally {
    overviewLoading.value = false
  }
}

const { pendingItems, quickLinks, todayDate } = useDashboardOption({
  dashboardOverview,
  canAccessModule,
})

const pendingTotal = computed(() => dashboardOverview.value?.pendingStats.totalPending ?? null)

const pendingMeta = computed(() => {
  const stats = dashboardOverview.value?.pendingStats
  if (!stats) return '暂无待办数据'
  const parts = [
    stats.archivePending ? `${stats.archivePending} 项档案` : '',
    stats.awardPending ? `${stats.awardPending} 项奖项` : '',
    stats.careerPlanPending ? `${stats.careerPlanPending} 项规划` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : '当前没有待办'
})

const kpis = computed(() => {
  const pendingReview = dashboardData.value?.pendingCount ?? null
  return [
    {
      label: '待处理事项',
      value: pendingTotal.value,
      unit: '项',
      meta: pendingMeta.value,
      tone: 'warning' as const,
      alert: pendingTotal.value != null && pendingTotal.value > 0,
    },
    {
      label: '在库学生',
      value: dashboardData.value?.studentCount ?? null,
      unit: '人',
      meta: useAdminStats.value ? '全校统计范围' : teacherDash.value?.scopeName || scopeText.value,
      tone: 'info' as const,
      alert: false,
    },
    {
      label: '待审核',
      value: pendingReview,
      unit: '份',
      meta: '档案数据概览',
      tone: 'warning' as const,
      alert: pendingReview != null && pendingReview > 0,
    },
    {
      label: '今日审核',
      value: dashboardOverview.value?.todayAudited ?? null,
      unit: '份',
      meta: todayDate.value,
      tone: 'success' as const,
      alert: false,
    },
  ]
})

const dataMetrics = computed(() => {
  const rejected = teacherDash.value?.rejectedCount ?? null
  return [
    {
      label: '学生数',
      value: dashboardData.value?.studentCount ?? null,
      sub: useAdminStats.value ? '全校在库' : teacherDash.value?.scopeName || '授权范围',
      alertDanger: false,
    },
    {
      label: useAdminStats.value ? '档案数' : '已提交',
      value: useAdminStats.value
        ? (adminDash.value?.archiveCount ?? null)
        : (teacherDash.value?.submittedCount ?? null),
      sub: '当前学期',
      alertDanger: false,
    },
    {
      label: '待审核',
      value: dashboardData.value?.pendingCount ?? null,
      sub: '待处理',
      alertDanger: false,
    },
    {
      label: '已通过',
      value: dashboardData.value?.approvedCount ?? null,
      sub: '审核通过',
      alertDanger: false,
    },
    {
      label: useAdminStats.value ? '奖项数' : '被退回',
      value: useAdminStats.value ? (adminDash.value?.awardCount ?? null) : rejected,
      sub: useAdminStats.value ? '全校记录' : '需学生修改',
      alertDanger: !useAdminStats.value && rejected != null && rejected > 0,
    },
    {
      label: '平均绩点',
      value: useAdminStats.value
        ? (adminDash.value?.avgGpa ?? null)
        : (teacherDash.value?.averageGpa ?? null),
      sub: '当前学期',
      alertDanger: false,
    },
  ]
})

/** 审核动作 → 语义色（通过 / 退回 / 撤回 / 转交） */
function auditTone(action: number): string {
  return AUDIT_ACTIONS[action]?.tag ?? 'info'
}

const semesterLabel = computed(
  () => adminDash.value?.semesterName || dashboardOverview.value?.currentSemesterName || '当前学期',
)

const availableModuleCount = computed(() =>
  menuGroups.value.reduce((total, entry) => total + entry.items.length, 0),
)

const refreshing = ref(false)

async function refreshAll() {
  refreshing.value = true
  try {
    buildScopeText()
    await Promise.all([loadDashboard(), loadDashboardOverview(), loadRecent()])
  } finally {
    refreshing.value = false
  }
}

watch(dashSemesterId, () => void loadDashboard())

// ── 最近动态：管理员看系统日志，其余角色看最近消息 ──
interface RecentItem {
  user: string
  action: string
  time: string
  status: 'success' | 'info' | 'warning'
}
const recentLogs = ref<RecentItem[]>([])

async function loadRecent() {
  if (canViewSystemLogs.value) {
    try {
      const logs = await getSystemLogs({ page: 1, per_page: 5 })
      recentLogs.value = logs.list.map((l) => ({
        user: l.operatorName ?? '系统',
        action: l.description ?? `${l.module ?? ''}${l.action ?? ''}`,
        time: l.createdAt ? l.createdAt.slice(11, 16) : '',
        status: 'success' as const,
      }))
    } catch {
      recentLogs.value = []
    }
  } else {
    try {
      const msg = await listMessages({ page: 1, per_page: 5 })
      recentLogs.value = msg.list.map((m) => ({
        user: m.senderName ?? '系统',
        action: m.title,
        time: m.createdAt ? m.createdAt.slice(11, 16) : '',
        status: (m.isImportant ? 'warning' : 'info') as RecentItem['status'],
      }))
    } catch {
      recentLogs.value = []
    }
  }
}

function displayValue(value: number | string | null | undefined): string {
  return value == null || value === '' ? '—' : String(value)
}

onMounted(() => {
  buildScopeText()
  void loadRecent()
  void loadSemesters()
  void loadDashboard()
  void loadDashboardOverview()
})
</script>

<template>
  <div class="mc-page teacher-dashboard">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">工作台</h2>
        <p class="mc-page-head__desc">
          {{ userName }}，今天有 {{ pendingTotal ?? 0 }} 项待办需要处理。数据范围：{{ scopeText }}。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="refreshing" @click="refreshAll">刷新数据</el-button>
        <el-button
          v-if="canAccessModule('archive-view')"
          type="primary"
          @click="router.push('/teacher/archive-view')"
        >
          查看档案
        </el-button>
      </div>
    </div>

    <!-- 待办提醒：仅有待办时出现，浅琥珀底 + 深琥珀文字 -->
    <div v-if="pendingTotal" class="dash-notice">
      你有 {{ pendingTotal }} 项待处理事项，建议优先处理待审核档案。
    </div>

    <!-- KPI 条 -->
    <div class="dash-kpis">
      <div
        v-for="item in kpis"
        :key="item.label"
        class="dash-kpis__item"
        :class="`dash-kpis__item--${item.tone}`"
      >
        <span class="dash-kpis__label">{{ item.label }}</span>
        <span class="dash-kpis__value mc-num" :class="{ 'dash-kpis__value--alert': item.alert }">
          {{ displayValue(item.value) }}<small v-if="item.value != null">{{ item.unit }}</small>
        </span>
        <span class="dash-kpis__meta">{{ item.meta }}</span>
      </div>
    </div>

    <!-- 档案数据概览 -->
    <section class="dash-data">
      <div class="dash-data__head">
        <div>
          <h3 class="dash-data__title">档案数据概览</h3>
          <p class="dash-data__sub">
            {{ semesterLabel }} · {{ useAdminStats ? '全校' : teacherDash?.scopeName || scopeText }}
          </p>
        </div>
        <div class="dash-data__tools">
          <el-select
            v-model="dashSemesterId"
            class="u-w-160"
            clearable
            placeholder="当前学期"
            size="small"
            :loading="loadingSemesters"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-button size="small" :loading="dashboardLoading" @click="loadDashboard"
            >刷新</el-button
          >
          <el-button size="small" :loading="overviewLoading" @click="handleRefreshSnapshot">
            刷新快照
          </el-button>
        </div>
      </div>

      <div v-loading="dashboardLoading" class="dash-data__body">
        <div class="dash-metrics">
          <div v-for="metric in dataMetrics" :key="metric.label" class="dash-metric">
            <span class="dash-metric__label">{{ metric.label }}</span>
            <span
              class="dash-metric__value mc-num"
              :class="{ 'dash-metric__value--danger': metric.alertDanger }"
            >
              {{ displayValue(metric.value) }}
            </span>
            <span class="dash-metric__sub">{{ metric.sub }}</span>
          </div>
        </div>

        <div v-if="dashboardData?.dimensionAvgScores?.length" class="dash-dims">
          <span class="dash-dims__label">画像维度平均分</span>
          <span
            v-for="d in dashboardData.dimensionAvgScores"
            :key="d.dimensionCode"
            class="dash-dims__item"
          >
            {{ d.dimensionName }} <b class="mc-num">{{ d.avgScore ?? '-' }}</b>
          </span>
        </div>
      </div>
    </section>

    <!-- 待办 + 快捷入口 / 我的权限 -->
    <div class="dash-grid">
      <section class="dash-card dash-card--main">
        <div class="dash-card__head">
          <div>
            <h3 class="dash-card__title">待办工作台</h3>
            <p class="dash-card__sub">共 {{ pendingTotal ?? 0 }} 项待处理事项</p>
          </div>
          <el-button size="small" :loading="overviewLoading" @click="loadDashboardOverview">
            刷新
          </el-button>
        </div>

        <div v-loading="overviewLoading" class="dash-card__body">
          <div class="dash-todo-stats">
            <div v-for="item in pendingItems" :key="item.label" class="dash-todo-stat">
              <span class="dash-todo-stat__label">{{ item.label }}</span>
              <span class="dash-todo-stat__value mc-num">{{ item.value }}</span>
            </div>
          </div>

          <div v-if="dashboardOverview?.recentAudits?.length" class="dash-audits">
            <div class="dash-audits__head">
              <span>最近审核动态</span>
              <span v-if="dashboardOverview.currentSemesterName" class="dash-audits__meta">
                {{ dashboardOverview.currentSemesterName }}
              </span>
            </div>
            <ul class="dash-audits__list">
              <li
                v-for="audit in dashboardOverview.recentAudits.slice(0, 5)"
                :key="audit.id"
                class="dash-audits__item"
              >
                <span class="dash-audits__name">{{ audit.studentName }}</span>
                <span class="dash-audits__title">{{ audit.title }}</span>
                <span
                  class="dash-audits__action"
                  :class="`dash-audits__action--${auditTone(audit.action)}`"
                >
                  {{ audit.actionLabel }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else-if="!overviewLoading" class="dash-empty">暂无待办数据。</p>
        </div>
      </section>

      <aside class="dash-side">
        <section class="dash-card">
          <div class="dash-card__head">
            <h3 class="dash-card__title">快捷入口</h3>
          </div>
          <div class="dash-card__body">
            <div class="quick-grid">
              <button
                v-for="link in quickLinks"
                :key="link.path"
                type="button"
                class="quick-link"
                @click="router.push(link.path)"
              >
                <component :is="link.icon" :size="16" class="quick-link__icon" />
                <span class="quick-link__main">
                  <span class="quick-link__label">{{ link.label }}</span>
                  <span class="quick-link__desc">{{ link.desc }}</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section class="dash-card">
          <div class="dash-card__head">
            <h3 class="dash-card__title">我的角色与数据范围</h3>
          </div>
          <div class="dash-card__body">
            <dl class="dash-info">
              <div class="dash-info__row">
                <dt>当前角色</dt>
                <dd>{{ roleLabel || '教师' }}</dd>
              </div>
              <div class="dash-info__row">
                <dt>数据范围</dt>
                <dd>{{ scopeText }}</dd>
              </div>
              <div class="dash-info__row">
                <dt>可用模块</dt>
                <dd>{{ availableModuleCount }} 项</dd>
              </div>
              <div class="dash-info__row">
                <dt>当前学期</dt>
                <dd>{{ semesterLabel }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </aside>
    </div>

    <!-- 最近操作 -->
    <section class="dash-card">
      <div class="dash-card__head">
        <div>
          <h3 class="dash-card__title">最近操作</h3>
          <p class="dash-card__sub">
            {{ canViewSystemLogs ? '系统操作记录' : '最近消息' }}
          </p>
        </div>
      </div>
      <div class="dash-card__body">
        <ul v-if="recentLogs.length" class="recent-list">
          <li v-for="(log, index) in recentLogs" :key="index" class="recent-list__item">
            <span class="recent-list__dot" :class="`recent-list__dot--${log.status}`" />
            <span class="recent-list__action">{{ log.action }}</span>
            <span class="recent-list__meta">{{ log.user }} · {{ log.time }}</span>
          </li>
        </ul>
        <p v-else class="dash-empty">暂无最近操作。</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss" src="./TeacherDashboard.scss"></style>
