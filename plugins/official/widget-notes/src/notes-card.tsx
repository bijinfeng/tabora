import * as stylex from "@stylexjs/stylex"
import { createSignal, For, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button } from "@tabora/ui"
import { Plus } from "lucide-solid"
import { styles } from "./styles"

type Note = {
  id: string
  content: string
  starred: boolean
  createdAt: string
  updatedAt: string
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

function firstLine(content: string): string {
  const line = content.split("\n")[0]
  return line ?? "无标题"
}

const STORAGE_KEY = "notes-items"

export function NotesCard(props: WidgetViewProps) {
  const [notes, setNotes] = createSignal<Note[]>([])

  onMount(async () => {
    const saved = await props.data.get<Note[]>(STORAGE_KEY)
    if (saved && saved.length > 0) setNotes(saved)
  })

  const displayNotes = () => notes().slice(0, 4)

  return (
    <div {...stylex.attrs(styles.cardRoot)} data-notes-card>
      <div {...stylex.attrs(styles.cardBody)}>
        <For each={displayNotes()}>
          {(note, index) => (
            <div
              {...stylex.attrs(
                styles.cardRow,
                index() === displayNotes().length - 1 && styles.cardRowLast,
              )}
              data-note-row
              data-starred={note.starred ? "" : undefined}
            >
              <span {...stylex.attrs(styles.dot, note.starred && styles.dotStarred)} />
              <span {...stylex.attrs(styles.cardText)}>{firstLine(note.content)}</span>
              <span {...stylex.attrs(styles.time)}>{formatTime(note.updatedAt)}</span>
            </div>
          )}
        </For>
      </div>
      <div {...stylex.attrs(styles.cardFooter)} data-notes-card-footer>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            props.host.openExpand()
          }}
        >
          <Plus size={12} />
          新建便签
        </Button>
      </div>
    </div>
  )
}
