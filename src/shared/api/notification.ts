import type { Notification, NotificationFilters } from '@/shared/types/types'
import { notificationCategoryLabel } from '@/shared/constants/dict'
import { asArray, asNumber, asRecord, asText } from '@/shared/utils/unknown'
import request from './request'

/** 后端 GET /messages 的单页上限（MessageController 将 per_page 截断到 100） */
const MESSAGE_PAGE_SIZE = 100
/** 安全上限：避免 total 异常时无限翻页；达到上限会在控制台明确告警 */
const MESSAGE_MAX_PAGES = 50

interface MessagePage {
  list: Record<string, unknown>[]
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
    const pages: Record<string, unknown>[][] = [first.list]
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
  const params: Record<string, string | number> = {
    page,
    per_page: MESSAGE_PAGE_SIZE,
  }
  if (filters?.category) params.category = filters.category
  if (filters?.status === 'read') params.isRead = 1
  if (filters?.status === 'unread') params.isRead = 0
  if (filters?.archived === true) params.isArchived = 1
  if (filters?.keyword) params.keyword = filters.keyword

  return request.get('/messages', { params }).then((res: unknown) => {
    const data = asRecord(res)
    return {
      list: asArray<Record<string, unknown>>(data.list),
      total: asNumber(data.total),
    }
  })
}

/** 后端 isRead/isArchived 可能返回 0/1 或 boolean，统一归一为 0/1 供 UI 判断 */
function toBinaryFlag(value: unknown): 0 | 1 {
  return value === true || value === 1 || value === '1' ? 1 : 0
}

function mapMessage(raw: Record<string, unknown>): Notification {
  return {
    id: asText(raw.id),
    category: asText(raw.category) as Notification['category'],
    // 后端可能把枚举键写进 categoryLabel：统一在此归一，UI 不再各自兜底
    categoryLabel: notificationCategoryLabel(asText(raw.category), asText(raw.categoryLabel)),
    title: asText(raw.title),
    content: asText(raw.content),
    senderType: raw.senderType == null ? undefined : asNumber(raw.senderType),
    senderTypeLabel: raw.senderTypeLabel == null ? undefined : asText(raw.senderTypeLabel),
    senderName: raw.senderName == null ? null : asText(raw.senderName),
    isRead: toBinaryFlag(raw.isRead),
    readAt: raw.readAt == null ? null : asText(raw.readAt),
    isImportant: toBinaryFlag(raw.isImportant),
    isArchived: toBinaryFlag(raw.isArchived),
    archivedAt: raw.archivedAt == null ? null : asText(raw.archivedAt),
    deadline: raw.deadline == null ? null : asText(raw.deadline),
    jumpUrl: raw.jumpUrl == null ? null : asText(raw.jumpUrl),
    sendChannel: raw.sendChannel == null ? undefined : asText(raw.sendChannel),
    relatedType: raw.relatedType == null ? null : asText(raw.relatedType),
    relatedId: raw.relatedId == null ? null : asNumber(raw.relatedId),
    createdAt: asText(raw.createdAt),
    isReadFlag: toBinaryFlag(raw.isRead) === 1,
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
    .then((res: unknown) => ({ markedCount: asNumber(asRecord(res).markedCount) }))
}

/** 选择多个已读（PUT /messages/batch-read） */
export function batchReadMessages(messageIds: string[]): Promise<{ markedCount: number }> {
  return request
    .put('/messages/batch-read', { messageIds: messageIds.map(Number) })
    .then((res: unknown) => ({ markedCount: asNumber(asRecord(res).markedCount) }))
}

/** 归档消息（PUT /messages/{messageId}/archive） */
export function archiveMessage(
  messageId: string,
): Promise<{ messageId: string; isArchived: number; archivedAt: string }> {
  return request.put(`/messages/${messageId}/archive`).then((res: unknown) => {
    const data = asRecord(res)
    return {
      messageId: asText(data.messageId, messageId),
      isArchived: asNumber(data.isArchived, 1),
      archivedAt: asText(data.archivedAt),
    }
  })
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
    .then((res: unknown) => ({ deletedCount: asNumber(asRecord(res).deletedCount) }))
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
  return request.get('/messages/settings').then((res: unknown) =>
    Array.isArray(res)
      ? res.map((item) => {
          const row = asRecord(item)
          const category = asText(row.category)
          return {
            category,
            categoryLabel: notificationCategoryLabel(category, asText(row.categoryLabel)),
            emailEnabled: asNumber(row.emailEnabled),
            smsEnabled: asNumber(row.smsEnabled),
            pushEnabled: asNumber(row.pushEnabled),
          }
        })
      : [],
  )
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
