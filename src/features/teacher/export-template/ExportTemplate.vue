<script setup lang="ts">
/**
 * ExportTemplate - 导出模板管理
 * 对接后端 /admin/export-templates（列表/创建/更新/删除/设置默认/启停/详情/预览图）。
 */
import type { ExportTemplateItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Eye, Plus, RefreshCw } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createExportTemplate,
  deleteExportTemplate,
  listExportTemplates,
  setDefaultExportTemplate,
  updateExportTemplate,
  updateExportTemplateStatus,
} from '@/shared/api/teacher'
import ExportTemplateDetailDrawer from './components/ExportTemplateDetailDrawer.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<ExportTemplateItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

const exportTypeOptions = [
  { value: 'student_archive', label: '学生档案' },
  { value: 'career_plan', label: '职业规划' },
  { value: 'resume', label: '简历' },
]

async function load() {
  loading.value = true
  try {
    const res = await listExportTemplates({ page: page.value, per_page: perPage.value })
    list.value = res.list
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

// ── 新增/编辑弹窗 ──
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  templateName: '',
  templateCode: '',
  exportType: 'student_archive',
  scopeType: 1,
  templateMode: 1,
  paperSize: 'A4',
  orientation: 1,
})

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.templateName = ''
  form.templateCode = ''
  form.exportType = 'student_archive'
  form.scopeType = 1
  form.templateMode = 1
  form.paperSize = 'A4'
  form.orientation = 1
  dialogVisible.value = true
}

function openEdit(row: ExportTemplateItem) {
  isEdit.value = true
  editingId.value = row.id
  form.templateName = row.templateName
  form.templateCode = row.templateCode
  form.exportType = row.exportType
  form.scopeType = row.scopeType ?? 1
  form.templateMode = row.templateMode ?? 1
  form.paperSize = row.paperSize ?? 'A4'
  form.orientation = row.orientation ?? 1
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.templateName.trim() || !form.templateCode.trim()) {
    ElMessage.warning('请填写模板名称和编码')
    return
  }
  if (saving.value) return
  saving.value = true
  try {
    if (isEdit.value && editingId.value != null) {
      await updateExportTemplate(editingId.value, {
        templateName: form.templateName.trim(),
        templateCode: form.templateCode.trim(),
        scopeType: form.scopeType,
        templateMode: form.templateMode,
        paperSize: form.paperSize,
        orientation: form.orientation,
      })
      ElMessage.success('更新成功')
    } else {
      await createExportTemplate({
        templateName: form.templateName.trim(),
        templateCode: form.templateCode.trim(),
        exportType: form.exportType,
        scopeType: form.scopeType,
        templateMode: form.templateMode,
        paperSize: form.paperSize,
        orientation: form.orientation,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: ExportTemplateItem) {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.templateName}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteExportTemplate(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleSetDefault(row: ExportTemplateItem) {
  try {
    await setDefaultExportTemplate(row.id)
    ElMessage.success('已设为默认模板')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleToggleStatus(row: ExportTemplateItem) {
  const next = row.status === 1 ? 0 : 1
  try {
    await updateExportTemplateStatus(row.id, next)
    row.status = next
    row.statusLabel = next === 1 ? '启用' : '禁用'
    ElMessage.success(next === 1 ? '已启用' : '已禁用')
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 模板详情（/admin/export-templates/{id} + 预览图上传）──
const detailDrawerVisible = ref(false)
const detailTemplateId = ref(0)
const detailTemplateName = ref('')
const detailPreviewImage = ref<string | null>(null)

function openDetail(row: ExportTemplateItem) {
  detailTemplateId.value = row.id
  detailTemplateName.value = row.templateName
  detailPreviewImage.value = row.previewImage
  detailDrawerVisible.value = true
}

onMounted(() => void load())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">导出模板</h2>
        <p class="mc-page-head__desc">管理档案导出、职业规划、简历等 PDF 导出模板。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增模板</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe style="width: 100%">
          <el-table-column
            prop="templateName"
            label="模板名称"
            min-width="130"
            show-overflow-tooltip
          />
          <el-table-column
            prop="templateCode"
            label="模板编码"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column label="导出类型" min-width="80" show-overflow-tooltip>
            <template #default="{ row }">{{ row.exportTypeLabel ?? row.exportType }}</template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="60" align="center" />
          <el-table-column label="默认" width="60" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdByName" label="创建人" min-width="60" show-overflow-tooltip>
            <template #default="{ row }">{{ row.createdByName ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ row.updatedAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="270" align="center">
            <template #default="{ row }">
              <div class="export-template__actions">
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="Eye"
                  @click="openDetail(row as ExportTemplateItem)"
                >
                  详情
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="openEdit(row as ExportTemplateItem)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="row.isDefault !== 1"
                  text
                  type="primary"
                  size="small"
                  @click="handleSetDefault(row as ExportTemplateItem)"
                >
                  设默认
                </el-button>
                <el-button
                  text
                  :type="row.status === 1 ? 'danger' : 'success'"
                  size="small"
                  @click="handleToggleStatus(row as ExportTemplateItem)"
                >
                  {{ row.status === 1 ? '禁用' : '启用' }}
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  @click="handleDelete(row as ExportTemplateItem)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="export-template__pagination">
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

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑导出模板' : '新增导出模板'"
      width="520px"
    >
      <el-form label-width="90px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.templateName" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="模板编码" required>
          <el-input v-model="form.templateCode" placeholder="模板编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="导出类型" required>
          <el-select v-model="form.exportType" :disabled="isEdit" style="width: 100%">
            <el-option
              v-for="t in exportTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="纸张">
          <el-select v-model="form.paperSize" style="width: 100%">
            <el-option label="A4" value="A4" />
            <el-option label="A3" value="A3" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-radio-group v-model="form.orientation">
            <el-radio :value="1">纵向</el-radio>
            <el-radio :value="2">横向</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <ExportTemplateDetailDrawer
      v-model:visible="detailDrawerVisible"
      :template-id="detailTemplateId"
      :template-name="detailTemplateName"
      :initial-preview-image="detailPreviewImage"
    />
  </div>
</template>

<style scoped lang="scss">
.export-template {
  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;

    // 去掉相邻按钮默认 12px 间距，保证操作按钮一排排布
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
