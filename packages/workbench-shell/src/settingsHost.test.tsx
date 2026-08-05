import { createComponent } from "solid-js"
import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import type { SettingsPanelContribution, SettingsPanelViewProps } from "@tabora/plugin-api"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  SettingsHost,
  collectSettingsPanels,
  resolveInitialSettingsPanelId,
  resolveInitialSettingsSectionId,
  type SettingsPanelDescriptor,
  type SettingsSectionId,
} from "./settingsHost"

const mounts: Array<{ dispose: () => void; root: HTMLElement }> = []

afterEach(() => {
  for (const { dispose, root } of mounts.splice(0)) {
    dispose()
    root.remove()
  }
})

function mount(component: () => JSX.Element): HTMLElement {
  const root = document.createElement("div")
  document.body.append(root)
  const dispose = render(() => component(), root)
  mounts.push({ dispose, root })
  return root
}

function panel(
  id: string,
  order?: number,
  overrides: Partial<SettingsPanelContribution> = {},
): SettingsPanelContribution {
  return {
    id,
    title: id,
    content: { kind: "custom-view", view: `${id}.view` },
    section: "general",
    scope: "workspace",
    ...(order !== undefined ? { order } : {}),
    ...overrides,
  }
}

describe("settings host composition", () => {
  it("collects settings panels sorted by order and title", () => {
    const plugins = [
      {
        manifest: {
          id: "plugin-b",
          contributes: { settingsPanels: [panel("search", 30), panel("appearance", 20)] },
        },
      },
      {
        manifest: {
          id: "plugin-a",
          contributes: {
            settingsPanels: [
              panel("plugins", 10, { section: "plugins" }),
              panel("about", 40, { section: "about" }),
            ],
          },
        },
      },
    ]

    expect(collectSettingsPanels(plugins).map((item) => item.id)).toEqual([
      "plugins",
      "appearance",
      "search",
      "about",
    ])
  })

  it("collects explicit settings panel section and scope for host rendering", () => {
    const plugins = [
      {
        manifest: {
          id: "plugin-a",
          contributes: {
            settingsPanels: [
              panel("plugin.settings", 10, {
                section: "plugins",
                scope: "plugin",
              }),
              panel("instance.settings", 20, {
                section: "general",
                scope: "instance",
              }),
            ],
          },
        },
      },
    ]

    const panels = collectSettingsPanels(plugins)

    expect(panels[0]).toMatchObject({
      id: "plugin.settings",
      section: "plugins",
      scope: "plugin",
      pluginId: "plugin-a",
    })
    expect(panels[1]).toMatchObject({
      id: "instance.settings",
      section: "general",
      scope: "instance",
      pluginId: "plugin-a",
    })
  })

  it("uses requested panel when available and falls back to the first panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      { ...panel("plugins", 10), pluginId: "plugin-a", scope: "workspace" },
      { ...panel("search", 30), pluginId: "plugin-b", scope: "workspace" },
    ]

    expect(resolveInitialSettingsPanelId(panels, "search")).toBe("search")
    expect(resolveInitialSettingsPanelId(panels, "missing")).toBe("plugins")
  })

  it("maps settings panels to fixed sections", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        ...panel("official.settings.workspace.workbench", 10, { section: "general" }),
        pluginId: "plugin-a",
        scope: "workspace",
      },
      {
        ...panel("official.settings.workspace.search", 20, { section: "search" }),
        pluginId: "plugin-b",
        scope: "workspace",
      },
    ]

    expect(resolveInitialSettingsSectionId(panels, "official.settings.workspace.search")).toBe(
      "search",
    )
    expect(resolveInitialSettingsSectionId(panels, "missing")).toBe("general")
  })

  it("renders the settings host with open=true", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        id: "official.settings.workspace.workbench",
        title: "Test",
        content: { kind: "custom-view", view: "test.view" },
        section: "general",
        order: 10,
        pluginId: "plugin-a",
        scope: "workspace",
      },
    ]
    const views = new Map<string, any>([["test.view", () => document.createElement("div")]])

    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: (viewId) => views.get(viewId),
        getSettingsProvider: () => undefined,
        panelProps: () =>
          ({
            panelId: "official.settings.workspace.workbench",
            pluginId: "plugin-a",
            scope: "workspace",
            host: {
              close: vi.fn(),
              setDirty: vi.fn(),
              switchLayout: vi.fn(),
              switchTheme: vi.fn(),
              switchBackground: vi.fn(),
              setDefaultSearchProvider: vi.fn(),
            },
            workspace: {
              id: "default",
              name: "默认工作区",
              activeLayout: {
                pluginId: "official.layout",
                kind: "layout",
                id: "official.layout.workbench-dashboard",
              },
              activeTheme: {
                pluginId: "official.theme",
                kind: "theme",
                id: "official.theme.light",
              },
              activeBackgroundProvider: {
                pluginId: "official.background",
                kind: "background-provider",
                id: "background.gradient-green",
              },
              regions: {},
              createdAt: "",
              updatedAt: "",
            },
            layouts: [],
            themes: [],
            backgrounds: [],
            searchProviders: [],
            searchSettings: {
              defaultProvider: {
                pluginId: "official.search",
                kind: "search-provider",
                id: "official.search.google",
              },
              enabledProviders: [
                {
                  pluginId: "official.search",
                  kind: "search-provider",
                  id: "official.search.google",
                },
              ],
            },
            plugins: [],
            data: {},
          }) as unknown as SettingsPanelViewProps,
      }),
    )

    expect(root.querySelector("[data-settings-window]")).toBeTruthy()
    expect(root.querySelector(".settings-window")).toBeNull()
  })

  it("renders modal semantics and moves focus into the drawer when opened", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [
          {
            ...panel("plugins", 10, { section: "plugins" }),
            pluginId: "plugin-a",
          },
        ],
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => undefined,
        panelProps: () => ({}) as never,
      }),
    )

    const overlay = root.querySelector('[data-workbench-overlay="settings"]') as HTMLDivElement
    const closeButton = root.querySelector("[data-settings-close]") as HTMLButtonElement

    expect(overlay.getAttribute("role")).toBe("dialog")
    expect(overlay.getAttribute("aria-modal")).toBe("true")
    expect(document.activeElement).toBe(closeButton)
  })

  it("renders prototype grouped settings navigation", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [
          {
            ...panel("plugins", 10, { section: "plugins" }),
            pluginId: "plugin-a",
          },
        ],
        activeSectionId: "plugins",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => undefined,
        panelProps: () => ({}) as never,
      }),
    )

    expect(root.querySelector("[data-settings-nav]")?.textContent).toContain("工作台")
    expect(root.querySelector("[data-settings-nav]")?.textContent).toContain("扩展")
    expect(
      [...root.querySelectorAll("[data-settings-section]")].map(
        (node) => node.querySelector("span")?.textContent,
      ),
    ).toEqual(["插件", "关于"])
    expect(root.querySelector("[data-settings-panel-header]")?.textContent).toContain("插件")
    expect(
      root.querySelector('[data-settings-section="plugins"]')?.getAttribute("aria-current"),
    ).toBe("page")
  })

  it("renders injected copy when provided", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [
          {
            ...panel("plugins", 10, { section: "plugins" }),
            pluginId: "plugin-a",
          },
        ],
        activeSectionId: "plugins",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => undefined,
        panelProps: () => ({}) as never,
        copy: {
          sidebarTitle: "Settings",
          pluginGroupTitle: "Plugins",
          pluginInstalledNav: "Installed",
          pluginsActiveTitle: "Installed plugins",
          closeAriaLabel: "Close settings",
          aboutUnavailable: "About content unavailable",
          emptySection: "No settings in this section",
          panelMissing: (panelId: string) => `Settings panel unavailable: ${panelId}`,
          sectionTitle: (id: SettingsSectionId) => {
            if (id === "general") return "General"
            if (id === "appearance") return "Appearance"
            if (id === "search") return "Search"
            if (id === "account") return "Account"
            if (id === "ai") return "AI"
            if (id === "sync") return "Data sync"
            if (id === "plugins") return "Plugins"
            if (id === "about") return "About"
            return id
          },
          workspaceGroupTitle: "Workbench",
          extensionGroupTitle: "Extensions",
        },
      }),
    )

    expect(root.querySelector("[data-settings-nav]")?.textContent).toContain("Workbench")
    expect(root.querySelector("[data-settings-nav]")?.textContent).toContain("Extensions")
    expect(
      [...root.querySelectorAll("[data-settings-section]")].map(
        (node) => node.querySelector("span")?.textContent,
      ),
    ).toEqual(["Plugins", "About"])
    expect(root.querySelector("[data-settings-panel-header]")?.textContent).toContain("Plugins")
    expect(root.querySelector("[data-settings-close]")?.getAttribute("aria-label")).toBe(
      "Close settings",
    )
  })

  it("shows account navigation only while the account plugin contributes a panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        id: "official.settings.workspace.account",
        title: "账号",
        content: {
          kind: "schema",
          provider: "official.account-sync.account.provider",
          schemaVersion: 1,
        },
        section: "account",
        pluginId: "official.settings.workspace",
        scope: "workspace",
      },
    ]
    const panelProps = vi.fn(
      () =>
        ({
          panelId: "official.settings.workspace.account",
          pluginId: "official.settings.workspace",
          scope: "workspace",
          host: { close: vi.fn(), setDirty: vi.fn() },
        }) as unknown as SettingsPanelViewProps,
    )
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "account",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => ({
          getModel: () => ({ version: 1, nodes: [] }),
          dispatch: () => {},
        }),
        panelProps,
      }),
    )

    expect(root.querySelector('[data-settings-section="account"]')?.textContent).toContain("账号")
    expect(
      root.querySelector('[data-settings-section="account"]')?.getAttribute("aria-current"),
    ).toBe("page")
    expect(panelProps).not.toHaveBeenCalled()
  })

  it("builds schema-provider context from the active panel identity", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        id: "plugin.settings.account",
        title: "账号",
        content: { kind: "schema", provider: "plugin.settings.provider", schemaVersion: 1 },
        section: "account",
        pluginId: "plugin.account",
        scope: "plugin",
      },
    ]
    const providerContext = vi.fn((panel: SettingsPanelDescriptor) => ({
      panel: { id: panel.id, pluginId: panel.pluginId, scope: panel.scope },
    }))

    mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "account",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => ({
          getModel: () => ({ version: 1, nodes: [] }),
          dispatch: () => {},
        }),
        providerContext,
        panelProps: () => ({}) as never,
      }),
    )

    expect(providerContext).toHaveBeenCalledWith(panels[0])
  })

  it("does not expose an instance-scoped panel without a concrete instance target", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        ...panel("plugin.settings.instance", 10, { scope: "instance" }),
        pluginId: "plugin.example",
      },
    ]
    const getView = vi.fn(() => () => <div>instance settings</div>)
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView,
        getSettingsProvider: () => undefined,
        panelProps: () => ({}) as never,
      }),
    )

    expect(root.textContent).not.toContain("instance settings")
    expect(getView).not.toHaveBeenCalled()
  })

  it("passes the explicit target to an instance-scoped custom panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        ...panel("plugin.settings.instance", 10, { scope: "instance" }),
        pluginId: "plugin.example",
      },
    ]
    const panelProps = vi.fn((_panel: SettingsPanelDescriptor, instanceId?: string) => ({
      panelId: "plugin.settings.instance",
      pluginId: "plugin.example",
      scope: "instance" as const,
      ...(instanceId ? { instanceId } : {}),
      host: { close: vi.fn(), setDirty: vi.fn() },
      data: {},
    }))
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => (props) => <div>{props.instanceId}</div>,
        getSettingsProvider: () => undefined,
        panelProps,
        instanceId: "weather-1",
      }),
    )

    expect(root.textContent).toContain("weather-1")
    expect(panelProps).toHaveBeenCalledWith(panels[0], "weather-1")
  })

  it("keeps the settings container open when a panel view fails", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        id: "official.settings.workspace.workbench",
        title: "Broken",
        content: { kind: "custom-view", view: "broken.view" },
        section: "general",
        order: 10,
        pluginId: "plugin-a",
        scope: "workspace",
      },
    ]
    const views = new Map<string, any>([
      [
        "broken.view",
        () => {
          throw new Error("settings exploded")
        },
      ],
    ])

    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: (viewId) => views.get(viewId),
        getSettingsProvider: () => undefined,
        panelProps: () =>
          ({
            panelId: "official.settings.workspace.workbench",
            pluginId: "plugin-a",
            scope: "workspace",
            host: {
              close: vi.fn(),
              setDirty: vi.fn(),
              switchLayout: vi.fn(),
              switchTheme: vi.fn(),
              switchBackground: vi.fn(),
              setDefaultSearchProvider: vi.fn(),
            },
            workspace: {
              id: "default",
              name: "默认工作区",
              activeLayout: {
                pluginId: "official.layout",
                kind: "layout",
                id: "official.layout.workbench-dashboard",
              },
              activeTheme: {
                pluginId: "official.theme",
                kind: "theme",
                id: "official.theme.light",
              },
              activeBackgroundProvider: {
                pluginId: "official.background",
                kind: "background-provider",
                id: "background.gradient-green",
              },
              regions: {},
              createdAt: "",
              updatedAt: "",
            },
            layouts: [],
            themes: [],
            backgrounds: [],
            searchProviders: [],
            searchSettings: {
              defaultProvider: {
                pluginId: "official.search",
                kind: "search-provider",
                id: "official.search.google",
              },
              enabledProviders: [
                {
                  pluginId: "official.search",
                  kind: "search-provider",
                  id: "official.search.google",
                },
              ],
            },
            plugins: [],
            data: {},
          }) as unknown as SettingsPanelViewProps,
      }),
    )

    expect(root.querySelector("[data-settings-window]")).toBeTruthy()
    expect(root.textContent).toContain("插件视图加载失败")
    expect(root.textContent).toContain("official.settings.workspace.workbench")
  })

  it("renders empty and missing states through shared ui blocks", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [
          {
            id: "missing.panel",
            pluginId: "official.missing",
            title: "缺失面板",
            content: { kind: "custom-view", view: "missing.view" },
            section: "general",
            scope: "workspace",
          },
        ],
        activeSectionId: "general",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        getSettingsProvider: () => undefined,
        panelProps: () => ({}) as never,
      }),
    )

    expect(root.textContent).toContain("设置面板不可用：missing.panel")
  })
})
