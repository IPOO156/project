<script setup lang="ts">
/**
 * ScheduledTaskFormDialog - 定时任务新增 / 编辑弹窗（定时任务页子组件）
 *
 * 新建：POST /admin/scheduled-tasks；编辑：PUT /admin/scheduled-tasks/{id}。
 * taskHandler 只能取 GET /admin/scheduled-tasks/handlers 的 handler 值
 * （后端 createTask 用 handlerRegistry.isHandlerAvailable 校验 Bean 名，自填无效）。
 * 编辑时先取详情（GET /admin/scheduled-tasks/{id}）拿 isSystem：
 * 系统内置任务的 taskCode / taskHandler 不可改（后端会忽略），故置灰并加说明。
 *
 * 字段名与长度校验对齐后端 ScheduledTaskManageService.createTask / updateTask。
 */
import type { ScheduledTaskCreatePayload, ScheduledTaskHandlerMeta } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'

import {
  createScheduledTask,
  getScheduledTaskDetail,
  listScheduledTaskHandlers,
  updateScheduledTask,
} from '@/shared/api/teacher'
import { SCHEDULED_RUN_TYPE_OPTIONS, SCHEDULED_TASK_GROUP_OPTIONS } from '@/shared/constants/dict'

const emit = defineEmits<{ (e: 'saved'): void }>()

const visible = ref(false)
const saving = ref(false)
const loadingDetail = ref(false)
const editingId = ref<number | null>(null)
const isSystemTask = ref(false)
const handlers = ref<ScheduledTaskHandlerMeta[]>([])
const handlersLoading = ref(false)

const form = reactive({
  taskHandler: '',
  taskName: '',
  taskCode: '',
  taskGroup: 'system',
  cronExpression: '',
  runType: 1,
  taskParamsText: '',
  description: '',
  maxRetries: 0,
  retryDelaySec: 60,
  timeoutSec: 0,
  status: 1,
})

const title = computed(() => (editingId.value != null ? '编辑定时任务' : '新增定时任务'))
const confirmText = computed(() => (editingId.value != null ? '保存修改' : '创建任务'))

/** 当前选中的处理器说明（用于向使用人解释「这个任务是干什么的」） */
const selectedHandlerDesc = computed(() => {
  const hit = handlers.value.find((h) => h.handler === form.taskHandler)
  return hit?.description ?? ''
})

const handlerOptions = computed(() =>
  handlers.value.map((h) => ({
    value: h.handler,
    label: `${h.name}（${h.handler}）`,
  })),
)

async function loadHandlers() {
  if (handlers.value.length) return
  handlersLoading.value = true
  try {
    handlers.value = (await listScheduledTaskHandlers()) ?? []
  } catch {
    handlers.value = []
  } finally {
    handlersLoading.value = false
  }
}

function resetForm() {
  form.taskHandler = ''
  form.taskName = ''
  form.taskCode = ''
  form.taskGroup = 'system'
  form.cronExpression = ''
  form.runType = 1
  form.taskParamsText = ''
  form.description = ''
  form.maxRetries = 0
  form.retryDelaySec = 60
  form.timeoutSec = 0
  form.status = 1
}

async function openCreate() {
  editingId.value = null
  isSystemTask.value = false
  resetForm()
  visible.value = true
  await loadHandlers()
}

async function openEdit(taskId: number) {
  editingId.value = taskId
  isSystemTask.value = false
  resetForm()
  visible.value = true
  loadingDetail.value = true
  try {
    const detail = await getScheduledTaskDetail(taskId)
    isSystemTask.value = detail.isSystem === 1
    form.taskHandler = detail.taskHandler ?? ''
    form.taskName = detail.taskName
    form.taskCode = detail.taskCode
    form.taskGroup = detail.taskGroup ?? 'system'
    form.cronExpression = detail.cronExpression ?? ''
    form.runType = detail.runType === 2 ? 2 : 1
    form.taskParamsText = detail.taskParams ? JSON.stringify(detail.taskParams, null, 2) : ''
    form.description = detail.description ?? ''
    form.maxRetries = detail.maxRetries ?? 0
    form.retryDelaySec = detail.retryDelaySec ?? 60
    form.timeoutSec = detail.timeoutSec ?? 0
    form.status = detail.status ?? 1
    await loadHandlers()
  } catch {
    visible.value = false // 详情拿不到时不进入编辑态，避免用空表单覆盖
  } finally {
    loadingDetail.value = false
  }
}

/** 选择处理器时，若任务编码仍为空则用处理器约定编码预填（可改） */
function handleHandlerChange() {
  const hit = handlers.value.find((h) => h.handler === form.taskHandler)
  if (hit && !form.taskCode.trim()) {
    form.taskCode = hit.taskCode
  }
  if (hit && !form.taskName.trim()) {
    form.taskName = hit.name
  }
}

/** 解析任务参数 JSON：空文本按「无参数」处理 */
function parseTaskParams(): { ok: true; value: Record<string, unknown> | null } | { ok: false } {
  const text = form.taskParamsText.trim()
  if (!text) return { ok: true, value: null }
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false }
    }
    return { ok: true, value: parsed as Record<string, unknown> }
  } catch {
    return { ok: false }
  }
}

async function submit() {
  if (editingId.value == null && !form.taskHandler) {
    ElMessage.warning('请选择任务处理器')
    return
  }
  if (form.taskName.trim().length < 2) {
    ElMessage.warning('任务名称至少 2 个字符')
    return
  }
  if (form.taskCode.trim().length < 2) {
    ElMessage.warning('任务编码至少 2 个字符')
    return
  }
  if (!form.taskGroup.trim()) {
    ElMessage.warning('请填写任务分组')
    return
  }
  if (form.cronExpression.trim().length < 5) {
    ElMessage.warning('请填写 Cron 表达式（至少 5 位，如 0 3 * * *）')
    return
  }
  if (form.description.length > 255) {
    ElMessage.warning('描述不能超过 255 个字符')
    return
  }
  const params = parseTaskParams()
  if (!params.ok) {
    ElMessage.warning('任务参数需为合法的 JSON 对象，如 {"key":"value"}')
    return
  }

  const base: ScheduledTaskCreatePayload = {
    taskName: form.taskName.trim(),
    taskCode: form.taskCode.trim(),
    taskGroup: form.taskGroup.trim(),
    cronExpression: form.cronExpression.trim(),
    taskHandler: form.taskHandler,
    taskParams: params.value,
    description: form.description.trim() || undefined,
    runType: form.runType,
    maxRetries: form.maxRetries,
    retryDelaySec: form.retryDelaySec,
    timeoutSec: form.timeoutSec,
  }

  saving.value = true
  try {
    if (editingId.value != null) {
      await updateScheduledTask(editingId.value, base)
      ElMessage.success('定时任务已更新')
    } else {
      await createScheduledTask({ ...base, status: form.status })
      ElMessage.success('定时任务已创建')
    }
    visible.value = false
    emit('saved')
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

defineExpose({ openCreate, openEdit })
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="640px" @closed="resetForm">
    <el-form v-loading="loadingDetail" label-width="110px" @submit.prevent>
      <el-form-item v-if="editingId == null" label="任务处理器" required>
        <el-select
          v-model="form.taskHandler"
          placeholder="选择处理器（决定任务实际执行什么）"
          filterable
          :loading="handlersLoading"
          style="width: 100%"
          @change="handleHandlerChange"
        >
          <el-option
            v-for="opt in handlerOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <p v-if="selectedHandlerDesc" class="task-form__handler-desc">
          该处理器的作用：{{ selectedHandlerDesc }}
        </p>
        <p v-else class="task-form__handler-desc">
          处理器决定任务执行的具体逻辑，只能从后端已注册的处理器中选择。
        </p>
      </el-form-item>
      <el-form-item v-else label="任务处理器">
        <span class="task-form__readonly">{{ form.taskHandler || '-' }}</span>
        <span v-if="isSystemTask" class="task-form__hint"> 系统内置任务，处理器不可修改 </span>
      </el-form-item>

      <el-form-item label="任务名称" required>
        <el-input v-model="form.taskName" placeholder="如 每周画像报表导出" maxlength="100" />
      </el-form-item>
      <el-form-item label="任务编码" required>
        <el-input
          v-model="form.taskCode"
          placeholder="如 weekly_report_export（校内唯一）"
          maxlength="50"
          :disabled="editingId != null && isSystemTask"
        />
        <span v-if="editingId != null && isSystemTask" class="task-form__hint">
          系统内置任务，编码不可修改
        </span>
      </el-form-item>
      <el-form-item label="任务分组" required>
        <el-select
          v-model="form.taskGroup"
          placeholder="选择或输入分组"
          filterable
          allow-create
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="opt in SCHEDULED_TASK_GROUP_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Cron 表达式" required>
        <el-input
          v-model="form.cronExpression"
          class="task-form__cron"
          placeholder="如 0 3 * * *"
          maxlength="100"
        />
        <span class="task-form__hint">五位：分 时 日 月 周；「0 3 * * *」表示每天 03:00 执行</span>
      </el-form-item>
      <el-form-item label="运行类型">
        <el-radio-group v-model="form.runType">
          <el-radio v-for="opt in SCHEDULED_RUN_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="任务参数">
        <el-input
          v-model="form.taskParamsText"
          type="textarea"
          :rows="3"
          placeholder='JSON 对象，无参数留空。如 {"userIds":[1,2]}'
        />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          maxlength="255"
          show-word-limit
          placeholder="说明该任务的用途，便于他人识别"
        />
      </el-form-item>
      <el-form-item v-if="editingId == null" label="创建后状态">
        <el-switch
          v-model="form.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>

      <el-collapse class="task-form__advanced">
        <el-collapse-item title="高级设置（可选）" name="advanced">
          <el-form-item label="最大重试次数">
            <el-input-number v-model="form.maxRetries" :min="0" :max="10" />
          </el-form-item>
          <el-form-item label="重试间隔（秒）">
            <el-input-number v-model="form.retryDelaySec" :min="0" :max="86400" />
          </el-form-item>
          <el-form-item label="超时（秒）">
            <el-input-number v-model="form.timeoutSec" :min="0" :max="86400" />
            <span class="task-form__hint">0 表示不限制</span>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="saving" @click="submit">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.task-form {
  &__cron {
    width: 200px;
  }

  &__readonly {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    color: var(--el-text-color-primary);
  }

  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__handler-desc {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  &__advanced {
    margin-left: 110px;
    --el-collapse-header-height: 40px;
  }
}
</style>
