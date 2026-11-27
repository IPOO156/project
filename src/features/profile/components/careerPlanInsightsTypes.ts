export interface ReflectionItem {
  id: number
  reflectionContent: string
  createdAt: string
}

export interface FeedbackItem {
  id: number
  teacherName: string
  feedbackContent: string
  createdAt: string
}

export interface VersionItem {
  version: number
  status: number
  statusLabel: string
  createdAt: string
}
