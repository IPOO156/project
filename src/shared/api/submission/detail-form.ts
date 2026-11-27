import type { ApplicationType } from '@/shared/types/types'
import { asOptionalNumber, asRecord, asText } from '@/shared/utils/unknown'
import { STAR_TYPES } from './record-utils'

/* ===================== 详情逆向映射（GET /activities/{type}/{id} detail → 前端表单字段） ===================== */

/**
 * 后端活动详情 detail.detail（ActivityDetailResponse 内嵌 Map，ActivityService.buildArchiveDetail 生成）
 * 各字段名 → 前端表单/扩展表单字段名。编辑回填（useApplicationPage.handleEditClick）据此把真实记录
 * 的字段还原到表单；此前直接展开顶层导致所有业务字段落空 → 表单空白（2026-08-31 修复）。
 * 注：后端详情对每个业务字段还附带 *Label 字段（如 competitionTypeLabel），此处不消费，天然跳过。
 */
export const DETAIL_TO_FORM_MAP: Record<string, Record<string, string>> = {
  competition: {
    competitionName: 'competitionName',
    competitionType: 'competitionType',
    awardLevel: 'awardLevel',
    obtainedTime: 'awardDate',
    participantRole: 'role',
    certificateNo: 'certNumber',
  },
  scholarship: {
    scholarshipName: 'awardName',
    scholarshipCategory: 'scholarshipLevel',
    awardLevel: 'scholarshipGrade',
    obtainedTime: 'acquireDate',
  },
  certificate: {
    certificateType: 'certType',
    certificateName: 'certName',
    certificateNo: 'certNumber',
    issuingUnit: 'issuingAuthority',
    validUntil: 'validityPeriod',
    obtainedTime: 'certDate',
  },
  innovation: {
    companyName: 'companyName',
    industryType: 'industryType',
    projectType: 'companyType',
    participantRole: 'role',
    // 契约字段为 registeredTime；registeredAt 为历史后端详情字段名，保留兼容
    registeredTime: 'registerDate',
  },
  research: {
    projectName: 'projectName',
    projectLevel: 'projectLevel',
    projectType: 'researchType',
    participantRole: 'role',
    startDate: 'projectDate',
    endDate: 'endDate',
  },
  internship: {
    companyName: 'company',
    location: 'location',
    position: 'position',
    startDate: 'startDate',
    endDate: 'endDate',
  },
  organization: {
    orgLevel: 'organizationLevel',
    department: 'department',
    positionTitle: 'position',
    startDate: 'startDate',
    endDate: 'endDate',
  },
  training: {
    projectName: 'projectName',
    projectContent: 'projectContent',
    startDate: 'startDate',
    endDate: 'endDate',
  },
  socialPractice: {
    activityName: 'activityName',
    practiceLocation: 'location',
    practiceUnit: 'organization',
    participantRole: 'role',
    startDate: 'startDate',
    endDate: 'endDate',
    volunteerHours: 'volunteerHours',
  },
  bookReport: {
    bookName: 'bookName',
    readMonth: 'bookDate',
    reviewContent: 'review',
  },
}

/**
 * 奖项类通用字段（buildAwardDetail 当前实际返回，字段名与 award_applications 列一致）：
 * certificateNo/issuingUnit/validUntil/participantRole → 扩展表单 certNumber/issuingAuthority/validityPeriod/role。
 */
const AWARD_DETAIL_GENERIC_MAP: Record<string, string> = {
  certificateNo: 'certNumber',
  issuingUnit: 'issuingAuthority',
  validUntil: 'validityPeriod',
  participantRole: 'role',
}

/**
 * 奖项类各星专属字段（8.x 提交契约字段名，后端 AwardService.updateExtension 的 body key 一致）。
 * 这些字段由后端按 awardType 存入子表（competition_star→award_competition_stars、
 * innovation_star→award_innovation_stars、research_star→award_research_stars 及其
 * projects/software/papers 子表），但 `ActivityService.buildAwardDetail` 目前不查子表、未随详情返回，
 * 属后端缺口（见 2026-08-31 修改记录「遗留事项」）。此处预置映射，后端补齐返回后编辑回填自动生效。
 * 软著子表无颁发单位列，颁发单位统一走 award_applications.issuing_unit 通用列（扩展表单「发证单位」）。
 */
const AWARD_SPECIFIC_DETAIL_MAP: Record<string, Record<string, string>> = {
  competitionStar: {
    competitionName: 'competitionName',
    participatedTime: 'competitionDate',
    competitionLevel: 'competitionLevel',
    awardLevel: 'awardLevel',
  },
  innovationStar: {
    companyName: 'companyName',
    industryType: 'industryType',
    applicantRank: 'ranking',
    registeredTime: 'registerDate',
  },
  scientificProject: {
    projectName: 'projectName',
    projectLevel: 'projectLevel',
    rankTotal: 'ranking',
    establishedTime: 'startDate',
  },
  softwareCopyright: {
    softwareName: 'softName',
    rankTotal: 'ranking',
    approvedTime: 'approveDate',
  },
  paper: {
    journalName: 'journalName',
    paperTitle: 'paperName',
    rankTotal: 'ranking',
    publishedTime: 'publishDate',
  },
}

/**
 * 后端活动详情 → 前端表单字段平铺对象。
 * @param type 前端申报类型 key（competition/scholarship/… / 奖项之星类）
 * @param detail GET /activities/{type}/{id} 返回的 ActivityDetailResponse 主体
 */
export function mapDetailToForm(
  type: string,
  detail: Record<string, unknown>,
): Record<string, unknown> {
  const nested = asRecord(detail?.detail)
  // 奖项类 = 通用字段 + 星类专属字段（具体优先；issuingUnit 统一映射为扩展表单「发证单位」）
  const map = STAR_TYPES.includes(type as ApplicationType)
    ? { ...AWARD_DETAIL_GENERIC_MAP, ...(AWARD_SPECIFIC_DETAIL_MAP[type] ?? {}) }
    : (DETAIL_TO_FORM_MAP[type] ?? {})
  const out: Record<string, unknown> = {}
  for (const [from, to] of Object.entries(map)) {
    // 兼容旧字段名：历史后端版本详情返回 obtainTime，接口文档统一为 obtainedTime；
    // 创新类注册时间历史字段为 registeredAt，契约字段为 registeredTime
    const legacyKey =
      from === 'obtainedTime'
        ? 'obtainTime'
        : from === 'registeredTime'
          ? 'registeredAt'
          : undefined
    const v = nested[from] ?? (legacyKey ? nested[legacyKey] : undefined)
    if (v != null && v !== '') out[to] = v
  }
  // 通用取得时间 obtainedTime → 扩展表单 acquisitionDate；兼容旧字段名 obtainTime。
  // 该类型已把 obtainedTime 映射到业务字段时（如证书「获得时间」certDate）不再重复写入，
  // 否则详情弹窗会把同一时间渲染成「取得时间」「获得时间」两行（2026-11-15 反馈）。
  const obtainedTime = nested.obtainedTime ?? nested.obtainTime
  if (!('obtainedTime' in map) && obtainedTime != null && obtainedTime !== '') {
    out.acquisitionDate = obtainedTime
  }
  // 学期：ActivityDetailResponse 用 @JsonProperty("semester_name")，实际返回下划线字段
  if (detail?.semester_name ?? detail?.semesterName) {
    out.semester = detail.semester_name ?? detail.semesterName
  }
  // 附件：evidence_files（file_id/file_name/file_url）→ proofMaterials（UploadUserFile 形状，含自定义 fileId）。
  // 无附件时也返回空数组，保证 handleEditClick 回填后 form.proofMaterials 恒为数组（el-upload 需要数组而非 ''）
  const rawFiles = detail?.evidence_files ?? detail?.evidenceFiles
  const files = Array.isArray(rawFiles) ? rawFiles : []
  out.proofMaterials = files.map((rawFile: unknown, idx: number) => {
    const f = asRecord(rawFile)
    return {
      // uid 用大基数 + 索引，避免与 el-upload 自增 uid 冲突
      uid: 1_000_000_000 + idx,
      name: asText(f.file_name) || asText(f.fileName),
      url: asText(f.file_url) || asText(f.fileUrl),
      status: 'success' as const,
      fileId: asOptionalNumber(f.file_id ?? f.fileId),
    }
  })
  return out
}
