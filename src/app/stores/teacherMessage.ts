import type { MessageCategory, MessageItem } from '@/shared/types/teacher'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  archiveTeacherMessage,
  getTeacherMessages,
  markTeacherMessageRead,
} from '@/shared/api/teacher'

/**
 * 教师端消息中心 Store
 * 数据源：/teacher/messages（GET 列表 / PUT 已读 / PUT 归档）。
 * 与 HeaderBar 铃铛共用：接口返回的 unread 为该登录教师「未归档中未读」总数，
 * 不随分页变化，可直接作为角标数字。学生端消息仍走 useNotificationStore，两者互不干扰。
 */
export interface TeacherMessageListParams {
  page?: number
  perPage?: number
  category?: MessageCategory | 'all'
  isRead?: number
  isArchived?: number
  keyword?: string
}

export const useTeacherMessageStore = defineStore('teacherMessage', () => {
  const list = ref<MessageItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const loadError = ref(false)
  // 当前分页视图内的未读数（仅本地展示用，HeaderBar 角标请用 unreadCount）
  const pageUnread = ref(0)
  // 铃铛角标总数（后端返回，不受当前分页影响）
  const unreadCount = ref(0)

  function patchLocal(messageId: number, patch: Partial<MessageItem>) {
    const target = list.value.find((m) => m.id === messageId)
    if (target) {
      Object.assign(target, patch)
    }
  }

  /** 拉取某一视图下的消息列表（收件箱/已归档/分类/搜索） */
  async function fetchList(params: TeacherMessageListParams = {}): Promise<void> {
    loading.value = true
    loadError.value = false
    try {
      const category = params.category && params.category !== 'all' ? params.category : undefined
      const res = await getTeacherMessages({
        category,
        isRead: params.isRead,
        isArchived: params.isArchived,
        keyword: params.keyword || undefined,
        page: params.page ?? 1,
        per_page: params.perPage ?? 20,
      })
      list.value = res.list ?? []
      total.value = res.total ?? 0
      pageUnread.value = res.list?.filter((m) => m.isRead !== 1).length ?? 0
      // 仅在全部分类 + 收件箱视图下用接口返回的 unread 覆盖铃铛角标；
      // 已归档视图或选定某分类时接口 unread 是「该范围内」数值，不得覆盖全局角标
      const isGlobalView = !params.isArchived && (!params.category || params.category === 'all')
      if (isGlobalView) {
        unreadCount.value = res.unread ?? 0
      }
    } catch {
      list.value = []
      total.value = 0
      loadError.value = true
    } finally {
      loading.value = false
    }
  }

  /** 仅刷新铃铛角标（不重建列表，HeaderBar 进入教师端时调用） */
  async function refreshUnread(): Promise<void> {
    try {
      const res = await getTeacherMessages({ page: 1, per_page: 1 })
      unreadCount.value = res.unread ?? 0
    } catch {
      // 角标拉取失败不打扰用户，保持原值
    }
  }

  /** 标记已读（乐观更新） */
  async function markRead(messageId: number): Promise<boolean> {
    const target = list.value.find((m) => m.id === messageId)
    if (!target || target.isRead === 1) {
      return true
    }
    try {
      await markTeacherMessageRead(messageId)
      patchLocal(messageId, { isRead: 1, readAt: new Date().toISOString() })
      // 铃铛角标只统计「未归档中未读」：已归档视图里点已读不影响角标
      if (target.isArchived !== 1 && unreadCount.value > 0) {
        unreadCount.value -= 1
      }
      return true
    } catch {
      return false
    }
  }

  /** 归档（从当前视图移除；重要消息的二次确认由页面处理） */
  async function archive(messageId: number): Promise<boolean> {
    const target = list.value.find((m) => m.id === messageId)
    if (!target) {
      return true
    }
    try {
      const res = await archiveTeacherMessage(messageId)
      list.value = list.value.filter((m) => m.id !== messageId)
      total.value = Math.max(total.value - 1, 0)
      if (target.isRead !== 1 && res.isArchived === 1) {
        unreadCount.value = Math.max(unreadCount.value - 1, 0)
      }
      return true
    } catch {
      return false
    }
  }

  function reset(): void {
    list.value = []
    total.value = 0
    pageUnread.value = 0
    unreadCount.value = 0
    loading.value = false
    loadError.value = false
  }

  return {
    list,
    total,
    loading,
    loadError,
    pageUnread,
    unreadCount,
    fetchList,
    refreshUnread,
    markRead,
    archive,
    reset,
  }
})
