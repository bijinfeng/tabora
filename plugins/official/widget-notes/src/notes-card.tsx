import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { IconButton } from "@tabora/ui/button"
import ArrowRight from "lucide-solid/icons/arrow-right"
import Plus from "lucide-solid/icons/plus"
import { NOTES_STORAGE_KEY, type Note } from "./notes-data"
import { styles } from "./styles"

function formatTime(iso: string): string {
  const date = new Date(iso)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${month}月${day}日 · ${hours}:${minutes}`
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
  return formatTime(iso)
}

function firstLine(content: string): string {
  const line = content.split("\n")[0]
  return line ?? ""
}

export function NotesCard(props: WidgetViewProps) {
  const [notes, setNotes] = createSignal<Note[]>([])
  const [loading, setLoading] = createSignal(true)
  const cardSize = () => props.size ?? "L"

  onMount(async () => {
    const saved = await props.data.get<Note[]>(NOTES_STORAGE_KEY)
    if (saved && saved.length > 0) setNotes(saved)
    setLoading(false)
  })

  const latest = () => notes()[0]
  const isEmpty = () => !loading() && notes().length === 0
  const charCount = () => latest()?.content.length ?? 0

  const previewNotes = createMemo(() => {
    const size = cardSize()
    if (size === "L") return notes().slice(0, 2)
    if (size === "XL") return notes().slice(0, 3)
    return []
  })

  const handleAdd = (e: MouseEvent) => {
    e.stopPropagation()
    props.host.openExpand()
  }

  const handleOpen = (e: MouseEvent) => {
    e.stopPropagation()
    props.host.openExpand()
  }

  return (
    <>
      <Show when={cardSize() === "S"}>
        <div {...stylex.attrs(styles.small)} role="button" tabindex={0} onClick={handleOpen}>
          <div {...stylex.attrs(styles.smallHead)}>
            <span {...stylex.attrs(styles.smallDate)}>
              {latest() ? formatTime(latest()!.updatedAt) : "暂无记录"}
            </span>
            <span {...stylex.attrs(styles.smallState)}>本机</span>
          </div>
          <div {...stylex.attrs(styles.smallCopy, isEmpty() && styles.smallCopyEmpty)}>
            {latest() ? latest()!.content : "还没有便签，点击新建第一条想法。"}
          </div>
          <div {...stylex.attrs(styles.smallFoot)}>
            <span {...stylex.attrs(styles.smallTag)}>
              {latest()?.tag ? `#${latest()!.tag}` : "#未分类"}
            </span>
            <span {...stylex.attrs(styles.smallReplies)}>{charCount()} 字</span>
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "M"}>
        <div {...stylex.attrs(styles.medium)}>
          <div {...stylex.attrs(styles.mediumHead)}>
            <span {...stylex.attrs(styles.kicker)}>Latest memo</span>
            <IconButton
              variant="secondary"
              size="sm"
              xstyle={styles.addButton}
              title="记录 Memo"
              aria-label="记录 Memo"
              onClick={handleAdd}
            >
              <Plus size={14} />
            </IconButton>
          </div>
          <div
            {...stylex.attrs(styles.latest, isEmpty() && styles.latestEmpty)}
            role="button"
            tabindex={0}
            onClick={handleOpen}
          >
            {latest() ? latest()!.content : "还没有 Memo，记录第一条想法。"}
          </div>
          <div {...stylex.attrs(styles.mediumFoot)}>
            <span {...stylex.attrs(styles.widgetTime)}>
              {latest() ? formatRelativeTime(latest()!.updatedAt) : "仅本机保存"}
            </span>
            <span {...stylex.attrs(styles.widgetTag)}>
              {latest()?.tag ? `#${latest()!.tag}` : "#未分类"}
            </span>
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "L"}>
        <div {...stylex.attrs(styles.large)}>
          <div {...stylex.attrs(styles.largeHead)}>
            <span {...stylex.attrs(styles.kicker)}>My memo stream</span>
            <span {...stylex.attrs(styles.widgetCount)}>{notes().length} 条</span>
          </div>
          <button {...stylex.attrs(styles.capture)} type="button" onClick={handleAdd}>
            <span {...stylex.attrs(styles.captureText)}>记录此刻的想法…</span>
            <strong {...stylex.attrs(styles.captureMark)}>
              <Plus size={14} />
            </strong>
          </button>
          <div {...stylex.attrs(styles.previewList)}>
            <Show when={previewNotes().length === 0}>
              <div {...stylex.attrs(styles.latest, styles.latestEmpty)} onClick={handleOpen}>
                还没有 Memo，创建后会按时间显示在这里。
              </div>
            </Show>
            <Show when={previewNotes().length > 0}>
              {previewNotes().map((note) => (
                <div
                  {...stylex.attrs(styles.preview)}
                  role="button"
                  tabindex={0}
                  onClick={handleOpen}
                >
                  <div {...stylex.attrs(styles.previewHead)}>
                    <span {...stylex.attrs(styles.previewTime)}>
                      {formatRelativeTime(note.updatedAt)}
                    </span>
                    <span {...stylex.attrs(styles.widgetTag)}>
                      {note.tag ? `#${note.tag}` : "#未分类"}
                    </span>
                  </div>
                  <div {...stylex.attrs(styles.previewContent)}>{firstLine(note.content)}</div>
                </div>
              ))}
            </Show>
          </div>
          <div {...stylex.attrs(styles.largeFoot)}>
            <span {...stylex.attrs(styles.widgetTime)}>最近记录</span>
            <button {...stylex.attrs(styles.viewAll)} type="button" onClick={handleOpen}>
              查看全部 <ArrowRight size={7} />
            </button>
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "XL"}>
        <div {...stylex.attrs(styles.xlarge)}>
          <div {...stylex.attrs(styles.xlargeHead)}>
            <span {...stylex.attrs(styles.kicker)}>My memo stream</span>
            <span {...stylex.attrs(styles.widgetCount)}>{notes().length} 条</span>
          </div>
          <button {...stylex.attrs(styles.capture)} type="button" onClick={handleAdd}>
            <span {...stylex.attrs(styles.captureText)}>记录灵感、会议重点或收藏链接…</span>
            <strong {...stylex.attrs(styles.captureMark)}>
              <Plus size={14} />
            </strong>
          </button>
          <div {...stylex.attrs(styles.previewListXL)}>
            <Show when={previewNotes().length === 0}>
              <div {...stylex.attrs(styles.latest, styles.latestEmpty)} onClick={handleOpen}>
                时间流还是空的。创建第一条 Memo 后，内容、标签和回复会显示在这里。
              </div>
            </Show>
            <Show when={previewNotes().length > 0}>
              {previewNotes().map((note, index) => (
                <div
                  {...stylex.attrs(styles.preview, index === 0 && styles.previewFirst)}
                  role="button"
                  tabindex={0}
                  onClick={handleOpen}
                >
                  <div {...stylex.attrs(styles.previewHead)}>
                    <span {...stylex.attrs(styles.previewTime)}>
                      {formatRelativeTime(note.updatedAt)}
                    </span>
                    <span {...stylex.attrs(styles.widgetTag)}>
                      {note.tag ? `#${note.tag}` : "#未分类"}
                    </span>
                  </div>
                  <div {...stylex.attrs(styles.previewContent)}>{firstLine(note.content)}</div>
                </div>
              ))}
            </Show>
          </div>
          <div {...stylex.attrs(styles.xlargeFoot)}>
            <span {...stylex.attrs(styles.widgetTime)}>
              最近记录 · {latest() ? formatRelativeTime(latest()!.updatedAt) : "暂无"}
            </span>
            <button {...stylex.attrs(styles.viewAll)} type="button" onClick={handleOpen}>
              开始记录 <ArrowRight size={7} />
            </button>
          </div>
        </div>
      </Show>
    </>
  )
}
