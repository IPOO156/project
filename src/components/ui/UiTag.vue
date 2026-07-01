<script setup>
const props = defineProps({
  tone: { type: String, default: 'neutral' },
  size: { type: String, default: 'md' },
})
</script>

<template>
  <span class="uiTag" :data-tone="props.tone" :data-size="props.size">
    <slot />
  </span>
</template>

<style scoped>
.uiTag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  border-radius: 20px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.uiTag[data-size='sm'] {
  font-size: 11px;
  padding: 2px 8px;
}

.uiTag[data-size='md'] {
  font-size: 12px;
  padding: 4px 10px;
}

.uiTag[data-size='lg'] {
  font-size: 13px;
  padding: 5px 12px;
}

/* 默认灰色 */
.uiTag[data-tone='neutral'] {
  background: var(--bg);
  color: var(--muted);
  border-color: var(--border);
}

/* 成功 - 绿色 */
.uiTag[data-tone='ok'],
.uiTag[data-tone='success'] {
  background: var(--success-light);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.2);
}

/* 警告 - 橙色 */
.uiTag[data-tone='wait'],
.uiTag[data-tone='warning'] {
  background: var(--warning-light);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.2);
}

/* 错误 - 红色 */
.uiTag[data-tone='no'],
.uiTag[data-tone='danger'] {
  background: var(--danger-light);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.2);
}

/* 信息 - 蓝色 */
.uiTag[data-tone='info'] {
  background: var(--accent-light);
  color: var(--accent-dark);
  border-color: rgba(59, 130, 246, 0.2);
}

/* 主色调 */
.uiTag[data-tone='primary'] {
  background: var(--accent-light);
  color: var(--accent);
  border-color: rgba(59, 130, 246, 0.2);
}
</style>
