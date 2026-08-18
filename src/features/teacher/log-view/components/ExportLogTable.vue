<script setup lang="ts">
import type { ExportLogItem } from '@/shared/types/teacher'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/stores'

interface Props {
  data: ExportLogItem[]
}
defineProps<Props>()

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isSuperAdmin || userStore.isAdmin)

function nameTitle(name: string | null) {
  return isAdmin.value ? (name ?? '') : ''
}
function ipTitle(ip: string | null) {
  return isAdmin.value ? (ip ?? '') : ''
}

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

function exportTypeLabel(type: string | null) {
  return type || '-'
}

function anonymizedTag(val: number | null): 'success' | 'info' {
  return val === 1 ? 'success' : 'info'
}

function anonymizedLabel(val: number | null) {
  if (val === 1) return '匿名'
  if (val === 0) return '非匿名'
  return '-'
}
</script>

<template>
  <el-table :data="data" stripe max-height="600" style="width: 100%">
    <el-table-column type="index" label="序号" width="60" />
    <el-table-column label="操作人" width="130">
      <template #default="{ row }">
        <span :title="nameTitle(row.operatorName)">{{ maskName(row.operatorName) }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="roleName" label="角色" width="110" />
    <el-table-column label="导出类型" min-width="140" show-overflow-tooltip>
      <template #default="{ row }">{{ exportTypeLabel(row.exportType) }}</template>
    </el-table-column>
    <el-table-column label="是否匿名" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="anonymizedTag(row.isAnonymized)" size="small">
          {{ anonymizedLabel(row.isAnonymized) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="导出时间" width="170" sortable>
      <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
    </el-table-column>
    <el-table-column label="IP" width="130">
      <template #default="{ row }">
        <span :title="ipTitle(row.ipAddress)">{{ maskIp(row.ipAddress) }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>
