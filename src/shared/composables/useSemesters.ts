import type { Ref, VNode } from 'vue'
import { ElMessage } from 'element-plus'
import { h, ref } from 'vue'
import { getSemesters } from '@/shared/api/common'

/** 学期下拉选项：value 取后端 semester.name（字符串，如 '2024-2025-1'），与表单绑定/提交映射一致 */
export interface SemesterSelectOption {
  value: string
  label: string
}

export interface UseSemestersReturn {
  /** 学期下拉选项，仅含后端 `GET /common/semesters` 返回的真实学期 */
  semesterOptions: Ref<SemesterSelectOption[]>
  /** 是否正在请求中 */
  loading: Ref<boolean>
  /** 加载失败 / 后端未配置学期时的原因；null 表示数据正常 */
  error: Ref<string | null>
  /** 触发拉取：已锁定或处于最短请求间隔内则直接复用缓存/跳过，不发请求 */
  load: () => Promise<void>
  /** 强制立即重新拉取（忽略锁定与最短间隔），用于提示里的「重新获取」 */
  reload: () => Promise<void>
}

// ── 模块级缓存：多个页面共用同一次请求 ──
// 首个调用者触发请求，其余页面复用同一个 in-flight Promise，避免 16 个页面各发一次请求。
const semesterOptions = ref<SemesterSelectOption[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null
/** 是否已锁定：仅「非空列表」或「连续失败达上限」置 true；空数组不锁定，下次 load() 会重新请求 */
let settled = false
/** 失败尝试次数上限（首次 + 2 次自动重试）；达到后放弃自动重试 */
const MAX_FAILED_ATTEMPTS = 3
let failedAttempts = 0
/**
 * 自动请求的最短间隔：后端长期返回空数组时，页面每挂载一次都会 load()，
 * 需要把连点/快速切页面的请求合并成「最多每 10 秒一次」，否则会持续打后端。
 */
const MIN_REQUEST_INTERVAL_MS = 10_000
let lastRequestAt = 0
/** 常驻提示的实例：拿到数据后主动关闭，避免残留「未配置」误导用户 */
let noticeHandler: { close: () => void } | null = null
/** 常驻提示在一个会话内只弹一次，重试时不再重复弹出 */
let emptyNoticeShown = false

function applyRemote(list: { name: string; label?: string }[]): void {
  semesterOptions.value = list
    .filter((s) => Boolean(s.name))
    .map((s) => ({ value: s.name, label: s.label || s.name }))
    .sort((a, b) => a.value.localeCompare(b.value))
  error.value = null
}

function applyEmpty(reason: string, notify: boolean): void {
  semesterOptions.value = []
  error.value = reason
  // 后端正常返回空数组时拦截器不会提示，需要就地告知；请求失败已由拦截器统一提示。
  // 常驻 + 可手动关闭 + 带「重新获取」操作：3 秒自动消失老师来不及看到，且没法自助重试。
  // emptyNoticeShown 保证同一会话只弹一次，重试时不再刷屏。
  if (!notify || emptyNoticeShown) return
  emptyNoticeShown = true
  noticeHandler = ElMessage.warning({
    message: buildNoticeMessage(),
    duration: 0,
    showClose: true,
  })
}

/** 常驻提示的正文：文案 + 「重新获取」按钮（消息体支持 VNode，按钮点击直接触发强制重试） */
function buildNoticeMessage(): VNode {
  return h('span', [
    '学期数据未配置，请联系管理员',
    h(
      'button',
      {
        type: 'button',
        // 消息组件被 teleport 到 body，scoped 样式无法命中，只能就地写最小行内样式
        style:
          'margin-left:8px;padding:0;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer',
        onClick: retryFromNotice,
      },
      '重新获取',
    ),
  ])
}

/**
 * 点击「重新获取」：立即强制请求一次。
 * 无论结果如何都必须给出可感知的反馈——否则用户点完毫无反应。
 */
async function retryFromNotice(): Promise<void> {
  await forceRequest()
  if (semesterOptions.value.length > 0) {
    noticeHandler?.close()
    noticeHandler = null
    ElMessage.success('学期数据已更新')
    return
  }
  // 这是点击后的短时反馈，不是那条常驻提示（常驻提示仍然只弹一次）
  ElMessage.warning('仍未获取到学期数据，请稍后重试')
}

function request(force = false): Promise<void> {
  if (inflight) return inflight
  const now = Date.now()
  // 最短间隔只约束自动请求；手动「重新获取」走 force，不受间隔与锁定限制
  if (!force && now - lastRequestAt < MIN_REQUEST_INTERVAL_MS) return Promise.resolve()
  lastRequestAt = now
  loading.value = true
  const task = getSemesters()
    .then(
      (list) => {
        if (Array.isArray(list) && list.length > 0) {
          applyRemote(list)
          failedAttempts = 0
          // 只有拿到真实数据才锁定，后续页面直接复用
          settled = true
          return
        }
        // 空数组视为「后端尚无数据」：不锁定，下次 load() 过最短间隔后自动再问一次
        applyEmpty('学期数据为空', true)
      },
      (e: unknown) => {
        failedAttempts += 1
        applyEmpty(e instanceof Error ? e.message : '学期数据加载失败', false)
        // 失败保持未锁定，下次任何页面调用 load() 会自动重试；
        // 达到上限后整会话放弃，避免后端持续不可用时无限重试。
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) settled = true
      },
    )
    .finally(() => {
      loading.value = false
      inflight = null
    })
  inflight = task
  return task
}

/**
 * 学期下拉数据源（对接后端 GET /common/semesters）。
 *
 * 只使用后端返回的学期，不再与本地生成区间取并集：提交时需用学期 name 映射 semesterId，
 * 后端不存在的学期即使能选中也必然提交失败（「未找到学期 / 学期不存在」），
 * 因此不允许在 UI 中编造可选项。
 *
 * 模块级缓存：多个页面共用同一次请求。
 * - 只有拿到非空列表才锁定 settled，后续页面直接复用；
 * - 后端返回空数组时不上锁，下次 load() 在 MIN_REQUEST_INTERVAL_MS 之后自动再请求一次，
 *   因此后端补完数据后无需刷新页面即可恢复，同时不会因频繁切路由把后端打满；
 * - 请求失败不锁定，下次 load() 自动重试，整会话最多尝试 MAX_FAILED_ATTEMPTS 次；
 * - 常驻提示里的「重新获取」走 reload()，忽略锁定与最短间隔，立即强制请求。
 * 请求失败或返回空数组时下拉为空，原因写入 error，由页面/提示告知用户，不回退本地列表。
 */
export function useSemesters(): UseSemestersReturn {
  function load(): Promise<void> {
    if (settled) return Promise.resolve()
    return request()
  }

  function reload(): Promise<void> {
    return forceRequest()
  }

  return { semesterOptions, loading, error, load, reload }
}

/** 强制立即请求：清掉锁定（失败计数保留），不受最短间隔限制 */
function forceRequest(): Promise<void> {
  settled = false
  return request(true)
}
