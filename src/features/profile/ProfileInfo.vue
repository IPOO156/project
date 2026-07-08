<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Award,
  Edit2,
  GraduationCap,
  Heart,
  Info,
  Lightbulb,
  Plus,
  TrendingUp,
} from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { useThemeStore, useUserStore } from '@/app/stores/stores'
import { useDict } from '@/shared/composables/composables'
import { INTEREST_LEVEL } from '@/shared/constants/dict'
import AvatarUploader from './components/AvatarUploader.vue'

// ── 兴趣增删改 ──
const interestDialogVisible = ref(false)
const editingInterestIndex = ref(-1)
const interestForm = reactive({ category: '', content: '', level: 'general' })

function openAddInterest() {
  editingInterestIndex.value = -1
  interestForm.category = ''
  interestForm.content = ''
  interestForm.level = 'general'
  interestDialogVisible.value = true
}

function openEditInterest(index: number) {
  editingInterestIndex.value = index
  const item = interests.value[index]
  interestForm.category = item.category
  interestForm.content = item.content
  interestForm.level = item.level
  interestDialogVisible.value = true
}

function saveInterest() {
  if (!interestForm.category || !interestForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingInterestIndex.value >= 0) {
    interests.value[editingInterestIndex.value] = { ...interestForm }
    ElMessage.success('兴趣已更新')
  } else {
    interests.value.push({ ...interestForm })
    ElMessage.success('兴趣已添加')
  }
  interestDialogVisible.value = false
}

function deleteInterest(index: number) {
  ElMessageBox.confirm('确定删除该兴趣吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      interests.value.splice(index, 1)
      ElMessage.success('兴趣已删除')
    })
    .catch(() => {})
}

// ── 奖项增删改 ──
const awardDialogVisible = ref(false)
const editingAwardIndex = ref(-1)
const awardForm = reactive({ name: '', level: '', award: '', date: '' })

function openAddAward() {
  editingAwardIndex.value = -1
  awardForm.name = ''
  awardForm.level = ''
  awardForm.award = ''
  awardForm.date = ''
  awardDialogVisible.value = true
}

function openEditAward(index: number) {
  editingAwardIndex.value = index
  const item = awards.value[index]
  awardForm.name = item.name
  awardForm.level = item.level
  awardForm.award = item.award
  awardForm.date = item.date
  awardDialogVisible.value = true
}

function saveAward() {
  if (!awardForm.name || !awardForm.level) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingAwardIndex.value >= 0) {
    awards.value[editingAwardIndex.value] = { ...awardForm }
    ElMessage.success('奖项已更新')
  } else {
    awards.value.push({ ...awardForm })
    ElMessage.success('奖项已添加')
  }
  awardDialogVisible.value = false
}

function deleteAward(index: number) {
  ElMessageBox.confirm('确定删除该奖项吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      awards.value.splice(index, 1)
      ElMessage.success('奖项已删除')
    })
    .catch(() => {})
}

const userStore = useUserStore()

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

function saveEdit() {
  userStore.updateUserInfo(formData.value)
  isEditing.value = false
  ElMessage.success('基本资料已保存')
}

function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

// ── Mock 数据（接口联调后替换） ──
const interests = ref([
  { category: '编程开发', content: 'Web 前端开发、人工智能应用', level: 'proficient' },
  { category: '语言能力', content: '英语（CET-6）、日语（N3）', level: 'good' },
  { category: '运动爱好', content: '篮球、跑步', level: 'general' },
])

const grades = ref([
  { semester: '2022-2023-1', courses: 8, gpa: 3.2, totalScore: 85.6 },
  { semester: '2022-2023-2', courses: 7, gpa: 3.4, totalScore: 87.2 },
  { semester: '2023-2024-1', courses: 9, gpa: 3.6, totalScore: 89.5 },
  { semester: '2023-2024-2', courses: 8, gpa: 3.8, totalScore: 91.3 },
])

const awards = ref([
  { name: '全国大学生数学建模竞赛', level: '省级', award: '二等奖', date: '2025-09' },
  { name: '校级优秀学生干部', level: '校级', award: '优秀干部', date: '2025-06' },
  { name: 'ACM 程序设计竞赛', level: '校级', award: '一等奖', date: '2025-05' },
])

const { getColor, getLabel } = useDict(INTEREST_LEVEL)
const themeStore = useThemeStore()

const dimensions = computed(() => {
  const isDark = themeStore.isDark
  return [
    { label: '学业成绩', score: 88, color: isDark ? '#60a5fa' : '#2d5a87' },
    { label: '竞赛实践', score: 65, color: isDark ? '#34d399' : '#10b981' },
    { label: '科研创新', score: 60, color: isDark ? '#f0b87b' : '#d4a574' },
    { label: '社会工作', score: 85, color: isDark ? '#a78bfa' : '#8b5cf6' },
    { label: '综合素质', score: 80, color: isDark ? '#fbbf24' : '#f59e0b' },
  ]
})

const getInterestType = computed(() => (level: string): TagProps['type'] => {
  return (getColor(level) as TagProps['type']) ?? 'info'
})

const avgGpa = computed(() => {
  const total = grades.value.reduce((s, g) => s + g.gpa, 0)
  return (total / grades.value.length).toFixed(2)
})

function handleAvatarUpload(base64: string) {
  userStore.updateAvatar(base64 || undefined)
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
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <TrendingUp :size="16" />
                <span>多维度画像</span>
              </div>
              <span class="card-header__tag"
                >综合评分
                {{ dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length }}分</span
              >
            </div>
          </template>
          <div class="dimension-list">
            <div v-for="dim in dimensions" :key="dim.label" class="dimension-item">
              <div class="dimension-item__head">
                <span class="dimension-item__label">{{ dim.label }}</span>
                <span class="dimension-item__score" :style="{ color: dim.color }"
                  >{{ dim.score }}分</span
                >
              </div>
              <el-progress
                :percentage="dim.score"
                :color="dim.color"
                :stroke-width="8"
                :format="() => ''"
                class="dimension-item__bar"
              />
            </div>
          </div>
        </el-card>
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
            <div v-for="g in grades" :key="g.semester" class="grade-item">
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
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <Award :size="16" />
                <span>个人奖项</span>
              </div>
              <el-button link type="primary" size="small" :icon="Plus" @click="openAddAward">
                新增
              </el-button>
            </div>
          </template>
          <div class="award-list">
            <div v-for="(a, idx) in awards" :key="a.name" class="award-item">
              <div class="award-item__icon">
                <Award :size="18" />
              </div>
              <div class="award-item__body">
                <div class="award-item__name">{{ a.name }}</div>
                <div class="award-item__meta">
                  <el-tag size="small" type="warning" effect="plain">{{ a.level }}</el-tag>
                  <span>{{ a.award }}</span>
                  <span>{{ a.date }}</span>
                </div>
              </div>
              <div class="award-item__actions">
                <el-button link type="primary" size="small" @click="openEditAward(idx)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="deleteAward(idx)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
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
            <div v-for="(item, idx) in interests" :key="item.category" class="interest-item">
              <div class="interest-item__header">
                <Lightbulb :size="14" />
                <span class="interest-item__category">{{ item.category }}</span>
                <el-tag :type="getInterestType(item.level)" size="small" effect="plain">
                  {{ getLabel(item.level) }}
                </el-tag>
              </div>
              <p class="interest-item__content">{{ item.content }}</p>
              <div class="interest-item__actions">
                <el-button link type="primary" size="small" @click="openEditInterest(idx)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="deleteInterest(idx)">
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
      :title="editingInterestIndex >= 0 ? '编辑兴趣' : '新增兴趣'"
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

    <!-- 奖项弹窗 -->
    <el-dialog
      v-model="awardDialogVisible"
      :title="editingAwardIndex >= 0 ? '编辑奖项' : '新增奖项'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="awardForm" label-width="80px">
        <el-form-item label="奖项名称" required>
          <el-input v-model="awardForm.name" placeholder="请输入奖项名称" />
        </el-form-item>
        <el-form-item label="奖项级别" required>
          <el-select v-model="awardForm.level" class="form-select" placeholder="请选择级别">
            <el-option label="国家级" value="国家级" />
            <el-option label="省级" value="省级" />
            <el-option label="市级" value="市级" />
            <el-option label="校级" value="校级" />
            <el-option label="院级" value="院级" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖等级">
          <el-input v-model="awardForm.award" placeholder="如 一等奖、优秀干部" />
        </el-form-item>
        <el-form-item label="获奖时间">
          <el-date-picker
            v-model="awardForm.date"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            class="form-select"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="awardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAward">保存</el-button>
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

// ─── 维度卡片 ───
.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-item {
  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  &__score {
    font-size: 13px;
    font-weight: 600;
  }

  &__bar {
    :deep(.el-progress-bar__outer) {
      background-color: var(--el-fill-color-light);
    }
  }
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

// ─── 奖项卡片 ───
.award-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.award-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  transition: border-color 0.2s;

  &:hover {
    border-color: #d4a574;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(212, 165, 116, 0.1);
    color: #d4a574;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
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

  .dimension-item__score {
    color: var(--el-text-color-primary) !important;
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
