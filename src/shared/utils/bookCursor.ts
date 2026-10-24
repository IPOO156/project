/**
 * 书册鼠标指针（book-cursor 项目化版本）
 *
 * 来源：外部包 book-cursor v1.0.0（自包含 UMD）。
 * 本项目化改造点：
 *  1. 改写为 TS 模块（原包为 UMD + any 形态），对外导出类型完整的单例；
 *  2. 配色对齐 themes.css / variables.scss 设计 token（深海蓝 + 琥珀金 / 夜间浅色）；
 *  3. 移除 prefers-reduced-motion 降级分支——本项目策略为「动效始终启用」
 *     （见 main.ts 的 data-allow-motion 与 motion-override.scss）；
 *  4. 主题判定收敛到项目实际机制：html[data-theme='light'|'dark'] + .dark 类；
 *  5. 修正原包 disabled 态变量名不一致的问题（原 CSS 用 --bc-na，applyVars 却写 --bc-not-allowed）。
 *
 * 注意事项（来自原包说明）：
 *  - CSP 必须允许 img-src 中出现 data:，否则光标会静默失效（本项目未配置 CSP，暂无此风险）；
 *  - Safari 对 SVG 光标支持不稳定，会回退为系统箭头；
 *  - iframe 内部需各自调用一次 init；
 *  - SPA 整页重挂前先 destroy() 再 init()，避免残留多个 <style>。
 */

export type BookCursorTheme = 'auto' | 'day' | 'night'
export type BookCursorPalette = 'day' | 'night'

export interface BookCursorOptions {
  /** auto 跟随 html[data-theme] 与 .dark 类，并持续监听切换。默认 auto */
  theme?: BookCursorTheme
  /** 加载动画帧数，越大越顺滑，同时首次生成耗时更高。默认 36 */
  frames?: number
  /** 一轮翻页时长（毫秒）。默认 650 */
  cycleMs?: number
  /** 是否启用，默认 true */
  enabled?: boolean
}

export interface BookCursorApi {
  init: (options?: BookCursorOptions) => void
  setTheme: (theme: BookCursorTheme) => void
  startWait: (target?: Element) => void
  stopWait: () => void
  enable: () => void
  disable: () => void
  destroy: () => void
}

/* ---------------- 图形（沿用原包路径，避免视觉走样） ---------------- */

const BOOK = 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'
const notch = (bookmark: number) => `M6 4h5V${bookmark}L8.5 ${bookmark - 2.5}L6 ${bookmark}z`

const OPEN =
  'M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783'
const LEAF =
  'M8 1.783C8.985.936 10.413.809 11.713.94c1.514.153 3.042.672 3.994 1.105A.5.5 0 0 1 16 2.5v11a.5.5 0 0 1-.707.455c-.882-.4-2.303-.881-3.681-1.02-1.408-.142-2.589.087-3.222.877Z'
const CLIP = 'M0.2 2.6 L8 1.9 L15.8 2.6 L15.8 13.4 L8 13.7 L0.2 13.4 Z'

/**
 * 配色对齐项目设计 token：
 *  - ink   = 书体与线条：日间 $color-primary #1e3a5f，夜间文字色 #f1f5f9
 *  - paper = 镂空与反色描边：日间页面底色，夜间卡片底色
 *  - back  = 翻动页片：日间 $color-accent #d4a574，夜间链接蓝 #60a5fa
 */
const THEMES: Record<BookCursorPalette, { ink: string; paper: string; back: string }> = {
  day: { ink: '#1e3a5f', paper: '#f8fafc', back: '#d4a574' },
  night: { ink: '#f1f5f9', paper: '#1e293b', back: '#60a5fa' },
}

type CursorState =
  'default' | 'hover' | 'text' | 'left' | 'right' | 'middle' | 'wait' | 'not-allowed'

const CURSOR_STATES: CursorState[] = [
  'default',
  'hover',
  'text',
  'left',
  'right',
  'middle',
  'wait',
  'not-allowed',
]

/** 状态名 → CSS 变量后缀（not-allowed 对应原设计的 --bc-na） */
const VAR_SUFFIX: Record<CursorState, string> = {
  default: 'default',
  hover: 'hover',
  text: 'text',
  left: 'left',
  right: 'right',
  middle: 'middle',
  wait: 'wait',
  'not-allowed': 'na',
}

const HOTSPOT: Record<CursorState, string> = {
  default: '5 3',
  hover: '5 3',
  text: '16 16',
  left: '5 3',
  right: '5 3',
  middle: '5 3',
  wait: '1 5',
  'not-allowed': '5 3',
}

const DEFAULT_FRAMES = 36
const DEFAULT_CYCLE_MS = 650
const BUSY_CLASS = 'bc-busy'
const OFF_CLASS = 'bc-off'
const STYLE_ATTR = 'data-book-cursor'

function wrap16(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">${body}</svg>`
}

function wrap24(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">${body}</svg>`
}

function uri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** 生成某个配色下的 8 个静态状态光标 */
function buildStates(palette: {
  ink: string
  paper: string
  back: string
}): Record<CursorState, string> {
  const { ink, paper } = palette
  const book = (bookmark: number) =>
    `<path d="${BOOK}${notch(bookmark)}" fill="${ink}" fill-rule="nonzero"/>`

  return {
    default: wrap24(book(12)),
    hover: wrap24(book(16)),
    right: wrap24(book(20)),
    left: wrap24(
      `<g transform="translate(4 2) scale(.93) translate(-4 -2)"><path d="${BOOK}" fill="${ink}"/></g>`,
    ),
    text: wrap24(
      `<path d="M12 2.8V21.2" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>` +
        `<path d="M8.7 2.8h6.6M8.7 21.2h6.6" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>`,
    ),
    middle: wrap24(
      `${book(12)}<path d="M15.6 9.4V15.4" fill="none" stroke="${paper}" stroke-width="1.9" stroke-linecap="round"/>` +
        `<path d="M13.9 10.4 15.6 8.7 17.3 10.4" fill="none" stroke="${paper}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M13.9 14.4 15.6 16.1 17.3 14.4" fill="none" stroke="${paper}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    ),
    'not-allowed': wrap24(
      `<path d="${BOOK}${notch(12)}" fill="${ink}" fill-rule="nonzero" opacity=".5"/>` +
        `<path d="M5 21 19 3" stroke="${paper}" stroke-width="4.4" stroke-linecap="round" fill="none"/>` +
        `<path d="M5 21 19 3" stroke="${ink}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    ),
    // wait 态由动画帧覆盖，这里给首帧兜底，避免动画未启动时无光标
    wait: wrap16(`<path d="${OPEN}" fill="${ink}"/>`),
  }
}

/** 三页错层连翻：把进度 p 渲染为一帧 SVG */
function buildWaitFrame(palette: { ink: string; paper: string; back: string }, p: number): string {
  let leaves = ''
  for (let i = 2; i >= 0; i--) {
    const q = (p + i / 3) % 1
    const scaleX = Math.cos(Math.PI * q)
    const offsetX = 8 * (1 - scaleX)
    const opacity = Math.min(1, Math.min(q / 0.1, (1 - q) / 0.1))
    if (opacity < 0.02) continue
    leaves +=
      `<g transform="matrix(${scaleX.toFixed(4)},0,0,1,${offsetX.toFixed(3)},0)" opacity="${opacity.toFixed(2)}">` +
      `<path d="${LEAF}" fill="${palette.ink}" opacity=".26" transform="translate(1.1 .8)"/>` +
      `<path d="${LEAF}" fill="${palette.back}" stroke="${palette.ink}" stroke-width=".85" stroke-linejoin="round"/>` +
      `</g>`
  }
  return wrap16(
    `<clipPath id="bk"><path d="${CLIP}"/></clipPath>` +
      `<path d="${OPEN}" fill="${palette.ink}"/>` +
      `<g clip-path="url(#bk)">${leaves}</g>`,
  )
}

/* ---------------- 样式 ---------------- */

const CURSOR_CSS = [
  'html{cursor:var(--bc-default),auto;}',
  'a,button,[role="button"],select,summary,label[for],.el-button,.el-link,.bc-link{cursor:var(--bc-hover),pointer;}',
  'input,textarea,[contenteditable=""],[contenteditable="true"]{cursor:var(--bc-text),text;}',
  '[disabled],.is-disabled,[aria-disabled="true"]{cursor:var(--bc-na),not-allowed!important;}',
  `.${BUSY_CLASS},.${BUSY_CLASS} *{cursor:var(--bc-wait),progress!important;}`,
  `.${OFF_CLASS},.${OFF_CLASS} *{cursor:auto!important;}`,
].join('')

/* ---------------- 运行时状态 ---------------- */

const cache: Record<
  BookCursorPalette,
  {
    states: Record<CursorState, string> | null
    frames: string[] | null
  }
> = {
  day: { states: null, frames: null },
  night: { states: null, frames: null },
}

let inited = false
let enabled = true
let theme: BookCursorPalette = 'day'
let frameCount = DEFAULT_FRAMES
let cycleMs = DEFAULT_CYCLE_MS
let rafId: number | null = null
let startTs = 0
let lastFrameIdx = -1
let waitTarget: Element | null = null
let pressing = false
let styleEl: HTMLStyleElement | null = null
let observer: MutationObserver | null = null

function statesFor(palette: BookCursorPalette): Record<CursorState, string> {
  if (!cache[palette].states) cache[palette].states = buildStates(THEMES[palette])
  return cache[palette].states
}

/** 帧在首次进入加载态时才生成，避免拖慢首屏（与原包策略一致） */
function framesFor(palette: BookCursorPalette): string[] {
  if (!cache[palette].frames) {
    const frames: string[] = []
    for (let i = 0; i < frameCount; i++)
      frames.push(uri(buildWaitFrame(THEMES[palette], i / frameCount)))
    cache[palette].frames = frames
  }
  return cache[palette].frames
}

function applyVars(): void {
  const root = document.documentElement
  const states = statesFor(theme)
  for (const name of CURSOR_STATES) {
    root.style.setProperty(`--bc-${VAR_SUFFIX[name]}`, `${uri(states[name])} ${HOTSPOT[name]}`)
  }
  // 加载帧已生成时同步首帧，避免主题切换后仍显示旧配色
  const cachedFrames = cache[theme].frames
  if (cachedFrames) {
    root.style.setProperty(`--bc-wait`, `${cachedFrames[0]} ${HOTSPOT.wait}`)
  }
}

/** 项目实际机制：theme store 同时写 html[data-theme] 与 .dark 类 */
function detectTheme(): BookCursorPalette {
  const root = document.documentElement
  const attr = (root.getAttribute('data-theme') || '').toLowerCase()
  if (attr === 'dark' || attr.includes('night')) return 'night'
  if (root.classList.contains('dark')) return 'night'
  return 'day'
}

function setTheme(name: BookCursorTheme): void {
  const resolved = name === 'auto' ? detectTheme() : name
  const next: BookCursorPalette = resolved === 'night' ? 'night' : 'day'
  const changed = next !== theme
  const waiting = waitTarget !== null && rafId !== null
  theme = next
  applyVars()
  if (changed && waiting) startWait(waitTarget ?? undefined)
}

function setWaitCursor(value: string): void {
  document.documentElement.style.setProperty('--bc-wait', `${value} ${HOTSPOT.wait}`)
}

function setPress(name: 'left' | 'right' | 'middle'): void {
  pressing = true
  document.documentElement.style.cursor = `var(--bc-${name}),auto`
}

function release(): void {
  if (!pressing) return
  pressing = false
  document.documentElement.style.cursor = ''
}

function onMouseDown(event: MouseEvent): void {
  if (!enabled) return
  if (event.button === 0) setPress('left')
  else if (event.button === 2) setPress('right')
  else if (event.button === 1) setPress('middle')
}

function startWait(target?: Element): void {
  stopWait()
  const el = target ?? document.documentElement
  waitTarget = el
  el.classList.add(BUSY_CLASS)

  const frames = framesFor(theme)
  startTs = 0
  lastFrameIdx = -1
  setWaitCursor(frames[0])

  const per = cycleMs / frames.length
  const tick = (ts: number): void => {
    if (!waitTarget) return
    if (!startTs) startTs = ts
    const idx = Math.floor((ts - startTs) / per) % frames.length
    if (idx !== lastFrameIdx) {
      lastFrameIdx = idx
      setWaitCursor(frames[idx])
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopWait(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (waitTarget) {
    waitTarget.classList.remove(BUSY_CLASS)
    waitTarget = null
  }
}

function applyEnabled(on: boolean): void {
  if (!on) {
    stopWait()
    release()
    document.documentElement.classList.add(OFF_CLASS)
  } else {
    document.documentElement.classList.remove(OFF_CLASS)
  }
}

function enable(): void {
  enabled = true
  applyEnabled(true)
}

function disable(): void {
  enabled = false
  applyEnabled(false)
}

function init(options: BookCursorOptions = {}): void {
  if (typeof document === 'undefined') return
  if (inited) {
    if (options.theme) setTheme(options.theme)
    return
  }
  inited = true
  enabled = options.enabled !== false
  if (options.frames) frameCount = Math.max(8, Math.floor(options.frames))
  if (options.cycleMs) cycleMs = Math.max(200, Math.floor(options.cycleMs))

  styleEl = document.createElement('style')
  styleEl.setAttribute(STYLE_ATTR, '')
  styleEl.textContent = CURSOR_CSS
  document.head.appendChild(styleEl)

  setTheme(options.theme ?? 'auto')

  document.addEventListener('mousedown', onMouseDown, true)
  document.addEventListener('mouseup', release, true)
  document.addEventListener('dragend', release, true)
  window.addEventListener('blur', release)

  applyEnabled(enabled)

  // theme store 切换时同步日夜配色（只监听 data-theme，项目内与 .dark 类同步写入）
  observer = new MutationObserver(() => {
    if (options.theme === 'auto' || !options.theme) setTheme('auto')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

function destroy(): void {
  stopWait()
  release()
  document.removeEventListener('mousedown', onMouseDown, true)
  document.removeEventListener('mouseup', release, true)
  document.removeEventListener('dragend', release, true)
  window.removeEventListener('blur', release)
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl)
  styleEl = null

  // 清理运行期写入的变量与状态类，避免重挂后残留
  const root = document.documentElement
  for (const name of CURSOR_STATES) root.style.removeProperty(`--bc-${VAR_SUFFIX[name]}`)
  root.style.removeProperty('--bc-wait')
  root.classList.remove(BUSY_CLASS, OFF_CLASS)

  inited = false
}

const bookCursor: BookCursorApi = {
  init,
  setTheme,
  startWait,
  stopWait,
  enable,
  disable,
  destroy,
}

export default bookCursor
