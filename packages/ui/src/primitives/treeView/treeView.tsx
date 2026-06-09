import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

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
  class?: string
  "aria-label": string
}

function TreeNode(props: { item: TreeViewItem; root: TreeViewProps; level: number }) {
  const hasChildren = () => Boolean(props.item.children?.length)
  const expanded = () => props.root.expandedIds.includes(props.item.id)
  const toggle = () => {
    props.root.onExpandedChange(
      expanded()
        ? props.root.expandedIds.filter((id) => id !== props.item.id)
        : [...props.root.expandedIds, props.item.id],
    )
  }

  return (
    <div
      class="tbr-tree-item"
      role="treeitem"
      aria-expanded={hasChildren() ? expanded() : undefined}
    >
      <div
        class="tbr-tree-row"
        data-selected={props.root.selectedId === props.item.id ? "" : undefined}
        style={{ "padding-left": `${props.level * 16 + 8}px` }}
      >
        <button
          type="button"
          class="tbr-tree-toggle"
          data-empty={!hasChildren() ? "" : undefined}
          data-open={expanded() ? "" : undefined}
          aria-label={expanded() ? "折叠" : "展开"}
          onClick={toggle}
        >
          ›
        </button>
        <button
          type="button"
          class="tbr-tree-label"
          onClick={() => props.root.onSelect?.(props.item.id)}
        >
          <Show when={props.item.icon}>
            <span class="tbr-tree-icon">{props.item.icon}</span>
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
    <div class={props.class} role="tree" aria-label={props["aria-label"]}>
      <For each={props.items}>{(item) => <TreeNode item={item} root={props} level={0} />}</For>
    </div>
  )
}
