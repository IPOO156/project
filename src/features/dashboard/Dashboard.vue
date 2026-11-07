<script setup lang="ts">
import type { QuickEntry } from './composables/useQuickEntries'
import { ElMessage } from 'element-plus'
import { Award, Clock, FileText, TrendingUp } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useActivityStore,
  useArchiveStore,
  useHomeStore,
  useSubmissionStore,
  useThemeStore,
} from '@/app/stores/stores'
import { useScoreIndicator } from '@/shared/composables/composables'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import QuickEntries from './components/QuickEntries.vue'
import QuickEntrySettings from './components/QuickEntrySettings.vue'
import StatsOverview from './components/StatsOverview.vue'
import { useQuickEntries } from './composables/useQuickEntries'
import ProfileRadarCard from './ProfileRadarCard.vue'
import RecentActivitiesCard from './RecentActivitiesCard.vue'

const router = useRouter()
const activityStore = useActivityStore()
const archiveStore = useArchiveStore()
const homeStore = useHomeStore()
const submissionStore = useSubmissionStore()
const themeStore = useThemeStore()
const { visibleEntries, allEntries, recordClick, refreshPool, updateOrder, toggleHidden } =
  useQuickEntries()
const showSettings = ref(false)

const {
  indicators: scoreIndicators,
  indicatorVisible,
  indicatorLoading,
  indicatorTitle,
  indicatorCalculationId,
  indicatorTotalScore,
  indicatorMaxTotalScore,
  openIndicator,
  closeIndicator,
} = useScoreIndicator()

// ── 从 store 派生展示数据（数据由 API 层填充 store） ──

interface KpiSnapshot {
  total: number | null
  approved: number | null
  pending: number | null
  rejected: number | null
  gpa: number | null
}

/**
 * KPI 的原始计数：优先 /home/dashboard，缺失时回退本地申报 store，两者都没有则为 null。
 * 前端不补 0、不估算，null 一律交给展示层渲染「--」与空态。
 *
 * 学期均绩取数口均为后端权威值：
 * 1. `/home/dashboard` 的 `currentGpa`（当前学期口径）；
 * 2. 缺失时退到 `/profile/info` 的 `overallGpa`（累计学分加权口径）。
 * 不在前端按学分加权自算，避免同一时点出现多个绩点数字。
 */
const kpiSnapshot = computed<KpiSnapshot>(() => {
  const home = homeStore.data
  const records = submissionStore.records
  const countByStatus = (status: string) => records.filter((r) => r.status === status).length
  const pick = (apiValue: number | undefined, fallback: () => number | null): number | null =>
    typeof apiValue === 'number' ? apiValue : fallback()

  const profileGpa = archiveStore.profileData?.overallGpa
  return {
    total: pick(home?.applicationTotal, () => (records.length > 0 ? records.length : null)),
    approved: pick(home?.approvedCount, () =>
      records.length > 0 ? countByStatus('approved') : null,
    ),
    pending: pick(home?.pendingCount, () => (records.length > 0 ? countByStatus('pending') : null)),
    rejected: pick(home?.rejectedCount, () =>
      records.length > 0 ? countByStatus('rejected') : null,
    ),
    gpa:
      typeof home?.currentGpa === 'number'
        ? home.currentGpa
        : typeof profileGpa === 'number'
          ? profileGpa
          : null,
  }
})

/** 通过率：仅在总数与通过数都真实存在时计算 */
const passRate = computed<number | null>(() => {
  const { total, approved } = kpiSnapshot.value
  if (total === null || approved === null || total <= 0) return null
  return Math.round((approved / total) * 100)
})

// 统计卡片：数值/单位/脚注全部来自 kpiSnapshot，缺数时显示「--」并给出空态脚注
const statsCards = computed(() => {
  const s = kpiSnapshot.value
  const rate = passRate.value
  return [
    {
      label: '申报总数',
      value: s.total ?? '--',
      unit: '次',
      foot: s.total === null ? '暂无申报数据' : '查看申报记录',
      icon: FileText,
      color: themeStore.isDark ? '#60a5fa' : '#2d5a87',
      path: '/applications',
    },
    {
      label: '已通过',
      value: s.approved ?? '--',
      unit: '次',
      foot: rate === null ? '通过率 --' : `通过率 ${rate}%`,
      icon: Award,
      color: '#10b981',
      path: '/approval/pending',
    },
    {
      label: '待审批',
      value: s.pending ?? '--',
      unit: '次',
      foot: s.pending === null || s.pending === 0 ? '暂无待审事项' : '查看待审事项',
      icon: Clock,
      color: '#d4a574',
      path: '/approval/pending',
    },
    {
      label: '学期均绩',
      value: s.gpa ?? '--',
      unit: 'GPA',
      foot: s.gpa === null ? '暂无成绩数据' : '当前学期口径',
      icon: TrendingUp,
      color: '#d4a574',
      path: '/profile/info',
    },
  ]
})

// 多维度画像：优先使用 /home/dashboard radarChart，缺失时回退 archiveStore
const profileDimensions = computed(() => {
  const home = homeStore.data
  if (home?.radarChart?.dimensions && home.radarChart.dimensions.length > 0) {
    const { dimensions, current, target, previous } = home.radarChart
    return dimensions.map((d: any, i: number) => ({
      label: d.name,
      current: current[i] ?? 0,
      target: target[i] ?? 0,
      previous: previous[i] ?? 0,
    }))
  }
  return archiveStore.dimensions
})

/**
 * 有环比基线的维度 → 对比学期名。
 *
 * 判据取 `comparedSemesterId != null`（id 是权威键，学期名仅用于展示）：
 * 后端在无上期数据时返回 `comparedSemesterId: null`、`comparedSemesterName: null`，
 * 但 `radarChart.previous` 仍是 `[0,0,0]` 而非 null。若拿它直接相减，会得到
 * 「较上阶段 +20分」这种**前端编造出来的趋势**（把「没有上期数据」当成了「上期考 0 分」）。
 * 这与 app/stores/archive.ts 中「无环比数据时 previous 与 current 相同（前端不编造趋势）」
 * 的既有口径一致 —— store 层做了防护，此处这条路径此前绕过了它。
 *
 * 后端已在 `radarChart` 下发显式开关 `hasPrevious`（见 3.1 雷达图环比口径），
 * 该开关为 boolean 时即为**权威判据**（见 hasPreviousFromApi）；
 * 本 Map 退为「取对比学期名做文案」的用途，不再单独决定有无基线。
 */
const comparedSemesterMap = computed(() => {
  const map = new Map<string, string>()
  for (const ind of homeStore.data?.indicators ?? []) {
    if (ind.dimensionName && ind.comparedSemesterId != null) {
      map.set(ind.dimensionName, ind.comparedSemesterName ?? '上阶段')
    }
  }
  return map
})

/**
 * 后端权威的「有无上阶段」开关。仅当它确实是 boolean 时返回值，否则返回 null 表示
 * 后端未下发该字段（老版本），由调用方退回按对比学期名推断。
 */
const hasPreviousFromApi = computed<boolean | null>(() => {
  const v = homeStore.data?.radarChart?.hasPrevious
  return typeof v === 'boolean' ? v : null
})

const indicatorMeta = computed(() => {
  const first = homeStore.data?.indicators?.[0]
  const rate = homeStore.data?.dataCompleteness?.rate
  return {
    ruleVersion: first?.ruleVersion == null ? '--' : `v${first.ruleVersion}`,
    calculatedAt: first?.calculatedAt ?? '--',
    completeness: rate == null ? '--' : `${Math.round(rate <= 1 ? rate * 100 : rate)}%`,
  }
})

const recentActivities = computed(() => activityStore.filteredActivities.slice(0, 5))

async function onEntryClick(entry: QuickEntry) {
  recordClick(entry.path)
  try {
    await router.push(entry.path)
  } catch {
    ElMessage.error('页面跳转失败，请稍后重试')
  }
}

function onStatCardClick(path: string) {
  void router.push(path)
}

function onViewAllActivities() {
  void router.push('/messages/activities')
}

function onOpenIndicator(label: string) {
  openIndicator(label, label)
}

function onQuickRefresh() {
  refreshPool()
}

function onToggleHidden(id: string) {
  toggleHidden(id)
}

function onUpdateOrder(orderedIds: string[]) {
  updateOrder(orderedIds)
}

onMounted(() => {
  homeStore.fetchDashboard()
  activityStore.fetchActivities()
  // 档案与申报数据：若已缓存则不重复拉取
  if (archiveStore.dimensions.length === 0) archiveStore.fetchArchive()
  if (submissionStore.records.length === 0) submissionStore.fetchRecords()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__head">
      <h1 class="dashboard__title">首页</h1>
      <span class="dashboard__sub">学生成长概览</span>
    </header>

    <StatsOverview
      :cards="statsCards"
      :snapshot="kpiSnapshot"
      :meta="indicatorMeta"
      @card-click="onStatCardClick"
    />

    <ProfileRadarCard
      :dimensions="profileDimensions"
      :compared-semester-map="comparedSemesterMap"
      :has-previous-from-api="hasPreviousFromApi"
      :indicator-meta="indicatorMeta"
      @view-profile="onStatCardClick('/profile/info')"
      @open-indicator="onOpenIndicator"
    />

    <div class="dashboard__bottom">
      <QuickEntries
        :entries="visibleEntries"
        :total-count="allEntries.length"
        @entry-click="onEntryClick"
        @refresh="onQuickRefresh"
        @toggle-hidden="onToggleHidden"
        @update-order="onUpdateOrder"
        @open-settings="showSettings = true"
      />

      <RecentActivitiesCard
        :activities="recentActivities"
        :loading="activityStore.loading"
        @view-all="onViewAllActivities"
      />
    </div>

    <QuickEntrySettings v-model:visible="showSettings" />
    <ScoreIndicatorDialog
      :visible="indicatorVisible"
      :loading="indicatorLoading"
      :title="indicatorTitle"
      :indicators="scoreIndicators"
      :calculation-id="indicatorCalculationId"
      :total-score="indicatorTotalScore"
      :max-total-score="indicatorMaxTotalScore"
      @close="closeIndicator"
    />
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  // 撑满外壳可用高度：视口高 − 顶栏 − 内容区上下 padding（1440×900 下为 796px）。
  // 内容超出时自然增高并交给外壳滚动，不做 overflow 裁切。
  min-height: calc(100dvh - #{$header-height} - #{$spacing-xl} * 2);
}

.dashboard__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-height: 30px;
}

.dashboard__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.dashboard__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// 第二带（画像）与第三带按剩余高度等比例长大，内容按自身尺寸兜底
.dashboard > .profile-card {
  flex: 1 1 auto;
}

.dashboard__bottom {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 1.35fr minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  min-width: 0;
}

// 窄桌面下双栏会压缩快捷入口，改为上下堆叠并让页面自然滚动
@media (max-width: 1199px) {
  .dashboard__bottom {
    grid-template-columns: 1fr;
  }
}
</style>
