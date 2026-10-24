<script setup lang="ts">
/**
 * ExportTemplate - 导出模板管理
 * 对接后端 /admin/export-templates（列表/创建/更新/删除/设置默认/启停/详情/预览图）。
 */
import type { ExportTemplateItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createExportTemplate,
  deleteExportTemplate,
  getExportTemplateDetail,
  listExportTemplates,
  setDefaultExportTemplate,
  updateExportTemplate,
  updateExportTemplateStatus,
} from '@/shared/api/teacher-api'
import RowActions from '@/shared/ui/RowActions.vue'
import { formatDateTime } from '@/shared/utils/time'
import ExportTemplateDetailDrawer from './ExportTemplateDetailDrawer.vue'

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
/** 正在执行行内动作（设默认/启停）的模板 id —— 二者均为行级写操作，共用一个 ref */
const actingId = ref<number | null>(null)
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
  /** 字段列表模式配置（JSON 文本，提交前解析） */
  fieldsConfigText: '',
  /** 自由模板模式 HTML */
  templateContent: '',
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
  form.fieldsConfigText = ''
  form.templateContent = ''
  dialogVisible.value = true
}

async function openEdit(row: ExportTemplateItem) {
  isEdit.value = true
  editingId.value = row.id
  form.templateName = row.templateName
  form.templateCode = row.templateCode
  form.exportType = row.exportType
  form.scopeType = row.scopeType ?? 1
  form.templateMode = row.templateMode ?? 1
  form.paperSize = row.paperSize ?? 'A4'
  form.orientation = row.orientation ?? 1
  form.fieldsConfigText = ''
  form.templateContent = ''
  dialogVisible.value = true
  // 列表接口不返回 fieldsConfig/templateContent（大字段），编辑时从详情补全，
  // 避免切换渲染模式后因缺少配套内容被后端拒绝。
  try {
    const detail = await getExportTemplateDetail(row.id)
    form.fieldsConfigText =
      detail.fieldsConfig == null ? '' : JSON.stringify(detail.fieldsConfig, null, 2)
    form.templateContent = detail.templateContent ?? ''
  } catch {
    /* 详情失败时保留列表字段，内容留空不提交 */
  }
}

/** 解析字段配置 JSON；非法时提示并返回 undefined */
function parseFieldsConfig(): unknown[] | undefined {
  const text = form.fieldsConfigText.trim()
  if (!text) return undefined
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) {
      ElMessage.warning('字段配置必须是 JSON 数组')
      return undefined
    }
    return parsed
  } catch {
    ElMessage.warning('字段配置不是合法的 JSON，请检查格式')
    return undefined
  }
}

async function handleSave() {
  if (!form.templateName.trim() || !form.templateCode.trim()) {
    ElMessage.warning('请填写模板名称和编码')
    return
  }
  // 后端 create 校验：mode=1 必须 fieldsConfig（非 null），mode=2 必须 templateContent 非空。
  // 前端提前拦截并给出可操作提示，避免提交后才收到 10002。
  let fieldsConfig: unknown[] | undefined
  if (form.templateMode === 1) {
    fieldsConfig = parseFieldsConfig()
    if (!fieldsConfig) {
      ElMessage.warning('字段列表模式需填写字段配置（JSON 数组）')
      return
    }
    if (fieldsConfig.length === 0) {
      ElMessage.warning('字段配置至少包含一个字段')
      return
    }
  } else if (!form.templateContent.trim()) {
    ElMessage.warning('自由模板模式需填写模板 HTML 内容')
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
        // 仅提交已填写的内容，避免详情拉取失败时空值覆盖原模板
        ...(fieldsConfig ? { fieldsConfig } : {}),
        ...(form.templateContent.trim() ? { templateContent: form.templateContent } : {}),
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
        ...(fieldsConfig ? { fieldsConfig } : {}),
        ...(form.templateMode === 2 ? { templateContent: form.templateContent } : {}),
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
  deletingId.value = row.id
  try {
    await deleteExportTemplate(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    deletingId.value = null
  }
}

async function handleSetDefault(row: ExportTemplateItem) {
  actingId.value = row.id
  try {
    await setDefaultExportTemplate(row.id)
    ElMessage.success('已设为默认模板')
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    actingId.value = null
  }
}

async function handleToggleStatus(row: ExportTemplateItem) {
  const next = row.status === 1 ? 0 : 1
  actingId.value = row.id
  try {
    await updateExportTemplateStatus(row.id, next)
    row.status = next
    row.statusLabel = next === 1 ? '启用' : '禁用'
    ElMessage.success(next === 1 ? '已启用' : '已禁用')
  } catch {
    /* 拦截器已提示 */
  } finally {
    actingId.value = null
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
        <el-table v-loading="loading" class="u-w-full" :data="list" stripe>
          <el-table-column
            prop="templateName"
            label="模板名称"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            prop="templateCode"
            label="模板编码"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column label="导出类型" width="110" show-overflow-tooltip>
            <template #default="{ row }">{{ row.exportTypeLabel ?? row.exportType }}</template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="60" align="center" />
          <!-- 标签「默认」约 38px + 单元格内边距 24px，60px 会裁掉右侧 -->
          <el-table-column label="默认" width="76" align="center">
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
          <el-table-column prop="createdByName" label="创建人" width="90" show-overflow-tooltip>
            <template #default="{ row }">{{ row.createdByName ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="145" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.updatedAt ? formatDateTime(row.updatedAt) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="156" align="center" fixed="right">
            <template #default="{ row }">
              <RowActions>
                <el-button
                  text
                  type="primary"
                  size="small"
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
                <template #more>
                  <el-dropdown-item
                    v-if="row.isDefault !== 1"
                    :disabled="actingId !== null"
                    @click="handleSetDefault(row as ExportTemplateItem)"
                  >
                    {{ actingId === (row as ExportTemplateItem).id ? '设置中…' : '设为默认' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    :disabled="actingId !== null"
                    @click="handleToggleStatus(row as ExportTemplateItem)"
                  >
                    {{ row.status === 1 ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    class="row-actions__danger"
                    :disabled="deletingId !== null"
                    @click="handleDelete(row as ExportTemplateItem)"
                  >
                    {{ deletingId === (row as ExportTemplateItem).id ? '删除中…' : '删除' }}
                  </el-dropdown-item>
                </template>
              </RowActions>
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
          <el-select v-model="form.exportType" class="u-w-full" :disabled="isEdit">
            <el-option
              v-for="t in exportTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="纸张">
          <el-select v-model="form.paperSize" class="u-w-full">
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
        <el-form-item label="渲染模式" required>
          <el-radio-group v-model="form.templateMode">
            <el-radio :value="1">字段列表</el-radio>
            <el-radio :value="2">自由模板</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.templateMode === 1" label="字段配置" required>
          <el-input
            v-model="form.fieldsConfigText"
            type="textarea"
            :rows="6"
            placeholder='JSON 数组，例如 [{"key":"studentName","name":"姓名","path":"users.name","source":"variable"}]'
          />
        </el-form-item>
        <el-form-item v-else label="模板内容" required>
          <el-input
            v-model="form.templateContent"
            type="textarea"
            :rows="6"
            placeholder="完整 HTML 模板内容"
          />
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
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
