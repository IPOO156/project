// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { initTabsRouter, MAX_TABS, useTabsStore } from '@/app/stores/useTabsStore'

function tab(path: string, affix = false, closable = !affix) {
  return { path, title: path, closable, affix }
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('useTabsStore', () => {
  it('重复添加同一路径不新增', () => {
    const store = useTabsStore()
    expect(store.addTab(tab('/a'))).toEqual({ ok: true })
    expect(store.addTab(tab('/a'))).toEqual({ ok: true })
    expect(store.visitedTabs).toHaveLength(1)
    expect(store.hasTabs).toBe(true)
  })

  it('达到上限时淘汰最早的可关闭标签', () => {
    const store = useTabsStore()
    store.addTab(tab('/fixed', true))
    for (let i = 0; i < MAX_TABS - 1; i++) store.addTab(tab(`/p${i}`))

    const result = store.addTab(tab('/new'))

    expect(result.ok).toBe(true)
    expect(result.evicted?.path).toBe('/p0')
    expect(store.visitedTabs).toHaveLength(MAX_TABS)
    expect(store.visitedTabs.some((t) => t.path === '/fixed')).toBe(true)
  })

  it('全部为固定标签时拒绝新增', () => {
    const store = useTabsStore()
    for (let i = 0; i < MAX_TABS; i++) store.addTab(tab(`/f${i}`, true))

    expect(store.addTab(tab('/new'))).toEqual({ ok: false })
    expect(store.visitedTabs).toHaveLength(MAX_TABS)
  })

  it('removeTab 返回相邻标签，不可关闭或不存在时返回空串', () => {
    const store = useTabsStore()
    store.addTab(tab('/fixed', true))
    store.addTab(tab('/a'))
    store.addTab(tab('/b'))

    expect(store.removeTab('/b')).toBe('/a')
    expect(store.removeTab('/fixed')).toBe('')
    expect(store.removeTab('/missing')).toBe('')
  })

  it('关闭其他 / 关闭全部只保留固定标签', () => {
    const store = useTabsStore()
    store.addTab(tab('/fixed', true))
    store.addTab(tab('/a'))
    store.addTab(tab('/b'))

    store.removeOtherTabs('/a')
    expect(store.visitedTabs.map((t) => t.path)).toEqual(['/fixed', '/a'])

    store.addTab(tab('/c'))
    expect(store.removeAllTabs()).toBe('/fixed')
    expect(store.visitedTabs.map((t) => t.path)).toEqual(['/fixed'])
  })

  it('activePath 与拖拽排序', () => {
    const store = useTabsStore()
    store.addTab(tab('/a'))
    store.addTab(tab('/b'))

    store.setActive('/b')
    expect(store.activePath).toBe('/b')

    const reversed = [...store.visitedTabs].reverse()
    store.reorderTabs(reversed)
    expect(store.visitedTabs.map((t) => t.path)).toEqual(['/b', '/a'])
  })

  it('变更后同步写入 sessionStorage', async () => {
    const store = useTabsStore()
    store.addTab(tab('/a'))
    await nextTick()

    const raw = sessionStorage.getItem('app:visited-tabs')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)).toHaveLength(1)
  })

  it('clearAll 清空列表与激活路径', () => {
    const store = useTabsStore()
    store.addTab(tab('/a'))
    store.setActive('/a')

    store.clearAll()

    expect(store.visitedTabs).toEqual([])
    expect(store.activePath).toBe('')
    expect(store.hasTabs).toBe(false)
  })

  it('initTabsRouter 注入后可反查 affix 覆盖脏数据', () => {
    // 存储里的 affix 与路由 meta 不一致时，以路由为准
    sessionStorage.setItem(
      'app:visited-tabs',
      JSON.stringify([{ path: '/real-affix', title: 'x', closable: true, affix: false }]),
    )
    initTabsRouter({
      // components 非空：否则会被当成 redirect 死标签丢弃
      resolve: () => ({ matched: [{ components: {}, meta: { affix: true } }] }),
    } as never)

    const store = useTabsStore()
    expect(store.visitedTabs[0]).toMatchObject({ affix: true, closable: false })
  })
})
