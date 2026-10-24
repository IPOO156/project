<script setup lang="ts">
import type {
  DashboardStatistics,
  SemesterItem,
  TeacherDashboardData,
  TeacherDashboardOverview,
} from '@/shared/types/teacher'
/**
 * TeacherDashboard - 教师端首页仪表盘
 *
 * 数据来源（能接就接，均为后端真实接口）：
 *   - 欢迎区：userStore（登录后已写入）
 *   - 未读消息：GET /messages（与学生端共用，保持不动）
 *   - 数据范围：GET /auth/me 的 scopes
 *   - 待办/今日审核/最近审核动态：GET /teacher/dashboard（教师端）
 *   - 数据概览：GET /teacher/statistics/dashboard（教师端）
 *   - 统计快照刷新：POST /teacher/statistics/refresh（教师端）
 *   - 最近操作：管理员 → GET /admin/logs/system（教师端无等价接口）；其余角色 → 最近消息
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
import { useDashboardOption } from './useDashboardOption'

const router = useRouter()
const userStore = useUserStore()
const { me } = useTeacherMe()
// 模块授权与角色名统一取自 /auth/me（permissions / roleNames）
const { canAccessAny, canAccessModule, roleLabel } = useTeacherAuthz()

const userName = computed(() => userStore.userName)
// 管理端接口按后端真实鉴权码判定（admin 角色直通）：
//   数据概览/快照刷新 → statistics:view；系统日志 → log:view。
// 不能用单一「是否管理员」布尔量同时控制两者，也不能裸用 hasPermission（管理员权限码可能为空）。
const useAdminStats = computed(() => canAccessAny(['statistics:view']))
const canViewSystemLogs = computed(() => canAccessAny(['log:view']))

// ── 真实统计数据 ──
const unreadCount = ref<number | null>(null)
const scopeText = ref('')
const recentTotal = ref<number | null>(null)

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

async function loadStats() {
  try {
    const msg = await listMessages({ page: 1, per_page: 1 })
    unreadCount.value = msg.unread
  } catch {
    unreadCount.value = null
  }
  buildScopeText()
  if (canViewSystemLogs.value) {
    try {
      const logs = await getSystemLogs({ page: 1, per_page: 1 })
      recentTotal.value = logs.total
    } catch {
      recentTotal.value = null
    }
  } else {
    recentTotal.value = null
  }
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
  try {
    dashboardOverview.value = await getTeacherDashboardOverview()
  } catch {
    dashboardOverview.value = null
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

// 卡片 / KPI / 快捷入口等展示配置统一由 composable 提供（与原实现逐字一致）
const { pendingItems, statsCards, quickLinks, todayDate } = useDashboardOption({
  canViewSystemLogs,
  unreadCount,
  scopeText,
  recentTotal,
  roleLabel,
  dashboardOverview,
  canAccessModule,
})

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

onMounted(() => {
  void loadStats()
  void loadRecent()
  void loadSemesters()
  void loadDashboard()
  void loadDashboardOverview()
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- 欢迎区域 -->
    <div class="teacher-dashboard__welcome">
      <div class="teacher-dashboard__welcome-text">
        <h2 class="teacher-dashboard__greeting">欢迎回来，{{ userName }}</h2>
        <p class="teacher-dashboard__date">{{ todayDate }}</p>
      </div>
      <div class="teacher-dashboard__welcome-role">
        <span class="teacher-dashboard__role-tag">{{ roleLabel || '教师' }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="teacher-dashboard__stats">
      <el-col v-for="card in statsCards" :key="card.label" :xs="12" :sm="6" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__info">
              <p class="stat-card__label">{{ card.label }}</p>
              <p class="stat-card__value">{{ card.value }}</p>
            </div>
            <div class="stat-card__icon" :style="{ '--chip': card.color }">
              <component :is="card.icon" :size="24" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待办工作台（GET /teacher/dashboard） -->
    <el-card class="teacher-dashboard__section dash-overview">
      <template #header>
        <span class="section-title">待办工作台</span>
        <span v-if="dashboardOverview?.currentSemesterName" class="dash-overview__scope">
          当前学期：{{ dashboardOverview.currentSemesterName }}
        </span>
        <div class="dash-overview__tools">
          <el-button size="small" :loading="overviewLoading" @click="loadDashboardOverview"
            >刷新</el-button
          >
        </div>
      </template>
      <div v-loading="overviewLoading">
        <template v-if="dashboardOverview">
          <div class="dash-overview__kpis">
            <div v-for="item in pendingItems" :key="item.label" class="dash-overview__kpi">
              <span class="dash-overview__label">{{ item.label }}</span>
              <span class="dash-overview__value mc-num">{{ item.value }}</span>
            </div>
          </div>
          <div v-if="dashboardOverview.recentAudits?.length" class="dash-overview__dims">
            <span class="dash-overview__dim-label">最近审核动态</span>
            <el-tag
              v-for="a in dashboardOverview.recentAudits"
              :key="a.id"
              size="small"
              effect="plain"
              class="dash-overview__dim"
            >
              {{ a.studentName }} · {{ a.title }} · {{ a.actionLabel }}
            </el-tag>
          </div>
        </template>
        <el-empty v-else-if="!overviewLoading" description="暂无待办数据" :image-size="72" />
      </div>
    </el-card>

    <!-- 档案数据概览（/teacher/statistics/dashboard） -->
    <el-card class="teacher-dashboard__section dash-overview">
      <template #header>
        <span class="section-title">档案数据概览</span>
        <span v-if="!useAdminStats && teacherDash?.scopeName" class="dash-overview__scope">
          统计范围：{{ teacherDash.scopeName }}
        </span>
        <div class="dash-overview__tools">
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
          <el-button
            size="small"
            :icon="RefreshCw"
            :loading="overviewLoading"
            @click="handleRefreshSnapshot"
            >刷新快照</el-button
          >
        </div>
      </template>
      <div v-loading="dashboardLoading">
        <template v-if="dashboardData">
          <div class="dash-overview__kpis">
            <div class="dash-overview__kpi">
              <span class="dash-overview__label">学生数</span>
              <span class="dash-overview__value mc-num">{{
                dashboardData.studentCount ?? '—'
              }}</span>
            </div>
            <div class="dash-overview__kpi">
              <span class="dash-overview__label">{{ useAdminStats ? '档案数' : '已提交' }}</span>
              <span class="dash-overview__value mc-num">{{
                (useAdminStats ? adminDash?.archiveCount : teacherDash?.submittedCount) ?? '—'
              }}</span>
            </div>
            <div class="dash-overview__kpi">
              <span class="dash-overview__label">待审核</span>
              <span class="dash-overview__value mc-num">{{
                dashboardData.pendingCount ?? '—'
              }}</span>
            </div>
            <div class="dash-overview__kpi">
              <span class="dash-overview__label">已通过</span>
              <span class="dash-overview__value mc-num">{{
                dashboardData.approvedCount ?? '—'
              }}</span>
            </div>
            <div v-if="!useAdminStats" class="dash-overview__kpi">
              <span class="dash-overview__label">被退回</span>
              <span class="dash-overview__value mc-num">{{
                teacherDash?.rejectedCount ?? '—'
              }}</span>
            </div>
            <div v-if="useAdminStats" class="dash-overview__kpi">
              <span class="dash-overview__label">奖项数</span>
              <span class="dash-overview__value mc-num">{{ adminDash?.awardCount ?? '—' }}</span>
            </div>
            <div class="dash-overview__kpi">
              <span class="dash-overview__label">平均绩点</span>
              <span class="dash-overview__value mc-num">{{
                (useAdminStats ? adminDash?.avgGpa : teacherDash?.averageGpa) ?? '—'
              }}</span>
            </div>
          </div>
          <div v-if="dashboardData.dimensionAvgScores?.length" class="dash-overview__dims">
            <span class="dash-overview__dim-label">画像维度得分</span>
            <el-tag
              v-for="d in dashboardData.dimensionAvgScores"
              :key="d.dimensionCode"
              size="small"
              effect="plain"
              class="dash-overview__dim"
            >
              {{ d.dimensionName }} {{ d.avgScore ?? '-' }}
            </el-tag>
          </div>
        </template>
        <el-empty v-else-if="!dashboardLoading" description="暂无统计数据" :image-size="72" />
      </div>
    </el-card>

    <!-- 主体区域 -->
    <el-row :gutter="16" class="teacher-dashboard__main">
      <!-- 快捷入口 -->
      <el-col :span="14" class="teacher-dashboard__col">
        <el-card class="teacher-dashboard__section">
          <template #header>
            <span class="section-title">快捷操作</span>
          </template>
          <div class="quick-link-grid">
            <div
              v-for="link in quickLinks"
              :key="link.path"
              class="quick-link-card"
              @click="router.push(link.path)"
            >
              <div class="quick-link-card__icon">
                <component :is="link.icon" :size="22" />
              </div>
              <span class="quick-link-card__label">{{ link.label }}</span>
              <span class="quick-link-card__desc">{{ link.desc }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近操作 -->
      <el-col :span="10" class="teacher-dashboard__col">
        <el-card class="teacher-dashboard__section">
          <template #header>
            <span class="section-title">最近操作</span>
          </template>
          <div class="recent-logs">
            <div v-for="(log, i) in recentLogs" :key="i" class="recent-logs__item">
              <div class="recent-logs__dot" :class="`recent-logs__dot--${log.status}`" />
              <div class="recent-logs__content">
                <p class="recent-logs__action">{{ log.action }}</p>
                <span class="recent-logs__meta">{{ log.user }} · {{ log.time }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss" src="./TeacherDashboard.scss"></style>
