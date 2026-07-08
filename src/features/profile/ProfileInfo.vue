<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { Award, Edit2, Info, Lightbulb, TrendingUp } from 'lucide-vue-next'
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

const gradesPage = ref(1)
const gradesPageSize = ref(5)
const awardsPage = ref(1)
const awardsPageSize = ref(5)

const paginatedGrades = computed(() => {
  const start = (gradesPage.value - 1) * gradesPageSize.value
  return grades.value.slice(start, start + gradesPageSize.value)
})

const paginatedAwards = computed(() => {
  const start = (awardsPage.value - 1) * awardsPageSize.value
  return awards.value.slice(start, start + awardsPageSize.value)
})

const dimensions = ref([
  { label: '学业成绩', score: 88, color: '#409eff' },
  { label: '竞赛实践', score: 65, color: '#67c23a' },
  { label: '科研创新', score: 60, color: '#e6a23c' },
  { label: '社会工作', score: 85, color: '#f56c6c' },
  { label: '综合素质', score: 80, color: '#9b59b6' },
])

const { getColor, getLabel } = useDict(INTEREST_LEVEL)

const getInterestType = computed(() => (level: string): TagProps['type'] => {
  return (getColor(level) as TagProps['type']) ?? 'info'
})

function handleAvatarUpload(base64: string) {
  userStore.updateAvatar(base64 || undefined)
  ElMessage.success(base64 ? '头像更新成功' : '头像已删除')
}
</script>

<template>
  <div class="profile-info">
    <!-- 基本资料卡片 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <Info :size="18" />
            <span>基本资料</span>
          </div>
          <el-button v-if="!isEditing" link type="primary" :icon="Edit2" @click="startEdit">
            编辑
          </el-button>
          <div v-else class="edit-actions">
            <el-button link @click="cancelEdit">取消</el-button>
            <el-button link type="primary" @click="saveEdit">保存</el-button>
          </div>
        </div>
      </template>
      <div class="profile-header">
        <AvatarUploader
          :model-value="userStore.avatar ?? ''"
          :size="96"
          @upload="handleAvatarUpload"
        />
        <div class="profile-header__info">
          <h3 class="profile-header__name">{{ userStore.userName }}</h3>
          <p class="profile-header__meta">学号 {{ userStore.studentId }}</p>
          <p class="profile-header__tip">点击头像更换，支持 jpg/png/webp，最大 5MB</p>
        </div>
      </div>
      <el-descriptions v-if="!isEditing" :column="3" border class="profile-descriptions">
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
      <el-form v-else :model="formData" label-width="80px" class="profile-form">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="姓名">
              <el-input v-model="formData.realName" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学号">
              <el-input v-model="formData.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年级">
              <el-input v-model="formData.grade" placeholder="请输入年级" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="专业">
              <el-input v-model="formData.major" placeholder="请输入专业" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="班级">
              <el-input v-model="formData.className" placeholder="请输入班级" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机号">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 多维度画像引擎 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <TrendingUp :size="18" />
          <span>多维度画像引擎</span>
        </div>
      </template>
      <el-row :gutter="24">
        <el-col v-for="dim in dimensions" :key="dim.label" :span="12">
          <div class="dimension-item">
            <span class="dimension-item__label">{{ dim.label }}</span>
            <el-progress
              class="dimension-item__progress"
              :percentage="dim.score"
              :color="dim.color"
              :stroke-width="14"
              :format="() => ''"
            />
            <span class="dimension-item__score">{{ dim.score }}分</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 个人兴趣 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Lightbulb :size="18" />
          <span>个人兴趣</span>
        </div>
      </template>
      <el-table :data="interests" stripe>
        <el-table-column prop="category" label="兴趣类别" width="160" />
        <el-table-column prop="content" label="具体内容" />
        <el-table-column prop="level" label="掌握程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getInterestType(row.level)" size="small">
              {{ getLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 期末成绩 + 绩点 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Award :size="18" />
          <span>期末成绩与绩点</span>
        </div>
      </template>
      <el-table :data="paginatedGrades" stripe>
        <el-table-column prop="semester" label="学期" width="120" align="center" />
        <el-table-column prop="courses" label="课程数" width="100" align="center" />
        <el-table-column prop="gpa" label="绩点" width="120" align="center">
          <template #default="{ row }">
            <span class="gpa-highlight">{{ row.gpa }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="平均分" align="center" />
      </el-table>
      <el-pagination
        v-model:current-page="gradesPage"
        v-model:page-size="gradesPageSize"
        :total="grades.length"
        :page-sizes="[5, 10, 20]"
        layout="total, sizes, prev, pager, next"
        class="profile-table-pagination"
      />
    </el-card>

    <!-- 个人奖项 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Award :size="18" />
          <span>个人奖项</span>
        </div>
      </template>
      <el-table :data="paginatedAwards" stripe>
        <el-table-column prop="name" label="奖项名称" />
        <el-table-column prop="level" label="奖项级别" width="120" align="center" />
        <el-table-column prop="award" label="获奖等级" width="120" align="center" />
        <el-table-column prop="date" label="获奖时间" width="120" align="center" />
      </el-table>
      <el-pagination
        v-model:current-page="awardsPage"
        v-model:page-size="awardsPageSize"
        :total="awards.length"
        :page-sizes="[5, 10, 20]"
        layout="total, sizes, prev, pager, next"
        class="profile-table-pagination"
      />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;

  &__section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;

      &__left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .el-tag {
        margin-left: auto;
      }

      .edit-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .profile-form {
    margin-top: 16px;
  }

  .profile-table-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 14px;

  &__label {
    flex-shrink: 0;
    width: 70px;
    color: var(--el-text-color-primary);
  }

  &__progress {
    flex: 1;
    min-width: 0;
  }

  &__score {
    flex-shrink: 0;
    width: 48px;
    text-align: right;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  &__meta {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  &__tip {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

.profile-descriptions {
  margin-top: 16px;

  :deep(.el-descriptions__label) {
    width: 80px;
    min-width: 80px;
    text-align: center;
  }
}
</style>

<style lang="scss">
html.dark .profile-info {
  .el-table {
    --el-table-header-bg-color: var(--el-fill-color-light);
    --el-table-header-text-color: var(--el-text-color-primary);
  }

  .el-table th.el-table__cell {
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  .el-table td.el-table__cell {
    color: var(--el-text-color-primary);
  }
}
</style>
