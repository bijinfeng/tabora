import { createSignal, For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Input } from "@tabora/ui"
import { Check, X } from "lucide-solid"

type TodoItem = { id: string; text: string; done: boolean }

export function TodoCard(props: WidgetViewProps) {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [input, setInput] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editText, setEditText] = createSignal("")

  const storageKey = "items"
  const inputId = () => `todo-input-${props.instanceId}`

  void props.data.get<TodoItem[]>(storageKey).then(async (saved) => {
    if (saved && saved.length > 0) {
      setItems(saved)
    } else {
      setItems([
        { id: "seed-layout", text: "复核 Dashboard / Focus 布局协议", done: true },
        { id: "seed-size", text: "补齐 widget 尺寸菜单与展开态", done: false },
        { id: "seed-settings", text: "清理插件设置中的导入导出后置项", done: false },
      ])
    }
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

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void addItem()
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void confirmEdit()
    if (e.key === "Escape") cancelEdit()
  }

  return (
    <div class="todo-widget">
      <Show when={items().length > 0} fallback={<div class="todo-empty">今天先写一件事</div>}>
        <ul class="todo-list">
          <For each={items()}>
            {(item) => (
              <li class="todo-item" classList={{ done: item.done }}>
                <Show
                  when={editingId() === item.id}
                  fallback={
                    <>
                      <Checkbox
                        checked={item.done}
                        aria-label={`标记 ${item.text} 完成`}
                        onChange={() => void toggleItem(item.id)}
                      />
                      <button
                        class="todo-text"
                        classList={{ done: item.done }}
                        type="button"
                        onClick={() => startEdit(item)}
                      >
                        {item.text}
                      </button>
                      <button
                        class="todo-delete"
                        aria-label={`删除 ${item.text}`}
                        type="button"
                        onClick={() => void removeItem(item.id)}
                      >
                        <X size={14} />
                      </button>
                    </>
                  }
                >
                  <div class="todo-edit-row">
                    <Input
                      size="sm"
                      value={editText()}
                      onInput={(value) => setEditText(value)}
                      onKeyDown={handleEditKeyDown}
                      aria-label={`编辑 ${item.text}`}
                    />
                    <button
                      class="todo-mini-btn"
                      aria-label="确认编辑"
                      type="button"
                      onClick={() => void confirmEdit()}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      class="todo-mini-btn"
                      aria-label="取消编辑"
                      type="button"
                      onClick={cancelEdit}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <div class="todo-add-form">
        <Input
          size="sm"
          id={inputId()}
          value={input()}
          onInput={(value) => setInput(value)}
          onKeyDown={handleKeyDown}
          placeholder="新任务..."
          aria-label="新待办内容"
        />
        <button
          class="todo-mini-btn"
          aria-label="添加待办"
          type="button"
          onClick={() => void addItem()}
        >
          添加
        </button>
      </div>
    </div>
  )
}
