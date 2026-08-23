import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/app/stores/stores'
import { getActivityDetail, withdrawActivity } from '@/shared/api/activities'
import { duplicateCheck } from '@/shared/api/applications'
import { awardDuplicateCheck } from '@/shared/api/awards'
import { getProfileInfo } from '@/shared/api/student'
import {
  activityCategoryOf,
  deriveRecordTitle,
  pushNotification,
  submitApplication,
} from '@/shared/api/submission'
import { useCorrection } from './useCorrection'
import { useFormDraft } from './useFormDraft'
import { useFormEdit } from './useFormEdit'
import { DRAFT_LOCAL_ID, useFormRecords } from './useFormRecords'
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
  // autoRestore=false：申报表单默认空白，不自动回填草稿；修改草稿走下拉记录"编辑"回填
  const { clearDraft, saveNow } = useFormDraft(effectiveDraftKey, form, { autoRestore: false })
  const {
    records,
    loadRecords,
    addRecord,
    updateRecord,
    removeRecord: _removeRecord,
  } = useFormRecords(type, `form_draft_${effectiveDraftKey}`)

  /** 删除记录：本地草稿一并清空 localStorage（草稿仅本地持久化，无后端删除接口） */
  function removeRecord(id: string) {
    if (id === DRAFT_LOCAL_ID) clearDraft()
    _removeRecord(id)
  }
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
      const profile = await getProfileInfo()
      enrollmentInfo.value = {
        grade: profile.academicInfo?.grade ?? '',
        className: profile.academicInfo?.className ?? '',
        major: profile.academicInfo?.major ?? '',
        studentId: profile.academicInfo?.studentNo ?? '',
        college: profile.academicInfo?.collegeName ?? '',
      }
    } catch {
      /* ignore */
    }
  }

  const duplicateVisible = ref(false)
  const duplicateItems = ref<any[]>([])
  let pendingSubmitData: Record<string, any> | null = null
  async function checkDuplicateBeforeSubmit(data: Record<string, any>): Promise<boolean> {
    try {
      const title =
        data.title ||
        data.competitionName ||
        data.projectName ||
        data.activityName ||
        data.bookName ||
        data.awardName ||
        data.certName ||
        ''
      // 奖项报名走 8.1.2 POST /awards/duplicate-check；档案申报走 POST /applications/duplicate-check
      const r: any =
        activityCategoryOf(type as any) === 'award'
          ? await awardDuplicateCheck({
              awardType: type,
              certificateNo: data.certNumber,
              title,
              participatedTime:
                data.competitionDate ||
                data.approveDate ||
                data.publishDate ||
                data.registerDate ||
                undefined,
            })
          : await duplicateCheck({
              archiveType: type,
              certificateNo: data.certNumber,
              title,
              obtainedTime: data.awardDate || data.acquireDate || data.certDate || undefined,
            })
      // 奖项(8.x)返回 isDuplicate/duplicateRecords；档案(7.0.1)实测返回 hasDuplicate/similarItems，统一归一化读取
      const isDuplicateResult = r?.isDuplicate ?? r?.hasDuplicate
      const duplicateList = r?.duplicateRecords ?? r?.similarItems ?? []
      if (isDuplicateResult) {
        duplicateItems.value = duplicateList.map((d: any) => ({
          type,
          typeLabel,
          title: d.title,
          timeRange: `${d.statusLabel || ''}`,
        }))
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
      const title = deriveRecordTitle(submitData) || `${typeLabel}申报`
      if (editingId.value) {
        updateRecord(editingId.value, { title, ...submitData, status: 'pending' })
        editingId.value = null
      } else {
        addRecord(title, { ...submitData, status: 'pending' })
      }
      await clearDraft()
      await loadRecords() // 提交成功后刷新真实列表，新记录以真实 id/状态展示
      await pushNotification({
        title: `${typeLabel}申报已提交`,
        content: `您的${typeLabel}「${title}」已成功提交。`,
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
      notificationStore.addNotification({
        title: `${typeLabel}申报已提交`,
        content: `您的${typeLabel}「${title}」已成功提交。`,
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
      ElMessage.success('申报提交成功')
      resetForm()
      // 清空表单后再次清草稿：防深 watcher（800ms 防抖）在 clearDraft 与 resetForm 之间把旧内容重写回 localStorage
      await clearDraft()
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

  async function handleSaveDraft() {
    // 后端无草稿增删改接口（仅 POST 支持 isDraft=1，且无删除/更新端点），草稿统一本地持久化：
    // saveNow 写入 localStorage，随后 loadRecords 把本地草稿合并进列表，保证刷新后草稿仍可见。
    // 保存后表单转空白待填写态：修改草稿需在下拉记录里点"编辑"回填，正常情况表单保持空白。
    saveNow()
    currentStatus.value = 'draft'
    await loadRecords()
    resetForm()
    cancelEdit()
    ElMessage.success('草稿已保存')
  }

  async function handleWithdraw(row: any) {
    try {
      await ElMessageBox.confirm('确定撤回？', '撤回确认', { type: 'warning' })
      await withdrawActivity(Number(row.id), activityCategoryOf(type as any))
      updateRecord(row.id, { status: 'withdrawn' })
      ElMessage.success('已撤回')
    } catch {
      /* cancel */
    }
  }

  async function handleEditClick(row: any) {
    // 后端真实记录（非本地临时 rec- / draft-local 记录）：拉取 6.2 详情补齐表单字段（列表仅含摘要字段）
    if (row.id && row.id !== DRAFT_LOCAL_ID && !String(row.id).startsWith('rec-')) {
      try {
        const detail = await getActivityDetail(Number(row.id), activityCategoryOf(type as any))
        if (detail) row = { ...row, ...detail }
      } catch {
        /* 详情拉取失败时沿用 row 摘要字段 */
      }
    }
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
