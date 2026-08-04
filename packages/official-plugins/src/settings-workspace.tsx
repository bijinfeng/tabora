import type { BuiltinPlugin } from "@tabora/platform-kernel"
export { AiSettingsPanel } from "./settings-workspace.ai"
export { AppearanceSettingsPanel } from "./settings-workspace.appearance"
export { PluginRuntimeSettingsPanel } from "./settings-workspace.plugins"
export { SearchSettingsPanel } from "./settings-workspace.search"
export { WorkbenchSettingsPanel } from "./settings-workspace.workbench"

import { AiSettingsPanel } from "./settings-workspace.ai"
import { AppearanceSettingsPanel } from "./settings-workspace.appearance"
import { PluginRuntimeSettingsPanel } from "./settings-workspace.plugins"
import { SearchSettingsPanel } from "./settings-workspace.search"
import { WorkbenchSettingsPanel } from "./settings-workspace.workbench"
import { officialSettingsWorkspaceManifest } from "./ui-plugin-manifests"

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: officialSettingsWorkspaceManifest,
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
    context.registry.views.register("official.settings.workspace.ai.view", AiSettingsPanel)
    context.registry.views.register(
      "official.settings.workspace.plugins.view",
      PluginRuntimeSettingsPanel,
    )
  },
}
