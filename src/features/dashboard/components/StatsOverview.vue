<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  cards: Array<{
    label: string
    value: string | number
    icon: Component
    color: string
    path?: string
  }>
}>()

const emit = defineEmits<{
  (e: 'cardClick', path: string): void
}>()

function handleCardClick(path?: string) {
  if (path) emit('cardClick', path)
}
</script>

<template>
  <el-row :gutter="16" class="stats-overview">
    <el-col v-for="card in cards" :key="card.label" :xs="12" :sm="6" :md="6" :span="6">
      <el-card
        shadow="hover"
        class="stat-card"
        :class="{ 'stat-card--clickable': card.path }"
        @click="handleCardClick(card.path)"
      >
        <div class="stat-card__body">
          <div class="stat-card__info">
            <p class="stat-card__label">{{ card.label }}</p>
            <p class="stat-card__value">{{ card.value }}</p>
          </div>
          <div
            class="stat-card__icon"
            :style="{ background: `${card.color}15`, color: card.color }"
          >
            <component :is="card.icon" :size="24" />
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
.stats-overview {
  flex-shrink: 0;
  margin-bottom: 0;
}

.stat-card {
  // 可点击卡片：悬停抬升 + 按压内缩。
  // 悬停只在精确指针设备生效，避免触屏点按后 :hover 粘住。
  &--clickable {
    cursor: pointer;
    transition: transform $duration-fast $ease-standard;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateY(-2px);
      }
    }

    &:active {
      transform: scale(0.97);
      transition-duration: $duration-instant;
    }
  }

  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__info {
    // flex 子项默认 min-width:auto，长标签会把图标挤出卡片
    min-width: 0;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>
