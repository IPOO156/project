<script setup lang="ts">
import type { WeaknessAnalysis } from '@/shared/types/types'
import { AlertTriangle, BookOpen, Target, Trophy, Users } from 'lucide-vue-next'
import { computed } from 'vue'

interface TeacherSuggestion {
  type: string
  content: string
}

const props = defineProps<{
  weaknesses: WeaknessAnalysis[]
  suggestions: TeacherSuggestion[]
}>()

const typeIconMap: Record<string, typeof Trophy> = {
  学业: BookOpen,
  竞赛: Trophy,
  实践: Users,
  综合素质: Target,
}

const weaknessList = computed(() => {
  return props.weaknesses
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
})

function getTypeIcon(type: string) {
  return typeIconMap[type] ?? Target
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    学业: '#2d5a87',
    竞赛: '#d4a574',
    实践: '#10b981',
    综合素质: '#8b5cf6',
  }
  return map[type] ?? '#64748b'
}
</script>

<template>
  <div class="profile-insights">
    <div class="insight-column">
      <div class="insight-column__header">
        <AlertTriangle :size="16" />
        <span>AI 短板识别</span>
      </div>
      <div class="weakness-list">
        <div v-for="item in weaknessList" :key="item.id" class="weakness-item">
          <div class="weakness-item__header">
            <span class="weakness-item__dimension">{{ item.dimension }}</span>
            <span class="weakness-item__score">{{ item.score }}分</span>
          </div>
          <el-progress
            :percentage="item.score"
            color="var(--el-color-danger)"
            :stroke-width="10"
            :format="() => ''"
          />
          <p class="weakness-item__weakness">{{ item.weakness }}</p>
          <p class="weakness-item__suggestion">{{ item.suggestion }}</p>
        </div>
      </div>
    </div>

    <div class="insight-column">
      <div class="insight-column__header">
        <Target :size="16" />
        <span>素质教师建议</span>
      </div>
      <el-timeline class="suggestion-timeline">
        <el-timeline-item
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :type="index === 0 ? 'primary' : 'info'"
          :hollow="index !== 0"
        >
          <div class="suggestion-item">
            <div
              class="suggestion-item__type"
              :style="{
                background: `${getTypeColor(suggestion.type)}15`,
                color: getTypeColor(suggestion.type),
              }"
            >
              <component :is="getTypeIcon(suggestion.type)" :size="12" />
              <span>{{ suggestion.type }}</span>
            </div>
            <p class="suggestion-item__content">{{ suggestion.content }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-insights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 100%;
}

.insight-column {
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 14px;
  }
}

.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weakness-item {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
  }

  &__dimension {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__score {
    color: #ef4444;
    font-weight: 600;
  }

  &__weakness {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
  }

  &__suggestion {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

.suggestion-timeline {
  --el-timeline-node-size: 10px;

  padding-top: 4px;
}

.suggestion-item {
  &__type {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  &__content {
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.6;
  }
}

@media (max-width: 1200px) {
  .profile-insights {
    grid-template-columns: 1fr;
  }
}
</style>
