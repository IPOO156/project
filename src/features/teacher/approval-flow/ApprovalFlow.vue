<script setup lang="ts">
/**
 * ApprovalFlow - 审批流程配置
 * 对接后端 /admin/approval-flows（列表/创建/更新/删除/启停）、
 * /admin/approval-flows/{flowId}/steps（步骤管理）、/admin/approval-flow-mappings（流程映射）。
 */
import type { ApprovalFlowDetail, ApprovalFlowItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw, Route, Workflow } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createApprovalFlow,
  deleteApprovalFlow,
  getApprovalFlowDetail,
  listApprovalFlows,
  updateApprovalFlow,
} from '@/shared/api/teacher'
import ApprovalFlowMappingsDrawer from './components/ApprovalFlowMappingsDrawer.vue'
import ApprovalFlowStepsDrawer from './components/ApprovalFlowStepsDrawer.vue'

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

// ── 流程详情抽屉 ──
const detailDrawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ApprovalFlowDetail | null>(null)

async function openDetail(row: ApprovalFlowItem) {
  detailDrawerVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getApprovalFlowDetail(row.id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function handleDetailClosed() {
  detail.value = null
}

// ── 步骤管理 / 流程映射 抽屉 ──
const stepsDrawerVisible = ref(false)
const stepsFlowId = ref(0)
const stepsFlowName = ref('')
const mappingsDrawerVisible = ref(false)

function openSteps(row: ApprovalFlowItem) {
  stepsFlowId.value = row.id
  stepsFlowName.value = row.flowName
  stepsDrawerVisible.value = true
}

onMounted(() => void load())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">审批流程</h2>
        <p class="mc-page-head__desc">配置各类业务（档案、奖项、职业规划等）的审批流程。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button :icon="Route" @click="mappingsDrawerVisible = true">流程映射</el-button>
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
          <el-table-column label="操作" width="320" align="center">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                @click="openDetail(row as ApprovalFlowItem)"
              >
                详情
              </el-button>
              <el-button
                text
                type="primary"
                size="small"
                :icon="Workflow"
                @click="openSteps(row as ApprovalFlowItem)"
              >
                步骤
              </el-button>
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

    <el-drawer
      v-model="detailDrawerVisible"
      :title="detail?.flowName ?? '流程详情'"
      size="42%"
      :destroy-on-close="true"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="approval-flow__detail">
        <template v-if="detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="流程名称">{{ detail.flowName }}</el-descriptions-item>
            <el-descriptions-item label="适用类型">{{
              typeLabel(detail.applicableType)
            }}</el-descriptions-item>
            <el-descriptions-item label="适用子类型">{{
              detail.applicableSubType ?? '通用'
            }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ detail.version }}</el-descriptions-item>
            <el-descriptions-item label="默认流程">
              <el-tag v-if="detail.isDefault === 1" type="success" size="small">默认</el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="detail.status === 1 ? 'success' : 'info'" size="small">
                {{ detail.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
              detail.createdAt ?? '-'
            }}</el-descriptions-item>
          </el-descriptions>

          <div class="approval-flow__detail-section">
            <p class="approval-flow__detail-title">审批步骤</p>
            <el-table :data="detail.steps" stripe size="small" style="width: 100%">
              <el-table-column prop="stepNo" label="步骤" width="60" align="center" />
              <el-table-column prop="stepName" label="步骤名称" min-width="120" />
              <el-table-column prop="roleId" label="角色ID" width="80" align="center" />
              <el-table-column prop="scopeType" label="范围类型" width="80" align="center" />
              <el-table-column
                prop="scopeRule"
                label="范围规则"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column label="自动分配" width="80" align="center">
                <template #default="{ row }">{{ row.autoAssign === 1 ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column label="允许委派" width="80" align="center">
                <template #default="{ row }">{{ row.allowDelegate === 1 ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column label="允许跳过" width="80" align="center">
                <template #default="{ row }">{{ row.allowSkip === 1 ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column label="超时(h)" width="80" align="center">
                <template #default="{ row }">{{ row.timeoutHours ?? '-' }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!detail.steps.length" description="暂无审批步骤" :image-size="72" />
          </div>
        </template>
        <el-empty v-else description="暂无详情数据" :image-size="72" />
      </div>
    </el-drawer>

    <ApprovalFlowStepsDrawer
      v-model:visible="stepsDrawerVisible"
      :flow-id="stepsFlowId"
      :flow-name="stepsFlowName"
    />
    <ApprovalFlowMappingsDrawer v-model:visible="mappingsDrawerVisible" :flows="list" />
  </div>
</template>

<style scoped lang="scss">
.approval-flow {
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
  &__detail {
    &-section {
      margin-top: $spacing-lg;
    }
    &-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 $spacing-sm;
    }
  }
}
</style>
