import type { SettingsPanelViewProps } from "@tabora/plugin-api"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import { createWorkbenchShellSettingsHostCopy } from "../i18n"

export function createWorkbenchShellSurfaceSettingsProps(shell: WorkbenchShell) {
  const { overlays, workspace, runtime } = shell.state
  const { catalog, views, buildSettingsPanelProps, tShell } = shell

  return {
    settingsHost: {
      open: overlays.settingsOpen(),
      panels: catalog.listSettingsPanels(),
      activeSectionId: overlays.activeSettingsSectionId(),
      onSectionChange: overlays.setActiveSettingsSectionId,
      onClose: () => overlays.setSettingsOpen(false),
      getView: (viewId: string) => resolveWorkbenchView<SettingsPanelViewProps>(views, viewId),
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
