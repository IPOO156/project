<script setup lang="ts">
import type { UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { Download, Edit2, GraduationCap, Info, Lightbulb, Plus } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import {
  useArchiveStore,
  useSubmissionStore,
  useThemeStore,
  useUserStore,
} from '@/app/stores/stores'
import { getDict } from '@/shared/api/common'
import {
  getDataCompleteness,
  updatePoliticalStatus,
  updateStudentStatus,
} from '@/shared/api/student'
import AvatarUploader from './components/AvatarUploader.vue'
import AwardsPanel from './components/AwardsPanel.vue'
import CompletenessBar from './components/CompletenessBar.vue'
import DimensionPanel from './components/DimensionPanel.vue'
import InterestPanel from './components/InterestPanel.vue'
import SelfEvaluationPanel from './components/SelfEvaluationPanel.vue'
import { useArchiveExport } from './composables/useArchiveExport'
import { useResumeExport } from './composables/useResumeExport'
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
/** 获奖总数 = 各类别 totalCount 之和（后端按类别聚合，不再用列表行数） */
const totalAwardCount = computed(() =>
  personalAwards.value.reduce(
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
  return archiveStore.dimensions.map((d, index) => ({
    label: d.label,
    score: d.current,
    color: palette[index % palette.length],
  }))
})

const avgGpa = computed(() => {
  if (!gradeSummary.value.length) return '0.00'
  return (gradeSummary.value.reduce((s, g) => s + g.gpa, 0) / gradeSummary.value.length).toFixed(2)
})

const totalCourses = computed(() => gradeSummary.value.reduce((s, g) => s + g.courses, 0))

const dimAvg = computed(() => {
  if (!dimensions.value.length) return 0
  return Math.round(dimensions.value.reduce((s, d) => s + d.score, 0) / dimensions.value.length)
})

// ── 基本资料编辑 ──
// 学籍字段（学号/年级/专业/班级/姓名）属学术身份信息，仅只读展示，不进入编辑表单；
// 编辑表单保留可更新的联系方式（邮箱/手机号 PUT /profile/contact）与
// 政治面貌/学生状态（PUT /profile/political-status、/profile/student-status，见接口文档 4.1.5）。
const isEditing = ref(false)
const formData = ref<Partial<UserInfo> & { politicalStatus?: string; studentStatus?: string }>({})
/** 学生状态字典编码，枚举值来自接口文档 4.1.5.1（禁止前端自行增改） */
const STUDENT_STATUS_OPTIONS = [
  { value: 'current', label: '在校生' },
  { value: 'fresh_graduate', label: '应届毕业生' },
  { value: 'graduated', label: '已毕业' },
] as const
const politicalOptions = ref<{ value: string; label: string }[]>([])
/** /profile/info 中的学籍信息（政治面貌/学生状态的展示标签来自后端返回的 *Label 字段） */
const academicInfo = computed(() => archiveStore.profileData?.academicInfo ?? {})

/** 政治面貌选项来自后端字典（GET /common/dict?dictType=political_status），不前端硬编码 */
async function loadPoliticalOptions() {
  try {
    const list = await getDict('political_status')
    politicalOptions.value = (list ?? []).map((d: any) => ({ value: d.value, label: d.label }))
  } catch {
    politicalOptions.value = []
  }
}

function startEdit() {
  const a = academicInfo.value
  formData.value = {
    email: userStore.userInfo?.email ?? '',
    phone: userStore.userInfo?.phone ?? '',
    politicalStatus: a.politicalStatus ?? '',
    studentStatus: a.studentStatus ?? '',
  }
  isEditing.value = true
  loadPoliticalOptions()
}
async function saveEdit() {
  const a = academicInfo.value
  await userStore.updateUserInfo({
    email: formData.value.email,
    phone: formData.value.phone,
  })
  // 政治面貌 / 学生状态仅在用户改动时提交
  try {
    if (formData.value.politicalStatus && formData.value.politicalStatus !== a.politicalStatus) {
      await updatePoliticalStatus(formData.value.politicalStatus)
    }
    if (formData.value.studentStatus && formData.value.studentStatus !== a.studentStatus) {
      await updateStudentStatus(formData.value.studentStatus)
    }
  } catch {
    ElMessage.error('学籍信息保存失败')
  }
  isEditing.value = false
  // 重新拉取 /profile/info，保证展示标签与后端一致
  await archiveStore.fetchArchive()
  ElMessage.success('已保存')
}
function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

async function handleAvatarUpload(base64: string) {
  await userStore.updateAvatar(base64 || undefined)
  ElMessage.success(base64 ? '头像更新成功' : '头像已删除')
}

// ── 简历导出 ──
const resumeRef = ref<InstanceType<typeof ResumeTemplate>>()
const { exportResumePDF } = useResumeExport()

// ── 档案导出 ──
const { exportArchivePDF } = useArchiveExport()

const resumeData = computed(() => ({
  userInfo: userStore.userInfo ?? {},
  avatar: userStore.avatar,
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
  // 确保数据已加载
  if (submissionStore.records.length === 0) {
    await submissionStore.fetchRecords()
  }
  if (archiveStore.interests.length === 0) {
    await archiveStore.fetchArchive()
  }
  await exportResumePDF(resumeRef.value ?? null)
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
          <Download :size="16" style="margin-right: 4px" />导出档案
        </el-button>
        <el-button type="primary" @click="handleExportResume">
          <Download :size="16" style="margin-right: 4px" />导出简历 PDF
        </el-button>
      </div>
    </div>

    <CompletenessBar v-if="completenessRate !== null" :rate="completenessRate" />

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">平均绩点</p>
            <p class="stat-card__value">{{ avgGpa }}</p>
          </div>
          <div class="stat-card__icon" style="background: #e8f0fe; color: #4a7fb5">
            <GraduationCap :size="20" />
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">获奖总数</p>
            <p class="stat-card__value">{{ totalAwardCount }}</p>
          </div>
          <div class="stat-card__icon" style="background: #fef3e2; color: #d4a574">
            <Plus :size="20" />
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">课程总数</p>
            <p class="stat-card__value">{{ totalCourses }}</p>
          </div>
          <div class="stat-card__icon" style="background: #e6f7ee; color: #10b981">
            <GraduationCap :size="20" />
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">综合评分</p>
            <p class="stat-card__value">{{ dimAvg }}</p>
          </div>
          <div class="stat-card__icon" style="background: #f0e6ff; color: #8b5cf6">
            <Lightbulb :size="20" />
          </div>
        </div>
      </div>
    </div>

    <div class="row-2col">
      <el-card class="section-card" shadow="never">
        <template #header
          ><div class="section-head">
            <span class="section-head__title"><Info :size="15" /> 基本资料</span
            ><el-button
              v-if="!isEditing"
              link
              type="primary"
              size="small"
              :icon="Edit2"
              @click="startEdit"
              >编辑</el-button
            >
            <div v-else class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button
              ><el-button size="small" type="primary" @click="saveEdit">保存</el-button>
            </div>
          </div></template
        >
        <div class="profile-top">
          <AvatarUploader
            :model-value="userStore.avatar ?? ''"
            :size="72"
            @upload="handleAvatarUpload"
          />
          <div>
            <h3 class="profile-top__name">{{ userStore.userName }}</h3>
            <p class="profile-top__meta">
              {{ userStore.userInfo?.major || '' }} · {{ userStore.userInfo?.className || '' }} ·
              学号 {{ userStore.studentId }}
            </p>
          </div>
        </div>
        <el-descriptions v-if="!isEditing" :column="2" border class="profile-desc" size="small">
          <el-descriptions-item label="姓名">{{ userStore.userName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ userStore.studentId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{
            userStore.userInfo?.grade || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{
            userStore.userInfo?.major || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{
            userStore.userInfo?.className || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{
            academicInfo.politicalStatusLabel || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="学生状态">{{
            academicInfo.studentStatusLabel || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{
            userStore.userInfo?.email || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{
            userStore.userInfo?.phone || '-'
          }}</el-descriptions-item>
        </el-descriptions>
        <el-form v-else :model="formData" label-width="70px" class="profile-form">
          <el-row :gutter="12">
            <el-col :span="12"
              ><el-form-item label="邮箱"
                ><el-input v-model="formData.email" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="手机号"
                ><el-input v-model="formData.phone" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="政治面貌"
                ><el-select v-model="formData.politicalStatus" size="small" class="form-w">
                  <el-option
                    v-for="o in politicalOptions"
                    :key="o.value"
                    :label="o.label"
                    :value="o.value" /></el-select></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="学生状态"
                ><el-select v-model="formData.studentStatus" size="small" class="form-w">
                  <el-option
                    v-for="o in STUDENT_STATUS_OPTIONS"
                    :key="o.value"
                    :label="o.label"
                    :value="o.value" /></el-select></el-form-item
            ></el-col>
          </el-row>
        </el-form>
      </el-card>
      <DimensionPanel :dimensions="dimensions" />
    </div>

    <div class="row-2col">
      <el-card class="section-card" shadow="never">
        <template #header
          ><div class="section-head">
            <span class="section-head__title"><GraduationCap :size="15" /> 期末成绩</span
            ><span class="section-head__tag">平均绩点 {{ avgGpa }}</span>
          </div></template
        >
        <div class="grade-list">
          <div v-for="g in gradeSummary" :key="g.semester" class="grade-item">
            <div class="grade-item__sem">{{ g.semester.replace(/-(\d)$/g, '第$1学期') }}</div>
            <div class="grade-item__body">
              <div class="grade-item__stat">
                <span class="grade-item__num">{{ g.gpa }}</span
                ><span class="grade-item__lbl">绩点</span>
              </div>
              <div class="grade-item__stat">
                <span class="grade-item__num">{{ g.totalScore }}</span
                ><span class="grade-item__lbl">均分</span>
              </div>
              <div class="grade-item__stat">
                <span class="grade-item__num">{{ g.courses }}</span
                ><span class="grade-item__lbl">课程</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
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

// 统计卡片
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &:hover {
    border-color: #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }
}
.stat-card__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}
.stat-card__label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 2px;
}
.stat-card__value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.stat-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// 两列布局
.row-2col {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

// 区块卡片
.section-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head__title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.section-head__tag {
  font-size: 12px;
  color: #94a3b8;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f8fafc;
}
.edit-actions {
  display: flex;
  gap: 6px;
}

// 基本资料
.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}
.profile-top__name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px;
}
.profile-top__meta {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}
.profile-desc {
  :deep(.el-descriptions__label) {
    width: 65px;
    min-width: 65px;
    text-align: center;
    font-size: 13px;
  }
  :deep(.el-descriptions__content) {
    font-size: 13px;
  }
}
.profile-form {
  margin-top: 8px;
}
.form-w {
  width: 100%;
}

// 成绩
.grade-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.grade-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}
.grade-item__sem {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.grade-item__body {
  display: flex;
  gap: 20px;
}
.grade-item__stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.grade-item__num {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}
.grade-item__lbl {
  font-size: 11px;
  color: #cbd5e1;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
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
</style>
