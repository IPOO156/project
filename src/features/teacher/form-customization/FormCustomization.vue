<script setup lang="ts">
import type { FormTemplateDetail, FormTemplateItem } from '@/shared/types/teacher'
/**
 * FormCustomization - 表单自定义（管理端）
 * 对接 /admin/form-templates 全量 CRUD：
 *   GET/POST /admin/form-templates、GET/PUT/DELETE /admin/form-templates/{id}、PUT /{id}/default
 * 类别固定为 archive（后端仅支持该类别），字段类型支持 input/textarea/number/select/radio/checkbox/date/upload/switch。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw, Search, SlidersHorizontal, Star, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createFormTemplate,
  deleteFormTemplate,
  getFormTemplateDetail,
  listFormTemplates,
  setDefaultFormTemplate,
  updateFormTemplate,
} from '@/shared/api/teacher'

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
  } catch {
    dialogVisible.value = false
    ElMessage.error('模板详情加载失败')
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
  try {
    await deleteFormTemplate(item.id)
    ElMessage.success('模板已删除')
    await loadList()
  } catch {
    /* 拦截器已提示 */
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

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="分类">
          <el-select v-model="filters.category" clearable style="width: 140px">
            <el-option
              v-for="c in categoryOptions"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="模板名称 / 编码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title"><SlidersHorizontal :size="15" /> 模板列表</span>
        <span class="form-customization__count">{{ total }} 个</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="templateName" label="模板名称" min-width="180">
            <template #default="{ row }">
              <span class="form-customization__name">{{ row.templateName }}</span>
              <el-tag
                v-if="row.isDefault === 1"
                type="warning"
                size="small"
                class="form-customization__default"
              >
                默认
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="编码" width="140">
            <template #default="{ row }"
              ><span class="mc-num">{{ row.code }}</span></template
            >
          </el-table-column>
          <el-table-column prop="categoryLabel" label="分类" width="100" align="center" />
          <el-table-column label="版本" width="80" align="center">
            <template #default="{ row }"
              ><span class="mc-num">v{{ row.version ?? 1 }}</span></template
            >
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{
                row.statusLabel
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="230" align="center" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="openEdit(row as FormTemplateItem)"
                >编辑</el-button
              >
              <el-button
                v-if="row.isDefault !== 1"
                text
                type="warning"
                size="small"
                :icon="Star"
                @click="handleSetDefault(row as FormTemplateItem)"
              >
                默认
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                :icon="Trash2"
                @click="handleDelete(row as FormTemplateItem)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="form-customization__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="loadList"
            @size-change="handleSearch"
          />
        </div>
        <el-empty v-if="!loading && !list.length" description="暂无表单模板" :image-size="72" />
      </div>
    </div>

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
                placeholder="唯一编码，例如 basic_info"
                maxlength="50"
                :disabled="editingId !== 0"
              />
            </el-form-item>
            <el-form-item label="分类" required>
              <el-select v-model="form.category" style="width: 100%" :disabled="editingId !== 0">
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
                multiple
                collapse-tags
                placeholder="不选则全部适用"
                style="width: 100%"
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

          <el-divider content-position="left">字段配置</el-divider>
          <div class="form-customization__fields">
            <div v-for="(field, idx) in form.fields" :key="idx" class="form-customization__field">
              <div class="form-customization__field-main">
                <el-input
                  v-model="field.label"
                  placeholder="字段标签，如：姓名"
                  style="width: 150px"
                />
                <el-input
                  v-model="field.key"
                  placeholder="字段标识，如：name"
                  style="width: 150px"
                  class="mc-num"
                />
                <el-select v-model="field.type" style="width: 120px">
                  <el-option
                    v-for="t in fieldTypeOptions"
                    :key="t.value"
                    :label="t.label"
                    :value="t.value"
                  />
                </el-select>
                <el-switch v-model="field.required" active-text="必填" />
                <el-button text type="danger" :icon="Trash2" @click="removeField(idx)" />
              </div>
              <div
                v-if="
                  field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
                "
                class="form-customization__field-options"
              >
                <el-tag
                  v-for="(opt, oi) in field.options ?? []"
                  :key="oi"
                  closable
                  size="small"
                  effect="plain"
                  @close="(field.options ?? []).splice(oi, 1)"
                >
                  {{ String(opt) }}
                </el-tag>
                <el-input
                  placeholder="输入选项后回车添加"
                  size="small"
                  style="width: 180px"
                  @keyup.enter="
                    (e: KeyboardEvent) => {
                      const v = (e.target as HTMLInputElement).value.trim()
                      if (v) {
                        field.options = [...(field.options ?? []), v]
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  "
                />
              </div>
            </div>
            <el-button :icon="Plus" plain class="form-customization__add-field" @click="addField">
              添加字段
            </el-button>
          </div>
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
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__name {
    font-weight: 500;
  }

  &__default {
    margin-left: 8px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }

  &__dialog {
    min-height: 200px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 $spacing-lg;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 320px;
    overflow-y: auto;
    padding: $spacing-sm;
    border: 1px dashed var(--el-border-color-light);
    border-radius: $radius-lg;
    background: var(--el-fill-color-lighter);
  }

  &__field {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-base;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
  }

  &__field-main {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__field-options {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  &__add-field {
    align-self: flex-start;
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
