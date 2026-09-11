import type { Ref } from 'vue'
/**
 * useApplicationStatus - 申报状态判断 composable
 *
 * 根据当前申报状态派生一系列可操作状态（是否可编辑、删除、提交等）。
 * 支持传入 Ref<string | undefined> 或普通 getter 函数。
 */
import { computed, reactive } from 'vue'

export function useApplicationStatus(status: Ref<string | undefined> | (() => string | undefined)) {
  const getStatus = typeof status === 'function' ? status : () => status.value

  const isDraft = computed(() => getStatus() === 'draft' || !getStatus())
  const isPending = computed(() => getStatus() === 'pending')
  const isRejected = computed(() => getStatus() === 'rejected')
  const isApproved = computed(() => getStatus() === 'approved')
  const isWithdrawn = computed(() => getStatus() === 'withdrawn')

  return reactive({
    isDraft,
    isPending,
    isRejected,
    isApproved,
    isWithdrawn,
    canEdit: computed(() => isDraft.value || isRejected.value),
    canDelete: computed(() => isDraft.value),
    canSubmit: computed(() => isDraft.value || isRejected.value),
    canWithdraw: computed(() => isPending.value),
    canRequestCorrection: computed(() => isApproved.value),
    isReadonly: computed(() => isApproved.value || isWithdrawn.value),
    canDeleteAttachment: computed(() => isDraft.value || isRejected.value),
    canViewScore: computed(() => isPending.value || isApproved.value || isWithdrawn.value),
  })
}
