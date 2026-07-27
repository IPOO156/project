import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/app/stores/stores'
import {
  checkDuplicate,
  getEnrollmentInfo,
  pushNotification,
  submitApplication,
  withdrawSubmission,
} from '@/shared/api/submission'
import { useCorrection } from './useCorrection'
import { useFormDraft } from './useFormDraft'
import { useFormEdit } from './useFormEdit'
import { useFormRecords } from './useFormRecords'
import { useScoreIndicator } from './useScoreIndicator'

export function useApplicationPage(
  type: string,
  typeLabel: string,
  emptyForm: () => Record<string, any>,
  draftKey?: string,
) {
  const _u_router = useRouter()
  const notificationStore = useNotificationStore()
  const effectiveDraftKey = draftKey || type

  const form = reactive(emptyForm())
  const submitting = ref(false)
  const { clearDraft, saveNow } = useFormDraft(effectiveDraftKey, form)
  const { records, addRecord, updateRecord, removeRecord } = useFormRecords(type)
  const {
    editingId,
    detailVisible,
    detailRecord,
    isEditing,
    viewRecord: _viewRecord,
    startEdit,
    cancelEdit,
    closeDetail,
  } = useFormEdit()

  const extendedForm = reactive({
    role: '',
    certNumber: '',
    issuingAuthority: '',
    acquisitionDate: '',
    validityPeriod: '',
  })
  function resetExtendedForm() {
    Object.assign(extendedForm, {
      role: '',
      certNumber: '',
      issuingAuthority: '',
      acquisitionDate: '',
      validityPeriod: '',
    })
  }

  const enrollmentInfo = ref<any>(undefined)
  async function loadEnrollmentInfo() {
    try {
      enrollmentInfo.value = await getEnrollmentInfo()
    } catch {
      /* ignore */
    }
  }

  const duplicateVisible = ref(false)
  const duplicateItems = ref<any[]>([])
  let pendingSubmitData: Record<string, any> | null = null
  async function checkDuplicateBeforeSubmit(data: Record<string, any>): Promise<boolean> {
    try {
      const r = await checkDuplicate({ type, title: data.title || '' })
      if (r.duplicate) {
        duplicateItems.value = r.existing
          ? [{ type, typeLabel, title: r.existing.title, timeRange: r.existing.submitDate }]
          : []
        duplicateVisible.value = true
        pendingSubmitData = data
        return false
      }
      return true
    } catch {
      return true
    }
  }
  function confirmDuplicateSubmit() {
    duplicateVisible.value = false
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData)
      pendingSubmitData = null
    }
  }
  function cancelDuplicateSubmit() {
    duplicateVisible.value = false
    pendingSubmitData = null
  }

  const {
    correctionVisible,
    correctionSubmitting,
    correctionRecord: correctionData,
    originalSnapshot,
    correctionForm,
    openCorrection,
    closeCorrection,
    setChangedField,
    submitCorrectionRequest,
  } = useCorrection()
  const {
    indicators,
    indicatorVisible,
    indicatorLoading,
    indicatorTitle,
    openIndicator,
    closeIndicator,
  } = useScoreIndicator()

  const currentStatus = ref('')

  async function doSubmit(data: Record<string, any>) {
    submitting.value = true
    try {
      const submitData = {
        ...toRaw(data),
        role: extendedForm.role || undefined,
        certNumber: extendedForm.certNumber || undefined,
        issuingAuthority: extendedForm.issuingAuthority || undefined,
        acquisitionDate: extendedForm.acquisitionDate || undefined,
        validityPeriod: extendedForm.validityPeriod || undefined,
      }
      await submitApplication({ type, typeLabel, ...submitData })
      const title =
        (submitData as any).competitionName ||
        (submitData as any).projectName ||
        (submitData as any).companyName ||
        (submitData as any).bookName ||
        (submitData as any).certName ||
        (submitData as any).activityName ||
        `${typeLabel}申报`
      if (editingId.value) {
        updateRecord(editingId.value, { title, ...submitData, status: 'pending' })
        editingId.value = null
      } else {
        addRecord(title, { ...submitData, status: 'pending' })
      }
      await clearDraft()
      await pushNotification({
        title: `${typeLabel}申报已提交`,
        content: `您的${typeLabel}「${title}」已成功提交。`,
        category: 'review',
        link: '/approval/pending',
      })
      notificationStore.addNotification({
        title: `${typeLabel}申报已提交`,
        content: `您的${typeLabel}「${title}」已成功提交。`,
        category: 'review',
        link: '/approval/pending',
      })
      ElMessage.success('申报提交成功')
      resetForm()
    } catch {
      ElMessage.error('提交失败')
    } finally {
      submitting.value = false
    }
  }

  async function handleSubmit() {
    const ok = await checkDuplicateBeforeSubmit({ ...toRaw(form) })
    if (ok) await doSubmit(toRaw(form))
  }

  function handleSaveDraft() {
    const submitData = {
      ...toRaw(form),
      role: extendedForm.role || undefined,
      certNumber: extendedForm.certNumber || undefined,
      issuingAuthority: extendedForm.issuingAuthority || undefined,
      acquisitionDate: extendedForm.acquisitionDate || undefined,
      validityPeriod: extendedForm.validityPeriod || undefined,
    }
    const title =
      (submitData as any).competitionName ||
      (submitData as any).projectName ||
      (submitData as any).companyName ||
      (submitData as any).bookName ||
      (submitData as any).certName ||
      (submitData as any).activityName ||
      `${typeLabel}草稿`
    if (editingId.value) {
      updateRecord(editingId.value, { title, ...submitData, status: 'draft' })
    } else {
      addRecord(title, { ...submitData, status: 'draft' })
    }
    saveNow()
    ElMessage.success('草稿已保存')
    currentStatus.value = 'draft'
  }

  async function handleWithdraw(row: any) {
    try {
      await ElMessageBox.confirm('确定撤回？', '撤回确认', { type: 'warning' })
      await withdrawSubmission(row.id)
      updateRecord(row.id, { status: 'withdrawn' })
      ElMessage.success('已撤回')
    } catch {
      /* cancel */
    }
  }

  function handleEditClick(row: any) {
    Object.keys(emptyForm()).forEach((key) => {
      if (key in row) (form as any)[key] = row[key] ?? ''
    })
    extendedForm.role = row.role || ''
    extendedForm.certNumber = row.certNumber || ''
    extendedForm.issuingAuthority = row.issuingAuthority || ''
    extendedForm.acquisitionDate = row.acquisitionDate || ''
    extendedForm.validityPeriod = row.validityPeriod || ''
    currentStatus.value = row.status || 'draft'
    startEdit(row)
  }

  function handleCancel() {
    cancelEdit()
    resetForm()
  }
  function resetForm() {
    Object.assign(form, emptyForm())
    resetExtendedForm()
    currentStatus.value = ''
  }
  function handleViewScore(row: any) {
    openIndicator(type, row.title || '')
  }
  function handleCorrection(row: any) {
    openCorrection(row)
  }
  function viewRecord(row: any) {
    _viewRecord(row)
  }
  function init() {
    loadEnrollmentInfo()
  }

  return {
    form,
    submitting,
    records,
    isEditing,
    editingId,
    detailVisible,
    detailRecord,
    currentStatus,
    enrollmentInfo,
    extendedForm,
    duplicateVisible,
    duplicateItems,
    confirmDuplicateSubmit,
    cancelDuplicateSubmit,
    correctionVisible,
    correctionSubmitting,
    correctionData,
    originalSnapshot,
    correctionForm,
    closeCorrection,
    setChangedField,
    submitCorrection: submitCorrectionRequest,
    indicators,
    indicatorVisible,
    indicatorLoading,
    indicatorTitle,
    closeIndicator,
    init,
    handleSubmit,
    handleSaveDraft,
    handleEditClick,
    handleCancel,
    handleWithdraw,
    handleViewScore,
    handleCorrection,
    viewRecord,
    removeRecord,
    closeDetail,
    resetForm,
    saveNow,
  }
}
