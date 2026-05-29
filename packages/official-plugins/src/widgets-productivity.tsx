import { createSignal, onMount } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { QuickLinksCard } from "./widget-quick-links"
import { TodoCard } from "./widget-todo"
import { WeatherCard } from "./widget-weather"
import { Field, Input, Checkbox, Textarea } from "@tabora/ui"

function migrateFromLocalStorage(key: string): string | null {
  const value = localStorage.getItem(key)
  if (value !== null) {
    localStorage.removeItem(key)
  }
  return value
}

export function NotesCard(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
  const storageKey = "notes-content"

  onMount(async () => {
    let saved = await props.data.get<string>(storageKey)
    if (saved === undefined) {
      const legacy = migrateFromLocalStorage("notes-content")
      if (legacy !== null) {
        saved = legacy
        await props.data.save(storageKey, legacy)
      }
    }
    if (saved) setText(saved)
  })

  async function update(value: string) {
    setText(value)
    await props.data.save(storageKey, value)
  }

  return (
    <Textarea
      value={text()}
      onInput={update}
      placeholder="写点什么..."
      aria-label="便签内容"
      rows={4}
    />
  )
}

export function NotesModal(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
  const storageKey = "notes-content"

  onMount(async () => {
    let saved = await props.data.get<string>(storageKey)
    if (saved === undefined) {
      const legacy = migrateFromLocalStorage("notes-content")
      if (legacy !== null) {
        saved = legacy
        await props.data.save(storageKey, legacy)
      }
    }
    if (saved) setText(saved)
  })

  async function update(value: string) {
    setText(value)
    await props.data.save(storageKey, value)
  }

  return (
    <div class="notes-modal">
      <h3>便签</h3>
      <Textarea
        value={text()}
        onInput={update}
        placeholder="尽情书写..."
        aria-label="便签弹窗内容"
        rows={12}
      />
    </div>
  )
}

export function TodayFocusCard(props: WidgetViewProps) {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)
  const contentKey = "focus-content"
  const doneKey = "focus-done"
  const inputId = () => `today-focus-${props.instanceId}`

  onMount(async () => {
    let saved = await props.data.get<string>(contentKey)
    let savedDone = await props.data.get<string>(doneKey)

    if (saved === undefined) {
      const legacyKey = `today-focus:${props.instanceId}:content`
      const legacyDoneKey = `today-focus:${props.instanceId}:done`
      const legacy = migrateFromLocalStorage(legacyKey)
      const legacyDone = migrateFromLocalStorage(legacyDoneKey)
      if (legacy !== null) {
        saved = legacy
        await props.data.save(contentKey, legacy)
      }
      if (legacyDone !== null) {
        savedDone = legacyDone
        await props.data.save(doneKey, legacyDone)
      }
    }

    if (saved) setFocus(saved)
    setDone(savedDone === "true")
  })

  async function updateFocus(value: string) {
    setFocus(value)
    await props.data.save(contentKey, value)
  }
  async function updateDone(value: boolean) {
    setDone(value)
    await props.data.save(doneKey, String(value))
  }

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
          defaultConfig: {
            links: [
              { title: "GitHub", url: "https://github.com" },
              { title: "Vite+", url: "https://viteplus.dev" },
            ],
          },
          views: { card: "official.widgets.quick-links.card" },
        },
        {
          id: "notes",
          title: "便签",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: {
            card: "official.widgets.notes.card",
            modal: "official.widgets.notes.modal",
          },
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
