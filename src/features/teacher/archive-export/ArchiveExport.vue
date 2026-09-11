<script setup lang="ts">
import type { ExportJobItem, TeacherExportJob, TeacherExportTemplate } from '@/shared/types/teacher'
/**
 * ArchiveExport - 档案导出
 *
 * 已对接后端教师端：提交导出（POST /teacher/exports）、任务列表（GET /teacher/exports，
 * 替代 admin 版单任务轮询 /admin/exports/{jobId}）、删除（DELETE /teacher/exports/{jobId}）、
 * 导出模板（GET /teacher/exports/templates）。
 * 研究数据导出（/admin/exports/research）无教师端等价接口，保留 admin。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, FileDown, FlaskConical, Plus, Search, Trash2 } from 'lucide-vue-next'

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  deleteTeacherExportJob,
  getExportJob,
  getTeacherExportJobs,
  getTeacherExportTemplates,
  submitArchiveExport,
} from '@/shared/api/teacher'
import { usePollingTask } from '@/shared/composables/usePollingTask'
import { scopeCascade, useScopeFilter } from '@/shared/composables/useScopeFilter'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import GradeImportPanel from './components/GradeImportPanel.vue'
import ResearchExportDialog from './components/ResearchExportDialog.vue'

// 以下四项能力按后端权限码判定（原先统一挂在 super_admin 上，而该角色不存在 → 对所有人生效为 false）
const { hasPermission } = useTeacherAuthz()
/** 研究数据导出（/admin/exports/research）：export:research */
const canExportResearch = computed(() => hasPermission('export:research'))
/** 成绩导入面板：grade:import */
const canImportGrade = computed(() => hasPermission('grade:import'))
/** 手动添加学期：semester:manage */
const canManageSemester = computed(() => hasPermission('semester:manage'))
/** 选择可导年级：export:manage（管理端导出配置） */
const canChooseGrade = computed(() => hasPermission('export:manage'))

/** 组织范围下拉项（学院/专业/班级，来自 /auth/me 的 scopes） */
const { colleges, majors, classes } = useScopeFilter()

const filters = reactive({
  scope: '全校',
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
  status: '',
  dateRange: [] as string[],
})

const scopeOptions = ['全校', '学院', '专业', '班级']
const SCOPE_TYPE: Record<string, number> = { 全校: 1, 学院: 2, 专业: 3, 班级: 4 }

/** 组织维度 → 学院/专业/班级下拉显隐（筛选栏） */
const cascade = computed(() => scopeCascade(SCOPE_TYPE[filters.scope]))

const exportTasks = ref<TeacherExportJob[]>([])
const tasksLoading = ref(false)
let listPollTimer: ReturnType<typeof setInterval> | null = null

/** 教师端导出模板（GET /teacher/exports/templates） */
const templates = ref<TeacherExportTemplate[]>([])
const templatesLoading = ref(false)
const selectedTemplateId = ref<number | undefined>(undefined)

async function loadTemplates() {
  templatesLoading.value = true
  try {
    const res = await getTeacherExportTemplates()
    templates.value = res.list ?? []
  } catch {
    templates.value = []
  } finally {
    templatesLoading.value = false
  }
}

/** 教师端导出任务列表（GET /teacher/exports） */
async function loadExportTasks() {
  tasksLoading.value = true
  try {
    const res = await getTeacherExportJobs({ per_page: 50 })
    exportTasks.value = res?.list ?? []
  } catch {
    exportTasks.value = []
  } finally {
    tasksLoading.value = false
  }
}

/** 任务进度：教师端接口无 progress 字段，按 totalCount/successCount 推算 */
function jobProgress(job: TeacherExportJob): number {
  if (job.status === 2) return 100
  if (job.status === 3) return 0
  if (job.totalCount && job.totalCount > 0) {
    return Math.round(((job.successCount ?? 0) / job.totalCount) * 100)
  }
  return 0
}

/** 存在处理中任务时每 5s 轮询列表（教师端无单任务查询接口） */
function startListPolling() {
  if (listPollTimer) return
  listPollTimer = setInterval(async () => {
    const hasProcessing = exportTasks.value.some((t) => t.status !== 2 && t.status !== 3)
    if (!hasProcessing) {
      if (listPollTimer != null) clearInterval(listPollTimer)
      listPollTimer = null
      return
    }
    await loadExportTasks()
  }, 5000)
}

/** 导出记录查询过滤（状态 + 时间范围，替代原 no-op 查询按钮） */
const filteredTasks = computed(() => {
  let list = exportTasks.value
  if (filters.status === '已完成') list = list.filter((t) => t.status === 2)
  else if (filters.status === '失败') list = list.filter((t) => t.status === 3)
  else if (filters.status === '处理中') list = list.filter((t) => t.status !== 2 && t.status !== 3)
  if (filters.dateRange?.length === 2 && filters.dateRange[0] && filters.dateRange[1]) {
    const start = new Date(filters.dateRange[0]).getTime()
    const end = new Date(filters.dateRange[1]).getTime() + 86_400_000
    list = list.filter((t) => {
      if (!t.createdAt) return true
      const ts = new Date(t.createdAt).getTime()
      return ts >= start && ts <= end
    })
  }
  return list
})

/** 研究数据导出任务单任务轮询（admin /admin/exports/{jobId}，无教师端等价接口，超管专属） */
const researchPolling = usePollingTask<ExportJobItem>({
  fetch: getExportJob,
  getStatus: (job) => job.status,
  onUpdate: (job, id) => {
    const task = exportTasks.value.find((t) => t.exportJobId === id)
    // 任务已从列表移除 → 终止轮询
    if (!task) return false
    task.status = job.status
    task.statusLabel = job.statusLabel
    task.downloadUrl = job.downloadUrl
    return true
  },
  onFinish: (_id, ok) => {
    if (ok) ElMessage.success('导出完成，可下载')
    else ElMessage.error('导出失败')
  },
})

const statusOptions = ['全部', '已完成', '处理中', '失败']

// ── 超管专属：添加学期 / 可导年级 ──
const semesterDialogVisible = ref(false)
const newSemester = ref('')
const gradeSelection = ref<string[]>([])
const gradeOptions = ['2024级', '2023级', '2022级', '2021级']

// ── 研究数据导出（/admin/exports/research）：弹窗已拆至 ResearchExportDialog.vue ──
const researchDialogVisible = ref(false)
const submittingArchive = ref(false)

/** 弹窗创建任务成功：入列表并启动进度轮询 */
function handleResearchCreated(job: TeacherExportJob) {
  exportTasks.value.unshift(job)
  researchPolling.start(job.exportJobId)
}

async function handleExport(fileType: 'pdf' | 'xlsx') {
  if (submittingArchive.value) return
  submittingArchive.value = true
  const scopeType = SCOPE_TYPE[filters.scope]
  const scopeId =
    filters.scope === '学院'
      ? filters.collegeId
      : filters.scope === '专业'
        ? filters.majorId
        : filters.scope === '班级'
          ? filters.classId
          : undefined
  const selectedTemplate = templates.value.find((t) => t.templateId === selectedTemplateId.value)
  try {
    const res = await submitArchiveExport({
      scopeType,
      scopeId,
      fileType: selectedTemplate?.exportType ?? fileType,
      templateId: selectedTemplate?.templateId,
    })
    ElMessage.success(
      `导出任务已创建（任务 ID: ${res.jobId}），预计 ${res.estimatedSeconds ?? 60} 秒完成`,
    )
    await loadExportTasks()
    startListPolling()
  } catch {
    /* 拦截器已提示 */
  } finally {
    submittingArchive.value = false
  }
}

/** 删除导出任务（DELETE /teacher/exports/{jobId}） */
async function handleDeleteExport(row: TeacherExportJob) {
  try {
    await ElMessageBox.confirm(`确认删除导出任务 #${row.exportJobId}？`, '删除导出', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteTeacherExportJob(row.exportJobId)
    ElMessage.success('已删除导出任务')
    exportTasks.value = exportTasks.value.filter((t) => t.exportJobId !== row.exportJobId)
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(async () => {
  await Promise.all([loadTemplates(), loadExportTasks()])
  startListPolling()
})

onUnmounted(() => {
  // 研究导出任务的单任务轮询由 usePollingTask 自行清理；
  // 列表级 5s 轮询形状不同（无任务 id），保留在此单独清理。
  if (listPollTimer) {
    clearInterval(listPollTimer)
    listPollTimer = null
  }
})
</script>

<template>
  <div class="mc-page archive-export">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">档案导出 · Exports</p>
        <h2 class="mc-page-head__title">档案导出</h2>
        <p class="mc-page-head__desc">
          选择导出范围（全校 / 学院 / 专业 / 班级）与导出模板，提交后可在下方记录中下载或删除。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="导出范围">
          <el-select v-model="filters.scope" style="width: 120px">
            <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.college" label="学院">
          <el-select
            v-model="filters.collegeId"
            placeholder="全部学院"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.major" label="专业">
          <el-select
            v-model="filters.majorId"
            placeholder="全部专业"
            clearable
            style="width: 160px"
          >
            <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.class" label="班级">
          <el-select
            v-model="filters.classId"
            placeholder="全部班级"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 120px">
            <el-option
              v-for="s in statusOptions"
              :key="s"
              :label="s"
              :value="s === '全部' ? '' : s"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">导出操作</span>
      </div>
      <div class="mc-card__body">
        <div class="archive-export__template-row">
          <span class="archive-export__template-label">导出模板</span>
          <el-select
            v-model="selectedTemplateId"
            clearable
            placeholder="使用默认模板"
            style="width: 240px"
            :loading="templatesLoading"
          >
            <el-option
              v-for="t in templates"
              :key="t.templateId"
              :label="t.templateName"
              :value="t.templateId"
            />
          </el-select>
        </div>
        <div class="mc-card__body archive-export__actions">
          <el-button :icon="Download" :loading="submittingArchive" @click="handleExport('pdf')"
            >导出学生文件</el-button
          >
          <el-button :icon="FileDown" :loading="submittingArchive" @click="handleExport('xlsx')"
            >一键导出基本信息</el-button
          >
          <el-button
            v-if="canExportResearch"
            :icon="FlaskConical"
            @click="researchDialogVisible = true"
            >研究数据导出</el-button
          >
          <template v-if="canManageSemester">
            <el-button :icon="Plus" @click="semesterDialogVisible = true">手动添加学期</el-button>
          </template>
        </div>
      </div>
      <div v-if="canChooseGrade" class="mc-card__body">
        <el-form-item label="选择可导年级">
          <el-checkbox-group v-model="gradeSelection">
            <el-checkbox v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-checkbox-group>
        </el-form-item>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">导出记录</span>
        <span class="archive-export__count">{{ filteredTasks.length }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table
          v-if="filteredTasks.length"
          v-loading="tasksLoading"
          :data="filteredTasks"
          stripe
          max-height="400"
          style="width: 100%"
        >
          <el-table-column prop="exportJobId" label="任务ID" width="80" />
          <el-table-column label="导出内容" width="160">
            <template #default="{ row }">
              {{ row.templateName || row.exportType }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
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
                :percentage="jobProgress(row as TeacherExportJob)"
                :status="row.status === 2 ? 'success' : row.status === 3 ? 'exception' : undefined"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column label="下载" width="240" align="center">
            <template #default="{ row }">
              <template v-if="row.downloadUrl">
                <a :href="row.downloadUrl" target="_blank" class="archive-export__download">下载</a>
                <p class="archive-export__expire-hint">
                  {{
                    row.expireAt
                      ? `链接有时效，请尽快下载（有效期至 ${row.expireAt}）`
                      : '链接有时效，请尽快下载'
                  }}
                </p>
              </template>
              <span v-else class="archive-export__nodata">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ row }">
              <el-button
                type="danger"
                text
                size="small"
                :icon="Trash2"
                @click="handleDeleteExport(row as TeacherExportJob)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="mc-empty">
          <div class="mc-empty__icon"><FileDown :size="24" /></div>
          <p class="mc-empty__title">暂无导出记录</p>
          <p class="mc-empty__desc">点击上方「导出学生文件」或「一键导出基本信息」创建导出任务。</p>
        </div>
      </div>
    </div>

    <GradeImportPanel v-if="canImportGrade" />

    <el-dialog v-model="semesterDialogVisible" title="手动添加学期" width="400px">
      <el-form>
        <el-form-item label="学期名称">
          <el-input v-model="newSemester" placeholder="例如：2026-2027-1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="semesterDialogVisible = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </template>
    </el-dialog>

    <ResearchExportDialog
      v-model:visible="researchDialogVisible"
      @created="handleResearchCreated"
    />
  </div>
</template>

<style scoped lang="scss">
.archive-export {
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
  &__template-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }
  &__template-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  &__download {
    color: var(--el-color-primary);
    text-decoration: none;
    font-size: 13px;
    &:hover {
      text-decoration: underline;
    }
  }
  &__nodata {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
  &__expire-hint {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
