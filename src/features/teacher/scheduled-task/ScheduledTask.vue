<script setup lang="ts">
import type { ScheduledTaskItem } from '@/shared/types/teacher'
/**
 * ScheduledTask - 定时任务管理（管理端）
 * 数据来源：
 *   - GET /admin/scheduled-tasks              任务列表
 *   - PUT /admin/scheduled-tasks/{id}/status  启用/停用
 * 教师端无等价接口，属管理端功能，前端在此统一展示。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, RefreshCw, Search } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import { listScheduledTasks, updateScheduledTaskStatus } from '@/shared/api/teacher'

const loading = ref(false)
const list = ref<ScheduledTaskItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const taskGroup = ref('')

function runStatusTagType(status: number | null): 'success' | 'danger' | 'info' {
  if (status == null) return 'info'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

async function loadList() {
  loading.value = true
  try {
    const res = await listScheduledTasks({
      taskGroup: taskGroup.value.trim() || undefined,
      page: page.value,
      per_page: perPage.value,
    })
    list.value = res?.list ?? []
    total.value = res?.total ?? list.value.length
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 启用/停用定时任务 */
async function handleToggle(row: ScheduledTaskItem, enabled: boolean) {
  const status = enabled ? 1 : 0
  const verb = enabled ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确认${verb}定时任务「${row.taskName}」？`, `${verb}确认`, {
      confirmButtonText: verb,
      cancelButtonText: '取消',
      type: enabled ? 'success' : 'warning',
    })
  } catch {
    void loadList() // 取消确认时回滚开关视觉状态
    return
  }
  try {
    await updateScheduledTaskStatus(row.taskId, { status })
    ElMessage.success(`定时任务已${verb}`)
    await loadList()
  } catch {
    void loadList() // 操作失败时回滚开关视觉状态
    /* 拦截器已提示 */
  }
}

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page scheduled-task">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">定时任务管理</h2>
        <p class="mc-page-head__desc">
          管理系统定时任务，查看运行状态并控制启用 / 停用（管理端功能）。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" @click="loadList">刷新</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title"><Clock :size="15" /> 任务列表</span>
        <div class="scheduled-task__tools">
          <el-input
            v-model="taskGroup"
            placeholder="按任务分组筛选"
            clearable
            style="width: 180px"
            @keyup.enter="
              page = 1
              loadList()
            "
          />
          <el-button
            type="primary"
            :icon="Search"
            @click="
              page = 1
              loadList()
            "
            >查询</el-button
          >
        </div>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="taskName" label="任务名称" min-width="180" />
          <el-table-column prop="taskCode" label="任务编码" width="180">
            <template #default="{ row }"
              ><span class="mc-num">{{ row.taskCode }}</span></template
            >
          </el-table-column>
          <el-table-column prop="taskGroup" label="分组" width="120">
            <template #default="{ row }">{{ row.taskGroup ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="cronExpression" label="Cron 表达式" width="160">
            <template #default="{ row }"
              ><span class="mc-num">{{ row.cronExpression ?? '-' }}</span></template
            >
          </el-table-column>
          <el-table-column label="最近运行" min-width="180">
            <template #default="{ row }">
              <div class="scheduled-task__run">
                <el-tag :type="runStatusTagType(row.lastRunStatus)" size="small">
                  {{ row.lastRunStatusLabel ?? '未运行' }}
                </el-tag>
                <span class="scheduled-task__run-time">{{ row.lastRunAt ?? '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                inline-prompt
                active-text="启用"
                inactive-text="停用"
                @change="
                  (v: boolean | string | number) =>
                    handleToggle(row as ScheduledTaskItem, v === true || v === 'true' || v === 1)
                "
              />
            </template>
          </el-table-column>
        </el-table>
        <div class="scheduled-task__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="loadList"
            @size-change="
              page = 1
              loadList()
            "
          />
        </div>
        <el-empty v-if="!loading && !list.length" description="暂无定时任务" :image-size="72" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scheduled-task {
  &__tools {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__run {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__run-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
