import { createSignal, type Accessor } from "solid-js"

/**
 * 偏移分页状态：封装列表页共用的 offset 游标与上一页/下一页处理器。
 * `reset` 用于筛选或搜索变化时回到第一页。
 */
export function createOffsetPagination(pageSize: number): {
  offset: Accessor<number>
  onPrev: () => void
  onNext: () => void
  reset: () => void
} {
  const [offset, setOffset] = createSignal(0)
  return {
    offset,
    onPrev: () => setOffset((value) => Math.max(0, value - pageSize)),
    onNext: () => setOffset((value) => value + pageSize),
    reset: () => setOffset(0),
  }
}
