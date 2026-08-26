import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Button, IconButton } from "@tabora/ui/button"
import { DatePicker } from "@tabora/ui/date-picker"
import { Input } from "@tabora/ui/input"
import { TiptapEditor, ensureTiptapContentStyles } from "@tabora/tiptap-editor"
import type { TiptapEditorVisibility } from "@tabora/tiptap-editor"
import List from "lucide-solid/icons/list"
import Search from "lucide-solid/icons/search"
import Star from "lucide-solid/icons/star"
import Trash from "lucide-solid/icons/trash"
import { NOTES_STORAGE_KEY, type Note } from "./notes-data"
import { styles } from "./styles"

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

function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "")
  const tmp = document.createElement("div")
  tmp.innerHTML = html
  return tmp.textContent ?? tmp.innerText ?? ""
}

function extractTags(content: string): string[] {
  const plain = htmlToPlainText(content)
  const matches = plain.match(/#([\w\u4e00-\u9fff-]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((t) => t.toLowerCase().replace(/^#/, "")))]
}

export function NotesExpand(props: WidgetViewProps) {
  const [notes, setNotes] = createSignal<Note[]>([])
  const [currentFilter, setCurrentFilter] = createSignal("all")
  const [currentCalDate, setCurrentCalDate] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [calYear, setCalYear] = createSignal(new Date().getFullYear())
  const [calMonth, setCalMonth] = createSignal(new Date().getMonth())
  const [searchQuery, setSearchQuery] = createSignal("")
  const [captureValue, setCaptureValue] = createSignal("")
  const [captureVisibility, setCaptureVisibility] = createSignal<TiptapEditorVisibility>("public")
  let editTimer: ReturnType<typeof setTimeout> | undefined

  onMount(async () => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
    const saved = await props.data.get<Note[]>(NOTES_STORAGE_KEY)
    if (saved) setNotes(saved)
  })

  async function persist(updated: Note[]) {
    setNotes(updated)
    await props.data.save(NOTES_STORAGE_KEY, updated)
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
    if (q) result = result.filter((n) => htmlToPlainText(n.content).toLowerCase().includes(q))
    return result
  })

  function handleCaptureSave(html: string) {
    if (html.trim() && html !== "<p></p>") {
      void addNote(html)
      setCaptureValue("")
    }
  }

  function handleEditInput(content: string) {
    const id = editingId()
    if (!id) return
    if (editTimer) clearTimeout(editTimer)
    editTimer = setTimeout(() => {
      void saveEdit(id, content)
    }, 400)
  }

  return (
    <div {...stylex.attrs(styles.expandRoot)} data-widget-expand="notes">
      <div {...stylex.attrs(styles.side)} data-notes-side>
        <div {...stylex.attrs(styles.sideSearch)}>
          <Input
            size="sm"
            type="search"
            placeholder="搜索便签..."
            aria-label="搜索便签"
            value={searchQuery()}
            onInput={(value) => setSearchQuery(value)}
            leadingIcon={<Search size={13} />}
          />
        </div>
        <div {...stylex.attrs(styles.sideCalendar)}>
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
        <div {...stylex.attrs(styles.sideSection)}>
          <span {...stylex.attrs(styles.sideSectionTitle)}>筛选</span>
        </div>
        <div {...stylex.attrs(styles.sideList)}>
          <Button
            size="sm"
            variant="ghost"
            xstyle={[
              styles.sideButton,
              currentFilter() === "all" && !currentCalDate() && styles.sideButtonActive,
            ]}
            onClick={() => selectFilter("all")}
          >
            <List size={13} />
            全部
            <span
              {...stylex.attrs(
                styles.sideCount,
                currentFilter() === "all" && !currentCalDate() && styles.sideCountActive,
              )}
            >
              {notes().length}
            </span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            xstyle={[styles.sideButton, currentFilter() === "starred" && styles.sideButtonActive]}
            onClick={() => selectFilter("starred")}
          >
            <Star size={13} fill={currentFilter() === "starred" ? "currentColor" : "none"} />
            置顶
            <span
              {...stylex.attrs(
                styles.sideCount,
                currentFilter() === "starred" && styles.sideCountActive,
              )}
            >
              {starCount()}
            </span>
          </Button>
        </div>
        <div {...stylex.attrs(styles.sideSection)}>
          <span {...stylex.attrs(styles.sideSectionTitle)}>标签</span>
        </div>
        <div {...stylex.attrs(styles.sideTags)}>
          <For each={allTags().slice(0, 8)}>
            {([tag, count]) => (
              <Button
                size="sm"
                variant="ghost"
                xstyle={[
                  styles.sideButton,
                  currentFilter() === `tag:${tag}` && styles.sideButtonActive,
                ]}
                onClick={() => selectFilter(`tag:${tag}`)}
              >
                <span
                  {...stylex.attrs(
                    styles.sideHash,
                    currentFilter() === `tag:${tag}` && styles.sideHashActive,
                  )}
                >
                  #
                </span>
                {tag}
                <span
                  {...stylex.attrs(
                    styles.sideCount,
                    currentFilter() === `tag:${tag}` && styles.sideCountActive,
                  )}
                >
                  {count}
                </span>
              </Button>
            )}
          </For>
          <Show when={allTags().length === 0}>
            <div {...stylex.attrs(styles.sideEmpty)}>暂无标签</div>
          </Show>
        </div>
      </div>

      <div {...stylex.attrs(styles.main)} data-notes-main>
        <div {...stylex.attrs(styles.captureExpandEditor)} data-notes-capture>
          <TiptapEditor
            variant="standard-with-menu"
            size="sm"
            content={captureValue()}
            onChange={setCaptureValue}
            placeholder="记点什么..."
            visibility={captureVisibility()}
            onVisibilityChange={setCaptureVisibility}
            onSave={handleCaptureSave}
            saveLabel="保存"
            contentMinHeight={60}
          />
        </div>

        <Show
          when={filteredNotes().length > 0}
          fallback={
            <div {...stylex.attrs(styles.empty)}>
              <div {...stylex.attrs(styles.emptyIcon)}>
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
              <div {...stylex.attrs(styles.emptyText)}>
                {searchQuery()
                  ? `没有匹配 "${searchQuery()}" 的便签`
                  : currentCalDate()
                    ? "该日期没有便签"
                    : "还没有便签"}
              </div>
              <Show when={!searchQuery() && !currentCalDate()}>
                <div {...stylex.attrs(styles.emptyHint)}>在上方输入框开始记录</div>
              </Show>
            </div>
          }
        >
          <div {...stylex.attrs(styles.noteList)}>
            <For each={filteredNotes()}>
              {(note) => (
                <div
                  {...stylex.attrs(styles.note, editingId() === note.id && styles.noteEditing)}
                  data-note-card
                  data-editing={editingId() === note.id ? "" : undefined}
                >
                  <Show
                    when={editingId() === note.id}
                    fallback={
                      <div
                        {...stylex.attrs(styles.noteDisplay)}
                        data-note-display
                        onClick={() => setEditingId(note.id)}
                      >
                        <div {...stylex.attrs(styles.noteTime)}>
                          <Show when={note.starred}>
                            <span {...stylex.attrs(styles.star)} data-note-star>
                              <Star size={12} fill="currentColor" />
                            </span>
                          </Show>
                          {formatTime(note.updatedAt)}
                        </div>
                        <div
                          {...stylex.attrs(styles.noteRichContent)}
                          data-tbr-tiptap-root
                          innerHTML={note.content}
                        />
                        <Show when={extractTags(note.content).length > 0}>
                          <div {...stylex.attrs(styles.tags)}>
                            <For each={extractTags(note.content)}>
                              {(tag) => <span {...stylex.attrs(styles.tag)}>#{tag}</span>}
                            </For>
                          </div>
                        </Show>
                        <div {...stylex.attrs(styles.noteFooter)}>
                          <span {...stylex.attrs(styles.meta)}>
                            {htmlToPlainText(note.content).length} 字
                          </span>
                          <div {...stylex.attrs(styles.actions)}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              aria-label="置顶"
                              onClick={(e) => {
                                e.stopPropagation()
                                void toggleStar(note.id)
                              }}
                            >
                              <Star size={14} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              variant="danger"
                              aria-label="删除"
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteNote(note.id)
                              }}
                            >
                              <Trash size={14} />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div {...stylex.attrs(styles.edit)}>
                      <div {...stylex.attrs(styles.editArea)}>
                        <TiptapEditor
                          variant="minimal"
                          size="sm"
                          content={note.content}
                          onChange={handleEditInput}
                          contentMinHeight={100}
                          xstyle={styles.editEditor}
                        />
                      </div>
                      <div {...stylex.attrs(styles.editFooter)}>
                        <span {...stylex.attrs(styles.meta)}>
                          {htmlToPlainText(note.content).length} 字
                        </span>
                        <span {...stylex.attrs(styles.saved)}>
                          <span {...stylex.attrs(styles.savedDot)} />
                          已保存
                        </span>
                        <div {...stylex.attrs(styles.editButtons)}>
                          <Button
                            size="sm"
                            variant="danger-subtle"
                            onClick={() => {
                              void deleteNote(note.id)
                              setEditingId(null)
                            }}
                          >
                            删除
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => setEditingId(null)}>
                            完成
                          </Button>
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
