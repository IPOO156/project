<script setup>
const props = defineProps({
  padding: { type: String, default: 'md' },
  hoverable: { type: Boolean, default: false },
})
</script>

<template>
  <section class="uiCard" :data-padding="props.padding" :data-hoverable="props.hoverable ? '1' : '0'">
    <slot />
  </section>
</template>

<style scoped>
.uiCard {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
}

.uiCard[data-padding='sm'] {
  padding: 12px;
}

.uiCard[data-padding='md'] {
  padding: 18px;
}

.uiCard[data-padding='lg'] {
  padding: 24px;
}

.uiCard[data-hoverable='1'] {
  cursor: pointer;
}

.uiCard[data-hoverable='1']:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
</style>
