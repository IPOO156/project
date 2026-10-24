<script setup lang="ts">
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-vue-next'

defineProps<{
  canPrev: boolean
  canNext: boolean
  hasDetail: boolean
  opLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'reject'): void
  (e: 'approve'): void
}>()
</script>

<template>
  <div class="audit-detail__footer">
    <div class="audit-detail__nav">
      <el-button size="small" :disabled="!canPrev" :icon="ChevronLeft" @click="emit('prev')">
        上一条
      </el-button>
      <el-button size="small" :disabled="!canNext" @click="emit('next')">
        下一条<el-icon class="el-icon--right"><ChevronRight :size="14" /></el-icon>
      </el-button>
    </div>
    <div class="audit-detail__actions">
      <el-button
        v-if="hasDetail"
        type="danger"
        :icon="XCircle"
        :loading="opLoading"
        @click="emit('reject')"
      >
        退回
      </el-button>
      <el-button
        v-if="hasDetail"
        type="primary"
        :icon="CheckCircle2"
        :loading="opLoading"
        @click="emit('approve')"
      >
        通过
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.audit-detail {
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__nav,
  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
}
</style>
