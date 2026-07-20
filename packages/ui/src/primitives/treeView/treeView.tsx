import type { JSX } from "solid-js"
import { For, Show } from "solid-js"
import { ChevronRight } from "lucide-solid"

export type TreeViewItem = {
  id: string
  label: JSX.Element
  icon?: JSX.Element
  children?: TreeViewItem[]
}

export type TreeViewProps = {
  items: TreeViewItem[]
  expandedIds: string[]
  onExpandedChange: (ids: string[]) => void
  selectedId?: string
  onSelect?: (id: string) => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  rowClass?: string | undefined
  rowStyle?: JSX.CSSProperties | undefined
  rowSelectedClass?: string | undefined
  rowSelectedStyle?: JSX.CSSProperties | undefined
  toggleClass?: string | undefined
  toggleStyle?: JSX.CSSProperties | undefined
  toggleOpenClass?: string | undefined
  toggleOpenStyle?: JSX.CSSProperties | undefined
  toggleEmptyClass?: string | undefined
  toggleEmptyStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  "aria-label": string
}

function TreeNode(props: { item: TreeViewItem; root: TreeViewProps; level: number }) {
  const hasChildren = () => Boolean(props.item.children?.length)
  const expanded = () => props.root.expandedIds.includes(props.item.id)
  const selected = () => props.root.selectedId === props.item.id
  const toggle = () => {
    props.root.onExpandedChange(
      expanded()
        ? props.root.expandedIds.filter((id) => id !== props.item.id)
        : [...props.root.expandedIds, props.item.id],
    )
  }

  return (
    <div
      class={props.root.itemClass}
      style={props.root.itemStyle}
      role="treeitem"
      aria-expanded={hasChildren() ? expanded() : undefined}
    >
      <div
        class={[props.root.rowClass, selected() ? props.root.rowSelectedClass : undefined]
          .filter(Boolean)
          .join(" ")}
        data-selected={selected() ? "" : undefined}
        style={
          selected()
            ? {
                ...props.root.rowStyle,
                ...props.root.rowSelectedStyle,
                "padding-left": `${props.level * 16 + 8}px`,
              }
            : {
                ...props.root.rowStyle,
                "padding-left": `${props.level * 16 + 8}px`,
              }
        }
      >
        <button
          type="button"
          class={[
            props.root.toggleClass,
            expanded() ? props.root.toggleOpenClass : undefined,
            !hasChildren() ? props.root.toggleEmptyClass : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ...props.root.toggleStyle,
            ...(expanded() ? props.root.toggleOpenStyle : undefined),
            ...(!hasChildren() ? props.root.toggleEmptyStyle : undefined),
          }}
          data-empty={!hasChildren() ? "" : undefined}
          data-open={expanded() ? "" : undefined}
          aria-label={expanded() ? "折叠" : "展开"}
          onClick={toggle}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          class={props.root.labelClass}
          style={props.root.labelStyle}
          onClick={() => props.root.onSelect?.(props.item.id)}
        >
          <Show when={props.item.icon}>
            <span class={props.root.iconClass} style={props.root.iconStyle}>
              {props.item.icon}
            </span>
          </Show>
          {props.item.label}
        </button>
      </div>
      <Show when={hasChildren() && expanded()}>
        <div role="group">
          <For each={props.item.children}>
            {(child) => <TreeNode item={child} root={props.root} level={props.level + 1} />}
          </For>
        </div>
      </Show>
    </div>
  )
}

export function TreeView(props: TreeViewProps) {
  return (
    <div class={props.class} style={props.style} role="tree" aria-label={props["aria-label"]}>
      <For each={props.items}>{(item) => <TreeNode item={item} root={props} level={0} />}</For>
    </div>
  )
}
