import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref, toRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityDetail, withdrawActivity } from '@/shared/api/activities'
import { duplicateCheck } from '@/shared/api/applications'
import { awardDuplicateCheck } from '@/shared/api/awards'
import { getProfileInfo } from '@/shared/api/student'
import {
  activityCategoryOf,
  ARCHIVE_TYPE_ALIASES,
  deriveRecordTitle,
  mapDetailToForm,
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
  const _u_route = useRoute()
  const effectiveDraftKey = draftKey || type

  const form = reactive(emptyForm())
  const submitting = ref(false)
  // autoRestore=false：申报表单默认空白，不自动回填草稿；修改草稿走下拉记录"编辑"回填
  // minDraftFields：必填字段未填齐前不建后端草稿（扩展表 NOT NULL 列会被后端 409 拒绝），仅本地兜底
  const { clearDraft, saveNow, setRecordId } = useFormDraft(effectiveDraftKey, form, {
    autoRestore: false,
    type,
    minDraftFields: requiredFields.map((f) => f.key),
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
  // 查看详情弹窗加载态：真实后端记录需拉取详情接口补全表单字段，加载期间弹窗显示 loading
  const detailLoading = ref(false)

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
      // 申报提交成功消息由后端 MessageProduceAspect 在 submit 成功后自动写入 user_messages（archive→「申报提交成功」/award→「奖项申报提交成功」）。
      // 前端不再本地注入重复消息：假 id（notif-*）会让消息中心归档/已读请求后端 400，且刷新即消失。
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
        // 后端业务字段嵌在 detail.detail（后端字段名），按类型逆向映射为前端表单字段后并入 row，
        // 否则 emptyForm() 循环全部落空 → 表单空白（2026-08-31 修复）。
        // 注意不能用 {...row, ...detail} 直接展开：会把 row.status 覆盖成后端数字状态码
        if (detail) {
          row = { ...row, ...mapDetailToForm(type, detail) }
          // 退回原因（detail 顶层字段）：被退回记录编辑时回填提示，列表摘要不携带
          if (detail.rejectedReason) row.rejectedReason = detail.rejectedReason
        }
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

  /**
   * 消息中心「编辑」跳转支持：来源页带 ?edit=<id>（/applications?tab=xxx&edit=<id> 或 /awards/*?edit=<id>）
   * 记录列表加载完成后自动定位到对应记录并进入编辑态；触发后清除 edit 参数，刷新不再重复进入。
   * 未找到目标记录（已删除/类型不符）时静默回落普通列表，不阻断页面。
   */
  const editIdQuery = computed(() =>
    typeof _u_route.query.edit === 'string' ? _u_route.query.edit : '',
  )
  let editTriggeredFor = ''
  watch(
    [editIdQuery, () => records.value],
    () => {
      if (!editIdQuery.value || editTriggeredFor === editIdQuery.value) return
      const target = records.value.find((r) => String(r.id) === editIdQuery.value)
      if (!target) return
      editTriggeredFor = editIdQuery.value
      handleEditClick(target)
      const query = { ..._u_route.query }
      delete query.edit
      _u_router.replace({ query }).catch(() => {})
    },
    { immediate: true },
  )

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
  async function viewRecord(row: any) {
    rejectionReason.value = row.rejectedReason || ''
    // 先展示列表摘要，立即打开弹窗，避免点击后无反馈
    _viewRecord(row)
    // 真实后端记录：列表接口（GET /activities）仅返回摘要字段，详情接口才含用户填写的表单内容。
    // 拉取详情并逆向映射为表单字段后合并进展示记录，让「查看」展示申报表单填写的具体内容。
    const isBackendRecord =
      row.id && row.id !== DRAFT_LOCAL_ID && !String(row.id).startsWith('rec-')
    if (!isBackendRecord) return
    detailLoading.value = true
    try {
      const detail = await getActivityDetail(Number(row.id), activityCategoryOf(type as any))
      // mapDetailToForm 仅映射业务字段（不含 status），避免覆盖行上的前端状态/退回原因
      if (detail) _viewRecord({ ...row, ...mapDetailToForm(type, detail) })
    } catch {
      /* 详情拉取失败：沿用列表摘要字段 */
    } finally {
      detailLoading.value = false
    }
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
    detailLoading,
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
