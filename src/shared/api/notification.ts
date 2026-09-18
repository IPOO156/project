import type { Notification, NotificationFilters } from '@/shared/types/types'
import request from './request'

/**
 * 获取通知列表
 * 对接后端 GET /messages（5.1）。
 * 接口异常由全局请求拦截器统一提示，此处不做 mock 兜底——伪造数据会在刷新后消失，
 * 造成"消息归零"假象；失败交由 Store 捕获置空态。
 */
export function getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
  const params: Record<string, any> = {
    page: 1,
    per_page: 50,
  }
  if (filters?.category) params.category = filters.category
  if (filters?.status === 'read') params.isRead = 1
  if (filters?.status === 'unread') params.isRead = 0
  if (filters?.archived === true) params.isArchived = 1
  if (filters?.keyword) params.keyword = filters.keyword

  return request.get('/messages', { params }).then((res: any) => (res?.list ?? []).map(mapMessage))
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

/** 单个点击已读（PUT /messages/{messageId}/read） */
export function markAsRead(messageId: string): Promise<void> {
  return request
    .put(`/messages/${messageId}/read`)
    .then(() => undefined)
    .catch(() => undefined)
}

/** 全部一键已读（PUT /messages/read-all） */
export function markAllAsRead(): Promise<{ markedCount: number }> {
  return request
    .put('/messages/read-all')
    .then((res: any) => ({ markedCount: res?.markedCount ?? 0 }))
    .catch(() => ({ markedCount: 0 }))
}

/** 选择多个已读（PUT /messages/batch-read） */
export function batchReadMessages(messageIds: string[]): Promise<{ markedCount: number }> {
  return request
    .put('/messages/batch-read', { messageIds: messageIds.map(Number) })
    .then((res: any) => ({ markedCount: res?.markedCount ?? 0 }))
    .catch(() => ({ markedCount: 0 }))
}

/** 归档消息（PUT /messages/{messageId}/archive） */
export function archiveMessage(
  messageId: string,
): Promise<{ messageId: string; isArchived: number; archivedAt: string }> {
  return request
    .put(`/messages/${messageId}/archive`)
    .then((res: any) => ({
      messageId: String(res?.messageId ?? messageId),
      isArchived: res?.isArchived ?? 1,
      archivedAt: res?.archivedAt ?? '',
    }))
    .catch(() => ({ messageId, isArchived: 1, archivedAt: '' }))
}

/** 取消归档消息（PUT /messages/{messageId}/unarchive） */
export function unarchiveMessage(messageId: string): Promise<void> {
  return request
    .put(`/messages/${messageId}/unarchive`)
    .then(() => undefined)
    .catch(() => undefined)
}

/** 删除单条消息（DELETE /messages/{messageId}） */
export function deleteNotification(messageId: string): Promise<void> {
  return request
    .delete(`/messages/${messageId}`)
    .then(() => undefined)
    .catch(() => undefined)
}

/** 选择多个删除（DELETE /messages/batch） */
export function batchDeleteMessages(messageIds: string[]): Promise<{ deletedCount: number }> {
  return request
    .delete('/messages/batch', { data: { messageIds: messageIds.map(Number) } })
    .then((res: any) => ({ deletedCount: res?.deletedCount ?? 0 }))
    .catch(() => ({ deletedCount: 0 }))
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
  return request
    .get('/messages/settings')
    .then((res: any) => (Array.isArray(res) ? res : []))
    .catch(() => [])
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
