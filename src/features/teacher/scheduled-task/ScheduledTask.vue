<script setup lang="ts">
import type { ScheduledTaskItem } from '@/shared/types/teacher'
/**
 * ScheduledTask - 定时任务管理（管理端）
 * 数据来源：
 *   - GET    /admin/scheduled-tasks                 任务列表
 *   - POST   /admin/scheduled-tasks                 新增（弹窗见 ./components/ScheduledTaskFormDialog.vue）
 *   - PUT    /admin/scheduled-tasks/{id}            编辑（同上弹窗）
 *   - DELETE /admin/scheduled-tasks/{id}            删除（系统内置任务后端拒绝）
 *   - POST   /admin/scheduled-tasks/{id}/trigger    立即手动触发
 *   - PUT    /admin/scheduled-tasks/{id}/status     启用/停用
 *   - GET    /admin/scheduled-tasks/{id}            详情（./components/ScheduledTaskDetailDrawer.vue）
 * 教师端无等价接口，属管理端功能，前端在此统一展示。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Pencil, Play, Plus, RefreshCw, Search, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import {
  deleteScheduledTask,
  getScheduledTaskDetail,
  listScheduledTasks,
  triggerScheduledTask,
  updateScheduledTaskStatus,
} from '@/shared/api/teacher'

import ScheduledTaskDetailDrawer from './components/ScheduledTaskDetailDrawer.vue'
import ScheduledTaskFormDialog from './components/ScheduledTaskFormDialog.vue'

const loading = ref(false)
const list = ref<ScheduledTaskItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const taskGroup = ref('')
const statusFilter = ref<'' | 0 | 1>('')

/** 行内操作中的任务 id（删除 / 触发），用于按钮 Loading 与禁用 */
const deletingId = ref<number | null>(null)
const triggeringId = ref<number | null>(null)

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
      status: statusFilter.value === '' ? undefined : statusFilter.value,
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

/**
 * 按筛选条件回到第 1 页并重新加载（输入框回车 / 查询 / 切换分页大小共用）。
 * 模板禁止多语句内联表达式（Vue 编译器将换行当作空白，多行无分号的
 * `page = 1\nloadList()` 会解析失败导致模块 500），故抽为具名函数。
 */
function searchTasks() {
  page.value = 1
  void loadList()
}

function handleReset() {
  taskGroup.value = ''
  statusFilter.value = ''
  searchTasks()
}

/**
 * el-switch 变更回调：归一化 change 载荷（布尔开关）后执行启用/停用。
 * 原模板内联跨行箭头带 TS 类型标注，模板解析易失败，故抽为具名函数。
 */
function handleStatusChange(row: ScheduledTaskItem, v: boolean | string | number) {
  void handleToggle(row, v === true || v === 'true' || v === 1)
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

// ── 新增 / 编辑 / 详情 ──
const formDialogRef = ref<InstanceType<typeof ScheduledTaskFormDialog> | null>(null)
const detailDrawerRef = ref<InstanceType<typeof ScheduledTaskDetailDrawer> | null>(null)

function handleAdd() {
  formDialogRef.value?.openCreate()
}

function handleEdit(row: ScheduledTaskItem) {
  formDialogRef.value?.openEdit(row.taskId)
}

function handleDetail(row: ScheduledTaskItem) {
  detailDrawerRef.value?.open(row.taskId)
}

/** 删除前先取详情判断是否系统内置（列表接口不返回 is_system），内置任务后端拒绝删除 */
async function handleDelete(row: ScheduledTaskItem) {
  deletingId.value = row.taskId
  try {
    const detail = await getScheduledTaskDetail(row.taskId)
    if (detail.isSystem === 1) {
      ElMessage.warning('系统内置任务不允许删除，如需停用请关闭「启用状态」开关')
      return
    }
    await ElMessageBox.confirm(`确定删除定时任务「${row.taskName}」吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteScheduledTask(row.taskId)
    ElMessage.success('定时任务已删除')
    await loadList()
  } catch {
    /* 用户取消或接口报错（接口错误由拦截器提示） */
  } finally {
    deletingId.value = null
  }
}

/** 立即手动触发执行（停用状态后端会拒绝，前端先给出明确提示而非静默置灰） */
async function handleTrigger(row: ScheduledTaskItem) {
  if (row.status === 0) {
    ElMessage.warning('该任务已停用，请先在「启用状态」中启用后再执行')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定立即执行定时任务「${row.taskName}」吗？该操作会立刻触发任务逻辑，可能产生数据变更。`,
      '立即执行确认',
      { confirmButtonText: '立即执行', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  triggeringId.value = row.taskId
  try {
    await triggerScheduledTask(row.taskId)
    ElMessage.success('任务已触发，请稍后刷新查看执行结果')
    await loadList()
  } catch {
    /* 拦截器已提示 */
  } finally {
    triggeringId.value = null
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
          定时任务用于按 Cron 计划自动执行后台作业（如清理过期文件、刷新统计缓存、审批超时提醒），
          也可手动立即触发一次。任务「实际执行什么」由所选的<strong>处理器</strong>决定，
          处理器由后端注册，新建任务时只能从已注册的处理器中选择。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="loadList">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增任务</el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="searchTasks">
        <el-form-item label="任务分组">
          <el-input
            v-model="taskGroup"
            placeholder="如 cleanup / data"
            clearable
            style="width: 180px"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="searchTasks">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title"><Clock :size="15" /> 任务列表</span>
        <span class="scheduled-task__total">共 {{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="taskName" label="任务名称" min-width="160" />
          <el-table-column prop="taskCode" label="任务编码" width="170">
            <template #default="{ row }"
              ><span class="mc-num">{{ row.taskCode }}</span></template
            >
          </el-table-column>
          <el-table-column prop="taskGroup" label="分组" width="110">
            <template #default="{ row }">{{ row.taskGroup ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="cronExpression" label="Cron 表达式" width="150">
            <template #default="{ row }"
              ><span class="mc-num">{{ row.cronExpression ?? '-' }}</span></template
            >
          </el-table-column>
          <el-table-column label="最近运行" min-width="170">
            <template #default="{ row }">
              <div class="scheduled-task__run">
                <el-tag :type="runStatusTagType(row.lastRunStatus)" size="small">
                  {{ row.lastRunStatusLabel ?? '未运行' }}
                </el-tag>
                <span class="scheduled-task__run-time">{{ row.lastRunAt ?? '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                inline-prompt
                active-text="启用"
                inactive-text="停用"
                @change="handleStatusChange(row as ScheduledTaskItem, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230" align="center">
            <template #default="{ row }">
              <div class="scheduled-task__actions">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="handleDetail(row as ScheduledTaskItem)"
                >
                  详情
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="Pencil"
                  @click="handleEdit(row as ScheduledTaskItem)"
                >
                  编辑
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="Play"
                  :loading="triggeringId === (row as ScheduledTaskItem).taskId"
                  :disabled="triggeringId !== null"
                  @click="handleTrigger(row as ScheduledTaskItem)"
                >
                  执行
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  :icon="Trash2"
                  :loading="deletingId === (row as ScheduledTaskItem).taskId"
                  :disabled="deletingId !== null"
                  @click="handleDelete(row as ScheduledTaskItem)"
                >
                  删除
                </el-button>
              </div>
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
            @size-change="searchTasks"
          />
        </div>
        <el-empty v-if="!loading && !list.length" description="暂无定时任务" :image-size="72" />
      </div>
    </div>

    <ScheduledTaskFormDialog ref="formDialogRef" @saved="loadList" />
    <ScheduledTaskDetailDrawer ref="detailDrawerRef" />
  </div>
</template>

<style scoped lang="scss">
.scheduled-task {
  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
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

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;

    // 去掉 Element Plus 相邻按钮默认 12px 间距，保证操作按钮一排排布
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
