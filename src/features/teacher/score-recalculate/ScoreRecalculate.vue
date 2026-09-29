<script setup lang="ts">
/**
 * ScoreRecalculate - 评分重算
 * 对接后端教师端 /teacher/scores/recalculate（触发）+ /teacher/scores/recalculation-tasks/{taskId}（查询进度）。
 * 教师端仅支持 targetType 1学生 / 2班级 / 3学期，已去掉 admin 版的全量重算/指定专业。
 *
 * 「重算范围」此前是一个裸的数字输入框，要求教师自己敲出学生 userId / 班级 classId ——
 * 而这两个 id 在界面上任何地方都不展示（档案列表只显示姓名与学号），教师只能靠猜。
 * 现改为选择器：学生按姓名/学号远程搜索、班级下拉选择，id 由选项带出。
 *
 * ⚠️ 已实测的限制（2026-09-28）：候选列表只能取 /admin/archives 与 /admin/classes，
 * 其权限码为 archive:view。**教师角色不持有该码**（只持 teacher:archive:view），调用返回
 * 403「无访问权限」—— 教师端目前不存在学生/班级列表接口。因此：
 *   - 有 archive:view 的账号（管理员）走选择器；
 *   - 教师角色直接退化为「手动输入 ID」，不会出现一个点开是空的下拉；
 *   - 运行期若选项接口失败（权限变更 / 隧道异常）同样自动退化，并有「手动输入 ID」开关兜底。
 * 根治需后端补教师端学生列表接口（如 GET /teacher/students?keyword=），见核查记录。
 */
import type { ScoreRecalculationTask, SemesterItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { RefreshCw, Zap } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  getRecalculationTask,
  getSemesters,
  listArchives,
  listClasses,
  triggerScoreRecalculate,
} from '@/shared/api/teacher'
import { usePollingTask } from '@/shared/composables/usePollingTask'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'

const { canAccessAny } = useTeacherAuthz()

const TARGET_TYPE_STUDENT = 1
const TARGET_TYPE_CLASS = 2

const targetTypeOptions = [
  { value: TARGET_TYPE_STUDENT, label: '指定学生' },
  { value: TARGET_TYPE_CLASS, label: '指定班级' },
  { value: 3, label: '指定学期' },
]

const semesters = ref<SemesterItem[]>([])
const form = reactive({
  targetType: TARGET_TYPE_STUDENT,
  targetId: undefined as number | undefined,
  semesterId: undefined as number | undefined,
})

/** 选择器选项（value 即重算要用的 id） */
interface TargetOption {
  value: number
  label: string
}

const studentOptions = ref<TargetOption[]>([])
const classOptions = ref<TargetOption[]>([])
const targetLoading = ref(false)
/** 手动输入 ID 兜底开关（用户主动切换） */
const manualTargetId = ref(false)
/** 选项接口实际失败（权限变更 / 隧道异常）——运行期兜底，与权限预判相互独立 */
const targetOptionsFailed = ref(false)

/** 后端的候选列表接口（/admin/archives、/admin/classes）要求的权限码 */
const OPTION_PERMISSION_CODES = ['archive:view']

const isStudentTarget = computed(() => form.targetType === TARGET_TYPE_STUDENT)
const isClassTarget = computed(() => form.targetType === TARGET_TYPE_CLASS)
/** 学期范围不需要填 id（targetId 直接取学期下拉的 semesterId，见 handleRecalculate） */
const needsTargetId = computed(() => isStudentTarget.value || isClassTarget.value)

/** 是否具备读取候选列表的权限（admin 角色直通，见 useTeacherAuthz.canAccessAny） */
const canPickTarget = computed(() => canAccessAny(OPTION_PERMISSION_CODES))
/** 无法读取候选列表 → 直接落手动输入，不展示一个点开是空的下拉 */
const useManualTargetId = computed(
  () => manualTargetId.value || !canPickTarget.value || targetOptionsFailed.value,
)
/** 仅在「本来能选、但用户主动切成手动」时给回切按钮；权限不足时无可回切 */
const showManualToggle = computed(() => canPickTarget.value && !targetOptionsFailed.value)

const targetFieldLabel = computed(() => (isStudentTarget.value ? '学生' : '班级'))
const targetPlaceholder = computed(() =>
  isStudentTarget.value ? '输入姓名或学号搜索' : '请选择班级',
)
const targetSelectOptions = computed(() =>
  isStudentTarget.value ? studentOptions.value : classOptions.value,
)
const manualToggleLabel = computed(() => (manualTargetId.value ? '改为选择' : '手动输入 ID'))

/**
 * 学生选项来自 GET /admin/archives（教师端无独立学生列表接口，与 archive-view 同源）。
 * 按 userId 去重：一名学生有多份档案，接口会返回多行。
 */
async function searchStudents(keyword: string) {
  if (!canPickTarget.value) return
  targetLoading.value = true
  try {
    const res = await listArchives({ page: 1, per_page: 20, keyword: keyword || undefined })
    const seen = new Set<number>()
    studentOptions.value = res.list.reduce<TargetOption[]>((acc, row) => {
      if (row.userId == null || seen.has(row.userId)) return acc
      seen.add(row.userId)
      acc.push({
        value: row.userId,
        label: `${row.studentName ?? '未命名'}（${row.studentNo ?? '无学号'}）`,
      })
      return acc
    }, [])
  } catch {
    // 不再重试、不再保留空下拉：直接退化为手动输入（拦截器已提示原因）
    studentOptions.value = []
    targetOptionsFailed.value = true
  } finally {
    targetLoading.value = false
  }
}

/** 班级选项来自 GET /admin/classes（与组织管理页同源），classId 即重算所需的 targetId */
async function loadClasses() {
  if (!canPickTarget.value) return
  targetLoading.value = true
  try {
    const res = await listClasses({ page: 1, per_page: 200 })
    classOptions.value = res.list.map((c) => ({ value: c.classId, label: c.className }))
  } catch {
    classOptions.value = []
    targetOptionsFailed.value = true
  } finally {
    targetLoading.value = false
  }
}

function toggleManualTargetId() {
  manualTargetId.value = !manualTargetId.value
  // 两种输入方式的 id 语义相同，但清空可避免「选了 A 又手动填 B」的混淆
  form.targetId = undefined
}

async function loadSemesters() {
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  }
}

// 切换重算范围时清空上一个范围的 id，并按新范围加载选项
watch(
  () => form.targetType,
  () => {
    form.targetId = undefined
    manualTargetId.value = false
    if (isStudentTarget.value) void searchStudents('')
    else if (isClassTarget.value) void loadClasses()
  },
)

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

/** 任务进度轮询（公共实现，组件卸载时自动清理定时器） */
const polling = usePollingTask<ScoreRecalculationTask>({
  fetch: getRecalculationTask,
  getStatus: (task) => task.status,
  onUpdate: (task, id) => {
    const item = tasks.value.find((t) => t.taskId === id)
    // 任务已从列表移除 → 终止轮询
    if (!item) return false
    item.status = task.status
    item.statusLabel = task.statusLabel
    item.progress = task.progress
    item.successCount = task.successCount
    item.failCount = task.failCount
    return true
  },
  onFinish: (_id, ok) => {
    if (ok) ElMessage.success('评分重算完成')
    else ElMessage.error('评分重算失败')
  },
})

async function handleRecalculate() {
  if (!form.semesterId) {
    ElMessage.warning('请选择学期')
    return
  }
  if (needsTargetId.value && !form.targetId) {
    ElMessage.warning(`请选择要重算的${targetFieldLabel.value}`)
    return
  }
  try {
    const res = await triggerScoreRecalculate({
      targetType: form.targetType,
      targetId: form.targetType === 3 ? form.semesterId : form.targetId,
      semesterId: form.semesterId,
    })
    ElMessage.success(`评分重算任务已创建（任务 ID: ${res.taskId}）`)
    tasks.value.unshift({
      taskId: res.taskId,
      targetTypeLabel:
        targetTypeOptions.find((t) => t.value === form.targetType)?.label ?? '评分重算',
      status: res.status,
      statusLabel: res.statusLabel,
      progress: 0,
      successCount: 0,
      failCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
    })
    polling.start(res.taskId)
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => {
  void loadSemesters()
  // 默认范围是「指定学生」，进页即预载一次选项（空关键词取前 20 条）。
  // searchStudents 内部先判权限：无 archive:view 时直接返回，不会白打一次必然 403 的请求。
  void searchStudents('')
})
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">评分重算</h2>
        <p class="mc-page-head__desc">
          触发学生成长档案评分的重新计算，支持按学生 / 班级 / 学期重算（教师端）。
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
          <el-form-item v-if="needsTargetId" :label="targetFieldLabel">
            <el-select
              v-if="!useManualTargetId"
              v-model="form.targetId"
              filterable
              :remote="isStudentTarget"
              :remote-method="searchStudents"
              :loading="targetLoading"
              :placeholder="targetPlaceholder"
              style="width: 240px"
            >
              <el-option
                v-for="o in targetSelectOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
            <el-input-number v-else v-model="form.targetId" :min="1" style="width: 160px" />
            <el-button
              v-if="showManualToggle"
              class="recalc-target-toggle"
              link
              type="primary"
              @click="toggleManualTargetId"
            >
              {{ manualToggleLabel }}
            </el-button>
            <span v-else class="recalc-target-hint">当前账号无权读取候选列表，请手动填写 ID</span>
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

<style scoped lang="scss">
/* 选择器 / 手动输入框 与「切换输入方式」按钮之间的间距（el-form inline 默认无子项间距） */
.recalc-target-toggle {
  margin-left: 8px;
}

/* 权限不足时的说明文案，与输入框同一行，弱化显示 */
.recalc-target-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
