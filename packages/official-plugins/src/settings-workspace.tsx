import type { BuiltinPlugin } from "@tabora/platform-kernel"
export { AccountSettingsPanel } from "./settings-workspace.account"
export { AiSettingsPanel } from "./settings-workspace.ai"
export { AppearanceSettingsPanel } from "./settings-workspace.appearance"
export { PluginRuntimeSettingsPanel } from "./settings-workspace.plugins"
export { SearchSettingsPanel } from "./settings-workspace.search"
export { SyncSettingsPanel } from "./settings-workspace.sync"
export { WorkbenchSettingsPanel } from "./settings-workspace.workbench"

import { AccountSettingsPanel } from "./settings-workspace.account"
import { AiSettingsPanel } from "./settings-workspace.ai"
import { AppearanceSettingsPanel } from "./settings-workspace.appearance"
import { PluginRuntimeSettingsPanel } from "./settings-workspace.plugins"
import { SearchSettingsPanel } from "./settings-workspace.search"
import { SyncSettingsPanel } from "./settings-workspace.sync"
import { WorkbenchSettingsPanel } from "./settings-workspace.workbench"

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./settings-workspace",
    styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.workspace.account",
          title: "账号",
          view: "official.settings.workspace.account.view",
          section: "account",
          scope: "workspace",
          order: 10,
        },
        {
          id: "official.settings.workspace.appearance",
          title: "外观",
          view: "official.settings.workspace.appearance.view",
          section: "appearance",
          scope: "workspace",
          order: 20,
        },
        {
          id: "official.settings.workspace.search",
          title: "搜索",
          view: "official.settings.workspace.search.view",
          section: "search",
          scope: "workspace",
          order: 30,
        },
        {
          id: "official.settings.workspace.workbench",
          title: "工作区",
          view: "official.settings.workspace.workbench.view",
          section: "general",
          scope: "workspace",
          order: 40,
        },
        {
          id: "official.settings.workspace.ai",
          title: "AI",
          view: "official.settings.workspace.ai.view",
          section: "ai",
          scope: "workspace",
          order: 50,
        },
        {
          id: "official.settings.workspace.sync",
          title: "数据同步",
          view: "official.settings.workspace.sync.view",
          section: "sync",
          scope: "workspace",
          order: 60,
        },
        {
          id: "official.settings.workspace.plugins",
          title: "运行插件配置",
          view: "official.settings.workspace.plugins.view",
          section: "plugins",
          scope: "workspace",
          order: 20,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.settings.workspace.account.view",
      AccountSettingsPanel,
    )
    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      AppearanceSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
    context.registry.views.register(
      "official.settings.workspace.workbench.view",
      WorkbenchSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.ai.view", AiSettingsPanel)
    context.registry.views.register("official.settings.workspace.sync.view", SyncSettingsPanel)
    context.registry.views.register(
      "official.settings.workspace.plugins.view",
      PluginRuntimeSettingsPanel,
    )
  },
}
