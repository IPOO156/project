import type { Notification, NotificationFilters } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getNotifications } from '@/shared/api/notification'
import { mergeNotifications } from './notificationHelpers'
import { createNotificationMutations } from './notificationMutations'

/**
 * 消息通知 Store
 * 字段与后端 user_messages 表一致（isRead/isArchived 为 0/1，jumpUrl 为跳转链接）
 * 读写分离：纯逻辑见 ./notificationHelpers.ts，写操作见 ./notificationMutations.ts
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const filteredNotifications = ref<Notification[]>([])
  const loading = ref(false)
  // 接口拉取失败标志：区分「后端确实无消息」与「请求失败」，避免误导用户以为消息丢失
  const loadError = ref(false)

  const unreadCount = computed(
    () => notifications.value.filter((n) => n.isRead !== 1 && n.isArchived !== 1).length,
  )
  const archivedCount = computed(() => notifications.value.filter((n) => n.isArchived === 1).length)

  /**
   * 请求归档(isArchived=1)与未归档(isArchived=0)两态后合并。
   * 后端 GET /messages 不传 isArchived 时默认只返回未归档，若单次拉取会导致
   * 「已归档」标签页永远为空、已归档消息刷新即消失。
   * allSettled：仅当两侧全部失败才判定加载失败，单侧抖动仍保留已成功侧数据。
   */
  async function fetchMerged(filters?: NotificationFilters): Promise<Notification[]> {
    const results = await Promise.allSettled([
      getNotifications(filters),
      getNotifications({ ...filters, archived: true }),
    ])
    const resolved = results
      .filter((r): r is PromiseFulfilledResult<Notification[]> => r.status === 'fulfilled')
      .map((r) => r.value)
    if (resolved.length === 0) {
      loadError.value = true
      return []
    }
    return mergeNotifications(...resolved)
  }

  let pendingFetch: Promise<void> | null = null
  let lastFullFetchAt = 0
  const CACHE_TTL_MS = 60_000

  async function fetchNotifications(filters?: NotificationFilters, force = false): Promise<void> {
    if (pendingFetch) return pendingFetch
    const isFiltered = !!filters
    if (
      !force &&
      !isFiltered &&
      Date.now() - lastFullFetchAt < CACHE_TTL_MS &&
      notifications.value.length > 0
    ) {
      filteredNotifications.value = notifications.value
      return
    }
    loading.value = true
    loadError.value = false
    pendingFetch = (async () => {
      try {
        if (!isFiltered && notifications.value.length === 0) {
          notifications.value = await fetchMerged()
          lastFullFetchAt = Date.now()
        }
        filteredNotifications.value = filters ? await fetchMerged(filters) : notifications.value
      } finally {
        loading.value = false
      }
    })()
    try {
      await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  const {
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    archiveNotification,
    archiveNotifications,
    unarchiveNotification,
    deleteNotification,
  } = createNotificationMutations({ notifications, filteredNotifications })

  const processedIds = ref<Set<string>>(new Set())

  /** 注入本地即时通知（无后端记录，读/归档只改本地状态） */
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

  /**
   * 重置用户级状态（登出/换账号时调用）。
   * 除清空 state 外，复位模块级请求缓存变量（pendingFetch / lastFullFetchAt）：
   * 否则换账号后 60s TTL 内仍会把上一账号的消息列表当缓存命中。
   */
  function reset(): void {
    pendingFetch = null
    lastFullFetchAt = 0
    notifications.value = []
    filteredNotifications.value = []
    loading.value = false
    loadError.value = false
    processedIds.value = new Set()
  }

  return {
    notifications,
    filteredNotifications,
    loading,
    loadError,
    unreadCount,
    archivedCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    archiveNotification,
    archiveNotifications,
    unarchiveNotification,
    deleteNotification,
    addNotification,
    reset,
  }
})
