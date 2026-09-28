import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { ACCOUNTS, collectPageErrors, login } from './helpers/login'

/**
 * 档案概览「多维度画像」卡片。
 *
 * 关注两件事：分值文案是否带满分（否则学生分不清 20/50 与 20/100）、
 * 进度条是否按「得分率」而非原始分绘制（各维度满分 50/30/20 不同，用原始分维度间不可比）。
 *
 * 用例分两类：
 * - 真实链路（不打桩）：断言与后端取值无关的结构不变量；
 * - 打桩用例（`stubDimensionProfile`）：就地改写 `/profile/info` 的 `dimensionProfile`。
 *   `dimensionProfile` 依赖「是否已触发评分重算」，联调后端随时可能为空（返回 `[]`），
 *   而这两条断言的对象是前端的映射与空态逻辑、不是后端数据，故打桩以保证确定性。
 *   打桩只改响应体，不写入任何后端数据。
 */

/** 打桩用的维度画像条目（字段名与 /profile/info 的 dimensionProfile 保持一致） */
interface StubDimension {
  dimensionName: string
  score: number
  targetScore: number
}

/**
 * 整个 describe 共用一次登录（与 student.spec.ts 的冒烟用例同因）：
 * 联调后端走 natapp 免费隧道，有连接数限流，重复登录易触发空 body 500。
 */
test.describe('档案概览 · 多维度画像卡片', () => {
  // 刻意不开 serial：配置里 fullyParallel 已是 false，同一文件内的用例本就在同一 worker
  // 按声明顺序串行执行，共享 page 不需要 serial；而 serial 会在首个用例失败后跳过其余用例，
  // 下面 3 个打桩用例与后端数据无关、恒可执行，被跳过会丢掉最有价值的诊断信息。
  let page: Page
  let pageErrors: string[]

  /**
   * 打桩值。`null` 表示放行后端真实响应。
   *
   * 路由只在 beforeAll 注册一次、由该变量驱动，而不是每个用例 page.route / unroute。
   * 后者会让「用例结束时撤销路由」与仍在处理中的 /profile/info 请求竞争，
   * 抛 `route.fulfill: Route is already handled!`，请求永远拿不到响应，卡片就不渲染。
   */
  let stubProfile: StubDimension[] | null = null

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    pageErrors = collectPageErrors(page)

    await page.route('**/api/v1/profile/info', async (route) => {
      const res = await route.fetch()
      const json = await res.json()
      if (stubProfile !== null && json?.data) json.data.dimensionProfile = stubProfile
      await route.fulfill({ response: res, json })
    })

    await login(page, 'student', ACCOUNTS.student)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.afterEach(() => {
    stubProfile = null
  })

  /** 打开档案概览并返回「多维度画像」卡片 */
  async function gotoDimensionCard() {
    await page.goto('/profile/info')
    const card = page.locator('.dimension-panel')
    await expect(card).toBeVisible({ timeout: 20000 })
    return card
  }

  test('真实数据：每行同时展示得分与满分，进度条等于得分率', async () => {
    const card = await gotoDimensionCard()
    const items = card.locator('.dimension-item')

    // 依赖「该学生已有评分计算结果」。若此断言失败，先确认联调后端是否被重置、
    // 需由管理员在「评分重算」页触发一次计算，而非前端缺陷。
    await expect(
      items.first(),
      '未渲染任何维度，请确认联调后端存在该学生的评分计算结果',
    ).toBeVisible({ timeout: 20000 })

    const count = await items.count()
    for (let i = 0; i < count; i++) {
      const item = items.nth(i)
      const text = (await item.locator('.dimension-item__score').textContent())?.trim() ?? ''
      const matched = text.match(/^(\d+) \/ (\d+) 分$/)
      if (!matched) {
        throw new Error(`第 ${i + 1} 行分值文案应形如「20 / 50 分」，实际为「${text}」`)
      }

      const score = Number(matched[1])
      const maxScore = Number(matched[2])
      expect(maxScore, `第 ${i + 1} 行满分应大于 0`).toBeGreaterThan(0)

      // 进度条口径 = 得分率（而非原始分）
      await expect(item.locator('.el-progress')).toHaveAttribute(
        'aria-valuenow',
        String(Math.min(100, Math.round((score / maxScore) * 100))),
      )
    }

    expect(pageErrors, '/profile/info 出现未捕获异常').toEqual([])
  })

  test('打桩：相同的原始分在满分不同的维度上画出不同的进度条', async () => {
    // 20/50 与 20/100 原始分相同：按旧口径（原始分当百分比）两条都是 20%
    stubProfile = [
      { dimensionName: '甲维度', score: 20, targetScore: 50 },
      { dimensionName: '乙维度', score: 20, targetScore: 100 },
    ]

    const card = await gotoDimensionCard()
    const items = card.locator('.dimension-item')
    await expect(items).toHaveCount(2)

    await expect(items.nth(0).locator('.dimension-item__score')).toHaveText('20 / 50 分')
    await expect(items.nth(1).locator('.dimension-item__score')).toHaveText('20 / 100 分')

    await expect(items.nth(0).locator('.el-progress')).toHaveAttribute('aria-valuenow', '40')
    await expect(items.nth(1).locator('.el-progress')).toHaveAttribute('aria-valuenow', '20')
  })

  test('打桩：无计算结果时展示空态，且不再显示「综合评分 0分」', async () => {
    stubProfile = []

    const card = await gotoDimensionCard()

    await expect(card.locator('.el-empty')).toBeVisible()
    await expect(card).toContainText('暂无画像评分数据')
    await expect(card.locator('.el-progress'), '空数据时不应渲染进度条').toHaveCount(0)
    await expect(card, '空数据时不应显示「综合评分 x分」').not.toContainText(/综合评分 \d+分/)
    await expect(card.locator('.card-header__tag')).toHaveText('暂无评分')

    // 顶部统计区的「综合评分」同步显占位符，避免被读成「本次得分就是 0 分」
    await expect(page.locator('.stat-card', { hasText: '综合评分' })).toContainText('--')
  })

  test('打桩：后端未返回满分时退化为只显示得分，不产生除零', async () => {
    stubProfile = [{ dimensionName: '丙维度', score: 30, targetScore: 0 }]

    const card = await gotoDimensionCard()
    const item = card.locator('.dimension-item').first()

    await expect(item.locator('.dimension-item__score')).toHaveText('30 分')
    await expect(item.locator('.el-progress')).toHaveAttribute('aria-valuenow', '0')
    expect(pageErrors, '满分缺失时出现未捕获异常').toEqual([])
  })
})
