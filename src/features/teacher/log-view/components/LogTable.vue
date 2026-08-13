<script setup lang="ts">
import type { LogActionTag } from '@/shared/constants/dict'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import { LOG_ACTION_TYPES } from '@/shared/constants/dict'

interface Props {
  data: any[]
}
defineProps<Props>()
const emit = defineEmits<{ (e: 'view', row: any): void }>()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.isSuperAdmin || userStore.isAdmin)

function maskName(name: string) {
  return isAdmin.value
    ? name
    : name.length > 1
      ? name.charAt(0) + '*'.repeat(name.length - 1)
      : name
}
function maskStudentId(id: string) {
  return isAdmin.value
    ? id
    : id.length > 4
      ? id.slice(0, 2) + '*'.repeat(id.length - 4) + id.slice(-2)
      : id
}
function maskIp(ip: string) {
  return isAdmin.value
    ? ip
    : ip
        .split('.')
        .map((p, i) => (i >= 2 ? '*' : p))
        .join('.')
}
/** 操作类型标签颜色：统一走 LOG_ACTION_TYPES 集中字典 */
function getActionTypeTag(type: string): LogActionTag {
  return LOG_ACTION_TYPES[type]?.tag ?? 'info'
}
function getActionTypeLabel(type: string): string {
  return LOG_ACTION_TYPES[type]?.label ?? type
}
</script>

<template>
  <el-table :data="data" stripe max-height="600" style="width: 100%">
    <el-table-column type="index" label="序号" width="60" />
    <el-table-column label="操作人" width="130"
      ><template #default="{ row }"
        ><span :title="isAdmin ? row.user : ''">{{ maskName(row.user) }}</span></template
      ></el-table-column
    >
    <el-table-column prop="role" label="角色" width="90" />
    <el-table-column label="操作类型" width="90"
      ><template #default="{ row }"
        ><el-tag :type="getActionTypeTag(row.actionType)" size="small">{{
          getActionTypeLabel(row.actionType)
        }}</el-tag></template
      ></el-table-column
    >
    <el-table-column prop="action" label="操作描述" min-width="200" show-overflow-tooltip />
    <el-table-column label="操作对象" width="160"
      ><template #default="{ row }"
        ><div>{{ maskName(row.target) }}</div>
        <div class="log-table__target-id">{{ maskStudentId(row.targetId) }}</div></template
      ></el-table-column
    >
    <el-table-column label="IP 地址" width="130"
      ><template #default="{ row }"
        ><span :title="isAdmin ? row.ip : ''">{{ maskIp(row.ip) }}</span></template
      ></el-table-column
    >
    <el-table-column prop="time" label="操作时间" width="160" sortable />
    <el-table-column label="数据快照" width="100" align="center"
      ><template #default="{ row }"
        ><el-button
          v-if="row.beforeSnapshot || row.afterSnapshot"
          text
          type="primary"
          size="small"
          @click="emit('view', row)"
          >查看</el-button
        ><span v-else class="no-data">-</span></template
      ></el-table-column
    >
  </el-table>
</template>

<style scoped lang="scss">
.no-data {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.log-table__target-id {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
