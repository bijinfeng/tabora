import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodoCard } from "./todo-card"

export const officialPluginTodo: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.todo",
    name: "Todo Widget",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "todo",
          title: "待办",
          supportedSizes: ["S", "M"],
          defaultSize: "S",
          allowMultipleInstances: true,
          views: { card: "official.widgets.todo.card" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.todo.card", TodoCard)
  },
}
