<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { computed } from 'vue'
import { useDict } from '@/shared/composables'
import { APPLICATION_STATUS } from '@/shared/constants/dict'

interface Props {
  status: string
  size?: TagProps['size']
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
})

const { getColor, getLabel } = useDict(APPLICATION_STATUS)

const tagType = computed<TagProps['type']>(() => {
  return (getColor(props.status) as TagProps['type']) ?? 'info'
})
</script>

<template>
  <el-tag :type="tagType" :size="size">
    {{ getLabel(status) }}
  </el-tag>
</template>
