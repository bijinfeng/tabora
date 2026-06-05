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
            regions: {},
            createdAt: "",
            updatedAt: "",
          },
          layouts: [],
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: { defaultProviderId: "official.search.google" },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-drawer")).toBeTruthy()
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
            regions: {},
            createdAt: "",
            updatedAt: "",
          },
          layouts: [],
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: { defaultProviderId: "official.search.google" },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-drawer")).toBeTruthy()
    expect(root.textContent).toContain("插件视图加载失败")
    expect(root.textContent).toContain("official.settings.workspace.workbench")
  })
})
