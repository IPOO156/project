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
const { visibleEntries, recordClick, refreshPool, updateOrder, toggleHidden } = useQuickEntries()
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

/**
 * 学期均绩：两个取数口均为后端权威值，前端不再本地按学分加权自算。
 * 1. `/home/dashboard` 的 `currentGpa`（当前学期口径）；
 * 2. 缺失时退到 `/profile/info` 的 `overallGpa`（累计学分加权口径）。
 *
 * 此前第三层兜底是本地「Σ(gpa×credits)/Σcredits」，与后端 overallGpa 算法相同却是第四处实现；
 * 同一学生同一时点出现多个绩点数字即源于此类重复实现（§5.2）。两者都没有时显示「--」（§3.4）。
 */
const semesterGpa = computed<number | string>(() => {
  const homeGpa = homeStore.data?.currentGpa
  if (typeof homeGpa === 'number') return homeGpa
  const profileGpa = archiveStore.profileData?.overallGpa
  if (typeof profileGpa === 'number') return profileGpa
  return '--'
})

// 统计卡片：优先使用 /home/dashboard 数据，缺失时回退本地 store；本地也无数据则显示「--」
const statsCards = computed(() => {
  const home = homeStore.data
  const records = submissionStore.records
  const total = records.length > 0 ? records.length : '--'
  const approved = records.length > 0 ? records.filter((r) => r.status === 'approved').length : '--'
  const pending = records.length > 0 ? records.filter((r) => r.status === 'pending').length : '--'
  return [
    {
      label: '申报总数',
      value: home?.applicationTotal ?? total,
      icon: FileText,
      color: themeStore.isDark ? '#60a5fa' : '#2d5a87',
      path: '/applications',
    },
    {
      label: '已通过',
      value: home?.approvedCount ?? approved,
      icon: Award,
      color: '#10b981',
      path: '/approval/pending',
    },
    {
      label: '待审批',
      value: home?.pendingCount ?? pending,
      icon: Clock,
      color: '#d4a574',
      path: '/approval/pending',
    },
    {
      label: '学期均绩',
      value: semesterGpa.value,
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
    <StatsOverview :cards="statsCards" @card-click="onStatCardClick" />

    <el-row :gutter="16" class="dashboard__main">
      <el-col :span="13" :xs="24" :sm="24" :md="24" :lg="13" class="dashboard__col">
        <ProfileRadarCard
          :dimensions="profileDimensions"
          :compared-semester-map="comparedSemesterMap"
          :has-previous-from-api="hasPreviousFromApi"
          :indicator-meta="indicatorMeta"
          @view-profile="onStatCardClick('/profile/info')"
          @open-indicator="onOpenIndicator"
        />
      </el-col>

      <el-col :span="11" :xs="24" :sm="24" :md="24" :lg="11" class="dashboard__col">
        <QuickEntries
          :entries="visibleEntries"
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
      </el-col>
    </el-row>

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
  height: 100%;
  gap: 12px;

  &__main {
    flex: 1;
    min-height: 0;
    margin-bottom: 0;
  }

  &__col {
    display: flex;
    flex-direction: column;
    height: 100%;

    /* 左列单卡片撑满 */
    &:first-child :deep(.el-card) {
      flex: 1;
    }
  }

  &__col:last-child :deep(.el-card) {
    flex: 1;
  }

  &__col:last-child :deep(.quick-entries-card) {
    flex: 0 0 auto;
  }

  &__section {
    margin-bottom: 12px;

    &--activities {
      margin-bottom: 0;
    }
  }

  &__charts {
    margin-bottom: 12px;
  }
}

@media (max-width: 1199px) {
  // 两栏在 1024 等窄桌面下会压缩快捷入口，导致标题逐字竖排；
  // 改为上下堆叠，并解除内部卡片的高度约束，让页面自然滚动。
  .dashboard {
    height: auto;
  }

  .dashboard__main {
    flex: none;
  }

  .dashboard__col {
    height: auto;

    &:first-child :deep(.el-card),
    &:last-child :deep(.el-card) {
      flex: 0 0 auto;
    }
  }
}
</style>
