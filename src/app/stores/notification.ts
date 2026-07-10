import type { Notification, NotificationFilters } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  deleteNotification as apiDelete,
  markAllAsRead as apiMarkAll,
  markAsRead as apiMarkOne,
  getNotifications,
} from '@/shared/api/notification'

/**
 * 消息通知 Store
 * 数据来源：notificationApi（后端就绪后只需改 API 层）
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const filteredNotifications = ref<Notification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)

  async function fetchNotifications(filters?: NotificationFilters): Promise<void> {
    loading.value = true
    try {
      // 全量数据（用于未读计数/消息总数），首次加载后缓存
      if (notifications.value.length === 0) {
        notifications.value = await getNotifications()
      }
      // 筛选数据
      filteredNotifications.value = filters ? await getNotifications(filters) : notifications.value
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.isRead) return

    await apiMarkOne(id)
    target.isRead = true
    target.status = 'read'
    // 同步筛选列表中的对应项（筛选后可能是不同对象引用）
    const filtered = filteredNotifications.value.find((n) => n.id === id)
    if (filtered && filtered !== target) {
      filtered.isRead = true
      filtered.status = 'read'
    }
    ElMessage.success('已标为已读')
  }

  async function markAllAsRead(): Promise<void> {
    await apiMarkAll()
    notifications.value.forEach((n) => {
      n.isRead = true
      n.status = 'read'
    })
    filteredNotifications.value.forEach((n) => {
      n.isRead = true
      n.status = 'read'
    })
    ElMessage.success('全部已读')
  }

  async function deleteNotification(id: string): Promise<void> {
    await apiDelete(id)
    notifications.value = notifications.value.filter((n) => n.id !== id)
    filteredNotifications.value = filteredNotifications.value.filter((n) => n.id !== id)
    ElMessage.success('通知已删除')
  }

  return {
    notifications,
    filteredNotifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
})
