import type { ApplicationType, SubmissionRecord } from '@/shared/types/types'
import { toLocalDateString } from '@/shared/utils/time'
import { asOptionalNumber, asRecord, asText } from '@/shared/utils/unknown'
import { deleteActivity, updateActivity } from '../activities'
import request from '../request'
import {
  APPLICATION_CONTRACTS,
  RESEARCH_STAR_SUB_CONTRACTS,
  RESEARCH_STAR_TYPES,
} from './contracts'
import {
  buildContractPayload,
  normalizeRole,
  resolveSemesterId,
  toDateString,
  toEvidenceFileIds,
} from './payload'
import { activityCategoryOf } from './record-utils'

/** 8.3 科研之星：创建主记录（草稿）→ 添加子项目 → 确认提交 */
async function submitResearchStarApplication(
  type: string,
  data: Record<string, unknown>,
): Promise<SubmissionRecord> {
  const sub = RESEARCH_STAR_SUB_CONTRACTS[type]
  if (!sub) throw new Error(`未配置科研之星子类型契约：${type}`)

  const semesterId = await resolveSemesterId(data.semester)
  // 扩展信息挂在主记录上（后端 ResearchStarCreateRequest 接受这四项）：
  // 此前只传 semesterId/isDraft，导致三个科研之星页面填写的证书编号/发证单位/有效期/本人角色全部丢失。
  const masterPayload: Record<string, unknown> = { semesterId, isDraft: 1 }
  const role = normalizeRole(data.role)
  if (role) masterPayload.participantRole = role
  if (data.certNumber) masterPayload.certificateNo = String(data.certNumber)
  // 发证单位走公共扩展字段 issuingAuthority；软著专属 issuer 字段已由 main #48 移除
  if (data.issuingAuthority) masterPayload.issuingUnit = String(data.issuingAuthority)
  if (data.validityPeriod) masterPayload.validUntil = toDateString(data.validityPeriod)
  const master = asRecord(await request.post('/awards/research-star', masterPayload))
  const researchStarId = asOptionalNumber(master.researchStarId)
  if (researchStarId == null) throw new Error('科研之星主记录创建失败')
  const applicationId = asOptionalNumber(master.applicationId)

  try {
    const subPayload: Record<string, unknown> = {}
    for (const [backendKey, frontKey] of Object.entries(sub.mapping)) {
      const raw = data[frontKey]
      if (raw === undefined || raw === null || raw === '') continue
      subPayload[backendKey] = sub.dateFields.includes(backendKey) ? toDateString(raw) : raw
    }
    subPayload.evidenceFileIds = toEvidenceFileIds(data.proofMaterials)
    await request.post(`/awards/research-star/${researchStarId}/${sub.path}`, subPayload)

    const submitRes = asRecord(await request.post(`/awards/research-star/${researchStarId}/submit`))
    return {
      id: asText(submitRes.applicationId ?? master.applicationId ?? Date.now()),
      type: type as ApplicationType,
      typeLabel: asText(data.typeLabel),
      title: asText(
        data.title ?? data.projectName ?? data.softName ?? data.paperName ?? '科研之星申报',
      ),
      submitDate: toLocalDateString(),
      semester: asText(data.semester),
      status: 'pending',
      sourcePath: '',
    }
  } catch (error) {
    // 主记录已创建、后续子项或提交失败：尽力删除这条草稿，避免留下一条不完整申报。
    // 删除失败不掩盖原始错误（例如后端已进入待审核，DELETE 会因状态不符被拒绝）。
    if (applicationId != null) {
      try {
        await deleteActivity(applicationId, 'award')
      } catch {
        /* 清理失败仅保留草稿，原始错误继续上抛 */
      }
    }
    throw error
  }
}

/**
 * 提交申报申请
 * 对接后端 7.x POST /applications/{type}、8.x POST /awards/{type}；有已存在记录 id 时走
 * 7.x/8.x PUT /activities/{type}/{id} 更新并正式提交（不再新建记录，避免旧草稿残留）。
 * 提交失败直接抛错，交由调用方提示"提交失败"，禁止用伪造的本地记录伪装成功
 * （否则刷新后数据丢失却提示已保存）。
 * 前端表单字段名与契约不一致的，在 buildContractPayload 中完成重命名与归一化。
 */
export async function submitApplication(data: Record<string, unknown>): Promise<SubmissionRecord> {
  const type = asText(data.type, 'competition')

  if (RESEARCH_STAR_TYPES.includes(type as ApplicationType)) {
    // 后端 8.3 目前只有 POST 新建接口，没有主记录/子项更新接口：
    // 即使 data.recordId 存在，这里也只能新建主记录（编辑已退回记录会产生重复申报）。
    // 需要的 GET/PUT 契约见 docs/api-research-star-update.md，后端补齐后在此增加 recordId 更新分支。
    return submitResearchStarApplication(type, data)
  }

  const contract = APPLICATION_CONTRACTS[type]
  if (!contract) throw new Error(`未配置申报类型契约：${type}`)

  const payload = await buildContractPayload(type, data)
  const recordId = asOptionalNumber(data.recordId)
  let res: unknown
  if (recordId != null) {
    // 编辑草稿/被退回记录后重新提交：更新原记录并正式提交（isDraft=0）
    res = await updateActivity(recordId, activityCategoryOf(type as ApplicationType), {
      ...payload,
      isDraft: 0,
    })
  } else {
    res = await request.post(contract.endpoint, payload)
  }
  const result = asRecord(res)
  return {
    id: asText(result.archiveId ?? result.applicationId ?? Date.now()),
    type: type as ApplicationType,
    typeLabel: asText(data.typeLabel),
    title: asText(
      data.title ??
        data.competitionName ??
        data.projectName ??
        data.activityName ??
        data.bookName ??
        data.awardName ??
        data.certName ??
        '申报',
    ),
    submitDate: toLocalDateString(),
    semester: asText(data.semester),
    status: 'pending',
    sourcePath: '',
  }
}

/**
 * 首次保存草稿：调用对应申报/奖项的 POST submit 接口（isDraft=1）创建 status=0 草稿记录，
 * 返回后端生成的 archiveId（档案）或 applicationId（奖项）。
 * 依据 7.0 / 8.1.1：autosave 路径中的记录 id 必须已存在，首次需先通过 submit 接口建草稿再回填 id。
 * 8.3 科研之星为主记录 + 子项目多步流程（无单端点草稿创建）、未配置契约的类型均返回 undefined，由调用方回落本地持久化。
 */
export async function createDraft(
  type: string,
  data: Record<string, unknown>,
): Promise<number | undefined> {
  if (RESEARCH_STAR_TYPES.includes(type as ApplicationType)) return undefined
  const contract = APPLICATION_CONTRACTS[type]
  if (!contract) return undefined
  const payload = await buildContractPayload(type, { ...data, isDraft: 1 })
  const res = asRecord(await request.post(contract.endpoint, payload))
  return asOptionalNumber(res.archiveId ?? res.applicationId)
}

// 草稿自动保存已迁至真实接口（见 createDraft 与 useFormDraft.saveToBackend）：
//  - 7.0  PUT /applications/{archiveId}/autosave  → autosaveApplication
//  - 8.1.1 PUT /awards/{applicationId}/autosave  → autosaveAward
//  - 首次建草稿：对应 submit 接口 POST {isDraft:1} 取回 archiveId/applicationId（createDraft）
// 文档无草稿列表/删除接口，本地 localStorage 兜底仍在 useFormDraft 内完成，原 saveDraft/loadDraft/deleteDraft 桩已移除。
