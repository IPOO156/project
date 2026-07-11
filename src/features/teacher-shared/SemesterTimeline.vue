<script setup lang="ts">
/**
 * SemesterTimeline - 学期时间线组件
 * 用于成果热力图，展示学生大一上至大四下的完整时间轴
 * 每个节点可展开查看详情（奖项、实践、成绩）
 */
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'

export interface SemesterData {
  semester: string
  /** 展示用标签，为空时由组件根据 semester 自动生成 */
  label?: string
  awards?: { name: string; date: string; level: string }[]
  practices?: { name: string; date: string; organization: string }[]
  grades?: { course: string; score: number; gpa: number }[]
}

interface Props {
  semesters?: SemesterData[]
  studentName?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  semesters: () => [],
  studentName: '',
  compact: false,
})

const SEMESTER_LABELS: Record<string, string> = {
  '大一(上)': '大一 · 第一学期',
  '大一(下)': '大一 · 第二学期',
  '大二(上)': '大二 · 第一学期',
  '大二(下)': '大二 · 第二学期',
  '大三(上)': '大三 · 第一学期',
  '大三(下)': '大三 · 第二学期',
  '大四(上)': '大四 · 第一学期',
  '大四(下)': '大四 · 第二学期',
}

const expandedMap = ref<Record<string, boolean>>({})

const groupedSemesters = computed(() => {
  const defaultLabels = Object.keys(SEMESTER_LABELS)
  if (props.semesters.length > 0) {
    const sem = props.semesters.map((s) => ({
      ...s,
      label: SEMESTER_LABELS[s.semester] || s.semester,
    }))
    return sem
  }
  return defaultLabels.map((key) => ({
    semester: key,
    label: SEMESTER_LABELS[key],
    awards: [],
    practices: [],
    grades: [],
  }))
})

function hasContent(sem: SemesterData) {
  return (
    (sem.awards && sem.awards.length > 0) ||
    (sem.practices && sem.practices.length > 0) ||
    (sem.grades && sem.grades.length > 0)
  )
}

function toggleExpand(semester: string) {
  expandedMap.value[semester] = !expandedMap.value[semester]
}

function getIntensity(sem: SemesterData): 'none' | 'low' | 'medium' | 'high' {
  const count = (sem.awards?.length ?? 0) + (sem.practices?.length ?? 0) + (sem.grades?.length ?? 0)
  if (count === 0) return 'none'
  if (count <= 2) return 'low'
  if (count <= 5) return 'medium'
  return 'high'
}
</script>

<template>
  <div class="semester-timeline" :class="{ 'semester-timeline--compact': compact }">
    <div v-if="studentName" class="semester-timeline__student">
      <span class="semester-timeline__student-label">学生：</span>
      <span class="semester-timeline__student-name">{{ studentName }}</span>
    </div>

    <div class="semester-timeline__track">
      <div
        v-for="(sem, index) in groupedSemesters"
        :key="sem.semester"
        class="semester-timeline__node"
        :class="[`semester-timeline__node--${getIntensity(sem)}`]"
        @click="toggleExpand(sem.semester)"
      >
        <div class="semester-timeline__node-header">
          <div class="semester-timeline__node-indicator">
            <div class="semester-timeline__node-dot" />
            <div v-if="index < groupedSemesters.length - 1" class="semester-timeline__node-line" />
          </div>
          <div class="semester-timeline__node-label">
            <span class="semester-timeline__node-title">{{ sem.label }}</span>
            <span class="semester-timeline__node-badge" :class="`is-${getIntensity(sem)}`">
              {{
                (sem.awards?.length ?? 0) + (sem.practices?.length ?? 0) + (sem.grades?.length ?? 0)
              }}
              项
            </span>
            <component
              :is="expandedMap[sem.semester] ? ChevronDown : ChevronRight"
              v-if="hasContent(sem)"
              :size="14"
              class="semester-timeline__node-arrow"
            />
          </div>
        </div>

        <Transition name="timeline-expand">
          <div
            v-if="expandedMap[sem.semester] && hasContent(sem)"
            class="semester-timeline__node-detail"
          >
            <div v-if="sem.grades && sem.grades.length > 0" class="timeline-detail-section">
              <span class="timeline-detail-section__title">学业成绩</span>
              <div class="timeline-detail-section__items">
                <div v-for="g in sem.grades" :key="g.course" class="timeline-grade-item">
                  <span class="timeline-grade-item__name">{{ g.course }}</span>
                  <span class="timeline-grade-item__score">{{ g.score }}分</span>
                  <span class="timeline-grade-item__gpa">GPA {{ g.gpa }}</span>
                </div>
              </div>
            </div>

            <div v-if="sem.awards && sem.awards.length > 0" class="timeline-detail-section">
              <span class="timeline-detail-section__title">个人奖项</span>
              <div class="timeline-detail-section__items">
                <div v-for="a in sem.awards" :key="a.name" class="timeline-award-item">
                  <span class="timeline-award-item__name">{{ a.name }}</span>
                  <span class="timeline-award-item__level">{{ a.level }}</span>
                  <span class="timeline-award-item__date">{{ a.date }}</span>
                </div>
              </div>
            </div>

            <div v-if="sem.practices && sem.practices.length > 0" class="timeline-detail-section">
              <span class="timeline-detail-section__title">社会实践</span>
              <div class="timeline-detail-section__items">
                <div v-for="p in sem.practices" :key="p.name" class="timeline-practice-item">
                  <span class="timeline-practice-item__name">{{ p.name }}</span>
                  <span class="timeline-practice-item__org">{{ p.organization }}</span>
                  <span class="timeline-practice-item__date">{{ p.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.semester-timeline {
  &__student {
    margin-bottom: $spacing-lg;
    padding: $spacing-md $spacing-lg;
    background: var(--el-fill-color-light);
    border-radius: $radius-base;

    &-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    &-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  &__track {
    position: relative;
  }

  &__node {
    cursor: pointer;
    user-select: none;

    &-header {
      display: flex;
      gap: $spacing-md;
      padding: $spacing-sm 0;
      transition: background-color 0.2s;
      border-radius: $radius-base;

      &:hover {
        background: var(--el-fill-color-light);
      }
    }

    &-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 20px;
      flex-shrink: 0;
    }

    &-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--el-border-color);
      border: 2px solid var(--el-bg-color);
      box-shadow: 0 0 0 2px var(--el-border-color);
      flex-shrink: 0;
      transition: all 0.3s;
    }

    &--high .semester-timeline__node-dot {
      background: var(--el-color-success);
      box-shadow: 0 0 0 2px var(--el-color-success-light-7);
    }

    &--medium .semester-timeline__node-dot {
      background: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
    }

    &--low .semester-timeline__node-dot {
      background: var(--el-color-warning);
      box-shadow: 0 0 0 2px var(--el-color-warning-light-7);
    }

    &--none .semester-timeline__node-dot {
      background: var(--el-border-color-light);
      box-shadow: 0 0 0 2px var(--el-border-color-lighter);
    }

    &-line {
      width: 2px;
      flex: 1;
      background: var(--el-border-color-light);
      min-height: 20px;
    }

    &-label {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      flex: 1;
      padding: $spacing-xs 0;
    }

    &-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      min-width: 140px;
    }

    &-badge {
      font-size: 12px;
      padding: 1px 8px;
      border-radius: 10px;
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);

      &.is-high {
        background: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      &.is-medium {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &.is-low {
        background: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }

      &.is-none {
        background: var(--el-fill-color-light);
        color: var(--el-text-color-placeholder);
      }
    }

    &-arrow {
      color: var(--el-text-color-secondary);
      transition: transform 0.2s;
    }

    &-detail {
      margin-left: 32px;
      padding: $spacing-md 0 $spacing-md $spacing-lg;
      border-left: 2px solid var(--el-border-color-light);
    }
  }
}

.timeline-detail-section {
  margin-bottom: $spacing-md;

  &__title {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: $spacing-sm;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.timeline-grade-item,
.timeline-award-item,
.timeline-practice-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 6px 10px;
  background: var(--el-fill-color-light);
  border-radius: $radius-base;
  font-size: 13px;

  &__name {
    color: var(--el-text-color-primary);
    font-weight: 500;
    flex: 1;
  }

  &__score,
  &__gpa,
  &__level,
  &__org,
  &__date {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__gpa {
    color: var(--el-color-primary);
  }

  &__level {
    color: var(--el-color-warning);
  }
}

.timeline-expand-enter-active,
.timeline-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.timeline-expand-enter-from,
.timeline-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.timeline-expand-enter-to,
.timeline-expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

// compact 模式
.semester-timeline--compact {
  .semester-timeline__node-title {
    font-size: 13px;
    min-width: 100px;
  }

  .semester-timeline__node-detail {
    margin-left: 24px;
  }
}
</style>
