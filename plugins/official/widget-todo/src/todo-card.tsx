import { createSignal, For, Show, createMemo } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox } from "@tabora/ui"
import { ChevronDown, ChevronRight, Circle } from "lucide-solid"

type Priority = "high" | "medium" | "low" | "none"

type TodoItem = {
  id: string
  text: string
  done: boolean
  priority: Priority
  dueDate?: string
  groupId: string
}

type TodoGroup = {
  id: string
  name: string
  collapsed: boolean
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "var(--tbr-color-danger)",
  medium: "var(--tbr-color-warning)",
  low: "var(--tbr-color-accent)",
  none: "var(--tbr-color-subtle)",
}

const DEFAULT_GROUP_ID = "default"

export function TodoCard(props: WidgetViewProps) {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [groups, setGroups] = createSignal<TodoGroup[]>([
    { id: DEFAULT_GROUP_ID, name: "默认分组", collapsed: false },
  ])
  const [filter, setFilter] = createSignal<"todo" | "all">("todo")

  const storageKey = "v2_items"
  const groupsKey = "v2_groups"

  void props.data.get<TodoItem[]>(storageKey).then(async (saved) => {
    if (saved && saved.length > 0) {
      setItems(saved)
    } else {
      setItems([
        {
          id: "seed-1",
          text: "复核 Dashboard 布局协议",
          done: true,
          priority: "high",
          groupId: DEFAULT_GROUP_ID,
        },
        {
          id: "seed-2",
          text: "补齐 widget 尺寸菜单",
          done: false,
          priority: "medium",
          dueDate: "2025-12-31",
          groupId: DEFAULT_GROUP_ID,
        },
        {
          id: "seed-3",
          text: "清理插件设置中的导入导出项",
          done: false,
          priority: "low",
          groupId: DEFAULT_GROUP_ID,
        },
      ])
    }
  })

  void props.data.get<TodoGroup[]>(groupsKey).then(async (saved) => {
    if (saved && saved.length > 0) {
      setGroups(saved)
    }
  })

  async function persistItems(updated: TodoItem[]) {
    await props.data.save(storageKey, updated)
  }

  async function persistGroups(updated: TodoGroup[]) {
    await props.data.save(groupsKey, updated)
  }

  async function toggleItem(id: string) {
    const next = items().map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    setItems(next)
    await persistItems(next)
  }

  async function toggleGroup(groupId: string) {
    const next = groups().map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g))
    setGroups(next)
    await persistGroups(next)
  }

  const filteredItems = createMemo(() => {
    const all = items()
    if (filter() === "todo") return all.filter((i) => !i.done)
    return all
  })

  const itemsByGroup = createMemo(() => {
    const map = new Map<string, TodoItem[]>()
    for (const g of groups()) map.set(g.id, [])
    for (const item of filteredItems()) {
      if (!map.has(item.groupId)) {
        map.set(item.groupId, [])
      }
      map.get(item.groupId)!.push(item)
    }
    return map
  })

  const todoCount = createMemo(() => items().filter((i) => !i.done).length)

  function formatDate(iso?: string) {
    if (!iso) return ""
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  function isOverdue(iso?: string) {
    if (!iso) return false
    return new Date(iso) < new Date()
  }

  return (
    <div class="todo-card-widget">
      <div class="card-toolbar">
        <button
          class="card-tab"
          classList={{ active: filter() === "todo" }}
          type="button"
          onClick={() => setFilter("todo")}
        >
          未完成
          <span class="card-count-badge">{todoCount()}</span>
        </button>
        <button
          class="card-tab"
          classList={{ active: filter() === "all" }}
          type="button"
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        <div class="card-spacer" />
        <button class="card-expand-btn" type="button" onClick={() => props.host.openExpand()}>
          展开 ↗
        </button>
      </div>

      <div class="card-list">
        <For each={groups()}>
          {(group) => {
            const groupItems = createMemo(() => itemsByGroup().get(group.id) ?? [])
            return (
              <Show when={groupItems().length > 0}>
                <div class="card-group">
                  <div class="card-group-header" onClick={() => void toggleGroup(group.id)}>
                    <span class="card-group-arrow">
                      {group.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </span>
                    <span class="card-group-name">{group.name}</span>
                    <span class="card-group-count">{groupItems().length}</span>
                  </div>

                  <Show when={!group.collapsed}>
                    <div class="card-group-items">
                      <For each={groupItems()}>
                        {(item) => (
                          <div class="card-item" classList={{ done: item.done }}>
                            <span
                              class="card-priority-dot"
                              style={{ color: PRIORITY_COLORS[item.priority] }}
                            >
                              <Circle size={7} fill="currentColor" />
                            </span>
                            <Checkbox
                              checked={item.done}
                              aria-label={`标记 ${item.text} 完成`}
                              onChange={() => void toggleItem(item.id)}
                            />
                            <span class="card-text" classList={{ done: item.done }}>
                              {item.text}
                            </span>
                            <Show when={item.dueDate}>
                              <span
                                class="card-due-date"
                                classList={{ overdue: isOverdue(item.dueDate) }}
                              >
                                {formatDate(item.dueDate)}
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>
            )
          }}
        </For>
      </div>
    </div>
  )
}
