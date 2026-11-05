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
import { downloadBlobFile } from '@/shared/utils/download'
import request from './request'

/** 下拉/候选列表分页拉全量：后端 PageParam 单页上限为 100，超出部分必须翻页获取 */
const LOOKUP_PAGE_SIZE = 100
/** 安全上限：total 异常时避免无限翻页；达到上限会在控制台明确告警 */
const LOOKUP_MAX_PAGES = 50

export async function fetchAllPageItems<T>(
  fetchPage: (page: number, perPage: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const first = await fetchPage(1, LOOKUP_PAGE_SIZE)
  const firstList = first?.list ?? []
  const total = Number(first?.total) || 0
  const totalPages = Math.max(1, Math.ceil(total / LOOKUP_PAGE_SIZE))
  if (totalPages > LOOKUP_MAX_PAGES) {
    console.warn(
      `[lookup] 数据共 ${total} 条，超过前端安全上限 ${LOOKUP_MAX_PAGES * LOOKUP_PAGE_SIZE}，仅加载前 ${LOOKUP_MAX_PAGES} 页`,
    )
  }
  const pageCount = Math.min(totalPages, LOOKUP_MAX_PAGES)
  if (pageCount <= 1 || firstList.length === 0) return firstList
  // 顺序翻页而非一次性并发：下拉候选总量通常很小，顺序请求可避免异常 total 时对后端形成请求突发。
  const all = [...firstList]
  for (let page = 2; page <= pageCount; page++) {
    const res = await fetchPage(page, LOOKUP_PAGE_SIZE)
    all.push(...(res?.list ?? []))
  }
  return all
}

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
 * 下载文件（后端 302 重定向到 OSS 签名 URL，以 blob 接收）。
 *
 * ⚠️ 必须走本函数，不能用 `<a href="{downloadUrl}">` 直链：
 * `/common/files/{fileId}/download` 是**鉴权端点**（无 token 返回 401 未登录，
 * 见 CommonService.downloadFile 的权限与有效期校验），浏览器直链不会携带
 * Authorization 头，必然下载失败。此处经统一 request 实例（自动带 Bearer 与
 * 401 续期）取回 blob 再触发本地保存。
 *
 * 文件名：省略 fileName 时优先解析响应头 `Content-Disposition` —— 后端经
 * OssFileService.getFileUrl(objectKey, originalName) 生成的签名 URL 会带上真实
 * 文件名（中文走 filename*=UTF-8'' 通道），比前端猜扩展名可靠；两者都取不到时
 * 退回「下载文件」。
 */
export async function downloadFile(fileId: number, fileName?: string): Promise<void> {
  await downloadBlobFile(`/common/files/${fileId}/download`, '下载文件', fileName)
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

/** 下载学期导入模板（后端返回 xlsx 二进制） */
export async function downloadSemesterImportTemplate(): Promise<void> {
  await downloadBlobFile('/admin/semesters/import-template', '学期导入模板.xlsx')
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

/**
 * 班级下拉候选（全部页）。
 * 同 listAllRoles：后端单页上限 100，原先固定 per_page=200 时第 101 个班级起缺失。
 */
export function listAllClasses(
  params: Omit<OrgClassQuery, 'page' | 'per_page'> = {},
): Promise<OrgClassItem[]> {
  return fetchAllPageItems((page, per_page) => listClasses({ ...params, page, per_page }))
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
