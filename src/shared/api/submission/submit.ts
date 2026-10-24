import type { ApplicationType, SubmissionRecord } from '@/shared/types/types'
import request from '../request'
import {
  APPLICATION_CONTRACTS,
  RESEARCH_STAR_SUB_CONTRACTS,
  RESEARCH_STAR_TYPES,
} from './contracts'
import { buildContractPayload, resolveSemesterId, toDateString, toEvidenceFileIds } from './payload'

/** 8.3 科研之星：创建主记录（草稿）→ 添加子项目 → 确认提交 */
async function submitResearchStarApplication(
  type: string,
  data: Record<string, any>,
): Promise<SubmissionRecord> {
  const sub = RESEARCH_STAR_SUB_CONTRACTS[type]
  if (!sub) throw new Error(`未配置科研之星子类型契约：${type}`)

  const semesterId = await resolveSemesterId(data.semester)
  const master: any = await request.post('/awards/research-star', {
    semesterId,
    isDraft: 1,
  })
  const researchStarId = master?.researchStarId
  if (!researchStarId) throw new Error('科研之星主记录创建失败')

  const subPayload: Record<string, any> = {}
  for (const [backendKey, frontKey] of Object.entries(sub.mapping)) {
    const raw = data[frontKey]
    if (raw === undefined || raw === null || raw === '') continue
    subPayload[backendKey] = sub.dateFields.includes(backendKey) ? toDateString(raw) : raw
  }
  subPayload.evidenceFileIds = toEvidenceFileIds(data.proofMaterials)
  await request.post(`/awards/research-star/${researchStarId}/${sub.path}`, subPayload)

  const submitRes: any = await request.post(`/awards/research-star/${researchStarId}/submit`)
  return {
    id: String(submitRes?.applicationId ?? master?.applicationId ?? Date.now()),
    type: type as ApplicationType,
    typeLabel: data.typeLabel ?? '',
    title: data.title ?? data.projectName ?? data.softName ?? data.paperName ?? '科研之星申报',
    submitDate: new Date().toISOString().slice(0, 10),
    semester: data.semester ?? '',
    status: 'pending',
    sourcePath: '',
  }
}

/**
 * 提交申报申请
 * 对接后端 7.x POST /applications/{type}、8.x POST /awards/{type}。提交失败直接抛错，
 * 交由调用方提示"提交失败"，禁止用伪造的本地记录伪装成功（否则刷新后数据丢失却提示已保存）。
 * 前端表单字段名与契约不一致的，在 buildContractPayload 中完成重命名与归一化。
 */
export async function submitApplication(data: Record<string, any>): Promise<SubmissionRecord> {
  const type = data.type ?? 'competition'

  if (RESEARCH_STAR_TYPES.includes(type as ApplicationType)) {
    return submitResearchStarApplication(type, data)
  }

  const contract = APPLICATION_CONTRACTS[type]
  if (!contract) throw new Error(`未配置申报类型契约：${type}`)

  const payload = await buildContractPayload(type, data)
  const res: any = await request.post(contract.endpoint, payload)
  return {
    id: String(res?.archiveId ?? res?.applicationId ?? Date.now()),
    type: type as ApplicationType,
    typeLabel: data.typeLabel ?? '',
    title:
      data.title ??
      data.competitionName ??
      data.projectName ??
      data.activityName ??
      data.bookName ??
      data.awardName ??
      data.certName ??
      '申报',
    submitDate: new Date().toISOString().slice(0, 10),
    semester: data.semester ?? '',
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
  data: Record<string, any>,
): Promise<number | undefined> {
  if (RESEARCH_STAR_TYPES.includes(type as ApplicationType)) return undefined
  const contract = APPLICATION_CONTRACTS[type]
  if (!contract) return undefined
  const payload = await buildContractPayload(type, { ...data, isDraft: 1 })
  const res: any = await request.post(contract.endpoint, payload)
  const id = res?.archiveId ?? res?.applicationId
  return id == null ? undefined : Number(id)
}

// 草稿自动保存已迁至真实接口（见 createDraft 与 useFormDraft.saveToBackend）：
//  - 7.0  PUT /applications/{archiveId}/autosave  → autosaveApplication
//  - 8.1.1 PUT /awards/{applicationId}/autosave  → autosaveAward
//  - 首次建草稿：对应 submit 接口 POST {isDraft:1} 取回 archiveId/applicationId（createDraft）
// 文档无草稿列表/删除接口，本地 localStorage 兜底仍在 useFormDraft 内完成，原 saveDraft/loadDraft/deleteDraft 桩已移除。
