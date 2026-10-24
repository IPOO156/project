// 2.2 学期下拉：表单用学期名称字符串，契约要求 semesterId（Integer），提交时按名称解析 ID
import { getSemesters } from '../common'
import { APPLICATION_CONTRACTS } from './contracts'

/** 日期归一化为 YYYY-MM-DD（兼容 Date 对象、'YYYY-MM'、'YYYY-MM-DD' 及 ISO 时间串） */
function toDateString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') {
    const t = value.trim()
    // ISO 时间串：'2025-09-01T...' / '2025-09-01 12:00:00'，截取日期前缀
    const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ]|$)/)
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
    // 仅年月：'YYYY-MM'，补全为当月 01 日
    const ym = t.match(/^(\d{4})-(\d{1,2})$/)
    if (ym) return `${ym[1]}-${ym[2].padStart(2, '0')}-01`
    return undefined
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return undefined
}

/** 后端枚举/字典字段仅接受 ASCII（中文值会触发 10003 格式错误）：保留 ASCII，非 ASCII 置空串（后端接受空值） */
function asciiOrEmpty(value: unknown): string {
  if (value === undefined || value === null) return ''
  const s = String(value)
  // 逐字符判断是否纯 ASCII（charCodeAt > 127 即非 ASCII），避免正则直接匹配控制字符
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) return ''
  }
  return s
}

/** 前端角色 → 契约 participantRole（'individual' 对应契约 'solo'） */
function normalizeRole(role: unknown): 'leader' | 'member' | 'solo' | undefined {
  if (role === 'individual') return 'solo'
  if (role === 'leader' || role === 'member' || role === 'solo') return role
  return undefined
}

/** proofMaterials（Element Plus UploadUserFile[]）→ evidenceFileIds（fileId 数组） */
function toEvidenceFileIds(proofMaterials: unknown): number[] {
  if (!Array.isArray(proofMaterials)) return []
  const ids: number[] = []
  for (const item of proofMaterials) {
    if (typeof item === 'number') {
      ids.push(item)
    } else if (item && typeof item === 'object') {
      const fileRef = item as { fileId?: unknown; id?: unknown }
      const id = fileRef.fileId ?? fileRef.id
      if (typeof id === 'number') ids.push(id)
    }
  }
  return ids
}

let semesterIdMap: Record<string, number> | null = null

/** 学期名称字符串 → 学期 ID（Integer）。表单 semester 为 '2024-2025-1' 格式名称，契约要求 ID。 */
export async function resolveSemesterId(value: unknown): Promise<number | undefined> {
  if (typeof value === 'number') return value
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name) return undefined
  if (!semesterIdMap) {
    semesterIdMap = {}
    try {
      const list = await getSemesters()
      for (const s of list) {
        if (s.name) semesterIdMap[s.name] = s.value
        semesterIdMap[String(s.value)] = s.value
      }
    } catch {
      /* 学期列表拉取失败：保持空映射，交由后端校验报必填 */
    }
  }
  const id = semesterIdMap[name]
  if (id === undefined) console.warn(`[submission] 学期名称未匹配到 ID：${name}`)
  return id
}

/** 通用可选字段（契约 7.x / 8.x 均含：participantRole / certificateNo / issuingUnit / validUntil），非空才带上 */
function appendCommonFields(payload: Record<string, any>, data: Record<string, any>): void {
  const role = normalizeRole(data.role)
  if (role) payload.participantRole = role
  if (data.certNumber) payload.certificateNo = String(data.certNumber)
  if (data.issuingAuthority) payload.issuingUnit = String(data.issuingAuthority)
  if (data.validityPeriod) payload.validUntil = toDateString(data.validityPeriod)
  // 取得时间（扩展字段 acquisitionDate）→ 契约字段 obtainTime；类型已映射 obtainTime 时不覆盖
  if (data.acquisitionDate && payload.obtainTime === undefined) {
    payload.obtainTime = toDateString(data.acquisitionDate)
  }
}

/** 构建契约 payload：字段重命名 + 日期归一化 + 学期解析 + 通用字段 */
export async function buildContractPayload(
  type: string,
  data: Record<string, any>,
): Promise<Record<string, any>> {
  const contract = APPLICATION_CONTRACTS[type]
  if (!contract) throw new Error(`未配置申报类型契约：${type}`)

  const payload: Record<string, any> = {
    semesterId: await resolveSemesterId(data.semester),
    isDraft: data.isDraft ?? 0,
    evidenceFileIds: toEvidenceFileIds(data.proofMaterials),
  }

  for (const [backendKey, frontKey] of Object.entries(contract.mapping)) {
    const raw = data[frontKey]
    if (raw === undefined || raw === null || raw === '') continue
    if (contract.dateFields.includes(backendKey)) {
      payload[backendKey] = toDateString(raw)
      continue
    }
    // 后端枚举字段：中文 label → 枚举码；ASCII-only 字段：中文置空串，避免 10003
    if (contract.enumMap?.[backendKey]) {
      payload[backendKey] = contract.enumMap[backendKey][String(raw)] ?? asciiOrEmpty(raw)
    } else if (contract.asciiFields?.includes(backendKey)) {
      payload[backendKey] = asciiOrEmpty(raw)
    } else {
      payload[backendKey] = raw
    }
  }

  appendCommonFields(payload, data)
  return payload
}

export { normalizeRole, toDateString, toEvidenceFileIds }
