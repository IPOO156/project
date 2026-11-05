export * from './teacher/announcement'
export * from './teacher/approval-flow'
export * from './teacher/archive-types'
export * from './teacher/auth-types'
/**
 * 教师端/管理端 API 类型
 * 与后端 DTO 对齐（学生档案系统后端，context-path /api/v1）
 * 字段来源：后端 dto/Fmy 与 service 返回结构，只读核对，不凭空编造。
 *
 * 本文件为 barrel：类型按业务域拆分到 ./teacher/ 目录，此处统一再导出，
 * 保持既有 import 路径（'@/shared/types/teacher'）不变。
 */
export * from './teacher/common-types'
export * from './teacher/dict-types'
export * from './teacher/export'
export * from './teacher/file'
export * from './teacher/form-template'
export * from './teacher/grade'
export * from './teacher/indicator'
export * from './teacher/log'
export * from './teacher/message'
export * from './teacher/organization'
export * from './teacher/scheduled-task'
export * from './teacher/semester-types'
export * from './teacher/setting'
export * from './teacher/statistics'
export * from './teacher/teacher-audit'
export * from './teacher/teacher-dashboard'
export * from './teacher/teacher-delegation'
export * from './teacher/teacher-student'
export * from './teacher/user-types'
