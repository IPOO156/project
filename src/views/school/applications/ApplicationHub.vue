<script setup lang="ts">
import type { ApplicationType } from '@/shared/types/types'
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  FlaskConical,
  HeartHandshake,
  Lightbulb,
  Medal,
  Trophy,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SubmissionCategoryBar from '@/components/ui/SubmissionCategoryBar.vue'
import SubmissionProgressBar from '@/components/ui/SubmissionProgressBar.vue'
import { ARCHIVE_TYPE_TO_KEY } from '@/shared/api/submission/archive-type'
import { useSubmissionStore } from '@/stores/stores'
import BookReportList from './book-report/BookReportList.vue'
import CertificateList from './certificate/CertificateList.vue'
import CompetitionList from './competition/CompetitionList.vue'
import InnovationList from './innovation/InnovationList.vue'
import InternshipList from './internship/InternshipList.vue'
import OrganizationList from './organization/OrganizationList.vue'
import ResearchList from './research/ResearchList.vue'
import ScholarshipList from './scholarship/ScholarshipList.vue'
import SocialPracticeList from './social-practice/SocialPracticeList.vue'
import TrainingList from './training/TrainingList.vue'

const route = useRoute()
const router = useRouter()
const submissionStore = useSubmissionStore()

const modules = [
  {
    key: 'competition',
    label: '学科竞赛',
    icon: Trophy,
    component: CompetitionList,
    desc: '竞赛成果与过程材料',
  },
  {
    key: 'innovation',
    label: '创新创业',
    icon: Lightbulb,
    component: InnovationList,
    desc: '双创项目与实践记录',
  },
  {
    key: 'research',
    label: '学术研究',
    icon: FlaskConical,
    component: ResearchList,
    desc: '科研成果与研究经历',
  },
  {
    key: 'scholarship',
    label: '奖学金',
    icon: Medal,
    component: ScholarshipList,
    desc: '奖助学金申报信息',
  },
  {
    key: 'certificate',
    label: '荣誉证书',
    icon: Award,
    component: CertificateList,
    desc: '荣誉与资格证明',
  },
  {
    key: 'internship',
    label: '实习经历',
    icon: Briefcase,
    component: InternshipList,
    desc: '岗位实践与企业经历',
  },
  {
    key: 'organization',
    label: '组织履历',
    icon: Users,
    component: OrganizationList,
    desc: '学生工作与组织任职',
  },
  {
    key: 'training',
    label: '实训项目',
    icon: BarChart3,
    component: TrainingList,
    desc: '课程实训与项目训练',
  },
  {
    key: 'social-practice',
    label: '社会实践',
    icon: HeartHandshake,
    component: SocialPracticeList,
    desc: '社会实践与志愿服务',
  },
  {
    key: 'book-report',
    label: '图书心得',
    icon: BookOpen,
    component: BookReportList,
    desc: '阅读记录与心得沉淀',
  },
] as const

const MODULE_KEYS = modules.map((item) => item.key)

/**
 * 模块 key → 申报记录 type。
 * 菜单/页签用连字符（social-practice / book-report），记录类型为 camelCase，
 * 其余 8 个 key 与 ApplicationType 一一对应。
 */
const RECORD_TYPE_OF_MODULE: Record<string, ApplicationType> = {
  'social-practice': 'socialPractice',
  'book-report': 'bookReport',
}

onMounted(() => {
  // store 内部有 60s TTL：缓存新鲜时直接复用，过期或为空才重新拉取全量（最多 20 页 / 2000 条），
  // 因此每次进入申报中心都能拿到较新的计数，且不会给每个分类各发一次请求。
  void submissionStore.fetchRecords()
})

function resolveKeyFromRoute(tab: unknown): string {
  const key = typeof tab === 'string' ? tab : 'competition'
  return modules.some((item) => item.key === key) ? key : 'competition'
}

const activeKey = ref(resolveKeyFromRoute(route.query.tab))
const activeModule = computed(() => modules.find((item) => item.key === activeKey.value)!)

watch(
  () => route.query.tab,
  (tab) => {
    activeKey.value = resolveKeyFromRoute(tab)
  },
)

function switchModule(key: string) {
  if (key === activeKey.value) return
  activeKey.value = key
  router.replace({ path: '/applications', query: { tab: key } }).catch(() => {})
}

/** 后端下划线别名 → 前端 type key（记录一般已归一化，这里兜底旧数据） */
function normalizeType(type: string): ApplicationType {
  return (ARCHIVE_TYPE_TO_KEY[type] ?? type) as ApplicationType
}

function recordTypeOf(key: string): ApplicationType {
  return RECORD_TYPE_OF_MODULE[key] ?? (key as ApplicationType)
}

/** 记录 type → 模块 key：一次遍历即可把全部记录归类到左侧分类 */
const MODULE_KEY_OF_TYPE: Record<string, string> = Object.fromEntries(
  modules.map((item) => [recordTypeOf(item.key), item.key] as const),
)

interface CategoryStat {
  total: number
  pending: number
  approved: number
  rejected: number
}

/**
 * 每个分类的申报计数（左侧导航与顶部概览共用）。
 * 只遍历一次全量记录，避免在模板里对每个分类反复 filter。
 */
const categoryStats = computed(() => {
  const map = new Map<string, CategoryStat>(
    MODULE_KEYS.map((key) => [key, { total: 0, pending: 0, approved: 0, rejected: 0 }]),
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

/** 左侧分类：图标 + 名称 + 一行状态（退回/待审优先，其次显示条数，未填报置灰） */
const navItems = computed(() =>
  modules.map((item) => {
    const stat = categoryStats.value.get(item.key)!
    const state =
      stat.rejected > 0
        ? { text: `退回 ${stat.rejected}`, tone: 'danger' as const }
        : stat.pending > 0
          ? { text: `待审 ${stat.pending}`, tone: 'warning' as const }
          : stat.total > 0
            ? { text: `${stat.total} 条`, tone: 'count' as const }
            : { text: '未填报', tone: 'muted' as const }
    return { ...item, state }
  }),
)

const filledCount = computed(
  () => navItems.value.filter((item) => item.state.tone !== 'muted').length,
)

/** 顶部概览：按状态汇总，供进度条与「已填报分类数」使用 */
const overview = computed(() => {
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
</script>

<template>
  <div class="application-hub">
    <PageHeader title="申报中心" subtitle="选择申报分类填写材料，提交后在下方跟踪审核进度" />

    <!-- 审核进度：一条分段进度条 + 图标图例，替代与首页重复的 4 张 KPI 卡 -->
    <SubmissionProgressBar
      :total="overview.total"
      :pending="overview.pending"
      :approved="overview.approved"
      :rejected="overview.rejected"
    />

    <!-- 分类切换放在内容上方：不再与系统最左侧菜单并排成两条左栏，表单与记录保持同列 -->
    <SubmissionCategoryBar
      title="申报分类"
      :meta="`${filledCount}/${modules.length} 已填报`"
      :items="navItems"
      :active-key="activeKey"
      @select="switchModule"
    />

    <section class="application-hub__panel">
      <Transition name="module-fade">
        <div :key="activeKey" class="application-hub__panel-item is-active" aria-hidden="false">
          <component :is="activeModule.component" :key="activeKey" />
        </div>
      </Transition>
    </section>
  </div>
</template>

<style scoped lang="scss">
.application-hub {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.application-hub__panel {
  position: relative;
  min-width: 0;
  min-height: 55vh;
  overflow: visible;
}

.application-hub__panel-item {
  width: 100%;
}

/* 原地交叉淡入：离场侧脱离文档流，进出可重叠，不再有 out-in 的纯空白帧；不做位移 */
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
