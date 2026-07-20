import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Badge } from "../badge"
import { Pagination } from "./pagination.styled"

export function PaginationDemo() {
  const [page, setPage] = createSignal(2)

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>插件日志分页</strong>
        <span>适合浏览较长列表，同时保持当前筛选和上下文不丢失。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Badge variant="neutral">共 42 条</Badge>
        <span>当前查看第 {page()} 页</span>
      </div>
      <Pagination page={page()} total={5} onChange={setPage} />
    </div>
  )
}
