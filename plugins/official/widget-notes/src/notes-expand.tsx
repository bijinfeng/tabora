import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { DatePicker } from "@tabora/ui"
import { ChevronDown, Eye, List, Plus, Search, Star, Trash } from "lucide-solid"

type Note = {
  id: string
  content: string
  starred: boolean
  createdAt: string
  updatedAt: string
}

function uid(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(iso).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })
}

function extractTags(content: string): string[] {
  const matches = content.match(/#([\w\u4e00-\u9fff-]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((t) => t.toLowerCase().replace(/^#/, "")))]
}

function highlightText(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(new RegExp(`(${escaped})`, "gi"), '<span class="notes-hl">$1</span>')
}

const STORAGE_KEY = "notes-items"

export function NotesExpand(props: WidgetViewProps) {
  const [notes, setNotes] = createSignal<Note[]>([])
  const [currentFilter, setCurrentFilter] = createSignal("all")
  const [currentCalDate, setCurrentCalDate] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [calYear, setCalYear] = createSignal(new Date().getFullYear())
  const [calMonth, setCalMonth] = createSignal(new Date().getMonth())
  const [searchQuery, setSearchQuery] = createSignal("")
  let editTimer: ReturnType<typeof setTimeout> | undefined

  onMount(async () => {
    const saved = await props.data.get<Note[]>(STORAGE_KEY)
    if (saved) setNotes(saved)
  })

  async function persist(updated: Note[]) {
    setNotes(updated)
    await props.data.save(STORAGE_KEY, updated)
  }

  async function addNote(content: string) {
    if (!content.trim()) return
    const note: Note = {
      id: uid(),
      content: content.trim(),
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await persist([note, ...notes()])
  }

  async function deleteNote(id: string) {
    await persist(notes().filter((n) => n.id !== id))
  }

  async function toggleStar(id: string) {
    const next = notes().map((n) => (n.id === id ? { ...n, starred: !n.starred } : n))
    await persist(next)
  }

  async function saveEdit(id: string, content: string) {
    const next = notes().map((n) =>
      n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n,
    )
    await persist(next)
  }

  function selectCalDate(ds: string) {
    setCurrentCalDate(ds)
    setCurrentFilter("all")
    setEditingId(null)
  }

  function selectFilter(filter: string) {
    setCurrentFilter(filter)
    setCurrentCalDate("")
    setEditingId(null)
  }

  const allTags = createMemo(() => {
    const tags = new Map<string, number>()
    notes().forEach((n) => {
      extractTags(n.content).forEach((t) => tags.set(t, (tags.get(t) ?? 0) + 1))
    })
    return [...tags.entries()].sort((a, b) => b[1] - a[1])
  })

  const starCount = createMemo(() => notes().filter((n) => n.starred).length)

  const noteDates = createMemo(() => {
    const set = new Set<string>()
    notes().forEach((n) => set.add(n.updatedAt.slice(0, 10)))
    return [...set]
  })

  const filteredNotes = createMemo(() => {
    let result = notes()
    if (currentFilter() === "starred") result = result.filter((n) => n.starred)
    else if (currentFilter().startsWith("tag:")) {
      const tag = currentFilter().slice(4)
      result = result.filter((n) => extractTags(n.content).includes(tag))
    }
    if (currentCalDate()) {
      result = result.filter((n) => n.updatedAt.slice(0, 10) === currentCalDate())
    }
    const q = searchQuery().toLowerCase()
    if (q) result = result.filter((n) => n.content.toLowerCase().includes(q))
    return result
  })

  function handleCaptureKey(e: KeyboardEvent, el: HTMLTextAreaElement) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const content = el.value
      if (content.trim()) {
        void addNote(content)
        el.value = ""
        el.style.height = "auto"
      }
    }
  }

  function handleEditInput(el: HTMLTextAreaElement) {
    const id = editingId()
    if (!id) return
    if (editTimer) clearTimeout(editTimer)
    editTimer = setTimeout(() => {
      void saveEdit(id, el.value)
    }, 400)
  }

  function handleEditKey(e: KeyboardEvent, id: string, el: HTMLTextAreaElement) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void saveEdit(id, el.value)
      setEditingId(null)
    }
  }

  return (
    <div class="notes-expand-root">
      <div class="notes-side">
        <div class="notes-side-search">
          <div class="notes-side-search-box">
            <Search size={13} />
            <input
              type="search"
              placeholder="搜索便签..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>
        </div>
        <div class="notes-side-cal">
          <DatePicker
            value={currentCalDate()}
            onChange={(ds) => selectCalDate(ds)}
            year={calYear()}
            month={calMonth()}
            onMonthChange={(y, m) => {
              setCalYear(y)
              setCalMonth(m)
            }}
            markedDates={noteDates()}
          />
        </div>
        <div class="notes-side-section">
          <span class="notes-side-section-title">筛选</span>
        </div>
        <div class="notes-side-filters">
          <button
            class="notes-side-filter"
            classList={{ active: currentFilter() === "all" && !currentCalDate() }}
            type="button"
            onClick={() => selectFilter("all")}
          >
            <List size={13} />
            全部
            <span class="notes-side-filter-count">{notes().length}</span>
          </button>
          <button
            class="notes-side-filter"
            classList={{ active: currentFilter() === "starred" }}
            type="button"
            onClick={() => selectFilter("starred")}
          >
            <Star size={13} fill={currentFilter() === "starred" ? "currentColor" : "none"} />
            置顶
            <span class="notes-side-filter-count">{starCount()}</span>
          </button>
        </div>
        <div class="notes-side-section">
          <span class="notes-side-section-title">标签</span>
        </div>
        <div class="notes-side-tags">
          <For each={allTags().slice(0, 8)}>
            {([tag, count]) => (
              <button
                class="notes-side-tag"
                classList={{ active: currentFilter() === `tag:${tag}` }}
                type="button"
                onClick={() => selectFilter(`tag:${tag}`)}
              >
                <span class="notes-side-tag-hash">#</span>
                {tag}
                <span class="notes-side-tag-count">{count}</span>
              </button>
            )}
          </For>
          <Show when={allTags().length === 0}>
            <div class="notes-side-tag-empty">暂无标签</div>
          </Show>
        </div>
      </div>

      <div class="notes-main">
        <div class="notes-capture">
          <div class="notes-capture-inner">
            <button class="notes-capture-plus" type="button" aria-label="附加文件">
              <Plus size={15} />
            </button>
            <textarea
              rows="1"
              placeholder="记点什么...（Enter 发送）"
              aria-label="新建便签内容"
              onInput={(e) => {
                e.currentTarget.style.height = "auto"
                e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 100)}px`
              }}
              onKeyDown={(e) => handleCaptureKey(e, e.currentTarget)}
            />
          </div>
          <div class="notes-capture-foot">
            <button class="notes-capture-vis" type="button">
              <Eye size={12} />
              公开
              <ChevronDown size={10} />
            </button>
            <span class="notes-capture-save">保存</span>
          </div>
        </div>

        <Show
          when={filteredNotes().length > 0}
          fallback={
            <div class="notes-empty">
              <div class="notes-empty-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <div class="notes-empty-text">
                {searchQuery()
                  ? `没有匹配 "${searchQuery()}" 的便签`
                  : currentCalDate()
                    ? "该日期没有便签"
                    : "还没有便签"}
              </div>
              <Show when={!searchQuery() && !currentCalDate()}>
                <div class="notes-empty-hint">在上方输入框开始记录</div>
              </Show>
            </div>
          }
        >
          <div class="notes-list">
            <For each={filteredNotes()}>
              {(note) => (
                <div class="notes-card" classList={{ editing: editingId() === note.id }}>
                  <Show
                    when={editingId() === note.id}
                    fallback={
                      <div class="notes-card-display" onClick={() => setEditingId(note.id)}>
                        <div class="notes-card-time">
                          <Show when={note.starred}>
                            <span class="notes-card-star">
                              <Star size={12} fill="currentColor" />
                            </span>
                          </Show>
                          {formatTime(note.updatedAt)}
                        </div>
                        <div
                          class="notes-card-content"
                          innerHTML={highlightText(note.content, searchQuery())}
                        />
                        <Show when={extractTags(note.content).length > 0}>
                          <div class="notes-card-tags">
                            <For each={extractTags(note.content)}>
                              {(tag) => <span class="notes-card-tag">#{tag}</span>}
                            </For>
                          </div>
                        </Show>
                        <div class="notes-card-foot">
                          <span class="notes-card-meta">{note.content.length} 字</span>
                          <div class="notes-card-actions">
                            <button
                              class="notes-card-act"
                              type="button"
                              aria-label="置顶"
                              onClick={(e) => {
                                e.stopPropagation()
                                void toggleStar(note.id)
                              }}
                            >
                              <Star size={14} />
                            </button>
                            <button
                              class="notes-card-act danger"
                              type="button"
                              aria-label="删除"
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteNote(note.id)
                              }}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div class="notes-card-edit">
                      <div class="notes-card-edit-area">
                        <textarea
                          value={note.content}
                          aria-label={`编辑 ${note.content.slice(0, 30)}`}
                          onInput={(e) => handleEditInput(e.currentTarget)}
                          onKeyDown={(e) => handleEditKey(e, note.id, e.currentTarget)}
                        />
                      </div>
                      <div class="notes-card-edit-foot">
                        <span class="notes-card-edit-info">{note.content.length} 字</span>
                        <span class="notes-card-edit-saved">
                          <span class="notes-card-edit-dot" />
                          已保存
                        </span>
                        <div class="notes-card-edit-btns">
                          <button
                            class="notes-btn notes-btn-red"
                            type="button"
                            onClick={() => {
                              void deleteNote(note.id)
                              setEditingId(null)
                            }}
                          >
                            删除
                          </button>
                          <button
                            class="notes-btn notes-btn-accent"
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            完成
                          </button>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
