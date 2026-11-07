import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * 首屏列表刷入开关：只在首次拿到非空数据时激活一次。
 *
 * 用「数据条数」而不是各页各不相同的 loading 字段做判定，原因：
 * - 表格行在数据赋值后才存在，class 必须等 DOM 更新后再加，故 flush: 'post'；
 * - armed 消费后不再复位，筛选 / 翻页 / 轮询 / 增删行都不会重播；
 * - 父组件透传 loading 的子表也能直接接入。
 *
 * @param count 返回当前列表条数的取值函数
 * @param cleanupMs 动画类回收延时，默认 2200ms（与既有列表刷入一致）
 */
export function useFirstLoadStagger(count: () => number, cleanupMs = 2200) {
  const active = ref(false)
  let armed = true
  let timer: number | null = null

  function stop() {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    active.value = false
  }

  watch(
    count,
    (n) => {
      if (!armed || n <= 0) return
      armed = false
      active.value = true
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        active.value = false
        timer = null
      }, cleanupMs)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(stop)

  return active
}
