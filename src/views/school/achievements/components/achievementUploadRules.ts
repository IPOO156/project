import { ACHIEVEMENT_MAX_PAGE_SIZE, ACHIEVEMENT_MAX_PAGES } from '@/shared/api/achievements'

/** 文件扩展名（小写，不含点） */
export function extOf(name: string): string {
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase()
}

/** 是否可预览的图片（优先 MIME，扩展名兜底） */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extOf(file.name))
}

/** 文件大小展示（1 MB 以上保留一位小数） */
export function fileSizeText(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

/** 获得日期不允许选未来（保留原生 date 输入时的 max=today 行为） */
export function isFutureDate(date: Date): boolean {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return date.getTime() > endOfToday.getTime()
}

/** 校验页数与单页格式/大小，返回错误文案（空串表示通过） */
export function validateAchievementFiles(files: File[]): string {
  if (files.length === 0) return '请至少添加一页证书'
  if (files.length > ACHIEVEMENT_MAX_PAGES) {
    return `一份证书最多 ${ACHIEVEMENT_MAX_PAGES} 页，请删减后再保存`
  }
  for (const file of files) {
    const ext = extOf(file.name)
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      return `「${file.name}」格式不支持，仅支持 jpg / png / pdf`
    }
    if (file.size > ACHIEVEMENT_MAX_PAGE_SIZE) {
      return `「${file.name}」超过 5MB，请压缩到单页 5MB 以内`
    }
  }
  return ''
}

/** 手动调整页序：返回新数组，第一页自动作封面 */
export function moveFile(files: File[], index: number, delta: number): File[] {
  const target = index + delta
  if (target < 0 || target >= files.length) return files
  const next = [...files]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}
