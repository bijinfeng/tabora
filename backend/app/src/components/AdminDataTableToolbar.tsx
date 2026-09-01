import * as stylex from "@stylexjs/stylex"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import type { SelectOption } from "@tabora/ui/select"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

import { color, font, space } from "@tabora/theme/tokens.stylex"

type FilterBase<TParams extends Record<string, string>> = {
  key: keyof TParams & string
  label?: string
  ariaLabel: string
  grow?: boolean
  initialValue?: string
}

export type AdminDataTableTextFilter<TParams extends Record<string, string>> =
  FilterBase<TParams> & {
    kind: "text"
    placeholder?: string
    leadingIcon?: JSX.Element
    clearable?: boolean
  }

export type AdminDataTableSelectFilter<TParams extends Record<string, string>> =
  FilterBase<TParams> & {
    kind: "select"
    options: SelectOption<string>[]
    placeholder?: string
  }

export type AdminDataTableFilter<TParams extends Record<string, string>> =
  | AdminDataTableTextFilter<TParams>
  | AdminDataTableSelectFilter<TParams>

export type AdminDataTableToolbar<TParams extends Record<string, string>> = {
  /** 表单筛选会展示标签并自动换行；行内筛选用于搜索框和快捷筛选。 */
  layout?: "form" | "inline"
  filters?: AdminDataTableFilter<TParams>[]
  actions?: JSX.Element
  notice?: JSX.Element
}

const styles = stylex.create({
  toolbar: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: space.s3,
  },
  form: {
    display: "grid",
    gap: space.s3,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  filter: {
    minWidth: 180,
  },
  filterGrow: {
    flex: 1,
    maxWidth: 360,
  },
  formFilter: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  label: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: font.medium,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    marginInlineStart: "auto",
  },
  notice: {
    paddingBlockStart: space.s3,
  },
})

function FilterControl<TParams extends Record<string, string>>(props: {
  filter: AdminDataTableFilter<TParams>
  value: string
  onChange: (value: string) => void
}) {
  const filterStyle = () => (props.filter.grow ? [styles.filter, styles.filterGrow] : styles.filter)

  return (
    <Show
      when={props.filter.kind === "text"}
      fallback={
        <Select
          value={props.value}
          onChange={props.onChange}
          options={(props.filter as AdminDataTableSelectFilter<TParams>).options}
          {...((props.filter as AdminDataTableSelectFilter<TParams>).placeholder
            ? { placeholder: (props.filter as AdminDataTableSelectFilter<TParams>).placeholder }
            : {})}
          aria-label={props.filter.ariaLabel}
          xstyle={filterStyle()}
        />
      }
    >
      <Input
        value={props.value}
        onInput={props.onChange}
        {...((props.filter as AdminDataTableTextFilter<TParams>).placeholder
          ? { placeholder: (props.filter as AdminDataTableTextFilter<TParams>).placeholder }
          : {})}
        {...((props.filter as AdminDataTableTextFilter<TParams>).leadingIcon
          ? { leadingIcon: (props.filter as AdminDataTableTextFilter<TParams>).leadingIcon }
          : {})}
        {...((props.filter as AdminDataTableTextFilter<TParams>).clearable
          ? { clearable: true }
          : {})}
        aria-label={props.filter.ariaLabel}
        xstyle={filterStyle()}
      />
    </Show>
  )
}

export function AdminDataTableToolbar<TParams extends Record<string, string>>(props: {
  toolbar: AdminDataTableToolbar<TParams>
  values: TParams
  onChange: (key: keyof TParams & string, value: string) => void
}) {
  const isForm = () => props.toolbar.layout === "form"

  return (
    <>
      <div {...stylex.attrs(isForm() ? styles.form : styles.toolbar)}>
        <For each={props.toolbar.filters ?? []}>
          {(filter) => (
            <div {...stylex.attrs(isForm() ? styles.formFilter : undefined)}>
              <Show when={isForm() && filter.label}>
                <label {...stylex.attrs(styles.label)}>{filter.label}</label>
              </Show>
              <FilterControl
                filter={filter}
                value={props.values[filter.key] ?? ""}
                onChange={(value) => props.onChange(filter.key, value)}
              />
            </div>
          )}
        </For>
        <Show when={props.toolbar.actions}>
          <div {...stylex.attrs(styles.actions)}>{props.toolbar.actions}</div>
        </Show>
      </div>
      <Show when={props.toolbar.notice}>
        <div {...stylex.attrs(styles.notice)}>{props.toolbar.notice}</div>
      </Show>
    </>
  )
}
