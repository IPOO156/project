<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit2, GraduationCap, Heart, Info, Lightbulb, Plus } from 'lucide-vue-next'
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

// ── 从 store 派生展示数据 ──
const interests = computed(() => archiveStore.interests)
const awards = computed(() => archiveStore.awards)

// 成绩按学期聚合（archiveStore 存的是逐课程数据，页面展示按学期汇总）
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
    .map(([semester, e]) => ({
      semester,
      courses: e.courses,
      gpa: e.creditSum > 0 ? +(e.gpaSum / e.creditSum).toFixed(2) : 0,
      totalScore: e.creditSum > 0 ? +(e.scoreSum / e.creditSum).toFixed(1) : 0,
    }))
})

// 多维度画像：从 store 的 ProfileDimension 派生展示用的 score + color
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
        学业成绩: '#2d5a87',
        竞赛实践: '#10b981',
        科研创新: '#d4a574',
        社会工作: '#8b5cf6',
        综合素质: '#f59e0b',
      }
  return archiveStore.dimensions.map((d) => ({
    label: d.label,
    score: d.current,
    color: colorMap[d.label] ?? '#64748b',
  }))
})

// ── 兴趣增删改 ──
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
    if (editingInterestId.value) {
      await archiveStore.editInterest(editingInterestId.value, { ...interestForm })
    } else {
      await archiveStore.createInterest({ ...interestForm })
    }
    interestDialogVisible.value = false
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

function deleteInterest(id: string) {
  ElMessageBox.confirm('确定删除该兴趣吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
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
  ElMessage.success('基本资料已保存')
}

function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

const { getColor, getLabel } = useDict(INTEREST_LEVEL)

const getInterestType = computed(() => (level: string): TagProps['type'] => {
  return (getColor(level) as TagProps['type']) ?? 'info'
})

const avgGpa = computed(() => {
  if (gradeSummary.value.length === 0) return '0.00'
  const total = gradeSummary.value.reduce((s, g) => s + g.gpa, 0)
  return (total / gradeSummary.value.length).toFixed(2)
})

async function handleAvatarUpload(base64: string) {
  await userStore.updateAvatar(base64 || undefined)
  ElMessage.success(base64 ? '头像更新成功' : '头像已删除')
}
</script>

<template>
  <div class="profile-info">
    <!-- 第一行：基本资料 + 多维度画像 -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <Info :size="16" />
                <span>基本资料</span>
              </div>
              <el-button
                v-if="!isEditing"
                link
                type="primary"
                size="small"
                :icon="Edit2"
                @click="startEdit"
              >
                编辑
              </el-button>
              <div v-else class="edit-actions">
                <el-button size="small" @click="cancelEdit">取消</el-button>
                <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
              </div>
            </div>
          </template>
          <div class="profile-user">
            <AvatarUploader
              :model-value="userStore.avatar ?? ''"
              :size="80"
              @upload="handleAvatarUpload"
            />
            <div class="profile-user__info">
              <h3 class="profile-user__name">{{ userStore.userName }}</h3>
              <p class="profile-user__meta">
                {{ userStore.userInfo?.major || '' }} · {{ userStore.userInfo?.className || '' }} ·
                学号 {{ userStore.studentId }}
              </p>
            </div>
          </div>
          <el-descriptions v-if="!isEditing" :column="2" border class="profile-descriptions">
            <el-descriptions-item label="姓名">{{
              userStore.userName || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{
              userStore.studentId || '-'
            }}</el-descriptions-item>
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
                ><el-form-item label="姓名"><el-input v-model="formData.realName" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="学号"><el-input v-model="formData.studentId" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="年级"><el-input v-model="formData.grade" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="专业"><el-input v-model="formData.major" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="班级"><el-input v-model="formData.className" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="邮箱"><el-input v-model="formData.email" /></el-form-item
              ></el-col>
              <el-col :span="12"
                ><el-form-item label="手机号"><el-input v-model="formData.phone" /></el-form-item
              ></el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="10">
        <DimensionPanel :dimensions="dimensions" />
      </el-col>
    </el-row>

    <!-- 第二行：三个数据卡片 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <GraduationCap :size="16" />
                <span>期末成绩</span>
              </div>
              <span class="card-header__tag">平均绩点 {{ avgGpa }}</span>
            </div>
          </template>
          <div class="grade-list">
            <div v-for="g in gradeSummary" :key="g.semester" class="grade-item">
              <div class="grade-item__semester">
                {{ g.semester.replace(/-(\d)$/g, '第$1学期') }}
              </div>
              <div class="grade-item__body">
                <div class="grade-item__stat">
                  <span class="grade-item__num">{{ g.gpa }}</span>
                  <span class="grade-item__lbl">绩点</span>
                </div>
                <div class="grade-item__stat">
                  <span class="grade-item__num">{{ g.totalScore }}</span>
                  <span class="grade-item__lbl">均分</span>
                </div>
                <div class="grade-item__stat">
                  <span class="grade-item__num">{{ g.courses }}</span>
                  <span class="grade-item__lbl">课程</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <AwardsPanel :awards="awards" />
      </el-col>

      <el-col :span="8">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <Heart :size="16" />
                <span>个人兴趣</span>
              </div>
              <el-button link type="primary" size="small" :icon="Plus" @click="openAddInterest">
                新增
              </el-button>
            </div>
          </template>
          <div class="interest-list">
            <div v-for="item in interests" :key="item.id" class="interest-item">
              <div class="interest-item__header">
                <Lightbulb :size="14" />
                <span class="interest-item__category">{{ item.category }}</span>
                <el-tag :type="getInterestType(item.level)" size="small" effect="plain">
                  {{ getLabel(item.level) }}
                </el-tag>
              </div>
              <p class="interest-item__content">{{ item.content }}</p>
              <div class="interest-item__actions">
                <el-button link type="primary" size="small" @click="openEditInterest(item.id)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="deleteInterest(item.id)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 兴趣弹窗 -->
    <el-dialog
      v-model="interestDialogVisible"
      :title="editingInterestId ? '编辑兴趣' : '新增兴趣'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="interestForm" label-width="80px">
        <el-form-item label="兴趣类别" required>
          <el-input v-model="interestForm.category" placeholder="请输入兴趣类别" />
        </el-form-item>
        <el-form-item label="具体内容" required>
          <el-input v-model="interestForm.content" placeholder="请输入具体内容" />
        </el-form-item>
        <el-form-item label="掌握程度">
          <el-select v-model="interestForm.level" class="form-select">
            <el-option label="精通" value="proficient" />
            <el-option label="良好" value="good" />
            <el-option label="一般" value="general" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interestDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveInterest">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;
}

.profile-card {
  margin-bottom: 0;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
  }

  &__tag {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    padding: 2px 10px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
  }

  .edit-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.profile-user {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__name {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 4px;
  }

  &__meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.profile-descriptions {
  :deep(.el-descriptions__label) {
    width: 70px;
    min-width: 70px;
    text-align: center;
  }
}

.profile-form {
  margin-top: 12px;
}

// ─── 成绩卡片 ───
.grade-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);

  &__semester {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__body {
    display: flex;
    gap: 16px;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__num {
    font-size: 18px;
    font-weight: 700;
    color: #1e3a5f;
  }

  &__lbl {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

// ─── 兴趣卡片 ───
.interest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.interest-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    color: var(--el-text-color-primary);
  }

  &__category {
    font-size: 14px;
    font-weight: 600;
    flex: 1;
  }

  &__content {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    padding-left: 20px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}
</style>

<style lang="scss">
html.dark .profile-info {
  .el-table {
    --el-table-header-bg-color: var(--el-fill-color-light);
    --el-table-header-text-color: var(--el-text-color-primary);
  }

  .grade-item {
    background: var(--el-bg-color);
    border-color: var(--el-border-color);
  }

  .grade-item__semester {
    color: var(--el-text-color-regular);
  }

  .grade-item__num {
    color: var(--el-text-color-primary);
  }

  .grade-item__lbl {
    color: var(--el-text-color-secondary);
  }
}
</style>
