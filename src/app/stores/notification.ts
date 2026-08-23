import type { Notification, NotificationFilters } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  archiveMessage as apiArchive,
  deleteNotification as apiDelete,
  markAllAsRead as apiMarkAll,
  markAsRead as apiMarkOne,
  unarchiveMessage as apiUnarchive,
  getNotifications,
} from '@/shared/api/notification'

/**
 * 消息通知 Store
 * 字段与后端 user_messages 表一致（isRead/isArchived 为 0/1，jumpUrl 为跳转链接）
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const filteredNotifications = ref<Notification[]>([])
  const loading = ref(false)

  const unreadCount = computed(
    () => notifications.value.filter((n) => n.isRead !== 1 && n.isArchived !== 1).length,
  )
  const archivedCount = computed(() => notifications.value.filter((n) => n.isArchived === 1).length)

  async function fetchNotifications(filters?: NotificationFilters): Promise<void> {
    loading.value = true
    try {
      if (notifications.value.length === 0) notifications.value = await getNotifications()
      filteredNotifications.value = filters ? await getNotifications(filters) : notifications.value
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.isRead === 1) return

    await apiMarkOne(id)
    target.isRead = 1
    target.readAt = new Date().toISOString()
    const filtered = filteredNotifications.value.find((n) => n.id === id)
    if (filtered && filtered !== target) {
      filtered.isRead = 1
      filtered.readAt = target.readAt
    }
  }

  async function markAllAsRead(): Promise<void> {
    const unreadItems = notifications.value.filter((n) => n.isRead !== 1 && n.isArchived !== 1)
    if (unreadItems.length === 0) return

    await apiMarkAll()
    const now = new Date().toISOString()
    notifications.value.forEach((n) => {
      if (n.isArchived !== 1) {
        n.isRead = 1
        n.readAt = now
      }
    })
    filteredNotifications.value.forEach((n) => {
      if (n.isArchived !== 1) {
        n.isRead = 1
        n.readAt = now
      }
    })
    ElMessage.success(`已将 ${unreadItems.length} 条消息标为已读`)
  }

  /** 归档消息（isImportant=1 的重要消息需二次确认） */
  async function archiveNotification(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target) return

    await apiArchive(id)
    target.isArchived = 1
    target.archivedAt = new Date().toISOString()
    const filtered = filteredNotifications.value.find((n) => n.id === id)
    if (filtered && filtered !== target) {
      filtered.isArchived = 1
      filtered.archivedAt = target.archivedAt
    }
    ElMessage.success('已归档')
  }

  /** 取消归档 */
  async function unarchiveNotification(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target) return

    await apiUnarchive(id)
    target.isArchived = 0
    target.archivedAt = null
    const filtered = filteredNotifications.value.find((n) => n.id === id)
    if (filtered && filtered !== target) {
      filtered.isArchived = 0
      filtered.archivedAt = null
    }
  }

  async function deleteNotification(id: string): Promise<void> {
    await apiDelete(id)
    notifications.value = notifications.value.filter((n) => n.id !== id)
    filteredNotifications.value = filteredNotifications.value.filter((n) => n.id !== id)
    ElMessage.success('已删除')
  }

  const processedIds = ref<Set<string>>(new Set())

  function addNotification(notification: {
    title: string
    content: string
    category: Notification['category']
    jumpUrl?: string
    isImportant?: number
  }) {
    const dedupKey = `${notification.category}|${notification.title}`
    if (processedIds.value.has(dedupKey)) return
    processedIds.value.add(dedupKey)

    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      category: notification.category,
      categoryLabel: notification.category,
      title: notification.title,
      content: notification.content,
      isRead: 0,
      isArchived: 0,
      isImportant: notification.isImportant ?? 0,
      jumpUrl: notification.jumpUrl,
      createdAt: new Date().toISOString(),
      isReadFlag: false,
    }
    notifications.value.unshift(newNotification)
    filteredNotifications.value.unshift(newNotification)
  }

  return {
    notifications,
    filteredNotifications,
    loading,
    unreadCount,
    archivedCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    addNotification,
  }
})
