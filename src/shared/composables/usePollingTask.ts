import { onUnmounted } from 'vue'

/**
 * 异步任务进度轮询 —— 「创建任务 → 定时查状态 → 终态提示」的公共实现。
 *
 * 原先档案导出（单任务）与评分重算各自维护了一份 `Map<id, timer>` + setInterval
 * + onUnmounted 清理的相同代码，差异仅在取数接口、列表定位键、写回字段与提示文案。
 *
 * 用法（在 setup 中调用，组件卸载时自动清理全部定时器）：
 * ```ts
 * const polling = usePollingTask<ExportJob>({
 *   fetch: getExportJob,
 *   getStatus: (job) => job.status,
 *   onUpdate: (job, id) => {
 *     const task = tasks.value.find((t) => t.exportJobId === id)
 *     if (!task) return false
 *     task.status = job.status
 *     return true
 *   },
 *   onFinish: (_id, ok) => (ok ? ElMessage.success('导出完成') : ElMessage.error('导出失败')),
 * })
 * polling.start(jobId)
 * ```
 */

/** 异步任务状态码（后端约定）：2 = 已完成，3 = 失败，其余为进行中 */
export const TASK_STATUS_FINISHED = 2
export const TASK_STATUS_FAILED = 3

/** 默认轮询间隔（毫秒） */
const DEFAULT_INTERVAL = 3000

export interface PollingTaskOptions<T> {
  /** 按任务 id 拉取最新状态 */
  fetch: (id: number) => Promise<T>
  /** 从返回数据中取出状态码（比对 TASK_STATUS_FINISHED / TASK_STATUS_FAILED） */
  getStatus: (data: T) => number
  /**
   * 把最新数据写回列表项。
   * @returns 返回 false 表示该任务已不在列表中（如已被删除），将终止轮询
   */
  onUpdate: (data: T, id: number) => boolean
  /** 轮询间隔（毫秒），默认 3000 */
  interval?: number
  /** 任务到达终态时回调，ok 为 true 表示成功完成 */
  onFinish?: (id: number, ok: boolean) => void
}

export interface UsePollingTaskReturn {
  /** 开始轮询指定任务（重复调用同一 id 会先停掉旧定时器，不会叠加） */
  start: (id: number) => void
  /** 停止指定任务的轮询 */
  stop: (id: number) => void
  /** 停止全部轮询 */
  stopAll: () => void
  /** 指定任务是否正在轮询 */
  isPolling: (id: number) => boolean
}

export function usePollingTask<T>(options: PollingTaskOptions<T>): UsePollingTaskReturn {
  const timers = new Map<number, ReturnType<typeof setInterval>>()
  const interval = options.interval ?? DEFAULT_INTERVAL

  function stop(id: number) {
    const timer = timers.get(id)
    if (timer != null) {
      clearInterval(timer)
      timers.delete(id)
    }
  }

  function stopAll() {
    timers.forEach((timer) => clearInterval(timer))
    timers.clear()
  }

  function isPolling(id: number): boolean {
    return timers.has(id)
  }

  function start(id: number) {
    // 同 id 重复启动先停旧的，避免定时器叠加后重复请求
    stop(id)
    timers.set(
      id,
      setInterval(async () => {
        try {
          const data = await options.fetch(id)
          // 任务已从列表中消失（如被删除）：终止轮询。
          // 旧实现此处只 return 不停止，任务删除后定时器会永远每 3 秒空转请求一次。
          if (!options.onUpdate(data, id)) {
            stop(id)
            return
          }
          const status = options.getStatus(data)
          if (status === TASK_STATUS_FINISHED || status === TASK_STATUS_FAILED) {
            stop(id)
            options.onFinish?.(id, status === TASK_STATUS_FINISHED)
          }
        } catch {
          // 静默处理单次轮询失败，下个周期重试
        }
      }, interval),
    )
  }

  onUnmounted(stopAll)

  return { start, stop, stopAll, isPolling }
}
