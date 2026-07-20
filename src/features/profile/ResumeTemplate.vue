<script setup lang="ts">
import type { Award, Grade, Interest, ProfileDimension, UserInfo } from '@/shared/types/types'
import { computed } from 'vue'

interface ResumeData {
  userInfo: Partial<UserInfo>
  avatar?: string
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

const avgGpa = computed(() => {
  if (!gradeSummary.value.length) return '0.00'
  return (gradeSummary.value.reduce((s, g) => s + g.gpa, 0) / gradeSummary.value.length).toFixed(2)
})

const bestGpa = computed(() => {
  if (!gradeSummary.value.length) return '0.00'
  return Math.max(...gradeSummary.value.map((g) => g.gpa)).toFixed(2)
})

const dimAvg = computed(() => {
  if (!props.data.dimensions.length) return 0
  return Math.round(
    props.data.dimensions.reduce((s, d) => s + d.current, 0) / props.data.dimensions.length,
  )
})

/** 将 submission 按类型分组，过滤有意义的活动 */
const experienceGroups = computed(() => {
  const groupLabels: Record<string, string> = {
    internship: '实习经历',
    organization: '组织/社团经历',
    socialPractice: '社会实践',
    research: '科研项目',
    training: '培训经历',
    certificate: '证书',
  }

  const groups = new Map<string, { title: string; submitDate: string }[]>()
  for (const item of props.data.submissions) {
    const label = groupLabels[item.type]
    if (!label) continue
    const list = groups.get(label) ?? []
    list.push(item)
    groups.set(label, list)
  }
  return [...groups.entries()]
})

const allExperiences = computed(() => {
  return props.data.submissions.filter((s) =>
    ['internship', 'organization', 'socialPractice', 'research', 'training'].includes(s.type),
  )
})

const certificates = computed(() => {
  return props.data.submissions.filter((s) => s.type === 'certificate')
})

const skillInterests = computed(() => {
  return props.data.interests.map((i) => ({
    label: i.category,
    desc: i.content,
    level: i.level === 'proficient' ? '精通' : i.level === 'good' ? '良好' : '一般',
  }))
})
</script>

<template>
  <div class="resume">
    <!-- ─── 头部：个人信息 ─── -->
    <header class="resume-header">
      <div class="header-top">
        <h1 class="header-name">{{ data.userInfo.realName || '姓名' }}</h1>
        <p class="header-subtitle">应届毕业生 · {{ data.userInfo.major || '' }}</p>
      </div>
      <div class="header-contact">
        <span v-if="data.userInfo.phone" class="contact-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            />
          </svg>
          {{ data.userInfo.phone }}
        </span>
        <span v-if="data.userInfo.email" class="contact-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {{ data.userInfo.email }}
        </span>
        <span v-if="data.userInfo.studentId" class="contact-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          {{ data.userInfo.studentId }}
        </span>
        <span v-if="data.userInfo.grade" class="contact-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          {{ data.userInfo.grade }}级
        </span>
        <span v-if="data.userInfo.className" class="contact-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {{ data.userInfo.className }}
        </span>
      </div>
    </header>

    <!-- ─── 主体 ─── -->
    <main class="resume-body">
      <!-- 教育背景 -->
      <section class="resume-section">
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
      <section v-if="data.awards.length" class="resume-section">
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
      <section v-if="skillInterests.length" class="resume-section">
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
      <section v-if="allExperiences.length" class="resume-section">
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
      <section v-if="certificates.length" class="resume-section">
        <h2 class="sec-title">证书</h2>
        <div class="sec-body">
          <div class="certs-row">
            <span v-for="c in certificates" :key="c.title" class="cert-tag">{{ c.title }}</span>
          </div>
        </div>
      </section>

      <!-- 自我评价 -->
      <section v-if="props.data.dimensions.length" class="resume-section">
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

/* ====== 头部 ====== */
.resume-header {
  padding: 28px 30px 20px;
  border-bottom: 3px solid #1e3a5f;
}

.header-top {
  margin-bottom: 10px;
}

.header-name {
  margin: 0 0 2px;
  font-size: 26pt;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 4px;
}

.header-subtitle {
  margin: 0;
  font-size: 11pt;
  color: #64748b;
}

.header-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 9.5pt;
  color: #475569;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #475569;
}

.contact-item svg {
  opacity: 0.6;
  flex-shrink: 0;
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
</style>
