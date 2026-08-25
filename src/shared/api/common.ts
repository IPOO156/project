import type { AxiosProgressEvent } from 'axios'
import request from './request'

/* ===================== 文件通用接口 ===================== */

/** 文件上传（POST /common/upload） */
export interface UploadResult {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileSize: number
  fileType: string
}

export function uploadFile(payload: {
  file: File
  type?: string
  module?: string
  /** 上传进度回调（透传至 axios onUploadProgress，现有调用不受影响） */
  onUploadProgress?: (event: AxiosProgressEvent) => void
}): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('type', payload.type ?? 'evidence')
  formData.append('module', payload.module ?? 'archive')
  return request.post('/common/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: payload.onUploadProgress,
  })
}

/** 文件预览（GET /common/files/{fileId}/preview） */
export interface FilePreview {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileType: string
  previewUrl: string
  canPreview: boolean
}

export function previewFile(fileId: number): Promise<FilePreview> {
  return request.get(`/common/files/${fileId}/preview`)
}

/** 文件下载（GET /common/files/{fileId}/download） */
export function downloadFile(fileId: number): Promise<void> {
  return request.get(`/common/files/${fileId}/download`, { responseType: 'blob' })
}

/** 删除未提交附件（DELETE /common/files/{fileId}） */
export function deleteFile(fileId: number): Promise<void> {
  return request.delete(`/common/files/${fileId}`)
}

/** 上传头像（POST /common/upload/avatar） */
export function uploadAvatar(file: File): Promise<{ avatarUrl: string; objectKey: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/common/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/* ===================== 学期下拉 ===================== */

export interface SemesterOption {
  value: number
  label: string
  name: string
  isCurrent: number
}

/** 学期下拉选项（GET /common/semesters） */
export function getSemesters(): Promise<SemesterOption[]> {
  return request.get('/common/semesters')
}

/* ===================== 字典数据 ===================== */

export interface DictOption {
  value: string
  label: string
  sort: number
}

/** 字典数据（GET /common/dict） */
export function getDict(dictType: string): Promise<DictOption[]> {
  return request.get('/common/dict', { params: { dictType } })
}

/* ===================== 指标树 ===================== */

export interface CommonIndicator {
  indicatorId: number
  indicatorCode: string
  indicatorName: string
  level: number
  weight: number
  dimensionCode?: string
  dimensionName?: string
  children?: CommonIndicator[]
}

export interface IndicatorTree {
  versionId: number
  versionName: string
  effectiveAt: string
  indicators: CommonIndicator[]
}

/** 指标树查询（GET /common/indicators） */
export function getIndicators(versionId?: number): Promise<IndicatorTree> {
  return request.get('/common/indicators', { params: versionId ? { versionId } : undefined })
}
