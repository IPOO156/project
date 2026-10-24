import type { Notification } from '@/shared/types/types'
import { describe, expect, it } from 'vitest'
import {
  isLocalNotification,
  mergeNotifications,
  patchNotifications,
} from '@/app/stores/notificationHelpers'

function makeNotification(overrides: Partial<Notification> & { id: string }): Notification {
  return {
    category: 'system',
    categoryLabel: '系统',
    title: overrides.id,
    content: '',
    isRead: 0,
    isArchived: 0,
    isImportant: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    isReadFlag: false,
    ...overrides,
  } as Notification
}

describe('isLocalNotification', () => {
  it('识别本地即时通知（notif- 前缀）', () => {
    expect(isLocalNotification('notif-1700000000000')).toBe(true)
  })

  it('后端消息视为非本地', () => {
    expect(isLocalNotification('1024')).toBe(false)
    expect(isLocalNotification('msg-1')).toBe(false)
  })
})

describe('mergeNotifications', () => {
  it('按 id 去重且保留首次出现的记录', () => {
    const first = makeNotification({ id: '1', title: '第一次' })
    const duplicate = makeNotification({ id: '1', title: '第二次' })
    const merged = mergeNotifications([first], [duplicate])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.title).toBe('第一次')
  })

  it('按 createdAt 倒序排列', () => {
    const older = makeNotification({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' })
    const newer = makeNotification({ id: 'new', createdAt: '2026-02-01T00:00:00.000Z' })
    expect(mergeNotifications([older], [newer]).map((n) => n.id)).toEqual(['new', 'old'])
  })

  it('多批合并后不丢数据', () => {
    const merged = mergeNotifications(
      [makeNotification({ id: 'a' })],
      [makeNotification({ id: 'b' })],
      [makeNotification({ id: 'c' })],
    )
    expect(merged).toHaveLength(3)
  })
})

describe('patchNotifications', () => {
  it('只修改命中 id 的条目（原对象就地更新）', () => {
    const list = [makeNotification({ id: '1' }), makeNotification({ id: '2' })]
    patchNotifications(list, ['1'], { isRead: 1 })
    expect(list[0]!.isRead).toBe(1)
    expect(list[1]!.isRead).toBe(0)
  })

  it('空 ids 不产生任何修改', () => {
    const list = [makeNotification({ id: '1' })]
    patchNotifications(list, [], { isArchived: 1 })
    expect(list[0]!.isArchived).toBe(0)
  })
})
