<script setup lang="ts">
/**
 * ScheduledTaskDetailDrawer - 定时任务详情抽屉（定时任务页子组件）
 *
 * 数据来源：GET /admin/scheduled-tasks/{id}（14.4）。
 * 由父组件 ref 调用 open(taskId) 打开；打开即重新拉取，不保留上次数据。
 */
import type { ScheduledTaskDetail } from '@/shared/types/teacher'
import { computed, ref } from 'vue'

import { getScheduledTaskDetail } from '@/shared/api/teacher'
import { SCHEDULED_RUN_TYPES, SCHEDULED_TASK_GROUPS } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'

const visible = ref(false)
const loading = ref(false)
const detail = ref<ScheduledTaskDetail | null>(null)

const groupLabel = computed(() => {
  const group = detail.value?.taskGroup
  if (!group) return '-'
  return SCHEDULED_TASK_GROUPS[group] ? `${SCHEDULED_TASK_GROUPS[group]}（${group}）` : group
})

const runTypeLabel = computed(() => {
  const runType = detail.value?.runType
  if (runType == null) return '-'
  return detail.value?.runTypeLabel ?? SCHEDULED_RUN_TYPES[runType] ?? String(runType)
})

const paramsText = computed(() => {
  const params = detail.value?.taskParams
  if (params == null) return '无'
  return JSON.stringify(params, null, 2)
})

const lastRunText = computed(() => {
  const item = detail.value
  if (!item?.lastRunAt && item?.lastRunStatus == null) return '未运行'
  const status = item?.lastRunStatusLabel ?? (item?.lastRunStatus === 1 ? '成功' : '失败')
  return `${status} · ${formatDateTime(item?.lastRunAt)}`
})

async function open(taskId: number) {
  visible.value = true
  loading.value = true
  detail.value = null
  try {
    detail.value = await getScheduledTaskDetail(taskId)
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-drawer v-model="visible" title="定时任务详情" size="520px" @closed="detail = null">
    <div v-loading="loading" class="task-detail">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="任务名称">{{ detail.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务编码">{{ detail.taskCode }}</el-descriptions-item>
        <el-descriptions-item label="任务分组">{{ groupLabel }}</el-descriptions-item>
        <el-descriptions-item label="处理器">{{ detail.taskHandler ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="运行类型">{{ runTypeLabel }}</el-descriptions-item>
        <el-descriptions-item label="Cron 表达式">
          {{ detail.cronExpression ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="启用状态">{{
          detail.statusLabel ?? '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="任务来源">
          {{ detail.isSystem === 1 ? '系统内置（不可删除）' : '自定义' }}
        </el-descriptions-item>
        <el-descriptions-item label="下次运行">
          {{ formatDateTime(detail.nextRunAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="最近运行">{{ lastRunText }}</el-descriptions-item>
        <el-descriptions-item label="任务参数">
          <pre class="task-detail__params">{{ paramsText }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="描述">{{ detail.description ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="失败重试">
          最多 {{ detail.maxRetries ?? 0 }} 次，间隔 {{ detail.retryDelaySec ?? 0 }} 秒
        </el-descriptions-item>
        <el-descriptions-item label="超时设置">
          {{ detail.timeoutSec ? `${detail.timeoutSec} 秒` : '不限制' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(detail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDateTime(detail.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="暂无任务详情" :image-size="72" />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.task-detail {
  min-height: 200px;

  &__params {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--el-text-color-regular);
  }
}
</style>
