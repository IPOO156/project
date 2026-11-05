import type { Ref } from 'vue'
import type { Notification } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  archiveMessage as apiArchive,
  batchReadMessages as apiBatchRead,
  deleteNotification as apiDelete,
  markAllAsRead as apiMarkAll,
  markAsRead as apiMarkOne,
  unarchiveMessage as apiUnarchive,
} from '@/shared/api/notification'
import { isLocalNotification, patchNotifications } from './notificationHelpers'

/**
 * 消息通知的写操作集合。
 * 以工厂形式接收 state refs，保持 useNotificationStore 只负责状态与编排。
 * 失败提示由 request.ts 响应拦截器统一给出；此处吞掉异常并保持本地状态不变。
 */
export function createNotificationMutations(deps: {
  notifications: Ref<Notification[]>
  filteredNotifications: Ref<Notification[]>
}) {
  const { notifications, filteredNotifications } = deps

  function syncOne(id: string, patch: Partial<Notification>): void {
    const target = notifications.value.find((n) => n.id === id)
    if (target) Object.assign(target, patch)
    const filtered = filteredNotifications.value.find((n) => n.id === id)
    if (filtered && filtered !== target) Object.assign(filtered, patch)
  }

  async function markAsRead(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.isRead === 1) return

    if (!isLocalNotification(id)) {
      try {
        await apiMarkOne(id)
      } catch {
        return
      }
    }
    syncOne(id, { isRead: 1, readAt: new Date().toISOString() })
  }

  async function markAllAsRead(): Promise<void> {
    const unreadItems = notifications.value.filter((n) => n.isRead !== 1 && n.isArchived !== 1)
    if (unreadItems.length === 0) return

    try {
      await apiMarkAll()
    } catch {
      // 失败不置本地已读，避免「提示已读、刷新后又变未读」
      return
    }
    const now = new Date().toISOString()
    const patch = (list: Notification[]) => {
      list.forEach((n) => {
        if (n.isArchived !== 1) {
          n.isRead = 1
          n.readAt = now
        }
      })
    }
    patch(notifications.value)
    patch(filteredNotifications.value)
    ElMessage.success(`已将 ${unreadItems.length} 条消息标为已读`)
  }

  /** 归档消息（isImportant=1 的重要消息需二次确认） */
  async function archiveNotification(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target) return

    if (target.isImportant === 1) {
      try {
        await ElMessageBox.confirm(
          '这是一条重要消息，归档后仍可在「已归档」视图中查看。确定归档吗？',
          '归档确认',
          { confirmButtonText: '归档', cancelButtonText: '取消', type: 'warning' },
        )
      } catch {
        return
      }
    }

    if (!isLocalNotification(id)) {
      try {
        await apiArchive(id)
      } catch {
        return
      }
    }
    syncOne(id, { isArchived: 1, archivedAt: new Date().toISOString() })
    ElMessage.success('已归档')
  }

  /** 批量归档（所选含重要消息时统一二次确认） */
  async function archiveNotifications(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const targets = notifications.value.filter((n) => ids.includes(n.id))
    if (targets.some((n) => n.isImportant === 1)) {
      try {
        await ElMessageBox.confirm(
          `所选消息中包含重要消息，归档后仍可在「已归档」视图中查看。确定归档这 ${ids.length} 条消息吗？`,
          '批量归档确认',
          { confirmButtonText: '归档', cancelButtonText: '取消', type: 'warning' },
        )
      } catch {
        return
      }
    }
    const backendIds = ids.filter((n) => !isLocalNotification(n))
    if (backendIds.length > 0) {
      try {
        await Promise.all(backendIds.map((id) => apiArchive(id)))
      } catch {
        return
      }
    }
    const patch = { isArchived: 1, archivedAt: new Date().toISOString() }
    patchNotifications(notifications.value, ids, patch)
    patchNotifications(filteredNotifications.value, ids, patch)
    ElMessage.success(`已归档 ${ids.length} 条消息`)
  }

  /** 将指定 id 集合标为已读（PUT /messages/batch-read） */
  async function markMultipleAsRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const backendIds = ids.filter((n) => !isLocalNotification(n))
    if (backendIds.length > 0) {
      try {
        await apiBatchRead(backendIds)
      } catch {
        return
      }
    }
    const patch = { isRead: 1, readAt: new Date().toISOString() }
    patchNotifications(notifications.value, ids, patch)
    patchNotifications(filteredNotifications.value, ids, patch)
    ElMessage.success(`已将 ${ids.length} 条消息标为已读`)
  }

  /** 取消归档 */
  async function unarchiveNotification(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target) return

    if (!isLocalNotification(id)) {
      try {
        await apiUnarchive(id)
      } catch {
        return
      }
    }
    syncOne(id, { isArchived: 0, archivedAt: null })
  }

  async function deleteNotification(id: string): Promise<void> {
    try {
      await apiDelete(id)
    } catch {
      return
    }
    notifications.value = notifications.value.filter((n) => n.id !== id)
    filteredNotifications.value = filteredNotifications.value.filter((n) => n.id !== id)
    ElMessage.success('已删除')
  }

  return {
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    archiveNotification,
    archiveNotifications,
    unarchiveNotification,
    deleteNotification,
  }
}
