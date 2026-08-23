/**
 * useCorrection - 申报纠错 composable
 *
 * 管理纠错弹窗的状态和提交流程。
 * 配合 RejectionBanner / CorrectionDialog 使用。
 */
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { correctApplication } from '@/shared/api/applications'
import { pushNotification } from '@/shared/api/submission'

/** 纠错表单 */
export interface CorrectionForm {
  reason: string
  changedFields: Record<string, { old: any; new: any }>
}

export function useCorrection() {
  const correctionVisible = ref(false)
  const correctionSubmitting = ref(false)
  const correctionRecord = ref<any>(null)
  const originalSnapshot = ref<any>(null)

  const correctionForm = reactive<CorrectionForm>({
    reason: '',
    changedFields: {},
  })

  /** 打开纠错弹窗 */
  function openCorrection(record: any) {
    correctionRecord.value = record
    originalSnapshot.value = { ...record }
    correctionForm.reason = ''
    correctionForm.changedFields = {}
    correctionVisible.value = true
  }

  /** 关闭纠错弹窗 */
  function closeCorrection() {
    correctionVisible.value = false
    correctionRecord.value = null
    originalSnapshot.value = null
    correctionForm.reason = ''
    correctionForm.changedFields = {}
  }

  /** 设置变更字段 */
  function setChangedField(field: string, value: any) {
    if (!originalSnapshot.value) return
    correctionForm.changedFields[field] = {
      old: originalSnapshot.value[field],
      new: value,
    }
  }

  /** 提交纠错申请 */
  async function submitCorrectionRequest() {
    if (!correctionForm.reason) {
      ElMessage.warning('请填写修改原因')
      return
    }
    if (Object.keys(correctionForm.changedFields).length === 0) {
      ElMessage.warning('请选择要修改的字段')
      return
    }

    correctionSubmitting.value = true
    try {
      await correctApplication(Number(correctionRecord.value?.id), {
        correctionReason: correctionForm.reason,
        correctedData: correctionForm.changedFields,
      })
      await pushNotification({
        title: '更正申请已提交',
        content: '您的更正申请已提交，等待审核。',
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
      ElMessage.success('修改申请已提交')
      closeCorrection()
    } catch {
      ElMessage.error('提交失败，请重试')
    } finally {
      correctionSubmitting.value = false
    }
  }

  return {
    correctionVisible,
    correctionSubmitting,
    correctionRecord,
    originalSnapshot,
    correctionForm,
    openCorrection,
    closeCorrection,
    setChangedField,
    submitCorrectionRequest,
  }
}
