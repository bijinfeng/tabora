import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"
import type { SettingsPanelViewProps, Workspace } from "@tabora/plugin-api"

import { SearchSettingsPanel } from "./settings-workspace"

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
