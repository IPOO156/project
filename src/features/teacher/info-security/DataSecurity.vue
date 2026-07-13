<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { CheckCircle2, Database, Eye, KeyRound, RefreshCw } from 'lucide-vue-next'
import { ref } from 'vue'

const dataSecurityItems = [
  {
    category: '数据加密',
    icon: KeyRound,
    items: [
      { name: '存储加密', status: 'normal', detail: 'AES-256 · 全盘加密' },
      { name: '传输加密', status: 'normal', detail: 'TLS 1.3 · 端到端加密' },
      { name: '数据库加密', status: 'normal', detail: '透明数据加密(TDE)' },
    ],
  },
  {
    category: '数据备份与恢复',
    icon: Database,
    items: [
      { name: '每日自动备份', status: 'normal', detail: '次 03:00 · 保留 30 天' },
      { name: '异地容灾备份', status: 'normal', detail: '同步至灾备中心' },
      { name: '最近备份验证', status: 'normal', detail: '2026-07-08 03:00 · 验证通过' },
    ],
  },
  {
    category: '数据脱敏',
    icon: Eye,
    items: [
      { name: '手机号脱敏', status: 'normal', detail: '138****0000 格式展示' },
      { name: '身份证脱敏', status: 'normal', detail: '****1234 格式展示' },
      { name: '日志脱敏', status: 'normal', detail: '系统日志自动过滤敏感字段' },
    ],
  },
]

const backupHistory = ref([
  {
    date: '2026-07-08 03:00',
    type: '全量备份',
    size: '2.4GB',
    status: 'success',
    duration: '8min',
  },
  {
    date: '2026-07-07 03:00',
    type: '全量备份',
    size: '2.4GB',
    status: 'success',
    duration: '7min',
  },
  {
    date: '2026-07-06 03:00',
    type: '全量备份',
    size: '2.3GB',
    status: 'success',
    duration: '8min',
  },
])

function handleBackup() {
  ElMessage.success('手动备份已启动')
}
</script>

<template>
  <div class="data-security">
    <!-- 数据安全概览 -->
    <el-row :gutter="16">
      <el-col v-for="group in dataSecurityItems" :key="group.category" :span="8">
        <el-card class="data-security__group">
          <template #header>
            <div class="data-security__group-header">
              <component :is="group.icon" :size="18" style="color: var(--el-color-primary)" />
              <span class="section-title">{{ group.category }}</span>
            </div>
          </template>
          <div class="security-items">
            <div v-for="item in group.items" :key="item.name" class="security-item">
              <div class="security-item__left">
                <component :is="CheckCircle2" :size="16" color="var(--el-color-success)" />
                <span class="security-item__name">{{ item.name }}</span>
              </div>
              <span class="security-item__detail">{{ item.detail }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 备份记录 -->
    <el-card>
      <template #header>
        <div class="data-security__backup-header">
          <span class="section-title">备份记录</span>
          <el-button type="primary" size="small" :icon="RefreshCw" @click="handleBackup"
            >手动备份</el-button
          >
        </div>
      </template>
      <el-table :data="backupHistory" stripe>
        <el-table-column prop="date" label="备份时间" width="170" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="duration" label="耗时" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="row.status === 'success'" link size="small" :icon="Database"
              >恢复</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.data-security {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  &__group {
    height: 100%;
  }
  &__group-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__backup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.security-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  border-radius: $radius-base;
  background: var(--el-fill-color-light);
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__name {
    font-size: 14px;
    font-weight: 500;
  }
  &__detail {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
