<script setup lang="ts">
import type { Component } from 'vue'
import { Award, BookOpen, Briefcase, Code, Star, Users } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useArchiveStore } from '@/app/stores/stores'
import { useDict } from '@/shared/composables/composables'
import { SEMESTER_OPTIONS, TIMELINE_EVENT_TYPES } from '@/shared/constants/dict'

const archiveStore = useArchiveStore()
const timelineData = computed(() => archiveStore.timelineEvents)
const semesterGroups = computed(() => SEMESTER_OPTIONS.map((s) => s.label))
const { getColor, getLabel } = useDict(TIMELINE_EVENT_TYPES)

const iconMap: Record<string, Component> = { Award, BookOpen, Briefcase, Code, Star, Users }

function getTypeIcon(type: string): Component {
  const iconKey = TIMELINE_EVENT_TYPES[type as keyof typeof TIMELINE_EVENT_TYPES]?.iconKey ?? 'Star'
  return iconMap[iconKey] ?? Star
}

function getTypeColor(type: string): string {
  return getColor(type) ?? '#909399'
}
function getTypeLabel(type: string): string {
  return getLabel(type)
}
function getEventsForSemester(semester: string) {
  return timelineData.value.filter((e) => e.semester === semester)
}

onMounted(() => {
  if (timelineData.value.length === 0) archiveStore.fetchArchive()
})
</script>

<template>
  <div class="timeline">
    <el-card>
      <template #header><span class="card-title">成长时间轴</span></template>
      <div class="timeline__content">
        <template v-for="semester in semesterGroups" :key="semester">
          <div v-if="getEventsForSemester(semester).length > 0" class="timeline__semester">
            <div class="timeline__semester-header">
              <div class="timeline__semester-dot" />
              <span class="timeline__semester-label">{{ semester }}</span>
            </div>
            <div class="timeline__events">
              <div
                v-for="event in getEventsForSemester(semester)"
                :key="event.id"
                class="timeline__event"
              >
                <!-- 图标背景/颜色由事件类型对应的动态字典色值决定，故使用内联样式 -->
                <div
                  class="timeline__event-icon"
                  :style="{
                    background: `${getTypeColor(event.type)}20`,
                    color: getTypeColor(event.type),
                  }"
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
        <el-empty v-if="timelineData.length === 0" description="暂无成长记录" />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.timeline {
  user-select: none;
}

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
  transition:
    transform 0.2s,
    box-shadow 0.2s;
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
