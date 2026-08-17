<script setup lang="ts">
/**
 * AbilityDimension - 能力维度配置
 * 对接后端 /admin/ability-dimensions（增删改查）。
 */
import type { AbilityDimensionItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createAbilityDimension,
  deleteAbilityDimension,
  listAbilityDimensions,
  updateAbilityDimension,
} from '@/shared/api/teacher'

const loading = ref(false)
const list = ref<AbilityDimensionItem[]>([])

async function load() {
  loading.value = true
  try {
    list.value = await listAbilityDimensions()
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// ── 新增/编辑弹窗 ──
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  dimensionName: '',
  dimensionCode: '',
  description: '',
  sort: 0,
})

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.dimensionName = ''
  form.dimensionCode = ''
  form.description = ''
  form.sort = 0
  dialogVisible.value = true
}

function openEdit(row: AbilityDimensionItem) {
  isEdit.value = true
  editingId.value = row.id
  form.dimensionName = row.dimensionName
  form.dimensionCode = row.dimensionCode
  form.description = row.description ?? ''
  form.sort = row.sort
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.dimensionName.trim() || !form.dimensionCode.trim()) {
    ElMessage.warning('请填写维度名称和编码')
    return
  }
  try {
    if (isEdit.value && editingId.value != null) {
      await updateAbilityDimension(editingId.value, {
        dimensionName: form.dimensionName.trim(),
        dimensionCode: form.dimensionCode.trim(),
        description: form.description || undefined,
        sort: form.sort,
      })
      ElMessage.success('更新成功')
    } else {
      await createAbilityDimension({
        dimensionName: form.dimensionName.trim(),
        dimensionCode: form.dimensionCode.trim(),
        description: form.description || undefined,
        sort: form.sort,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleDelete(row: AbilityDimensionItem) {
  try {
    await ElMessageBox.confirm(`确定删除能力维度「${row.dimensionName}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteAbilityDimension(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleToggleStatus(row: AbilityDimensionItem) {
  const next = row.status === 1 ? 0 : 1
  try {
    await updateAbilityDimension(row.id, { status: next })
    row.status = next
    row.statusLabel = next === 1 ? '启用' : '禁用'
    ElMessage.success(next === 1 ? '已启用' : '已禁用')
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">能力维度</h2>
        <p class="mc-page-head__desc">
          配置学生评价的能力维度，供指标体系引用。数据来自后端 /admin/ability-dimensions。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增维度</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe style="width: 100%">
          <el-table-column prop="dimensionName" label="维度名称" width="180" />
          <el-table-column prop="dimensionCode" label="维度编码" width="160" />
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                @click="openEdit(row as AbilityDimensionItem)"
              >
                编辑
              </el-button>
              <el-button
                text
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="handleToggleStatus(row as AbilityDimensionItem)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="handleDelete(row as AbilityDimensionItem)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑能力维度' : '新增能力维度'"
      width="460px"
    >
      <el-form label-width="90px">
        <el-form-item label="维度名称" required>
          <el-input v-model="form.dimensionName" placeholder="如：学业能力" />
        </el-form-item>
        <el-form-item label="维度编码" required>
          <el-input v-model="form.dimensionCode" placeholder="如：academic" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="维度说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
