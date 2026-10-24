/**
 * 申报/报名接口统一出口（实现按业务域拆分在 ./submission/ 下，此处仅 re-export，
 * 保证既有 `import { xxx } from '@/shared/api/submission'` 不受影响）。
 */

/** archiveType 别名映射（前端类型 key ↔ /activities 下划线别名） */
export { ARCHIVE_TYPE_ALIASES } from './submission/archive-type'
/** 活动详情 → 前端表单字段逆向映射 */
export { DETAIL_TO_FORM_MAP, mapDetailToForm } from './submission/detail-form'
/** 契约 payload 构建（字段重命名/日期归一化/学期解析） */
export { buildContractPayload } from './submission/payload'
/** 撤回提交记录 */
export { withdrawSubmission } from './submission/record-actions'
/** 申报记录查询（/activities → SubmissionRecord） */
export { getSubmissionRecords, STATUS_MAP } from './submission/record-query'
/** 记录类型/来源路由/标题推导 */
export { activityCategoryOf, deriveRecordTitle, sourcePathOf } from './submission/record-utils'
/** 提交申报、首次建草稿 */
export { createDraft, submitApplication } from './submission/submit'
