<script setup lang="ts">
/**
 * AwardHub - 奖项中心
 *
 * 与申报中心同一页面结构：页头 → 审核进度 → 分类条 → 报名表单/记录。
 * 三个之星分类平铺为顶部切换条，默认进入「竞赛之星」，不再插入奖项看板页。
 *
 * 分类计数与申报中心同源：读取 /activities 记录并按类型归入三个之星，
 * 因此「退回 N / 待审 N / N 条 / 未报名」的展示优先级与申报中心完全一致。
 */
import type { ApplicationType } from '@/shared/types/types'
import { GraduationCap, Lightbulb, Trophy } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SubmissionCategoryBar from '@/components/ui/SubmissionCategoryBar.vue'
import SubmissionProgressBar from '@/components/ui/SubmissionProgressBar.vue'
import { getAwardsOverview } from '@/shared/api/awards'
import { ARCHIVE_TYPE_TO_KEY } from '@/shared/api/submission/archive-type'
import { useSubmissionStore } from '@/stores/stores'
import CompetitionStarList from './competition-star/CompetitionStarList.vue'
import InnovationStarList from './innovation-star/InnovationStarList.vue'
import ScientificStarList from './scientific-star/ScientificStarList.vue'

const route = useRoute()
const router = useRouter()
const submissionStore = useSubmissionStore()

const modules = [
  {
    key: 'competition-star',
    label: '竞赛之星',
    icon: Trophy,
    component: CompetitionStarList,
  },
  {
    key: 'scientific-star',
    label: '科研之星',
    icon: GraduationCap,
    component: ScientificStarList,
  },
  {
    key: 'innovation-star',
    label: '双创之星',
    icon: Lightbulb,
    component: InnovationStarList,
  },
] as const

/** 无 tab 参数时落到竞赛之星（与申报中心默认进入学科竞赛一致） */
const DEFAULT_KEY = 'competition-star'

/**
 * 分类 key → /activities 记录类型。
 * 科研之星由科研项目 / 软著 / 论文三类报名组成，计数时合并进同一个分类。
 */
const RECORD_TYPES_OF_MODULE: Record<string, ApplicationType[]> = {
  'competition-star': ['competitionStar'],
  'scientific-star': ['scientificProject', 'softwareCopyright', 'paper'],
  'innovation-star': ['innovationStar'],
}

/** 记录 type → 模块 key：一次遍历即可把全部记录归类到各分类 */
const MODULE_KEY_OF_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(RECORD_TYPES_OF_MODULE).flatMap(([key, types]) =>
    types.map((type) => [type, key] as const),
  ),
)

/** 后端下划线别名 → 前端 type key（记录一般已归一化，这里兜底旧数据） */
function normalizeType(type: string): ApplicationType {
  return (ARCHIVE_TYPE_TO_KEY[type] ?? type) as ApplicationType
}

function resolveKeyFromRoute(tab: unknown): string {
  const key = typeof tab === 'string' ? tab : DEFAULT_KEY
  return modules.some((item) => item.key === key) ? key : DEFAULT_KEY
}

const activeKey = ref(resolveKeyFromRoute(route.query.tab))
const activeModule = computed(() => modules.find((item) => item.key === activeKey.value)!)

interface CategoryStat {
  total: number
  pending: number
  approved: number
  rejected: number
}

/** 每个之星分类的报名统计：只遍历一次全量记录，避免模板里反复 filter */
const categoryStats = computed(() => {
  const map = new Map<string, CategoryStat>(
    modules.map((item) => [item.key, { total: 0, pending: 0, approved: 0, rejected: 0 }]),
  )
  for (const record of submissionStore.records) {
    const key = MODULE_KEY_OF_TYPE[normalizeType(record.type)]
    const stat = key ? map.get(key) : undefined
    if (!stat) continue
    stat.total += 1
    if (record.status === 'pending') stat.pending += 1
    else if (record.status === 'approved') stat.approved += 1
    else if (record.status === 'rejected') stat.rejected += 1
  }
  return map
})

/**
 * 分类条数据：状态优先级与申报中心一致（退回 > 待审 > 条数 > 未报名），
 * 两个中心共用 SubmissionCategoryBar，样式自然统一。
 */
const categoryItems = computed(() =>
  modules.map((item) => {
    const stat = categoryStats.value.get(item.key)!
    const state =
      stat.rejected > 0
        ? { text: `退回 ${stat.rejected}`, tone: 'danger' as const }
        : stat.pending > 0
          ? { text: `待审 ${stat.pending}`, tone: 'warning' as const }
          : stat.total > 0
            ? { text: `${stat.total} 条`, tone: 'count' as const }
            : { text: '未报名', tone: 'muted' as const }
    return { ...item, state }
  }),
)

/** 有报名的分类数，口径对齐申报中心的「x/N 已填报」 */
const filledCount = computed(
  () => categoryItems.value.filter((item) => item.state.tone !== 'muted').length,
)

/** 审核进度：与申报中心同源同口径，均按记录状态汇总 */
const progress = computed(() => {
  let total = 0
  let pending = 0
  let approved = 0
  let rejected = 0
  for (const stat of categoryStats.value.values()) {
    total += stat.total
    pending += stat.pending
    approved += stat.approved
    rejected += stat.rejected
  }
  return { total, pending, approved, rejected }
})

/** 概览仅用于「本学期新增」补充说明，失败时静默不展示 */
const overview = ref<Awaited<ReturnType<typeof getAwardsOverview>> | null>(null)

const progressNote = computed(() =>
  typeof overview.value?.newThisSemester === 'number'
    ? `本学期新增 ${overview.value.newThisSemester} 项`
    : undefined,
)

onMounted(() => {
  // 计数与状态来自 /activities，与申报中心同源；store 内有 60s 缓存，避免重复请求
  void submissionStore.fetchRecords()
  getAwardsOverview()
    .then((data) => {
      overview.value = data
    })
    .catch(() => {
      // 辅助说明失败不影响报名流程
    })
})

watch(
  () => route.query.tab,
  (tab) => {
    activeKey.value = resolveKeyFromRoute(tab)
  },
)

/** 切换页签只保留 tab，丢弃 sub / edit 等子页面参数，避免跨页签串状态 */
function switchModule(key: string) {
  if (key === activeKey.value) return
  activeKey.value = key
  router.replace({ path: '/awards', query: { tab: key } }).catch(() => {})
}
</script>

<template>
  <div class="award-hub">
    <PageHeader title="奖项中心" subtitle="选择奖项分类填写报名材料，提交后在下方跟踪审核进度" />

    <!-- 审核进度：与申报中心同一条分段进度条 -->
    <SubmissionProgressBar v-bind="progress" :note="progressNote" />

    <!-- 分类切换条：与申报中心共用 SubmissionCategoryBar，状态优先级与样式完全一致 -->
    <SubmissionCategoryBar
      title="奖项分类"
      :meta="`${filledCount}/${modules.length} 之星有报名`"
      :items="categoryItems"
      :active-key="activeKey"
      :columns="3"
      @select="switchModule"
    />

    <section class="award-hub__panel">
      <Transition name="module-fade">
        <div :key="activeKey" class="award-hub__panel-item is-active" aria-hidden="false">
          <component :is="activeModule.component" :key="activeKey" />
        </div>
      </Transition>
    </section>
  </div>
</template>

<style scoped lang="scss">
.award-hub {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 原地交叉淡入：离场侧脱离文档流，进出可重叠，不再有 out-in 的纯空白帧 */
.module-fade-enter-active,
.module-fade-leave-active {
  transition: opacity 0.16s ease;
}

.module-fade-leave-active {
  position: absolute;
  inset: 0;
}

.module-fade-enter-from,
.module-fade-leave-to {
  opacity: 0;
}
</style>
