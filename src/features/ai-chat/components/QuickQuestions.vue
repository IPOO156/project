<script setup lang="ts">
import type { Component } from 'vue'
import type { QuickQuestion } from '../types'
/**
 * QuickQuestions - 快捷问题胶囊区
 *
 * icon 标识映射到 lucide 图标（数据层保持纯净不引组件）
 * visible 由父组件控制（设置开关 + 首次提问后隐藏）
 */
import { Award, CheckCircle2, Clock, Download, FileText, Shield } from 'lucide-vue-next'

const props = defineProps<{
  questions: QuickQuestion[]
  visible: boolean
}>()

const emit = defineEmits<{
  ask: [question: string]
}>()

const iconMap: Record<string, Component> = {
  file: FileText,
  award: Award,
  timeline: Clock,
  check: CheckCircle2,
  lock: Shield,
  download: Download,
}

function getIcon(icon: string): Component {
  return iconMap[icon] || FileText
}
</script>

<template>
  <Transition name="qq">
    <div v-if="props.visible && props.questions.length" class="qq">
      <div class="qq__label">
        <span class="qq__dot" />
        常见问题
      </div>
      <div class="qq__list">
        <button
          v-for="(q, i) in props.questions"
          :key="i"
          class="qq__chip"
          @click="emit('ask', q.question)"
        >
          <component :is="getIcon(q.icon)" :size="14" />
          <span>{{ q.label }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.qq {
  flex-shrink: 0;
  padding: $spacing-sm $spacing-xl;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);

  &__label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    margin-bottom: $spacing-sm;
    font-weight: 500;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mc-accent);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-md;
    border: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    border-radius: $radius-2xl;
    font-size: $font-size-sm;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all $duration-fast $ease-standard;

    &:hover {
      border-color: var(--mc-accent);
      color: var(--mc-primary);
      background: color-mix(in srgb, var(--mc-accent) 8%, transparent);
      transform: translateY(-1px);
    }
  }
}

/* 入场/退场 */
.qq-enter-active,
.qq-leave-active {
  transition: all $duration-base $ease-standard;
}

.qq-enter-from,
.qq-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
