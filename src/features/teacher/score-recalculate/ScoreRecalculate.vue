<script setup lang="ts">
/**
 * ScoreRecalculate - 评分重算
 * 对接后端教师端 /teacher/scores/recalculate（触发）+ /teacher/scores/recalculation-tasks/{taskId}（查询进度）。
 * 教师端仅支持 targetType 1学生 / 2班级 / 3学期，已去掉 admin 版的全量重算/指定专业。
 *
 * ⚠️「重算范围」填的是**内部主键**（学生 userId、班级 classId），界面上任何地方都不展示。
 * 让用户手输等于让他猜，而猜中的小整数（如 1/2/3）可能恰好命中**另一名学生** ——
 * 后端范围校验会通过，于是不报错、静默算错人。故一律由选择器带出 id：
 *   - 学生：GET /teacher/archives（返回项含真实 userId，对管理员同样放行，实测 200），按姓名/学号远程搜索；
 *   - 班级：管理员走 GET /admin/classes（全量）；教师用 /auth/me 授权范围里的班级
 *     （scopeType=4 的 scopeId 即 classId，天然落在本人范围内）。
 *
 * 候选列表**整体不可得**时（接口失败 / 本人无授权班级）才退化为手输兜底 —— 这是唯一保留的手输入口。
 * 不提供「手动输入」开关：内部主键全仓无一处展示，用户无从得知，开关只服务于猜 id，弊大于利。
 *
 * ⚠️ 后端在写入前按 role_scopes 校验（AdminScoreService.triggerRecalculateByTeacher）：
 *   - targetType=1 需该学生在本范围内（ensureStudentInScope）；
 *   - targetType=2 需**该班级**的班级级授权（ensureOrgInScope 精确匹配、不做子级展开，学院/专业授权不涵盖）；
 *   - targetType=3 需**学校级授权**（ensureSchoolScope：scopeType=1 且 scopeId=schoolId；admin 直通）。
 * 后两项对授权范围不足的教师必然 403，故不给出必失败的操作 —— 但两者处理方式不同：
 *   - 「指定班级」置灰 + 提示：班级级授权**有**下发入口（角色管理→数据范围可授 scopeType=4），教师可去申请；
 *   - 「指定学期」对非 admin **不展示**：学校级授权**没有任何下发入口**，教师永远拿不到，留着只会误导。
 *
 * ⚠️ 为什么「指定学期」对教师是删而非置灰：写接口 PUT /admin/users/{userId}/scopes 的 validateScope
 * （UserManageService.java:600-616）显式 `default -> throw` 拒绝 scopeType=1（「只能为 2(学院)/3(专业)/4(班级)」），
 * 前端数据范围配置页（RoleAdjust.vue:158-160）也只提交 2/3/4；全仓 `scope_type=1` 的唯一来源是迁移
 * V35__ensure_role_permissions_and_scopes.sql:162-165 —— **自动播种给 admin**。
 * 即管理员端**没有**授予学校级授权的入口 ⇒ 教师的「指定学期」永久不可达。
 * 该选项对管理员保留（ensureSchoolScope 对 admin 直通），且前端只挂了本页一个重算入口、无管理端等价页面，
 * 它是管理员唯一可触发全校重算的入口，故不可整体删除。
 *
 * 选项来源自身即按授权范围过滤，因此不会出现「选得到但被后端拒绝」的组合。
 */
import type { ScoreRecalculationTask, SemesterItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { RefreshCw, Zap } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  getRecalculationTask,
  getSemesters,
  listClasses,
  listTeacherArchives,
  triggerScoreRecalculate,
} from '@/shared/api/teacher'
import { usePollingTask } from '@/shared/composables/usePollingTask'
import { useScopeFilter } from '@/shared/composables/useScopeFilter'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { isAdmin } = useTeacherAuthz()
const { me } = useTeacherMe()
/** 本人授权范围内的班级（scopeType=4，id 即 classId），教师端班级候选的来源 */
const { classes: scopedClasses } = useScopeFilter()

const TARGET_TYPE_STUDENT = 1
const TARGET_TYPE_CLASS = 2
const TARGET_TYPE_SEMESTER = 3

/** 组织范围维度码（与后端 TeacherScopeValidator 同源）：1=学校 2=学院 3=专业 4=班级 */
const SCOPE_TYPE_SCHOOL = 1
const SCOPE_TYPE_CLASS = 4

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
/** 触发重算按钮 Loading（与选项加载 targetLoading 分离，避免下拉与按钮相互牵连） */
const recalculating = ref(false)
/** 候选不可得（接口失败 / 本人无授权班级）—— 此时退化为手输兜底，不展示一个点开是空的下拉 */
const targetOptionsFailed = ref(false)

const isStudentTarget = computed(() => form.targetType === TARGET_TYPE_STUDENT)
const isClassTarget = computed(() => form.targetType === TARGET_TYPE_CLASS)
/** 学期范围不需要填 id（targetId 直接取学期下拉的 semesterId，见 handleRecalculate） */
const needsTargetId = computed(() => isStudentTarget.value || isClassTarget.value)

/** 手输兜底时的说明：强调填的是系统内部编号（用户能看到的学号/序号都不是它） */
const manualHint = '候选列表不可用，请填写系统内部编号（非学号 / 非班级序号）'

/** 是否持学校级授权（scopeType=1 且 scopeId=本人 schoolId）—— 后端校级校验的唯一判据 */
const hasSchoolScope = computed(() =>
  (me.value?.scopes ?? []).some(
    (s) => s.scopeType === SCOPE_TYPE_SCHOOL && s.scopeId === me.value?.schoolId,
  ),
)

/**
 * 是否可对「指定班级」发起重算 —— 与后端 ensureOrgInScope(SCOPE_CLASS) 同一判据：
 * 管理员直通、或持学校级授权、或持**该班级**的班级级授权。
 * 注意该接口对上级组织**不做子级展开**（精确匹配 scopeType/scopeId），
 * 故仅授学院/专业的教师选任何班级都会被拒 ⇒ 此项同样置灰，不给必失败的操作。
 */
const canRecalcByClass = computed(
  () =>
    isAdmin.value ||
    hasSchoolScope.value ||
    (me.value?.scopes ?? []).some((s) => s.scopeType === SCOPE_TYPE_CLASS),
)

/**
 * 是否可对「指定学期」发起重算 —— 与后端 ensureSchoolScope 同一判据：
 * 管理员直通、或持学校级授权（全校范围操作）。
 * 注意：学校级授权没有任何下发入口（写接口拒绝 scopeType=1，来源仅为迁移 V35 给 admin 的播种），
 * 故该判据对教师恒为 false，选项对教师整体不展示（见 targetTypeOptions）。
 */
const canRecalcBySemester = computed(() => isAdmin.value || hasSchoolScope.value)

/**
 * 重算范围选项。
 * - 不可用且**可申请**的（指定班级 → 需班级级授权）置灰 + 附原因，教师知道去哪儿开通；
 * - 不可用且**无入口**的（指定学期 → 需学校级授权，管理员端无法授予）直接不展示，避免给出永久不可达的选项。
 */
const targetTypeOptions = computed(() => {
  const classDisabled = !canRecalcByClass.value
  const options = [
    { value: TARGET_TYPE_STUDENT, label: '指定学生', disabled: false, hint: '' },
    {
      value: TARGET_TYPE_CLASS,
      label: '指定班级',
      disabled: classDisabled,
      hint: classDisabled ? '需班级级授权' : '',
    },
  ]
  if (canRecalcBySemester.value) {
    options.push({ value: TARGET_TYPE_SEMESTER, label: '指定学期', disabled: false, hint: '' })
  }
  return options
})

const targetFieldLabel = computed(() => (isStudentTarget.value ? '学生' : '班级'))
const targetPlaceholder = computed(() =>
  isStudentTarget.value ? '输入姓名或学号搜索' : '请选择班级',
)
const targetSelectOptions = computed(() =>
  isStudentTarget.value ? studentOptions.value : classOptions.value,
)

/**
 * 学生候选来自 GET /teacher/archives —— 返回项含真实 userId，且该接口对管理员同样放行
 * （实测管理员 200/total=115）。接口本身按 role_scopes 过滤，候选必然落在本人可重算范围内。
 * 按 userId 去重：一名学生有多份档案，接口会返回多行。
 */
async function searchStudents(keyword: string) {
  targetLoading.value = true
  try {
    const res = await listTeacherArchives({ page: 1, per_page: 20, keyword: keyword || undefined })
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
    targetOptionsFailed.value = false
  } catch {
    // 不再重试、不再保留空下拉：直接退化为手动输入（拦截器已提示原因）
    studentOptions.value = []
    targetOptionsFailed.value = true
  } finally {
    targetLoading.value = false
  }
}

/**
 * 班级候选分角色取源：
 *   - 管理员：GET /admin/classes（全量，与组织管理页同源），classId 即重算所需的 targetId；
 *   - 教师：本人 /auth/me 授权范围内的班级（无该管理端接口权限），scopeId 即 classId。
 * 教师范围为空（未被授予班级级范围）时退化为手动输入，不展示一个点开是空的下拉。
 */
async function loadClasses() {
  if (!isAdmin.value) {
    classOptions.value = scopedClasses.value.map((c) => ({ value: c.id, label: c.name }))
    targetOptionsFailed.value = classOptions.value.length === 0
    return
  }
  targetLoading.value = true
  try {
    const res = await listClasses({ page: 1, per_page: 200 })
    classOptions.value = res.list.map((c) => ({ value: c.classId, label: c.className }))
    targetOptionsFailed.value = false
  } catch {
    classOptions.value = []
    targetOptionsFailed.value = true
  } finally {
    targetLoading.value = false
  }
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
  (type) => {
    form.targetId = undefined
    // 候选来源随范围切换，重置上一轮的不可得标记，避免沿用旧范围的手输兜底态
    targetOptionsFailed.value = false
    if (type === TARGET_TYPE_STUDENT) void searchStudents('')
    else if (type === TARGET_TYPE_CLASS) void loadClasses()
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
  recalculating.value = true
  try {
    const res = await triggerScoreRecalculate({
      targetType: form.targetType,
      targetId: form.targetType === TARGET_TYPE_SEMESTER ? form.semesterId : form.targetId,
      semesterId: form.semesterId,
    })
    ElMessage.success(`评分重算任务已创建（任务 ID: ${res.taskId}）`)
    tasks.value.unshift({
      taskId: res.taskId,
      targetTypeLabel:
        targetTypeOptions.value.find((t) => t.value === form.targetType)?.label ?? '评分重算',
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
  } finally {
    recalculating.value = false
  }
}

onMounted(() => {
  void loadSemesters()
  // 默认范围是「指定学生」，进页即预载一次候选（空关键词取本人授权范围内的前 20 名学生）
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
            <el-select v-model="form.targetType" style="width: 180px">
              <el-option
                v-for="t in targetTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
                :disabled="t.disabled"
              >
                <span>{{ t.label }}</span>
                <span v-if="t.hint" class="recalc-option-hint">{{ t.hint }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="needsTargetId" :label="targetFieldLabel">
            <el-select
              v-if="!targetOptionsFailed"
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
            <!-- 手输兜底：仅在候选列表整体不可得时出现（内部编号，无步进器） -->
            <template v-else>
              <el-input-number
                v-model="form.targetId"
                :min="1"
                :precision="0"
                :controls="false"
                placeholder="系统内部编号"
                style="width: 200px"
              />
              <span class="recalc-target-hint">{{ manualHint }}</span>
            </template>
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="form.semesterId" placeholder="选择学期" style="width: 180px">
              <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :icon="Zap"
              :loading="recalculating"
              :disabled="recalculating"
              @click="handleRecalculate"
            >
              触发重算
            </el-button>
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
/* 手输兜底的说明文案，与输入框同一行，弱化显示 */
.recalc-target-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 重算范围下拉里「需班级级授权」这类不可用原因，弱化显示 */
.recalc-option-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
