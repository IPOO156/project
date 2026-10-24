<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import {
  useArchiveStore,
  useSubmissionStore,
  useThemeStore,
  useUserStore,
} from '@/app/stores/stores'
import { getDataCompleteness } from '@/shared/api/student'
import { calcAggregateScore } from '@/shared/utils/score'
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
async function loadCompleteness() {
  try {
    const data = await getDataCompleteness()
    completenessRate.value = data.overallRate
  } catch {
    completenessRate.value = null
  }
}

onMounted(() => {
  // 每次进入档案概览都刷新 /profile/info，保证学籍/联系/自我评价等展示与后端一致
  archiveStore.fetchArchive()
  if (submissionStore.records.length === 0) submissionStore.fetchRecords()
  loadCompleteness()
})

const interests = computed(() => archiveStore.interests)
/** 个人奖项：只读展示 /profile/info 的 personalAwards 类别汇总（方案一，后端无 CRUD，不做手动增删改） */
const personalAwards = computed(() => archiveStore.profileData?.personalAwards ?? [])
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

const gradeSummary = computed(() => {
  const map = new Map<
    string,
    { courses: number; gpaSum: number; scoreSum: number; creditSum: number }
  >()
  for (const g of archiveStore.grades) {
    const entry = map.get(g.semester) ?? { courses: 0, gpaSum: 0, scoreSum: 0, creditSum: 0 }
    entry.courses++
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
    }))
})

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

/** 课程总数；加载失败时同上，显示占位符而非 0 */
const totalCourses = computed<number | string>(() =>
  archiveStore.loadFailed ? '--' : gradeSummary.value.reduce((s, g) => s + g.courses, 0),
)

/** 加载失败后重试：带 force 绕过 store 的 60s 缓存，否则会直接返回而不会重新请求 */
function handleRetryArchive() {
  void archiveStore.fetchArchive(true)
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
  <div class="archive-overview">
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

    <CompletenessBar v-if="completenessRate !== null" :rate="completenessRate" />

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
      <GradeSummaryCard :grade-summary="gradeSummary" :avg-gpa="avgGpa" />
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
.archive-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  user-select: none;
}

// 页面头部
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.page-head__title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px;
}
.page-head__desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}
.page-head__actions {
  display: flex;
  gap: 12px;
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
