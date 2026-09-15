import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Button, IconButton } from "@tabora/ui/button"
import type { DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { Input } from "@tabora/ui/input"
import { TiptapEditor, ensureTiptapContentStyles } from "@tabora/tiptap-editor"
import Ellipsis from "lucide-solid/icons/ellipsis"
import FileText from "lucide-solid/icons/file-text"
import Pin from "lucide-solid/icons/pin"
import PinOff from "lucide-solid/icons/pin-off"
import Plus from "lucide-solid/icons/plus"
import Trash2 from "lucide-solid/icons/trash-2"
import { DOCS_STORAGE_KEY, docTitle, type Doc } from "./docs-data"
import { styles } from "./styles"

function previewText(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const date = new Date(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function createDocId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Pinned docs stay on top; within each group the most recently edited comes first. */
function sortDocs(list: Doc[]): Doc[] {
  return [...list].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function DocsExpand(props: WidgetViewProps) {
  const [docs, setDocs] = createSignal<Doc[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [query, setQuery] = createSignal("")
  const [savedAt, setSavedAt] = createSignal<string | null>(null)
  const [hoveredId, setHoveredId] = createSignal<string | null>(null)
  const [focusedId, setFocusedId] = createSignal<string | null>(null)

  onMount(async () => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
    const saved = await props.data.get<Doc[]>(DOCS_STORAGE_KEY)
    if (saved && saved.length > 0) {
      const sorted = sortDocs(saved)
      setDocs(sorted)
      setSelectedId(sorted[0]!.id)
    }
  })

  async function persist(updated: Doc[]) {
    setDocs(updated)
    await props.data.save(DOCS_STORAGE_KEY, updated)
  }

  const filteredDocs = createMemo(() => {
    const q = query().trim().toLowerCase()
    const list = docs()
    if (!q) return list
    return list.filter((doc) => {
      const title = docTitle(doc).toLowerCase()
      const body = previewText(doc.content).toLowerCase()
      return title.includes(q) || body.includes(q)
    })
  })

  const selectedDoc = createMemo(() => docs().find((doc) => doc.id === selectedId()) ?? null)

  async function createDoc() {
    const now = new Date().toISOString()
    const doc: Doc = { id: createDocId(), title: "", content: "", createdAt: now, updatedAt: now }
    await persist(sortDocs([doc, ...docs()]))
    setSelectedId(doc.id)
    setSavedAt(null)
  }

  async function updateSelected(patch: Partial<Pick<Doc, "title" | "content">>) {
    const id = selectedId()
    if (!id) return
    const now = new Date().toISOString()
    const updated = docs().map((doc) =>
      doc.id === id ? { ...doc, ...patch, updatedAt: now } : doc,
    )
    await persist(sortDocs(updated))
    setSavedAt(now)
  }

  async function togglePinned(id: string) {
    const updated = docs().map((doc) => (doc.id === id ? { ...doc, pinned: !doc.pinned } : doc))
    await persist(sortDocs(updated))
  }

  async function deleteDoc(id: string) {
    const remaining = docs().filter((doc) => doc.id !== id)
    await persist(remaining)
    if (selectedId() === id) {
      setSelectedId(remaining[0]?.id ?? null)
      setSavedAt(null)
    }
  }

  return (
    <div {...stylex.attrs(styles.root)}>
      <aside {...stylex.attrs(styles.side)}>
        <div {...stylex.attrs(styles.sideHeader)}>
          <span {...stylex.attrs(styles.sideTitle)}>文档笔记</span>
          <Button
            size="sm"
            variant="secondary"
            icon={Plus}
            xstyle={styles.newButton}
            onClick={() => void createDoc()}
          >
            新建
          </Button>
        </div>
        <div {...stylex.attrs(styles.sideSearch)}>
          <Input
            type="search"
            value={query()}
            onInput={setQuery}
            placeholder="搜索文档…"
            aria-label="搜索文档"
          />
        </div>
        <div {...stylex.attrs(styles.sideList)}>
          <Show
            when={filteredDocs().length > 0}
            fallback={
              <div {...stylex.attrs(styles.sideEmpty)}>
                {docs().length === 0 ? "还没有文档，点击新建开始记录。" : "没有匹配的文档。"}
              </div>
            }
          >
            <For each={filteredDocs()}>
              {(doc) => {
                const active = () => doc.id === selectedId()
                const actionsShown = () => hoveredId() === doc.id || focusedId() === doc.id
                return (
                  <div
                    {...stylex.attrs(styles.docItem, active() && styles.docItemActive)}
                    onMouseEnter={() => setHoveredId(doc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocusIn={() => setFocusedId(doc.id)}
                    onFocusOut={() => setFocusedId(null)}
                  >
                    <button
                      type="button"
                      {...stylex.attrs(styles.docItemMain)}
                      onClick={() => {
                        setSelectedId(doc.id)
                        setSavedAt(null)
                      }}
                    >
                      <span
                        {...stylex.attrs(
                          styles.docItemTitle,
                          active() && styles.docItemTitleActive,
                        )}
                      >
                        {docTitle(doc)}
                      </span>
                      <Show when={previewText(doc.content)}>
                        <span {...stylex.attrs(styles.docItemPreview)}>
                          {previewText(doc.content)}
                        </span>
                      </Show>
                      <span {...stylex.attrs(styles.docItemTime)}>
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                    </button>
                    <span
                      {...stylex.attrs(
                        styles.docItemActions,
                        actionsShown() && styles.docItemActionsVisible,
                      )}
                    >
                      <DropdownMenu
                        items={[
                          {
                            id: `${doc.id}-pin`,
                            label: doc.pinned ? "取消置顶" : "置顶",
                            icon: doc.pinned ? <PinOff size={14} /> : <Pin size={14} />,
                            onClick: () => void togglePinned(doc.id),
                          },
                          { id: `${doc.id}-separator`, label: <></>, separator: true },
                          {
                            id: `${doc.id}-delete`,
                            label: "删除",
                            icon: <Trash2 size={14} />,
                            danger: true,
                            onClick: () => void deleteDoc(doc.id),
                          },
                        ]}
                        side="bottom"
                        align="end"
                        triggerAsChild={true}
                        triggerAriaLabel={`文档操作 ${docTitle(doc)}`}
                        triggerTitle="文档操作"
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
                            ...(trigger.onFocus !== undefined ? { onFocus: trigger.onFocus } : {}),
                          }
                          return (
                            <IconButton
                              {...triggerProps}
                              size="sm"
                              variant="ghost"
                              aria-label={`文档操作 ${docTitle(doc)}`}
                            >
                              <Ellipsis size={14} />
                            </IconButton>
                          )
                        }}
                      </DropdownMenu>
                    </span>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>
      </aside>

      <section {...stylex.attrs(styles.main)}>
        <Show
          when={selectedDoc()}
          fallback={
            <div {...stylex.attrs(styles.emptyMain)}>
              <FileText size={40} {...stylex.attrs(styles.emptyIcon)} />
              <span {...stylex.attrs(styles.emptyTitle)}>选择或新建一篇文档</span>
              <span {...stylex.attrs(styles.emptyHint)}>
                左侧列表管理文档，右侧使用富文本编辑器书写。
              </span>
            </div>
          }
        >
          {(doc) => (
            <>
              <div {...stylex.attrs(styles.editorHeader)}>
                <input
                  {...stylex.attrs(styles.titleInput)}
                  value={doc().title}
                  onInput={(e) => void updateSelected({ title: e.currentTarget.value })}
                  placeholder="无标题文档"
                  aria-label="文档标题"
                />
                <Show when={savedAt()}>
                  <div {...stylex.attrs(styles.headerActions)}>
                    <span {...stylex.attrs(styles.savedHint)}>已保存</span>
                  </div>
                </Show>
              </div>
              <div {...stylex.attrs(styles.editorBody)}>
                <TiptapEditor
                  variant="standard-with-menu"
                  size="md"
                  defaultFormatToolbarVisible={true}
                  showSaveButton={false}
                  content={doc().content}
                  contentMinHeight="100%"
                  xstyle={styles.editor}
                  xstyleContent={styles.editorContent}
                  placeholder="开始书写…"
                  onChange={(html) => void updateSelected({ content: html })}
                />
              </div>
            </>
          )}
        </Show>
      </section>
    </div>
  )
}
