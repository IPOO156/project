<script setup lang="ts">
/**
 * GradeImportPanel - 成绩导入（档案导出页内嵌面板，仅超管可见）
 *
 * 对接后端成绩导入模块（/admin/grades + /admin/grade-import-configs）：
 * - 上传成绩文件（先 /common/upload 拿 fileId，再 POST /admin/grades/import 建异步任务）
 * - 导入历史列表 / 详情（失败明细）/ 下载导入模板
 * - 导入配置查看与编辑（列定义/扩展名/大小/批次/覆盖策略）
 */
import type { UploadFile } from 'element-plus'
import type {
  GradeImportConfigColumn,
  GradeImportConfigItem,
  GradeImportConfigPayload,
  GradeImportDetail,
  GradeImportListItem,
  SemesterItem,
} from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, FileUp, RefreshCw, Search, Settings2, Trash2, Upload } from 'lucide-vue-next'

import { onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  createGradeImportConfig,
  deleteGradeImportConfig,
  downloadGradeImportTemplate,
  getGradeImportConfig,
  getGradeImportDetail,
  getSemesters,
  listGradeImports,
  submitGradeImport,
  updateGradeImportConfig,
  uploadFile,
} from '@/shared/api/teacher'

/* ── 响应式数据 ── */

const semesters = ref<SemesterItem[]>([])
const historyList = ref<GradeImportListItem[]>([])
const historyTotal = ref(0)
const historyLoading = ref(false)
const page = ref(1)
const perPage = ref(20)
const filters = reactive({
  semesterId: undefined as number | undefined,
  importStatus: undefined as number | undefined,
})

const importDialogVisible = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)
const importSemesterId = ref<number | null>(null)
const importOverwrite = ref(false)

const detailDrawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<GradeImportDetail | null>(null)
const detailFileName = ref('')

const configDialogVisible = ref(false)
const configSaving = ref(false)
const configExists = ref(false)
const configId = ref<number | null>(null)
const configForm = reactive({
  allowedExtensions: [] as string[],
  maxFileSizeMb: 10,
  templateColumns: [] as GradeImportConfigColumn[],
  hasHeaderRow: 1,
  batchSize: 500,
  allowOverwrite: 0,
  status: 1,
})

/* ── 生命周期 ── */

onMounted(() => {
  void loadSemesters()
  void loadHistory()
  void loadConfig()
})

onUnmounted(stopPolling)

/* ── 方法函数 ── */

function importStatusType(status: number | null) {
  return status === 1 ? 'success' : status === 2 ? 'danger' : 'warning'
}

async function loadSemesters() {
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await listGradeImports({
      page: page.value,
      per_page: perPage.value,
      semesterId: filters.semesterId,
      importStatus: filters.importStatus,
    })
    historyList.value = res.list
    historyTotal.value = res.total
    if (res.list.some((r) => r.importStatus === 0)) startPolling()
    else stopPolling()
  } catch {
    historyList.value = []
    historyTotal.value = 0
  } finally {
    historyLoading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  void loadHistory()
}

function handleSearch() {
  page.value = 1
  void loadHistory()
}

function handleReset() {
  filters.semesterId = undefined
  filters.importStatus = undefined
  page.value = 1
  void loadHistory()
}

async function handleTemplateDownload() {
  try {
    await downloadGradeImportTemplate()
  } catch {
    ElMessage.error('模板下载失败')
  }
}

function handleFileChange(file: UploadFile) {
  importFile.value = file.raw ?? null
}

function handleFileRemove() {
  importFile.value = null
}

async function handleSubmitImport() {
  if (!importSemesterId.value) {
    ElMessage.warning('请先选择学期')
    return
  }
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的成绩文件')
    return
  }
  importing.value = true
  try {
    const fileResult = await uploadFile(importFile.value, 'grade', 'grade')
    const res = await submitGradeImport({
      semesterId: importSemesterId.value,
      fileId: fileResult.fileId,
      overwrite: importOverwrite.value,
    })
    ElMessage.success(
      `导入任务已创建（任务 ID: ${res.importId}），预计 ${res.estimatedSeconds ?? 60} 秒完成`,
    )
    importDialogVisible.value = false
    importFile.value = null
    void loadHistory()
  } catch {
    /* 拦截器已提示 */
  } finally {
    importing.value = false
  }
}

async function openDetail(row: GradeImportListItem) {
  detailDrawerVisible.value = true
  detailLoading.value = true
  detailFileName.value = row.fileName ?? ''
  try {
    detail.value = await getGradeImportDetail(row.id)
    if (detail.value.importStatus === 0) startDetailPolling(row.id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function handleDrawerClosed() {
  stopDetailPolling()
}

async function loadConfig() {
  try {
    const cfg = await getGradeImportConfig()
    configExists.value = true
    configId.value = cfg.id
    syncConfigForm(cfg)
  } catch {
    configExists.value = false
    configId.value = null
  }
}

function syncConfigForm(cfg: GradeImportConfigItem) {
  configForm.allowedExtensions = [...(cfg.allowedExtensions ?? [])]
  configForm.maxFileSizeMb = cfg.maxFileSize ? Math.round(cfg.maxFileSize / 1024 / 1024) : 10
  configForm.templateColumns = (cfg.templateColumns ?? []).map((c) => ({ ...c }))
  configForm.hasHeaderRow = cfg.hasHeaderRow ?? 1
  configForm.batchSize = cfg.batchSize ?? 500
  configForm.allowOverwrite = cfg.allowOverwrite ?? 0
  configForm.status = cfg.status ?? 1
}

function resetConfigForm() {
  configId.value = null
  configForm.allowedExtensions = ['xlsx', 'csv']
  configForm.maxFileSizeMb = 10
  configForm.templateColumns = [
    { field: 'studentNo', label: '学号', required: true },
    { field: 'courseName', label: '课程名称', required: true },
    { field: 'score', label: '成绩', required: true },
    { field: 'semesterName', label: '学期', required: false },
  ]
  configForm.hasHeaderRow = 1
  configForm.batchSize = 500
  configForm.allowOverwrite = 0
  configForm.status = 1
}

function openConfig() {
  if (!configExists.value) resetConfigForm()
  configDialogVisible.value = true
}

function addConfigColumn() {
  configForm.templateColumns.push({ field: '', label: '', required: false })
}

function removeConfigColumn(index: number) {
  configForm.templateColumns.splice(index, 1)
}

async function handleSaveConfig() {
  if (!configForm.allowedExtensions.length) {
    ElMessage.warning('请至少配置一个允许的扩展名')
    return
  }
  if (!configForm.templateColumns.length) {
    ElMessage.warning('请至少配置一列模板字段')
    return
  }
  configSaving.value = true
  const payload: GradeImportConfigPayload = {
    allowedExtensions: configForm.allowedExtensions,
    maxFileSize: configForm.maxFileSizeMb * 1024 * 1024,
    templateColumns: configForm.templateColumns,
    hasHeaderRow: configForm.hasHeaderRow,
    batchSize: configForm.batchSize,
    allowOverwrite: configForm.allowOverwrite,
    status: configForm.status,
  }
  try {
    if (configExists.value && configId.value != null) {
      await updateGradeImportConfig(configId.value, payload)
    } else {
      await createGradeImportConfig(payload)
    }
    ElMessage.success('导入配置已保存')
    configDialogVisible.value = false
    void loadConfig()
  } catch {
    /* 拦截器已提示 */
  } finally {
    configSaving.value = false
  }
}

async function handleDeleteConfig() {
  if (configId.value == null) return
  try {
    await ElMessageBox.confirm('确定删除导入配置吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteGradeImportConfig(configId.value)
    ElMessage.success('导入配置已删除')
    configDialogVisible.value = false
    configExists.value = false
    resetConfigForm()
  } catch {
    /* 拦截器已提示 */
  }
}

/* ── 导入任务轮询（历史列表/详情）── */

let pollTimer: ReturnType<typeof setInterval> | null = null
let detailPollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => {
    void loadHistory()
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startDetailPolling(importId: number) {
  stopDetailPolling()
  detailPollTimer = setInterval(async () => {
    try {
      detail.value = await getGradeImportDetail(importId)
      if (detail.value.importStatus !== 0) stopDetailPolling()
    } catch {
      stopDetailPolling()
    }
  }, 3000)
}

function stopDetailPolling() {
  if (detailPollTimer) {
    clearInterval(detailPollTimer)
    detailPollTimer = null
  }
}
</script>

<template>
  <div class="mc-card">
    <div class="mc-card__head">
      <span class="mc-card__title">成绩导入</span>
      <div class="grade-import__actions">
        <el-button :icon="Download" plain @click="handleTemplateDownload">下载导入模板</el-button>
        <el-button :icon="Settings2" plain @click="openConfig">导入配置</el-button>
        <el-button :icon="RefreshCw" :loading="historyLoading" @click="loadHistory">刷新</el-button>
        <el-button type="primary" :icon="FileUp" @click="importDialogVisible = true"
          >导入成绩</el-button
        >
      </div>
    </div>

    <div class="mc-card__body">
      <div class="mc-filter-bar grade-import__filter">
        <el-form inline @submit.prevent>
          <el-form-item label="学期">
            <el-select
              v-model="filters.semesterId"
              clearable
              placeholder="全部学期"
              style="width: 200px"
            >
              <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filters.importStatus"
              clearable
              placeholder="全部状态"
              style="width: 140px"
            >
              <el-option label="导入中" :value="0" />
              <el-option label="完成" :value="1" />
              <el-option label="失败" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="historyLoading" :data="historyList" stripe style="width: 100%">
        <el-table-column prop="semesterName" label="学期" min-width="140" />
        <el-table-column prop="fileName" label="文件名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="totalCount" label="总记录" width="80" align="center" />
        <el-table-column prop="successCount" label="成功" width="70" align="center" />
        <el-table-column prop="failCount" label="失败" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="importStatusType(row.importStatus)" size="small">
              {{ row.importStatusLabel ?? '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="170" />
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click="openDetail(row as GradeImportListItem)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="grade-import__pagination">
        <el-pagination
          :current-page="page"
          :page-size="perPage"
          :total="historyTotal"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog v-model="importDialogVisible" title="导入学生成绩" width="480px">
      <el-form label-width="90px">
        <el-form-item label="所属学期" required>
          <el-select
            v-model="importSemesterId"
            placeholder="请选择学期"
            style="width: 100%"
            :loading="!semesters.length"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="成绩文件" required>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".xlsx,.csv"
            style="width: 100%"
          >
            <div class="grade-import__upload">
              <Upload :size="36" class="grade-import__upload-icon" />
              <p class="grade-import__upload-title">拖拽文件到此处，或点击选择</p>
              <p class="grade-import__upload-desc">仅支持 .xlsx / .csv 格式</p>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="覆盖已存在">
          <el-switch v-model="importOverwrite" />
          <span class="grade-import__hint">开启后同学生同课程已有成绩将被覆盖</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleSubmitImport">
          {{ importing ? '正在上传并创建任务…' : '开始导入' }}
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawerVisible"
      title="导入详情"
      size="42%"
      :destroy-on-close="true"
      @closed="handleDrawerClosed"
    >
      <div v-loading="detailLoading" class="grade-import__detail">
        <template v-if="detail">
          <div class="grade-import__detail-summary">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="学期">{{
                detail.semesterName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="文件名">{{
                detailFileName || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="操作人">{{
                detail.operatorName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="importStatusType(detail.importStatus)" size="small">
                  {{ detail.importStatusLabel ?? '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总记录数">{{
                detail.totalCount ?? 0
              }}</el-descriptions-item>
              <el-descriptions-item label="成功 / 失败">
                {{ detail.successCount ?? 0 }} / {{ detail.failCount ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">{{
                detail.startedAt ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{
                detail.completedAt ?? '-'
              }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="grade-import__detail-section">
            <p class="grade-import__detail-title">失败明细（{{ detail.failDetails.length }} 条）</p>
            <el-table
              v-if="detail.failDetails.length"
              :data="detail.failDetails"
              stripe
              max-height="360"
              style="width: 100%"
            >
              <el-table-column prop="row" label="行号" width="80" align="center" />
              <el-table-column prop="studentNo" label="学号" width="130" />
              <el-table-column prop="reason" label="失败原因" min-width="200" />
            </el-table>
            <el-empty v-else description="无失败明细" :image-size="72" />
          </div>
        </template>
        <el-empty v-else description="暂无详情数据" :image-size="72" />
      </div>
    </el-drawer>

    <el-dialog v-model="configDialogVisible" title="成绩导入配置" width="640px">
      <el-form label-width="110px">
        <el-form-item label="允许扩展名">
          <el-select
            v-model="configForm.allowedExtensions"
            multiple
            allow-create
            filterable
            default-first-option
            placeholder="如 xlsx / csv"
            style="width: 100%"
          >
            <el-option v-for="ext in ['xlsx', 'csv']" :key="ext" :label="ext" :value="ext" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大文件大小">
          <el-input-number v-model="configForm.maxFileSizeMb" :min="1" :max="100" />
          <span class="grade-import__hint">MB</span>
        </el-form-item>
        <el-form-item label="模板列定义">
          <div class="grade-import__columns">
            <div
              v-for="(col, index) in configForm.templateColumns"
              :key="index"
              class="grade-import__column-row"
            >
              <el-input
                v-model="col.field"
                placeholder="字段名（如 studentNo）"
                style="width: 170px"
              />
              <el-input v-model="col.label" placeholder="表头名称" style="width: 140px" />
              <el-checkbox v-model="col.required">必填</el-checkbox>
              <el-button
                text
                type="danger"
                size="small"
                :icon="Trash2"
                @click="removeConfigColumn(index)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" @click="addConfigColumn">+ 添加列</el-button>
          </div>
        </el-form-item>
        <el-form-item label="首行为表头">
          <el-switch v-model="configForm.hasHeaderRow" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="单批处理行数">
          <el-input-number v-model="configForm.batchSize" :min="1" :max="5000" :step="100" />
        </el-form-item>
        <el-form-item label="允许覆盖">
          <el-switch v-model="configForm.allowOverwrite" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用配置">
          <el-switch v-model="configForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button v-if="configExists" type="danger" plain @click="handleDeleteConfig"
          >删除配置</el-button
        >
        <el-button type="primary" :loading="configSaving" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.grade-import {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
  &__filter {
    padding: 0 0 14px;
    margin-bottom: 4px;
    background: transparent;
    border: none;
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
  &__upload {
    padding: $spacing-lg;
    text-align: center;
    &-icon {
      color: var(--el-color-primary);
      margin-bottom: 6px;
    }
    &-title {
      font-size: 14px;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }
    &-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__detail {
    &-summary {
      margin-bottom: $spacing-lg;
    }
    &-section {
      margin-top: $spacing-md;
    }
    &-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 $spacing-sm;
    }
  }
  &__columns {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  &__column-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
