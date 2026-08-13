<script setup lang="ts">
import type { FormTemplate, NavigationItem } from '@/shared/types/teacher'
/**
 * FormCustomization - 表单自定义（菜单/申报项目）
 * 对接后端：
 *   - GET  /admin/form-templates           申报项目模板列表
 *   - POST /admin/form-templates           添加申报项目
 *   - PUT  /admin/form-templates/{id}      编辑/启停
 *   - POST /admin/form-templates/{id}/publish  发布
 *   - GET  /admin/navigation               当前菜单树（只读展示）
 */
import { ElMessage } from 'element-plus'
import { Plus, RefreshCw, Save } from 'lucide-vue-next'

import { onMounted, ref } from 'vue'
import {
  createFormTemplate,
  getNavigation,
  listFormTemplates,
  publishFormTemplate,
  updateFormTemplate,
} from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

const loading = ref(false)
const templates = ref<FormTemplate[]>([])
const menus = ref<NavigationItem[]>([])

const categoryOptions = [
  { value: 'archive', label: '档案申报' },
  { value: 'award', label: '奖项申报' },
  { value: 'career_plan', label: '职业规划' },
]

function categoryLabel(c: string): string {
  return categoryOptions.find((o) => o.value === c)?.label ?? c ?? '-'
}

async function load() {
  loading.value = true
  try {
    const schoolId = me.value?.schoolId
    templates.value = await listFormTemplates(schoolId)
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

async function loadMenus() {
  try {
    menus.value = await getNavigation()
  } catch {
    menus.value = []
  }
}

// ── 新增申报项目 ──
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({ templateName: '', code: '', category: 'archive', description: '' })

async function handleAdd() {
  if (!form.value.templateName.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  if (!form.value.code.trim()) {
    ElMessage.warning('请输入项目编码')
    return
  }
  saving.value = true
  try {
    await createFormTemplate({
      templateName: form.value.templateName.trim(),
      code: form.value.code.trim(),
      category: form.value.category,
      description: form.value.description.trim() || undefined,
      schoolId: me.value?.schoolId,
    })
    ElMessage.success('申报项目已创建')
    dialogVisible.value = false
    form.value = { templateName: '', code: '', category: 'archive', description: '' }
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

// ── 发布 / 启停 ──
async function handleToggle(item: any) {
  const next = item.status === 1 ? 0 : 1
  try {
    await updateFormTemplate(item.id as number, { status: next })
    ElMessage.success(next === 1 ? '已发布' : '已下架')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handlePublish(item: any) {
  try {
    await publishFormTemplate(item.id as number)
    ElMessage.success('版本已发布')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => {
  void load()
  void loadMenus()
})
</script>

<template>
  <div class="mc-page form-custom">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">菜单与模板 · Templates</p>
        <h2 class="mc-page-head__title">表单自定义</h2>
        <p class="mc-page-head__desc">维护学生端申报项目菜单，新增申报类别、调整字段并发布版本。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="dialogVisible = true">添加菜单</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">申报项目列表</span>
        <span class="form-custom__count">共 {{ templates.length }} 项</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="templates" stripe>
          <el-table-column prop="templateName" label="项目名称" min-width="160" />
          <el-table-column label="类别" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ categoryLabel(row.category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="编码" width="130" />
          <el-table-column prop="version" label="版本" width="80" class-name="mc-num" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="170">
            <template #default="{ row }">
              {{ row.updatedAt ? row.updatedAt.replace('T', ' ').slice(0, 16) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" link size="small" @click="handleToggle(row)">
                下架
              </el-button>
              <el-button v-else link type="primary" size="small" @click="handlePublish(row)">
                发布
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">当前菜单结构</span>
      </div>
      <div class="mc-card__body">
        <el-tree
          v-if="menus.length"
          :data="menus"
          node-key="key"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
        />
        <div v-else class="mc-empty">
          <div class="mc-empty__icon"><Save :size="22" /></div>
          <p class="mc-empty__title">暂无菜单数据</p>
          <p class="mc-empty__desc">
            菜单由后端 /admin/navigation 按登录角色返回，登录后自动加载。
          </p>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="添加菜单" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="项目名称" required>
          <el-input v-model="form.templateName" placeholder="如：学科竞赛" />
        </el-form-item>
        <el-form-item label="项目编码" required>
          <el-input v-model="form.code" placeholder="如：competition（英文唯一标识）" />
        </el-form-item>
        <el-form-item label="申报类别">
          <el-select v-model="form.category" style="width: 100%">
            <el-option
              v-for="o in categoryOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleAdd">确定新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.form-custom {
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
