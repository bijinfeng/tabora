import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Button, IconButton } from "@tabora/ui/button"
import { DatePicker } from "@tabora/ui/date-picker"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import type { DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { Input } from "@tabora/ui/input"
import { TiptapEditor, ensureTiptapContentStyles } from "@tabora/tiptap-editor"
import type { TiptapEditorVisibility } from "@tabora/tiptap-editor"
import Ellipsis from "lucide-solid/icons/ellipsis"
import List from "lucide-solid/icons/list"
import NotepadTextDashed from "lucide-solid/icons/notepad-text-dashed"
import Pencil from "lucide-solid/icons/pencil"
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

  function beginEditing(note: Note) {
    setEditingId(note.id)
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
            <span {...stylex.attrs(styles.sideButtonLabel)}>
              <List size={14} />
              <span>全部</span>
            </span>
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
            <span {...stylex.attrs(styles.sideButtonLabel)}>
              <Star size={14} fill={currentFilter() === "starred" ? "currentColor" : "none"} />
              <span>置顶</span>
            </span>
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
                <span {...stylex.attrs(styles.sideButtonLabel)}>
                  <span
                    {...stylex.attrs(
                      styles.sideHash,
                      currentFilter() === `tag:${tag}` && styles.sideHashActive,
                    )}
                  >
                    #
                  </span>
                  <span>{tag}</span>
                </span>
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
            defaultFormatToolbarVisible={false}
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
              <div {...stylex.attrs(styles.emptyIcon)} data-notes-empty-icon>
                <NotepadTextDashed size={32} aria-hidden="true" />
              </div>
              <Show when={searchQuery() || currentCalDate()}>
                <div {...stylex.attrs(styles.emptyText)}>
                  {searchQuery() ? `没有匹配 "${searchQuery()}" 的便签` : "该日期没有便签"}
                </div>
              </Show>
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
                  {...stylex.attrs(editingId() === note.id ? styles.edit : styles.note)}
                  data-note-card
                  data-editing={editingId() === note.id ? "" : undefined}
                >
                  <Show
                    when={editingId() === note.id}
                    fallback={
                      <div
                        {...stylex.attrs(styles.noteDisplay)}
                        data-note-display
                        onClick={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest("[data-note-more]")
                          ) {
                            return
                          }
                          beginEditing(note)
                        }}
                      >
                        <div {...stylex.attrs(styles.noteTime)}>
                          <Show when={note.starred}>
                            <span {...stylex.attrs(styles.star)} data-note-star>
                              <Star size={12} fill="currentColor" />
                            </span>
                          </Show>
                          {formatTime(note.updatedAt)}
                        </div>
                        <div {...stylex.attrs(styles.noteMenu)}>
                          <DropdownMenu
                            items={[
                              {
                                id: `note-${note.id}-pin`,
                                label: note.starred ? "取消置顶" : "置顶",
                                icon: (
                                  <Star size={14} fill={note.starred ? "currentColor" : "none"} />
                                ),
                                onClick: () => void toggleStar(note.id),
                              },
                              {
                                id: `note-${note.id}-edit`,
                                label: "编辑",
                                icon: <Pencil size={14} />,
                                onClick: () => beginEditing(note),
                              },
                              { id: `note-${note.id}-separator`, label: <></>, separator: true },
                              {
                                id: `note-${note.id}-delete`,
                                label: "删除",
                                icon: <Trash size={14} />,
                                danger: true,
                                onClick: () => void deleteNote(note.id),
                              },
                            ]}
                            side="bottom"
                            align="end"
                            triggerAsChild={true}
                            triggerAriaLabel="更多操作"
                            triggerTitle="更多操作"
                          >
                            {(trigger: DropdownMenuTriggerRenderProps) => {
                              const triggerProps = {
                                ...(trigger.ref !== undefined ? { ref: trigger.ref } : {}),
                                ...(trigger.disabled !== undefined
                                  ? { disabled: trigger.disabled }
                                  : {}),
                                ...(trigger["aria-haspopup"] !== undefined
                                  ? { "aria-haspopup": "menu" as const }
                                  : {}),
                                ...(trigger["aria-expanded"] !== undefined
                                  ? { "aria-expanded": trigger["aria-expanded"] }
                                  : {}),
                                ...(trigger["aria-controls"] !== undefined
                                  ? { "aria-controls": trigger["aria-controls"] }
                                  : {}),
                                ...(trigger["data-open"] !== undefined
                                  ? { "data-open": trigger["data-open"] }
                                  : {}),
                                ...(trigger["data-closed"] !== undefined
                                  ? { "data-closed": trigger["data-closed"] }
                                  : {}),
                                ...(trigger["data-kb-menu-value-trigger"] !== undefined
                                  ? {
                                      "data-kb-menu-value-trigger":
                                        trigger["data-kb-menu-value-trigger"],
                                    }
                                  : {}),
                                ...(trigger.onPointerDown !== undefined
                                  ? { onPointerDown: trigger.onPointerDown }
                                  : {}),
                                ...(trigger.onKeyDown !== undefined
                                  ? { onKeyDown: trigger.onKeyDown }
                                  : {}),
                                ...(trigger.onMouseOver !== undefined
                                  ? { onMouseOver: trigger.onMouseOver }
                                  : {}),
                                ...(trigger.onFocus !== undefined
                                  ? { onFocus: trigger.onFocus }
                                  : {}),
                              }
                              return (
                                <IconButton
                                  {...triggerProps}
                                  size="sm"
                                  variant="ghost"
                                  aria-label="更多操作"
                                  data-note-more
                                >
                                  <Ellipsis size={16} />
                                </IconButton>
                              )
                            }}
                          </DropdownMenu>
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
                      </div>
                    }
                  >
                    <TiptapEditor
                      variant="standard-with-menu"
                      size="sm"
                      defaultFormatToolbarVisible={true}
                      content={note.content}
                      contentMinHeight={100}
                      xstyle={styles.editEditor}
                      actionsRightExtra={
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          取消
                        </Button>
                      }
                      onSave={(html) => {
                        void saveEdit(note.id, html)
                        setEditingId(null)
                      }}
                    />
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
