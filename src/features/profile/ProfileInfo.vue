<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { Award, Edit2, GraduationCap, Heart, Info, Lightbulb, TrendingUp } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import { useDict } from '@/shared/composables/composables'
import { INTEREST_LEVEL } from '@/shared/constants/dict'
import AvatarUploader from './components/AvatarUploader.vue'

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

const dimensions = ref([
  { label: '学业成绩', score: 88, color: '#2d5a87' },
  { label: '竞赛实践', score: 65, color: '#10b981' },
  { label: '科研创新', score: 60, color: '#d4a574' },
  { label: '社会工作', score: 85, color: '#8b5cf6' },
  { label: '综合素质', score: 80, color: '#f59e0b' },
])

const { getColor, getLabel } = useDict(INTEREST_LEVEL)

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
              <span class="card-header__tag">{{ awards.length }}项</span>
            </div>
          </template>
          <div class="award-list">
            <div v-for="a in awards" :key="a.name" class="award-item">
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
            </div>
          </template>
          <div class="interest-list">
            <div v-for="item in interests" :key="item.category" class="interest-item">
              <div class="interest-item__header">
                <Lightbulb :size="14" />
                <span class="interest-item__category">{{ item.category }}</span>
                <el-tag :type="getInterestType(item.level)" size="small" effect="plain">
                  {{ getLabel(item.level) }}
                </el-tag>
              </div>
              <p class="interest-item__content">{{ item.content }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
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
    color: #1e3a5f;
  }

  &__tag {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    padding: 2px 10px;
    border-radius: 4px;
    background: rgba(30, 58, 95, 0.04);
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
    color: #1e3a5f;
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
    color: #1e3a5f;
  }

  &__category {
    font-size: 14px;
    font-weight: 600;
    flex: 1;
  }

  &__content {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    padding-left: 20px;
  }
}
</style>

<style lang="scss">
html.dark .profile-info {
  .el-table {
    --el-table-header-bg-color: var(--el-fill-color-light);
    --el-table-header-text-color: var(--el-text-color-primary);
  }
}
</style>
