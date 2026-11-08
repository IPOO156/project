<script setup lang="ts">
import type { AchievementCategory, AchievementCounts } from '@/shared/api/achievements'
import { computed } from 'vue'
import { CATEGORY_OPTIONS } from '../composables/useAchievementWall'

const props = defineProps<{
  modelValue: AchievementCategory
  counts: AchievementCounts | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: AchievementCategory): void
}>()

const options = computed(() => {
  const list = CATEGORY_OPTIONS.slice()
  if ((props.counts?.other ?? 0) > 0) {
    list.push({ value: 'other', label: '其他' })
  }
  return list
})

function countOf(value: AchievementCategory): number | null {
  return props.counts ? props.counts[value] : null
}
</script>

<template>
  <div class="chips" role="group" aria-label="按成果类型筛选">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :class="{ 'chip--active': modelValue === option.value }"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span v-if="countOf(option.value) !== null" class="chip__n">{{ countOf(option.value) }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  color: var(--mc-text-secondary);
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color $duration-fast $ease-standard,
    border-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover {
    color: var(--mc-wood);
    border-color: var(--mc-wood-light);
  }

  &--active {
    color: var(--mc-wood);
    border-color: var(--mc-wood-light);
    background: var(--mc-primary-faint);
  }
}

.chip__n {
  margin-left: 4px;
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  opacity: 0.7;
}
</style>
