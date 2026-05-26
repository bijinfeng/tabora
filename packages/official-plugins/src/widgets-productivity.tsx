import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodoCard } from "./widget-todo"
import { WeatherCard } from "./widget-weather"

export function QuickLinksCard() {
  return (
    <div class="quick-links">
      <a href="https://github.com" target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href="https://viteplus.dev" target="_blank" rel="noreferrer">
        Vite+
      </a>
    </div>
  )
}

export function NotesCard() {
  return <p>今天先把插件内核跑通。</p>
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
    context.registry.views.register("official.widgets.quick-links.card", QuickLinksCard)
    context.registry.views.register("official.widgets.notes.card", NotesCard)
    context.registry.views.register("official.widgets.notes.modal", NotesCard)
    context.registry.views.register("official.widgets.todo.card", TodoCard)
    context.registry.views.register("official.widgets.weather.card", WeatherCard)
  },
}
