import { Pagination as KPagination } from "@kobalte/core/pagination"
import { ChevronLeft, ChevronRight } from "lucide-solid"

export type PaginationProps = {
  page: number
  total: number
  onChange: (page: number) => void
  class?: string
}

export function Pagination(props: PaginationProps) {
  return (
    <div class={`tbr-pagination ${props.class ?? ""}`}>
      <KPagination
        page={props.page}
        count={props.total}
        onPageChange={props.onChange}
        itemComponent={(itemProps) => (
          <KPagination.Item page={itemProps.page} class="tbr-page-btn">
            {itemProps.page}
          </KPagination.Item>
        )}
        ellipsisComponent={() => (
          <KPagination.Ellipsis class="tbr-page-ellipsis">...</KPagination.Ellipsis>
        )}
        showFirst={false}
        showLast={false}
      >
        <KPagination.Previous class="tbr-page-btn" aria-label="上一页">
          <ChevronLeft size={16} strokeWidth={2} />
        </KPagination.Previous>
        <KPagination.Items />
        <KPagination.Next class="tbr-page-btn" aria-label="下一页">
          <ChevronRight size={16} strokeWidth={2} />
        </KPagination.Next>
      </KPagination>
    </div>
  )
}
