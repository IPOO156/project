import type {
  MessageBatchIdsPayload,
  MessageCategory,
  MessageListResult,
  MessageReadAllResult,
  MessageSetting,
  MessageSettingUpdatePayload,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 消息中心 ===================== */

export interface MessageQuery {
  category?: MessageCategory | ''
  isRead?: number
  isArchived?: number
  keyword?: string
  page?: number
  per_page?: number
}

export function listMessages(params: MessageQuery): Promise<MessageListResult> {
  return request.get('/messages', { params })
}

export function readMessage(id: number): Promise<void> {
  return request.put(`/messages/${id}/read`)
}

export function readAllMessages(category?: string): Promise<{ markedCount: number }> {
  return request.put('/messages/read-all', null, { params: { category } })
}

export function archiveMessage(id: number): Promise<{
  messageId: number
  isArchived: number
  archivedAt: string | null
}> {
  return request.put(`/messages/${id}/archive`)
}

export function unarchiveMessage(id: number): Promise<{
  messageId: number
  isArchived: number
  archivedAt: string | null
}> {
  return request.put(`/messages/${id}/unarchive`)
}

export function deleteMessage(id: number): Promise<void> {
  return request.delete(`/messages/${id}`)
}

export function getMessageSettings(): Promise<MessageSetting[]> {
  return request.get('/messages/settings')
}

export function updateMessageSettings(payload: MessageSettingUpdatePayload): Promise<void> {
  return request.put('/messages/settings', payload)
}

export function batchReadMessages(payload: MessageBatchIdsPayload): Promise<MessageReadAllResult> {
  return request.put('/messages/batch-read', payload)
}

export function batchDeleteMessages(
  payload: MessageBatchIdsPayload,
): Promise<MessageReadAllResult> {
  return request.delete('/messages/batch', { data: payload })
}

/* ===================== 教师消息中心（/teacher/messages）===================== */

export interface TeacherMessageArchiveResult {
  messageId: number
  isArchived: number
  archivedAt: string | null
}

export function getTeacherMessages(params: {
  category?: MessageCategory | string
  isRead?: number
  isArchived?: number
  keyword?: string
  page?: number
  per_page?: number
}): Promise<MessageListResult> {
  return request.get('/teacher/messages', { params })
}

export function markTeacherMessageRead(messageId: number): Promise<void> {
  return request.put(`/teacher/messages/${messageId}/read`)
}

export function archiveTeacherMessage(messageId: number): Promise<TeacherMessageArchiveResult> {
  return request.put(`/teacher/messages/${messageId}/archive`)
}
