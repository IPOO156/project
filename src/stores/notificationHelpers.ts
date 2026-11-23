import type { Notification } from '@/shared/types/types'

/**
 * 消息通知的纯逻辑辅助（无状态、可直接单测）。
 * 从 useNotificationStore 抽出，避免单个 Store 文件超 200 行。
 */

/** 本地即时通知 id（addNotification 注入，格式 notif-<时间戳>）：无后端记录，读/归档等操作仅改本地状态，不请求接口，避免 400 */
export function isLocalNotification(id: string): boolean {
  return id.startsWith('notif-')
}

/** 按 id 去重合并多批消息（归档/未归档两态），按 createdAt 倒序 */
export function mergeNotifications(...lists: Notification[][]): Notification[] {
  const byId = new Map<string, Notification>()
  for (const list of lists) {
    for (const n of list) {
      if (!byId.has(n.id)) byId.set(n.id, n)
    }
  }
  return [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/** 对列表中命中 ids 的条目批量打补丁（归档/已读状态同步） */
export function patchNotifications(
  list: Notification[],
  ids: string[],
  patch: Partial<Notification>,
): void {
  const idSet = new Set(ids)
  list.forEach((n) => {
    if (idSet.has(n.id)) Object.assign(n, patch)
  })
}
