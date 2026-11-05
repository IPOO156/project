import type { Notification, NotificationFilters } from '@/shared/types/types'
import request from './request'

/** 后端 GET /messages 的单页上限（MessageController 将 per_page 截断到 100） */
const MESSAGE_PAGE_SIZE = 100
/** 安全上限：避免 total 异常时无限翻页；达到上限会在控制台明确告警 */
const MESSAGE_MAX_PAGES = 50

interface MessagePage {
  list: any[]
  total: number
}

/**
 * 获取通知列表（拉取全部页）
 * 对接后端 GET /messages（5.1）。
 *
 * 后端默认只返回 10 条、单页上限 100 条；此前固定请求第一页 50 条再在本地分页，
 * 导致第 51 条之后的消息在「消息中心」不可见、头部未读角标偏小，且前端拿不到
 * total 就无法区分「确实没有更多」与「还有没加载的」。这里按 total 逐页取完，
 * 再交给 Store 合并两态；不做 mock 兜底（失败交由 Store 与全局拦截器处理）。
 */
export function getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
  return fetchMessagePage(filters, 1).then(async (first) => {
    const pages: any[][] = [first.list]
    const totalPages = Math.min(Math.ceil(first.total / MESSAGE_PAGE_SIZE), MESSAGE_MAX_PAGES)
    if (Math.ceil(first.total / MESSAGE_PAGE_SIZE) > MESSAGE_MAX_PAGES) {
      console.warn(
        `[messages] 消息总数 ${first.total} 超过前端安全上限 ${MESSAGE_MAX_PAGES * MESSAGE_PAGE_SIZE}，仅加载前 ${MESSAGE_MAX_PAGES} 页`,
      )
    }
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchMessagePage(filters, i + 2)),
      )
      rest.forEach((p) => pages.push(p.list))
    }
    return pages.flat().map(mapMessage)
  })
}

function fetchMessagePage(
  filters: NotificationFilters | undefined,
  page: number,
): Promise<MessagePage> {
  const params: Record<string, any> = {
    page,
    per_page: MESSAGE_PAGE_SIZE,
  }
  if (filters?.category) params.category = filters.category
  if (filters?.status === 'read') params.isRead = 1
  if (filters?.status === 'unread') params.isRead = 0
  if (filters?.archived === true) params.isArchived = 1
  if (filters?.keyword) params.keyword = filters.keyword

  return request.get('/messages', { params }).then((res: any) => ({
    list: Array.isArray(res?.list) ? res.list : [],
    total: Number(res?.total) || 0,
  }))
}

function mapMessage(m: any): Notification {
  return {
    id: String(m.id),
    category: m.category,
    categoryLabel: m.categoryLabel || m.category,
    title: m.title,
    content: m.content,
    senderType: m.senderType,
    senderTypeLabel: m.senderTypeLabel,
    senderName: m.senderName ?? null,
    isRead: m.isRead ?? 0,
    readAt: m.readAt ?? null,
    isImportant: m.isImportant ?? 0,
    isArchived: m.isArchived ?? 0,
    archivedAt: m.archivedAt ?? null,
    deadline: m.deadline ?? null,
    jumpUrl: m.jumpUrl ?? null,
    sendChannel: m.sendChannel,
    relatedType: m.relatedType ?? null,
    relatedId: m.relatedId ?? null,
    createdAt: m.createdAt,
    isReadFlag: (m.isRead ?? 0) === 1,
  }
}

// 以下写操作（已读 / 归档 / 删除）失败时不再吞错，也不再伪造成功返回值：
// 异常向上抛给调用方（stores/notification.ts 负责消化，错误提示由 request.ts 响应拦截器统一给出）。
// 曾用 `.catch(() => ({ isArchived: 1 }))` 之类伪造成功，造成「提示成功、刷新后又回来」的误导。

/** 单个点击已读（PUT /messages/{messageId}/read） */
export function markAsRead(messageId: string): Promise<void> {
  return request.put(`/messages/${messageId}/read`).then(() => undefined)
}

/** 全部一键已读（PUT /messages/read-all） */
export function markAllAsRead(): Promise<{ markedCount: number }> {
  return request
    .put('/messages/read-all')
    .then((res: any) => ({ markedCount: res?.markedCount ?? 0 }))
}

/** 选择多个已读（PUT /messages/batch-read） */
export function batchReadMessages(messageIds: string[]): Promise<{ markedCount: number }> {
  return request
    .put('/messages/batch-read', { messageIds: messageIds.map(Number) })
    .then((res: any) => ({ markedCount: res?.markedCount ?? 0 }))
}

/** 归档消息（PUT /messages/{messageId}/archive） */
export function archiveMessage(
  messageId: string,
): Promise<{ messageId: string; isArchived: number; archivedAt: string }> {
  return request.put(`/messages/${messageId}/archive`).then((res: any) => ({
    messageId: String(res?.messageId ?? messageId),
    isArchived: res?.isArchived ?? 1,
    archivedAt: res?.archivedAt ?? '',
  }))
}

/** 取消归档消息（PUT /messages/{messageId}/unarchive） */
export function unarchiveMessage(messageId: string): Promise<void> {
  return request.put(`/messages/${messageId}/unarchive`).then(() => undefined)
}

/** 删除单条消息（DELETE /messages/{messageId}） */
export function deleteNotification(messageId: string): Promise<void> {
  return request.delete(`/messages/${messageId}`).then(() => undefined)
}

/** 选择多个删除（DELETE /messages/batch） */
export function batchDeleteMessages(messageIds: string[]): Promise<{ deletedCount: number }> {
  return request
    .delete('/messages/batch', { data: { messageIds: messageIds.map(Number) } })
    .then((res: any) => ({ deletedCount: res?.deletedCount ?? 0 }))
}

/** 获取消息通知设置（GET /messages/settings） */
export function getMessageSettings(): Promise<
  Array<{
    category: string
    categoryLabel: string
    emailEnabled: number
    smsEnabled: number
    pushEnabled: number
  }>
> {
  // 不吞错误：接口失败必须让调用方区分「读取失败」与「没有任何设置项」，
  // 否则页面会把失败显示成「全部关闭/暂无设置」，用户可能据此误改通知配置。
  return request.get('/messages/settings').then((res: any) => (Array.isArray(res) ? res : []))
}

/** 更新/新增消息通知设置（PUT /messages/settings） */
export function updateMessageSettings(payload: {
  category: string
  emailEnabled: number
  smsEnabled: number
  pushEnabled: number
}): Promise<void> {
  return request.put('/messages/settings', payload).then(() => undefined)
}
