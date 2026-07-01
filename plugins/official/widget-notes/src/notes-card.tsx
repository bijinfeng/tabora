import { createSignal, For, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button } from "@tabora/ui"
import { Plus } from "lucide-solid"

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
    <div class="notes-widget">
      <div class="notes-widget-body">
        <For each={displayNotes()}>
          {(note) => (
            <div class="notes-widget-row" classList={{ starred: note.starred }}>
              <span class="notes-widget-dot" />
              <span class="notes-widget-text">{firstLine(note.content)}</span>
              <span class="notes-widget-time">{formatTime(note.updatedAt)}</span>
            </div>
          )}
        </For>
      </div>
      <div class="notes-widget-foot">
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
