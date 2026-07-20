import { Pagination as KPagination } from "@kobalte/core/pagination"
import type { JSX } from "solid-js"
import { ChevronLeft, ChevronRight } from "lucide-solid"

export type PaginationProps = {
  page: number
  total: number
  onChange: (page: number) => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  pageButtonClass?: string | undefined
  pageButtonStyle?: JSX.CSSProperties | undefined
  pageButtonActiveClass?: string | undefined
  pageButtonActiveStyle?: JSX.CSSProperties | undefined
  ellipsisClass?: string | undefined
  ellipsisStyle?: JSX.CSSProperties | undefined
}

export function Pagination(props: PaginationProps) {
  const pageButtonClass = (page?: number) =>
    [props.pageButtonClass, page === props.page ? props.pageButtonActiveClass : undefined]
      .filter(Boolean)
      .join(" ")
  const pageButtonStyle = (page?: number) =>
    page === props.page
      ? { ...props.pageButtonStyle, ...props.pageButtonActiveStyle }
      : props.pageButtonStyle

  return (
    <div class={props.class} style={props.style}>
      <KPagination
        page={props.page}
        count={props.total}
        onPageChange={props.onChange}
        itemComponent={(itemProps) => (
          <KPagination.Item
            page={itemProps.page}
            class={pageButtonClass(itemProps.page)}
            style={pageButtonStyle(itemProps.page)}
          >
            {itemProps.page}
          </KPagination.Item>
        )}
        ellipsisComponent={() => (
          <KPagination.Ellipsis class={props.ellipsisClass} style={props.ellipsisStyle}>
            ...
          </KPagination.Ellipsis>
        )}
        showFirst={false}
        showLast={false}
      >
        <KPagination.Previous
          class={pageButtonClass()}
          style={pageButtonStyle()}
          aria-label="上一页"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </KPagination.Previous>
        <KPagination.Items />
        <KPagination.Next class={pageButtonClass()} style={pageButtonStyle()} aria-label="下一页">
          <ChevronRight size={16} strokeWidth={2} />
        </KPagination.Next>
      </KPagination>
    </div>
  )
}
