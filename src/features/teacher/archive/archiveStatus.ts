/**
 * 档案状态字典与展示映射。
 *
 * 筛选下拉、档案明细表、详情抽屉三处共用同一份取值/文案，避免各组件各写一份。
 */
export const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 0, label: '草稿' },
  { value: 1, label: '待审批' },
  { value: 2, label: '通过' },
  { value: 3, label: '已退回' },
  { value: 4, label: '已撤销' },
]

export function statusTagType(status: number | null) {
  return status === 2 ? 'success' : status === 3 ? 'danger' : status === 1 ? 'warning' : 'info'
}

export function statusLabel(status: number | null) {
  return statusOptions.find((s) => s.value === status)?.label ?? '-'
}
