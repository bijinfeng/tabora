import { createSignal, For, Show } from "solid-js"
import { createPluginDataRepository, createTaboraDatabase } from "@tabora/storage"
import { Field, Input, IconButton, ListRow, Checkbox, EmptyState } from "@tabora/ui"

type TodoItem = { id: string; text: string; done: boolean }

const database = createTaboraDatabase()
const dataRepo = createPluginDataRepository(database)

export function TodoCard() {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [input, setInput] = createSignal("")

  void dataRepo.get<TodoItem[]>("todo", "items").then((saved: TodoItem[] | undefined) => {
    if (saved && saved.length > 0) setItems(saved)
  })

  async function persist(updated: TodoItem[]) {
    await dataRepo.save("todo", "items", updated)
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

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void addItem()
  }

  const doneCount = () => items().filter((i) => i.done).length

  return (
    <div class="todo-widget">
      <Field label="新待办" htmlFor="todo-input">
        <div class="todo-input-row">
          <Input
            id="todo-input"
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
                    <IconButton
                      aria-label={`删除 ${item.text}`}
                      variant="danger"
                      size="sm"
                      onClick={() => void removeItem(item.id)}
                    >
                      ×
                    </IconButton>
                  }
                />
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={items().length > 0}>
        <div class="todo-footer">
          {doneCount()}/{items().length} 完成
        </div>
      </Show>
    </div>
  )
}
