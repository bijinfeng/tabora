import { createSignal, For, Show } from "solid-js"
import { createPluginDataRepository, createTaboraDatabase } from "@tabora/storage"

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
      <div class="todo-input-row">
        <input
          class="todo-input"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加待办..."
        />
        <button class="todo-add-btn" onClick={addItem}>
          +
        </button>
      </div>
      <ul class="todo-list">
        <For each={items()}>
          {(item) => (
            <li class="todo-item" classList={{ done: item.done }}>
              <label class="todo-label">
                <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                <span class="todo-text">{item.text}</span>
              </label>
              <button class="todo-del-btn" onClick={() => removeItem(item.id)}>
                ×
              </button>
            </li>
          )}
        </For>
      </ul>
      <Show when={items().length > 0}>
        <div class="todo-footer">
          {doneCount()}/{items().length} 完成
        </div>
      </Show>
    </div>
  )
}
