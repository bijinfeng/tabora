import { createSignal, createEffect, onCleanup, type Accessor } from "solid-js"

/**
 * 防抖信号：返回一个延迟 `delayMs` 毫秒后才跟随 `source` 变化的只读信号。
 * 用于搜索框等场景，避免逐字符触发查询。
 */
export function createDebounced<T>(source: Accessor<T>, delayMs: number): Accessor<T> {
  const [debounced, setDebounced] = createSignal<T>(source())

  createEffect(() => {
    const value = source()
    const timer = setTimeout(() => setDebounced(() => value), delayMs)
    onCleanup(() => clearTimeout(timer))
  })

  return debounced
}
