<script setup lang="ts">
import type { ApprovalFlowItem, ApprovalFlowMapping } from '@/shared/types/teacher'
/**
 * ApprovalFlowMappingsDrawer - 审批流程映射管理（抽屉）
 * 对接后端：GET /admin/approval-flow-mappings（列表）、
 * POST /admin/approval-flow-mappings（创建/更新）、DELETE /admin/approval-flow-mappings/{id}（删除）。
 * 文档 6.8/6.9/6.10。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Trash2 } from 'lucide-vue-next'

import { reactive, ref, watch } from 'vue'
import {
  deleteApprovalFlowMapping,
  listApprovalFlowMappings,
  upsertApprovalFlowMapping,
} from '@/shared/api/teacher'

const props = defineProps<{
  visible: boolean
  flows: ApprovalFlowItem[]
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const businessTypeOptions = [
  { value: 'Archive', label: '档案' },
  { value: 'AwardApplication', label: '奖项申报' },
  { value: 'CareerPlan', label: '职业规划' },
  { value: 'GrowthTimeline', label: '成长时间轴' },
  { value: 'Announcement', label: '公告' },
]

function typeLabel(type: string) {
  return businessTypeOptions.find((t) => t.value === type)?.label ?? type
}

const loading = ref(false)
const saving = ref(false)
const list = ref<ApprovalFlowMapping[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const filters = reactive({
  businessType: undefined as string | undefined,
  businessSubType: undefined as string | undefined,
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  businessType: 'Archive',
  businessSubType: '',
  flowId: undefined as number | undefined,
  isDefault: 0,
  priority: 0,
  effectiveRange: [] as string[],
})

watch(
  () => props.visible,
  (v) => {
    if (v) void load()
  },
)

async function load() {
  loading.value = true
  try {
    const res = await listApprovalFlowMappings({
      page: page.value,
      per_page: perPage.value,
      businessType: filters.businessType,
      businessSubType: filters.businessSubType,
    })
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

function handleSearch() {
  page.value = 1
  void load()
}

function handleReset() {
  filters.businessType = undefined
  filters.businessSubType = undefined
  page.value = 1
  void load()
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.businessType = 'Archive'
  form.businessSubType = ''
  form.flowId = props.flows[0]?.id
  form.isDefault = 0
  form.priority = 0
  form.effectiveRange = []
  dialogVisible.value = true
}

function openEdit(row: ApprovalFlowMapping) {
  isEdit.value = true
  editingId.value = row.id
  form.businessType = row.businessType
  form.businessSubType = row.businessSubType ?? ''
  form.flowId = row.flowId
  form.isDefault = row.isDefault
  form.priority = row.priority
  form.effectiveRange = []
  if (row.effectiveStart) form.effectiveRange.push(row.effectiveStart)
  if (row.effectiveEnd) form.effectiveRange.push(row.effectiveEnd)
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.flowId) {
    ElMessage.warning('请选择关联流程')
    return
  }
  saving.value = true
  try {
    await upsertApprovalFlowMapping({
      id: isEdit.value && editingId.value != null ? editingId.value : undefined,
      businessType: form.businessType,
      businessSubType: form.businessSubType || undefined,
      flowId: form.flowId,
      isDefault: form.isDefault,
      priority: form.priority,
      effectiveStart: form.effectiveRange[0] || undefined,
      effectiveEnd: form.effectiveRange[1] || undefined,
    })
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: ApprovalFlowMapping) {
  try {
    await ElMessageBox.confirm(`确定删除业务类型「${row.businessType}」的映射吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteApprovalFlowMapping(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer :model-value="visible" title="流程映射" size="860px" @closed="handleClosed">
    <div v-loading="loading" class="flow-mappings">
      <div class="mc-filter-bar flow-mappings__filter">
        <el-form inline @submit.prevent>
          <el-form-item label="业务类型">
            <el-select
              v-model="filters.businessType"
              clearable
              placeholder="全部"
              style="width: 160px"
            >
              <el-option
                v-for="t in businessTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="子类型">
            <el-input
              v-model="filters.businessSubType"
              clearable
              placeholder="留空=通用"
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="list" stripe style="width: 100%">
        <el-table-column label="业务类型" width="120">
          <template #default="{ row }">{{ typeLabel(row.businessType) }}</template>
        </el-table-column>
        <el-table-column label="子类型" width="100">
          <template #default="{ row }">{{ row.businessSubType ?? '通用' }}</template>
        </el-table-column>
        <el-table-column prop="flowName" label="关联流程" min-width="150" show-overflow-tooltip />
        <el-table-column label="默认" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column label="生效区间" width="200">
          <template #default="{ row }">
            <span v-if="row.effectiveStart || row.effectiveEnd">
              {{ row.effectiveStart?.slice(0, 10) ?? '即时' }} ~
              {{ row.effectiveEnd?.slice(0, 10) ?? '长期' }}
            </span>
            <span v-else>即时 ~ 长期</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click="openEdit(row as ApprovalFlowMapping)"
            >
              编辑
            </el-button>
            <el-button
              text
              type="danger"
              size="small"
              :icon="Trash2"
              @click="handleDelete(row as ApprovalFlowMapping)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flow-mappings__pagination">
        <el-pagination
          :current-page="page"
          :page-size="perPage"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClosed">关闭</el-button>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增映射</el-button>
    </template>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑映射' : '新增映射'"
      width="480px"
      append-to-body
    >
      <el-form label-width="90px">
        <el-form-item label="业务类型" required>
          <el-select v-model="form.businessType" style="width: 100%">
            <el-option
              v-for="t in businessTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="子类型">
          <el-input v-model="form.businessSubType" placeholder="留空表示通用" />
        </el-form-item>
        <el-form-item label="关联流程" required>
          <el-select v-model="form.flowId" placeholder="请选择流程" style="width: 100%">
            <el-option
              v-for="f in props.flows"
              :key="f.id"
              :label="`${f.flowName}（${typeLabel(f.applicableType)}）`"
              :value="f.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="默认流程">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" />
        </el-form-item>
        <el-form-item label="生效区间">
          <el-date-picker
            v-model="form.effectiveRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style scoped lang="scss">
.flow-mappings {
  &__filter {
    padding: 0 0 14px;
    margin-bottom: 4px;
    background: transparent;
    border: none;
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
