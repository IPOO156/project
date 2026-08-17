<script setup lang="ts">
/**
 * ApprovalFlow - 审批流程配置
 * 对接后端 /admin/approval-flows（列表/创建/更新/删除/启停）。
 */
import type { ApprovalFlowItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createApprovalFlow,
  deleteApprovalFlow,
  listApprovalFlows,
  updateApprovalFlow,
} from '@/shared/api/teacher'

const applicableTypeOptions = [
  { value: 'Archive', label: '档案' },
  { value: 'AwardApplication', label: '奖项申报' },
  { value: 'CareerPlan', label: '职业规划' },
  { value: 'GrowthTimeline', label: '成长时间轴' },
  { value: 'Announcement', label: '公告' },
]

function typeLabel(type: string) {
  return applicableTypeOptions.find((t) => t.value === type)?.label ?? type
}

const loading = ref(false)
const list = ref<ApprovalFlowItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

async function load() {
  loading.value = true
  try {
    const res = await listApprovalFlows({ page: page.value, per_page: perPage.value })
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
  flowName: '',
  applicableType: 'Archive',
  applicableSubType: '',
  isDefault: 0,
  status: 1,
})

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.flowName = ''
  form.applicableType = 'Archive'
  form.applicableSubType = ''
  form.isDefault = 0
  form.status = 1
  dialogVisible.value = true
}

function openEdit(row: ApprovalFlowItem) {
  isEdit.value = true
  editingId.value = row.id
  form.flowName = row.flowName
  form.applicableType = row.applicableType
  form.applicableSubType = row.applicableSubType ?? ''
  form.isDefault = row.isDefault
  form.status = row.status
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.flowName.trim()) {
    ElMessage.warning('请填写流程名称')
    return
  }
  try {
    const payload = {
      flowName: form.flowName.trim(),
      applicableType: form.applicableType,
      applicableSubType: form.applicableSubType || undefined,
      isDefault: form.isDefault,
      status: form.status,
    }
    if (isEdit.value && editingId.value != null) {
      await updateApprovalFlow(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createApprovalFlow(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleDelete(row: ApprovalFlowItem) {
  try {
    await ElMessageBox.confirm(`确定删除审批流程「${row.flowName}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteApprovalFlow(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleToggleStatus(row: ApprovalFlowItem) {
  const next = row.status === 1 ? 0 : 1
  try {
    await updateApprovalFlow(row.id, { status: next })
    row.status = next
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
        <h2 class="mc-page-head__title">审批流程</h2>
        <p class="mc-page-head__desc">
          配置各类业务（档案、奖项、职业规划等）的审批流程。数据来自后端 /admin/approval-flows。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增流程</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe style="width: 100%">
          <el-table-column prop="flowName" label="流程名称" min-width="180" />
          <el-table-column label="适用类型" width="130">
            <template #default="{ row }">{{ typeLabel(row.applicableType) }}</template>
          </el-table-column>
          <el-table-column prop="applicableSubType" label="适用子类型" width="130">
            <template #default="{ row }">{{ row.applicableSubType ?? '通用' }}</template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="70" align="center" />
          <el-table-column label="默认" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170">
            <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                @click="openEdit(row as ApprovalFlowItem)"
              >
                编辑
              </el-button>
              <el-button
                text
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="handleToggleStatus(row as ApprovalFlowItem)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="handleDelete(row as ApprovalFlowItem)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="approval-flow__pagination">
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
      :title="isEdit ? '编辑审批流程' : '新增审批流程'"
      width="480px"
    >
      <el-form label-width="90px">
        <el-form-item label="流程名称" required>
          <el-input v-model="form.flowName" placeholder="流程名称" />
        </el-form-item>
        <el-form-item label="适用类型" required>
          <el-select v-model="form.applicableType" style="width: 100%">
            <el-option
              v-for="t in applicableTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="适用子类型">
          <el-input v-model="form.applicableSubType" placeholder="留空表示通用" />
        </el-form-item>
        <el-form-item label="默认流程">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.approval-flow {
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
