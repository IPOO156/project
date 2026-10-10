<script setup lang="ts">
import type { TableInstance } from 'element-plus'
/**
 * Indicator - 指标配置
 * 对接后端 /admin/indicators（树 + 增删改 + 启停 + 发布 + 批量状态）、
 * /admin/indicators/rule-versions（规则版本列表与快照修补）。
 */
import type {
  AdminIndicatorTree,
  IndicatorNode,
  IndicatorPayload,
  SemesterItem,
} from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, History, Plus, RefreshCw, Rocket, X } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createIndicator,
  deleteIndicator,
  getAdminIndicatorTree,
  getSemesters,
  publishIndicators,
  updateIndicator,
  updateIndicatorsStatusBatch,
  updateIndicatorStatus,
} from '@/shared/api/teacher'
import IndicatorVersionsDrawer from './components/IndicatorVersionsDrawer.vue'

const loading = ref(false)
const tree = ref<AdminIndicatorTree | null>(null)

// ─── 各动作独立 Loading（与列表 loading 分离，避免整表转圈） ───
const saving = ref(false)
const publishing = ref(false)
const batching = ref(false)
const deletingId = ref<number | null>(null)

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
  saving.value = true
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
  } finally {
    saving.value = false
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
  deletingId.value = row.id
  try {
    await deleteIndicator(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    deletingId.value = null
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

/**
 * 发布规则版本。
 *
 * ⚠️ 后端 POST /admin/indicators/publish 的请求体是 @Valid @RequestBody，
 * versionName 必填（@NotBlank）。原实现不带请求体直接 post，被框架判为
 * HttpMessageNotReadableException → 400 / 10003「请求数据格式错误」，
 * 页面上表现为「点发布就报错」。故改为先弹窗收集版本名称（必填）与归属学期（可选）
 * 再提交，字段名与后端 IndicatorPublishRequest 一致。
 */
const publishDialogVisible = ref(false)
const semesters = ref<SemesterItem[]>([])
const publishForm = reactive({
  versionName: '',
  semesterId: undefined as number | undefined,
})

async function openPublish() {
  publishForm.versionName = ''
  publishForm.semesterId = undefined
  publishDialogVisible.value = true
  // 学期为可选项（不选则后端取当前学期），加载失败不阻塞发布
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  }
}

async function handlePublish() {
  const versionName = publishForm.versionName.trim()
  if (!versionName) {
    ElMessage.warning('请填写版本名称')
    return
  }
  publishing.value = true
  try {
    const res = await publishIndicators({ versionName, semesterId: publishForm.semesterId })
    ElMessage.success(`发布成功（版本 ${res.version}）`)
    publishDialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    publishing.value = false
  }
}

// ── 批量启用/禁用（/admin/indicators/status）──
const tableRef = ref<TableInstance | null>(null)
const selectedIndicators = ref<IndicatorNode[]>([])

function handleSelectionChange(rows: IndicatorNode[]) {
  selectedIndicators.value = rows
}

async function handleBatchStatus(next: number) {
  const ids = selectedIndicators.value.map((r) => r.id)
  if (!ids.length) {
    ElMessage.warning('请先勾选要操作的指标')
    return
  }
  batching.value = true
  try {
    const res = await updateIndicatorsStatusBatch({ indicatorIds: ids, status: next })
    ElMessage.success(`已${next === 1 ? '启用' : '禁用'} ${res.affectedCount ?? ids.length} 项指标`)
    tableRef.value?.clearSelection()
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    batching.value = false
  }
}

// ── 规则版本列表（/admin/indicators/rule-versions）──
const versionsDrawerVisible = ref(false)

onMounted(() => void load())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">指标配置</h2>
        <p class="mc-page-head__desc">管理三级评价指标体系（权重、计分规则、版本发布）。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button :icon="History" @click="versionsDrawerVisible = true">版本</el-button>
        <el-button
          type="success"
          plain
          :icon="Check"
          :loading="batching"
          :disabled="!selectedIndicators.length || batching"
          @click="handleBatchStatus(1)"
        >
          批量启用
        </el-button>
        <el-button
          type="danger"
          plain
          :icon="X"
          :loading="batching"
          :disabled="!selectedIndicators.length || batching"
          @click="handleBatchStatus(0)"
        >
          批量禁用
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate()">新增一级指标</el-button>
        <el-button
          type="success"
          :icon="Rocket"
          :loading="publishing"
          :disabled="publishing"
          @click="openPublish"
        >
          发布
        </el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="tree?.indicators ?? []"
          row-key="id"
          :tree-props="{ children: 'children' }"
          default-expand-all
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" reserve-selection />
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
                :loading="deletingId === (row as IndicatorNode).id"
                :disabled="deletingId !== null"
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
        <el-button type="primary" :loading="saving" :disabled="saving" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="publishDialogVisible" title="发布指标规则版本" width="480px">
      <el-form label-width="90px">
        <el-form-item label="版本名称" required>
          <el-input
            v-model="publishForm.versionName"
            placeholder="如：2026春-第1版"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item label="归属学期">
          <el-select
            v-model="publishForm.semesterId"
            placeholder="不选则取当前学期"
            clearable
            style="width: 100%"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布说明">
          <span class="indicator-page__publish-hint">
            发布后当前草稿树将打包为一个新规则版本；一级指标权重之和须为 1，否则后端拒绝发布。
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="publishing"
          :disabled="publishing"
          @click="handlePublish"
          >确定发布</el-button
        >
      </template>
    </el-dialog>

    <IndicatorVersionsDrawer v-model:visible="versionsDrawerVisible" />
  </div>
</template>

<style scoped lang="scss">
/* 发布弹窗内对发布前置条件（权重校验、打包草稿）的说明文案，弱化显示 */
.indicator-page__publish-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
