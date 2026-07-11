<script setup lang="ts">
import type { SemesterData } from '@/features/teacher-shared/SemesterTimeline.vue'
/**
 * HeatMap - 成果热力图
 * 筛选路径：年级→学院→专业→班级→学生
 * 以学期为数据节点展示：奖项、社会实践、成绩
 * 点击学期节点可展开查看详情
 */
import { ref } from 'vue'
import SemesterTimeline from '@/features/teacher-shared/SemesterTimeline.vue'
import StudentSelector from '@/features/teacher-shared/StudentSelector.vue'

const selectedStudent = ref<{ name: string; id: string } | null>(null)
const studentListVisible = ref(false)

// ── Mock 学生列表 ──
const studentList = ref([
  { id: '2024060001', name: '张三', className: '计科2401班' },
  { id: '2024060002', name: '李四', className: '计科2401班' },
  { id: '2024060003', name: '王五', className: '计科2401班' },
  { id: '2024060004', name: '赵六', className: '软件2401班' },
  { id: '2024060005', name: '孙七', className: '软件2401班' },
])

// ── Mock 学期数据 ──
const mockSemesterData: SemesterData[] = [
  {
    semester: '大一(上)',
    awards: [{ name: '全国大学生英语竞赛二等奖', date: '2025-05', level: '国家级' }],
    practices: [],
    grades: [
      { course: '高等数学', score: 92, gpa: 4.0 },
      { course: '大学英语', score: 88, gpa: 3.7 },
    ],
  },
  {
    semester: '大一(下)',
    awards: [],
    practices: [{ name: '社区志愿服务', date: '2025-08', organization: '校团委' }],
    grades: [
      { course: '高等数学', score: 90, gpa: 3.9 },
      { course: 'C语言程序设计', score: 86, gpa: 3.6 },
    ],
  },
  {
    semester: '大二(上)',
    awards: [{ name: 'ACM程序设计竞赛省赛银奖', date: '2026-05', level: '省级' }],
    practices: [{ name: '暑期社会实践', date: '2026-07', organization: '计算机学院' }],
    grades: [
      { course: '数据结构', score: 91, gpa: 3.9 },
      { course: '操作系统', score: 85, gpa: 3.5 },
    ],
  },
  {
    semester: '大二(下)',
    awards: [],
    practices: [],
    grades: [],
  },
  {
    semester: '大三(上)',
    awards: [],
    practices: [],
    grades: [],
  },
  {
    semester: '大三(下)',
    awards: [],
    practices: [],
    grades: [],
  },
  {
    semester: '大四(上)',
    awards: [],
    practices: [],
    grades: [],
  },
  {
    semester: '大四(下)',
    awards: [],
    practices: [],
    grades: [],
  },
]

function handleSearch() {
  studentListVisible.value = true
}

function handleReset() {
  studentListVisible.value = false
  selectedStudent.value = null
}

function selectStudent(student: { name: string; id: string }) {
  selectedStudent.value = student
}
</script>

<template>
  <div class="heat-map">
    <!-- 筛选器 -->
    <StudentSelector title="成果热力图" @search="handleSearch" @reset="handleReset" />

    <el-row :gutter="16" class="heat-map__main">
      <!-- 学生列表 -->
      <el-col v-if="studentListVisible" :span="7">
        <el-card class="heat-map__student-list">
          <template #header>
            <span class="section-title">学生列表</span>
          </template>
          <div class="student-list">
            <div
              v-for="s in studentList"
              :key="s.id"
              class="student-list__item"
              :class="{ 'is-active': selectedStudent?.id === s.id }"
              @click="selectStudent(s)"
            >
              <div class="student-list__avatar">
                <el-avatar :size="36">{{ s.name.charAt(0) }}</el-avatar>
              </div>
              <div class="student-list__info">
                <span class="student-list__name">{{ s.name }}</span>
                <span class="student-list__class">{{ s.className }}</span>
              </div>
              <div v-if="selectedStudent?.id === s.id" class="student-list__check">
                <el-tag size="small" type="primary">查看中</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 热力图详情 -->
      <el-col :span="studentListVisible ? 17 : 24">
        <el-card v-if="selectedStudent" class="heat-map__detail">
          <template #header>
            <span class="section-title">成果概览 — {{ selectedStudent.name }}</span>
          </template>
          <SemesterTimeline :semesters="mockSemesterData" :student-name="selectedStudent.name" />
        </el-card>

        <el-card v-else class="heat-map__empty">
          <el-empty description="请先在左侧选择学生，或使用上方筛选条件查询" :image-size="120" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.heat-map {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__main {
    flex: 1;
  }

  &__student-list {
    height: 100%;

    :deep(.el-card__body) {
      max-height: 580px;
      overflow-y: auto;
    }
  }

  &__detail,
  &__empty {
    height: 100%;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    border-radius: $radius-base;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__class {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
