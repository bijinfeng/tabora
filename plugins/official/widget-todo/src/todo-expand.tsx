import { createSignal, For, Show, createMemo } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Input } from "@tabora/ui"
import { ChevronDown, ChevronRight, Plus } from "lucide-solid"

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
    <div class="todo-expand-widget">
      <div class="expand-header">
        <span class="expand-title">待办</span>
        <button
          class="expand-new-btn"
          type="button"
          onClick={() => setAddingGroupId(DEFAULT_GROUP_ID)}
        >
          <Plus size={14} />
          新建任务
        </button>
      </div>

      <div class="expand-tabs">
        <button
          class="expand-tab"
          classList={{ active: view() === "list" }}
          type="button"
          onClick={() => setView("list")}
        >
          列表
        </button>
        <button
          class="expand-tab"
          classList={{ active: view() === "board" }}
          type="button"
          onClick={() => setView("board")}
        >
          看板
        </button>
      </div>

      <div class="expand-filters">
        <button
          class="expand-filter-btn"
          classList={{ active: filter() === "todo" }}
          type="button"
          onClick={() => setFilter("todo")}
        >
          未完成
          <span class="expand-count-badge">{todoCount()}</span>
        </button>
        <button
          class="expand-filter-btn"
          classList={{ active: filter() === "all" }}
          type="button"
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        <div class="expand-spacer" />
        <button class="expand-tool-btn" type="button">
          排序
        </button>
        <button class="expand-tool-btn" type="button">
          分组
        </button>
        <button class="expand-tool-btn" type="button">
          字段
        </button>
      </div>

      <Show when={view() === "list"}>
        <div class="expand-table-header">
          <span class="expand-th expand-th-check" />
          <span class="expand-th expand-th-title">任务标题</span>
          <span class="expand-th expand-th-priority">优先级</span>
          <span class="expand-th expand-th-due">截止时间</span>
          <span class="expand-th expand-th-assignee">负责人</span>
        </div>

        <div class="expand-list">
          <For each={groups()}>
            {(group) => {
              const groupItems = createMemo(() => itemsByGroup().get(group.id) ?? [])
              return (
                <div class="expand-group">
                  <div class="expand-group-header" onClick={() => void toggleGroup(group.id)}>
                    <span class="expand-group-arrow">
                      {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <span class="expand-group-name">{group.name}</span>
                    <span class="expand-group-count">{groupItems().length}</span>
                  </div>

                  <Show when={!group.collapsed}>
                    <div class="expand-group-items">
                      <For each={groupItems()}>
                        {(item) => (
                          <div class="expand-row" classList={{ done: item.done }}>
                            <div class="expand-cell expand-cell-check">
                              <Checkbox
                                checked={item.done}
                                aria-label={`标记 ${item.text} 完成`}
                                onChange={() => void toggleItem(item.id)}
                              />
                            </div>
                            <div class="expand-cell expand-cell-title">{item.text}</div>
                            <div class="expand-cell expand-cell-priority">
                              <span
                                class="expand-priority-tag"
                                classList={{
                                  "priority-high": item.priority === "high",
                                  "priority-medium": item.priority === "medium",
                                  "priority-low": item.priority === "low",
                                }}
                              >
                                ● {PRIORITY_LABELS[item.priority]}
                              </span>
                            </div>
                            <div
                              class="expand-cell expand-cell-due"
                              classList={{ overdue: isOverdue(item.dueDate) }}
                            >
                              {formatDate(item.dueDate)}
                            </div>
                            <div class="expand-cell expand-cell-assignee">
                              <Show when={item.assignee}>
                                <span class="expand-assignee">{item.assignee}</span>
                              </Show>
                            </div>
                          </div>
                        )}
                      </For>

                      <Show when={addingGroupId() === group.id}>
                        <div class="expand-add-row">
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
                          class="expand-add-task-btn"
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
            <div class="expand-add-row">
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
            class="expand-add-group-btn"
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
        <div class="expand-board-placeholder">
          <p>看板视图占位，本期不实现</p>
        </div>
      </Show>
    </div>
  )
}
