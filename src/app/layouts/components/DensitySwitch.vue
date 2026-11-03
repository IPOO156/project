<script setup lang="ts">
import { useAppStore } from '@/app/stores/useAppStore'

/**
 * 列表密度开关：只有两档（舒适 / 紧凑），同一页面内切换，不做两套页面。
 * 紧凑档仅收紧表格行的上下内边距（12 → 8），行内文字仍走 1.5 档。
 * 位置在 app 层：shared/ui 不得反向依赖 app/store（分层红线）。
 */
const appStore = useAppStore()
</script>

<template>
  <el-radio-group
    :model-value="appStore.tableDensity"
    size="small"
    class="density-switch"
    @update:model-value="appStore.setTableDensity"
  >
    <el-radio-button value="comfortable">舒适</el-radio-button>
    <el-radio-button value="compact">紧凑</el-radio-button>
  </el-radio-group>
</template>
