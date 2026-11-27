<script setup lang="ts">
import type { CompletenessDimension } from '@/shared/api/student'
import { Download } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { getActivities } from '@/shared/api/activities'
import { getDataCompleteness } from '@/shared/api/student'
import { calcAggregateScore } from '@/shared/utils/score'
import { useArchiveStore, useSubmissionStore, useThemeStore, useUserStore } from '@/stores/stores'
import BasicInfoCard from './BasicInfoCard.vue'
import AwardsPanel from './components/AwardsPanel.vue'
import CompletenessBar from './components/CompletenessBar.vue'
import DimensionPanel from './components/DimensionPanel.vue'
import InterestPanel from './components/InterestPanel.vue'
import SelfEvaluationPanel from './components/SelfEvaluationPanel.vue'
import { useArchiveExport } from './composables/useArchiveExport'
import { useResumeExport } from './composables/useResumeExport'
import GradeSummaryCard from './GradeSummaryCard.vue'
import ProfileStatCards from './ProfileStatCards.vue'
import ResumeTemplate from './ResumeTemplate.vue'

const archiveStore = useArchiveStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const submissionStore = useSubmissionStore()

// ── 数据完整度（GET /profile/data-completeness，字段 overallRate，见 docs/api.md 4.1.4）──
const completenessRate = ref<number | null>(null)
/** 各维度明细（dimensionName / rate / missingItems），仅用于「查看详情」展示，不在前端重算 */
const completenessDimensions = ref<CompletenessDimension[]>([])
async function loadCompleteness() {
  try {
    const data = await getDataCompleteness()
    completenessRate.value = data.overallRate
    completenessDimensions.value = data.dimensions ?? []
  } catch {
    completenessRate.value = null
    completenessDimensions.value = []
  }
}

onMounted(() => {
  // 每次进入档案概览都刷新 /profile/info，保证学籍/联系/自我评价等展示与后端一致
  archiveStore.fetchArchive()
  if (submissionStore.records.length === 0) submissionStore.fetchRecords()
  loadCompleteness()
  void loadActivityAwards()
})

const interests = computed(() => archiveStore.interests)

/**
 * 奖项兜底：/profile/info 的 personalAwards 依赖后端聚合，实测奖项审核通过后仍返回空数组，
 * 导致「审核通过但档案里看不到奖项」。档案页本身不依赖 /achievements（成果墙），
 * 这里直接用已有 GET /activities?type=award&status=2 在本地按类别汇总，保证审核通过的奖项可见。
 * 后端 personalAwards 恢复聚合后优先使用后端口径，避免两份数据叠加。
 */
interface AwardSummary {
  category: string
  totalCount: number
  maxLevel: string
  latestTime: string
}
const activityAwards = ref<AwardSummary[]>([])

async function loadActivityAwards() {
  try {
    const res = await getActivities({ type: 'award', status: 2, perPage: 100 })
    const groups = new Map<string, { totalCount: number; latestTime: string }>()
    for (const item of res.list) {
      const category = item.archive_type_label || item.archiveTypeLabel || '奖项'
      const time = (item.submit_time ?? item.submitTime ?? '').slice(0, 10)
      const current = groups.get(category) ?? { totalCount: 0, latestTime: '' }
      current.totalCount += 1
      if (time > current.latestTime) current.latestTime = time
      groups.set(category, current)
    }
    // activities 列表不带奖项等级，maxLevel 留空，由 AwardsPanel 隐藏等级标签
    activityAwards.value = [...groups.entries()].map(([category, value]) => ({
      category,
      totalCount: value.totalCount,
      maxLevel: '',
      latestTime: value.latestTime,
    }))
  } catch {
    activityAwards.value = []
  }
}

/** 个人奖项：优先 /profile/info 的后端聚合，为空时回落到申报记录汇总 */
const personalAwards = computed<AwardSummary[]>(() => {
  const fromProfile = archiveStore.profileData?.personalAwards ?? []
  return fromProfile.length > 0 ? fromProfile : activityAwards.value
})
/**
 * 获奖总数 = 各类别 totalCount 之和（后端按类别聚合，不再用列表行数）。
 * 加载失败时返回占位符：0 会在失败时与「确实没有获奖」混淆。
 */
const totalAwardCount = computed<number | string>(() =>
  archiveStore.loadFailed
    ? '--'
    : personalAwards.value.reduce(
        (sum: number, a: { totalCount?: number }) => sum + (a.totalCount ?? 0),
        0,
      ),
)

interface CourseGradeRow {
  courseCode: string
  courseName: string
  courseType: string
  credit: number
  gpa: number
  score: number
}

/**
 * 逐课成绩明细：/profile/info 的 semesterGrades[].courses（来自 gpa_records），
 * 按学期名归组。后端未返回 courses 时为空对象，卡片退化为仅学期汇总。
 */
const gradeCourseMap = computed<Record<string, CourseGradeRow[]>>(() => {
  const result: Record<string, CourseGradeRow[]> = {}
  const semesters = archiveStore.profileData?.semesterGrades
  if (!Array.isArray(semesters)) return result
  for (const s of semesters) {
    const key = s.semesterName || s.semester || '学期'
    if (!Array.isArray(s.courses) || s.courses.length === 0) continue
    result[key] = s.courses.map((c) => ({
      courseCode: String(c.courseCode ?? ''),
      courseName: String(c.courseName ?? '未命名课程'),
      courseType: String(c.courseType ?? ''),
      credit: Number(c.credit ?? 0),
      gpa: Number(c.gpa ?? 0),
      score: Number(c.score ?? 0),
    }))
  }
  return result
})

const gradeSummary = computed(() => {
  const map = new Map<
    string,
    { courses: number; gpaSum: number; scoreSum: number; creditSum: number }
  >()
  for (const g of archiveStore.grades) {
    const entry = map.get(g.semester) ?? { courses: 0, gpaSum: 0, scoreSum: 0, creditSum: 0 }
    entry.courses += g.courseCount ?? 1
    entry.gpaSum += g.gpa * g.credits
    entry.scoreSum += g.score * g.credits
    entry.creditSum += g.credits
    map.set(g.semester, entry)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, e]) => ({
      semester: s,
      courses: e.courses,
      gpa: e.creditSum > 0 ? +(e.gpaSum / e.creditSum).toFixed(2) : 0,
      totalScore: e.creditSum > 0 ? +(e.scoreSum / e.creditSum).toFixed(1) : 0,
      courseList: gradeCourseMap.value[s] ?? [],
    }))
})

const hasGradeDetail = computed(
  () =>
    archiveStore.grades.some((g) => !g.isAggregate) || Object.keys(gradeCourseMap.value).length > 0,
)

const DIMENSION_COLORS_LIGHT = ['#4a7fb5', '#10b981', '#d4a574', '#8b5cf6', '#f59e0b']
const DIMENSION_COLORS_DARK = ['#60a5fa', '#34d399', '#f0b87b', '#a78bfa', '#fbbf24']

const dimensions = computed(() => {
  const palette = themeStore.isDark ? DIMENSION_COLORS_DARK : DIMENSION_COLORS_LIGHT
  return archiveStore.dimensions.map((d, index) => {
    // 各维度满分不同（如 50/30/20），进度条须按「得分率」绘制才可横向比较：
    // 直接拿原始分当百分比会把 20/50 和 20/100 画成一样长。
    // 满分为 0 或缺失时不做除法（不编造得分率），仅退化为显示原始分。
    const hasTarget = d.target > 0
    return {
      label: d.label,
      score: d.current,
      maxScore: d.target,
      percent: hasTarget ? Math.min(100, Math.round((d.current / d.target) * 100)) : 0,
      // 分值文案在此预拼，避免模板内写分支（§2.2）
      scoreText: hasTarget ? `${d.current} / ${d.target} 分` : `${d.current} 分`,
      color: palette[index % palette.length],
    }
  })
})

/**
 * 平均绩点（累计学分加权）。取值一律用后端 `/profile/info` 的 `overallGpa`。
 *
 * 此前前端按「各学期 gpa 的算术平均」自算一份，与后端的「按 total_credit 加权」口径不同，
 * 同一学生同一时点会出现两个数字（后端 3.62 / 前端 3.55）。现以后端为唯一权威口径，
 * 前端不再推算第二份（§2.7 字段映射统一、§5.2 禁止重复实现）。
 *
 * 加载失败与「无学期成绩」都返回占位符 —— 失败时 grades 被兜底清空，
 * 若照常算出 '0.00'，学生读到的「我绩点是 0」比「没加载出来」严重得多（§3.4）。
 */
const avgGpa = computed(() => {
  if (archiveStore.loadFailed) return '--'
  const gpa = archiveStore.profileData?.overallGpa
  return typeof gpa === 'number' ? gpa.toFixed(2) : '--'
})

/**
 * 课程总数 = Σ semesterGrades[].courseCount（按学期分组后求和）。
 * 不是读顶层的 data.courseCount —— /profile/info 没有这个字段。
 * 没有成绩行或所有学期 courseCount 都为 0 时显示 '--'：
 * 与「确实修了 0 门课」区分开，避免学生把「暂无成绩数据」读成「课程数为 0」。
 */
const totalCourses = computed<number | string>(() => {
  if (archiveStore.loadFailed) return '--'
  const total = gradeSummary.value.reduce((s, g) => s + g.courses, 0)
  return total > 0 ? total : '--'
})

/** 加载失败后重试：带 force 绕过 store 的 60s 缓存，否则会直接返回而不会重新请求 */
function handleRetryArchive() {
  void archiveStore.fetchArchive(true)
  void loadActivityAwards()
}

// 无评分计算结果时返回 null（模板显占位符）：显示 0 会让学生误读为「本次得分就是 0 分」，
// 而实际含义是「尚无计算结果」。口径与空值语义统一在 shared/utils/score.ts。
const dimAvg = computed<number | null>(() =>
  calcAggregateScore(dimensions.value.map((d) => ({ score: d.score, maxScore: d.maxScore }))),
)

// ── 简历导出 ──
const resumeRef = ref<InstanceType<typeof ResumeTemplate>>()
const { exportResumePDF } = useResumeExport()
const exporting = ref(false)

// ── 档案导出 ──
const { exportArchivePDF } = useArchiveExport()

const resumeData = computed(() => ({
  userInfo: userStore.userInfo ?? {},
  avatar: userStore.avatar,
  // 累计绩点带下去给简历正文，避免简历里再本地推算一份（见 ResumeTemplate 的 avgGpa）
  overallGpa: archiveStore.profileData?.overallGpa ?? null,
  grades: archiveStore.grades,
  awards: archiveStore.awards,
  interests: archiveStore.interests,
  dimensions: archiveStore.dimensions,
  submissions: submissionStore.records.map((r) => ({
    type: r.type,
    title: r.title,
    submitDate: r.submitDate,
  })),
}))

async function handleExportResume() {
  exporting.value = true
  try {
    // 确保数据已加载
    if (submissionStore.records.length === 0) {
      await submissionStore.fetchRecords()
    }
    if (archiveStore.interests.length === 0) {
      await archiveStore.fetchArchive()
    }
    await exportResumePDF(resumeRef.value ?? null)
  } catch {
    // 错误提示由 request.ts 的响应拦截器统一给出，这里只需不让异常逃逸
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="archive-overview page-enter">
    <div class="page-head">
      <div>
        <h1 class="page-head__title">档案概览</h1>
        <p class="page-head__desc">查看个人综合档案信息</p>
      </div>
      <div class="page-head__actions">
        <el-button type="primary" @click="exportArchivePDF">
          <Download class="u-mr-4" :size="16" />导出档案
        </el-button>
        <el-button
          type="primary"
          :loading="exporting"
          :disabled="exporting"
          @click="handleExportResume"
        >
          <Download class="u-mr-4" :size="16" />导出简历 PDF
        </el-button>
      </div>
    </div>

    <CompletenessBar
      v-if="completenessRate !== null"
      :rate="completenessRate"
      :dimensions="completenessDimensions"
    />

    <ProfileStatCards
      :avg-gpa="avgGpa"
      :total-award-count="totalAwardCount"
      :total-courses="totalCourses"
      :dim-avg="dimAvg"
    />

    <div class="row-2col">
      <BasicInfoCard />
      <DimensionPanel
        :dimensions="dimensions"
        :load-failed="archiveStore.loadFailed"
        @retry="handleRetryArchive"
      />
    </div>

    <div class="row-2col">
      <GradeSummaryCard
        :grade-summary="gradeSummary"
        :avg-gpa="avgGpa"
        :has-detail="hasGradeDetail"
      />
      <AwardsPanel :awards="personalAwards" />
    </div>

    <InterestPanel :interests="interests" />

    <SelfEvaluationPanel />

    <!-- 简历模板（隐藏于屏幕外，用于导出 PDF） -->
    <div class="resume-render-area">
      <ResumeTemplate ref="resumeRef" :data="resumeData" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-enter {
  @include page-enter;
}

.archive-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  user-select: none;
}

// 页面头部
/* 与「成长发展」页头统一：26px 标题 + 16px 副标题，底部 12px 留白与 1px 分隔线 */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $color-border;
}
.page-head__title {
  font-size: $font-size-page-title;
  font-weight: 700;
  color: $color-text-primary;
  margin: 0 0 6px;
}
.page-head__desc {
  font-size: $font-size-lg;
  color: $color-text-secondary;
  margin: 0;
}
.page-head__actions {
  display: flex;
  gap: 12px;
}

/* 375 宽度下标题与两个导出按钮挤在一行，标题被压成两行；
   移动端改为上下两段，按钮等宽铺满 */
@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .page-head__actions {
    width: 100%;
  }
  .page-head__actions :deep(.el-button) {
    flex: 1;
    margin-left: 0;
  }
}

// 两列布局
.row-2col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .row-2col {
    grid-template-columns: 1fr;
  }
}

// 简历渲染区域（屏幕外，html2canvas 可捕获）
.resume-render-area {
  position: absolute;
  left: -9999px;
  top: 0;
}

// ─── 夜间模式适配 ───
// 盒子降亮度：页面级盒子与卡片同层（#0f172a），卡片内嵌套盒再暗一档（#1e293b），
// 图标底改用低透明度叠色，避免实色浅底刺眼；硬编码深色文字同步亮化保证可读性
html.dark {
  .page-head {
    border-bottom-color: #334155;
  }
  .page-head__title {
    color: #f1f5f9;
  }
}
</style>
