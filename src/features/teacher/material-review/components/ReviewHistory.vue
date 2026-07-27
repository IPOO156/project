<script setup lang="ts">
import { Clock } from 'lucide-vue-next'

defineProps<{ history?: any[] }>()
</script>

<template>
  <div v-if="history.length > 0" class="review-history">
    <div class="review-history__title">
      <Clock :size="14" /><span>审核记录（{{ history.length }}）</span>
    </div>
    <div class="review-history__list">
      <div v-for="(item, idx) in history" :key="idx" class="review-history__item">
        <div class="review-history__dot" :class="`is-${item.action}`" />
        <div class="review-history__body">
          <div class="review-history__header">
            <span class="review-history__reviewer">{{ item.reviewer }}</span
            ><el-tag :type="item.action === 'approved' ? 'success' : 'danger'" size="small">{{
              item.action === 'approved' ? '通过' : '驳回'
            }}</el-tag>
          </div>
          <div class="review-history__comment">{{ item.comment }}</div>
          <div class="review-history__time">{{ item.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review-history {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}
.review-history__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.review-history__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.review-history__item {
  display: flex;
  gap: 8px;
}
.review-history__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  &.is-approved {
    background: var(--el-color-success);
  }
  &.is-rejected {
    background: var(--el-color-danger);
  }
}
.review-history__body {
  flex: 1;
}
.review-history__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.review-history__reviewer {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.review-history__comment {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-bottom: 2px;
}
.review-history__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
