import * as stylex from "@stylexjs/stylex"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useQuery } from "@tanstack/solid-query"
import type { JSX } from "solid-js"
import { createEffect, createSignal, onMount, Show } from "solid-js"

import { color, radius, space } from "@tabora/theme/tokens.stylex"
import {
  AdminDataTableToolbar,
  type AdminDataTableToolbar as AdminDataTableToolbarConfig,
} from "./AdminDataTableToolbar"
import { Pagination } from "./Pagination"
import { QueryState } from "./QueryState"
import { createDebounced } from "../utils/createDebounced"

const styles = stylex.create({
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
  },
  header: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    paddingBlock: space.s4,
    paddingInline: space.s5,
  },
  content: {
    minWidth: 0,
    overflowX: "auto",
  },
  footer: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    paddingBlock: space.s4,
    paddingInline: space.s5,
  },
  table: {
    borderRadius: 0,
    borderWidth: 0,
  },
})

type AdminDataTableRequestParams<TParams extends Record<string, string>> = TParams & {
  current: number
  pageSize: number
}

export type AdminDataTableRequestResult<T> = {
  data: T[]
  total: number
}

export type AdminDataTableActions = {
  reload: (resetPage?: boolean) => void
  reset: () => void
}

export type AdminDataTablePanelProps<T, TParams extends Record<string, string>> = {
  /** 与 ProTable 相同，由组件管理请求参数、加载态、数据和分页。 */
  request: (params: AdminDataTableRequestParams<TParams>) => Promise<AdminDataTableRequestResult<T>>
  queryKey: readonly unknown[]
  columns: TableColumn<T>[]
  rowKey: (row: T) => string
  toolbar?: AdminDataTableToolbarConfig<TParams>
  pageSize?: number
  debounceTime?: number
  errorMessage?: string
  empty: JSX.Element
  onRowClick?: (row: T) => void
  actionRef?: (actions: AdminDataTableActions) => void
  ariaLabel: string
}

/**
 * 管理后台的 ProTable 风格数据组件。
 * 筛选、筛选防抖、分页与 TanStack Query 均在组件内管理；页面仅提供字段、列和 request 映射。
 */
export function AdminDataTablePanel<T, TParams extends Record<string, string>>(
  props: AdminDataTablePanelProps<T, TParams>,
) {
  const pageSize = props.pageSize ?? 50
  const initialFilters = Object.fromEntries(
    (props.toolbar?.filters ?? []).map((filter) => [filter.key, filter.initialValue ?? ""]),
  ) as TParams
  const [filters, setFilters] = createSignal<TParams>(initialFilters)
  const debouncedFilters = createDebounced(filters, props.debounceTime ?? 300)
  const [offset, setOffset] = createSignal(0)

  const data = useQuery(() => ({
    queryKey: [...props.queryKey, { filters: debouncedFilters(), offset: offset(), pageSize }],
    queryFn: () =>
      props.request({
        ...debouncedFilters(),
        current: Math.floor(offset() / pageSize) + 1,
        pageSize,
      }),
  }))

  const actions: AdminDataTableActions = {
    reload: (resetPage = false) => {
      if (resetPage && offset() !== 0) {
        setOffset(0)
        return
      }
      void data.refetch()
    },
    reset: () => {
      setFilters(() => initialFilters)
      setOffset(0)
    },
  }

  onMount(() => props.actionRef?.(actions))

  const handleFilterChange = (key: keyof TParams & string, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setOffset(0)
  }

  const total = () => data.data?.total ?? 0
  const rows = () => data.data?.data ?? []

  createEffect(() => {
    if (rows().length > 0 || total() === 0 || offset() < total()) return
    setOffset(Math.floor((total() - 1) / pageSize) * pageSize)
  })

  return (
    <section {...stylex.attrs(styles.panel)}>
      <Show when={props.toolbar}>
        {(toolbar) => (
          <div {...stylex.attrs(styles.header)}>
            <AdminDataTableToolbar
              toolbar={toolbar()}
              values={filters()}
              onChange={handleFilterChange}
            />
          </div>
        )}
      </Show>
      <div {...stylex.attrs(styles.content)}>
        <QueryState
          error={data.error as Error | null}
          errorMessage={props.errorMessage ?? "加载列表失败"}
          loading={data.isPending}
          hasRows={rows().length > 0}
          empty={props.empty}
        >
          <Table
            columns={props.columns}
            rows={rows()}
            rowKey={props.rowKey}
            {...(props.onRowClick ? { onRowClick: props.onRowClick } : {})}
            aria-label={props.ariaLabel}
            xstyle={styles.table}
          />
        </QueryState>
      </div>
      <Show when={!data.error && total() > 0}>
        <div {...stylex.attrs(styles.footer)}>
          <Pagination
            offset={offset()}
            pageSize={pageSize}
            total={total()}
            onPrev={() => setOffset((value) => Math.max(0, value - pageSize))}
            onNext={() => setOffset((value) => value + pageSize)}
          />
        </div>
      </Show>
    </section>
  )
}
