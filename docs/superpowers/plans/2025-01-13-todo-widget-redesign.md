# 待办插件重设计 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将待办插件从基础列表升级为带分组、优先级、截止日期的任务管理器，卡片轻量展示 + expand 弹窗完整交互

**架构：** TodoCard 瘦身为展示型组件（分组折叠 + 优先级圆点 + 勾选），新增 TodoExpand 完整视图（列表/看板切换、新建任务/分组、字段显示），两者共享 v2_items / v2_groups 数据结构

**技术栈：** SolidJS, @tabora/ui, @tabora/plugin-api, lucide-solid

---

## 文件结构

**修改：**

- `plugins/official/widget-todo/src/index.ts` — 注册 expand view
- `plugins/official/widget-todo/src/todo-card.tsx` — 瘦身为轻量卡片视图
- `plugins/official/widget-todo/src/styles.css` — 拆分卡片和弹窗样式
- `plugins/official/widget-todo/src/todo-card.test.tsx` — 更新测试用例

**创建：**

- `plugins/official/widget-todo/src/todo-expand.tsx` — 弹窗完整视图

---

## 任务 1：重构 todo-card.tsx 为轻量卡片视图

**文件：**

- 修改：`plugins/official/widget-todo/src/todo-card.tsx:1-174`

- [ ] **步骤 1：替换类型定义和数据结构**

将 todo-card.tsx 顶部的类型定义替换为：

```typescript
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
```

- [ ] **步骤 2：重写 TodoCard 组件为轻量视图**

替换整个 TodoCard 函数体为以下实现：

```typescript
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
```

- [ ] **步骤 3：运行类型检查**

```bash
cd /home/kebai/桌面/tabora/plugins/official/widget-todo
pnpm exec tsc --noEmit
```

预期：无类型错误

- [ ] **步骤 4：Commit 卡片重构**

```bash
git add plugins/official/widget-todo/src/todo-card.tsx
git commit -m "refactor(todo): 重构 TodoCard 为轻量卡片视图

- 添加分组、优先级、截止日期字段
- 移除编辑和删除交互（留给 expand）
- 添加展开按钮调用 openExpand()
- 使用 v2_items / v2_groups 存储键

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 2：创建 todo-expand.tsx 弹窗视图

**文件：**

- 创建：`plugins/official/widget-todo/src/todo-expand.tsx`

- [ ] **步骤 1：创建 todo-expand.tsx 文件头部**

创建文件并写入 imports 和类型定义：

```typescript
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

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "var(--tbr-color-danger)",
  medium: "var(--tbr-color-warning)",
  low: "var(--tbr-color-accent)",
  none: "var(--tbr-color-subtle)",
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
  none: "—",
}

const DEFAULT_GROUP_ID = "default"
```

- [ ] **步骤 2：编写 TodoExpand 组件主体（状态和数据加载）**

```typescript
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

  async function addTask(groupId: string) {
    const text = newTaskText().trim()
    if (!text) {
      setAddingGroupId(null)
      return
    }
    const next: TodoItem[] = [
      ...items(),
      {
        id: crypto.randomUUID(),
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
    const newGroup: TodoGroup = { id: crypto.randomUUID(), name, collapsed: false }
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
```

- [ ] **步骤 3：编写 TodoExpand JSX 返回结构**

```typescript
  return (
    <div class="todo-expand-widget">
      <div class="expand-header">
        <span class="expand-title">待办</span>
        <button class="expand-new-btn" type="button" onClick={() => setAddingGroupId(DEFAULT_GROUP_ID)}>
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
                                style={{
                                  color: PRIORITY_COLORS[item.priority],
                                  background: `rgb(from ${PRIORITY_COLORS[item.priority]} r g b / 0.1)`,
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
```

- [ ] **步骤 4：运行类型检查**

```bash
cd /home/kebai/桌面/tabora/plugins/official/widget-todo
pnpm exec tsc --noEmit
```

预期：无类型错误

- [ ] **步骤 5：Commit expand 视图**

```bash
git add plugins/official/widget-todo/src/todo-expand.tsx
git commit -m "feat(todo): 添加 TodoExpand 弹窗完整视图

- 列表/看板 tab 切换（看板暂占位）
- 未完成/全部过滤
- 分组折叠/展开
- 新建任务和分组
- 显示优先级、截止日期、负责人

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 3：注册 expand view

**文件：**

- 修改：`plugins/official/widget-todo/src/index.ts:1-33`

- [ ] **步骤 1：在 index.ts 中导入 TodoExpand**

修改 import 行：

```typescript
import { TodoCard, TodoExpand } from "./todo-card"
```

改为：

```typescript
import { TodoCard } from "./todo-card"
import { TodoExpand } from "./todo-expand"
```

- [ ] **步骤 2：在 manifest 中添加 expand view**

修改 views 字段：

```typescript
views: { card: "official.widgets.todo.card" },
```

改为：

```typescript
views: {
  card: "official.widgets.todo.card",
  expand: "official.widgets.todo.expand",
},
```

- [ ] **步骤 3：在 activate 中注册 expand view**

在 `context.registry.views.register("official.widgets.todo.card", TodoCard)` 后添加：

```typescript
context.registry.views.register("official.widgets.todo.expand", TodoExpand)
```

- [ ] **步骤 4：运行类型检查**

```bash
cd /home/kebai/桌面/tabora/plugins/official/widget-todo
pnpm exec tsc --noEmit
```

预期：无类型错误

- [ ] **步骤 5：Commit expand 注册**

```bash
git add plugins/official/widget-todo/src/index.ts
git commit -m "feat(todo): 注册 expand view

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 4：编写卡片样式

**文件：**

- 修改：`plugins/official/widget-todo/src/styles.css:1-end`

- [ ] **步骤 1：移除旧样式并添加卡片样式**

将 styles.css 内容替换为：

```css
/* ===== 卡片视图样式 ===== */
[data-tabora-plugin-id="official.widgets.todo"] .todo-card-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 10px 5px;
  border-bottom: 1px solid rgb(var(--tbr-color-line) / 0.5);
  flex-shrink: 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-tab:hover {
  background: rgb(var(--tbr-color-accent) / 0.06);
  color: rgb(var(--tbr-color-text));
}

[data-tabora-plugin-id="official.widgets.todo"] .card-tab.active {
  background: rgb(var(--tbr-color-accent) / 0.1);
  color: rgb(var(--tbr-color-accent));
  font-weight: 500;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgb(var(--tbr-color-accent) / 0.15);
  color: rgb(var(--tbr-color-accent));
  font-size: 10px;
  font-weight: 600;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-spacer {
  flex: 1;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-expand-btn {
  padding: 2px 8px;
  border: 1px solid rgb(var(--tbr-color-line));
  border-radius: 4px;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 100ms ease,
    color 100ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-expand-btn:hover {
  border-color: rgb(var(--tbr-color-accent));
  color: rgb(var(--tbr-color-accent));
}

[data-tabora-plugin-id="official.widgets.todo"] .card-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group {
  margin-bottom: 2px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 100ms ease;
  user-select: none;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-header:hover {
  background: rgb(var(--tbr-color-accent) / 0.04);
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-arrow {
  display: flex;
  align-items: center;
  color: rgb(var(--tbr-color-text-muted));
  flex-shrink: 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-name {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--tbr-color-text-secondary));
  flex: 1;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-count {
  font-size: 10px;
  color: rgb(var(--tbr-color-text-muted));
  background: rgb(var(--tbr-color-surface-soft));
  padding: 1px 5px;
  border-radius: 8px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-group-items {
  padding-left: 4px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 18px;
  border-radius: 4px;
  transition: background 100ms ease;
  min-height: 26px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-item:hover {
  background: rgb(var(--tbr-color-accent) / 0.04);
}

[data-tabora-plugin-id="official.widgets.todo"] .card-item.done {
  opacity: 0.55;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-priority-dot {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 10px;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-text {
  flex: 1;
  font-size: 12px;
  color: rgb(var(--tbr-color-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-text.done {
  color: rgb(var(--tbr-color-text-muted));
  text-decoration: line-through;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-due-date {
  font-size: 10px;
  color: rgb(var(--tbr-color-text-muted));
  flex-shrink: 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .card-due-date.overdue {
  color: rgb(var(--tbr-color-danger));
}
```

- [ ] **步骤 2：运行格式化检查**

```bash
cd /home/kebai/桌面/tabora
pnpm check:fix
```

预期：格式化通过

- [ ] **步骤 3：Commit 卡片样式**

```bash
git add plugins/official/widget-todo/src/styles.css
git commit -m "style(todo): 添加卡片视图样式

- 工具栏 tab 和展开按钮
- 分组折叠样式
- 优先级圆点和截止日期显示

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 5：编写 expand 样式

**文件：**

- 修改：`plugins/official/widget-todo/src/styles.css:end`

- [ ] **步骤 1：追加 expand 样式到 styles.css**

```bash
cat >> plugins/official/widget-todo/src/styles.css << 'EXPAND_STYLES_EOF'

/* ===== Expand 弹窗视图样式 ===== */
[data-tabora-plugin-id="official.widgets.todo"] .todo-expand-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 13px;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--tbr-color-line));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-new-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgb(var(--tbr-color-accent));
  color: rgb(var(--tbr-color-inverse));
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 120ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-new-btn:hover {
  opacity: 0.9;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 16px 0;
  border-bottom: 1px solid rgb(var(--tbr-color-line));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 120ms ease, border-color 120ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tab:hover {
  color: rgb(var(--tbr-color-text));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tab.active {
  color: rgb(var(--tbr-color-accent));
  border-bottom-color: rgb(var(--tbr-color-accent));
  font-weight: 500;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid rgb(var(--tbr-color-line) / 0.5);
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgb(var(--tbr-color-line));
  border-radius: 5px;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 100ms ease, background 100ms ease, color 100ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-filter-btn:hover {
  border-color: rgb(var(--tbr-color-accent));
  color: rgb(var(--tbr-color-text));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-filter-btn.active {
  background: rgb(var(--tbr-color-accent) / 0.1);
  border-color: rgb(var(--tbr-color-accent));
  color: rgb(var(--tbr-color-accent));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgb(var(--tbr-color-accent) / 0.15);
  color: rgb(var(--tbr-color-accent));
  font-size: 11px;
  font-weight: 600;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-spacer {
  flex: 1;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tool-btn {
  padding: 4px 10px;
  border: 1px solid rgb(var(--tbr-color-line));
  border-radius: 5px;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 100ms ease, color 100ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-tool-btn:hover {
  border-color: rgb(var(--tbr-color-accent));
  color: rgb(var(--tbr-color-accent));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-table-header {
  display: grid;
  grid-template-columns: 32px 1fr 80px 90px 100px;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid rgb(var(--tbr-color-line) / 0.5);
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-th {
  font-size: 11px;
  color: rgb(var(--tbr-color-text-muted));
  font-weight: 500;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group {
  margin-bottom: 4px;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 100ms ease;
  user-select: none;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-header:hover {
  background: rgb(var(--tbr-color-accent) / 0.04);
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-arrow {
  display: flex;
  align-items: center;
  color: rgb(var(--tbr-color-text-muted));
  flex-shrink: 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-name {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--tbr-color-text-secondary));
  flex: 1;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-count {
  font-size: 11px;
  color: rgb(var(--tbr-color-text-muted));
  background: rgb(var(--tbr-color-surface-soft));
  padding: 2px 6px;
  border-radius: 10px;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-group-items {
  padding-left: 0;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-row {
  display: grid;
  grid-template-columns: 32px 1fr 80px 90px 100px;
  gap: 8px;
  padding: 0 16px;
  align-items: center;
  min-height: 36px;
  border-bottom: 1px solid rgb(var(--tbr-color-line) / 0.3);
  cursor: pointer;
  transition: background 100ms ease;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-row:hover {
  background: rgb(var(--tbr-color-accent) / 0.03);
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-row.done {
  opacity: 0.5;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-cell {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-cell-check {
  display: flex;
  justify-content: center;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-cell-title {
  color: rgb(var(--tbr-color-text));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-priority-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-cell-due {
  font-size: 12px;
  color: rgb(var(--tbr-color-text-muted));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-cell-due.overdue {
  color: rgb(var(--tbr-color-danger));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-assignee {
  font-size: 12px;
  color: rgb(var(--tbr-color-text));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-add-row {
  padding: 8px 16px 8px 48px;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-add-task-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px 6px 48px;
  width: 100%;
  border: none;
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 5px;
  transition: background 100ms ease, color 100ms ease;
  text-align: left;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-add-task-btn:hover {
  background: rgb(var(--tbr-color-accent) / 0.04);
  color: rgb(var(--tbr-color-accent));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-add-group-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-top: 1px solid rgb(var(--tbr-color-line) / 0.5);
  background: transparent;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease;
  width: 100%;
  text-align: left;
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-add-group-btn:hover {
  background: rgb(var(--tbr-color-accent) / 0.04);
  color: rgb(var(--tbr-color-accent));
}

[data-tabora-plugin-id="official.widgets.todo"] .expand-board-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgb(var(--tbr-color-text-muted));
  font-size: 14px;
}
EXPAND_STYLES_EOF
```

- [ ] **步骤 2：运行格式化检查**

```bash
cd /home/kebai/桌面/tabora
pnpm check:fix
```

预期：格式化通过

- [ ] **步骤 3：Commit expand 样式**

```bash
git add plugins/official/widget-todo/src/styles.css
git commit -m "style(todo): 添加 expand 弹窗视图样式

- 头部、tab、过滤栏
- 表格列头和行样式
- 分组、新建任务/分组按钮
- 看板占位样式

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 6：更新测试用例

**文件：**

- 修改：`plugins/official/widget-todo/src/todo-card.test.tsx:37-54`

- [ ] **步骤 1：更新测试以匹配新的卡片实现**

替换测试内容为：

```typescript
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodoCard } from "./todo-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "todo-1",
    pluginId: "official.widgets.todo",
    contributionId: "todo",
    size: "M",
    supportedSizes: ["M", "L"],
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    host: {
      updateConfig: vi.fn().mockResolvedValue(undefined),
      removeInstance: vi.fn().mockResolvedValue(undefined),
      requestResize: vi.fn().mockResolvedValue(undefined),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(true),
    },
  }
}

describe("TodoCard", () => {
  async function flushMount() {
    await Promise.resolve()
    await Promise.resolve()
  }

  it("renders group header and filter tabs", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    expect(root.textContent).toContain("未完成")
    expect(root.textContent).toContain("全部")
    expect(root.textContent).toContain("默认分组")
    root.remove()
  })

  it("renders expand button", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const props = makeProps()
    render(() => <TodoCard {...props} />, root)
    const expandBtn = root.querySelector(".card-expand-btn")
    expect(expandBtn).toBeTruthy()
    expect(expandBtn?.textContent).toContain("展开")
    root.remove()
  })

  it("uses prototype default task copy", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("补齐 widget 尺寸菜单")
    expect(root.textContent).toContain("清理插件设置中的导入导出项")
    root.remove()
  })
})
```

- [ ] **步骤 2：运行测试**

```bash
cd /home/kebai/桌面/tabora/plugins/official/widget-todo
pnpm test
```

预期：所有测试通过

- [ ] **步骤 3：Commit 测试更新**

```bash
git add plugins/official/widget-todo/src/todo-card.test.tsx
git commit -m "test(todo): 更新测试以匹配新卡片实现

- 测试分组和过滤 tab 渲染
- 测试展开按钮
- 更新种子数据断言

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 任务 7：运行完整验收

**文件：**

- 无

- [ ] **步骤 1：运行类型检查**

```bash
cd /home/kebai/桌面/tabora
pnpm check
```

预期：无类型错误、格式问题、lint 错误

- [ ] **步骤 2：运行测试**

```bash
cd /home/kebai/桌面/tabora/plugins/official/widget-todo
pnpm test
```

预期：所有测试通过

- [ ] **步骤 3：手动验收**

启动开发服务器：

```bash
cd /home/kebai/桌面/tabora
pnpm dev
```

打开浏览器访问 Tabora，添加待办 widget，验证：

1. 卡片显示分组、优先级圆点、截止日期
2. 可勾选完成
3. 点击"展开"按钮打开弹窗
4. 弹窗中未完成/全部过滤生效
5. 分组可折叠/展开
6. 可新建任务和分组
7. 优先级、截止日期、负责人正确显示
8. 刷新后数据不丢失

- [ ] **步骤 4：最终 commit（如有遗漏修改）**

```bash
git status
# 如有遗漏文件，执行：
# git add <files>
# git commit -m "fix(todo): 修复遗漏问题"
```

---

## 规格覆盖自检

**卡片视图：**

- ✓ 分组折叠/展开 — 任务 1
- ✓ 优先级彩色圆点 — 任务 1
- ✓ 截止日期显示 — 任务 1
- ✓ 勾选完成 — 任务 1
- ✓ 展开按钮 — 任务 1
- ✓ 卡片样式 — 任务 4

**Expand 弹窗：**

- ✓ 列表/看板 tab — 任务 2
- ✓ 未完成/全部过滤 — 任务 2
- ✓ 工具栏按钮（UI 占位）— 任务 2
- ✓ 分组折叠/展开 — 任务 2
- ✓ 新建任务 — 任务 2
- ✓ 新建分组 — 任务 2
- ✓ 优先级 tag — 任务 2
- ✓ 截止日期 — 任务 2
- ✓ 负责人 — 任务 2
- ✓ Expand 样式 — 任务 5

**注册和测试：**

- ✓ 注册 expand view — 任务 3
- ✓ 更新测试 — 任务 6
- ✓ 验收 — 任务 7

**所有规格需求已覆盖。**
