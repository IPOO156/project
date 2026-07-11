<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  cards: Array<{
    label: string
    value: string | number
    icon: Component
    color: string
  }>
}>()
</script>

<template>
  <el-row :gutter="16" class="stats-overview">
    <el-col v-for="card in cards" :key="card.label" :xs="12" :sm="6" :md="6" :span="6">
      <el-card shadow="hover" class="stat-card">
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
  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: var(--el-text-color-primary);
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
