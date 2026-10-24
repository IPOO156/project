<script setup lang="ts">
import type { ResumeSectionKey } from './composables/useResumeExport'
import type { Award, Grade, Interest, ProfileDimension, UserInfo } from '@/shared/types/types'
import { computed, ref } from 'vue'
import { useDict } from '@/shared/composables/composables'
import { INTEREST_LEVEL } from '@/shared/constants/dict'
import { calcAggregateScore } from '@/shared/utils/score'
import ResumeHeader from './ResumeHeader.vue'

interface ResumeData {
  userInfo: Partial<UserInfo>
  avatar?: string
  /** 后端 /profile/info 的累计学分加权绩点；缺失时退回按学期简单平均（见 avgGpa） */
  overallGpa?: number | null
  grades: Grade[]
  awards: Award[]
  interests: Interest[]
  dimensions: ProfileDimension[]
  submissions: { type: string; title: string; submitDate: string }[]
}

const props = defineProps<{ data: ResumeData }>()

const gradeSummary = computed(() => {
  const map = new Map<
    string,
    { courses: number; gpaSum: number; scoreSum: number; creditSum: number }
  >()
  for (const g of props.data.grades) {
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

/**
 * 平均绩点：优先用后端 /profile/info 的 overallGpa（累计学分加权）。
 *
 * 兜底保留「各学期 gpa 算术平均」仅为兼容后端未下发该字段的老响应；
 * 简历正文是一句完整的话，无法显示占位符，故不像 ProfileInfo.vue 那样退化为「--」
 * （与本文件 dimAvg 的处理一致）。
 */
const avgGpa = computed(() => {
  if (typeof props.data.overallGpa === 'number') return props.data.overallGpa.toFixed(2)
  if (!gradeSummary.value.length) return '0.00'
  return (gradeSummary.value.reduce((s, g) => s + g.gpa, 0) / gradeSummary.value.length).toFixed(2)
})

const bestGpa = computed(() => {
  if (!gradeSummary.value.length) return '0.00'
  return Math.max(...gradeSummary.value.map((g) => g.gpa)).toFixed(2)
})

// 口径统一在 shared/utils/score.ts。简历正文是一句完整的话，无法显示占位符，
// 故无法计算时按原行为退化为 0（此处不引入新的空值语义，见该文件的口径说明）
const dimAvg = computed(
  () =>
    calcAggregateScore(
      props.data.dimensions.map((d) => ({ score: d.current, maxScore: d.target })),
    ) ?? 0,
)

const allExperiences = computed(() => {
  return props.data.submissions.filter((s) =>
    ['internship', 'organization', 'socialPractice', 'research', 'training'].includes(s.type),
  )
})

const certificates = computed(() => {
  return props.data.submissions.filter((s) => s.type === 'certificate')
})

const { getLabel } = useDict(INTEREST_LEVEL)

const skillInterests = computed(() => {
  return props.data.interests.map((i) => ({
    label: i.tagName,
    desc: i.detailContent,
    level: getLabel(i.proficiencyLevel),
  }))
})

// ── 导出模块开关与生成时间 ──
const activeSections = ref<ResumeSectionKey[] | null>(null)
const generatedAt = ref('')

function showSection(key: ResumeSectionKey): boolean {
  return activeSections.value === null || activeSections.value.includes(key)
}

defineExpose({
  applyExportOptions(sections: ResumeSectionKey[], at: string) {
    activeSections.value = [...sections]
    generatedAt.value = at
  },
  resetExportOptions() {
    activeSections.value = null
    generatedAt.value = ''
  },
})
</script>

<template>
  <div class="resume">
    <!-- ─── 头部：个人信息 ─── -->
    <ResumeHeader :user-info="data.userInfo" />

    <!-- ─── 主体 ─── -->
    <main class="resume-body">
      <!-- 教育背景 -->
      <section v-if="showSection('education')" class="resume-section">
        <h2 class="sec-title">教育背景</h2>
        <div class="sec-body">
          <div class="edu-row">
            <div class="edu-left">
              <span class="edu-school">{{ data.userInfo.college || '所在院校' }}</span>
              <span class="edu-major">{{ data.userInfo.major || '' }} · 本科</span>
            </div>
            <div class="edu-right">
              {{ data.userInfo.grade || '' }}级 · {{ data.userInfo.className || '' }}
            </div>
          </div>
          <div v-if="gradeSummary.length" class="gpa-row">
            <span class="gpa-label">平均绩点</span>
            <span class="gpa-value">{{ avgGpa }}</span>
            <span class="gpa-sep">/ 4.0</span>
            <span class="gpa-best">最高学期 {{ bestGpa }}</span>
          </div>
          <div v-if="gradeSummary.length" class="courses-row">
            <span v-for="g in gradeSummary" :key="g.semester" class="course-tag">
              {{ g.semester.replace(/-(\d)$/g, '第$1学期') }} · GPA {{ g.gpa }}
            </span>
          </div>
        </div>
      </section>

      <!-- 获奖情况 -->
      <section v-if="showSection('awards') && data.awards.length" class="resume-section">
        <h2 class="sec-title">获奖情况</h2>
        <div class="sec-body">
          <div v-for="a in data.awards" :key="a.id" class="award-row">
            <span class="award-dot" />
            <span class="award-name">{{ a.name }}</span>
            <span class="award-level">{{ a.level }}</span>
            <span class="award-date">{{ a.date }}</span>
            <span v-if="a.prize" class="award-prize">{{ a.prize }}</span>
          </div>
        </div>
      </section>

      <!-- 技能与兴趣 -->
      <section v-if="showSection('skills') && skillInterests.length" class="resume-section">
        <h2 class="sec-title">技能与兴趣</h2>
        <div class="sec-body">
          <div class="skills-grid">
            <div v-for="s in skillInterests" :key="s.label" class="skill-item">
              <span class="skill-label">{{ s.label }}</span>
              <span class="skill-desc">{{ s.desc }}</span>
              <span class="skill-level">{{ s.level }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 实践经历 -->
      <section v-if="showSection('practices') && allExperiences.length" class="resume-section">
        <h2 class="sec-title">实践经历</h2>
        <div class="sec-body">
          <div v-for="exp in allExperiences" :key="exp.title" class="exp-row">
            <span class="exp-dot" />
            <div class="exp-content">
              <span class="exp-title">{{ exp.title }}</span>
              <span class="exp-date">{{ exp.submitDate }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 证书 -->
      <section v-if="showSection('certificates') && certificates.length" class="resume-section">
        <h2 class="sec-title">证书</h2>
        <div class="sec-body">
          <div class="certs-row">
            <span v-for="c in certificates" :key="c.title" class="cert-tag">{{ c.title }}</span>
          </div>
        </div>
      </section>

      <!-- 自我评价 -->
      <section
        v-if="showSection('selfEvaluation') && props.data.dimensions.length"
        class="resume-section"
      >
        <h2 class="sec-title">自我评价</h2>
        <div class="sec-body">
          <p class="eval-summary">
            本人性格开朗、责任心强，具备良好的{{
              props.data.dimensions.map((d) => d.label).join('、')
            }}能力。 在校期间平均绩点 {{ avgGpa }}，综合评分
            {{ dimAvg }} 分，专业基础扎实，能够熟练运用所学知识解决实际问题。
            曾多次获得各类奖项，积极参与社会实践与组织工作，积累了丰富的团队协作经验。
            具有较强的学习能力和沟通能力，能够快速适应新环境，勇于接受挑战。
          </p>
        </div>
      </section>
    </main>

    <footer class="resume-footer">
      <span v-if="generatedAt" class="resume-footer__text">生成时间：{{ generatedAt }}</span>
    </footer>
  </div>
</template>

<style scoped>
/* ====== 全局 ====== */
.resume {
  width: 210mm;
  min-height: 297mm;
  padding: 0;
  background: #fff;
  color: #1e293b;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  box-sizing: border-box;
}

/* ====== 主体 ====== */
.resume-body {
  padding: 16px 30px 30px;
}

/* ====== 段落 ====== */
.resume-section {
  margin-bottom: 16px;
}

.sec-title {
  font-size: 13pt;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid #e2e8f0;
  letter-spacing: 1px;
}

.sec-body {
  padding-left: 2px;
}

/* ====== 教育背景 ====== */
.edu-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.edu-left {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.edu-school {
  font-size: 11pt;
  font-weight: 600;
  color: #1e293b;
}

.edu-major {
  font-size: 10pt;
  color: #475569;
}

.edu-right {
  font-size: 9.5pt;
  color: #64748b;
  white-space: nowrap;
}

.gpa-row {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 10pt;
}

.gpa-label {
  color: #64748b;
}

.gpa-value {
  font-size: 14pt;
  font-weight: 700;
  color: #1e3a5f;
}

.gpa-sep {
  color: #94a3b8;
  margin-right: 8px;
}

.gpa-best {
  color: #64748b;
  font-size: 9pt;
}

.courses-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.course-tag {
  padding: 2px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 9pt;
  color: #475569;
}

/* ====== 获奖 ====== */
.award-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.award-row:last-child {
  border-bottom: none;
}

.award-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1e3a5f;
  flex-shrink: 0;
  margin-top: 6px;
}

.award-name {
  flex: 1;
  font-size: 10pt;
  font-weight: 500;
  color: #1e293b;
}

.award-level {
  font-size: 9pt;
  color: #1e3a5f;
  padding: 1px 8px;
  background: #eff6ff;
  border-radius: 3px;
  white-space: nowrap;
}

.award-date {
  font-size: 9pt;
  color: #94a3b8;
  white-space: nowrap;
  min-width: 72px;
  text-align: right;
}

.award-prize {
  font-size: 9pt;
  color: #d4a574;
  white-space: nowrap;
}

/* ====== 技能 ====== */
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.skill-label {
  font-size: 10pt;
  font-weight: 600;
  color: #1e293b;
}

.skill-desc {
  font-size: 9pt;
  color: #475569;
}

.skill-level {
  font-size: 8.5pt;
  color: #64748b;
  padding: 0 4px;
  background: #f1f5f9;
  border-radius: 2px;
}

/* ====== 经历 ====== */
.exp-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.exp-row:last-child {
  border-bottom: none;
}

.exp-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
  margin-top: 6px;
}

.exp-content {
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: baseline;
}

.exp-title {
  font-size: 10pt;
  color: #1e293b;
}

.exp-date {
  font-size: 9pt;
  color: #94a3b8;
  white-space: nowrap;
}

/* ====== 证书 ====== */
.certs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cert-tag {
  padding: 3px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  font-size: 9.5pt;
  color: #166534;
}

/* ====== 自我评价 ====== */
.eval-summary {
  margin: 0;
  font-size: 10pt;
  color: #475569;
  line-height: 1.8;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 4px;
}

/* ====== 页脚 ====== */
.resume-footer {
  padding: 12px 30px 20px;
  text-align: right;
}
.resume-footer__text {
  font-size: 8.5pt;
  color: #94a3b8;
}

@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
  .resume {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
