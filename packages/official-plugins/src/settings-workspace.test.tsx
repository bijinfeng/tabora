import { createComponent } from "solid-js"
import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import type { Workspace } from "@tabora/plugin-api/host"

import {
  AiSettingsPanel as AiSettingsPanelView,
  AppearanceSettingsPanel as AppearanceSettingsPanelView,
  SearchSettingsPanel as SearchSettingsPanelView,
  WorkbenchSettingsPanel as WorkbenchSettingsPanelView,
} from "./settings-workspace"

type LegacySettingsPanelProps = Omit<SettingsPanelViewProps, "data"> & {
  workspace: Workspace
  workspaces?: Workspace[]
  themes: NonNullable<SettingsPanelData["themes"]>
  backgrounds: NonNullable<SettingsPanelData["backgrounds"]>
  searchProviders: NonNullable<SettingsPanelData["searchProviders"]>
  searchSettings: NonNullable<SettingsPanelData["searchSettings"]>
  plugins: NonNullable<SettingsPanelData["plugins"]>
}

function workspaceSummary(value: Workspace) {
  return {
    id: value.id,
    name: value.name,
    activeLayout: value.activeLayout,
    activeTheme: value.activeTheme,
    activeBackgroundProvider: value.activeBackgroundProvider,
    regionCount: 2, // hardcoded: topbar + mainGrid
  }
}

function toSettingsPanelProps(input: LegacySettingsPanelProps): SettingsPanelViewProps {
  const {
    workspace: currentWorkspace,
    workspaces,
    themes,
    backgrounds,
    searchProviders,
    searchSettings,
    plugins,
    ...props
  } = input
  return {
    ...props,
    data: {
      workspace: workspaceSummary(currentWorkspace),
      ...(workspaces ? { workspaces: workspaces.map(workspaceSummary) } : {}),
      themes,
      backgrounds,
      searchProviders,
      searchSettings,
      plugins,
    },
  }
}

function SearchSettingsPanel(props: LegacySettingsPanelProps) {
  return createComponent(SearchSettingsPanelView, toSettingsPanelProps(props))
}

function AppearanceSettingsPanel(props: LegacySettingsPanelProps) {
  return createComponent(AppearanceSettingsPanelView, toSettingsPanelProps(props))
}

function WorkbenchSettingsPanel(props: LegacySettingsPanelProps) {
  return createComponent(WorkbenchSettingsPanelView, toSettingsPanelProps(props))
}

const refs = {
  layout: (id: string) => ({ pluginId: "official.layout", kind: "layout" as const, id }),
  theme: (id: string) => ({ pluginId: "official.theme", kind: "theme" as const, id }),
  background: (id: string) => ({
    pluginId: "official.background",
    kind: "background-provider" as const,
    id,
  }),
  provider: (id: string) => ({ pluginId: "official.search", kind: "search-provider" as const, id }),
}

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Default",
    activeLayout: refs.layout("official.layout.workbench-dashboard"),
    activeTheme: refs.theme("official.theme.light"),
    activeBackgroundProvider: refs.background("official.background.default"),
    config: {
      search: {
        defaultProvider: refs.provider("official.search.google"),
        enabledProviders: [
          refs.provider("official.search.google"),
          refs.provider("official.search.bing"),
        ],
      },
    },
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
    setDefaultSearchProvider: vi.fn(async () => {}),
    setSearchProviderEnabled: vi.fn(async () => {}),
    createWorkspace: vi.fn(async () => undefined),
    switchWorkspace: vi.fn(async () => {}),
    deleteWorkspace: vi.fn(async () => {}),
    exportWorkspace: vi.fn(async () => "{}"),
    importWorkspace: vi.fn(async () => ({ warnings: [] })),
  }
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find(
    (node) => node.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${text}`)
  }
  return button
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
          surface="desktop"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "@google",
              urlTemplate: "https://google.example/search?q={query}",
              ref: refs.provider("official.search.google"),
            },
            {
              id: "official.search.github",
              title: "GitHub",
              shortcut: "@github",
              urlTemplate: "https://github.example/search?q={query}",
              ref: refs.provider("official.search.github"),
            },
          ]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [
              refs.provider("official.search.google"),
              refs.provider("official.search.github"),
            ],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.querySelector("[data-settings-panel='search']")).toBeTruthy()
    expect(root.querySelector(".settings-panel-stack")).toBeNull()
    expect(root.querySelectorAll("[data-search-provider-main]")).toHaveLength(2)
    expect(root.querySelector("[data-selected]")?.textContent).toContain("当前")
    expect(root.querySelector("[data-selected] svg")).toBeTruthy()
    expect(root.textContent).toContain("@github")
    ;(root.querySelectorAll("[data-search-provider-main]")[1] as HTMLButtonElement).click()
    expect(setDefaultSearchProvider).toHaveBeenCalledWith(refs.provider("official.search.github"))
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
          surface="desktop"
          host={host()}
          workspace={workspace()}
          workspaces={[workspace()]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.bing",
              title: "Bing",
              urlTemplate: "https://bing.example/search?q={query}",
              ref: refs.provider("official.search.bing"),
            },
          ]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [
              refs.provider("official.search.google"),
              refs.provider("official.search.bing"),
            ],
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
      setDefaultSearchProvider,
      setSearchProviderEnabled,
    }

    render(
      () => (
        <SearchSettingsPanel
          panelId="official.settings.workspace.search"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.google",
              title: "Google",
              urlTemplate: "https://google.example/search?q={query}",
              ref: refs.provider("official.search.google"),
            },
            {
              id: "official.search.bing",
              title: "Bing",
              urlTemplate: "https://bing.example/search?q={query}",
              ref: refs.provider("official.search.bing"),
            },
          ]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [
              refs.provider("official.search.google"),
              refs.provider("official.search.bing"),
            ],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    const toggle = root.querySelector('[aria-label="禁用 Google"]') as HTMLInputElement | null
    toggle?.click()

    expect(setSearchProviderEnabled).toHaveBeenCalledWith(
      refs.provider("official.search.google"),
      false,
    )
    expect(setDefaultSearchProvider).not.toHaveBeenCalled()
    root.remove()
  })

  it("renders provider rows with current marker and toggle switch", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <SearchSettingsPanel
          panelId="official.settings.workspace.search"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={host()}
          workspace={workspace()}
          workspaces={[workspace()]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "@google",
              urlTemplate: "https://google.example/search?q={query}",
              ref: refs.provider("official.search.google"),
            },
          ]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [refs.provider("official.search.google")],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("默认搜索源")
    expect(root.textContent).toContain("当前")
    expect(root.querySelector("[data-selected] svg")).toBeTruthy()
    expect(root.querySelector('[aria-label="禁用 Google"]')).toBeTruthy()
    root.remove()
  })
})

describe("AppearanceSettingsPanel", () => {
  it("renders prototype form rows for theme, background, and locale", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const switchTheme = vi.fn(async () => {})
    const panelHost = {
      ...host(),
      switchTheme,
      switchLocale: vi.fn(async () => {}),
    }

    render(
      () => (
        <AppearanceSettingsPanel
          panelId="official.settings.workspace.appearance"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={panelHost}
          workspace={workspace()}
          workspaces={[workspace()]}
          themes={[
            {
              id: "official.theme.light",
              title: "明亮 · Sage Light",
              tokens: {},
              ref: refs.theme("official.theme.light"),
            },
            {
              id: "official.theme.dark",
              title: "暗色 · Sage Dark",
              tokens: {},
              ref: refs.theme("official.theme.dark"),
            },
          ]}
          backgrounds={[
            {
              id: "official.background.default",
              title: "纯色 1",
              sourceType: "generated",
              ref: refs.background("official.background.default"),
            },
            {
              id: "official.background.gradient",
              title: "渐变 1",
              sourceType: "generated",
              ref: refs.background("official.background.gradient"),
            },
          ]}
          searchProviders={[]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [refs.provider("official.search.google")],
          }}
          plugins={[]}
          locale="zh-CN"
          availableLocales={[
            { value: "zh-CN", label: "简体中文" },
            { value: "en-US", label: "English" },
          ]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("界面模式")
    expect(root.textContent).toContain("强调色")
    expect(root.textContent).toContain("页面背景")
    expect(root.textContent).toContain("背景渲染")
    expect(root.textContent).toContain("界面密度")
    expect(root.textContent).toContain("圆角半径")
    expect(root.textContent).toContain("正文大小")
    expect(root.textContent).toContain("当前语言")
    buttonByText(root, "暗色").click()
    expect(switchTheme).toHaveBeenCalledWith(refs.theme("official.theme.dark"))
    root.remove()
  })
})

describe("WorkbenchSettingsPanel", () => {
  it("renders workspace actions and creates a new workspace from the input", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const currentWorkspace = workspace({ id: "default" })
    const createWorkspace = vi.fn(async () => undefined)
    const switchWorkspace = vi.fn(async () => {})
    const deleteWorkspace = vi.fn(async () => {})
    const panelHost: SettingsPanelViewProps["host"] = {
      ...host(),
      createWorkspace,
      switchWorkspace,
      deleteWorkspace,
    }

    render(
      () => (
        <WorkbenchSettingsPanel
          panelId="official.settings.workspace.workbench"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={panelHost}
          workspace={currentWorkspace}
          workspaces={[currentWorkspace, workspace({ id: "workspace-2", name: "Focus Space" })]}
          themes={[]}
          backgrounds={[]}
          searchProviders={[]}
          searchSettings={{
            defaultProvider: refs.provider("official.search.google"),
            enabledProviders: [refs.provider("official.search.google")],
          }}
          plugins={[]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("Default")
    expect(root.textContent).toContain("Focus Space")

    buttonByText(root, "切换").click()
    expect(switchWorkspace).toHaveBeenCalledWith("workspace-2")

    buttonByText(root, "删除").click()
    expect(deleteWorkspace).toHaveBeenCalledWith("workspace-2")

    const input = root.querySelector("#ws-new-name") as HTMLInputElement
    expect(input.nextElementSibling?.textContent).toContain("创建")
    input.value = "  New Space  "
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "New Space" }))
    buttonByText(root, "创建").click()

    await Promise.resolve()

    expect(createWorkspace).toHaveBeenCalledWith("New Space")
    expect(input.value).toBe("")
    root.remove()
  })
})

describe("AiSettingsPanel", () => {
  it("prefills the custom provider name when editing a provider", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiSettingsPanelView
          panelId="official.settings.workspace.ai"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={host()}
          data={{
            ai: {
              supportedProviders: ["builtin", "custom"],
              activeProvider: "custom",
              builtin: { status: "unavailable", models: [], modelId: "gpt-5.5" },
              custom: {
                name: "智谱 GLM",
                baseUrl: "https://provider.example/v1",
                model: "gpt-5.5",
                models: ["gpt-5.5", "glm-4"],
                apiKeyConfigured: true,
              },
            },
          }}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("glm-4")
    expect(root.textContent).toContain("自定义供应商")
    expect(root.querySelectorAll("[role='radio']")).toHaveLength(2)
    buttonByText(root, "编辑").click()

    expect(document.body.querySelector<HTMLInputElement>("#custom-provider-name")?.value).toBe(
      "智谱 GLM",
    )

    document.body.querySelector<HTMLButtonElement>("[aria-label='关闭']")?.click()
    root.remove()
  })

  it("uses the host-stored API key when fetching models during edit", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const discoverAiModels = vi.fn(async (_baseUrl: string, _apiKey?: string) => ["new-model"])
    render(
      () => (
        <AiSettingsPanelView
          panelId="official.settings.workspace.ai"
          pluginId="official.settings"
          scope="workspace"
          surface="desktop"
          host={{ ...host(), discoverAiModels }}
          data={{
            ai: {
              supportedProviders: ["builtin", "custom"],
              activeProvider: "custom",
              builtin: { status: "unavailable", models: [], modelId: "gpt-5.5" },
              custom: {
                name: "智谱 GLM",
                baseUrl: "https://provider.example/v1",
                model: "gpt-5.5",
                apiKeyConfigured: true,
              },
            },
          }}
        />
      ),
      root,
    )

    buttonByText(root, "编辑").click()
    await Promise.resolve()
    const fetchButtons = [...document.body.querySelectorAll("button")].filter(
      (button) => button.textContent?.trim() === "获取模型",
    )
    fetchButtons.at(-1)?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(discoverAiModels).toHaveBeenCalledWith("https://provider.example/v1", undefined)
    expect(document.body.textContent).toContain("new-model")
    document.body.querySelector<HTMLButtonElement>("[aria-label='关闭']")?.click()
    root.remove()
  })
})
