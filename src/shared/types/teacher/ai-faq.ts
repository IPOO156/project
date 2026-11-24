/**
 * 管理端 AI 常见问题（/admin/ai-faqs）
 * 字段来源：AI FAQ 配置模块接口文档 V1.0。
 */

/** 管理端列表项（含禁用项，statusLabel 为后端中文标签） */
export interface AdminAiFaqItem {
  id: number
  question: string
  sort: number
  /** 0=禁用 1=启用 */
  status: number
  statusLabel?: string
}

/** 创建请求：后端固定以 status=1 创建 */
export interface AdminAiFaqCreatePayload {
  question: string
  sort: number
}

/** 更新请求：局部更新，未传字段保持不变 */
export interface AdminAiFaqUpdatePayload {
  question?: string
  sort?: number
  /** 0=禁用 1=启用 */
  status?: number
}
