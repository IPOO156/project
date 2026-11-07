import { describe, expect, it } from 'vitest'

describe('echarts-setup', () => {
  it('按需注册图表与组件不抛错（副作用模块）', async () => {
    const mod = await import('@/shared/utils/echarts-setup')
    expect(mod).toBeTypeOf('object')
  }, 30000)
})
