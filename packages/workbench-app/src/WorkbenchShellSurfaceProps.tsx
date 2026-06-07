import { CommandPalette, SettingsHost, ToastHost } from "@tabora/workbench-shell"
import type { JSX } from "solid-js"

import {
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchFullscreenOverlay,
  WorkbenchPluginModal,
  WorkbenchSettingsAboutContent,
} from "./WorkbenchShellChrome"
import type { CommandExecutionContext } from "./shellHelpers"

type AddWidgetModalProps = Parameters<typeof WorkbenchAddWidgetModal>[0]
type SettingsHostProps = Parameters<typeof SettingsHost>[0]
type ExpandOverlayProps = Parameters<typeof WorkbenchExpandOverlay>[0]
type PluginModalProps = Parameters<typeof WorkbenchPluginModal>[0]
type FullscreenOverlayProps = Parameters<typeof WorkbenchFullscreenOverlay>[0]
type ContextMenuOverlayProps = Parameters<typeof WorkbenchContextMenuOverlay>[0]
type ToastHostProps = Parameters<typeof ToastHost>[0]
type CommandPaletteProps = Parameters<typeof CommandPalette>[0]

export type CreateWorkbenchShellSurfacePropsOptions = {
  content: JSX.Element
  availableWidgets: AddWidgetModalProps["availableWidgets"]
  widgetIconLabel: AddWidgetModalProps["widgetIconLabel"]
  addWidgetOpen: boolean
  addWidget: (pluginId: string, widgetId: string) => Promise<void> | void
  closeAddWidget: () => void
  settingsOpen: boolean
  settingsPanels: SettingsHostProps["panels"]
  activeSettingsSectionId: SettingsHostProps["activeSectionId"]
  onSettingsSectionChange: SettingsHostProps["onSectionChange"]
  closeSettings: () => void
  getSettingsView: SettingsHostProps["getView"]
  buildSettingsPanelProps: SettingsHostProps["panelProps"]
  workspaceName: string
  enabledPluginCount: number
  expandState: ExpandOverlayProps["expandState"]
  getWidgetView: ExpandOverlayProps["getView"]
  widgetIconForProps: ExpandOverlayProps["widgetIconForProps"]
  closeExpand: () => void
  modalViewId: PluginModalProps["viewId"]
  modalProps: PluginModalProps["modalProps"]
  getModalView: PluginModalProps["getView"]
  closeModal: () => void
  fullscreenViewId: FullscreenOverlayProps["viewId"]
  fullscreenProps: FullscreenOverlayProps["fullscreenProps"]
  getFullscreenView: FullscreenOverlayProps["getView"]
  closeFullscreen: () => void
  contextMenu: ContextMenuOverlayProps["menu"]
  contextSections: ContextMenuOverlayProps["sections"] | undefined
  closeContextMenu: () => void
  toasts: ToastHostProps["toasts"]
  runCommand: (commandId: string, context: CommandExecutionContext) => boolean | void
  commandPalette: CommandPaletteProps
}

export function createWorkbenchShellSurfaceProps(options: CreateWorkbenchShellSurfacePropsOptions) {
  return {
    content: options.content,
    addWidgetModal: {
      open: options.addWidgetOpen,
      availableWidgets: options.availableWidgets,
      widgetIconLabel: options.widgetIconLabel,
      onAdd: (pluginId: string, widgetId: string) => {
        void options.addWidget(pluginId, widgetId)
        options.closeAddWidget()
      },
      onClose: options.closeAddWidget,
    },
    settingsHost: {
      open: options.settingsOpen,
      panels: options.settingsPanels,
      activeSectionId: options.activeSettingsSectionId,
      onSectionChange: options.onSettingsSectionChange,
      onClose: options.closeSettings,
      getView: options.getSettingsView,
      panelProps: options.buildSettingsPanelProps,
      aboutContent: (
        <WorkbenchSettingsAboutContent
          workspaceName={options.workspaceName}
          enabledPluginCount={options.enabledPluginCount}
        />
      ),
    },
    expandOverlay: {
      expandState: options.expandState,
      getView: options.getWidgetView,
      widgetIconForProps: options.widgetIconForProps,
      onClose: options.closeExpand,
    },
    pluginModal: {
      viewId: options.modalViewId,
      modalProps: options.modalProps,
      getView: options.getModalView,
      onClose: options.closeModal,
    },
    fullscreenOverlay: {
      viewId: options.fullscreenViewId,
      fullscreenProps: options.fullscreenProps,
      getView: options.getFullscreenView,
      onClose: options.closeFullscreen,
    },
    contextMenuOverlay: {
      menu: options.contextMenu,
      sections: options.contextSections ?? [],
      onClose: options.closeContextMenu,
    },
    toastHost: {
      toasts: options.toasts,
      onAction: (commandId: string) => options.runCommand(commandId, {}),
    },
    commandPalette: options.commandPalette,
  }
}
