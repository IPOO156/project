import type { Notification, NotificationFilters } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 消息通知 Store
 * 集中管理消息中心通知数据，支持分类/状态筛选、已读管理、删除。
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const filteredNotifications = ref<Notification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)

  function generateMockData(): Notification[] {
    return (
      [
        {
          id: '1',
          title: '奖学金申报已通过',
          content: '您的国家奖学金申请已通过审核，请查看详情。',
          category: 'approval',
          status: 'unread',
          isRead: false,
          createdAt: '2026-07-04 09:30',
          link: '/approval/pending',
        },
        {
          id: '2',
          title: '系统维护通知',
          content: '系统将于本周日凌晨 02:00-04:00 进行例行维护。',
          category: 'system',
          status: 'unread',
          isRead: false,
          createdAt: '2026-07-03 18:00',
        },
        {
          id: '3',
          title: '学科竞赛申报提醒',
          content: '数学建模竞赛报名即将截止，请及时提交材料。',
          category: 'activity',
          status: 'read',
          isRead: true,
          createdAt: '2026-07-02 14:20',
          link: '/applications?tab=competition',
        },
        {
          id: '4',
          title: '导师私信',
          content: '请尽快完善个人档案中的科研经历部分。',
          category: 'message',
          status: 'unread',
          isRead: false,
          createdAt: '2026-07-01 11:15',
          sender: '张老师',
        },
        {
          id: '5',
          title: '社会实践材料被驳回',
          content: '驳回原因：缺少活动照片佐证材料，请补充后重新提交。',
          category: 'approval',
          status: 'read',
          isRead: true,
          createdAt: '2026-06-28 16:45',
          link: '/applications?tab=social-practice',
        },
        {
          id: '6',
          title: '新功能上线',
          content: '消息中心已上线，支持通知分类与已读管理。',
          category: 'system',
          status: 'read',
          isRead: true,
          createdAt: '2026-06-25 10:00',
        },
        {
          id: '7',
          title: '竞赛之星报名开始',
          content: '本年度竞赛之星评选已启动，欢迎符合条件的学生报名。',
          category: 'activity',
          status: 'unread',
          isRead: false,
          createdAt: '2026-06-22 09:00',
          link: '/awards/competition-star',
        },
        {
          id: '8',
          title: '审批进度提醒',
          content: '您的实习经历申报已进入辅导员审批阶段。',
          category: 'approval',
          status: 'unread',
          isRead: false,
          createdAt: '2026-06-20 13:30',
        },
      ] as Notification[]
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function applyFilters(filters?: NotificationFilters) {
    let result = [...notifications.value]
    if (filters) {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        result = result.filter(
          (n) => n.title.toLowerCase().includes(kw) || n.content.toLowerCase().includes(kw),
        )
      }
      if (filters.category) {
        result = result.filter((n) => n.category === filters.category)
      }
      if (filters.status) {
        result = result.filter((n) => n.status === filters.status)
      }
    }
    filteredNotifications.value = result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function fetchNotifications(filters?: NotificationFilters): Promise<void> {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        if (notifications.value.length === 0) {
          notifications.value = generateMockData()
        }
        applyFilters(filters)
        loading.value = false
        resolve()
      }, 300)
    })
  }

  function markAsRead(id: string) {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.isRead) return

    target.isRead = true
    target.status = 'read'
    applyFilters()
    ElMessage.success('已标为已读')
  }

  function markAllAsRead() {
    notifications.value.forEach((n) => {
      n.isRead = true
      n.status = 'read'
    })
    applyFilters()
    ElMessage.success('全部已读')
  }

  function deleteNotification(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
    applyFilters()
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
