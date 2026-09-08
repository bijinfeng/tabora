import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { IconButton } from "@tabora/ui/button"
import { ensureTiptapContentStyles } from "@tabora/tiptap-editor"
import ArrowRight from "lucide-solid/icons/arrow-right"
import Plus from "lucide-solid/icons/plus"
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

export function DocsCard(props: WidgetViewProps) {
  const [docs, setDocs] = createSignal<Doc[]>([])
  const [loading, setLoading] = createSignal(true)
  const cardSize = () => props.size ?? "L"

  onMount(async () => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
    const saved = await props.data.get<Doc[]>(DOCS_STORAGE_KEY)
    if (saved && saved.length > 0) setDocs(saved)
    setLoading(false)
  })

  const latest = () => docs()[0]
  const isEmpty = () => !loading() && docs().length === 0

  const previewDocs = createMemo(() => {
    const size = cardSize()
    if (size === "S") return docs().slice(0, 1)
    if (size === "M") return docs().slice(0, 2)
    if (size === "L") return docs().slice(0, 3)
    return docs().slice(0, 5)
  })

  const open = (e: MouseEvent) => {
    e.stopPropagation()
    props.host.openExpand()
  }

  return (
    <div {...stylex.attrs(styles.card)} role="button" tabindex={0} onClick={open}>
      <div {...stylex.attrs(styles.cardHead)}>
        <span {...stylex.attrs(styles.kicker)}>文档笔记</span>
        <Show
          when={cardSize() !== "S"}
          fallback={<span {...stylex.attrs(styles.count)}>{docs().length}</span>}
        >
          <IconButton
            variant="secondary"
            size="sm"
            xstyle={styles.addButton}
            title="新建文档"
            aria-label="新建文档"
            onClick={open}
          >
            <Plus size={13} />
          </IconButton>
        </Show>
      </div>

      <Show
        when={!isEmpty()}
        fallback={<div {...stylex.attrs(styles.cardEmpty)}>还没有文档，点击新建第一篇。</div>}
      >
        <div {...stylex.attrs(styles.cardList)}>
          {previewDocs().map((doc) => (
            <div {...stylex.attrs(styles.cardItem)}>
              <span {...stylex.attrs(styles.cardItemTitle)}>{docTitle(doc)}</span>
              <Show when={cardSize() !== "S"}>
                <div {...stylex.attrs(styles.cardItemPreview)}>{previewText(doc.content)}</div>
              </Show>
            </div>
          ))}
        </div>
      </Show>

      <div {...stylex.attrs(styles.cardFoot)}>
        <span {...stylex.attrs(styles.cardTime)}>
          {latest() ? formatRelativeTime(latest()!.updatedAt) : "仅本机保存"}
        </span>
        <button {...stylex.attrs(styles.viewAll)} type="button" onClick={open}>
          查看全部 <ArrowRight size={7} />
        </button>
      </div>
    </div>
  )
}
