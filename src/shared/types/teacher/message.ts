/**
 * 教师端/管理端 API 类型 —— 消息中心与批量操作/设置（/messages）
 */

/* ===================== 消息中心 ===================== */

export type MessageCategory =
  'system_notice' | 'audit_remind' | 'dynamic_remind' | 'private_message'

export interface MessageItem {
  id: number
  category: string
  categoryLabel: string
  title: string
  content: string
  senderType: number
  senderTypeLabel: string
  senderName: string | null
  isRead: number
  readAt: string | null
  isImportant: number
  isArchived: number
  archivedAt: string | null
  deadline: string | null
  jumpUrl: string | null
  sendChannel: string | null
  relatedType: string | null
  relatedId: number | null
  createdAt: string
}

export interface MessageListResult {
  total: number
  unread: number
  list: MessageItem[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface MessageSetting {
  category: string
  categoryLabel: string
  emailEnabled: number
  smsEnabled: number
  pushEnabled: number
}

/* ===================== 消息批量操作 / 设置（/messages）===================== */

export interface MessageBatchIdsPayload {
  messageIds: number[]
}

export interface MessageReadAllResult {
  markedCount: number
}

export interface MessageSettingUpdatePayload {
  category: string
  emailEnabled?: number
  smsEnabled?: number
  pushEnabled?: number
}
