import type { PluginModule } from "@tabora/plugin-api/sdk"
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

export const officialSettingsWorkspace: PluginModule = {
  manifest: officialSettingsWorkspaceManifest,
  activate(context) {
    context.views.register("official.settings.workspace.appearance.view", AppearanceSettingsPanel)
    context.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
    context.views.register("official.settings.workspace.workbench.view", WorkbenchSettingsPanel)
    context.views.register("official.settings.workspace.ai.view", AiSettingsPanel)
    context.views.register("official.settings.workspace.plugins.view", PluginRuntimeSettingsPanel)
  },
}
