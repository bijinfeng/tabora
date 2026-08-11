import type {
  SettingsPanelProviderContext,
  SettingsPanelViewProps,
  SettingsSurface,
} from "@tabora/plugin-api"
import type { SettingsHostProps, SettingsPanelDescriptor } from "@tabora/workbench-shell"

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
    settingsRoute,
    buildSettingsPanelProps,
    tShell,
  } = shell
  const surface = (): SettingsSurface => (shell.responsive.isMobile() ? "mobile" : "desktop")

  const settingsHost: SettingsHostProps = {
    open: overlays.settingsOpen(),
    panels: catalog.listSettingsPanels(),
    surface: surface(),
    showIndex: surface() === "mobile" && settingsRoute.isHome(),
    activeSectionId: overlays.activeSettingsSectionId(),
    onSectionChange: (sectionId) => settingsRoute.navigate(sectionId),
    onClose: () => settingsRoute.close(),
    onBack: () => settingsRoute.home(),
    getView: (viewId: string) => resolveWorkbenchView<SettingsPanelViewProps>(views, viewId),
    getSettingsProvider: (providerId: string) =>
      settingsProviders.has(providerId) ? settingsProviders.get(providerId) : undefined,
    providerContext: (
      panel: SettingsPanelDescriptor,
      currentSurface: SettingsSurface,
    ): SettingsPanelProviderContext => ({
      ...settingsProviderContext(currentSurface),
      surface: currentSurface,
      panel: {
        id: panel.id,
        pluginId: panel.pluginId,
        scope: panel.scope,
      },
    }),
    panelProps: (
      panel: SettingsPanelDescriptor,
      instanceId: string | undefined,
      currentSurface: SettingsSurface,
    ): SettingsPanelViewProps => buildSettingsPanelProps(panel, instanceId, currentSurface),
    ...(tShell ? { copy: createWorkbenchShellSettingsHostCopy(tShell) } : {}),
    aboutContent: (
      <WorkbenchSettingsAboutContent
        workspaceName={workspace.workspaceState()?.name ?? "未加载"}
        enabledPluginCount={
          catalog.pluginSummaries(runtime.pluginRecords()).filter((plugin) => plugin.enabled).length
        }
        {...(tShell ? { tShell } : {})}
      />
    ),
  }

  return { settingsHost }
}
