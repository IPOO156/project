<script setup lang="ts">
import type { ApprovalFlowStep, RoleListItem } from '@/shared/types/teacher'
/**
 * ApprovalFlowStepsDrawer - 审批流程步骤管理（抽屉）
 * 对接后端：GET /admin/approval-flows/{flowId}/steps（列表）、
 * PUT /admin/approval-flows/{flowId}/steps（全量覆盖保存，文档 6.6/6.7）。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Save } from 'lucide-vue-next'

import { computed, reactive, ref, watch } from 'vue'
import { listApprovalFlowSteps, listRoles, saveApprovalFlowSteps } from '@/shared/api/teacher'

const props = defineProps<{
  visible: boolean
  flowId: number
  flowName: string
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const scopeTypeOptions = [
  { value: 1, label: '学校' },
  { value: 2, label: '学院' },
  { value: 3, label: '专业' },
  { value: 4, label: '班级' },
  { value: 5, label: '课程' },
  { value: 6, label: '年级' },
]

const scopeRuleOptions = ['student_school', 'student_college', 'student_major', 'student_class']

function scopeTypeLabel(type: number) {
  return scopeTypeOptions.find((t) => t.value === type)?.label ?? String(type)
}

const loading = ref(false)
const saving = ref(false)
const steps = ref<ApprovalFlowStep[]>([])

/**
 * 审批角色候选（GET /admin/roles）。
 *
 * 「审批角色ID」填的是 roles.id（内部主键），界面上原本没有任何地方展示该 id，
 * 用户无从得知填几 —— 故改为按角色名选择，提交时取 roleId。
 * 角色管理列表已同步增加「角色ID」列，便于对照排错。
 */
const roles = ref<RoleListItem[]>([])
async function loadRoles() {
  try {
    const res = await listRoles({ page: 1, per_page: 200 })
    roles.value = res.list ?? []
  } catch {
    roles.value = []
  }
}

/** 角色 id → 显示名（角色名（编码）），未命中退回 id 本身，不隐藏信息 */
function roleLabel(roleId: number | null | undefined): string {
  if (roleId == null) return '-'
  const role = roles.value.find((r) => r.roleId === roleId)
  return role ? `${role.roleName}（${role.roleCode}）` : `角色 ID ${roleId}`
}

const stepDialogVisible = ref(false)
const editingIndex = ref(-1)
/** roleId：0 为「未选择」哨兵（ApprovalFlowStep.roleId 在后端为必填 number，故不引入 null） */
const UNSET_ROLE_ID = 0
const stepForm = reactive<ApprovalFlowStep>({
  stepNo: 1,
  stepName: '',
  roleId: UNSET_ROLE_ID,
  scopeType: 2,
  scopeRule: 'student_major',
  autoAssign: 1,
  allowDelegate: 0,
  allowSkip: 0,
  allowDesignateNext: 0,
  timeoutHours: 48,
  rejectAction: 'end',
  rejectToStep: null,
})

/** 角色下拉选项；编辑历史步骤时若其 roleId 不在当前角色列表内，追加一条回显项（不隐藏信息） */
const roleOptions = computed<{ value: number; label: string }[]>(() => {
  const options = roles.value.map((r) => ({
    value: r.roleId,
    label: `${r.roleName}（${r.roleCode}）`,
  }))
  if (stepForm.roleId != null && !options.some((o) => o.value === stepForm.roleId)) {
    options.push({ value: stepForm.roleId, label: `角色 ID ${stepForm.roleId}（已不存在）` })
  }
  return options
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      void loadSteps()
      void loadRoles()
    }
  },
)

async function loadSteps() {
  loading.value = true
  try {
    steps.value = await listApprovalFlowSteps(props.flowId)
  } catch {
    steps.value = []
  } finally {
    loading.value = false
  }
}

function openAddStep() {
  editingIndex.value = -1
  Object.assign(stepForm, {
    stepNo: steps.value.length + 1,
    stepName: '',
    roleId: UNSET_ROLE_ID,
    scopeType: 2,
    scopeRule: 'student_major',
    autoAssign: 1,
    allowDelegate: 0,
    allowSkip: 0,
    allowDesignateNext: 0,
    timeoutHours: 48,
    rejectAction: 'end',
    rejectToStep: null,
  })
  stepDialogVisible.value = true
}

function openEditStep(index: number) {
  editingIndex.value = index
  Object.assign(stepForm, steps.value[index])
  stepDialogVisible.value = true
}

function handleRemoveStep(index: number) {
  void ElMessageBox.confirm(`确定删除步骤「${steps.value[index].stepName}」吗？`, '提示', {
    type: 'warning',
  })
    .then(() => {
      steps.value.splice(index, 1)
      steps.value.forEach((s, i) => (s.stepNo = i + 1))
    })
    .catch(() => {})
}

function handleSaveStep() {
  if (!stepForm.stepName.trim()) {
    ElMessage.warning('请填写步骤名称')
    return
  }
  if (!stepForm.roleId) {
    ElMessage.warning('请选择审批角色')
    return
  }
  if (stepForm.rejectAction === 'return' && stepForm.rejectToStep == null) {
    ElMessage.warning('退回动作选择 return 时需填写退回步骤')
    return
  }
  const clone: ApprovalFlowStep = { ...stepForm, stepName: stepForm.stepName.trim() }
  if (editingIndex.value >= 0) {
    steps.value[editingIndex.value] = clone
  } else {
    steps.value.push(clone)
    steps.value.forEach((s, i) => (s.stepNo = i + 1))
  }
  stepDialogVisible.value = false
}

async function handleSaveAll() {
  if (!steps.value.length) {
    ElMessage.warning('至少需要配置一个审批步骤')
    return
  }
  saving.value = true
  try {
    const res = await saveApprovalFlowSteps(props.flowId, steps.value)
    steps.value = res.steps
    ElMessage.success('步骤保存成功')
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="`审批步骤 · ${flowName}`"
    size="680px"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="flow-steps">
      <div class="flow-steps__head">
        <span class="flow-steps__hint">完整步骤列表，保存时全量覆盖（按 stepNo 匹配更新）</span>
        <el-button type="primary" :icon="Plus" size="small" @click="openAddStep"
          >新增步骤</el-button
        >
      </div>

      <el-table v-if="steps.length" :data="steps" stripe max-height="460" style="width: 100%">
        <el-table-column prop="stepNo" label="序号" width="56" align="center" />
        <el-table-column prop="stepName" label="步骤名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="审批角色" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ roleLabel(row.roleId) }}</template>
        </el-table-column>
        <el-table-column label="范围" width="70" align="center">
          <template #default="{ row }">{{ scopeTypeLabel(row.scopeType) }}</template>
        </el-table-column>
        <el-table-column prop="scopeRule" label="范围规则" width="130" show-overflow-tooltip />
        <el-table-column label="超时(h)" width="70" align="center">
          <template #default="{ row }">{{ row.timeoutHours ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="退回" width="70" align="center">
          <template #default="{ row }">{{ row.rejectAction ?? 'end' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center">
          <template #default="{ $index }">
            <el-button text type="primary" size="small" @click="openEditStep($index)"
              >编辑</el-button
            >
            <el-button text type="danger" size="small" @click="handleRemoveStep($index)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="尚未配置审批步骤" :image-size="72" />
    </div>

    <template #footer>
      <el-button @click="handleClosed">关闭</el-button>
      <el-button type="primary" :icon="Save" :loading="saving" @click="handleSaveAll">
        保存全部步骤
      </el-button>
    </template>

    <el-dialog
      v-model="stepDialogVisible"
      :title="editingIndex >= 0 ? '编辑步骤' : '新增步骤'"
      width="520px"
      append-to-body
    >
      <el-form label-width="110px">
        <el-form-item label="步骤名称" required>
          <el-input v-model="stepForm.stepName" placeholder="如：学院初审" />
        </el-form-item>
        <el-form-item label="审批角色" required>
          <el-select v-model="stepForm.roleId" placeholder="选择由哪个角色审批" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色说明">
          <span class="flow-steps__hint">
            该步骤由所选角色的用户审批，提交时保存其角色 ID（roles.id）； 角色 ID 可在「系统管理 →
            角色管理」列表的「角色ID」列查看。
          </span>
        </el-form-item>
        <el-form-item label="范围类型">
          <el-select v-model="stepForm.scopeType" style="width: 160px">
            <el-option
              v-for="t in scopeTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="范围规则">
          <el-select
            v-model="stepForm.scopeRule"
            allow-create
            filterable
            default-first-option
            style="width: 220px"
          >
            <el-option v-for="r in scopeRuleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动分配">
          <el-switch v-model="stepForm.autoAssign" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="允许委托">
          <el-switch v-model="stepForm.allowDelegate" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="允许跳过">
          <el-switch v-model="stepForm.allowSkip" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="指定下一审批人">
          <el-switch v-model="stepForm.allowDesignateNext" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="超时(小时)">
          <el-input-number v-model="stepForm.timeoutHours" :min="1" :max="720" />
        </el-form-item>
        <el-form-item label="退回动作">
          <el-select v-model="stepForm.rejectAction" style="width: 160px">
            <el-option label="结束(end)" value="end" />
            <el-option label="退回(return)" value="return" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="stepForm.rejectAction === 'return'" label="退回步骤">
          <el-input-number v-model="stepForm.rejectToStep" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stepDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveStep">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style scoped lang="scss">
.flow-steps {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }
  &__hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 8px;
  }
}
</style>
