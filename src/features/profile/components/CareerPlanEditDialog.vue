<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  addCareerAction,
  addCareerGoal,
  addCareerMilestone,
  updateCareerAction,
  updateCareerGoal,
  updateCareerMilestone,
} from '@/shared/api/career-plan'

const props = defineProps<{
  planId: number | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

type EditMode = 'goal' | 'action' | 'milestone'

const dialogVisible = ref(false)
const dialogMode = ref<EditMode>('goal')
const editingId = ref<number | null>(null)
// 行动归属于目标、里程碑归属于行动，作为新增时的上下文
let contextGoalId: number | null = null
let contextActionId: number | null = null

const dialogTitle = computed(() => {
  const isEdit = editingId.value != null
  if (dialogMode.value === 'goal') return isEdit ? '编辑目标' : '添加目标'
  if (dialogMode.value === 'action') return isEdit ? '编辑行动' : '添加行动'
  return isEdit ? '编辑里程碑' : '添加里程碑'
})

const goalForm = reactive({ goalTitle: '', goalDesc: '', targetDate: '' })
const actionForm = reactive({ actionTitle: '', actionDesc: '', startDate: '', endDate: '' })
const milestoneForm = reactive({ milestoneTitle: '', milestoneDate: '' })
const submitting = ref(false)

type OpenPayload =
  | { mode: 'goal'; goal?: any }
  | { mode: 'action'; goal: any; action?: any }
  | { mode: 'milestone'; action: any; milestone?: any }

/** 打开编辑弹窗：父组件通过 ref 调用（编辑/新增 目标、行动、里程碑） */
function open(payload: OpenPayload) {
  dialogMode.value = payload.mode
  if (payload.mode === 'goal') {
    editingId.value = payload.goal?.id ?? null
    goalForm.goalTitle = payload.goal?.goalTitle ?? ''
    goalForm.goalDesc = payload.goal?.goalDesc ?? ''
    goalForm.targetDate = payload.goal?.targetDate ?? ''
  } else if (payload.mode === 'action') {
    contextGoalId = payload.goal.id
    editingId.value = payload.action?.id ?? null
    actionForm.actionTitle = payload.action?.actionTitle ?? ''
    actionForm.actionDesc = payload.action?.actionDesc ?? ''
    actionForm.startDate = payload.action?.startDate ?? ''
    actionForm.endDate = payload.action?.endDate ?? ''
  } else {
    contextActionId = payload.action.id
    editingId.value = payload.milestone?.id ?? null
    milestoneForm.milestoneTitle = payload.milestone?.milestoneTitle ?? ''
    milestoneForm.milestoneDate = payload.milestone?.milestoneDate ?? ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (props.planId == null) return
  submitting.value = true
  try {
    if (dialogMode.value === 'goal') {
      if (!goalForm.goalTitle.trim()) {
        ElMessage.warning('请填写目标标题')
        return
      }
      const payload = {
        goalTitle: goalForm.goalTitle.trim(),
        goalDesc: goalForm.goalDesc,
        targetDate: goalForm.targetDate,
      }
      if (editingId.value == null) {
        await addCareerGoal(props.planId, payload)
      } else {
        await updateCareerGoal(props.planId, editingId.value, payload)
      }
      ElMessage.success(editingId.value == null ? '目标已添加' : '目标已更新')
    } else if (dialogMode.value === 'action') {
      if (!actionForm.actionTitle.trim()) {
        ElMessage.warning('请填写行动标题')
        return
      }
      const payload = {
        actionTitle: actionForm.actionTitle.trim(),
        actionDesc: actionForm.actionDesc,
        startDate: actionForm.startDate,
        endDate: actionForm.endDate,
      }
      if (editingId.value == null) {
        await addCareerAction(props.planId, contextGoalId!, payload)
      } else {
        await updateCareerAction(props.planId, editingId.value, payload)
      }
      ElMessage.success(editingId.value == null ? '行动已添加' : '行动已更新')
    } else {
      if (!milestoneForm.milestoneTitle.trim()) {
        ElMessage.warning('请填写里程碑标题')
        return
      }
      const payload = {
        milestoneTitle: milestoneForm.milestoneTitle.trim(),
        milestoneDate: milestoneForm.milestoneDate,
      }
      if (editingId.value == null) {
        await addCareerMilestone(props.planId, contextActionId!, payload)
      } else {
        await updateCareerMilestone(props.planId, editingId.value, payload)
      }
      ElMessage.success(editingId.value == null ? '里程碑已添加' : '里程碑已更新')
    }
    dialogVisible.value = false
    emit('saved')
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  dialogVisible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form label-width="90px">
      <template v-if="dialogMode === 'goal'">
        <el-form-item label="目标标题" required>
          <el-input v-model="goalForm.goalTitle" placeholder="请输入目标标题" />
        </el-form-item>
        <el-form-item label="目标描述">
          <el-input
            v-model="goalForm.goalDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入目标描述"
          />
        </el-form-item>
        <el-form-item label="目标日期">
          <el-date-picker
            v-model="goalForm.targetDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="form-w"
          />
        </el-form-item>
      </template>

      <template v-else-if="dialogMode === 'action'">
        <el-form-item label="行动标题" required>
          <el-input v-model="actionForm.actionTitle" placeholder="请输入行动标题" />
        </el-form-item>
        <el-form-item label="行动描述">
          <el-input
            v-model="actionForm.actionDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入行动描述"
          />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="actionForm.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="form-w"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="actionForm.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="form-w"
          />
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item label="里程碑标题" required>
          <el-input v-model="milestoneForm.milestoneTitle" placeholder="请输入里程碑标题" />
        </el-form-item>
        <el-form-item label="达成日期">
          <el-date-picker
            v-model="milestoneForm.milestoneDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="form-w"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.form-w {
  width: 100%;
}
</style>
