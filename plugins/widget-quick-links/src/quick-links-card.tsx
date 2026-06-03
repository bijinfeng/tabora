import { createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"

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
  const visibleLinks = () => links().slice(0, 6)

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
      <ul class="link-grid" aria-label="快捷入口">
        <For each={visibleLinks()}>
          {(link, index) => (
            <li class="link-item">
              <Show
                when={editId() === link.id}
                fallback={
                  <>
                    <a class="link-anchor" href={link.url} target="_blank" rel="noreferrer">
                      <span class="link-icon">{link.title.slice(0, 1).toUpperCase()}</span>
                      <span class="link-label">{link.title}</span>
                    </a>
                    <div class="link-actions">
                      <button
                        class="link-mini-btn"
                        aria-label="上移"
                        type="button"
                        onClick={() => void moveLink(link.id, "up")}
                        disabled={index() === 0}
                      >
                        ↑
                      </button>
                      <button
                        class="link-mini-btn"
                        aria-label="下移"
                        type="button"
                        onClick={() => void moveLink(link.id, "down")}
                        disabled={index() === links().length - 1}
                      >
                        ↓
                      </button>
                      <button
                        class="link-mini-btn"
                        aria-label={`编辑 ${link.title}`}
                        type="button"
                        onClick={() => startEdit(link)}
                      >
                        ✎
                      </button>
                      <button
                        class="link-mini-btn link-delete"
                        aria-label={`删除 ${link.title}`}
                        type="button"
                        onClick={() => void removeLink(link.id)}
                      >
                        ×
                      </button>
                    </div>
                  </>
                }
              >
                <div class="quick-link-edit-form">
                  <div class="quick-link-edit-fields">
                    <input
                      value={editTitle()}
                      onInput={(event) => setEditTitle(event.currentTarget.value)}
                      placeholder="标题"
                      aria-label="编辑链接标题"
                    />
                    <input
                      value={editUrl()}
                      onInput={(event) => setEditUrl(event.currentTarget.value)}
                      placeholder="https://..."
                      aria-label="编辑链接地址"
                    />
                  </div>
                  <div class="quick-link-edit-actions">
                    <button
                      aria-label="确认编辑"
                      class="link-mini-btn"
                      type="button"
                      onClick={() => void confirmEdit()}
                    >
                      ✓
                    </button>
                    <button
                      aria-label="取消编辑"
                      class="link-mini-btn"
                      type="button"
                      onClick={cancelEdit}
                    >
                      ×
                    </button>
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
          <button class="quick-link-add-btn" type="button" onClick={startAdd}>
            + 添加快捷入口
          </button>
        }
      >
        <div class="quick-link-add-form">
          <input
            id={`ql-title-${props.instanceId}`}
            value={newTitle()}
            onInput={(event) => setNewTitle(event.currentTarget.value)}
            placeholder="链接标题"
            aria-label="新链接标题"
          />
          <input
            id={`ql-url-${props.instanceId}`}
            value={newUrl()}
            onInput={(event) => setNewUrl(event.currentTarget.value)}
            placeholder="https://..."
            aria-label="新链接地址"
          />
          <div class="quick-link-add-actions">
            <button
              aria-label="确认添加"
              class="link-mini-btn"
              type="button"
              onClick={() => void confirmAdd()}
            >
              ✓
            </button>
            <button aria-label="取消添加" class="link-mini-btn" type="button" onClick={cancelAdd}>
              ×
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}
