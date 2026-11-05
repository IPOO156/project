/**
 * 教师端/管理端 API 类型 —— 文件上传（/common/upload）
 */

export interface FileUploadResult {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileSize: number
  fileType: string
}

export interface FilePreviewResult {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileType: string
  previewUrl: string | null
  canPreview: boolean
}
