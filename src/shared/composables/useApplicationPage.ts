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
  ARCHIVE_TYPE_ALIASES,
  deriveRecordTitle,
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
  requiredFields: { key: string; label: string }[] = [],
) {
  const _u_router = useRouter()
  const notificationStore = useNotificationStore()
  const effectiveDraftKey = draftKey || type

  const form = reactive(emptyForm())
  const submitting = ref(false)
  // autoRestore=false：申报表单默认空白，不自动回填草稿；修改草稿走下拉记录"编辑"回填
  const { clearDraft, saveNow, setRecordId } = useFormDraft(effectiveDraftKey, form, {
    autoRestore: false,
    type,
  })
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

  async function checkDuplicateBeforeSubmit(data: Record<string, any>): Promise<boolean> {
    try {
      const title = deriveRecordTitle(data)
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
              archiveType: ARCHIVE_TYPE_ALIASES[type]?.[0] ?? type,
              certificateNo: data.certNumber,
              title,
              obtainedTime: data.acquisitionDate,
            })
      // 奖项(8.x)返回 isDuplicate/duplicateRecords；档案(7.0.1)实测返回 hasDuplicate/similarItems/suggestion，统一归一化读取
      const hasDuplicate = r?.isDuplicate ?? r?.hasDuplicate
      const duplicateList = (r?.duplicateRecords ?? r?.similarItems ?? []) as any[]
      if (hasDuplicate) {
        const items = duplicateList
          .map((d) => `${d.title}${d.similarity != null ? `（相似度 ${d.similarity}%）` : ''}`)
          .join('<br/>')
        const suggestion = r?.suggestion ? `<br/>建议：${r.suggestion}` : ''
        ElMessageBox.alert((items || '检测到可能重复的申报记录') + suggestion, '检测到重复申报', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '知道了',
          type: 'warning',
        }).catch(() => {})
        return false
      }
      return true
    } catch {
      return true
    }
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
  // 被退回原因：编辑/查看退回记录时回填，传给 ApplicationFormRecord 的 rejection-reason 属性
  const rejectionReason = ref('')

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
    // 必填项校验：后端对应档案扩展表多为 NOT NULL 字段，空值会被 buildContractPayload 跳过，
    // 直接 POST 会触发后端非空约束 → 409「数据校验失败」。这里在本地拦截并明确提示缺哪个字段。
    const missing = requiredFields.filter((f) => {
      const v = (form as any)[f.key]
      return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    })
    if (missing.length > 0) {
      ElMessage.warning(`请填写必填项：${missing.map((f) => f.label).join('、')}`)
      return
    }
    const ok = await checkDuplicateBeforeSubmit({
      ...toRaw(form),
      acquisitionDate: extendedForm.acquisitionDate || undefined,
    })
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
    const isBackendRecord =
      row.id && row.id !== DRAFT_LOCAL_ID && !String(row.id).startsWith('rec-')
    // 真实记录回填其 id，后续自动保存走 autosave；本地草稿/临时记录无服务端 id，首次保存走 isDraft=1 建草稿
    setRecordId(isBackendRecord ? Number(row.id) : null)
    if (isBackendRecord) {
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
    rejectionReason.value = row.rejectedReason || ''
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
    rejectionReason.value = ''
    setRecordId(null)
  }
  function handleViewScore(row: any) {
    openIndicator(type, row.title || '')
  }
  function handleCorrection(row: any) {
    openCorrection(row)
  }
  function viewRecord(row: any) {
    rejectionReason.value = row.rejectedReason || ''
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
    rejectionReason,
    enrollmentInfo,
    extendedForm,
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
