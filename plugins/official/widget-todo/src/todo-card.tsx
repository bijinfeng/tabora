import { createSignal, For, Show, createMemo } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Skeleton } from "@tabora/ui"
import { ChevronDown, ChevronRight, Circle, ArrowUpRight } from "lucide-solid"
import { styles, sx } from "./styles"

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
  const [loading, setLoading] = createSignal(true)

  const storageKey = "v2_items"
  const groupsKey = "v2_groups"

  void props.data.get<TodoItem[]>(storageKey).then(async (saved) => {
    if (saved !== null && saved !== undefined) {
      setItems(saved) // 使用保存的数据，即使是空数组
    } else {
      // 仅在从未保存过时才初始化种子数据
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
    setLoading(false)
  })

  void props.data.get<TodoGroup[]>(groupsKey).then(async (saved) => {
    if (saved !== null && saved !== undefined) {
      setGroups(saved)
    }
    // 不需要 else，已有默认值
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
      const existing = map.get(item.groupId) ?? []
      map.set(item.groupId, [...existing, item])
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
    const dueDate = new Date(iso)
    const today = new Date()
    // 只比较日期部分，忽略时间
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  }

  return (
    <div {...sx(styles.root)} data-todo-card>
      <div {...sx(styles.toolbar)}>
        <button
          {...sx(styles.tab, filter() === "todo" && styles.active)}
          type="button"
          onClick={() => setFilter("todo")}
        >
          未完成
          <span {...sx(styles.badge)}>{todoCount()}</span>
        </button>
        <button
          {...sx(styles.tab, filter() === "all" && styles.active)}
          type="button"
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        <div {...sx(styles.spacer)} />
        <button
          {...sx(styles.outlineButton)}
          data-todo-expand
          type="button"
          onClick={() => props.host.openExpand()}
        >
          展开 <ArrowUpRight size={12} />
        </button>
      </div>

      <div {...sx(styles.list)}>
        <Show
          when={!loading()}
          fallback={
            <div {...sx(styles.skeleton)}>
              <Skeleton height="24px" width="100%" />
              <Skeleton height="24px" width="90%" />
              <Skeleton height="24px" width="85%" />
            </div>
          }
        >
          <For each={groups()}>
            {(group) => {
              const groupItems = createMemo(() => itemsByGroup().get(group.id) ?? [])
              return (
                <Show when={groupItems().length > 0}>
                  <div {...sx(styles.group)}>
                    <div {...sx(styles.groupHeader)} onClick={() => void toggleGroup(group.id)}>
                      <span {...sx(styles.arrow)}>
                        {group.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      </span>
                      <span {...sx(styles.groupName)}>{group.name}</span>
                      <span {...sx(styles.count)}>{groupItems().length}</span>
                    </div>

                    <Show when={!group.collapsed}>
                      <div {...sx(styles.groupItems)}>
                        <For each={groupItems()}>
                          {(item) => (
                            <div {...sx(styles.item, item.done && styles.done)}>
                              <span
                                {...sx(styles.priorityDot)}
                                style={{ color: PRIORITY_COLORS[item.priority] }}
                              >
                                <Circle size={7} fill="currentColor" />
                              </span>
                              <Checkbox
                                checked={item.done}
                                aria-label={`标记 ${item.text} 完成`}
                                onChange={() => void toggleItem(item.id)}
                              />
                              <span {...sx(styles.text, item.done && styles.textDone)}>
                                {item.text}
                              </span>
                              <Show when={item.dueDate}>
                                <span
                                  {...sx(styles.due, isOverdue(item.dueDate) && styles.overdue)}
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
        </Show>
      </div>
    </div>
  )
}
