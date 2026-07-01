<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
})
</script>

<template>
  <button class="uiBtn" type="button" :data-variant="props.variant" :data-size="props.size">
    <slot />
  </button>
</template>

<style scoped>
.uiBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  background: var(--bg);
  color: var(--text);
  font-weight: 600;
  font-size: 14px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
  min-height: 36px;
}

.uiBtn[data-size='sm'] {
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
}

.uiBtn[data-size='md'] {
  padding: 10px 16px;
}

.uiBtn[data-size='lg'] {
  padding: 12px 20px;
  font-size: 15px;
}

.uiBtn[data-variant='primary'] {
  background: var(--accent);
  color: white;
  border: 1px solid var(--accent);
}

.uiBtn[data-variant='primary']:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.uiBtn[data-variant='primary']:active {
  transform: translateY(1px);
}

.uiBtn[data-variant='secondary'] {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
}

.uiBtn[data-variant='secondary']:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.uiBtn[data-variant='ghost'] {
  background: transparent;
  color: var(--text);
}

.uiBtn[data-variant='ghost']:hover {
  background: var(--bg);
}

.uiBtn[data-variant='danger'] {
  background: var(--danger);
  color: white;
  border: 1px solid var(--danger);
}

.uiBtn[data-variant='danger']:hover {
  background: #dc2626;
  border-color: #dc2626;
}
</style>
