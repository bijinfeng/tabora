import type { PluginModule } from "@tabora/plugin-api/sdk"
import { TodoCard } from "./todo-card"
import { TodoExpand } from "./todo-expand"
import { officialPluginTodoManifest } from "./manifest"

export const officialPluginTodo: PluginModule = {
  manifest: officialPluginTodoManifest,
  activate(context) {
    context.views.register("official.widgets.todo.card", TodoCard)
    context.views.register("official.widgets.todo.expand", TodoExpand)
  },
}
