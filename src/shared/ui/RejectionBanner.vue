<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps<{ reason?: string }>()
const visible = ref(true)
</script>

<template>
  <div v-if="reason && visible" class="rejection-banner">
    <div class="rejection-banner__inner">
      <div class="rejection-banner__icon"><AlertTriangle :size="18" /></div>
      <div class="rejection-banner__content">
        <div class="rejection-banner__title">教师驳回原因：</div>
        <div class="rejection-banner__reason">{{ reason }}</div>
      </div>
      <el-button
        text
        size="small"
        :icon="X"
        class="rejection-banner__close"
        @click="visible = false"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.rejection-banner {
  background: linear-gradient(135deg, #fef3e2, #fff8f0);
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.rejection-banner__inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.rejection-banner__icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 1px;
}
.rejection-banner__content {
  flex: 1;
}
.rejection-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 4px;
}
.rejection-banner__reason {
  font-size: 13px;
  color: #a16207;
  line-height: 1.5;
  white-space: pre-wrap;
}
.rejection-banner__close {
  flex-shrink: 0;
  color: #a16207;
}
</style>
