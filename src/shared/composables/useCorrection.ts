/**
 * useCorrection - 申报纠错 composable
 *
 * 管理纠错弹窗的状态和提交流程。
 * 配合 RejectionBanner / CorrectionDialog 使用。
 */
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { correctApplication } from '@/shared/api/applications'
import { buildCorrectionPayload } from '@/shared/api/submission/payload'
import { asRecord, asText } from '@/shared/utils/unknown'

/** 纠错表单 */
export interface CorrectionForm {
  reason: string
  changedFields: Record<string, { old: unknown; new: unknown }>
}

/** 不进入「变更字段」候选的展示型字段 */
const READONLY_FIELDS = new Set([
  'title',
  'typeLabel',
  'submitDate',
  'submitTime',
  'status',
  'rejectedReason',
  'proofMaterials',
])

export function useCorrection(type: string) {
  const correctionVisible = ref(false)
  const correctionSubmitting = ref(false)
  const correctionRecord = ref<Record<string, unknown> | null>(null)
  const originalSnapshot = ref<Record<string, unknown> | null>(null)

  const correctionForm = reactive<CorrectionForm>({
    reason: '',
    changedFields: {},
  })

  /** 可修改字段（含中文标签），用于弹窗里的字段选择 */
  function editableFields() {
    const snapshot = originalSnapshot.value || {}
    return Object.entries(snapshot)
      .filter(([key, value]) => {
        if (READONLY_FIELDS.has(key)) return false
        // 只保留基础类型字段（字符串/数字），跳过对象/数组等结构化字段
        return typeof value === 'string' || typeof value === 'number'
      })
      .map(([key, value]) => ({ key, value: String(value ?? '') }))
  }

  /** 打开纠错弹窗 */
  function openCorrection(record: unknown) {
    correctionRecord.value = asRecord(record)
    originalSnapshot.value = { ...asRecord(record) }
    correctionForm.reason = ''
    correctionForm.changedFields = {}
    correctionVisible.value = true
  }

  /** 详情接口返回后补全快照（保留已填写的修改原因与变更项） */
  function enrichCorrectionSnapshot(record: unknown) {
    if (!correctionVisible.value || !record) return
    originalSnapshot.value = { ...originalSnapshot.value, ...asRecord(record) }
  }

  /** 关闭纠错弹窗 */
  function closeCorrection() {
    correctionVisible.value = false
    correctionRecord.value = null
    originalSnapshot.value = null
    correctionForm.reason = ''
    correctionForm.changedFields = {}
  }

  /**
   * 设置字段：`reason` 是修改原因输入框的受控值，其余字段记为变更项。
   * （此前 reason 也走变更字段，导致输入框永远空、原因跑到「变更字段」里。）
   */
  function setChangedField(field: string, value: unknown) {
    if (field === 'reason') {
      correctionForm.reason = asText(value)
      return
    }
    if (!originalSnapshot.value) return
    correctionForm.changedFields[field] = {
      old: originalSnapshot.value[field],
      new: value,
    }
  }

  /** 移除某个变更项 */
  function removeChangedField(field: string) {
    delete correctionForm.changedFields[field]
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
      const changed: Record<string, unknown> = {}
      for (const [field, item] of Object.entries(correctionForm.changedFields)) {
        changed[field] = item.new
      }
      // 文档要求 correctedData 为「修正后的完整申报数据」：以详情快照为底，叠加本次变更。
      // 详情接口不可用时快照只有列表摘要字段，缺失字段不会凭空补值。
      const merged = { ...(originalSnapshot.value || {}), ...changed }
      const payload = await buildCorrectionPayload(type, merged)
      if (Object.keys(payload).length === 0) {
        ElMessage.warning('请填写修改后的内容')
        return
      }
      // 同时平铺一份：后端历史实现读平铺字段，新实现读 correctedData，两种都能兼容。
      await correctApplication(Number(correctionRecord.value?.id), {
        correctionReason: correctionForm.reason,
        correctedData: payload,
        ...payload,
      })
      ElMessage.success('修改申请已提交')
      closeCorrection()
    } catch {
      /* 拦截器已提示 */
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
    editableFields,
    openCorrection,
    enrichCorrectionSnapshot,
    closeCorrection,
    setChangedField,
    removeChangedField,
    submitCorrectionRequest,
  }
}
