import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { useNotificationStore } from '@/app/stores/stores'
import { pushNotification } from '@/shared/api/submission'
import { useRejectTemplates } from './useRejectTemplates'

export function useReviewOperations() {
  const { comment, templates, applyTemplate, clearComment } = useRejectTemplates()
  const notificationStore = useNotificationStore()
  const reviewComment = ref('')
  const processedIds = ref<Set<string | number>>(new Set())
  const isProcessing = ref(false)
  const currentIndex = ref(0)

  let lastClickTime = 0
  const DEBOUNCE_MS = 300
  function checkDebounce(): boolean {
    const now = Date.now()
    if (now - lastClickTime < DEBOUNCE_MS) {
      ElMessage.warning('操作过于频繁')
      return false
    }
    lastClickTime = now
    return true
  }

  /** 申报类型显示名：优先 typeLabel（Mock/接口可能只给 key），否则回退 type */
  function typeLabel(item: any): string {
    return item?.typeLabel || item?.type || ''
  }

  /**
   * 列表移除某条记录后，修正 currentIndex 防止越界
   * （审核弹窗当前项被处理时，索引指向下一项；若超出末尾则回退到最后一项）
   */
  function clampIndex(listLength: number) {
    if (currentIndex.value > listLength - 1) {
      currentIndex.value = Math.max(0, listLength - 1)
    }
  }

  async function approve(item: any, list: any[]): Promise<boolean> {
    if (!checkDebounce()) return false
    if (processedIds.value.has(item.id)) {
      ElMessage.warning('已处理')
      return false
    }
    try {
      await ElMessageBox.confirm(`确认通过「${item.name}」的${typeLabel(item)}？`, '审批确认', {
        confirmButtonText: '确定通过',
        cancelButtonText: '取消',
        type: 'success',
      })
    } catch {
      return false
    }
    isProcessing.value = true
    try {
      processedIds.value.add(item.id)
      const idx = list.findIndex((p) => p.id === item.id)
      if (idx > -1) list.splice(idx, 1)
      clampIndex(list.length)
      await pushNotification({
        title: `${typeLabel(item)}已通过`,
        content: `您的${typeLabel(item)}已通过审核。`,
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
      notificationStore.addNotification({
        title: `${typeLabel(item)}已通过`,
        content: `您的${typeLabel(item)}已通过审核。`,
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
      ElMessage.success('已通过审批')
      return true
    } finally {
      isProcessing.value = false
    }
  }

  async function reject(item: any, list: any[]): Promise<boolean> {
    if (!checkDebounce()) return false
    if (processedIds.value.has(item.id)) {
      ElMessage.warning('已处理')
      return false
    }
    if (!reviewComment.value.trim()) {
      ElMessage.warning('请填写驳回原因')
      return false
    }
    isProcessing.value = true
    try {
      processedIds.value.add(item.id)
      const idx = list.findIndex((p) => p.id === item.id)
      if (idx > -1) list.splice(idx, 1)
      clampIndex(list.length)
      await pushNotification({
        title: `${typeLabel(item)}已被驳回`,
        content: `您的${typeLabel(item)}已被驳回，原因：${reviewComment.value}`,
        category: 'audit_remind',
        jumpUrl: '/applications',
      })
      notificationStore.addNotification({
        title: `${typeLabel(item)}已被驳回`,
        content: `您的${typeLabel(item)}已被驳回，原因：${reviewComment.value}`,
        category: 'audit_remind',
        jumpUrl: '/applications',
      })
      ElMessage.success('已驳回')
      reviewComment.value = ''
      return true
    } finally {
      isProcessing.value = false
    }
  }

  async function batchApprove(items: any[], list: any[]): Promise<number> {
    if (items.length === 0) {
      ElMessage.warning('请勾选材料')
      return 0
    }
    try {
      await ElMessageBox.confirm(`确认批量通过 ${items.length} 条材料？`, '批量通过确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'success',
      })
    } catch {
      return 0
    }
    let count = 0
    for (const item of items) {
      if (processedIds.value.has(item.id)) continue
      processedIds.value.add(item.id)
      const idx = list.findIndex((p) => p.id === item.id)
      if (idx > -1) list.splice(idx, 1)
      count++
      await pushNotification({
        title: `${typeLabel(item)}已通过`,
        content: `您的${typeLabel(item)}已通过审核。`,
        category: 'audit_remind',
        jumpUrl: '/approval/pending',
      })
    }
    if (count > 0) ElMessage.success(`已批量通过 ${count} 条材料`)
    return count
  }

  async function batchReject(items: any[], list: any[], reason: string): Promise<number> {
    if (items.length === 0) {
      ElMessage.warning('请勾选材料')
      return 0
    }
    if (!reason.trim()) {
      ElMessage.warning('请填写驳回原因')
      return 0
    }
    try {
      await ElMessageBox.confirm(`确认批量驳回 ${items.length} 条材料？`, '批量驳回确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return 0
    }
    let count = 0
    for (const item of items) {
      if (processedIds.value.has(item.id)) continue
      processedIds.value.add(item.id)
      const idx = list.findIndex((p) => p.id === item.id)
      if (idx > -1) list.splice(idx, 1)
      count++
      await pushNotification({
        title: `${typeLabel(item)}已被驳回`,
        content: `您的${typeLabel(item)}已被驳回，原因：${reason}`,
        category: 'audit_remind',
        jumpUrl: '/applications',
      })
    }
    if (count > 0) ElMessage.success(`已批量驳回 ${count} 条材料`)
    return count
  }

  function goPrev() {
    if (currentIndex.value > 0) currentIndex.value--
  }
  function goNext(total: number) {
    if (currentIndex.value < total - 1) currentIndex.value++
  }

  return {
    reviewComment,
    comment,
    templates,
    applyTemplate,
    clearComment,
    isProcessing,
    currentIndex,
    processedIds,
    approve,
    reject,
    batchApprove,
    batchReject,
    goPrev,
    goNext,
  }
}
