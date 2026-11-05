/**
 * 教师端/管理端 API 类型 —— 通用分页与通用下拉
 * 与后端 DTO 对齐（学生档案系统后端，context-path /api/v1）
 * 字段来源：后端 dto/Fmy 与 service 返回结构，只读核对，不凭空编造。
 */

/** 通用分页查询参数 */
export interface PageQuery {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/** 后端统一分页结果 */
export interface PageResult<T> {
  total: number
  list: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

/* ===================== 通用下拉 ===================== */

export interface SemesterItem {
  value: number
  label: string
  name: string
  isCurrent: number
}

export interface DictItem {
  value: string
  label: string
  sort: number
}
