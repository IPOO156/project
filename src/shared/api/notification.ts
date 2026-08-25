import type { Notification, NotificationFilters } from '@/shared/types/types'
import request from './request'

/**
 * 获取通知列表
 * 对接后端 GET /messages（5.1），接口异常时回退 Mock。
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

  return request
    .get('/messages', { params })
    .then((res: any) => (res?.list ?? []).map((m: any) => mapMessage(m)))
    .catch(() => Promise.resolve(mockMessages()))
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

function mockMessages(): Notification[] {
  const base = {
    senderType: 1,
    senderTypeLabel: '系统',
    senderName: null,
    readAt: null,
    isImportant: 0,
    isArchived: 0,
    archivedAt: null,
    sendChannel: 'push',
    relatedType: null,
    relatedId: null,
  }
  return [
    {
      id: '1',
      ...base,
      category: 'audit_remind',
      categoryLabel: '审批提醒',
      title: '学科竞赛申报已通过',
      content: '您的「全国大学生数学建模竞赛」申报已通过审核。',
      isRead: 0,
      deadline: '2026-08-01',
      jumpUrl: '/applications?tab=competition',
      createdAt: '2026-07-20T09:30:00+08:00',
      isReadFlag: false,
    },
    {
      id: '2',
      ...base,
      category: 'audit_remind',
      categoryLabel: '审批提醒',
      title: '社会实践材料被驳回',
      content: '您的「暑期三下乡社会实践」材料被驳回，原因：佐证材料不充分。',
      isRead: 0,
      deadline: null,
      jumpUrl: '/applications?tab=social-practice',
      createdAt: '2026-07-19T14:20:00+08:00',
      isReadFlag: false,
    },
    {
      id: '3',
      ...base,
      category: 'dynamic_remind',
      categoryLabel: '动态提醒',
      title: 'AI 成长分析报告已生成',
      content: '基于您的档案数据，AI 已生成最新成长分析报告。',
      isRead: 1,
      deadline: null,
      jumpUrl: '/ai-chat',
      createdAt: '2026-07-19T08:00:00+08:00',
      isReadFlag: true,
    },
    {
      id: '4',
      ...base,
      category: 'system_notice',
      categoryLabel: '系统通知',
      title: '系统维护通知',
      content: '系统将于本周日凌晨 02:00-04:00 进行例行维护。',
      isRead: 0,
      isImportant: 1,
      deadline: '2026-07-28',
      jumpUrl: null,
      createdAt: '2026-07-20T18:00:00+08:00',
      isReadFlag: false,
    },
    {
      id: '5',
      ...base,
      category: 'private_message',
      categoryLabel: '私信',
      title: '职业规划反馈-张老师',
      content: '您的成长规划已收到张老师评语。',
      isRead: 1,
      deadline: null,
      jumpUrl: '/profile/career-plan',
      createdAt: '2026-07-18T11:20:00+08:00',
      isReadFlag: true,
    },
  ]
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
