<script setup lang="ts">
interface Option {
  readonly value: string
  readonly label: string
}

interface Props {
  value: string
  options: readonly Option[]
}

const props = defineProps<Props>()
</script>

<template>
  <span>{{ props.options.find(t => t.value === props.value)?.label || props.value }}</span>
</template>
