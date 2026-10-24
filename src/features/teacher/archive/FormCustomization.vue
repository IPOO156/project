<script setup lang="ts">
import type { FormTemplateDetail, FormTemplateItem } from '@/shared/types/teacher'
/**
 * FormCustomization - 表单自定义（管理端）
 * 对接 /admin/form-templates 全量 CRUD：
 *   GET/POST /admin/form-templates、GET/PUT/DELETE /admin/form-templates/{id}、PUT /{id}/default
 * 类别固定为 archive（后端仅支持该类别），字段类型支持 input/textarea/number/select/radio/checkbox/date/upload/switch。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createFormTemplate,
  deleteFormTemplate,
  getFormTemplateDetail,
  listFormTemplates,
  setDefaultFormTemplate,
  updateFormTemplate,
} from '@/shared/api/teacher-api'
import FormFieldConfig from './FormFieldConfig.vue'
import FormTemplateTable from './FormTemplateTable.vue'

/** 字段编辑器（UI 层）——options 用字符串数组，提交时转换为后端 {value,label} 结构 */
interface FieldEditor {
  key: string
  label: string
  type: string
  required: boolean
  placeholder: string
  options: string[]
  sort: number
}

/** 后端 options（可能为 [{value,label}] 或历史字符串数组）统一转为编辑器字符串 */
function normalizeOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return []
  return options
    .map((o) => {
      if (typeof o === 'string') return o
      const obj = o as { value?: unknown; label?: unknown }
      return String(obj.label ?? obj.value ?? '').trim()
    })
    .filter(Boolean)
}

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: 'archive', label: '档案' },
  { value: 'award', label: '奖项' },
  { value: 'career_plan', label: '职业规划' },
]
const fieldTypeOptions = [
  { value: 'input', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'date', label: '日期' },
  { value: 'upload', label: '文件上传' },
  { value: 'switch', label: '开关' },
]

// ── 列表 ──
const loading = ref(false)
const list = ref<FormTemplateItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const filters = reactive({
  category: '',
  status: '' as number | '',
  keyword: '',
})

async function loadList() {
  loading.value = true
  try {
    const res = await listFormTemplates({
      category: filters.category || undefined,
      status: filters.status || undefined,
      keyword: filters.keyword.trim() || undefined,
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

function handleSearch() {
  page.value = 1
  void loadList()
}

function handleReset() {
  filters.category = ''
  filters.status = ''
  filters.keyword = ''
  handleSearch()
}

// ── 新建 / 编辑 ──
const dialogVisible = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const loadingDetail = ref(false)
const editingId = ref(0)

const form = reactive({
  templateName: '',
  code: '',
  category: 'archive',
  description: '',
  applicableRoles: [] as string[],
  fields: [] as FieldEditor[],
  status: 1,
})

function emptyField(): FieldEditor {
  return {
    key: '',
    label: '',
    type: 'input',
    required: false,
    placeholder: '',
    options: [],
    sort: 0,
  }
}

function addField() {
  form.fields.push(emptyField())
}

function removeField(index: number) {
  form.fields.splice(index, 1)
}

function openCreate() {
  editingId.value = 0
  form.templateName = ''
  form.code = ''
  form.category = 'archive'
  form.description = ''
  form.applicableRoles = []
  form.fields = [emptyField()]
  form.status = 1
  dialogVisible.value = true
}

async function openEdit(item: FormTemplateItem) {
  editingId.value = item.id
  dialogVisible.value = true
  loadingDetail.value = true
  try {
    const detail = (await getFormTemplateDetail(item.id)) as FormTemplateDetail
    form.templateName = detail.templateName
    form.code = detail.code
    form.category = detail.category || 'archive'
    form.description = detail.description ?? ''
    form.applicableRoles = detail.applicableRoles ?? []
    form.fields = detail.fields?.length
      ? (
          detail.fields as Array<{
            key: string
            label: string
            type: string
            required?: boolean
            placeholder?: string | null
            options?: unknown
            sort?: number | null
          }>
        ).map((f) => ({
          key: f.key ?? '',
          label: f.label ?? '',
          type: f.type ?? 'input',
          required: !!f.required,
          placeholder: f.placeholder ?? '',
          options: normalizeOptions(f.options),
          sort: f.sort ?? 0,
        }))
      : [emptyField()]
    form.status = detail.status ?? 1
  } catch (e) {
    dialogVisible.value = false
    // 404 走拦截器静默降级（接口未实现），此处兜底提示；其余错误拦截器已统一提示
    if ((e as { response?: { status?: number } })?.response?.status === 404) {
      ElMessage.error('模板详情加载失败')
    }
  } finally {
    loadingDetail.value = false
  }
}

function validateForm(): boolean {
  if (!form.templateName.trim()) {
    ElMessage.warning('请输入模板名称')
    return false
  }
  if (!form.code.trim()) {
    ElMessage.warning('请输入模板编码')
    return false
  }
  const invalidField = form.fields.find((f) => !f.label.trim() || !f.key.trim())
  if (invalidField) {
    ElMessage.warning('请完整填写每个字段的标签与字段标识')
    return false
  }
  return true
}

async function handleSave() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      templateName: form.templateName.trim(),
      code: form.code.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      applicableRoles: form.applicableRoles,
      fields: form.fields.map((f) => ({
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        required: f.required,
        placeholder: f.placeholder?.trim() || undefined,
        options:
          f.type === 'select' || f.type === 'radio' || f.type === 'checkbox'
            ? f.options
                .filter((o) => String(o).trim())
                .map((o) => ({ value: o.trim(), label: o.trim() }))
            : undefined,
        sort: f.sort ?? 0,
      })),
      status: form.status,
    }
    if (editingId.value) {
      await updateFormTemplate(editingId.value, payload)
      ElMessage.success('模板已更新')
    } else {
      await createFormTemplate(payload)
      ElMessage.success('模板已创建')
    }
    dialogVisible.value = false
    await loadList()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

// ── 设为默认 ──
async function handleSetDefault(item: FormTemplateItem) {
  try {
    await ElMessageBox.confirm(`确认将「${item.templateName}」设为默认模板？`, '设为默认', {
      confirmButtonText: '设为默认',
      cancelButtonText: '取消',
      type: 'info',
    })
  } catch {
    return
  }
  try {
    await setDefaultFormTemplate(item.id)
    ElMessage.success('已设为默认模板')
    await loadList()
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 删除 ──
async function handleDelete(item: FormTemplateItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除模板「${item.templateName}」？删除后不可恢复。`,
      '删除模板',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deleteFormTemplate(item.id)
    ElMessage.success('模板已删除')
    await loadList()
  } catch {
    /* 拦截器已提示 */
  } finally {
    deletingId.value = null
  }
}

const formCategories = computed(() => categoryOptions.filter((c) => c.value !== ''))

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page form-customization">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">表单自定义</h2>
        <p class="mc-page-head__desc">
          维护学生端申报表单模板，新增模板、配置字段并设为默认（管理端功能）。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="Plus" type="primary" @click="openCreate">新建模板</el-button>
      </div>
    </div>

    <!--
      如实告知当前可用范围：模板/字段能存进后端，但后端除本模块的增删改查外
      没有任何模块读取表单模板（无实体/接口引用 form_templates，学生端申报页
      不按模板渲染、提交时也不校验模板字段），故此处调整字段不影响学生实际申报。
      待后端接入模板消费后删除本提示。
    -->
    <el-alert
      class="form-customization__notice"
      type="warning"
      :closable="false"
      show-icon
      title="模板尚未接入学生端：目前字段配置只保存在后端配置表中，后端还没有任何模块读取表单模板，学生的申报页面不会按这里的模板渲染，也不会按模板校验提交内容。"
    />

    <FormTemplateTable
      v-model:category="filters.category"
      v-model:status="filters.status"
      v-model:keyword="filters.keyword"
      v-model:page="page"
      v-model:per-page="perPage"
      :list="list"
      :total="total"
      :loading="loading"
      :deleting-id="deletingId"
      :category-options="categoryOptions"
      @search="handleSearch"
      @reset="handleReset"
      @current-change="loadList"
      @size-change="handleSearch"
      @edit="openEdit"
      @set-default="handleSetDefault"
      @delete="handleDelete"
    />

    <!-- 新建 / 编辑模板 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑模板' : '新建模板'"
      width="720px"
      top="6vh"
      destroy-on-close
    >
      <div v-loading="loadingDetail" class="form-customization__dialog">
        <el-form label-width="90px">
          <div class="form-customization__grid">
            <el-form-item label="模板名称" required>
              <el-input
                v-model="form.templateName"
                placeholder="例如：个人档案基本信息"
                maxlength="100"
              />
            </el-form-item>
            <el-form-item label="模板编码" required>
              <el-input
                v-model="form.code"
                placeholder="模板唯一编码，如 basic_info"
                maxlength="50"
                :disabled="editingId !== 0"
              />
            </el-form-item>
            <el-form-item label="分类" required>
              <el-select v-model="form.category" class="u-w-full" :disabled="editingId !== 0">
                <el-option
                  v-for="c in formCategories"
                  :key="c.value"
                  :label="c.label"
                  :value="c.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="适用角色">
              <el-select
                v-model="form.applicableRoles"
                class="u-w-full"
                multiple
                collapse-tags
                placeholder="不选则全部适用"
              >
                <el-option label="学生" value="student" />
                <el-option label="教师" value="teacher" />
                <el-option label="审核员" value="reviewer" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="模板说明">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="2"
              placeholder="模板用途说明（可选）"
            />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch
              v-model="form.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="停用"
            />
          </el-form-item>

          <FormFieldConfig
            :fields="form.fields"
            :field-type-options="fieldTypeOptions"
            @add="addField"
            @remove="removeField"
          />
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? '保存修改' : '创建模板' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.form-customization {
  &__notice {
    margin-bottom: $spacing-lg;
  }

  &__dialog {
    min-height: 200px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 $spacing-lg;
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
