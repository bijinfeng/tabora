import * as stylex from "@stylexjs/stylex"
import { createSignal, For, Show, createMemo } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Input } from "@tabora/ui"
import { ChevronDown, ChevronRight, Plus } from "lucide-solid"
import { styles } from "./styles"

type Priority = "high" | "medium" | "low" | "none"

type TodoItem = {
  id: string
  text: string
  done: boolean
  priority: Priority
  dueDate?: string
  groupId: string
  assignee?: string
}

type TodoGroup = {
  id: string
  name: string
  collapsed: boolean
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
  none: "—",
}

const DEFAULT_GROUP_ID = "default"

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export function TodoExpand(props: WidgetViewProps) {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [groups, setGroups] = createSignal<TodoGroup[]>([
    { id: DEFAULT_GROUP_ID, name: "默认分组", collapsed: false },
  ])
  const [filter, setFilter] = createSignal<"todo" | "all">("todo")
  const [view, setView] = createSignal<"list" | "board">("list")
  const [addingGroupId, setAddingGroupId] = createSignal<string | null>(null)
  const [newTaskText, setNewTaskText] = createSignal("")
  const [addingGroup, setAddingGroup] = createSignal(false)
  const [newGroupName, setNewGroupName] = createSignal("")

  const storageKey = "v2_items"
  const groupsKey = "v2_groups"

  void Promise.all([
    props.data.get<TodoItem[]>(storageKey),
    props.data.get<TodoGroup[]>(groupsKey),
  ]).then(([savedItems, savedGroups]) => {
    if (savedGroups !== null && savedGroups !== undefined && savedGroups.length > 0) {
      setGroups(savedGroups)
    }

    if (savedItems !== null && savedItems !== undefined && savedItems.length > 0) {
      setItems(savedItems)
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
          assignee: "毕金风",
        },
        {
          id: "seed-3",
          text: "清理插件设置中的导入导出项",
          done: false,
          priority: "low",
          groupId: DEFAULT_GROUP_ID,
          assignee: "毕金风",
        },
      ])
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

  async function addTask(groupId: string) {
    const text = newTaskText().trim()
    if (!text) {
      setAddingGroupId(null)
      return
    }
    const next: TodoItem[] = [
      ...items(),
      {
        id: generateUUID(),
        text,
        done: false,
        priority: "none",
        groupId,
      },
    ]
    setItems(next)
    setNewTaskText("")
    setAddingGroupId(null)
    await persistItems(next)
  }

  async function addGroup() {
    const name = newGroupName().trim()
    if (!name) {
      setAddingGroup(false)
      return
    }
    const newGroup: TodoGroup = { id: generateUUID(), name, collapsed: false }
    const next = [...groups(), newGroup]
    setGroups(next)
    setNewGroupName("")
    setAddingGroup(false)
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
    if (!iso) return "—"
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  function isOverdue(iso?: string) {
    if (!iso) return false
    return new Date(iso) < new Date()
  }

  return (
    <div {...stylex.attrs(styles.expandRoot)} data-widget-expand="todo">
      <div {...stylex.attrs(styles.header)}>
        <span {...stylex.attrs(styles.title)}>待办</span>
        <button
          {...stylex.attrs(styles.primaryButton)}
          type="button"
          onClick={() => setAddingGroupId(DEFAULT_GROUP_ID)}
        >
          <Plus size={14} />
          新建任务
        </button>
      </div>

      <div {...stylex.attrs(styles.tabs)}>
        <button
          {...stylex.attrs(styles.tab, view() === "list" && styles.active)}
          type="button"
          onClick={() => setView("list")}
        >
          列表
        </button>
        <button
          {...stylex.attrs(styles.tab, view() === "board" && styles.active)}
          type="button"
          onClick={() => setView("board")}
        >
          看板
        </button>
      </div>

      <div {...stylex.attrs(styles.filters)}>
        <button
          {...stylex.attrs(styles.tab, filter() === "todo" && styles.active)}
          type="button"
          onClick={() => setFilter("todo")}
        >
          未完成
          <span {...stylex.attrs(styles.badge)}>{todoCount()}</span>
        </button>
        <button
          {...stylex.attrs(styles.tab, filter() === "all" && styles.active)}
          type="button"
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        <div {...stylex.attrs(styles.spacer)} />
        <button {...stylex.attrs(styles.toolButton)} type="button">
          排序
        </button>
        <button {...stylex.attrs(styles.toolButton)} type="button">
          分组
        </button>
        <button {...stylex.attrs(styles.toolButton)} type="button">
          字段
        </button>
      </div>

      <Show when={view() === "list"}>
        <div {...stylex.attrs(styles.tableHeader)}>
          <span />
          <span>任务标题</span>
          <span>优先级</span>
          <span>截止时间</span>
          <span>负责人</span>
        </div>

        <div {...stylex.attrs(styles.expandList)}>
          <For each={groups()}>
            {(group) => {
              const groupItems = createMemo(() => itemsByGroup().get(group.id) ?? [])
              return (
                <div {...stylex.attrs(styles.group)}>
                  <div
                    {...stylex.attrs(styles.groupHeader)}
                    onClick={() => void toggleGroup(group.id)}
                  >
                    <span {...stylex.attrs(styles.arrow)}>
                      {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <span {...stylex.attrs(styles.groupName)}>{group.name}</span>
                    <span {...stylex.attrs(styles.count)}>{groupItems().length}</span>
                  </div>

                  <Show when={!group.collapsed}>
                    <div>
                      <For each={groupItems()}>
                        {(item) => (
                          <div {...stylex.attrs(styles.expandRow, item.done && styles.done)}>
                            <div {...stylex.attrs(styles.cell)}>
                              <Checkbox
                                checked={item.done}
                                aria-label={`标记 ${item.text} 完成`}
                                onChange={() => void toggleItem(item.id)}
                              />
                            </div>
                            <div {...stylex.attrs(styles.cell, item.done && styles.textDone)}>
                              {item.text}
                            </div>
                            <div {...stylex.attrs(styles.cell)}>
                              <span
                                {...stylex.attrs(
                                  styles.priorityTag,
                                  item.priority === "high" && styles.priorityHigh,
                                  item.priority === "medium" && styles.priorityMedium,
                                  item.priority === "low" && styles.priorityLow,
                                )}
                              >
                                ● {PRIORITY_LABELS[item.priority]}
                              </span>
                            </div>
                            <div
                              {...stylex.attrs(
                                styles.cell,
                                isOverdue(item.dueDate) && styles.overdue,
                              )}
                            >
                              {formatDate(item.dueDate)}
                            </div>
                            <div {...stylex.attrs(styles.cell)}>
                              <Show when={item.assignee}>
                                <span {...stylex.attrs(styles.assignee)}>{item.assignee}</span>
                              </Show>
                            </div>
                          </div>
                        )}
                      </For>

                      <Show when={addingGroupId() === group.id}>
                        <div {...stylex.attrs(styles.addRow)}>
                          <Input
                            size="sm"
                            value={newTaskText()}
                            onInput={(v) => setNewTaskText(v)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void addTask(group.id)
                              if (e.key === "Escape") {
                                setAddingGroupId(null)
                                setNewTaskText("")
                              }
                            }}
                            placeholder="输入任务名称，回车确认..."
                            aria-label="新任务名称"
                          />
                        </div>
                      </Show>

                      <Show when={addingGroupId() !== group.id}>
                        <button
                          {...stylex.attrs(styles.addButton)}
                          type="button"
                          onClick={() => {
                            setAddingGroupId(group.id)
                            setNewTaskText("")
                          }}
                        >
                          <Plus size={12} />
                          新建任务
                        </button>
                      </Show>
                    </div>
                  </Show>
                </div>
              )
            }}
          </For>

          <Show when={addingGroup()}>
            <div {...stylex.attrs(styles.addRow)}>
              <Input
                size="sm"
                value={newGroupName()}
                onInput={(v) => setNewGroupName(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addGroup()
                  if (e.key === "Escape") {
                    setAddingGroup(false)
                    setNewGroupName("")
                  }
                }}
                placeholder="输入分组名称，回车确认..."
                aria-label="新分组名称"
              />
            </div>
          </Show>

          <button
            {...stylex.attrs(styles.addButton)}
            type="button"
            onClick={() => {
              setAddingGroup(true)
              setNewGroupName("")
            }}
          >
            <Plus size={12} />
            新建分组
          </button>
        </div>
      </Show>

      <Show when={view() === "board"}>
        <div {...stylex.attrs(styles.board)}>
          <p>看板视图占位，本期不实现</p>
        </div>
      </Show>
    </div>
  )
}
