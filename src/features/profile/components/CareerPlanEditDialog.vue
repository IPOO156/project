<script setup lang="ts">
import type { UploadFile } from 'element-plus'
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
import { uploadFile } from '@/shared/api/common'

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
/** 仅维护里程碑成果证明（已通过规划不允许改标题/日期） */
const proofOnly = ref(false)
// 行动归属于目标、里程碑归属于行动，作为新增时的上下文
let contextGoalId: number | null = null
let contextActionId: number | null = null

const dialogTitle = computed(() => {
  const isEdit = editingId.value != null
  if (dialogMode.value === 'goal') return isEdit ? '编辑目标' : '添加目标'
  if (dialogMode.value === 'action') return isEdit ? '编辑行动' : '添加行动'
  if (proofOnly.value) return '里程碑成果证明'
  return isEdit ? '编辑里程碑' : '添加里程碑'
})

const goalForm = reactive({ goalTitle: '', goalDesc: '', targetDate: '' })
const actionForm = reactive({ actionTitle: '', actionDesc: '', startDate: '', endDate: '' })
const milestoneForm = reactive({ milestoneTitle: '', milestoneDate: '' })
/** 里程碑佐证：新选文件优先；已有凭证可移除（更新时传 proofFileId=0 解绑） */
const proofFile = ref<File | null>(null)
const proofFileName = ref('')
const proofFileId = ref<number | null>(null)
const removeProof = ref(false)
const submitting = ref(false)

function handleProofChange(file: UploadFile) {
  proofFile.value = file.raw ?? null
  proofFileName.value = file.name ?? ''
  removeProof.value = false
}

function clearProofState() {
  proofFile.value = null
  proofFileName.value = ''
  proofFileId.value = null
  removeProof.value = false
}

/** 目标反显字段（弹窗只读取展示字段） */
interface EditGoalFields {
  id?: number
  goalTitle?: string
  goalDesc?: string
  targetDate?: string
}

/** 行动反显字段 */
interface EditActionFields {
  id?: number
  actionTitle?: string
  actionDesc?: string
  startDate?: string
  endDate?: string
}

/** 里程碑反显字段 */
interface EditMilestoneFields {
  id?: number
  milestoneTitle?: string
  milestoneDate?: string
  proofFileId?: number
  proofFileName?: string
}

type OpenPayload =
  | { mode: 'goal'; goal?: EditGoalFields }
  | { mode: 'action'; goal: EditActionFields; action?: EditActionFields }
  | {
      mode: 'milestone'
      action: EditActionFields
      milestone?: EditMilestoneFields
      proofOnly?: boolean
    }

/** 打开编辑弹窗：父组件通过 ref 调用（编辑/新增 目标、行动、里程碑） */
function open(payload: OpenPayload) {
  clearProofState()
  dialogMode.value = payload.mode
  proofOnly.value = payload.mode === 'milestone' && Boolean(payload.proofOnly)
  if (payload.mode === 'goal') {
    editingId.value = payload.goal?.id ?? null
    goalForm.goalTitle = payload.goal?.goalTitle ?? ''
    goalForm.goalDesc = payload.goal?.goalDesc ?? ''
    goalForm.targetDate = payload.goal?.targetDate ?? ''
  } else if (payload.mode === 'action') {
    contextGoalId = payload.goal.id ?? null
    editingId.value = payload.action?.id ?? null
    actionForm.actionTitle = payload.action?.actionTitle ?? ''
    actionForm.actionDesc = payload.action?.actionDesc ?? ''
    actionForm.startDate = payload.action?.startDate ?? ''
    actionForm.endDate = payload.action?.endDate ?? ''
  } else {
    contextActionId = payload.action.id ?? null
    editingId.value = payload.milestone?.id ?? null
    milestoneForm.milestoneTitle = payload.milestone?.milestoneTitle ?? ''
    milestoneForm.milestoneDate = payload.milestone?.milestoneDate ?? ''
    proofFileId.value = payload.milestone?.proofFileId ?? null
    proofFileName.value = payload.milestone?.proofFileName ?? ''
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
      const isProofOnly = proofOnly.value && editingId.value != null
      const title = milestoneForm.milestoneTitle.trim()
      const date = milestoneForm.milestoneDate
      if (isProofOnly) {
        if (!proofFile.value && !removeProof.value) {
          ElMessage.warning('请选择新的成果证明文件，或点击「移除」解绑原文件')
          return
        }
      } else if (!title) {
        ElMessage.warning('请填写里程碑标题')
        return
      }
      // 新选的佐证先上传拿 fileId；未选新文件时沿用原有绑定
      let uploadedProofId: number | undefined
      if (proofFile.value) {
        const uploaded = await uploadFile({
          file: proofFile.value,
          type: 'evidence',
          module: 'career_plan',
        })
        uploadedProofId = uploaded.fileId
      }
      if (isProofOnly) {
        // 已通过规划只允许维护成果证明：不改标题/日期（标题原样回传以通过后端一致性校验）
        await updateCareerMilestone(props.planId, editingId.value!, {
          milestoneTitle: title,
          proofFileId: uploadedProofId != null ? uploadedProofId : 0,
        })
        ElMessage.success('成果证明已更新')
      } else if (editingId.value == null) {
        const created = await addCareerMilestone(props.planId, contextActionId!, {
          milestoneTitle: title,
          milestoneDate: date,
          proofFileId: uploadedProofId,
        })
        // 新增接口可能不接收 proofFileId（后端 DTO 未含该字段时静默忽略），
        // 创建成功后再用 PUT 绑定佐证，保证 proof_file_id 一定落库
        if (uploadedProofId != null) {
          await updateCareerMilestone(props.planId, created.milestoneId, {
            milestoneTitle: title,
            milestoneDate: date,
            proofFileId: uploadedProofId,
          })
        }
      } else {
        const payload: { milestoneTitle: string; milestoneDate: string; proofFileId?: number } = {
          milestoneTitle: title,
          milestoneDate: date,
        }
        if (uploadedProofId != null) payload.proofFileId = uploadedProofId
        else if (removeProof.value) payload.proofFileId = 0
        await updateCareerMilestone(props.planId, editingId.value, payload)
      }
      if (!isProofOnly) {
        ElMessage.success(editingId.value == null ? '里程碑已添加' : '里程碑已更新')
      }
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
        <template v-if="!proofOnly">
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
        <el-form-item :label="proofOnly ? '成果证明' : '佐证材料'">
          <div class="proof">
            <span v-if="proofFile" class="proof__name">{{ proofFileName }}</span>
            <template v-else-if="proofFileId && !removeProof">
              <span class="proof__name">{{ proofFileName || '已绑定佐证' }}</span>
              <el-button link type="danger" size="small" @click="removeProof = true"
                >移除</el-button
              >
            </template>
            <el-upload :auto-upload="false" :show-file-list="false" :on-change="handleProofChange">
              <el-button size="small">{{
                proofFileId || proofFile ? '更换文件' : '选择文件'
              }}</el-button>
            </el-upload>
            <span v-if="removeProof" class="proof__hint">保存后将解绑原佐证</span>
            <span v-if="proofOnly" class="proof__hint"
              >已通过规划仅可维护成果证明，标题与日期不可修改</span
            >
          </div>
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

.proof {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  &__name {
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__hint {
    width: 100%;
    font-size: 12px;
    color: var(--el-color-warning);
  }
}
</style>
