/**
 * 教师端/管理端 API 类型 —— 公告管理（/admin/announcements）
 */

export interface AnnouncementItem {
  announcementId: number
  title: string
  content: string
  /** 发布对象：all/college/major/class（后端枚举 AnnouncementTargetTypeEnum） */
  targetType: string | null
  status: number | null
  statusLabel: string | null
  publishedAt: string | null
  publisherId: number | null
  createdAt: string | null
}

export interface AnnouncementPayload {
  title: string
  content: string
  /** 发布对象：all/college/major/class */
  targetType?: string
  targetId?: number
  status?: number
  publishedAt?: string
}

export interface AnnouncementIdResult {
  announcementId: number
}
