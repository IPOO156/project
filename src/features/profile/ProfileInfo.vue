<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import html2canvas from 'html2canvas'
import JSPDF from 'jspdf'
import { Download, Edit2, GraduationCap, Heart, Info, Lightbulb, Plus } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useArchiveStore, useThemeStore, useUserStore } from '@/app/stores/stores'
import { useDict } from '@/shared/composables/composables'
import { INTEREST_LEVEL } from '@/shared/constants/dict'
import AvatarUploader from './components/AvatarUploader.vue'
import AwardsPanel from './components/AwardsPanel.vue'
import DimensionPanel from './components/DimensionPanel.vue'

const archiveStore = useArchiveStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

onMounted(() => {
  if (archiveStore.interests.length === 0) archiveStore.fetchArchive()
})

const interests = computed(() => archiveStore.interests)
const awards = computed(() => archiveStore.awards)

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

const dimensions = computed(() => {
  const isDark = themeStore.isDark
  const colorMap: Record<string, string> = isDark
    ? {
        学业成绩: '#60a5fa',
        竞赛实践: '#34d399',
        科研创新: '#f0b87b',
        社会工作: '#a78bfa',
        综合素质: '#fbbf24',
      }
    : {
        学业成绩: '#4a7fb5',
        竞赛实践: '#10b981',
        科研创新: '#d4a574',
        社会工作: '#8b5cf6',
        综合素质: '#f59e0b',
      }
  return archiveStore.dimensions.map((d) => ({
    label: d.label,
    score: d.current,
    color: colorMap[d.label] ?? '#94a3b8',
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

// ── 兴趣管理 ──
const interestDialogVisible = ref(false)
const editingInterestId = ref<string | null>(null)
const interestForm = reactive({ category: '', content: '', level: 'general' })

function openAddInterest() {
  editingInterestId.value = null
  interestForm.category = ''
  interestForm.content = ''
  interestForm.level = 'general'
  interestDialogVisible.value = true
}
function openEditInterest(id: string) {
  editingInterestId.value = id
  const item = interests.value.find((i) => i.id === id)
  if (!item) return
  interestForm.category = item.category
  interestForm.content = item.content
  interestForm.level = item.level
  interestDialogVisible.value = true
}
async function saveInterest() {
  if (!interestForm.category || !interestForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    if (editingInterestId.value)
      await archiveStore.editInterest(editingInterestId.value, { ...interestForm })
    else await archiveStore.createInterest({ ...interestForm })
    interestDialogVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  }
}
function deleteInterest(id: string) {
  ElMessageBox.confirm('确定删除该兴趣吗？', '确认', { type: 'warning' })
    .then(() => archiveStore.removeInterest(id))
    .catch(() => {})
}

// ── 基本资料编辑 ──
const isEditing = ref(false)
const formData = ref<Partial<UserInfo>>({})
function startEdit() {
  formData.value = {
    realName: userStore.userInfo?.realName ?? userStore.userName,
    studentId: userStore.userInfo?.studentId ?? userStore.studentId,
    grade: userStore.userInfo?.grade ?? '',
    major: userStore.userInfo?.major ?? '',
    className: userStore.userInfo?.className ?? '',
    email: userStore.userInfo?.email ?? '',
    phone: userStore.userInfo?.phone ?? '',
  }
  isEditing.value = true
}
async function saveEdit() {
  await userStore.updateUserInfo(formData.value)
  isEditing.value = false
  ElMessage.success('已保存')
}
function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

const { getColor, getLabel } = useDict(INTEREST_LEVEL)
const getInterestType = computed(
  () =>
    (level: string): TagProps['type'] =>
      (getColor(level) as TagProps['type']) ?? 'info',
)

async function handleAvatarUpload(base64: string) {
  await userStore.updateAvatar(base64 || undefined)
  ElMessage.success(base64 ? '头像更新成功' : '头像已删除')
}

// ── PDF 导出 ──
async function handleExportPDF() {
  ElMessage.info('正在生成 PDF...')
  const el = document.querySelector('.layout__content') as HTMLElement
  if (!el) {
    ElMessage.error('获取页面内容失败')
    return
  }
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new JSPDF('p', 'mm', 'a4')
    const pw = pdf.internal.pageSize.getWidth()
    const ph = (canvas.height * pw) / canvas.width
    let left = ph
    let pos = 0
    const pageH = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, 'PNG', 0, pos, pw, ph)
    left -= pageH
    while (left > 0) {
      pos -= pageH
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, pos, pw, ph)
      left -= pageH
    }
    pdf.save('档案概览.pdf')
    ElMessage.success('PDF 已下载')
  } catch {
    ElMessage.error('PDF 生成失败')
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
      <el-button type="primary" plain @click="handleExportPDF">
        <Download :size="16" style="margin-right: 4px" />下载档案 PDF
      </el-button>
    </div>

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
            <p class="stat-card__value">{{ awards.length }}</p>
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
              ><el-form-item label="姓名"
                ><el-input v-model="formData.realName" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="学号"
                ><el-input v-model="formData.studentId" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="年级"
                ><el-input v-model="formData.grade" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="专业"
                ><el-input v-model="formData.major" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="班级"
                ><el-input v-model="formData.className" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="邮箱"
                ><el-input v-model="formData.email" size="small" /></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="手机号"
                ><el-input v-model="formData.phone" size="small" /></el-form-item
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
      <AwardsPanel :awards="awards" />
    </div>

    <el-card class="section-card" shadow="never">
      <template #header
        ><div class="section-head">
          <span class="section-head__title"><Heart :size="15" /> 个人兴趣</span
          ><el-button link type="primary" size="small" :icon="Plus" @click="openAddInterest"
            >新增</el-button
          >
        </div></template
      >
      <div class="interest-grid">
        <div v-for="item in interests" :key="item.id" class="interest-card">
          <div class="interest-card__top">
            <Lightbulb :size="13" /><span class="interest-card__cat">{{ item.category }}</span
            ><el-tag :type="getInterestType(item.level)" size="small" effect="plain">{{
              getLabel(item.level)
            }}</el-tag>
          </div>
          <p class="interest-card__text">{{ item.content }}</p>
          <div class="interest-card__acts">
            <el-button link type="primary" size="small" @click="openEditInterest(item.id)"
              >编辑</el-button
            ><el-button link type="danger" size="small" @click="deleteInterest(item.id)"
              >删除</el-button
            >
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="interestDialogVisible"
      :title="editingInterestId ? '编辑兴趣' : '新增兴趣'"
      width="480px"
    >
      <el-form :model="interestForm" label-width="80px">
        <el-form-item label="兴趣类别" required
          ><el-input v-model="interestForm.category" placeholder="请输入兴趣类别"
        /></el-form-item>
        <el-form-item label="具体内容" required
          ><el-input v-model="interestForm.content" placeholder="请输入具体内容"
        /></el-form-item>
        <el-form-item label="掌握程度"
          ><el-select v-model="interestForm.level"
            ><el-option label="精通" value="proficient" /><el-option
              label="良好"
              value="good" /><el-option label="一般" value="general" /></el-select
        ></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="interestDialogVisible = false">取消</el-button
        ><el-button type="primary" @click="saveInterest">保存</el-button></template
      >
    </el-dialog>
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

// 兴趣
.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.interest-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  transition: border-color 0.2s;
  &:hover {
    border-color: #e2e8f0;
  }
}
.interest-card__top {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  color: #4a7fb5;
}
.interest-card__cat {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}
.interest-card__text {
  margin: 0 0 6px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}
.interest-card__acts {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .row-2col {
    grid-template-columns: 1fr;
  }
  .interest-grid {
    grid-template-columns: 1fr;
  }
}
</style>
