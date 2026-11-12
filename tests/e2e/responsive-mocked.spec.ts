import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * 响应式回归（全接口 mock，不需要后端隧道）。
 *
 * 覆盖两块此前只在临时脚本里验过的行为，避免以后改样式/组件时悄悄回归：
 * 1. 成长年轮在 1440 / 390 / 320 三档的渲染尺寸与外圈完整性（p11 / p25）；
 * 2. 390 窄屏下日期范围选择器（DateRangePicker）的面板不溢出、触控高度、
 *    起止日期先后约束、清空联动与外部重置同步（p24 / p25）。
 *
 * 与 student-mocked.spec.ts 一致：用 addInitScript 预置登录态，page.route 接管
 * /api/v1/**，断言只依赖本地 mock 数据。
 */

const wrap = (data: unknown) => ({ code: 0, message: 'ok', data })

const STUDENT = {
  userId: 1,
  userNo: '202401002',
  studentNo: '202401002',
  name: '测试学生',
  grade: '2024级',
  email: '',
  phone: null,
  roles: ['student'],
  roleNames: ['学生'],
  permissions: [],
  scopes: [],
  avatar: null,
}

/** 8 个学期各一条，保证年轮每圈都有小球，便于同时验证“小球仍贴合圆周” */
const SEMESTERS = [
  '2024-2025-1',
  '2024-2025-2',
  '2025-2026-1',
  '2025-2026-2',
  '2026-2027-1',
  '2026-2027-2',
  '2027-2028-1',
  '2027-2028-2',
]

const MOCK_TIMELINE = SEMESTERS.map((semesterName, index) => ({
  id: 8000 + index,
  eventName: `E2E 成长记录 ${index + 1}`,
  content: `第 ${index + 1} 条`,
  eventAt: `${2024 + Math.floor(index / 2)}-${index % 2 === 0 ? '10' : '04'}-15`,
  eventType: 3,
  semesterName,
  tags: ['实践'],
  abilityData: [],
}))

async function presetStudent(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('token', 'mock-access-token')
    localStorage.setItem(
      'user_info_cache',
      JSON.stringify({
        id: String(user.userId),
        username: user.userNo,
        realName: user.name,
        studentId: user.studentNo,
        grade: user.grade,
        loginType: 'student',
        roles: user.roles,
        permissions: user.permissions,
        scopes: user.scopes,
      }),
    )
  }, STUDENT)
}

async function mockStudentApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '')
    if (path === '/auth/me') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(wrap(STUDENT)),
      })
    }
    if (path === '/profile/growth-timeline') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(wrap({ summary: {}, timeline: MOCK_TIMELINE, tree: [], ring: [] })),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(wrap({ list: [], total: 0 })),
    })
  })
}

const RING_CASES = [
  { width: 1440, height: 900, scale: 1.75, size: 700 },
  { width: 390, height: 844, scale: 0.9, size: 360 },
  { width: 320, height: 720, scale: 0.75, size: 300 },
] as const

test.describe('成长年轮响应式（mock）', () => {
  test.use({ actionTimeout: 20000 })

  for (const ringCase of RING_CASES) {
    test(`${ringCase.width}px：年轮尺寸与外圈完整`, async ({ page }) => {
      await page.setViewportSize({ width: ringCase.width, height: ringCase.height })
      await mockStudentApi(page)
      await presetStudent(page)
      await page.goto('/growth-timeline')

      // 小屏默认列表视图，切回年轮视图再断言
      if ((await page.locator('.hero-rings').count()) === 0) {
        await page.locator('.view-switcher__btn', { hasText: '年轮' }).click()
      }
      await expect(page.locator('.hero-rings__ring-wrap')).toHaveCount(8)

      const metrics = await page.evaluate(() => {
        const hero = document.querySelector('.hero-rings') as HTMLElement
        const svg = document.querySelector('.hero-rings__svg') as SVGElement
        const rings = Array.from(document.querySelectorAll('.hero-rings__ring'))
        const outer = rings[rings.length - 1].getBoundingClientRect()
        const heroRect = hero.getBoundingClientRect()
        const svgRect = svg.getBoundingClientRect()
        const style = getComputedStyle(hero)
        return {
          scale: Number.parseFloat(style.getPropertyValue('--hero-scale')),
          size: Number.parseFloat(style.getPropertyValue('--hero-svg-size')),
          svgWidth: svgRect.width,
          svgHeight: svgRect.height,
          heroLeft: heroRect.left,
          heroRight: heroRect.right,
          outerLeft: outer.left,
          outerRight: outer.right,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }
      })

      expect(metrics.scale).toBeCloseTo(ringCase.scale, 2)
      expect(metrics.size).toBeCloseTo(ringCase.size, 0)
      expect(metrics.svgWidth).toBeCloseTo(ringCase.size, 0)
      expect(metrics.svgHeight).toBeCloseTo(ringCase.size, 0)

      // 最外圈完整落在 hero 内，不被 overflow 裁掉
      expect(metrics.outerLeft).toBeGreaterThanOrEqual(metrics.heroLeft - 1)
      expect(metrics.outerRight).toBeLessThanOrEqual(metrics.heroRight + 1)

      // 年轮收紧后不应产生横向滚动
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
    })
  }
})

/**
 * 年轮滚动视差回归（p27）。
 *
 * 不变量：环、小球、中心按钮同处 .hero-rings__system 一个变换矩阵，
 * 小球中心到环心的距离必须恒等于「圈半径 × --hero-scale × --ring-zoom」。
 * 曾经的实现把 scale 只加在圆环组上，小球不跟随，滚到中段就会脱离圆周。
 */

/** 从 hero 的实际滚动容器（.layout__content）滚到指定比例位置 */
async function scrollHeroTo(page: Page, ratio: number) {
  const result = await page.evaluate((r) => {
    const hero = document.querySelector('.hero-rings') as HTMLElement | null
    let scroller: HTMLElement | null = hero?.parentElement ?? null
    let firstScrollable: HTMLElement | null = null
    while (scroller) {
      const { overflowY } = getComputedStyle(scroller)
      if (overflowY === 'auto' || overflowY === 'scroll') {
        if (scroller.scrollHeight > scroller.clientHeight + 1) break
        firstScrollable ??= scroller
      }
      scroller = scroller.parentElement
    }
    const target = scroller ?? firstScrollable ?? (document.documentElement as HTMLElement)
    const max = target.scrollHeight - target.clientHeight
    target.scrollTop = max * r
    return { scrollTop: target.scrollTop, max }
  }, ratio)
  // 等两帧：scroll 事件 → scrollY 更新 → Vue 刷新内联 CSS 变量
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  return result
}

/** 量每个小球中心到环心的距离，以及当时的缩放变量 */
async function measureRingSync(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector('.hero-rings') as HTMLElement
    const system = document.querySelector('.hero-rings__system') as HTMLElement
    const svg = document.querySelector('.hero-rings__svg') as SVGSVGElement
    const bg = document.querySelector('.hero-rings__bg') as HTMLElement
    const content = document.querySelector('.hero-rings__content') as HTMLElement
    const svgRect = svg.getBoundingClientRect()
    const heroRect = hero.getBoundingClientRect()
    const bgRect = bg.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const cx = svgRect.left + svgRect.width / 2
    const cy = svgRect.top + svgRect.height / 2
    const orbits = Array.from(
      document.querySelectorAll('.hero-rings__electron-orbit'),
    ) as HTMLElement[]
    const items = orbits.map((orbit) => {
      const button = orbit.querySelector('.hero-rings__electron') as HTMLElement
      const rect = button.getBoundingClientRect()
      return {
        radius: Number.parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-radius')),
        distance: Math.hypot(rect.left + rect.width / 2 - cx, rect.top + rect.height / 2 - cy),
      }
    })
    return {
      items,
      heroScale: Number.parseFloat(getComputedStyle(hero).getPropertyValue('--hero-scale')),
      zoom: Number.parseFloat(getComputedStyle(system).getPropertyValue('--ring-zoom')),
      // 背景层 / 文字层相对 hero 的尺寸，用来证明 zoom 没有外溢到其它层
      bgWidth: bgRect.width,
      heroWidth: heroRect.width,
      contentWidth: contentRect.width,
    }
  })
}

test.describe('年轮滚动视差与小球同步（mock，p27）', () => {
  test.use({ actionTimeout: 20000 })

  for (const ringCase of RING_CASES) {
    test(`${ringCase.width}px：顶部/中段/底部小球始终贴合圆周`, async ({ page }) => {
      await page.setViewportSize({ width: ringCase.width, height: ringCase.height })
      await mockStudentApi(page)
      await presetStudent(page)
      await page.goto('/growth-timeline')

      if ((await page.locator('.hero-rings').count()) === 0) {
        await page.locator('.view-switcher__btn', { hasText: '年轮' }).click()
      }
      await expect(page.locator('.hero-rings__electron')).toHaveCount(8)

      const positions = [
        { label: '顶部', ratio: 0 },
        { label: '中段', ratio: 0.5 },
        { label: '底部', ratio: 1 },
      ]
      let maxZoom = 1
      let baseWidths: { bg: number; content: number } | null = null
      for (const position of positions) {
        const scroll = await scrollHeroTo(page, position.ratio)
        const metrics = await measureRingSync(page)

        expect(metrics.zoom, `${position.label} zoom 应落在 [1, 1.1]`).toBeGreaterThanOrEqual(1)
        expect(metrics.zoom).toBeLessThanOrEqual(1.1 + 1e-6)
        maxZoom = Math.max(maxZoom, metrics.zoom)
        if (position.ratio === 0) {
          expect(scroll.scrollTop).toBe(0)
          expect(metrics.zoom).toBeCloseTo(1, 6)
          baseWidths = { bg: metrics.bgWidth, content: metrics.contentWidth }
        } else if (baseWidths) {
          // 背景层与文字层不参与 zoom：尺寸与顶部位一致，不是整页一起放大
          expect(metrics.bgWidth).toBeCloseTo(baseWidths.bg, 3)
          expect(metrics.contentWidth).toBeCloseTo(baseWidths.content, 3)
        }

        let maxError = 0
        for (const item of metrics.items) {
          const expected = item.radius * metrics.heroScale * metrics.zoom
          const error = Math.abs(item.distance - expected)
          maxError = Math.max(maxError, error)
          expect(
            error,
            `${position.label}：半径 ${item.radius} 的小球偏离圆周（实测 ${item.distance}，期望 ${expected}）`,
          ).toBeLessThan(0.001)
        }
        expect(maxError).toBeLessThan(0.001)
      }

      // 页面确实可滚动并触发了视差（否则中段/底部的断言毫无意义）
      const scrollRange = await page.evaluate(() => {
        const hero = document.querySelector('.hero-rings') as HTMLElement
        let scroller: HTMLElement | null = hero.parentElement
        let firstScrollable: HTMLElement | null = null
        while (scroller) {
          const { overflowY } = getComputedStyle(scroller)
          if (overflowY === 'auto' || overflowY === 'scroll') {
            if (scroller.scrollHeight > scroller.clientHeight + 1) break
            firstScrollable ??= scroller
          }
          scroller = scroller.parentElement
        }
        const target = scroller ?? firstScrollable
        return target ? target.scrollHeight - target.clientHeight : 0
      })
      expect(scrollRange).toBeGreaterThan(0)
      expect(maxZoom).toBeGreaterThan(1)
    })
  }
})

test.describe('年轮滚动视差尊重减少动效偏好（mock，p27）', () => {
  test.use({
    actionTimeout: 20000,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })

  test('reduced-motion 下滚到底部仍保持 zoom=1', async ({ page }) => {
    await mockStudentApi(page)
    await presetStudent(page)
    await page.goto('/growth-timeline')
    await expect(page.locator('.hero-rings__electron')).toHaveCount(8)

    await scrollHeroTo(page, 1)
    const metrics = await measureRingSync(page)
    expect(metrics.zoom).toBeCloseTo(1, 6)
    for (const item of metrics.items) {
      const expected = item.radius * metrics.heroScale
      expect(Math.abs(item.distance - expected)).toBeLessThan(0.001)
    }
  })
})

const ADMIN = {
  userId: 2,
  userNo: 'A00002',
  name: '测试管理员',
  email: null,
  phone: null,
  gender: 0,
  genderLabel: '',
  schoolId: 1,
  schoolName: '测试大学',
  roles: ['admin'],
  roleNames: ['管理员'],
  permissions: [],
  scopes: [],
  avatar: null,
}

async function presetAdmin(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('token', 'mock-access-token')
    localStorage.setItem(
      'user_info_cache',
      JSON.stringify({
        id: String(user.userId),
        username: user.userNo,
        realName: user.name,
        email: '',
        phone: '',
        loginType: 'teacher',
      }),
    )
    localStorage.setItem('teacher_me', JSON.stringify(user))
  }, ADMIN)
}

async function mockAdminApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '')
    const data = path === '/auth/me' ? ADMIN : { list: [], total: 0 }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(wrap(data)),
    })
  })
}

test.describe('窄屏日期范围选择器（mock，390px）', () => {
  test.use({ actionTimeout: 20000, viewport: { width: 390, height: 844 } })

  test('面板不溢出、触控高度、起止约束、清空与重置联动', async ({ page }) => {
    await mockAdminApi(page)
    await presetAdmin(page)
    await page.goto('/teacher/system-settings?tab=logs')

    const range = page.locator('.date-range-narrow:visible').first()
    await expect(range).toBeVisible({ timeout: 20000 })
    const editors = range.locator('.el-date-editor')
    await expect(editors).toHaveCount(2)

    // 1) 两个输入框触控高度 ≥ 40px
    for (const editor of [editors.nth(0), editors.nth(1)]) {
      const box = await editor.locator('.el-input__wrapper').boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40)
    }

    // 2) 打开开始日期面板，面板完整落在视口内
    await editors.nth(0).locator('input').click()
    const panel = page.locator('.el-picker-panel:visible')
    await expect(panel).toHaveCount(1)
    await expect(panel).toBeVisible()
    const panelBox = await panel.boundingBox()
    expect(panelBox).toBeTruthy()
    const panelLeft = panelBox?.x ?? -1
    const panelRight = (panelBox?.x ?? 0) + (panelBox?.width ?? 0)
    expect(panelLeft).toBeGreaterThanOrEqual(0)
    expect(panelRight).toBeLessThanOrEqual(390)

    // 3) 只选开始日 → 结束日自动补齐同一天
    const startInput = editors.nth(0).locator('input')
    const endInput = editors.nth(1).locator('input')
    await panel.locator('.el-date-table td.available', { hasText: /^15$/ }).first().click()
    const startDay15 = await startInput.inputValue()
    expect(startDay15).toMatch(/-15$/)
    expect(await endInput.inputValue()).toBe(startDay15)

    // 4) 结束日早于开始日 → 开始日回拉到同一天
    //    等上一个面板完全收起，避免选择器命中正在淡出的旧面板日期格
    await expect(page.locator('.el-picker-panel:visible')).toHaveCount(0)
    await editors.nth(1).locator('input').click()
    const endPanel = page.locator('.el-picker-panel:visible')
    await expect(endPanel).toHaveCount(1)
    await endPanel.locator('.el-date-table td.available', { hasText: /^10$/ }).first().click()
    const endDay10 = await endInput.inputValue()
    expect(endDay10).toMatch(/-10$/)
    expect(await startInput.inputValue()).toBe(endDay10)

    // 5) 清空任意一端 → 两端一起清空
    await editors.nth(0).hover()
    await editors.nth(0).locator('.clear-icon').click()
    await expect(startInput).toHaveValue('')
    await expect(endInput).toHaveValue('')

    // 6) 外部重置（页面「重置筛选」）→ 窄屏两个输入框同步清空
    await expect(page.locator('.el-picker-panel:visible')).toHaveCount(0)
    await editors.nth(0).locator('input').click()
    const reopenPanel = page.locator('.el-picker-panel:visible')
    await expect(reopenPanel).toHaveCount(1)
    await reopenPanel.locator('.el-date-table td.available', { hasText: /^15$/ }).first().click()
    await expect(startInput).not.toHaveValue('')
    await page.locator('.el-button:visible', { hasText: '重置筛选' }).first().click()
    await expect(startInput).toHaveValue('')
    await expect(endInput).toHaveValue('')
  })
})
