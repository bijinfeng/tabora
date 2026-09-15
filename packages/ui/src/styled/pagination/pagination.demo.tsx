import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { Pagination } from "./pagination.styled"

export function PaginationDemo() {
  const [page, setPage] = createSignal(2)
  const [pageSize, setPageSize] = createSignal(10)
  const [compactPage, setCompactPage] = createSignal(3)

  const handleChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>插件日志</strong>
        <span>翻页、切换每页条数或直接输入页码，筛选上下文保持不变。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">共 126 条</Badge>
        <span>
          第 {page()} 页，每页 {pageSize()} 条
        </span>
      </div>
      <Pagination
        current={page()}
        total={126}
        pageSize={pageSize()}
        showSizeChanger={{ options: [10, 20, 50] }}
        showQuickJumper
        showTotal={(total, [from, to]) => `${from}–${to} / 共 ${total} 条`}
        onChange={handleChange}
      />
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>紧凑视图</strong>
        <span>空间有限时使用 small + simple；可编辑页码便于快速定位。</span>
      </div>
      <Pagination
        current={compactPage()}
        total={75}
        pageSize={10}
        size="small"
        simple
        onChange={(nextPage) => setCompactPage(nextPage)}
      />
    </div>
  )
}
