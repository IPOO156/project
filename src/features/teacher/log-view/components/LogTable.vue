<script setup lang="ts">
import type { LogActionTag } from '@/shared/constants/dict'
import type { SystemLogItem } from '@/shared/types/teacher'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import { LOG_ACTION_TYPES, LOG_MODULES } from '@/shared/constants/dict'

interface Props {
  data: SystemLogItem[]
}
defineProps<Props>()
const emit = defineEmits<{ (e: 'view', row: SystemLogItem): void }>()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.isSuperAdmin || userStore.isAdmin)

function maskName(name: string | null) {
  if (!name) return '-'
  return isAdmin.value
    ? name
    : name.length > 1
      ? `${name.charAt(0)}${'*'.repeat(name.length - 1)}`
      : name
}

function maskIp(ip: string | null) {
  if (!ip) return '-'
  return isAdmin.value
    ? ip
    : ip
        .split('.')
        .map((p, i) => (i >= 2 ? '*' : p))
        .join('.')
}

function formatTime(t: string | null) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function actionTag(action: string | null): LogActionTag {
  return LOG_ACTION_TYPES[action ?? '']?.tag ?? 'info'
}
function actionLabel(action: string | null): string {
  return LOG_ACTION_TYPES[action ?? '']?.label ?? action ?? '-'
}
function moduleLabel(module: string | null): string {
  return LOG_MODULES[module ?? ''] ?? module ?? '-'
}
</script>

<template>
  <el-table :data="data" stripe max-height="600" style="width: 100%">
    <el-table-column type="index" label="序号" width="60" />
    <el-table-column label="操作人" width="130">
      <template #default="{ row }">
        <span :title="isAdmin ? (row.operatorName ?? '') : ''">{{
          maskName(row.operatorName)
        }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="roleName" label="角色" width="100" />
    <el-table-column label="操作类型" width="90">
      <template #default="{ row }">
        <el-tag :type="actionTag(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="模块" width="90">
      <template #default="{ row }">{{ moduleLabel(row.module) }}</template>
    </el-table-column>
    <el-table-column prop="description" label="操作描述" min-width="220" show-overflow-tooltip />
    <el-table-column label="IP 地址" width="130">
      <template #default="{ row }">
        <span :title="isAdmin ? (row.ipAddress ?? '') : ''">{{ maskIp(row.ipAddress) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作时间" width="160" sortable>
      <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
    </el-table-column>
    <el-table-column label="数据快照" width="100" align="center">
      <template #default="{ row }">
        <el-button
          v-if="row.beforeData || row.afterData"
          text
          type="primary"
          size="small"
          @click="emit('view', row as SystemLogItem)"
        >
          查看
        </el-button>
        <span v-else class="no-data">-</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.no-data {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
</style>
