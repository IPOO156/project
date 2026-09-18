<script setup lang="ts">
/**
 * SemesterManagement - 学期管理（教师端）
 * 对接后端 /admin/semesters（列表/创建/更新/设为当前/启停/导入/模板下载）。
 * schoolId 为可选字段，创建/导入时不提供；列表展示后端返回的 schoolName。
 */

// ── 1. 外部依赖导入 ──
import type { UploadFile } from 'element-plus'
import type {
  SemesterImportResult,
  SemesterListItem,
  SemesterSavePayload,
} from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, FileUp, Plus, RefreshCw, Search, Upload } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref } from 'vue'
import {
  createSemester,
  downloadSemesterImportTemplate,
  importSemesters,
  listSemesters,
  setCurrentSemester,
  updateSemester,
  updateSemesterStatus,
  uploadFile,
} from '@/shared/api/teacher'
import { COMMON_STATUS } from '@/shared/constants/dict'

// ── 2. 类型/接口定义 ──
type DateRange = [string, string] | null

// ── 3. Props & Emits（顶层页面，无）──

// ── 4. Store / Composable（直接调用 API，无）──

// ── 5. 响应式数据 ──
const loading = ref(false)
const list = ref<SemesterListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const filters = reactive({
  status: undefined as number | undefined,
})

// 新增/编辑学期弹窗
const dialogVisible = ref(false)
const dialogSaving = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  name: '',
  dateRange: null as DateRange,
})

// 学期导入
const importDialogVisible = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)
const importOverwrite = ref(false)
const importResult = ref<SemesterImportResult | null>(null)
const resultDialogVisible = ref(false)

// ── 6. Computed ──
const dialogTitle = computed(() => (isEdit.value ? '编辑学期' : '新增学期'))
const statusOptions = computed(() =>
  Object.entries(COMMON_STATUS)
    .map(([value, info]) => ({ value: Number(value), label: info.label }))
    .sort((a, b) => b.value - a.value),
)

// ── 7. Watch（无）──

// ── 8. 生命周期 ──
onMounted(() => void load())

// ── 9. 方法函数 ──
async function load() {
  loading.value = true
  try {
    const res = await listSemesters({
      status: filters.status,
      page: page.value,
      per_page: perPage.value,
    })
    list.value = res.list
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  void load()
}

function handleReset() {
  filters.status = undefined
  page.value = 1
  void load()
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

function statusInfo(status: number | null): { label: string; tag: 'success' | 'danger' } | null {
  if (status == null) return null
  return COMMON_STATUS[status] ?? null
}

function dateRangeText(row: SemesterListItem) {
  if (!row.startDate && !row.endDate) return '-'
  return `${row.startDate ?? ''} ~ ${row.endDate ?? ''}`
}

function rowClassName({ row }: { row: SemesterListItem }) {
  return row.isCurrent === 1 ? 'semester-management__row-current' : ''
}

// 新增/编辑
function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  form.dateRange = null
  dialogVisible.value = true
}

function openEdit(row: SemesterListItem) {
  isEdit.value = true
  editingId.value = row.semesterId
  form.name = row.name
  form.dateRange = row.startDate && row.endDate ? [row.startDate, row.endDate] : null
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写学期名称')
    return
  }
  const range = form.dateRange
  if (!range || range.length !== 2) {
    ElMessage.warning('请选择起止日期')
    return
  }
  const payload: SemesterSavePayload = {
    name: form.name.trim(),
    startDate: range[0],
    endDate: range[1],
  }
  dialogSaving.value = true
  try {
    if (isEdit.value && editingId.value != null) {
      await updateSemester(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createSemester(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    dialogSaving.value = false
  }
}

// 设为当前学期
async function handleSetCurrent(row: SemesterListItem) {
  try {
    await ElMessageBox.confirm(`确定将学期「${row.name}」设为当前学期吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await setCurrentSemester(row.semesterId)
    ElMessage.success('已设为当前学期')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

// 启用/禁用
async function handleToggleStatus(row: SemesterListItem) {
  const next = row.status === 1 ? 0 : 1
  const action = next === 1 ? '启用' : '禁用'
  try {
    await updateSemesterStatus(row.semesterId, next)
    ElMessage.success(`已${action}`)
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

// 导入
async function handleTemplateDownload() {
  try {
    await downloadSemesterImportTemplate()
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
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的学期文件')
    return
  }
  importing.value = true
  try {
    const fileResult = await uploadFile(importFile.value, 'excel', 'semester')
    const res = await importSemesters({
      fileId: fileResult.fileId,
      overwrite: importOverwrite.value,
    })
    importResult.value = res
    importDialogVisible.value = false
    importFile.value = null
    importOverwrite.value = false
    resultDialogVisible.value = true
    ElMessage.success(`导入完成：成功 ${res.successCount} 条，失败 ${res.failCount} 条`)
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    importing.value = false
  }
}

// 查看最近一次导入结果
function openImportResult() {
  if (!importResult.value) {
    ElMessage.info('暂无导入结果，请先执行导入')
    return
  }
  resultDialogVisible.value = true
}
</script>

<template>
  <div class="mc-page semester-management">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">学期管理 · Semesters</p>
        <h2 class="mc-page-head__title">学期管理</h2>
        <p class="mc-page-head__desc">维护学期信息，设置当前学期，并支持批量导入学期。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增学期</el-button>
        <el-button type="primary" :icon="FileUp" @click="importDialogVisible = true">
          导入学期
        </el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">学期列表</span>
        <span class="semester-management__total">共 {{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table
          v-loading="loading"
          :data="list"
          :row-class-name="rowClassName"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" label="学期名称" min-width="120" />
          <el-table-column label="所属学校" min-width="110">
            <template #default="{ row }">{{ row.schoolName ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="起止日期" width="180">
            <template #default="{ row }">{{ dateRangeText(row as SemesterListItem) }}</template>
          </el-table-column>
          <el-table-column label="当前学期" width="72" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isCurrent === 1" type="success" size="small">当前</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="72" align="center">
            <template #default="{ row }">
              <el-tag :type="statusInfo(row.status)?.tag ?? 'info'" size="small">
                {{ statusInfo(row.status)?.label ?? row.statusLabel ?? '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="120">
            <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" align="center">
            <template #default="{ row }">
              <div class="semester-management__actions">
                <el-button
                  v-if="row.isCurrent !== 1"
                  text
                  type="primary"
                  size="small"
                  @click="handleSetCurrent(row as SemesterListItem)"
                >
                  设为当前
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="openEdit(row as SemesterListItem)"
                >
                  编辑
                </el-button>
                <el-button
                  text
                  :type="row.status === 1 ? 'danger' : 'success'"
                  size="small"
                  @click="handleToggleStatus(row as SemesterListItem)"
                >
                  {{ row.status === 1 ? '禁用' : '启用' }}
                </el-button>
                <el-button text type="primary" size="small" @click="openImportResult">
                  导入结果
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="semester-management__pagination">
          <el-pagination
            :current-page="page"
            :page-size="perPage"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑学期弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="90px">
        <el-form-item label="学期名称" required>
          <el-input
            v-model="form.name"
            placeholder="如 2025-2026 第一学期"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="起止日期" required>
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="dialogSaving" @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialogSaving"
          :disabled="dialogSaving"
          @click="handleSave"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入学期弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入学期" width="480px">
      <el-form label-width="90px">
        <el-form-item label="导入模板">
          <el-button :icon="Download" plain @click="handleTemplateDownload">下载模板</el-button>
        </el-form-item>
        <el-form-item label="学期文件" required>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".xlsx"
            style="width: 100%"
          >
            <div class="semester-management__upload">
              <Upload :size="36" class="semester-management__upload-icon" />
              <p class="semester-management__upload-title">拖拽文件到此处，或点击选择</p>
              <p class="semester-management__upload-desc">仅支持 .xlsx 格式</p>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="覆盖已存在">
          <el-switch v-model="importOverwrite" />
          <span class="semester-management__hint">开启后已存在的同名学期将被覆盖</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="importing" @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="importing"
          @click="handleSubmitImport"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入结果弹窗 -->
    <el-dialog v-model="resultDialogVisible" title="学期导入结果" width="640px">
      <template v-if="importResult">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总记录">{{ importResult.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ importResult.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ importResult.failCount }}</el-descriptions-item>
        </el-descriptions>
        <div class="semester-management__result-section">
          <p class="semester-management__result-title">
            失败明细（{{ importResult.failures.length }} 条）
          </p>
          <el-table
            v-if="importResult.failures.length"
            :data="importResult.failures"
            stripe
            max-height="360"
            style="width: 100%"
          >
            <el-table-column prop="row" label="行号" width="90" align="center" />
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="reason" label="失败原因" min-width="240" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="无失败明细" :image-size="72" />
        </div>
      </template>
      <el-empty v-else description="暂无导入结果" :image-size="72" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.semester-management {
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

  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }

  &__result-section {
    margin-top: $spacing-md;
  }

  &__result-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 $spacing-sm;
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
}

:deep(.semester-management__row-current) {
  background-color: var(--el-color-primary-light-9);
}
</style>
