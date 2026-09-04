<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

interface DuplicateItem {
  type: string
  typeLabel: string
  title: string
  timeRange: string
}
interface Props {
  visible: boolean
  duplicates: DuplicateItem[]
}
defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="重复申报提示"
    width="520px"
    :close-on-click-modal="false"
    @close="emit('update:visible', false)"
  >
    <el-alert type="warning" :closable="false" show-icon>
      <template #title>检测到与已有记录存在重复</template>
      <template #default><p>以下条目与本次申报的内容相似，请确认是否仍要提交：</p></template>
    </el-alert>
    <div v-if="duplicates.length > 0" class="dup-list">
      <div v-for="(item, idx) in duplicates" :key="idx" class="dup-list__item">
        <div class="dup-list__icon"><AlertTriangle :size="16" /></div>
        <div class="dup-list__info">
          <div class="dup-list__title">{{ item.title }}</div>
          <div class="dup-list__meta">
            <el-tag size="small">{{ item.typeLabel }}</el-tag
            ><span class="dup-list__time">{{ item.timeRange }}</span>
          </div>
        </div>
      </div>
    </div>
    <p class="dup-confirm-text">确认提交后，审核教师将根据实际情况进行审核。</p>
    <template #footer
      ><el-button @click="emit('cancel')">取消提交</el-button
      ><el-button type="primary" @click="emit('confirm')">确认提交</el-button></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.dup-alert {
  margin-bottom: 16px;
  p {
    margin: 4px 0;
    font-size: 13px;
  }
}
.dup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.dup-list__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 6px;
  background: #fffbeb;
}
.dup-list__icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}
.dup-list__info {
  flex: 1;
}
.dup-list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.dup-list__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dup-confirm-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
  padding: 8px 0;
}
</style>
