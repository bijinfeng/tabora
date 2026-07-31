import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodoCard } from "./todo-card"
import { TodoExpand } from "./todo-expand"
import { officialPluginTodoManifest } from "./manifest"

export const officialPluginTodo: BuiltinPlugin = {
  enabled: true,
  manifest: officialPluginTodoManifest,
  activate(context) {
    context.registry.views.register("official.widgets.todo.card", TodoCard)
    context.registry.views.register("official.widgets.todo.expand", TodoExpand)
  },
}
