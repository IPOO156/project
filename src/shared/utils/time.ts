/**
 * 时间展示格式化工具（教师端页面共用）。
 * 后端返回的时间为带时区的 ISO 字符串（如 2026-09-06T14:30:00+08:00），
 * 页面列表/详情直接展示会被截断为本地化阅读格式，避免暴露毫秒与时区后缀。
 */

/** 将 ISO 时间格式化为「YYYY-MM-DD HH:mm[:ss]」，空值返回 - */
export function formatDateTime(iso: string | null | undefined, withSeconds = false): string {
  if (!iso) {
    return '-'
  }
  const normalized = iso.includes('T') ? iso.replace('T', ' ') : iso
  const cut = withSeconds ? 19 : 16
  return normalized.slice(0, cut) || '-'
}

/** 将 ISO 时间格式化为「YYYY-MM-DD」，空值返回 - */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) {
    return '-'
  }
  return iso.slice(0, 10) || '-'
}
