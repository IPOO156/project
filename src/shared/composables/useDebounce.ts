import { onScopeDispose } from 'vue'

/**
 * 输入类搜索字段的统一防抖（规范要求 300ms）。
 *
 * 用法：
 * ```ts
 * const debouncedSearch = useDebounce(handleSearch) // 默认 300ms
 * // 模板 @input="debouncedSearch.run()"
 * ```
 * 组件卸载 / effect scope 销毁时自动取消未执行的定时器，避免卸载后仍触发请求。
 */
export function useDebounce(fn: () => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined

  function run(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn()
    }, delay)
  }

  function cancel(): void {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  onScopeDispose(cancel)

  return { run, cancel }
}
