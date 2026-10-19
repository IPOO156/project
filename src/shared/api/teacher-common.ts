import type {
  AbilityDimensionItem,
  AbilityDimensionPayload,
  AnnouncementIdResult,
  AnnouncementItem,
  AnnouncementPayload,
  CommonIndicatorTree,
  DictItem,
  DictItemCreatePayload,
  DictItemListResult,
  DictItemUpdatePayload,
  DictTypeItem,
  FilePreviewResult,
  FileUploadResult,
  FormTemplateCreatePayload,
  FormTemplateDetail,
  FormTemplateItem,
  FormTemplateUpdatePayload,
  OrgClassItem,
  OrgClassQuery,
  OrgClassSavePayload,
  OrgCollegeItem,
  OrgCreateIdResult,
  OrgMajorCreatePayload,
  OrgMajorItem,
  OrgSchoolItem,
  PageResult,
  SemesterImportPayload,
  SemesterImportResult,
  SemesterItem,
  SemesterListItem,
  SemesterSavePayload,
  SettingItem,
  SettingUpdatePayload,
} from '@/shared/types/teacher'
import { getToken } from '@/shared/utils/token'
import request from './request'

/* ===================== 能力维度（/admin/ability-dimensions）===================== */

export function listAbilityDimensions(): Promise<AbilityDimensionItem[]> {
  return request.get('/admin/ability-dimensions')
}

export function createAbilityDimension(
  payload: AbilityDimensionPayload,
): Promise<AbilityDimensionItem> {
  return request.post('/admin/ability-dimensions', payload)
}

export function updateAbilityDimension(
  id: number,
  payload: Partial<AbilityDimensionPayload> & { status?: number },
): Promise<AbilityDimensionItem> {
  return request.put(`/admin/ability-dimensions/${id}`, payload)
}

export function deleteAbilityDimension(id: number): Promise<void> {
  return request.delete(`/admin/ability-dimensions/${id}`)
}

/* ===================== 通用下拉 ===================== */

export function getSemesters(): Promise<SemesterItem[]> {
  return request.get('/common/semesters')
}

export function getDict(dictType: string): Promise<DictItem[]> {
  return request.get('/common/dict', { params: { dictType } })
}

export function getEnums(enumType: string): Promise<DictItem[]> {
  return request.get('/common/enums', { params: { enumType } })
}

export function getCommonIndicators(versionId?: number): Promise<CommonIndicatorTree> {
  return request.get('/common/indicators', { params: { versionId } })
}

/* ===================== 文件上传（/common/upload）===================== */

export function uploadFile(file: File, type: string, module: string): Promise<FileUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('module', module)
  return request.post('/common/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/* ===================== 文件管理（/common/files）===================== */

export function getFilePreview(fileId: number): Promise<FilePreviewResult> {
  return request.get(`/common/files/${fileId}/preview`)
}

export function deleteFile(fileId: number): Promise<void> {
  return request.delete(`/common/files/${fileId}`)
}

/**
 * 下载文件（后端 302 重定向到 OSS 签名 URL，绕过统一拦截器以 blob 接收）。
 *
 * ⚠️ 必须走本函数，不能用 `<a href="{downloadUrl}">` 直链：
 * `/common/files/{fileId}/download` 是**鉴权端点**（无 token 返回 401 未登录，
 * 见 CommonService.downloadFile 的权限与有效期校验），浏览器直链不会携带
 * Authorization 头，必然下载失败。此处以 axios 带 Bearer 取回 blob 再触发本地保存。
 *
 * 文件名：省略 fileName 时优先解析响应头 `Content-Disposition` —— 后端经
 * OssFileService.getFileUrl(objectKey, originalName) 生成的签名 URL 会带上真实
 * 文件名（中文走 filename*=UTF-8'' 通道），比前端猜扩展名可靠；两者都取不到时
 * 退回「下载文件」。
 */
export async function downloadFile(fileId: number, fileName?: string): Promise<void> {
  const { default: axios } = await import('axios')
  const res = await axios.get(`/api/v1/common/files/${fileId}/download`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const blob = new Blob([res.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName ?? resolveFileName(res.headers) ?? '下载文件'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 从响应头解析下载文件名：依次尝试 RFC 5987 的 `filename*=UTF-8''<pct-encoded>`
 * 与普通 `filename="..."`，均无则返回 null（由调用方兜底）。
 */
function resolveFileName(headers: unknown): string | null {
  const record = headers as Record<string, unknown> | undefined
  const raw = record?.['content-disposition']
  if (typeof raw !== 'string') {
    return null
  }
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(raw)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return null
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(raw)
  return plain?.[1] ?? null
}

/* ===================== 字典管理（/admin/dict）===================== */

export function listDictTypes(params: {
  keyword?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<DictTypeItem>> {
  return request.get('/admin/dict/types', { params })
}

export function listDictItems(params: {
  dictType?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<DictItemListResult> {
  return request.get('/admin/dict/items', { params })
}

export function createDictItem(payload: DictItemCreatePayload): Promise<{ id: number }> {
  return request.post('/admin/dict/items', payload)
}

export function updateDictItem(itemId: number, payload: DictItemUpdatePayload): Promise<void> {
  return request.put(`/admin/dict/items/${itemId}`, payload)
}

export function deleteDictItem(itemId: number): Promise<void> {
  return request.delete(`/admin/dict/items/${itemId}`)
}

/* ===================== 学期管理（/admin/semesters）===================== */

export function listSemesters(params: {
  schoolId?: number
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<SemesterListItem>> {
  return request.get('/admin/semesters', { params })
}

export function createSemester(payload: SemesterSavePayload): Promise<{ semesterId: number }> {
  return request.post('/admin/semesters', payload)
}

export function updateSemester(semesterId: number, payload: SemesterSavePayload): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}`, payload)
}

export function setCurrentSemester(semesterId: number): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}/set-current`)
}

export function updateSemesterStatus(semesterId: number, status: number): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}/status`, { status })
}

export function importSemesters(payload: SemesterImportPayload): Promise<SemesterImportResult> {
  return request.post('/admin/semesters/import', payload)
}

/** 下载学期导入模板（后端返回 xlsx 二进制，绕过统一拦截器） */
export async function downloadSemesterImportTemplate(): Promise<void> {
  const { default: axios } = await import('axios')
  const res = await axios.get('/api/v1/admin/semesters/import-template', {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const blob = new Blob([res.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '学期导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ===================== 表单自定义（/admin/form-templates）===================== */

export function listFormTemplates(params: {
  category?: string
  status?: number
  keyword?: string
  page?: number
  per_page?: number
}): Promise<PageResult<FormTemplateItem>> {
  return request.get('/admin/form-templates', { params })
}

export function getFormTemplateDetail(templateId: number): Promise<FormTemplateDetail> {
  return request.get(`/admin/form-templates/${templateId}`)
}

export function createFormTemplate(payload: FormTemplateCreatePayload): Promise<{ id: number }> {
  return request.post('/admin/form-templates', payload)
}

export function updateFormTemplate(
  templateId: number,
  payload: FormTemplateUpdatePayload,
): Promise<void> {
  return request.put(`/admin/form-templates/${templateId}`, payload)
}

export function deleteFormTemplate(templateId: number): Promise<void> {
  return request.delete(`/admin/form-templates/${templateId}`)
}

export function setDefaultFormTemplate(templateId: number): Promise<void> {
  return request.put(`/admin/form-templates/${templateId}/default`)
}

/* ===================== 系统配置（/admin/settings）===================== */

export function listSystemSettings(params?: {
  group?: string
  keyword?: string
  page?: number
  per_page?: number
}): Promise<PageResult<SettingItem>> {
  return request.get('/admin/settings', { params })
}

export function updateSystemSetting(payload: SettingUpdatePayload): Promise<void> {
  return request.put('/admin/settings', payload)
}

/* ===================== 公告管理（/admin/announcements）===================== */

export function listAnnouncements(params: {
  status?: number
  targetType?: string
  page?: number
  per_page?: number
}): Promise<PageResult<AnnouncementItem>> {
  return request.get('/admin/announcements', { params })
}

export function createAnnouncement(payload: AnnouncementPayload): Promise<AnnouncementIdResult> {
  return request.post('/admin/announcements', payload)
}

export function updateAnnouncement(
  announcementId: number,
  payload: AnnouncementPayload,
): Promise<void> {
  return request.put(`/admin/announcements/${announcementId}`, payload)
}

export function deleteAnnouncement(announcementId: number): Promise<void> {
  return request.delete(`/admin/announcements/${announcementId}`)
}

/* ===================== 组织架构（/admin/schools|colleges|majors|classes）===================== */

export function listSchools(): Promise<OrgSchoolItem[]> {
  return request.get('/admin/schools')
}

export function listColleges(params?: {
  schoolId?: number
  status?: number
}): Promise<OrgCollegeItem[]> {
  return request.get('/admin/colleges', { params })
}

export function listMajors(params?: {
  collegeId?: number
  schoolId?: number
  status?: number
}): Promise<OrgMajorItem[]> {
  return request.get('/admin/majors', { params })
}

export function listClasses(params: OrgClassQuery): Promise<PageResult<OrgClassItem>> {
  return request.get('/admin/classes', { params })
}

export function createClass(payload: OrgClassSavePayload): Promise<OrgCreateIdResult> {
  return request.post('/admin/classes', payload)
}

export function updateClass(classId: number, payload: OrgClassSavePayload): Promise<void> {
  return request.put(`/admin/classes/${classId}`, payload)
}

export function createMajor(payload: OrgMajorCreatePayload): Promise<OrgCreateIdResult> {
  return request.post('/admin/majors', payload)
}
