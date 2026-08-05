import type { SettingsPanelProviderContext, SettingsPanelViewProps } from "@tabora/plugin-api"
import type { SettingsPanelDescriptor } from "@tabora/workbench-shell"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import { createWorkbenchShellSettingsHostCopy } from "../i18n"

export function createWorkbenchShellSurfaceSettingsProps(shell: WorkbenchShell) {
  const { overlays, workspace, runtime } = shell.state
  const {
    catalog,
    views,
    settingsProviders,
    settingsProviderContext,
    buildSettingsPanelProps,
    tShell,
  } = shell

  return {
    settingsHost: {
      open: overlays.settingsOpen(),
      panels: catalog.listSettingsPanels(),
      activeSectionId: overlays.activeSettingsSectionId(),
      onSectionChange: overlays.setActiveSettingsSectionId,
      onClose: () => overlays.setSettingsOpen(false),
      getView: (viewId: string) => resolveWorkbenchView<SettingsPanelViewProps>(views, viewId),
      getSettingsProvider: (providerId: string) =>
        settingsProviders.has(providerId) ? settingsProviders.get(providerId) : undefined,
      providerContext: (panel: SettingsPanelDescriptor): SettingsPanelProviderContext => ({
        ...settingsProviderContext(),
        panel: {
          id: panel.id,
          pluginId: panel.pluginId,
          scope: panel.scope,
        },
      }),
      panelProps: buildSettingsPanelProps,
      ...(tShell ? { copy: createWorkbenchShellSettingsHostCopy(tShell) } : {}),
      aboutContent: (
        <WorkbenchSettingsAboutContent
          workspaceName={workspace.workspaceState()?.name ?? "未加载"}
          enabledPluginCount={
            catalog.pluginSummaries(runtime.pluginRecords()).filter((plugin) => plugin.enabled)
              .length
          }
          {...(tShell ? { tShell } : {})}
        />
      ),
    },
  }
}
