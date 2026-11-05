/**
 * 教师端/管理端 API 层
 *
 * 仅对接后端【已实现】的接口（Fmy/Lzw 包，context-path /api/v1）。
 * 教师端页面优先使用 /teacher/** 接口（若存在）；教师端无等价接口的管理功能
 * 继续使用 /admin/**（如用户/角色/学期/导出模板/组织架构等），后端缺口见核查报告。
 * 教师消息中心独立走 /teacher/messages（DTO 与学生端 /messages 一致）。
 *
 * 本文件为纯 barrel：实现已按业务域拆分至同目录 teacher-*.ts，
 * 对外导出符号与拆分前保持一致，调用方无需改动导入路径。
 */
export * from './teacher-approval-flow'
export * from './teacher-archive'
export * from './teacher-audit-task'
export * from './teacher-auth'
export * from './teacher-common'
export * from './teacher-export-template'
export * from './teacher-indicator'
export * from './teacher-log'
export * from './teacher-message'
export * from './teacher-scheduled-task'
export * from './teacher-statistics'
export * from './teacher-student-profile'
export * from './teacher-user'
// 供部分页面类型标注复用，避免零散 any
export type { MessageItem } from '@/shared/types/teacher'
