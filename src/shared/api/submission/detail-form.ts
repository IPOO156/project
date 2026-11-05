import type { ApplicationType } from '@/shared/types/types'
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
    obtainTime: 'awardDate',
    participantRole: 'role',
  },
  scholarship: {
    scholarshipName: 'awardName',
    scholarshipCategory: 'scholarshipLevel',
    awardLevel: 'scholarshipGrade',
    obtainTime: 'acquireDate',
  },
  certificate: {
    certificateType: 'certType',
    certificateName: 'certName',
    certificateNo: 'certNumber',
    issuingUnit: 'issuingAuthority',
    validUntil: 'validityPeriod',
    obtainTime: 'certDate',
  },
  innovation: {
    companyName: 'companyName',
    industryType: 'industryType',
    projectType: 'companyType',
    participantRole: 'teamRole',
    registeredAt: 'registerDate',
  },
  research: {
    projectName: 'projectName',
    projectLevel: 'projectLevel',
    projectType: 'researchType',
    participantRole: 'teamRole',
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
 * 软著 issuer（颁发单位）取 award_applications.issuing_unit 通用列（软著子表无颁发单位列）。
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
    issuingUnit: 'issuer',
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
export function mapDetailToForm(type: string, detail: any): Record<string, any> {
  const nested = (detail?.detail ?? {}) as Record<string, any>
  // 奖项类 = 通用字段 + 星类专属字段（具体优先，合并后 issuingUnit 同进 issuingAuthority 与软著 issuer）
  const map = STAR_TYPES.includes(type as ApplicationType)
    ? { ...AWARD_DETAIL_GENERIC_MAP, ...(AWARD_SPECIFIC_DETAIL_MAP[type] ?? {}) }
    : (DETAIL_TO_FORM_MAP[type] ?? {})
  const out: Record<string, any> = {}
  for (const [from, to] of Object.entries(map)) {
    const v = nested[from]
    if (v != null && v !== '') out[to] = v
  }
  // 通用取得时间 obtainTime → 扩展表单 acquisitionDate（重复校验 obtainTime 用）
  if (nested.obtainTime != null && nested.obtainTime !== '') {
    out.acquisitionDate = nested.obtainTime
  }
  // 学期：ActivityDetailResponse 用 @JsonProperty("semester_name")，实际返回下划线字段
  if (detail?.semester_name ?? detail?.semesterName) {
    out.semester = detail.semester_name ?? detail.semesterName
  }
  // 附件：evidence_files（file_id/file_name/file_url）→ proofMaterials（UploadUserFile 形状，含自定义 fileId）。
  // 无附件时也返回空数组，保证 handleEditClick 回填后 form.proofMaterials 恒为数组（el-upload 需要数组而非 ''）
  const rawFiles = detail?.evidence_files ?? detail?.evidenceFiles
  const files = Array.isArray(rawFiles) ? rawFiles : []
  out.proofMaterials = files.map((f: any, idx: number) => ({
    // uid 用大基数 + 索引，避免与 el-upload 自增 uid 冲突
    uid: 1_000_000_000 + idx,
    name: f.file_name ?? f.fileName ?? '',
    url: f.file_url ?? f.fileUrl ?? '',
    status: 'success' as const,
    fileId: f.file_id ?? f.fileId,
  }))
  return out
}
