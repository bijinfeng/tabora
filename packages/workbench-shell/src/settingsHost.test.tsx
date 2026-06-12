import { createComponent } from "solid-js"
import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import type { SettingsPanelContribution } from "@tabora/plugin-api"
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
    view: `${id}.view`,
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
        view: "test.view",
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
        panelProps: () => ({
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
            activeLayoutId: "official.layout.workbench-dashboard",
            activeThemeId: "official.theme.light",
            activeBackgroundProviderId: "background.gradient-green",
            regions: {},
            createdAt: "",
            updatedAt: "",
          },
          layouts: [],
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: {
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google"],
          },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-drawer")).toBeTruthy()
  })

  it("renders prototype grouped settings navigation", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [],
        activeSectionId: "plugins",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
        panelProps: () => ({}) as never,
      }),
    )

    expect(root.querySelector(".settings-sidebar")?.textContent).toContain("设置")
    expect(root.querySelector(".settings-sidebar")?.textContent).toContain("插件")
    expect([...root.querySelectorAll(".settings-nav")].map((node) => node.textContent)).toEqual([
      "通用",
      "外观",
      "搜索",
      "已安装",
      "关于",
    ])
    expect(root.querySelector(".settings-tab-title")?.textContent).toContain("已安装插件")
  })

  it("renders injected copy when provided", () => {
    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels: [],
        activeSectionId: "plugins",
        onSectionChange: vi.fn(),
        onClose: vi.fn(),
        getView: () => undefined,
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
            if (id === "about") return "About"
            return id
          },
        },
      }),
    )

    expect(root.querySelector(".settings-sidebar")?.textContent).toContain("Settings")
    expect(root.querySelector(".settings-sidebar")?.textContent).toContain("Plugins")
    expect([...root.querySelectorAll(".settings-nav")].map((node) => node.textContent)).toEqual([
      "General",
      "Appearance",
      "Search",
      "Installed",
      "About",
    ])
    expect(root.querySelector(".settings-tab-title")?.textContent).toContain("Installed plugins")
    expect(root.querySelector(".settings-close")?.getAttribute("aria-label")).toBe("Close settings")
  })

  it("keeps the settings container open when a panel view fails", () => {
    const panels: SettingsPanelDescriptor[] = [
      {
        id: "official.settings.workspace.workbench",
        title: "Broken",
        view: "broken.view",
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
        panelProps: () => ({
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
            activeLayoutId: "official.layout.workbench-dashboard",
            activeThemeId: "official.theme.light",
            activeBackgroundProviderId: "background.gradient-green",
            regions: {},
            createdAt: "",
            updatedAt: "",
          },
          layouts: [],
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: {
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google"],
          },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-drawer")).toBeTruthy()
    expect(root.textContent).toContain("插件视图加载失败")
    expect(root.textContent).toContain("official.settings.workspace.workbench")
  })
})
