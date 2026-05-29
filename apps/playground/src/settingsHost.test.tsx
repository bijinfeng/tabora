import { createComponent } from "solid-js"
import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import type { SettingsPanelContribution } from "@tabora/plugin-api"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  SettingsHost,
  collectSettingsPanels,
  resolveInitialSettingsPanelId,
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

function panel(id: string, order?: number): SettingsPanelContribution {
  return order !== undefined
    ? { id, title: id, view: `${id}.view`, order }
    : { id, title: id, view: `${id}.view` }
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
          contributes: { settingsPanels: [panel("plugins", 10), panel("fallback")] },
        },
      },
    ]

    expect(collectSettingsPanels(plugins).map((item) => item.id)).toEqual([
      "plugins",
      "appearance",
      "search",
      "fallback",
    ])
  })

  it("uses requested panel when available and falls back to the first panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      { ...panel("plugins", 10), pluginId: "plugin-a" },
      { ...panel("search", 30), pluginId: "plugin-b" },
    ]

    expect(resolveInitialSettingsPanelId(panels, "search")).toBe("search")
    expect(resolveInitialSettingsPanelId(panels, "missing")).toBe("plugins")
  })

  it("renders the settings host with open=true", () => {
    const panels: SettingsPanelDescriptor[] = [
      { id: "test", title: "Test", view: "test.view", order: 10, pluginId: "plugin-a" },
    ]
    const views = new Map<string, any>([["test.view", () => document.createElement("div")]])

    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activePanelId: "test",
        onPanelChange: vi.fn(),
        onClose: vi.fn(),
        getView: (viewId) => views.get(viewId),
        panelProps: () => ({
          panelId: "test",
          pluginId: "plugin-a",
          host: {
            close: vi.fn(),
            setDirty: vi.fn(),
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
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: { defaultProviderId: "official.search.google" },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-host")).toBeTruthy()
  })

  it("keeps the settings container open when a panel view fails", () => {
    const panels: SettingsPanelDescriptor[] = [
      { id: "broken", title: "Broken", view: "broken.view", order: 10, pluginId: "plugin-a" },
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
        activePanelId: "broken",
        onPanelChange: vi.fn(),
        onClose: vi.fn(),
        getView: (viewId) => views.get(viewId),
        panelProps: () => ({
          panelId: "broken",
          pluginId: "plugin-a",
          host: {
            close: vi.fn(),
            setDirty: vi.fn(),
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
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: { defaultProviderId: "official.search.google" },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-host")).toBeTruthy()
    expect(root.textContent).toContain("Plugin view failed")
    expect(root.textContent).toContain("broken")
  })
})
