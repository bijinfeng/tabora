import type { PluginInstance, PluginManifest } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  initializeWorkbenchShellRuntime: vi.fn(async () => {}),
  wireWorkbenchRuntimeEvents: vi.fn(() => vi.fn()),
}))

vi.mock("./WorkbenchShellRuntimeState", () => ({
  initializeWorkbenchShellRuntime: mocks.initializeWorkbenchShellRuntime,
  wireWorkbenchRuntimeEvents: mocks.wireWorkbenchRuntimeEvents,
}))

import { createWorkbenchShellHostRuntime } from "./WorkbenchShellHostRuntime"

type RuntimeStub = {
  kernel: {
    events: {
      emit: ReturnType<typeof vi.fn>
    }
  }
  plugins: Array<{ manifest: Pick<PluginManifest, "id" | "permissions"> }>
}

function createRuntimeStub(): RuntimeStub {
  return {
    kernel: {
      events: {
        emit: vi.fn(),
      },
    },
    plugins: [
      {
        manifest: {
          id: "plugin.notes",
          permissions: [{ type: "external-open", hosts: ["example.com"] }],
        },
      },
    ],
  }
}

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function createOptions(
  overrides: Partial<Parameters<typeof createWorkbenchShellHostRuntime>[0]> = {},
): Parameters<typeof createWorkbenchShellHostRuntime>[0] {
  const runtime = createRuntimeStub()
  const base: Parameters<typeof createWorkbenchShellHostRuntime>[0] = {
    runtime: runtime as unknown as Parameters<typeof createWorkbenchShellHostRuntime>[0]["runtime"],
    hostPlatform: "web",
    isDark: () => false,
    setAddWidgetOpen: vi.fn(),
    openSettings: vi.fn(),
    switchTheme: vi.fn(async () => {}),
    setPluginRecords: vi.fn(),
    setKernelReady: vi.fn(),
    setWorkspaceList: vi.fn(),
    setWorkspaceState: vi.fn(),
    setLocale: vi.fn(),
    setActiveLayoutId: vi.fn(),
    setSearchSettings: vi.fn(),
    setSearchHistory: vi.fn(),
    setInstances: vi.fn(),
    applyThemeSelection: vi.fn(),
    applyBackgroundSelection: vi.fn(),
    reconcileInstancesForLayout: vi.fn(async () => ({ instances: [instance()], plan: null })),
    setModalViewId: vi.fn(),
    setModalProps: vi.fn(),
    setFullscreenViewId: vi.fn(),
    setFullscreenProps: vi.fn(),
    showToast: vi.fn(),
    windowOpen: vi.fn(),
    shellConfig: {
      themeIds: {
        light: "theme.light.custom",
        dark: "theme.dark.custom",
      },
      layoutIds: {
        dashboard: "layout.dashboard.custom",
        focus: "layout.focus.custom",
      },
      settingsPanelIds: {
        appearance: "settings.appearance.custom",
      },
      searchHistory: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
    },
  }

  return { ...base, ...overrides }
}

describe("createWorkbenchShellHostRuntime", () => {
  it("bridges runtime startup and event wiring through the shell host callbacks", async () => {
    const options = createOptions()
    const hostRuntime = createWorkbenchShellHostRuntime(options)

    await hostRuntime.initialize()

    expect(mocks.wireWorkbenchRuntimeEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        runtime: options.runtime,
        setModalViewId: options.setModalViewId,
        setModalProps: options.setModalProps,
        setFullscreenViewId: options.setFullscreenViewId,
        setFullscreenProps: options.setFullscreenProps,
        showToast: options.showToast,
        openExternal: expect.any(Function),
      }),
    )
    expect(mocks.initializeWorkbenchShellRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        runtime: options.runtime,
        setPluginRecords: options.setPluginRecords,
        setKernelReady: options.setKernelReady,
        setWorkspaceList: options.setWorkspaceList,
        setWorkspaceState: options.setWorkspaceState,
        setActiveLayoutId: options.setActiveLayoutId,
        setSearchSettings: options.setSearchSettings,
        setSearchHistory: options.setSearchHistory,
        setInstances: options.setInstances,
        applyThemeSelection: options.applyThemeSelection,
        applyBackgroundSelection: options.applyBackgroundSelection,
        reconcileInstancesForLayout: options.reconcileInstancesForLayout,
      }),
    )

    const runtimeEventCalls = mocks.wireWorkbenchRuntimeEvents.mock.calls as unknown as Array<
      [{ openExternal: (url: string) => void }]
    >
    const runtimeEventOptions = runtimeEventCalls[0]?.[0]
    runtimeEventOptions?.openExternal("https://example.com")
    expect(options.windowOpen).toHaveBeenCalledWith("https://example.com", "_blank")
  })

  it("routes external-open permission checks and rail actions through host helpers", () => {
    const runtime = createRuntimeStub()
    const runtimeEmit = runtime.kernel.events.emit
    const options = createOptions({
      runtime: runtime as unknown as Parameters<
        typeof createWorkbenchShellHostRuntime
      >[0]["runtime"],
    })
    const hostRuntime = createWorkbenchShellHostRuntime(options)

    expect(hostRuntime.openExternal("https://tabora.dev")).toBe(true)
    expect(runtimeEmit).toHaveBeenCalledWith("host.external.open", {
      url: "https://tabora.dev",
    })

    expect(hostRuntime.openExternalForPlugin("plugin.notes", "https://example.com/path")).toBe(true)
    expect(
      hostRuntime.openExternalForPlugin("plugin.notes", "https://not-allowed.example/path"),
    ).toBe(false)

    hostRuntime.runRailAction("add-widget")
    hostRuntime.runRailAction("theme")
    hostRuntime.runRailAction("settings")

    expect(options.setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(options.switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(options.openSettings).toHaveBeenCalledWith()
  })
})
