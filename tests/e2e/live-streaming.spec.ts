import fs from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * 联调实测（非 CI 用例，需人工在打开的浏览器中登录）：
 *   npx playwright test tests/e2e/live-streaming.spec.ts --headed --retries=0
 *
 * 1. 打开 /login 后暂停，等待使用者在浏览器窗口内手动登录（含验证码）；
 * 2. 登录成功后进入 /ai-chat，发送问题，按 150ms 采样回复文本长度，验证逐段增长；
 * 3. 记录流式接口响应头（确认 text/event-stream），截图首字与完成态；
 * 4. 再发一问并在生成中点击「停止生成」，验证片段保留 + 「已停止生成」。
 */
test.setTimeout(540_000)

const REPORT_PATH = '.vite/live-stream-report.json'
const FIRST_SCREENSHOT = '.vite/live-stream-first-token.png'
const DONE_SCREENSHOT = '.vite/live-stream-done.png'
const STOP_SCREENSHOT = '.vite/live-stream-stopped.png'

test('人工登录后实测 AI 流式回复与停止生成', async ({ page }) => {
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    samples: [] as Array<{ t: number; len: number }>,
    streamResponses: [] as Array<{ url: string; status: number; contentType: string }>,
    pageErrors: [] as string[],
    consoleErrors: [] as string[],
  }
  page.on('pageerror', (e) => {
    ;(report.pageErrors as string[]).push(String(e))
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      ;(report.consoleErrors as string[]).push(msg.text())
    }
  })
  page.on('response', (res) => {
    const url = res.url()
    if (!url.includes('/api/v1/ai/') || !url.includes('/messages')) {
      return
    }
    const responses = report.streamResponses as Array<Record<string, unknown>>
    responses.push({
      url: url.replace(/^https?:\/\/[^/]+/, ''),
      status: res.status(),
      contentType: res.headers()['content-type'] ?? '',
      at: new Date().toISOString(),
    })
  })

  await page.goto('/login')
  // 防呆：确认连到的是本项目（端口被其他应用占用时会静默跑在别的站点上）
  await expect(page).toHaveTitle(/档鉴未来/)
  await page.locator('.login__form').waitFor({ timeout: 30_000 })
  process.stdout.write('请在弹出的浏览器窗口中手动登录（账号 + 验证码），登录后测试将自动继续…\n')

  // 登录成功即离开 /login（路由守卫会把已登录用户弹走）
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 480_000 })
  report.loginFinishedAt = new Date().toISOString()
  report.afterLoginPath = new URL(page.url()).pathname
  process.stdout.write(`检测到登录成功，当前路径：${report.afterLoginPath}\n`)

  await page.goto('/ai-chat')
  const input = page.locator('.ci__textarea')
  await input.waitFor({ timeout: 30_000 })
  await expect(input).toBeEditable()

  // ── 1. 流式输出实测 ──
  // 按下标定位本次回复的气泡：降级路径会先移除占位、稍后再追加整段回复，
  // 用「最后一条」会把欢迎语误当成首字。
  const aiBubbleCount = () => page.locator('.mb--ai .mb__bubble').count()
  const aiBubbleTextAt = (index: number) =>
    page.evaluate((i) => {
      const bubbles = document.querySelectorAll('.mb--ai .mb__bubble')
      return (bubbles[i] as HTMLElement | undefined)?.textContent ?? ''
    }, index)

  const replyIndex = await aiBubbleCount()
  await input.fill('请分三点简要说明奖项申报需要准备哪些材料。')
  const t0 = Date.now()
  await input.press('Enter')

  let firstTokenMs: number | null = null
  let completedMs: number | null = null
  let lastLen = 0
  let distinctGrowth = 0
  let shotTaken = false

  while (Date.now() - t0 < 120_000) {
    const text = await aiBubbleTextAt(replyIndex)
    const len = text.trim().length
    if (len > 0 && firstTokenMs === null) {
      firstTokenMs = Date.now() - t0
      if (!shotTaken) {
        shotTaken = true
        await page.screenshot({ path: FIRST_SCREENSHOT })
      }
    }
    if (len > lastLen) {
      distinctGrowth += 1
      lastLen = len
      ;(report.samples as Array<{ t: number; len: number }>).push({ t: Date.now() - t0, len })
    }
    const caret = await page.locator('.mb--ai .mb__caret').count()
    const stopBtn = await page.locator('.ci__send--stop').count()
    if (firstTokenMs !== null && caret === 0 && stopBtn === 0) {
      completedMs = Date.now() - t0
      break
    }
    await page.waitForTimeout(150)
  }

  const finalText = (await aiBubbleTextAt(replyIndex)).trim()
  report.firstTokenMs = firstTokenMs
  report.completedMs = completedMs
  report.distinctGrowthSteps = distinctGrowth
  report.finalLength = finalText.length
  report.finalPreview = finalText.slice(0, 120)
  await page.screenshot({ path: DONE_SCREENSHOT })
  // 先落盘再断言：任一步失败也能拿到采样与响应头用于定位
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  const hasSse = (report.streamResponses as Array<{ contentType: string }>).some((r) =>
    r.contentType.includes('text/event-stream'),
  )
  expect(
    hasSse,
    '后端未部署流式接口：/messages/stream 未返回 text/event-stream（前端已降级为同步接口）',
  ).toBe(true)

  expect(firstTokenMs, '应收到首字').not.toBeNull()
  expect(distinctGrowth, '回复应逐段增长而非一次性出现').toBeGreaterThanOrEqual(3)
  expect(finalText.length).toBeGreaterThan(10)

  // ── 2. 停止生成实测 ──
  const stopReplyIndex = await aiBubbleCount()
  await input.fill('请详细介绍一下成长时间轴功能，尽量多写一些内容。')
  await input.press('Enter')
  await page.locator('.ci__send--stop').waitFor({ timeout: 30_000 })
  await page.waitForFunction(
    (index) => {
      const bubbles = document.querySelectorAll('.mb--ai .mb__bubble')
      const el = bubbles[index] as HTMLElement | undefined
      return (el?.textContent ?? '').trim().length >= 8
    },
    stopReplyIndex,
    { timeout: 90_000 },
  )
  const textBeforeStop = (await aiBubbleTextAt(stopReplyIndex)).trim()
  await page.locator('.ci__send--stop').click()
  await page.locator('.mb__stopped').last().waitFor({ timeout: 15_000 })
  const textAtStop = (await aiBubbleTextAt(stopReplyIndex)).trim()
  await page.waitForTimeout(3000)
  const textAfterWait = (await aiBubbleTextAt(stopReplyIndex)).trim()
  const stopBtnGone = (await page.locator('.ci__send--stop').count()) === 0
  const sendEnabled = await page
    .locator('.ci__send')
    .isEnabled()
    .catch(() => false)
  await page.screenshot({ path: STOP_SCREENSHOT })

  report.stop = {
    textBeforeStopLength: textBeforeStop.length,
    textAtStopLength: textAtStop.length,
    textAfterWaitLength: textAfterWait.length,
    stoppedBannerVisible: true,
    stopButtonGone: stopBtnGone,
    sendEnabled,
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  expect(textBeforeStop.length).toBeGreaterThan(0)
  expect(textAtStop, '停止后已生成片段应保留').toBe(textBeforeStop)
  expect(textAfterWait, '停止后不应继续增长').toBe(textAtStop)
  expect(stopBtnGone).toBe(true)

  report.finishedAt = new Date().toISOString()
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
  process.stdout.write(`实测报告：${JSON.stringify(report, null, 2)}\n`)
})
