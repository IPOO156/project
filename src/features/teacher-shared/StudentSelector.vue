<script setup lang="ts">
/**
 * StudentSelector - 学生筛选器
 *
 * 提供统一的筛选链路：年级→学院→专业→班级→姓名/学号
 * 用于档案查看、热力图、材料审核等模块
 *
 * 设计语言与学生端保持一致（Token、间距、圆角）
 */
import { Search } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

interface Props {
  /** 是否显示学院层级（课任教师可能只有专业→班级） */
  showCollege?: boolean
  /** 是否显示年级选择 */
  showGrade?: boolean
  /** 筛选器标题 */
  title?: string
}

withDefaults(defineProps<Props>(), {
  showCollege: true,
  showGrade: true,
  title: '筛选条件',
})

const emit = defineEmits<{
  search: [filters: StudentFilters]
  reset: []
}>()

export interface StudentFilters {
  grade: string
  college: string
  major: string
  className: string
  keyword: string
  keywordType: 'name' | 'studentId'
}

const filters = reactive<StudentFilters>({
  grade: '',
  college: '',
  major: '',
  className: '',
  keyword: '',
  keywordType: 'name',
})

// ── Mock 数据（接口对接后替换） ──
const gradeOptions = ['2024级', '2023级', '2022级', '2021级']
const collegeOptions = ['计算机学院', '数学学院', '物理学院', '外语学院']
const majorOptions = computed(() => {
  if (!filters.college) return []
  const map: Record<string, string[]> = {
    计算机学院: ['计算机科学与技术', '软件工程', '人工智能', '网络工程'],
    数学学院: ['数学与应用数学', '信息与计算科学', '统计学'],
    物理学院: ['物理学', '应用物理', '光电信息工程'],
    外语学院: ['英语', '日语', '法语'],
  }
  return map[filters.college] ?? []
})
const classOptions = computed(() => {
  if (!filters.major) return []
  return [`${filters.major}1班`, `${filters.major}2班`, `${filters.major}3班`]
})

const hasFilters = computed(() => {
  return !!(
    filters.grade ||
    filters.college ||
    filters.major ||
    filters.className ||
    filters.keyword
  )
})

function handleSearch() {
  emit('search', { ...filters })
}

function handleReset() {
  filters.grade = ''
  filters.college = ''
  filters.major = ''
  filters.className = ''
  filters.keyword = ''
  filters.keywordType = 'name'
  emit('reset')
}
</script>

<template>
  <div class="student-selector">
    <div class="student-selector__header">
      <span class="student-selector__title">{{ title }}</span>
      <div class="student-selector__actions">
        <el-button size="small" :disabled="!hasFilters" @click="handleReset"> 重置 </el-button>
        <el-button type="primary" size="small" :icon="Search" @click="handleSearch">
          查询
        </el-button>
      </div>
    </div>

    <el-divider class="student-selector__divider" />

    <div class="student-selector__form">
      <el-row :gutter="16">
        <el-col v-if="showGrade" :xs="12" :sm="8" :md="6" :lg="4">
          <el-form-item label="年级">
            <el-select
              v-model="filters.grade"
              placeholder="选择年级"
              clearable
              class="student-selector__select"
            >
              <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col v-if="showCollege" :xs="12" :sm="8" :md="6" :lg="4">
          <el-form-item label="学院">
            <el-select
              v-model="filters.college"
              placeholder="选择学院"
              clearable
              class="student-selector__select"
            >
              <el-option v-for="c in collegeOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="12" :sm="8" :md="6" :lg="4">
          <el-form-item label="专业">
            <el-select
              v-model="filters.major"
              placeholder="选择专业"
              clearable
              :disabled="!filters.college && showCollege"
              class="student-selector__select"
            >
              <el-option v-for="m in majorOptions" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="12" :sm="8" :md="6" :lg="4">
          <el-form-item label="班级">
            <el-select
              v-model="filters.className"
              placeholder="选择班级"
              clearable
              :disabled="!filters.major"
              class="student-selector__select"
            >
              <el-option v-for="c in classOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="16" :md="12" :lg="8">
          <el-form-item label="检索">
            <el-input
              v-model="filters.keyword"
              :placeholder="filters.keywordType === 'name' ? '请输入学生姓名' : '请输入学号'"
              clearable
              class="student-selector__input"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <Search :size="16" />
              </template>
              <template #append>
                <el-select v-model="filters.keywordType" style="width: 80px">
                  <el-option label="姓名" value="name" />
                  <el-option label="学号" value="studentId" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped lang="scss">
.student-selector {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  padding: $spacing-lg $spacing-xl;
  box-shadow: $shadow-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__divider {
    margin: $spacing-md 0;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      padding-bottom: 2px;
    }

    :deep(.el-form-item__content) {
      flex-wrap: nowrap;
    }
  }

  &__select,
  &__input {
    width: 100%;
  }
}
</style>
