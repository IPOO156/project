// @vitest-environment jsdom
import type { Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, effectScope, h, nextTick, ref } from 'vue'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useFirstLoadStagger', () => {
  it('首次拿到非空数据时激活，定时结束后自动回收', async () => {
    const scope = effectScope()
    const count = ref(0)
    let active!: Ref<boolean>
    scope.run(() => {
      active = useFirstLoadStagger(count, 100)
    })

    expect(active.value).toBe(false)

    count.value = 2
    await nextTick()
    expect(active.value).toBe(true)

    vi.advanceTimersByTime(99)
    expect(active.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(active.value).toBe(false)
    scope.stop()
  })

  it('初始数据非空时立即激活', async () => {
    const scope = effectScope()
    const count = ref(3)
    let active!: Ref<boolean>
    scope.run(() => {
      active = useFirstLoadStagger(count, 100)
    })
    await nextTick()

    expect(active.value).toBe(true)
    scope.stop()
  })

  it('只播一次：筛选、翻页、增删行都不会重播', async () => {
    const scope = effectScope()
    const count = ref(1)
    let active!: Ref<boolean>
    scope.run(() => {
      active = useFirstLoadStagger(count, 100)
    })
    await nextTick()
    expect(active.value).toBe(true)

    vi.advanceTimersByTime(100)
    expect(active.value).toBe(false)

    count.value = 0
    await nextTick()
    count.value = 5
    await nextTick()
    expect(active.value).toBe(false)
    scope.stop()
  })

  it('空列表不激活，不会把 0 条数据当作首屏内容', async () => {
    const scope = effectScope()
    const count = ref(0)
    let active!: Ref<boolean>
    scope.run(() => {
      active = useFirstLoadStagger(count, 100)
    })

    count.value = 0
    await nextTick()
    expect(active.value).toBe(false)
    scope.stop()
  })

  it('卸载时提前结束动画类，不必等定时器', async () => {
    const count = ref(0)
    let active!: Ref<boolean>
    const container = document.createElement('div')
    const app = createApp({
      setup() {
        active = useFirstLoadStagger(() => count.value, 5000)
        return () => h('div')
      },
    })
    app.mount(container)

    count.value = 1
    await nextTick()
    expect(active.value).toBe(true)

    app.unmount()
    expect(active.value).toBe(false)
  })
})
