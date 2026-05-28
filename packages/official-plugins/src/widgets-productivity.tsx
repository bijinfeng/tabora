import { createSignal, onMount } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodoCard } from "./widget-todo"
import { WeatherCard } from "./widget-weather"
import { Field, Input, Checkbox, ListRow } from "@tabora/ui"

const QUICK_LINKS = [
  { title: "GitHub", url: "https://github.com" },
  { title: "Vite+", url: "https://viteplus.dev" },
] as const

export function QuickLinksCard() {
  return (
    <div class="quick-links">
      {QUICK_LINKS.map((link) => (
        <a class="quick-link-anchor" href={link.url} target="_blank" rel="noreferrer">
          <ListRow primary={link.title} secondary={link.url} />
        </a>
      ))}
    </div>
  )
}

export function NotesCard() {
  const [text, setText] = createSignal("")

  onMount(() => {
    const saved = localStorage.getItem("notes-content")
    if (saved) setText(saved)
  })

  function update(value: string) {
    setText(value)
    localStorage.setItem("notes-content", value)
  }

  return (
    <textarea
      class="notes-textarea"
      value={text()}
      onInput={(e) => update(e.currentTarget.value)}
      placeholder="写点什么..."
    />
  )
}

export function NotesModal() {
  const [text, setText] = createSignal("")

  onMount(() => {
    const saved = localStorage.getItem("notes-content")
    if (saved) setText(saved)
  })

  function update(value: string) {
    setText(value)
    localStorage.setItem("notes-content", value)
  }

  return (
    <div class="notes-modal">
      <h3>便签</h3>
      <textarea
        class="notes-modal-textarea"
        value={text()}
        onInput={(e) => update(e.currentTarget.value)}
        placeholder="尽情书写..."
      />
    </div>
  )
}

type TodayFocusCardProps = {
  instanceId?: string
}

export function TodayFocusCard(props: TodayFocusCardProps = {}) {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)
  const instanceId = () => props.instanceId ?? "default"
  const contentKey = () => `today-focus:${instanceId()}:content`
  const doneKey = () => `today-focus:${instanceId()}:done`

  onMount(() => {
    const saved = localStorage.getItem(contentKey())
    const savedDone = localStorage.getItem(doneKey())
    if (saved) setFocus(saved)
    setDone(savedDone === "true")
  })

  function updateFocus(value: string) {
    setFocus(value)
    localStorage.setItem(contentKey(), value)
  }
  function updateDone(value: boolean) {
    setDone(value)
    localStorage.setItem(doneKey(), String(value))
  }
  const inputId = () => `today-focus-${instanceId()}`

  return (
    <div class="today-focus-widget">
      <Field label="今天最重要的一件事" htmlFor={inputId()}>
        <Input
          id={inputId()}
          value={focus()}
          onInput={updateFocus}
          placeholder="写下今日重点"
          aria-label="今日重点内容"
        />
      </Field>
      <Checkbox
        checked={done()}
        onChange={updateDone}
        aria-label="今日重点完成状态"
        label={done() ? "已完成" : "尚未完成"}
      />
    </div>
  )
}

export const officialWidgetsProductivity: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.productivity",
    name: "Productivity Widgets",
    version: "0.0.0",
    entry: "./widgets-productivity",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "today-focus",
          title: "今日重点",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.today-focus.card" },
        },
        {
          id: "quick-links",
          title: "快捷入口",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.quick-links.card" },
        },
        {
          id: "notes",
          title: "便签",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.notes.card", modal: "official.widgets.notes.modal" },
        },
        {
          id: "todo",
          title: "待办",
          supportedSizes: ["S", "M", "L", "XL"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.todo.card" },
        },
        {
          id: "weather",
          title: "天气",
          supportedSizes: ["S", "M"],
          defaultSize: "S",
          allowMultipleInstances: true,
          views: { card: "official.widgets.weather.card" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.today-focus.card", TodayFocusCard)
    context.registry.views.register("official.widgets.quick-links.card", QuickLinksCard)
    context.registry.views.register("official.widgets.notes.card", NotesCard)
    context.registry.views.register("official.widgets.notes.modal", NotesModal)
    context.registry.views.register("official.widgets.todo.card", TodoCard)
    context.registry.views.register("official.widgets.weather.card", WeatherCard)
  },
}
