<script setup lang="ts">
/**
 * ScoreRecalculate - 评分重算
 * 对接后端 /admin/scores/recalculate（触发）+ /recalculation-tasks/{taskId}（查询进度）。
 */
import type { SemesterItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { RefreshCw, Zap } from 'lucide-vue-next'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

import { getRecalculationTask, getSemesters, triggerScoreRecalculate } from '@/shared/api/teacher'

const targetTypeOptions = [
  { value: 1, label: '指定学生' },
  { value: 2, label: '指定班级' },
  { value: 3, label: '指定学期' },
  { value: 4, label: '全量重算' },
  { value: 5, label: '指定专业' },
]

const semesters = ref<SemesterItem[]>([])
const form = reactive({
  targetType: 4,
  targetId: undefined as number | undefined,
  semesterId: undefined as number | undefined,
})

async function loadSemesters() {
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  }
}

interface TaskItem {
  taskId: number
  targetTypeLabel: string
  status: number
  statusLabel: string
  progress: number
  successCount: number
  failCount: number
  createdAt: string
}

const tasks = ref<TaskItem[]>([])
const timers = new Map<number, ReturnType<typeof setInterval>>()

async function handleRecalculate() {
  if (!form.semesterId) {
    ElMessage.warning('请选择学期')
    return
  }
  if (form.targetType !== 4 && !form.targetId) {
    ElMessage.warning('请填写范围 ID')
    return
  }
  try {
    const res = await triggerScoreRecalculate({
      targetType: form.targetType,
      targetId: form.targetType === 4 ? undefined : form.targetId,
      semesterId: form.semesterId,
    })
    ElMessage.success(`评分重算任务已创建（任务 ID: ${res.taskId}）`)
    tasks.value.unshift({
      taskId: res.taskId,
      targetTypeLabel:
        targetTypeOptions.find((t) => t.value === form.targetType)?.label ?? '全量重算',
      status: res.status,
      statusLabel: res.statusLabel,
      progress: 0,
      successCount: 0,
      failCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
    })
    startPolling(res.taskId)
  } catch {
    /* 拦截器已提示 */
  }
}

function startPolling(taskId: number) {
  const timer = setInterval(async () => {
    try {
      const task = await getRecalculationTask(taskId)
      const item = tasks.value.find((t) => t.taskId === taskId)
      if (!item) return
      item.status = task.status
      item.statusLabel = task.statusLabel
      item.progress = task.progress
      item.successCount = task.successCount
      item.failCount = task.failCount
      if (task.status === 2 || task.status === 3) {
        clearInterval(timer)
        timers.delete(taskId)
        if (task.status === 2) ElMessage.success('评分重算完成')
        else ElMessage.error('评分重算失败')
      }
    } catch {
      /* 静默处理单次轮询失败 */
    }
  }, 3000)
  timers.set(taskId, timer)
}

onMounted(() => void loadSemesters())
onUnmounted(() => {
  timers.forEach((t) => clearInterval(t))
  timers.clear()
})
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">评分重算</h2>
        <p class="mc-page-head__desc">
          触发学生成长档案评分的重新计算，支持按学生 / 班级 / 学期 / 专业 / 全量重算。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" @click="loadSemesters">刷新</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">触发重算</span>
      </div>
      <div class="mc-card__body">
        <el-form inline>
          <el-form-item label="重算范围">
            <el-select v-model="form.targetType" style="width: 140px">
              <el-option
                v-for="t in targetTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.targetType !== 4" label="范围 ID">
            <el-input-number v-model="form.targetId" :min="1" style="width: 160px" />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="form.semesterId" placeholder="选择学期" style="width: 180px">
              <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Zap" @click="handleRecalculate">触发重算</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">重算任务</span>
      </div>
      <div class="mc-card__body">
        <el-table v-if="tasks.length" :data="tasks" stripe style="width: 100%">
          <el-table-column prop="taskId" label="任务ID" width="80" />
          <el-table-column prop="targetTypeLabel" label="重算范围" width="110" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 2 ? 'success' : row.status === 3 ? 'danger' : 'warning'"
                size="small"
              >
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="140">
            <template #default="{ row }">
              <el-progress
                :percentage="row.progress"
                :status="row.status === 2 ? 'success' : row.status === 3 ? 'exception' : undefined"
              />
            </template>
          </el-table-column>
          <el-table-column label="成功 / 失败" width="110" align="center">
            <template #default="{ row }">{{ row.successCount }} / {{ row.failCount }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
        </el-table>
        <div v-else class="mc-empty">
          <div class="mc-empty__icon"><Zap :size="24" /></div>
          <p class="mc-empty__title">暂无重算任务</p>
          <p class="mc-empty__desc">选择重算范围与学期后，点击「触发重算」创建任务。</p>
        </div>
      </div>
    </div>
  </div>
</template>
