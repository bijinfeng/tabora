import { createSignal, For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, Checkbox, EmptyState, Field, IconButton, Input, ListRow } from "@tabora/ui"

type TodoItem = { id: string; text: string; done: boolean }

export function TodoCard(props: WidgetViewProps) {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [input, setInput] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editText, setEditText] = createSignal("")

  const storageKey = "items"
  const inputId = () => `todo-input-${props.instanceId}`

  void props.data.get<TodoItem[]>(storageKey).then(async (saved) => {
    if (saved && saved.length > 0) setItems(saved)
  })

  async function persist(updated: TodoItem[]) {
    await props.data.save(storageKey, updated)
  }

  async function addItem() {
    const text = input().trim()
    if (!text) return
    const next: TodoItem[] = [...items(), { id: crypto.randomUUID(), text, done: false }]
    setItems(next)
    setInput("")
    await persist(next)
  }

  async function toggleItem(id: string) {
    const next = items().map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    setItems(next)
    await persist(next)
  }

  async function removeItem(id: string) {
    const next = items().filter((i) => i.id !== id)
    setItems(next)
    await persist(next)
  }

  function startEdit(item: TodoItem) {
    setEditingId(item.id)
    setEditText(item.text)
  }

  async function confirmEdit() {
    const id = editingId()
    if (!id) return
    const text = editText().trim()
    if (!text) {
      setEditingId(null)
      return
    }
    const next = items().map((i) => (i.id === id ? { ...i, text } : i))
    setItems(next)
    setEditingId(null)
    await persist(next)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function clearCompleted() {
    const next = items().filter((i) => !i.done)
    setItems(next)
    await persist(next)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void addItem()
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void confirmEdit()
    if (e.key === "Escape") cancelEdit()
  }

  const doneCount = () => items().filter((i) => i.done).length
  const activeCount = () => items().length - doneCount()

  return (
    <div class="todo-widget">
      <Field label="新待办" htmlFor={inputId()}>
        <div class="todo-input-row">
          <Input
            id={inputId()}
            value={input()}
            onInput={setInput}
            onKeyDown={handleKeyDown}
            placeholder="添加待办..."
            aria-label="新待办内容"
          />
          <IconButton aria-label="添加待办" variant="secondary" onClick={() => void addItem()}>
            +
          </IconButton>
        </div>
      </Field>
      <Show
        when={items().length > 0}
        fallback={<EmptyState title="还没有待办" description="今天先写一件事" />}
      >
        <ul class="todo-list">
          <For each={items()}>
            {(item) => (
              <li class="todo-item" classList={{ done: item.done }}>
                <Show
                  when={editingId() === item.id}
                  fallback={
                    <ListRow
                      leading={
                        <Checkbox
                          checked={item.done}
                          onChange={() => void toggleItem(item.id)}
                          aria-label={`标记 ${item.text} 完成`}
                        />
                      }
                      primary={<span class="todo-item-text">{item.text}</span>}
                      trailing={
                        <div class="todo-item-actions">
                          <IconButton
                            aria-label={`编辑 ${item.text}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(item)}
                          >
                            ✎
                          </IconButton>
                          <IconButton
                            aria-label={`删除 ${item.text}`}
                            variant="danger"
                            size="sm"
                            onClick={() => void removeItem(item.id)}
                          >
                            ×
                          </IconButton>
                        </div>
                      }
                    />
                  }
                >
                  <div class="todo-edit-row">
                    <Input
                      value={editText()}
                      onInput={setEditText}
                      onKeyDown={handleEditKeyDown}
                      aria-label={`编辑 ${item.text}`}
                      size="sm"
                    />
                    <IconButton
                      aria-label="确认编辑"
                      variant="secondary"
                      size="sm"
                      onClick={() => void confirmEdit()}
                    >
                      ✓
                    </IconButton>
                    <IconButton
                      aria-label="取消编辑"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      ×
                    </IconButton>
                  </div>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={items().length > 0}>
        <div class="todo-footer">
          <span>
            {activeCount()} 剩余 · {doneCount()}/{items().length} 完成
          </span>
          <Show when={doneCount() > 0}>
            <Button variant="ghost" size="sm" onClick={() => void clearCompleted()}>
              清空已完成
            </Button>
          </Show>
        </div>
      </Show>
    </div>
  )
}
