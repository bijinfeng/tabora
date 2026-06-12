import type { BuiltinPlugin } from "@tabora/platform-kernel"
export { AppearanceSettingsPanel } from "./settings-workspace.appearance"
export { SearchSettingsPanel } from "./settings-workspace.search"
export { WorkbenchSettingsPanel } from "./settings-workspace.workbench"

import { AppearanceSettingsPanel } from "./settings-workspace.appearance"
import { SearchSettingsPanel } from "./settings-workspace.search"
import { WorkbenchSettingsPanel } from "./settings-workspace.workbench"

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./settings-workspace",
    styles: [{ href: "./settings-workspace.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
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
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      AppearanceSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
    context.registry.views.register(
      "official.settings.workspace.workbench.view",
      WorkbenchSettingsPanel,
    )
  },
}
