<script setup lang="ts">
import {
  Award,
  BookOpen,
  Briefcase,
  Code,
  Star,
  Users,
} from 'lucide-vue-next'
import { ref } from 'vue'

interface TimelineEvent {
  semester: string
  date: string
  title: string
  description: string
  type: 'award' | 'practice' | 'grade' | 'competition' | 'internship' | 'other'
}

const timelineData = ref<TimelineEvent[]>([
  // 大一上
  { semester: '大一 (上)', date: '2024-09', title: '入学', description: '进入计算机科学与技术专业学习', type: 'other' },
  { semester: '大一 (上)', date: '2025-01', title: '第一学期期末', description: 'GPA: 3.2，班级排名前30%', type: 'grade' },
  // 大一下
  { semester: '大一 (下)', date: '2025-03', title: '加入ACM社团', description: '开始参加编程竞赛训练', type: 'competition' },
  { semester: '大一 (下)', date: '2025-06', title: '通过CET-4', description: '英语四级考试: 532分', type: 'award' },
  // 大二上
  { semester: '大二 (上)', date: '2025-09', title: '校ACM竞赛一等奖', description: '团队赛获得校级一等奖', type: 'award' },
  { semester: '大二 (上)', date: '2025-11', title: '成为社团部长', description: '担任ACM社团技术部部长', type: 'practice' },
  // 大二下
  { semester: '大二 (下)', date: '2026-03', title: '暑期社会实践', description: '参与"科技下乡"社会实践活动', type: 'practice' },
  { semester: '大二 (下)', date: '2026-05', title: '数学建模省二等奖', description: '全国大学生数学建模竞赛省二等奖', type: 'award' },
  // 大三上
  { semester: '大三 (上)', date: '2026-09', title: 'GPA创新高', description: 'GPA: 3.82，班级排名前10%', type: 'grade' },
])

// 按学期分组
const semesterGroups = ['大一 (上)', '大一 (下)', '大二 (上)', '大二 (下)', '大三 (上)', '大三 (下)', '大四 (上)', '大四 (下)']

function getTypeIcon(type: string) {
  switch (type) {
    case 'award': return Award
    case 'practice': return Users
    case 'grade': return BookOpen
    case 'competition': return Code
    case 'internship': return Briefcase
    default: return Star
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'award': return '#e6a23c'
    case 'practice': return '#67c23a'
    case 'grade': return '#409eff'
    case 'competition': return '#9b59b6'
    case 'internship': return '#f56c6c'
    default: return '#909399'
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'award': return '奖项'
    case 'practice': return '实践'
    case 'grade': return '成绩'
    case 'competition': return '竞赛'
    case 'internship': return '实习'
    default: return '其他'
  }
}

function getEventsForSemester(semester: string) {
  return timelineData.value.filter(e => e.semester === semester)
}
</script>

<template>
  <div class="timeline">
    <el-card>
      <template #header>
        <span class="card-title">成长时间轴</span>
      </template>

      <div class="timeline__content">
        <template v-for="semester in semesterGroups" :key="semester">
          <div
            v-if="getEventsForSemester(semester).length > 0"
            class="timeline__semester"
          >
            <div class="timeline__semester-header">
              <div class="timeline__semester-dot" />
              <span class="timeline__semester-label">{{ semester }}</span>
            </div>

            <div class="timeline__events">
              <div
                v-for="event in getEventsForSemester(semester)"
                :key="event.title + event.date"
                class="timeline__event"
              >
                <div
                  class="timeline__event-icon"
                  :style="{ background: `${getTypeColor(event.type)}20`, color: getTypeColor(event.type) }"
                >
                  <component :is="getTypeIcon(event.type)" :size="18" />
                </div>
                <div class="timeline__event-body">
                  <div class="timeline__event-header">
                    <span class="timeline__event-title">{{ event.title }}</span>
                    <el-tag :color="getTypeColor(event.type)" size="small" effect="plain">
                      {{ getTypeLabel(event.type) }}
                    </el-tag>
                  </div>
                  <p class="timeline__event-desc">{{ event.description }}</p>
                  <span class="timeline__event-date">{{ event.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty v-if="timelineData.length === 0" description="暂无成长记录" />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.card-title {
  font-size: 16px;
  font-weight: 600;
}

.timeline__content {
  padding: 8px 0;
}

.timeline__semester {
  position: relative;
  padding-left: 20px;
  margin-bottom: 32px;

  &-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  &-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--el-color-primary);
    border: 3px solid var(--el-color-primary-light-5);
    margin-left: -27px;
    flex-shrink: 0;
  }

  &-label {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.timeline__events {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline__event {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &-body {
    flex: 1;
    min-width: 0;
  }

  &-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  &-date {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
