import type {
  AdminAiFaqCreatePayload,
  AdminAiFaqItem,
  AdminAiFaqUpdatePayload,
} from '@/shared/types/teacher'
import request from './request'

/**
 * 管理端 AI 常见问题（/admin/ai-faqs）。
 * 列表不分页，一次性返回全部未删除记录（含禁用），按 sort 升序。
 */

export function listAiFaqs(): Promise<AdminAiFaqItem[]> {
  // 统一 mock / 网关异常可能返回非数组（如 {}），归一为空列表避免表格崩溃
  return request
    .get('/admin/ai-faqs')
    .then((data) => (Array.isArray(data) ? (data as AdminAiFaqItem[]) : []))
}

export function createAiFaq(payload: AdminAiFaqCreatePayload): Promise<AdminAiFaqItem> {
  return request.post('/admin/ai-faqs', payload)
}

export function updateAiFaq(id: number, payload: AdminAiFaqUpdatePayload): Promise<AdminAiFaqItem> {
  return request.put(`/admin/ai-faqs/${id}`, payload)
}

export function deleteAiFaq(id: number): Promise<void> {
  // 失败必须冒泡：调用方只有成功后才会刷新列表，避免「本地删了、服务端还在」
  return request.delete(`/admin/ai-faqs/${id}`).then(() => undefined)
}
