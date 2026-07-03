<script setup lang="ts" generic="T extends { status: string }">
import { Delete, Edit, Eye } from 'lucide-vue-next'

interface Props {
  row: T
}

defineProps<Props>()

defineEmits<{
  (e: 'view', row: T): void
  (e: 'edit', row: T): void
  (e: 'remove', row: T): void
}>()
</script>

<template>
  <el-button text type="primary" :icon="Eye" size="small" @click="$emit('view', row)">
    查看
  </el-button>
  <template v-if="row.status !== 'approved'">
    <el-button text type="primary" :icon="Edit" size="small" @click="$emit('edit', row)">
      编辑
    </el-button>
    <el-button text type="danger" :icon="Delete" size="small" @click="$emit('remove', row)">
      删除
    </el-button>
  </template>
</template>
