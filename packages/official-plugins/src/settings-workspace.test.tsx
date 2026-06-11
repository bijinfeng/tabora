import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"
import type { SettingsPanelViewProps, Workspace } from "@tabora/plugin-api"

import { AppearanceSettingsPanel, SearchSettingsPanel } from "./settings-workspace"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Default",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    config: {
      search: {
        defaultProviderId: "official.search.google",
        enabledProviderIds: ["official.search.google", "official.search.bing"],
      },
    },
    regions: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function host(): SettingsPanelViewProps["host"] {
  return {
    close: vi.fn(),
    setDirty: vi.fn(),
    switchTheme: vi.fn(async () => {}),
    switchBackground: vi.fn(async () => {}),
    switchLayout: vi.fn(async () => {}),
    setDefaultSearchProvider: vi.fn(async () => {}),
    setSearchProviderEnabled: vi.fn(async () => {}),
  }
}

describe("SearchSettingsPanel", () => {
  it("renders prototype search provider rows", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const setDefaultSearchProvider = vi.fn(async () => {})
    const panelHost = {
      ...host(),
      setDefaultSearchProvider,
    }

    render(
      () => (
        <SearchSettingsPanel
          panelId="official.settings.workspace.search"
          pluginId="official.settings"
          scope="workspace"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          layouts={[]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "@google",
              urlTemplate: "https://google.example/search?q={query}",
            },
            {
              id: "official.search.github",
              title: "GitHub",
              shortcut: "@github",
              urlTemplate: "https://github.example/search?q={query}",
            },
          ]}
          searchSettings={{
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google", "official.search.github"],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.querySelectorAll(".search-provider-row")).toHaveLength(2)
    expect(root.querySelector(".search-provider-row.active")?.textContent).toContain("✓ 当前")
    expect(root.textContent).toContain("@github")
    ;(root.querySelectorAll(".search-provider-main")[1] as HTMLButtonElement).click()
    expect(setDefaultSearchProvider).toHaveBeenCalledWith("official.search.github")
    root.remove()
  })

  it("shows an inline error when the configured default provider is unavailable", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <SearchSettingsPanel
          panelId="official.settings.workspace.search"
          pluginId="official.settings"
          scope="workspace"
          host={host()}
          workspace={workspace()}
          workspaces={[workspace()]}
          layouts={[]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.bing",
              title: "Bing",
              urlTemplate: "https://bing.example/search?q={query}",
            },
          ]}
          searchSettings={{
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google", "official.search.bing"],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("默认搜索源不可用")
    root.remove()
  })

  it("does not auto-switch the default provider when disabling the current default", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const setDefaultSearchProvider = vi.fn(async () => {})
    const setSearchProviderEnabled = vi.fn(async () => {})
    const panelHost: SettingsPanelViewProps["host"] = {
      close: vi.fn(),
      setDirty: vi.fn(),
      switchTheme: vi.fn(async () => {}),
      switchBackground: vi.fn(async () => {}),
      switchLayout: vi.fn(async () => {}),
      setDefaultSearchProvider,
      setSearchProviderEnabled,
    }

    render(
      () => (
        <SearchSettingsPanel
          panelId="official.settings.workspace.search"
          pluginId="official.settings"
          scope="workspace"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          layouts={[]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.google",
              title: "Google",
              urlTemplate: "https://google.example/search?q={query}",
            },
            {
              id: "official.search.bing",
              title: "Bing",
              urlTemplate: "https://bing.example/search?q={query}",
            },
          ]}
          searchSettings={{
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google", "official.search.bing"],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    const toggle = root.querySelector('[aria-label="禁用 Google"]') as HTMLInputElement | null
    toggle?.click()

    expect(setSearchProviderEnabled).toHaveBeenCalledWith("official.search.google", false)
    expect(setDefaultSearchProvider).not.toHaveBeenCalled()
    root.remove()
  })
})

describe("AppearanceSettingsPanel", () => {
  it("renders prototype layout, theme, and background pickers", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const panelHost = host()

    render(
      () => (
        <AppearanceSettingsPanel
          panelId="official.settings.workspace.appearance"
          pluginId="official.settings"
          scope="workspace"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          layouts={[
            {
              id: "official.layout.workbench-dashboard",
              title: "Dashboard",
              regions: [],
              defaultRegions: {},
              supportsResponsive: true,
            },
            {
              id: "official.layout.focus",
              title: "Focus",
              regions: [],
              defaultRegions: {},
              supportsResponsive: true,
            },
          ]}
          themes={[
            { id: "official.theme.light", title: "明亮 · Sage Light", tokens: {} },
            { id: "official.theme.dark", title: "暗色 · Sage Dark", tokens: {} },
          ]}
          backgrounds={[
            { id: "official.background.default", title: "纯色 1", sourceType: "generated" },
            { id: "official.background.gradient", title: "渐变 1", sourceType: "generated" },
          ]}
          searchProviders={[]}
          searchSettings={{
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google"],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.querySelectorAll(".layout-option")).toHaveLength(2)
    expect(root.querySelectorAll(".theme-card")).toHaveLength(2)
    expect(root.querySelectorAll(".bg-item")).toHaveLength(2)
    expect(root.textContent).toContain("明")
    expect(root.textContent).toContain("暗")
    root.remove()
  })
})
