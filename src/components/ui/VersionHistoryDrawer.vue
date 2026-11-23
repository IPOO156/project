<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_MAP } from '@/shared/api/submission'
import StatusTag from './StatusTag.vue'

/** 版本历史条目（7.11 GET /applications/{archiveId}/versions / 8.x GET /awards/{applicationId}/versions） */
interface VersionItem {
  version: number
  title: string
  status: number
  statusLabel: string
  rejectedReason?: string
  createdAt: string
}

const props = defineProps<{
  visible: boolean
  loading: boolean
  currentVersion: number
  versions: VersionItem[]
}>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const isVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

/** 后端状态数字 → StatusTag 字符串 key（0=草稿 1=待审批 2=通过 3=已退回 4=已撤销） */
function statusKey(status: number): string {
  return STATUS_MAP[status] ?? 'pending'
}
</script>

<template>
  <el-drawer v-model="isVisible" title="版本历史" size="420px">
    <div v-loading="loading" class="version-history">
      <div class="version-history__current">
        当前版本：<b>v{{ currentVersion }}</b>
      </div>
      <el-empty
        v-if="!loading && versions.length === 0"
        description="暂无版本记录"
        :image-size="72"
      />
      <el-timeline v-else class="version-history__timeline">
        <el-timeline-item
          v-for="item in versions"
          :key="item.version"
          :timestamp="item.createdAt"
          placement="top"
        >
          <div class="version-history__item">
            <div class="version-history__row">
              <span class="version-history__ver">v{{ item.version }}</span>
              <StatusTag :status="statusKey(item.status)" />
            </div>
            <div class="version-history__title">{{ item.title }}</div>
            <div v-if="item.rejectedReason" class="version-history__reject">
              退回原因：{{ item.rejectedReason }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.version-history {
  min-height: 200px;
  &__current {
    margin-bottom: 16px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
  &__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &__ver {
    font-size: 14px;
    font-weight: 600;
  }
  &__title {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
  &__reject {
    font-size: 12px;
    color: var(--el-color-danger);
  }
}
</style>
