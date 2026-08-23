import type { ActivityListItem, ActivityType } from './activities'
import type {
  ApplicationType,
  Notification as MessageNotification,
  SubmissionFilters,
  SubmissionRecord,
} from '@/shared/types/types'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
// 6.1 动态记录/6.5 撤销：申报记录数据源从 /submissions 迁移到 /activities（后端对学生端仅实现 /activities 系列）
import { getActivities, withdrawActivity } from './activities'
// 2.2 学期下拉：表单用学期名称字符串，契约要求 semesterId（Integer），提交时按名称解析 ID
import { getSemesters } from './common'
import request from './request'

const MODULE_PATH_MAP: Record<string, string> = {
  competition: '/applications/competition',
  innovation: '/applications/innovation',
  research: '/applications/research',
  scholarship: '/applications/scholarship',
  certificate: '/applications/certificate',
  internship: '/applications/internship',
  organization: '/applications/organization',
  training: '/applications/training',
  socialPractice: '/applications/social-practice',
  bookReport: '/applications/book-report',
  competitionStar: '/awards/competition-star',
  innovationStar: '/awards/innovation-star',
  scientificProject: '/awards/scientific-star',
  softwareCopyright: '/awards/scientific-star',
  paper: '/awards/scientific-star',
}

function generateMockRecords(): SubmissionRecord[] {
  const types = Object.keys(APPLICATION_TYPE_MAP) as ApplicationType[]
  const statuses: SubmissionRecord['status'][] = ['pending', 'approved', 'rejected', 'withdrawn']
  const semesters = ['2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1']
  const mockTitles: Record<string, string[]> = {
    competition: ['全国大学生数学建模竞赛', 'ACM 程序设计竞赛', '蓝桥杯大赛'],
    innovation: ['校园文创项目', '智能硬件创业计划'],
    research: ['基于深度学习的图像识别研究', '区块链技术在档案管理中的应用'],
    scholarship: ['国家奖学金申请', '校级一等奖学金'],
    certificate: ['CET-6 证书登记', '计算机二级证书'],
    internship: ['字节跳动前端开发实习', '腾讯云运维实习'],
    organization: ['校学生会组织部', 'ACM 社团'],
    training: ['Vue3 企业级开发实训', '云计算架构实训'],
    socialPractice: ['暑期三下乡社会实践', '社区志愿服务'],
    bookReport: ['《深入理解计算机系统》读书心得', '《算法导论》读书笔记'],
    competitionStar: ['竞赛之星报名-数学建模', '竞赛之星报名-ACM'],
    innovationStar: ['双创之星报名-文创项目'],
    scientificProject: ['省自然基金科研项目', '校级创新实验项目'],
    softwareCopyright: ['档案管理软件 V1.0', '数据分析工具软件'],
    paper: ['基于 Vue3 的前端架构研究', '深度学习在档案分类中的应用'],
  }

  const result: SubmissionRecord[] = []
  let id = 1
  for (const type of types) {
    const titles = mockTitles[type] ?? ['默认申报']
    const modulePath = MODULE_PATH_MAP[type] ?? '/dashboard'
    for (const title of titles) {
      const semester = semesters[id % semesters.length]
      const status = statuses[id % statuses.length]
      const day = 10 + (id % 20)
      const month = 3 + (id % 9)
      result.push({
        id: String(id++),
        type,
        typeLabel: APPLICATION_TYPE_MAP[type] ?? type,
        title,
        submitDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        semester,
        status,
        sourcePath: modulePath,
      })
    }
  }
  return result.sort((a, b) => b.submitDate.localeCompare(a.submitDate))
}

let cachedRecords: SubmissionRecord[] | null = null

/** /activities status（number）→ 前端 status 映射（1=submitted 对应待审核 pending） */
export const STATUS_MAP: Record<number, SubmissionRecord['status']> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

/** 从表单数据推导申报标题（各类型主名称字段），无匹配时返回空串 */
export function deriveRecordTitle(data: Record<string, any>): string {
  return (
    data.competitionName ||
    data.projectName ||
    data.activityName ||
    data.bookName ||
    data.awardName ||
    data.certName ||
    data.companyName ||
    data.company || // 实习经历（表单字段为 company）
    data.softName || // 科研之星-软著
    data.paperName || // 科研之星-论文
    data.department ||
    data.title ||
    ''
  )
}

/** 奖项之星类申报类型（在 /activities 中归类为 award 分类） */
const STAR_TYPES: ApplicationType[] = [
  'competitionStar',
  'innovationStar',
  'scientificProject',
  'softwareCopyright',
  'paper',
]

/**
 * 申报/报名类型 → /activities 的活动分类。
 * 撤回接口 PUT /activities/{id}/withdraw 需携带 type 参数。
 */
export function activityCategoryOf(applicationType: ApplicationType): ActivityType {
  return STAR_TYPES.includes(applicationType) ? 'award' : 'archive'
}

/**
 * ActivityListItem（6.1 动态记录）→ SubmissionRecord（提交记录）
 *  后端实际字段为下划线（archive_type/archive_type_label/submit_time/semester_name），驼峰为兼容别名。
 */
function mapActivityToSubmission(item: ActivityListItem): SubmissionRecord {
  const type = (item.archive_type ?? item.archiveType ?? '') as ApplicationType
  return {
    id: String(item.id),
    type,
    typeLabel:
      item.archive_type_label ?? item.archiveTypeLabel ?? APPLICATION_TYPE_MAP[type] ?? item.title,
    title: item.title ?? '',
    submitDate: (item.submit_time ?? item.submitTime ?? '').slice(0, 10),
    semester: item.semester_name ?? item.semesterName ?? '',
    status: STATUS_MAP[item.status] ?? 'pending',
    sourcePath: '',
  }
}

function matchFilters(record: SubmissionRecord, filters?: SubmissionFilters): boolean {
  if (!filters) return true
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    if (!record.title.toLowerCase().includes(kw) && !record.typeLabel.toLowerCase().includes(kw)) {
      return false
    }
  }
  if (filters.type && record.type !== filters.type) return false
  if (filters.status && record.status !== filters.status) return false
  const [start, end] = filters.dateRange ?? []
  if (start && record.submitDate < start) return false
  if (end && record.submitDate > end) return false
  return true
}

/**
 * 获取提交记录列表
 * 数据源：GET /activities（6.1 动态记录），映射为提交记录，筛选在前端完成；接口异常时回退 Mock。
 */
export async function getSubmissionRecords(
  filters?: SubmissionFilters,
): Promise<SubmissionRecord[]> {
  try {
    const res = await getActivities({ page: 1, per_page: 200 })
    const all = (res?.list ?? []).map(mapActivityToSubmission)
    return filters ? all.filter((r) => matchFilters(r, filters)) : all
  } catch {
    if (!cachedRecords) cachedRecords = generateMockRecords()
    return filters ? cachedRecords.filter((r) => matchFilters(r, filters)) : [...cachedRecords]
  }
}

/**
 * 撤回提交记录
 * 数据源：PUT /activities/{id}/withdraw?type=（6.5 撤销动态记录）。
 * @param id 记录 ID
 * @param category 活动分类（archive|award|career_plan），由调用方从记录类型推导传入。
 */
export async function withdrawSubmission(
  id: string,
  category: ActivityType = 'archive',
): Promise<void> {
  try {
    await withdrawActivity(Number(id), category)
  } catch {
    // 撤回失败：本地状态由 store 兜底更新，不阻断交互
  }
}

/* ===================== 申报/报名契约映射（对齐 7.x 档案申报 / 8.x 奖项报名接口文档） ===================== */

/** 前端表单字段 → 后端契约字段。key=后端字段名，value=前端表单字段名 */
interface TypeContract {
  endpoint: string
  mapping: Record<string, string>
  dateFields: string[]
  /** 后端仅接受 ASCII/枚举码的字段（中文会触发 10003 格式错误），提交时非 ASCII 置空串 */
  asciiFields?: string[]
  /** 后端枚举字段：前端中文 label → 后端枚举码 */
  enumMap?: Record<string, Record<string, string>>
}

/** 8.3 科研之星：走"主记录 + 子项目"流程，不走简单 POST 提交 */
const RESEARCH_STAR_TYPES: ApplicationType[] = ['scientificProject', 'softwareCopyright', 'paper']

/** 8.3 科研之星子项目契约（子项目端点路径 + 字段映射） */
const RESEARCH_STAR_SUB_CONTRACTS: Record<
  string,
  { path: string; mapping: Record<string, string>; dateFields: string[] }
> = {
  scientificProject: {
    path: 'projects',
    mapping: {
      projectName: 'projectName',
      projectLevel: 'projectLevel',
      rankTotal: 'ranking',
      establishedTime: 'startDate',
    },
    dateFields: ['establishedTime'],
  },
  softwareCopyright: {
    path: 'software',
    mapping: { softwareName: 'softName', rankTotal: 'ranking', approvedTime: 'approveDate' },
    dateFields: ['approvedTime'],
  },
  paper: {
    path: 'papers',
    mapping: {
      journalName: 'journalName',
      paperTitle: 'paperName',
      rankTotal: 'ranking',
      publishedTime: 'publishDate',
    },
    dateFields: ['publishedTime'],
  },
}

/** 7.x / 8.x 各申报类型的接口端点与字段映射（字段名以接口文档为准） */
const APPLICATION_CONTRACTS: Record<string, TypeContract> = {
  competition: {
    endpoint: '/applications/competition',
    mapping: {
      competitionName: 'competitionName',
      competitionType: 'competitionType',
      awardLevel: 'awardLevel',
      obtainedTime: 'awardDate',
    },
    dateFields: ['obtainedTime'],
  },
  scholarship: {
    endpoint: '/applications/scholarship',
    mapping: {
      scholarshipName: 'awardName',
      scholarshipCategory: 'scholarshipLevel',
      awardLevel: 'scholarshipGrade',
      obtainedTime: 'acquireDate',
    },
    dateFields: ['obtainedTime'],
  },
  certificate: {
    endpoint: '/applications/certificate',
    mapping: { certificateType: 'certType', certificateName: 'certName', obtainedTime: 'certDate' },
    dateFields: ['obtainedTime'],
  },
  innovation: {
    endpoint: '/applications/innovation',
    mapping: {
      companyName: 'companyName',
      industryType: 'industryType',
      projectType: 'companyType',
      registeredTime: 'registerDate',
    },
    dateFields: ['registeredTime'],
    // 实测：projectType 仅接受枚举码（practice/plan/registered/other），中文"创业实践"会 10003
    enumMap: {
      projectType: {
        创业实践: 'practice',
        创业计划: 'plan',
        实体注册: 'registered',
        其他: 'other',
      },
    },
  },
  research: {
    // 注意：契约要求 startDate/endDate 两个必填，前端表单仅有 projectDate（单月份），endDate 缺失会导致提交被后端校验拒绝
    endpoint: '/applications/research',
    mapping: {
      projectName: 'projectName',
      projectLevel: 'projectLevel',
      projectType: 'researchType',
      startDate: 'projectDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：projectType 为必填枚举，仅接受 ASCII 码（basic/applied/development…），表单已改下拉
    enumMap: { projectType: { 基础研究: 'basic', 应用研究: 'applied', 试验发展: 'development' } },
  },
  internship: {
    endpoint: '/applications/internship',
    mapping: {
      companyName: 'company',
      location: 'location',
      position: 'position',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：location/position 仅接受 ASCII/数字（中文 10003），非 ASCII 置空串
    asciiFields: ['location', 'position'],
  },
  organization: {
    endpoint: '/applications/organization',
    mapping: {
      orgLevel: 'organizationLevel',
      department: 'department',
      positionTitle: 'position',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    enumMap: { orgLevel: { 校级: 'school', 院级: 'college', 社团级: 'club', 班级: 'class' } },
    // 实测：positionTitle 必填但仅接受 ASCII 枚举（leader/member/solo…），中文 10003
    asciiFields: ['positionTitle'],
  },
  training: {
    endpoint: '/applications/training',
    mapping: {
      projectName: 'projectName',
      projectContent: 'projectContent',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：projectContent 带中文会 10003（空值/ASCII 可存），非 ASCII 置空串
    asciiFields: ['projectContent'],
  },
  socialPractice: {
    endpoint: '/applications/practice',
    mapping: {
      activityName: 'activityName',
      practiceLocation: 'location',
      practiceUnit: 'organization',
      startDate: 'startDate',
      endDate: 'endDate',
      volunteerHours: 'volunteerHours',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：practiceLocation/practiceUnit 仅接受 ASCII/数字，中文 10003
    asciiFields: ['practiceLocation', 'practiceUnit'],
  },
  bookReport: {
    endpoint: '/applications/book-review',
    mapping: { bookName: 'bookName', readMonth: 'bookDate', reviewContent: 'review' },
    dateFields: ['readMonth'],
  },
  competitionStar: {
    endpoint: '/awards/competition-star',
    mapping: {
      competitionName: 'competitionName',
      participatedTime: 'competitionDate',
      competitionLevel: 'competitionLevel',
      awardLevel: 'awardLevel',
    },
    dateFields: ['participatedTime'],
  },
  innovationStar: {
    endpoint: '/awards/innovation-star',
    mapping: {
      companyName: 'companyName',
      industryType: 'industryType',
      applicantRank: 'ranking',
      registeredTime: 'registerDate',
    },
    dateFields: ['registeredTime'],
  },
}

/**
 * 契约要求的 archiveType（/activities 列表 archiveType 字段，下划线风格）与前端 type key 的别名映射。
 * 实测确认（2026-08-22）：competition→academic_competition、certificate→honor_certificate、
 * innovation→innovation_entrepreneurship、research→academic_research、training→training_project、
 * socialPractice→social_practice；scholarship/internship/organization 与列表字段同名无需别名。
 * bookReport 的后端 archiveType 未能在真实接口确认（该类型 POST 契约异常，见 docs/api-reconciliation-student.md）。
 */
export const ARCHIVE_TYPE_ALIASES: Record<string, string[]> = {
  competition: ['academic_competition'],
  innovation: ['innovation_entrepreneurship'],
  research: ['academic_research'],
  certificate: ['honor_certificate'],
  training: ['training_project'],
  socialPractice: ['social_practice'],
  competitionStar: ['competition_star'],
  innovationStar: ['innovation_star'],
  scientificProject: ['research_project', 'scientific_project'],
  softwareCopyright: ['software_copyright'],
  paper: ['published_paper'],
}

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
      const id = (item as any).fileId ?? (item as any).id
      if (typeof id === 'number') ids.push(id)
    }
  }
  return ids
}

let semesterIdMap: Record<string, number> | null = null

/** 学期名称字符串 → 学期 ID（Integer）。表单 semester 为 '2024-2025-1' 格式名称，契约要求 ID。 */
async function resolveSemesterId(value: unknown): Promise<number | undefined> {
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
}

/** 构建契约 payload：字段重命名 + 日期归一化 + 学期解析 + 通用字段 */
async function buildContractPayload(
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
    const raw = (data as any)[frontKey]
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
    const raw = (data as any)[frontKey]
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
 * 提交纠错申请
 * 后端就绪后替换为：return request.post('/submissions/correction', data)
 */
export function submitCorrection(_u_data: {
  recordId: string
  reason: string
  changedFields: Record<string, { old: any; new: any }>
}): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 300)
  })
}

/**
 * 推送通知（本地通知创建，消息记录由后端 user_messages 表维护）
 */
export function pushNotification(_u_data: {
  title: string
  content: string
  category: MessageNotification['category']
  jumpUrl?: string
  isImportant?: number
}): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

/**
 * 获取评分指标
 * 后端就绪后替换为：return request.get(`/score-indicators/${type}`)
 */
export function getScoreIndicators(
  _u_type: string,
): Promise<{ label: string; score: number; maxScore: number; weight: number; remark?: string }[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { label: '材料完整性', score: 85, maxScore: 100, weight: 0.3, remark: '材料齐全' },
        { label: '学术价值', score: 78, maxScore: 100, weight: 0.4, remark: '良好' },
        { label: '创新性', score: 90, maxScore: 100, weight: 0.3, remark: '优秀' },
      ])
    }, 300)
  })
}

/**
 * 检查重复申报
 * 后端就绪后替换为：return request.post('/submissions/check-duplicate', data)
 */
export function checkDuplicate(data: {
  type: string
  title?: string
}): Promise<{ duplicate: boolean; existing?: SubmissionRecord }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const duplicate = Math.random() < 0.3 // 30% 概率模拟重复
      resolve({
        duplicate,
        existing: duplicate
          ? {
              id: 'existing-1',
              type: data.type as ApplicationType,
              typeLabel: APPLICATION_TYPE_MAP[data.type] ?? data.type,
              title: data.title ?? '已有申报',
              submitDate: '2026-06-15',
              semester: '2025-2026-2',
              status: 'pending',
              sourcePath: '',
            }
          : undefined,
      })
    }, 300)
  })
}

export function getEnrollmentInfo(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        grade: '2022级',
        className: '计算机科学1班',
        major: '计算机科学与技术',
        studentId: '20220101001',
        college: '信息工程学院',
      })
    }, 200)
  })
}

export function saveDraft(_u_type: string, _data: Record<string, any>): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), 200))
}
export function loadDraft(_u_type: string): Promise<Record<string, any> | null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), 200))
}
export function deleteDraft(_type: string): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), 200))
}
