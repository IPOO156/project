import type { ApplicationType } from '@/shared/types/types'

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

/**
 * ARCHIVE_TYPE_ALIASES 反向映射：后端 archive_type（下划线别名）→ 前端 ApplicationType key。
 * mapActivityToSubmission 归一化 /activities 列表记录类型用（模块加载后初始化，函数调用时已就绪）。
 */
export const ARCHIVE_TYPE_TO_KEY: Record<string, ApplicationType> = {}
for (const [key, aliases] of Object.entries(ARCHIVE_TYPE_ALIASES)) {
  for (const alias of aliases) ARCHIVE_TYPE_TO_KEY[alias] = key as ApplicationType
}
