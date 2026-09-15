import { Pagination as KPagination } from "@kobalte/core/pagination"
import { Show, createEffect, createSignal } from "solid-js"
import type { JSX } from "solid-js"
import ChevronLeft from "lucide-solid/icons/chevron-left"
import ChevronRight from "lucide-solid/icons/chevron-right"

export type PaginationItemType = "page" | "prev" | "next" | "jump-prev" | "jump-next"

export type PaginationShowTotal = (total: number, range: [number, number]) => JSX.Element

type PaginationPageSizeOption = { value: string; label: string }

type PaginationPageSizeControlProps = {
  disabled: boolean
  options: PaginationPageSizeOption[]
  pageSize: number
  onChange: (pageSize: number) => void
}

type PaginationQuickJumperControlProps = {
  disabled: boolean
  goButton?: JSX.Element
  max: number
  onSubmit: (page: number) => void
}

type PaginationSimpleControlProps = {
  current: number
  disabled: boolean
  max: number
  readOnly: boolean
  onChange: (page: number) => void
}

type PaginationJumpControlProps = {
  disabled: boolean
  onClick: () => void
  type: Extract<PaginationItemType, "jump-prev" | "jump-next">
}

export type PaginationProps = {
  /** Controlled current page. `page` is retained as a compatibility alias. */
  current?: number
  page?: number
  defaultCurrent?: number
  defaultPage?: number
  /** Total number of records. Use `pageCount` when passing a page count directly. */
  total: number
  pageCount?: number
  pageSize?: number
  defaultPageSize?: number
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, pageSize: number) => void
  showSizeChanger?: boolean | { options?: Array<number | string> }
  pageSizeOptions?: Array<number | string>
  showQuickJumper?: boolean | { goButton?: JSX.Element }
  showLessItems?: boolean
  showPrevNextJumpers?: boolean
  showTitle?: boolean
  showTotal?: PaginationShowTotal
  hideOnSinglePage?: boolean
  disabled?: boolean
  simple?: boolean | { readOnly?: boolean }
  itemRender?: (page: number, type: PaginationItemType, originalElement: JSX.Element) => JSX.Element
  prevIcon?: JSX.Element
  nextIcon?: JSX.Element
  jumpPrevIcon?: JSX.Element
  jumpNextIcon?: JSX.Element
  align?: "start" | "center" | "end"
  responsive?: boolean
  size?: "default" | "small" | "large"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  pageButtonClass?: string | undefined
  pageButtonStyle?: JSX.CSSProperties | undefined
  pageButtonActiveClass?: string | undefined
  pageButtonActiveStyle?: JSX.CSSProperties | undefined
  ellipsisClass?: string | undefined
  ellipsisStyle?: JSX.CSSProperties | undefined
}

type PaginationPrimitiveProps = PaginationProps & {
  totalClass?: string | undefined
  renderPageSizeControl?: (props: PaginationPageSizeControlProps) => JSX.Element
  renderQuickJumperControl?: (props: PaginationQuickJumperControlProps) => JSX.Element
  renderSimpleControl?: (props: PaginationSimpleControlProps) => JSX.Element
  renderJumpControl?: (props: PaginationJumpControlProps) => JSX.Element
}

export function Pagination(props: PaginationPrimitiveProps) {
  const [uncontrolledPage, setUncontrolledPage] = createSignal(
    props.defaultCurrent ?? props.defaultPage ?? 1,
  )
  const [uncontrolledPageSize, setUncontrolledPageSize] = createSignal(
    props.defaultPageSize ?? props.pageSize ?? 10,
  )
  const isPageControlled = () => props.current !== undefined || props.page !== undefined
  const requestedPage = () => Math.max(1, props.current ?? props.page ?? uncontrolledPage())
  const currentPageSize = () => Math.max(1, props.pageSize ?? uncontrolledPageSize())
  const pageCount = () =>
    Math.max(1, props.pageCount ?? Math.ceil(Math.max(0, props.total) / currentPageSize()))
  const currentPage = () => Math.min(requestedPage(), pageCount())
  const setPage = (nextPage: number, nextPageSize = currentPageSize()) => {
    const next = Math.min(Math.max(1, nextPage), pageCount())
    if (!isPageControlled()) setUncontrolledPage(next)
    props.onChange?.(next, nextPageSize)
  }
  const setPageSize = (nextPageSize: number) => {
    const nextSize = Math.max(1, nextPageSize)
    if (props.pageSize === undefined) setUncontrolledPageSize(nextSize)
    const nextPage = Math.min(
      currentPage(),
      Math.max(1, props.pageCount ?? Math.ceil(props.total / nextSize)),
    )
    if (!isPageControlled()) setUncontrolledPage(nextPage)
    props.onShowSizeChange?.(nextPage, nextSize)
    props.onChange?.(nextPage, nextSize)
  }
  let ellipsisIndex = 0
  createEffect(() => {
    currentPage()
    ellipsisIndex = 0
  })
  const pageButtonClass = (page?: number) =>
    [props.pageButtonClass, page === currentPage() ? props.pageButtonActiveClass : undefined]
      .filter(Boolean)
      .join(" ")
  const pageButtonStyle = (page?: number) =>
    page === currentPage()
      ? { ...props.pageButtonStyle, ...props.pageButtonActiveStyle }
      : props.pageButtonStyle
  const renderItem = (page: number, type: PaginationItemType, element: JSX.Element) =>
    props.itemRender?.(page, type, element) ?? element

  const options = () =>
    (
      props.pageSizeOptions ??
      (typeof props.showSizeChanger === "object" ? props.showSizeChanger.options : undefined) ?? [
        10, 20, 50, 100,
      ]
    ).map((option) => ({
      value: String(option),
      label: `${option} / 页`,
    }))

  return (
    <Show when={!(props.hideOnSinglePage && pageCount() <= 1)}>
      <div
        class={props.class}
        style={props.style}
        data-tbr-pagination
        data-size={props.size ?? "default"}
        data-simple={props.simple ? "" : undefined}
        data-align={props.align}
        data-responsive={props.responsive ? "" : undefined}
      >
        <Show when={props.showTotal}>
          {(showTotal) => {
            const from = props.total === 0 ? 0 : (currentPage() - 1) * currentPageSize() + 1
            const to = Math.min(currentPage() * currentPageSize(), props.total)
            return (
              <span class={props.totalClass} data-pagination-total>
                {showTotal()(props.total, [from, to])}
              </span>
            )
          }}
        </Show>
        <Show when={props.showSizeChanger}>
          {props.renderPageSizeControl?.({
            disabled: props.disabled ?? false,
            options: options(),
            pageSize: currentPageSize(),
            onChange: setPageSize,
          })}
        </Show>
        <Show when={props.simple}>
          {props.renderSimpleControl?.({
            current: currentPage(),
            disabled: props.disabled ?? false,
            max: pageCount(),
            readOnly: typeof props.simple === "object" && props.simple.readOnly === true,
            onChange: setPage,
          })}
        </Show>
        <Show when={!props.simple}>
          <KPagination
            page={currentPage()}
            count={pageCount()}
            onPageChange={setPage}
            siblingCount={props.showLessItems ? 1 : 2}
            showFirst
            showLast
            fixedItems
            disabled={props.disabled ?? false}
            itemComponent={(itemProps) => (
              <KPagination.Item
                page={itemProps.page}
                class={pageButtonClass(itemProps.page)}
                style={pageButtonStyle(itemProps.page)}
                title={props.showTitle === false ? undefined : `第 ${itemProps.page} 页`}
              >
                {renderItem(itemProps.page, "page", <>{itemProps.page}</>)}
              </KPagination.Item>
            )}
            ellipsisComponent={() => {
              const type: PaginationItemType = ellipsisIndex++ === 0 ? "jump-prev" : "jump-next"
              const jump = type === "jump-prev" ? -5 : 5
              const element =
                props.showPrevNextJumpers !== false ? (
                  (props.renderJumpControl?.({
                    disabled: props.disabled ?? false,
                    onClick: () => setPage(currentPage() + jump),
                    type,
                  }) ?? (
                    <KPagination.Ellipsis class={props.ellipsisClass} style={props.ellipsisStyle}>
                      •••
                    </KPagination.Ellipsis>
                  ))
                ) : (
                  <span class={props.ellipsisClass} style={props.ellipsisStyle}>
                    •••
                  </span>
                )
              return renderItem(currentPage(), type, element)
            }}
          >
            <KPagination.Previous
              class={pageButtonClass()}
              style={pageButtonStyle()}
              aria-label="上一页"
              title={props.showTitle === false ? undefined : "上一页"}
            >
              {renderItem(
                currentPage() - 1,
                "prev",
                props.prevIcon ?? <ChevronLeft size={16} strokeWidth={2} />,
              )}
            </KPagination.Previous>
            <KPagination.Items />
            <KPagination.Next
              class={pageButtonClass()}
              style={pageButtonStyle()}
              aria-label="下一页"
              title={props.showTitle === false ? undefined : "下一页"}
            >
              {renderItem(
                currentPage() + 1,
                "next",
                props.nextIcon ?? <ChevronRight size={16} strokeWidth={2} />,
              )}
            </KPagination.Next>
          </KPagination>
        </Show>
        <Show when={props.showQuickJumper}>
          {props.renderQuickJumperControl?.({
            disabled: props.disabled ?? false,
            goButton:
              typeof props.showQuickJumper === "object"
                ? props.showQuickJumper.goButton
                : undefined,
            max: pageCount(),
            onSubmit: setPage,
          })}
        </Show>
      </div>
    </Show>
  )
}
