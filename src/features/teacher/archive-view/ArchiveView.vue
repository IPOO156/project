<script setup lang="ts">
import type { StudentFilters } from '@/features/teacher-shared/StudentSelector.vue'
import { ElMessage } from 'element-plus'
/**
 * ArchiveView - 档案查看
 * 支持全校档案汇总呈现 + 筛选链路（年级→学院→专业→班级）检索
 * 多维可视化汇总数据：学科成绩/绩点、个人奖项、社会实践、兴趣爱好
 * 课任教师可填写改进建议
 */
import { BookOpen, Eye, Heart, Star, TrendingUp, Trophy, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import StudentSelector from '@/features/teacher-shared/StudentSelector.vue'

const activeTab = ref<'overview' | 'detail'>('overview')
const selectedStudent = ref<{ name: string; id: string } | null>(null)
const suggestionDialogVisible = ref(false)
const suggestion = ref('')

// ── Mock 数据 ──
const overallStats = ref({
  totalStudents: 2846,
  totalMajors: 12,
  totalClasses: 48,
  avgGpa: 3.42,
  awardCount: 1586,
  practiceCount: 2341,
})

const studentList = ref([
  {
    id: '2024060001',
    name: '张三',
    grade: '2024级',
    major: '计算机科学与技术',
    className: '计科2401班',
    gpa: 3.82,
    awards: 3,
    practices: 2,
  },
  {
    id: '2024060002',
    name: '李四',
    grade: '2024级',
    major: '计算机科学与技术',
    className: '计科2401班',
    gpa: 3.65,
    awards: 1,
    practices: 3,
  },
  {
    id: '2024060003',
    name: '王五',
    grade: '2024级',
    major: '计算机科学与技术',
    className: '计科2401班',
    gpa: 3.91,
    awards: 5,
    practices: 4,
  },
  {
    id: '2024060004',
    name: '赵六',
    grade: '2024级',
    major: '软件工程',
    className: '软件2401班',
    gpa: 3.48,
    awards: 2,
    practices: 1,
  },
  {
    id: '2024060005',
    name: '孙七',
    grade: '2024级',
    major: '软件工程',
    className: '软件2401班',
    gpa: 3.73,
    awards: 4,
    practices: 2,
  },
])

const categoryData = computed(() => [
  {
    label: '平均绩点',
    value: overallStats.value.avgGpa,
    icon: TrendingUp,
    color: '#2d5a87',
    percent: 76,
  },
  {
    label: '获奖总人次',
    value: overallStats.value.awardCount,
    icon: Trophy,
    color: '#d4a574',
    percent: 68,
  },
  {
    label: '社会实践',
    value: overallStats.value.practiceCount,
    icon: Heart,
    color: '#10b981',
    percent: 82,
  },
  { label: '图书心得', value: 1562, icon: BookOpen, color: '#8b5cf6', percent: 55 },
  { label: '学科竞赛', value: 892, icon: Star, color: '#f59e0b', percent: 31 },
])

// 档案等级分级展示
const archiveLevels = computed(() => [
  {
    label: '优秀档案',
    range: 'GPA ≥ 3.8',
    count: 356,
    color: 'var(--el-color-success)',
    percent: 13,
  },
  {
    label: '良好档案',
    range: '3.5 ≤ GPA < 3.8',
    count: 723,
    color: 'var(--el-color-primary)',
    percent: 25,
  },
  {
    label: '中等档案',
    range: '3.0 ≤ GPA < 3.5',
    count: 1082,
    color: 'var(--el-color-warning)',
    percent: 38,
  },
  {
    label: '待提升档案',
    range: 'GPA < 3.0',
    count: 685,
    color: 'var(--el-color-danger)',
    percent: 24,
  },
])

function handleSearch(_filters: StudentFilters) {
  // 接口就绪后替换为真实查询
}

function handleReset() {
  // 接口就绪后替换为真实重置
}

function viewStudentDetail(student: any) {
  selectedStudent.value = { name: student.name, id: student.studentId || student.id }
  activeTab.value = 'detail'
}

function submitSuggestion() {
  if (suggestion.value.trim()) {
    ElMessage.success('改进建议提交成功')
    suggestionDialogVisible.value = false
    suggestion.value = ''
  }
}

function getGpaClass(gpa: number) {
  if (gpa >= 3.8) return 'is-excellent'
  if (gpa >= 3.5) return 'is-good'
  if (gpa >= 3.0) return 'is-average'
  return 'is-low'
}
</script>

<template>
  <div class="archive-view">
    <!-- 筛选器 -->
    <StudentSelector title="档案查看" @search="handleSearch" @reset="handleReset" />

    <!-- 标签切换 -->
    <el-tabs v-model="activeTab" class="archive-view__tabs">
      <!-- 汇总概览 -->
      <el-tab-pane label="档案总览" name="overview">
        <div class="archive-overview">
          <!-- 统计卡片 -->
          <el-row v-show="false" :gutter="16" class="archive-overview__stats">
            <!-- 统计卡片占位 - 预留给接口数据 -->
          </el-row>

          <!-- 档案价值分级展示 -->
          <el-card class="archive-overview__section">
            <template #header>
              <span class="section-title">档案价值分级</span>
            </template>
            <div class="level-bars">
              <div v-for="level in archiveLevels" :key="level.label" class="level-bar">
                <div class="level-bar__header">
                  <span class="level-bar__label">{{ level.label }}</span>
                  <span class="level-bar__range">{{ level.range }}</span>
                  <span class="level-bar__count">{{ level.count }}人</span>
                  <span class="level-bar__percent">{{ level.percent }}%</span>
                </div>
                <el-progress
                  :percentage="level.percent"
                  :stroke-width="16"
                  :color="level.color"
                  striped
                  striped-flow
                />
              </div>
            </div>
          </el-card>

          <!-- 多维数据汇总 -->
          <el-row :gutter="16" class="archive-overview__dimensions">
            <el-col :span="8">
              <el-card class="archive-overview__section">
                <template #header>
                  <span class="section-title">按类别统计</span>
                </template>
                <div class="dimension-list">
                  <div v-for="cat in categoryData" :key="cat.label" class="dimension-item">
                    <div
                      class="dimension-item__icon"
                      :style="{ background: `${cat.color}15`, color: cat.color }"
                    >
                      <component :is="cat.icon" :size="18" />
                    </div>
                    <div class="dimension-item__info">
                      <span class="dimension-item__label">{{ cat.label }}</span>
                      <span class="dimension-item__value">{{ cat.value }}</span>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="16">
              <el-card class="archive-overview__section">
                <template #header>
                  <div class="archive-overview__section-header">
                    <span class="section-title">学生列表</span>
                    <el-button size="small" :icon="Eye" @click="() => {}">查看全部</el-button>
                  </div>
                </template>
                <el-table :data="studentList" stripe style="width: 100%">
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="studentId" label="学号" width="130" />
                  <el-table-column prop="className" label="班级" min-width="140" />
                  <el-table-column label="GPA" width="100">
                    <template #default="{ row }">
                      <span :class="getGpaClass(row.gpa)">{{ row.gpa }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="awards" label="奖项" width="80" align="center" />
                  <el-table-column prop="practices" label="实践" width="80" align="center" />
                  <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="primary" size="small" @click="viewStudentDetail(row)">
                        <Eye :size="14" /> 查看详情
                      </el-button>
                      <el-button
                        link
                        type="warning"
                        size="small"
                        @click="
                          () => {
                            selectedStudent = {
                              name: (row as any).name,
                              id: (row as any).studentId,
                            }
                            suggestionDialogVisible = true
                          }
                        "
                      >
                        改进建议
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 学生详情 -->
      <el-tab-pane label="学生详情" name="detail" :disabled="!selectedStudent">
        <template #label>
          <span><User :size="14" /> 学生详情</span>
        </template>
        <div v-if="selectedStudent" class="archive-detail">
          <el-card class="archive-detail__profile">
            <div class="archive-detail__profile-header">
              <el-avatar :size="56" :icon="User" />
              <div class="archive-detail__profile-info">
                <h3>{{ selectedStudent.name }}</h3>
                <p>{{ selectedStudent.id }}</p>
              </div>
              <el-button type="primary" size="small" :icon="Eye">查看完整档案</el-button>
            </div>
            <el-divider />
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="profile-stat">
                  <span class="profile-stat__label">当前GPA</span>
                  <span class="profile-stat__value is-excellent">3.82</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="profile-stat">
                  <span class="profile-stat__label">获奖总数</span>
                  <span class="profile-stat__value">5</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="profile-stat">
                  <span class="profile-stat__label">实践次数</span>
                  <span class="profile-stat__value">3</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="profile-stat">
                  <span class="profile-stat__label">档案等级</span>
                  <el-tag type="success" size="small">优秀</el-tag>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 改进建议弹窗 -->
    <el-dialog
      v-model="suggestionDialogVisible"
      title="填写改进建议"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="学生">
          <el-input :model-value="selectedStudent?.name" disabled />
        </el-form-item>
        <el-form-item label="改进建议">
          <el-input
            v-model="suggestion"
            type="textarea"
            :rows="5"
            placeholder="请填写对该生档案的改进建议…"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="suggestionDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!suggestion.trim()" @click="submitSuggestion">
          提交建议
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.archive-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $spacing-lg;
    }
  }
}

.archive-overview {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__section {
    margin-bottom: 0;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__dimensions {
    flex: 1;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.level-bars {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  .level-bar {
    &__header {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-sm;
    }

    &__label {
      font-weight: 600;
      font-size: 14px;
      min-width: 96px;
    }

    &__range {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex: 1;
    }

    &__count {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__percent {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      min-width: 40px;
      text-align: right;
    }
  }
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .dimension-item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-base;
    background: var(--el-fill-color-light);

    &__icon {
      width: 36px;
      height: 36px;
      border-radius: $radius-base;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &__label {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    &__value {
      font-size: 16px;
      font-weight: 700;
      color: var(--el-color-primary);
    }
  }
}

.archive-detail {
  &__profile {
    &-header {
      display: flex;
      align-items: center;
      gap: $spacing-lg;
    }

    &-info {
      flex: 1;
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 2px;
      }
      p {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.profile-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);

    &.is-excellent {
      color: var(--el-color-success);
    }
    &.is-good {
      color: var(--el-color-primary);
    }
    &.is-average {
      color: var(--el-color-warning);
    }
    &.is-low {
      color: var(--el-color-danger);
    }
  }
}

.is-excellent {
  color: var(--el-color-success);
  font-weight: 600;
}
.is-good {
  color: var(--el-color-primary);
  font-weight: 600;
}
.is-average {
  color: var(--el-color-warning);
}
.is-low {
  color: var(--el-color-danger);
}
</style>
