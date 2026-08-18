<script setup lang="ts">
import type { LoginLogItem } from '@/shared/types/teacher'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/stores'

interface Props {
  data: LoginLogItem[]
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

function loginTypeLabel(type: number | null) {
  return type === 1 ? '账号密码' : '其他'
}

function loginStatusTag(status: number | null): 'success' | 'danger' | 'info' {
  if (status === 1) return 'success'
  if (status === 0) return 'danger'
  return 'info'
}

function loginStatusLabel(status: number | null) {
  if (status === 1) return '成功'
  if (status === 0) return '失败'
  return '-'
}
</script>

<template>
  <el-table :data="data" stripe max-height="600" style="width: 100%">
    <el-table-column type="index" label="序号" width="60" />
    <el-table-column label="操作人" width="130">
      <template #default="{ row }">
        <span :title="nameTitle(row.userName)">{{ maskName(row.userName) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="登录类型" width="100">
      <template #default="{ row }">{{ loginTypeLabel(row.loginType) }}</template>
    </el-table-column>
    <el-table-column label="IP" width="130">
      <template #default="{ row }">
        <span :title="ipTitle(row.ipAddress)">{{ maskIp(row.ipAddress) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="登录状态" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="loginStatusTag(row.loginStatus)" size="small">
          {{ loginStatusLabel(row.loginStatus) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="登录时间" width="170" sortable>
      <template #default="{ row }">{{ formatTime(row.loginAt) }}</template>
    </el-table-column>
    <el-table-column label="退出时间" width="170">
      <template #default="{ row }">{{ formatTime(row.logoutAt) }}</template>
    </el-table-column>
  </el-table>
</template>
