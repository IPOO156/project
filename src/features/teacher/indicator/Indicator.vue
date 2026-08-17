<script setup lang="ts">
/**
 * Indicator - 指标配置
 * 对接后端 /admin/indicators（树 + 增删改 + 启停 + 发布）。
 */
import type { AdminIndicatorTree, IndicatorNode, IndicatorPayload } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw, Rocket } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createIndicator,
  deleteIndicator,
  getAdminIndicatorTree,
  publishIndicators,
  updateIndicator,
  updateIndicatorStatus,
} from '@/shared/api/teacher'

const loading = ref(false)
const tree = ref<AdminIndicatorTree | null>(null)

async function load() {
  loading.value = true
  try {
    tree.value = await getAdminIndicatorTree({})
  } catch {
    tree.value = null
  } finally {
    loading.value = false
  }
}

// ── 新增/编辑弹窗 ──
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const parentId = ref<number | null>(null)
const form = reactive({
  indicatorName: '',
  indicatorCode: '',
  weight: 0,
  description: '',
})

function openCreate(parent?: IndicatorNode) {
  isEdit.value = false
  editingId.value = null
  parentId.value = parent?.id ?? null
  form.indicatorName = ''
  form.indicatorCode = ''
  form.weight = 0
  form.description = ''
  dialogVisible.value = true
}

function openEdit(row: IndicatorNode) {
  isEdit.value = true
  editingId.value = row.id
  form.indicatorName = row.indicatorName
  form.indicatorCode = row.indicatorCode
  form.weight = row.weight
  form.description = row.description ?? ''
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.indicatorName.trim() || !form.indicatorCode.trim()) {
    ElMessage.warning('请填写指标名称和编码')
    return
  }
  try {
    if (isEdit.value && editingId.value != null) {
      await updateIndicator(editingId.value, {
        indicatorName: form.indicatorName.trim(),
        weight: form.weight,
        description: form.description || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      const payload: IndicatorPayload = {
        parentId: parentId.value ?? undefined,
        indicatorCode: form.indicatorCode.trim(),
        indicatorName: form.indicatorName.trim(),
        weight: form.weight,
        description: form.description || undefined,
      }
      await createIndicator(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleDelete(row: IndicatorNode) {
  try {
    await ElMessageBox.confirm(`确定删除指标「${row.indicatorName}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteIndicator(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleToggleStatus(row: IndicatorNode) {
  const next = row.status === 1 ? 0 : 1
  try {
    await updateIndicatorStatus(row.id, next)
    row.status = next
    row.statusLabel = next === 1 ? '启用' : '禁用'
    ElMessage.success(next === 1 ? '已启用' : '已禁用')
  } catch {
    /* 拦截器已提示 */
  }
}

async function handlePublish() {
  try {
    await publishIndicators()
    ElMessage.success('发布成功')
    void load()
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
        <h2 class="mc-page-head__title">指标配置</h2>
        <p class="mc-page-head__desc">
          管理三级评价指标体系（权重、计分规则、版本发布）。数据来自后端 /admin/indicators。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate()">新增一级指标</el-button>
        <el-button type="success" :icon="Rocket" @click="handlePublish">发布</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table
          v-loading="loading"
          :data="tree?.indicators ?? []"
          row-key="id"
          :tree-props="{ children: 'children' }"
          default-expand-all
          style="width: 100%"
        >
          <el-table-column prop="indicatorName" label="指标名称" min-width="220" />
          <el-table-column prop="indicatorCode" label="编码" width="140" />
          <el-table-column prop="level" label="层级" width="70" align="center" />
          <el-table-column label="权重" width="90" align="center">
            <template #default="{ row }">{{ row.weight }}</template>
          </el-table-column>
          <el-table-column prop="dimensionName" label="能力维度" width="120">
            <template #default="{ row }">{{ row.dimensionName ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center">
            <template #default="{ row }">
              <el-button
                v-if="(row.level ?? 0) < 3"
                text
                type="primary"
                size="small"
                @click="openCreate(row as IndicatorNode)"
              >
                加子项
              </el-button>
              <el-button text type="primary" size="small" @click="openEdit(row as IndicatorNode)">
                编辑
              </el-button>
              <el-button
                text
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="handleToggleStatus(row as IndicatorNode)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="handleDelete(row as IndicatorNode)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑指标' : '新增指标'" width="480px">
      <el-form label-width="90px">
        <el-form-item v-if="parentId" label="父级 ID">
          <span>{{ parentId }}</span>
        </el-form-item>
        <el-form-item label="指标名称" required>
          <el-input v-model="form.indicatorName" placeholder="指标名称" />
        </el-form-item>
        <el-form-item label="指标编码" required>
          <el-input v-model="form.indicatorCode" placeholder="指标编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="权重" required>
          <el-input-number v-model="form.weight" :min="0" :max="1" :step="0.05" :precision="2" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="指标说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
