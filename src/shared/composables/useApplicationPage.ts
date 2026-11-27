import type { UploadUserFile } from 'element-plus'
import type { FormRecord } from './useFormRecords'
import type { ApplicationType } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref, toRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteActivity, getActivityDetail, withdrawActivity } from '@/shared/api/activities'
import { getProfileInfo } from '@/shared/api/student'
import {
  activityCategoryOf,
  deriveRecordTitle,
  mapDetailToForm,
  submitApplication,
} from '@/shared/api/submission'
import { toDateString } from '@/shared/api/submission/payload'
import {
  buildSemesterEndMonthDisabledDate,
  buildSemesterMonthDisabledDate,
  isMonthAfterDate,
  isMonthInSemester,
  normalizeMonthValue,
  parseSemesterRange,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'
import { asOptionalNumber, asText } from '@/shared/utils/unknown'
import { useCorrection } from './useCorrection'
import { checkDuplicateBeforeSubmit } from './useDuplicateCheck'
import { useFormDraft } from './useFormDraft'
import { useFormEdit } from './useFormEdit'
import { DRAFT_LOCAL_ID, useFormRecords } from './useFormRecords'
import { useScoreIndicator } from './useScoreIndicator'
import { semesterEndDateOf } from './useSemesters'

/**
 * 学期-日期联动配置：当表单存在「学期」+「月份日期」联动校验时启用。
 * 启用后自动处理：日期选择器禁用非该学期月份、学期变化时清空不匹配日期、提交前校验。
 */
export interface SemesterMonthConfig {
  /** 日期字段名，如 competitionDate / registerDate / publishDate / approveDate / startDate */
  monthField: string
  /** 日期字段中文名，用于错误提示，如「参赛时间」「注册时间」 */
  monthFieldLabel: string
  /**
   * 只校验上界：日期不得晚于学期 endDate（取自 GET /common/semesters 返回的 endDate）。
   * 用于「立项时间」这类允许早于学期开始的日期；不传则仍按「必须落在学期区间内」校验。
   */
  endDateOnly?: boolean
}

export function useApplicationPage<F extends Record<string, unknown>>(
  type: string,
  typeLabel: string,
  emptyForm: () => F,
  draftKey?: string,
  requiredFields: { key: string; label: string }[] = [],
  semesterMonthConfig?: SemesterMonthConfig,
) {
  const _u_router = useRouter()
  const _u_route = useRoute()
  const effectiveDraftKey = draftKey || type

  // 申报页表单统一包含佐证材料上传；emptyForm 里历史写法为 `[] as string[]`，
  // 这里按 el-upload 的真实绑定类型收窄，避免模板 v-model:file-list 类型不匹配。
  const form = reactive(emptyForm()) as F & { proofMaterials?: UploadUserFile[] }
  // 申报类型 key 由页面常量传入（对应 ApplicationType），activityCategoryOf 参数类型收窄为 ApplicationType
  const appType = type as ApplicationType
  const submitting = ref(false)
  /** 保存草稿进行中：按钮 loading + 入口拦截，防止连点触发重复建草稿/重复 autosave */
  const draftSaving = ref(false)
  /** 查重进行中：防止连点导致重复查重、重复弹窗 */
  let duplicateChecking = false

  // ── 学期-日期联动 ──
  // 配置了 semesterMonthConfig 时，自动处理：
  // 1. disabledDate：日期选择器禁用非该学期的月份
  // 2. watch 学期变化：若已选日期不在新学期内则清空
  // 3. handleSubmit：提交前校验日期与学期是否匹配
  const disabledDate = computed(() => {
    if (!semesterMonthConfig) return () => false
    if (semesterMonthConfig.endDateOnly) {
      return buildSemesterEndMonthDisabledDate(semesterEndDateOf(form.semester))
    }
    return buildSemesterMonthDisabledDate(form.semester)
  })

  if (semesterMonthConfig) {
    const { monthField, monthFieldLabel, endDateOnly } = semesterMonthConfig
    watch(
      () => form.semester,
      () => {
        const before = String((form as Record<string, unknown>)[monthField] ?? '').trim()
        sanitizeSemesterMonthPair(
          form,
          monthField,
          'semester',
          endDateOnly ? semesterEndDateOf(form.semester) : undefined,
        )
        const after = String((form as Record<string, unknown>)[monthField] ?? '').trim()
        // 只有“原来有值、切换学期后被清空”才提示；日期本来就匹配时不会被重置
        if (before && !after) {
          ElMessage.warning(`${monthFieldLabel}与所选学期不匹配，已清空，请重新选择`)
        }
      },
    )
  }
  // 扩展信息（本人角色/证书编号等）独立于主表单维护，模板中由 ApplicationFormRecord 双向绑定
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

  // autoRestore=false：申报表单默认空白，不自动回填草稿；修改草稿走下拉记录"编辑"回填
  // minDraftFields：必填字段未填齐前不建后端草稿（扩展表 NOT NULL 列会被后端 409 拒绝），仅本地兜底
  // extras：扩展信息不在 form 内，需一并并入草稿/建草稿请求体（提交路径 doSubmit 已合并）
  const { clearDraft, saveNow, setRecordId } = useFormDraft(effectiveDraftKey, form, {
    autoRestore: false,
    type,
    minDraftFields: requiredFields.map((f) => f.key),
    extras: extendedForm,
  })
  const {
    records,
    loadRecords,
    addRecord,
    updateRecord,
    removeRecord: _removeRecord,
  } = useFormRecords(type, `form_draft_${effectiveDraftKey}`)

  /**
   * 删除记录：后端真实记录调用 DELETE /activities/{type}/{id}，成功后才从列表移除；
   * 本地草稿（draft-local）仅清空 localStorage，临时 id（rec-*）只存在于内存。
   * 失败时由请求拦截器提示，记录保留在列表中，避免「提示已删除、刷新又出现」。
   */
  async function removeRecord(id: string) {
    if (id === DRAFT_LOCAL_ID) {
      // 本地草稿已关联后端草稿时，列表里显示的是同一份草稿；只清本地副本的话，
      // 下次刷新后端草稿会重新出现。这里连同后端记录一起删除，删除失败则不清理本地。
      const linked = records.value.find((r) => r.id === DRAFT_LOCAL_ID)?.backendId
      if (linked != null) {
        await deleteActivity(Number(linked), activityCategoryOf(appType))
      }
      clearDraft()
    } else if (/^\d+$/.test(id)) {
      await deleteActivity(Number(id), activityCategoryOf(appType))
    }
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
    closeDetail: _closeDetail,
  } = useFormEdit()

  const enrollmentInfo = ref<Record<string, string> | undefined>(undefined)
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

  const {
    correctionVisible,
    correctionSubmitting,
    correctionRecord: correctionData,
    originalSnapshot,
    correctionForm,
    openCorrection,
    enrichCorrectionSnapshot,
    closeCorrection,
    setChangedField,
    removeChangedField,
    submitCorrectionRequest,
  } = useCorrection(type)
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
  // 详情请求序号：快速切换记录或关闭弹窗后，晚到的响应不得覆盖当前内容/重新打开弹窗
  let viewSeq = 0
  /** 详情接口不可用：编辑/查看按列表摘要降级，提示用户缺失字段 */
  const detailUnavailable = ref(false)

  async function doSubmit(data: Record<string, unknown>) {
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
      // 编辑已存在的后端记录时带上 recordId：submitApplication 内部改走 PUT 更新，
      // 避免「编辑后提交」变成新增一条、旧记录残留。
      const editing = editingId.value
      // 自动保存已建过后端草稿（form.archiveId/applicationId）时，正式提交复用该 id，
      // 走 PUT 更新为待审批，避免残留一条草稿（报告 #7）
      const draftId = data.archiveId ?? data.applicationId
      const recordId =
        editing && /^\d+$/.test(editing)
          ? Number(editing)
          : draftId != null && /^\d+$/.test(String(draftId))
            ? Number(draftId)
            : undefined
      await submitApplication({ type, typeLabel, recordId, ...submitData })
      const title = deriveRecordTitle(submitData) || `${typeLabel}申报`
      if (editing) {
        updateRecord(editing, { title, ...submitData, status: 'pending' })
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
    } catch (err) {
      // 响应拦截器已提示后端错误；此处只补前端自身抛出的错误（如契约缺失、主记录创建失败），
      // 避免与拦截器重复弹窗，也避免「提交失败却提示成功」。
      if (
        err instanceof Error &&
        !('isAxiosError' in err) &&
        !(err as Error & { __handled?: boolean }).__handled &&
        err.message
      ) {
        ElMessage.error(err.message)
      }
    } finally {
      submitting.value = false
    }
  }

  async function handleSubmit() {
    // 连点保护：查重阶段还没进入 doSubmit，submitting 仍是 false，需要在入口单独拦截
    if (submitting.value || duplicateChecking) return
    // 必填项校验：后端对应档案扩展表多为 NOT NULL 字段，空值会被 buildContractPayload 跳过，
    // 直接 POST 会触发后端非空约束 → 409「数据校验失败」。这里在本地拦截并明确提示缺哪个字段。
    const missing = requiredFields.filter((f) => {
      const v = (form as Record<string, unknown>)[f.key]
      return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    })
    if (missing.length > 0) {
      ElMessage.warning(`请填写必填项：${missing.map((f) => f.label).join('、')}`)
      return
    }
    // 起止时间先后校验：指南明确要求结束时间不得早于开始时间，本地先拦截，避免提交后才被后端拒绝
    const startDate = toDateString((form as Record<string, unknown>).startDate)
    const endDate = toDateString((form as Record<string, unknown>).endDate)
    if (startDate && endDate && startDate > endDate) {
      ElMessage.error('结束时间不能早于开始时间')
      return
    }
    // 学期-日期联动校验：若配置了 monthField，提交前校验日期是否在所选学期内。
    // 这里**只校验、不清空**表单：清空动作只属于「学期切换」场景（见上方 watch）。
    // 提交时若直接清空，用户会看到“日期自己消失”，且输入内容丢失（2026-11-12 反馈）。
    // 学期名称无法解析时跳过校验（不做误判），避免管理员自定义学期名导致永远无法提交。
    if (semesterMonthConfig) {
      const { monthField, monthFieldLabel, endDateOnly } = semesterMonthConfig
      if (endDateOnly) {
        // 只设上界：日期不得晚于学期结束日期。
        // 优先用后端 endDate；缺失时 semesterEndDateOf 会按学期名回退标准区间。
        const endDate = semesterEndDateOf(form.semester)
        if (!endDate) {
          // 学期名无法解析（管理员自定义命名）且后端未给 endDate：明确提示无法校验，不静默放行
          ElMessage.warning(`${monthFieldLabel}暂时无法校验学期结束日期，请确认日期无误`)
        } else if (isMonthAfterDate((form as Record<string, unknown>)[monthField], endDate)) {
          ElMessage.error(`${monthFieldLabel}不能晚于所选学期的结束日期（${endDate}）`)
          return
        }
      } else {
        const range = parseSemesterRange(form.semester)
        if (
          range &&
          !isMonthInSemester((form as Record<string, unknown>)[monthField], form.semester)
        ) {
          ElMessage.error(`${monthFieldLabel}与学期不匹配，请重新选择`)
          return
        }
      }
    }
    duplicateChecking = true
    try {
      const ok = await checkDuplicateBeforeSubmit(type, {
        ...toRaw(form),
        // 扩展字段不在 form 内，查重也需要证书编号才能命中
        certNumber: extendedForm.certNumber || undefined,
        acquisitionDate: extendedForm.acquisitionDate || undefined,
      })
      if (ok) await doSubmit(toRaw(form))
    } finally {
      duplicateChecking = false
    }
  }

  async function handleSaveDraft() {
    // 连点保护：saveNow 期间按钮保持 loading，重复点击直接忽略
    if (draftSaving.value) return
    draftSaving.value = true
    try {
      // 草稿双写：本地 localStorage 兜底，同时调用 isDraft=1 建后端草稿 / autosave 更新。
      // 必须等后端保存结束再刷新列表：后端保存成功会删掉本地副本，列表只保留一条草稿记录，
      // 否则本地草稿与后端草稿同时出现（2026-11-10 修复重复展示）。
      // 保存后表单转空白待填写态：修改草稿需在下拉记录里点"编辑"回填，正常情况表单保持空白。
      const backendSaved = await saveNow()
      currentStatus.value = 'draft'
      await loadRecords()
      resetForm()
      cancelEdit()
      ElMessage.success(backendSaved ? '草稿已保存' : '草稿已保存到本地')
    } finally {
      draftSaving.value = false
    }
  }

  async function handleWithdraw(row: FormRecord) {
    try {
      await ElMessageBox.confirm('确定撤回？', '撤回确认', { type: 'warning' })
      await withdrawActivity(Number(row.id), activityCategoryOf(appType))
      updateRecord(row.id, { status: 'withdrawn' })
      ElMessage.success('已撤回')
    } catch {
      /* cancel */
    }
  }

  /**
   * 详情加载失败提示：只有 404/405 才能断定“接口不存在”，
   * 网络异常 / 超时 / 5xx 必须按真实原因提示，不能一律甩给后端（报告 9.4）。
   */
  function detailLoadFailureText(error: unknown, action: 'edit' | 'correction' | 'view'): string {
    const err = error as { code?: string; response?: { status?: number } } | null
    const status = err?.response?.status
    if (status === 404 || status === 405) {
      return action === 'view'
        ? '后端未提供详情接口，以下仅为列表摘要，部分字段可能缺失'
        : action === 'correction'
          ? '后端未提供详情接口，纠错仅能修改列表已有字段'
          : '后端未提供详情接口，本次仅按列表已有字段回填；缺失字段不会提交'
    }
    if (err?.code === 'ECONNABORTED') {
      return action === 'view'
        ? '详情加载超时，以下仅为列表摘要'
        : action === 'correction'
          ? '详情加载超时，纠错仅能修改列表已有字段'
          : '详情加载超时，本次仅按列表已有字段回填；缺失字段不会提交'
    }
    if (!err?.response) {
      return action === 'view'
        ? '网络异常，详情加载失败，以下仅为列表摘要'
        : action === 'correction'
          ? '网络异常，纠错仅能修改列表已有字段'
          : '网络异常，本次仅按列表已有字段回填；缺失字段不会提交'
    }
    return action === 'view'
      ? `详情加载失败（HTTP ${status ?? '未知'}），以下仅为列表摘要`
      : action === 'correction'
        ? `详情加载失败（HTTP ${status ?? '未知'}），纠错仅能修改列表已有字段`
        : `详情加载失败（HTTP ${status ?? '未知'}），本次仅按列表已有字段回填；缺失字段不会提交`
  }

  async function handleEditClick(row: Record<string, unknown>) {
    // 进入编辑即作废在途的查看详情响应：避免晚到的详情把刚关闭的查看弹窗重新打开
    viewSeq += 1
    // 后端真实记录（非本地临时 rec- / draft-local 记录）：拉取 6.2 详情补齐表单字段（列表仅含摘要字段）
    const rowId = asText(row.id)
    const isBackendRecord = Boolean(rowId) && rowId !== DRAFT_LOCAL_ID && !rowId.startsWith('rec-')
    // 真实记录回填其 id，后续自动保存走 autosave；本地草稿若已关联后端草稿（backendId），
    // 同样回填该 id，避免再次保存时又 POST 一条新草稿；无关联时才走 isDraft=1 建草稿
    setRecordId(isBackendRecord ? Number(rowId) : (asOptionalNumber(row.backendId) ?? null))
    if (isBackendRecord) {
      try {
        const detail = await getActivityDetail(Number(rowId), activityCategoryOf(appType))
        // 后端业务字段嵌在 detail.detail（后端字段名），按类型逆向映射为前端表单字段后并入 row，
        // 否则 emptyForm() 循环全部落空 → 表单空白（2026-08-31 修复）。
        // 注意不能用 {...row, ...detail} 直接展开：会把 row.status 覆盖成后端数字状态码
        if (detail) {
          row = { ...row, ...mapDetailToForm(type, detail) }
          // 退回原因（detail 顶层字段）：被退回记录编辑时回填提示，列表摘要不携带
          if (detail.rejectedReason) row.rejectedReason = detail.rejectedReason
        }
        detailUnavailable.value = false
      } catch (error) {
        // 详情接口不可用：保留列表摘要字段，按真实失败原因提示（仅 404/405 才是接口不存在）
        detailUnavailable.value = true
        ElMessage.warning(detailLoadFailureText(error, 'edit'))
      }
    }
    Object.keys(emptyForm()).forEach((key) => {
      if (!(key in row)) return
      // 配置了学期-月份联动的字段，日期选择器统一为 YYYY-MM；详情接口返回的是 YYYY-MM-DD，
      // 原样回填会让选择器按 value-format 解析失败、编辑态显示空白，这里统一归一化。
      if (semesterMonthConfig && key === semesterMonthConfig.monthField) {
        ;(form as Record<string, unknown>)[key] = normalizeMonthValue(row[key])
        return
      }
      ;(form as Record<string, unknown>)[key] = row[key] ?? ''
    })
    extendedForm.role = asText(row.role)
    extendedForm.certNumber = asText(row.certNumber)
    extendedForm.issuingAuthority = asText(row.issuingAuthority)
    extendedForm.acquisitionDate = asText(row.acquisitionDate)
    extendedForm.validityPeriod = asText(row.validityPeriod)
    currentStatus.value = asText(row.status) || 'draft'
    rejectionReason.value = asText(row.rejectedReason)
    startEdit(row as unknown as FormRecord)
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
      // 参数消失（已被消费或离开该次进入）时清空去重标记：
      // keep-alive 下实例不再因 query 变化重建，若不清空，同一条记录二次从消息中心点编辑会被永久跳过。
      if (!editIdQuery.value) {
        editTriggeredFor = ''
        return
      }
      if (editTriggeredFor === editIdQuery.value) return
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
    detailUnavailable.value = false
    setRecordId(null)
  }
  function handleViewScore(row: FormRecord) {
    openIndicator(type, row.title || '')
  }
  async function handleCorrection(row: FormRecord) {
    openCorrection(row)
    // 列表接口只返回摘要，纠错的「变更字段」需要完整字段：先拉详情补全快照
    const isBackendRecord =
      row.id && row.id !== DRAFT_LOCAL_ID && !String(row.id).startsWith('rec-')
    if (!isBackendRecord) return
    try {
      const detail = await getActivityDetail(Number(row.id), activityCategoryOf(appType))
      if (detail) enrichCorrectionSnapshot(mapDetailToForm(type, detail))
    } catch (error) {
      // 详情拉取失败：仅可修改列表摘要里已有的字段，按真实原因提示而不是静默降级
      ElMessage.warning(detailLoadFailureText(error, 'correction'))
    }
  }
  async function viewRecord(row: FormRecord) {
    // 记录本次查看序号：用户快速点两行或中途关闭弹窗时，晚到的详情响应直接丢弃
    const seq = ++viewSeq
    rejectionReason.value = asText(row.rejectedReason)
    // 先展示列表摘要，立即打开弹窗，避免点击后无反馈
    _viewRecord(row)
    // 真实后端记录：列表接口（GET /activities）仅返回摘要字段，详情接口才含用户填写的表单内容。
    // 拉取详情并逆向映射为表单字段后合并进展示记录，让「查看」展示申报表单填写的具体内容。
    const isBackendRecord =
      row.id && row.id !== DRAFT_LOCAL_ID && !String(row.id).startsWith('rec-')
    if (!isBackendRecord) return
    detailLoading.value = true
    try {
      const detail = await getActivityDetail(Number(row.id), activityCategoryOf(appType))
      if (seq !== viewSeq) return
      // mapDetailToForm 仅映射业务字段（不含 status），避免覆盖行上的前端状态/退回原因
      if (detail) _viewRecord({ ...row, ...mapDetailToForm(type, detail) })
    } catch (error) {
      if (seq !== viewSeq) return
      // 详情接口不可用：弹窗顶部按真实失败原因标注「仅列表摘要」，不伪装成完整详情
      _viewRecord({
        ...row,
        __detailUnavailable: true,
        __detailUnavailableText: detailLoadFailureText(error, 'view'),
      })
    } finally {
      if (seq === viewSeq) detailLoading.value = false
    }
  }

  /** 关闭详情弹窗：递增序号让在途详情响应失效，避免关闭后被晚到响应重新打开 */
  function closeDetail() {
    viewSeq += 1
    detailLoading.value = false
    _closeDetail()
  }
  function init() {
    loadEnrollmentInfo()
  }

  return {
    form,
    submitting,
    draftSaving,
    disabledDate,
    records,
    isEditing,
    editingId,
    detailVisible,
    detailRecord,
    detailUnavailable,
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
    removeChangedField,
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
