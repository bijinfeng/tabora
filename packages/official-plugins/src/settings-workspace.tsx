import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const activeLayout = () =>
    props.layouts.find((layout) => layout.id === props.workspace.activeLayoutId)
  const activeTheme = () => props.workspace.activeThemeId
  const activeBackground = () => props.workspace.activeBackgroundProviderId
  const localeValue = () => props.locale ?? "zh-CN"
  const localeOptions = () => props.availableLocales ?? []
  const canSwitchLocale = () =>
    typeof props.host.switchLocale === "function" && localeOptions().length > 0
  const lightTheme = () =>
    props.themes.find((theme) => /light|明|亮/i.test(`${theme.id} ${theme.title}`)) ??
    props.themes[0]
  const darkTheme = () =>
    props.themes.find((theme) => /dark|暗/i.test(`${theme.id} ${theme.title}`)) ?? props.themes[1]

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">工作台布局</div>
        <p class="settings-help">
          布局是插件。当前可在 Dashboard 与 Focus 间切换，适配不同使用习惯和工作流程。
        </p>
        <div class="layout-picker" role="radiogroup" aria-label="工作台布局">
          <For each={props.layouts}>
            {(layout) => (
              <button
                type="button"
                class="layout-option"
                classList={{ active: layout.id === props.workspace.activeLayoutId }}
                onClick={() => void props.host.switchLayout?.(layout.id)}
                aria-pressed={layout.id === props.workspace.activeLayoutId}
              >
                <span class="layout-option-icon">{layout.id.includes("focus") ? "◎" : "▦"}</span>
                <span class="layout-option-name">{layout.title}</span>
              </button>
            )}
          </For>
        </div>
        <div class="set-hint">
          当前布局：{activeLayout()?.title ?? props.workspace.activeLayoutId}
        </div>
      </section>

      <section class="set-group">
        <div class="set-group-title">主题</div>
        <p class="settings-help">选择明亮或暗色主题。主题来自 theme 插件的 token 贡献。</p>
        <div class="theme-card-grid">
          <Show when={lightTheme()}>
            {(theme) => (
              <button
                type="button"
                id="themeLight"
                class="theme-card"
                classList={{ active: activeTheme() === theme().id }}
                onClick={() => void props.host.switchTheme(theme().id)}
              >
                <span class="theme-card-glyph">明</span>
                <span class="theme-card-name">{theme().title}</span>
                <span class="theme-card-desc">浅色页面，白天使用</span>
              </button>
            )}
          </Show>
          <Show when={darkTheme()}>
            {(theme) => (
              <button
                type="button"
                id="themeDark"
                class="theme-card"
                classList={{ active: activeTheme() === theme().id }}
                onClick={() => void props.host.switchTheme(theme().id)}
              >
                <span class="theme-card-glyph">暗</span>
                <span class="theme-card-name">{theme().title}</span>
                <span class="theme-card-desc">深色页面，夜间使用</span>
              </button>
            )}
          </Show>
        </div>
      </section>

      <section class="set-group">
        <div class="set-group-title">背景</div>
        <p class="settings-help">
          选择页面背景。背景来源通过 background-provider 贡献，渲染由 background-renderer 执行。
        </p>
        <div class="bg-grid" role="radiogroup" aria-label="页面背景">
          <For each={props.backgrounds}>
            {(background, index) => (
              <button
                type="button"
                class={`bg-item bg-item-${(index() % 5) + 1}`}
                classList={{ active: activeBackground() === background.id }}
                onClick={() => void props.host.switchBackground(background.id)}
                aria-pressed={activeBackground() === background.id}
              >
                {background.title}
              </button>
            )}
          </For>
        </div>
      </section>

      <Show when={canSwitchLocale()}>
        <section class="set-group">
          <div class="set-group-title">语言</div>
          <p class="settings-help">切换工作台界面语言。设置会写入当前工作区外观配置。</p>
          <div class="set-row">
            <div class="set-row-info">
              <div class="set-row-label">当前语言</div>
              <div class="set-row-desc">影响工作台宿主文案和官方插件面板文案</div>
            </div>
            <select
              id="settings-locale-select"
              class="settings-select"
              value={localeValue()}
              onChange={(event) =>
                void props.host.switchLocale?.(event.currentTarget.value as "zh-CN" | "en-US")
              }
              aria-label="选择语言"
            >
              <For each={localeOptions()}>
                {(option) => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>
        </section>
      </Show>
    </div>
  )
}

function SettingsInlineError(props: { children: string }) {
  return <div class="settings-inline-error">{props.children}</div>
}

function providerShortcut(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return provider.shortcut ?? `@${provider.id.split(".").at(-1) ?? provider.id}`
}

function providerAlias(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return providerShortcut(provider).startsWith("@")
    ? providerShortcut(provider)
    : `@${providerShortcut(provider)}`
}

function providerKindLabel(provider: SettingsPanelViewProps["searchProviders"][number]) {
  if (provider.id.includes("github")) return "代码"
  return "搜索"
}

function SettingsSwitch(props: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label class="sw-wrap">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        aria-label={props.label}
      />
      <span class="sw-track">
        <span class="sw-thumb" />
      </span>
    </label>
  )
}

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const enabledIds = () => props.searchSettings.enabledProviderIds

  const enabledProviders = createMemo(() =>
    props.searchProviders.filter((p) => enabledIds().includes(p.id)),
  )

  const configurationError = createMemo(() => {
    if (enabledIds().length === 0) return "至少启用一个搜索源"
    if (!enabledIds().includes(props.searchSettings.defaultProviderId)) {
      return "默认搜索源未启用，请重新选择"
    }
    if (
      !props.searchProviders.some(
        (provider) => provider.id === props.searchSettings.defaultProviderId,
      )
    ) {
      return "默认搜索源不可用，请重新选择"
    }
    return null
  })

  const defaultId = () => props.searchSettings.defaultProviderId

  function handleToggle(providerId: string) {
    const currentlyEnabled = enabledIds().includes(providerId)
    void props.host.setSearchProviderEnabled?.(providerId, !currentlyEnabled)
  }

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">默认搜索引擎</div>
        <p class="settings-help">
          搜索栏默认使用的搜索引擎。可在搜索框中用 <code>@引擎名</code> 临时切换。
        </p>
        <Show when={configurationError()}>
          <SettingsInlineError>{configurationError()!}</SettingsInlineError>
        </Show>
        <div class="settings-provider-list" id="settings-search-provider-select">
          <For each={props.searchProviders}>
            {(provider) => {
              const isEnabled = () => enabledIds().includes(provider.id)
              const isDefault = () => provider.id === defaultId()
              return (
                <div
                  class="search-provider-row"
                  classList={{ active: isDefault(), disabled: !isEnabled() }}
                >
                  <button
                    type="button"
                    class="search-provider-main"
                    onClick={() => void props.host.setDefaultSearchProvider(provider.id)}
                    disabled={!isEnabled()}
                  >
                    <span class="search-provider-kind">{providerKindLabel(provider)}</span>
                    <span class="search-provider-text">
                      <span class="search-provider-title">{provider.title}</span>
                      <span class="search-provider-alias">{providerAlias(provider)}</span>
                    </span>
                  </button>
                  <div class="search-provider-actions">
                    <span class="provider-state">{isDefault() ? "✓ 当前" : ""}</span>
                    <SettingsSwitch
                      checked={isEnabled()}
                      label={`${isEnabled() ? "禁用" : "启用"} ${provider.title}`}
                      onChange={() => handleToggle(provider.id)}
                    />
                  </div>
                </div>
              )
            }}
          </For>
        </div>
        <div class="set-hint">已启用 {enabledProviders().length} 个搜索源</div>
      </section>
    </div>
  )
}

export function WorkbenchSettingsPanel(props: SettingsPanelViewProps) {
  const [importError, setImportError] = createSignal<string | null>(null)
  const [importWarnings, setImportWarnings] = createSignal<string[]>([])
  const [importSuccess, setImportSuccess] = createSignal(false)

  async function handleExport() {
    try {
      const json = await props.host.exportWorkspace?.()
      if (!json) return
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `tabora-workspace-${props.workspace.name}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "导出失败")
    }
  }

  async function handleImport() {
    setImportError(null)
    setImportWarnings([])
    setImportSuccess(false)
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const text = await file.text()
          const result = await props.host.importWorkspace?.(text)
          if (!result) return
          setImportWarnings(result.warnings)
          setImportSuccess(true)
        } catch (err: unknown) {
          setImportError(err instanceof Error ? err.message : "导入失败")
        }
      }
      input.click()
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "导入操作失败")
    }
  }

  const [newWorkspaceName, setNewWorkspaceName] = createSignal("")

  async function handleCreate() {
    const name = newWorkspaceName().trim()
    if (!name) return
    await props.host.createWorkspace?.(name)
    setNewWorkspaceName("")
  }

  const workspaces = () => props.workspaces ?? []

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">工作台布局</div>
        <p class="settings-help">
          布局是插件。当前可用布局来自 layout contribution，Focus 布局用于深度专注工作流。
        </p>
        <div class="set-hint">不同的布局适合不同的使用习惯和工作流程。</div>
      </section>

      <section class="set-group">
        <div class="set-group-title">工作区</div>
        <div class="set-row">
          <div class="set-row-info">
            <div class="set-row-label">当前工作区</div>
            <div class="set-row-desc">存储布局、主题、背景和卡片配置</div>
          </div>
          <span class="settings-row-meta">{props.workspace.name}</span>
        </div>
        <Show when={workspaces().length > 1}>
          <div class="workspace-list">
            <For each={workspaces()}>
              {(ws) => (
                <div class="workspace-list-item">
                  <span
                    class="workspace-list-name"
                    classList={{
                      active: ws.id === props.workspace.id,
                    }}
                  >
                    {ws.name}
                    {ws.id === props.workspace.id ? " · 当前" : ""}
                  </span>
                  <div class="workspace-list-actions">
                    <Show when={ws.id !== props.workspace.id}>
                      <button
                        type="button"
                        class="settings-mini-btn"
                        onClick={() => void props.host.switchWorkspace?.(ws.id)}
                      >
                        切换
                      </button>
                    </Show>
                    <Show when={ws.id !== "default"}>
                      <button
                        type="button"
                        class="settings-mini-btn danger"
                        onClick={() => void props.host.deleteWorkspace?.(ws.id)}
                      >
                        删除
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <div class="workspace-create-row">
          <input
            id="ws-new-name"
            class="workspace-create-input"
            value={newWorkspaceName()}
            onInput={(e) => setNewWorkspaceName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            placeholder="新建工作区"
            aria-label="新建工作区名称"
          />
          <button
            type="button"
            class="settings-mini-btn"
            disabled={!newWorkspaceName().trim()}
            onClick={() => void handleCreate()}
          >
            创建
          </button>
        </div>
        <div class="workspace-actions">
          <button type="button" class="settings-mini-btn" onClick={() => void handleExport()}>
            导出
          </button>
          <button type="button" class="settings-mini-btn" onClick={handleImport}>
            导入
          </button>
        </div>
        <Show when={importError()}>
          <SettingsInlineError>{importError()!}</SettingsInlineError>
        </Show>
        <Show when={importSuccess()}>
          <div class="workspace-import-success">导入成功</div>
        </Show>
        <Show when={importWarnings().length > 0}>
          <ul class="workspace-import-warnings">
            <For each={importWarnings()}>{(warning) => <li>{warning}</li>}</For>
          </ul>
        </Show>
      </section>
    </div>
  )
}

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./settings-workspace",
    styles: [{ href: "./settings-workspace.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.workspace.appearance",
          title: "外观",
          view: "official.settings.workspace.appearance.view",
          section: "appearance",
          scope: "workspace",
          order: 20,
        },
        {
          id: "official.settings.workspace.search",
          title: "搜索",
          view: "official.settings.workspace.search.view",
          section: "search",
          scope: "workspace",
          order: 30,
        },
        {
          id: "official.settings.workspace.workbench",
          title: "工作区",
          view: "official.settings.workspace.workbench.view",
          section: "general",
          scope: "workspace",
          order: 40,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      AppearanceSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
    context.registry.views.register(
      "official.settings.workspace.workbench.view",
      WorkbenchSettingsPanel,
    )
  },
}
