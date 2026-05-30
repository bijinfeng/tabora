import { createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Field, IconButton, Input, ListRow } from "@tabora/ui"

type QuickLink = {
  id: string
  title: string
  url: string
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function getDefaultLinks(config: Record<string, unknown>): QuickLink[] {
  if (Array.isArray(config.links) && config.links.length > 0) {
    return (config.links as Array<{ title: string; url: string }>).map((link) => ({
      id: crypto.randomUUID(),
      title: link.title,
      url: link.url,
    }))
  }
  return [
    { id: crypto.randomUUID(), title: "GitHub", url: "https://github.com" },
    { id: crypto.randomUUID(), title: "Vite+", url: "https://viteplus.dev" },
  ]
}

export function QuickLinksCard(props: WidgetViewProps) {
  const [links, setLinks] = createSignal<QuickLink[]>([])
  const [editing, setEditing] = createSignal(false)
  const [newTitle, setNewTitle] = createSignal("")
  const [newUrl, setNewUrl] = createSignal("")
  const [editId, setEditId] = createSignal<string | null>(null)
  const [editTitle, setEditTitle] = createSignal("")
  const [editUrl, setEditUrl] = createSignal("")
  const [urlError, setUrlError] = createSignal<string | null>(null)

  const storageKey = "quick-links"

  onMount(async () => {
    let saved = await props.data.get<QuickLink[]>(storageKey)
    if (!saved || saved.length === 0) {
      saved = getDefaultLinks(props.config)
      await props.data.save(storageKey, saved)
    }
    setLinks(saved)
  })

  async function persist(updated: QuickLink[]) {
    await props.data.save(storageKey, updated)
    setLinks(updated)
  }

  function startAdd() {
    setEditing(true)
    setNewTitle("")
    setNewUrl("")
    setUrlError(null)
  }

  async function confirmAdd() {
    const title = newTitle().trim()
    const url = newUrl().trim()
    if (!title) return
    if (!isValidUrl(url)) {
      setUrlError("请输入有效的 https:// URL")
      return
    }
    setUrlError(null)
    const next = [...links(), { id: crypto.randomUUID(), title, url }]
    await persist(next)
    setEditing(false)
  }

  function cancelAdd() {
    setEditing(false)
    setUrlError(null)
  }

  function startEdit(link: QuickLink) {
    setEditId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
    setUrlError(null)
  }

  async function confirmEdit() {
    const id = editId()
    if (!id) return
    const title = editTitle().trim()
    const url = editUrl().trim()
    if (!title) return
    if (!isValidUrl(url)) {
      setUrlError("请输入有效的 https:// URL")
      return
    }
    setUrlError(null)
    const next = links().map((link) => (link.id === id ? { ...link, title, url } : link))
    await persist(next)
    setEditId(null)
  }

  function cancelEdit() {
    setEditId(null)
    setUrlError(null)
  }

  async function removeLink(id: string) {
    const next = links().filter((link) => link.id !== id)
    await persist(next)
  }

  async function moveLink(id: string, direction: "up" | "down") {
    const list = [...links()]
    const index = list.findIndex((link) => link.id === id)
    if (index === -1) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    ;[list[index], list[targetIndex]] = [list[targetIndex]!, list[index]!]
    await persist(list)
  }

  return (
    <div class="quick-links">
      <ul class="quick-links-list">
        <For each={links()}>
          {(link, index) => (
            <li class="quick-link-item">
              <Show
                when={editId() === link.id}
                fallback={
                  <div class="quick-link-row">
                    <a class="quick-link-anchor" href={link.url} target="_blank" rel="noreferrer">
                      <ListRow primary={link.title} secondary={link.url} />
                    </a>
                    <div class="quick-link-actions">
                      <IconButton
                        aria-label="上移"
                        size="sm"
                        variant="ghost"
                        onClick={() => void moveLink(link.id, "up")}
                        disabled={index() === 0}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        aria-label="下移"
                        size="sm"
                        variant="ghost"
                        onClick={() => void moveLink(link.id, "down")}
                        disabled={index() === links().length - 1}
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        aria-label={`编辑 ${link.title}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(link)}
                      >
                        ✎
                      </IconButton>
                      <IconButton
                        aria-label={`删除 ${link.title}`}
                        size="sm"
                        variant="danger"
                        onClick={() => void removeLink(link.id)}
                      >
                        ×
                      </IconButton>
                    </div>
                  </div>
                }
              >
                <div class="quick-link-edit-form">
                  <div class="quick-link-edit-fields">
                    <Input
                      value={editTitle()}
                      onInput={setEditTitle}
                      placeholder="标题"
                      aria-label="编辑链接标题"
                      size="sm"
                    />
                    <Input
                      value={editUrl()}
                      onInput={setEditUrl}
                      placeholder="https://..."
                      aria-label="编辑链接地址"
                      size="sm"
                    />
                  </div>
                  <div class="quick-link-edit-actions">
                    <IconButton
                      aria-label="确认编辑"
                      size="sm"
                      variant="secondary"
                      onClick={() => void confirmEdit()}
                    >
                      ✓
                    </IconButton>
                    <IconButton
                      aria-label="取消编辑"
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      ×
                    </IconButton>
                  </div>
                </div>
              </Show>
            </li>
          )}
        </For>
      </ul>
      <Show when={urlError()}>
        <div class="quick-link-error" role="alert">
          {urlError()}
        </div>
      </Show>
      <Show
        when={editing()}
        fallback={
          <button class="quick-link-add-btn" onClick={startAdd}>
            + 添加快捷入口
          </button>
        }
      >
        <div class="quick-link-add-form">
          <Field label="标题" htmlFor={`ql-title-${props.instanceId}`}>
            <Input
              id={`ql-title-${props.instanceId}`}
              value={newTitle()}
              onInput={setNewTitle}
              placeholder="链接标题"
              aria-label="新链接标题"
              size="sm"
            />
          </Field>
          <Field label="URL" htmlFor={`ql-url-${props.instanceId}`}>
            <Input
              id={`ql-url-${props.instanceId}`}
              value={newUrl()}
              onInput={setNewUrl}
              placeholder="https://..."
              aria-label="新链接地址"
              size="sm"
            />
          </Field>
          <div class="quick-link-add-actions">
            <IconButton aria-label="确认添加" variant="secondary" onClick={() => void confirmAdd()}>
              ✓
            </IconButton>
            <IconButton aria-label="取消添加" variant="ghost" onClick={cancelAdd}>
              ×
            </IconButton>
          </div>
        </div>
      </Show>
    </div>
  )
}
