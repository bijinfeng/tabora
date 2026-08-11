import type { JSX } from "solid-js"
import type { PluginCatalog } from "@tabora/orchestrator"
import type { PluginInstance } from "@tabora/plugin-api"

import type { WorkbenchShell } from "./WorkbenchShellContext"
import { createWorkbenchShellState } from "./WorkbenchShellState"

// 测试支撑：构造一个最小但可工作的 WorkbenchShell。state 用真实 store 分片（行为真实，
// 便于断言 setter 副作用），仅 catalog / views / controllerRuntime 等用 stub 注入。
// 该文件不从 index 导出，只被 surface / context 测试引用。
//
// override 用宽松函数签名（而非精确的 controller 索引类型），让测试直接传普通 lambda / vi.fn，
// 无需在每个 callsite 写 `as unknown as` 转换；内部装配再统一 cast 回真实类型。

type WorkbenchControllerRuntime = WorkbenchShell["controllerRuntime"]
type WorkbenchWidgetController = WorkbenchControllerRuntime["widgetController"]
type WorkbenchSearchSurfaces = WorkbenchControllerRuntime["searchSurfaces"]

export type WorkbenchShellSurfaceStubOverrides = {
  layoutContent?: () => JSX.Element
  listWidgetContributions?: () => unknown[]
  listSettingsPanels?: () => unknown[]
  pluginSummaries?: (...args: unknown[]) => Array<{ enabled: boolean }>
  tShell?: WorkbenchShell["tShell"]
  addWidget?: (
    pluginId: string,
    widgetId: string,
    size?: string,
  ) => Promise<PluginInstance | null> | PluginInstance | null
  widgetContribution?: (...args: unknown[]) => { icon?: unknown } | undefined
  closeExpand?: () => void
  buildContextMenuModel?: () => { sections?: unknown[] } | undefined
  runCommand?: (commandId: string, context: unknown) => boolean | void
  buildCommandPaletteProps?: () => unknown
  pluginViewBoundaryCopy?: { loadFailed: string; retry: string }
  mobile?: boolean
}

export function createWorkbenchShellSurfaceStub(
  overrides: WorkbenchShellSurfaceStubOverrides = {},
): WorkbenchShell {
  const state = createWorkbenchShellState({
    initialSearchSettings: {
      defaultProvider: {
        pluginId: "official.search-providers.basic",
        kind: "search-provider",
        id: "official.search.google",
      },
      enabledProviders: [
        {
          pluginId: "official.search-providers.basic",
          kind: "search-provider",
          id: "official.search.google",
        },
      ],
    },
    initialVisualState: {
      layoutId: "official.layout.workbench-dashboard",
      themeId: "theme.light.custom",
      backgroundId: "background.clouds",
    },
    darkThemeId: "theme.dark.custom",
  })

  const catalog = {
    listWidgetContributions: overrides.listWidgetContributions ?? (() => []),
    listSettingsPanels: overrides.listSettingsPanels ?? (() => []),
    pluginSummaries: overrides.pluginSummaries ?? (() => []),
  } as unknown as PluginCatalog

  const views = {
    has: () => false,
    get: () => undefined,
  } as unknown as WorkbenchShell["views"]

  const settingsProviders = {
    has: () => false,
    get: () => undefined,
  } as unknown as WorkbenchShell["settingsProviders"]

  const widgetController = {
    addWidget: overrides.addWidget ?? (async () => {}),
    widgetContribution: overrides.widgetContribution ?? (() => undefined),
    closeExpand: overrides.closeExpand ?? (() => {}),
    buildContextMenuModel: overrides.buildContextMenuModel ?? (() => undefined),
  } as unknown as WorkbenchWidgetController

  const searchSurfaces = {
    buildCommandPaletteProps:
      overrides.buildCommandPaletteProps ??
      (() => ({
        isOpen: false,
        query: "",
        activeIdx: 0,
        onQueryChange: () => {},
        onActiveIdxChange: () => {},
        onClose: () => {},
        commands: [],
      })),
  } as unknown as WorkbenchSearchSurfaces

  const controllerRuntime = {
    widgetController,
    searchSurfaces,
    runCommand: overrides.runCommand ?? (() => {}),
  } as unknown as WorkbenchControllerRuntime

  const buildSettingsPanelProps =
    (() => ({})) as unknown as WorkbenchShell["buildSettingsPanelProps"]

  return {
    state,
    catalog,
    views,
    settingsProviders,
    settingsProviderContext: (surface) => ({ surface }),
    settingsRoute: {
      navigate: state.overlays.setActiveSettingsSectionId,
      home: () => state.overlays.setSettingsOpen(true),
      isHome: () => false,
      close: () => state.overlays.setSettingsOpen(false),
    },
    responsive: { isMobile: () => overrides.mobile ?? false },
    controllerRuntime,
    buildSettingsPanelProps,
    layoutContent: overrides.layoutContent ?? (() => null),
    ...(overrides.tShell ? { tShell: overrides.tShell } : {}),
    ...(overrides.pluginViewBoundaryCopy
      ? { shellCopy: { pluginViewBoundaryCopy: overrides.pluginViewBoundaryCopy } }
      : {}),
  }
}
