import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

type InjectedI18n = {
  t: (key: string, vars?: Record<string, string | number>) => string
}

function resolveI18n(props: SettingsPanelViewProps): InjectedI18n | undefined {
  return (props as SettingsPanelViewProps & { i18n?: InjectedI18n }).i18n
}

function fallbackText(key: string, vars?: Record<string, string | number>) {
  const template =
    {
      "settings.appearance.layoutGroupTitle": "工作台布局",
      "settings.appearance.layoutHelp":
        "布局是插件。当前可在 Dashboard 与 Focus 间切换，适配不同使用习惯和工作流程。",
      "settings.appearance.layoutAria": "工作台布局",
      "settings.appearance.layoutCurrentPrefix": "当前布局：",

      "settings.appearance.themeGroupTitle": "主题",
      "settings.appearance.themeHelp": "选择明亮或暗色主题。主题来自 theme 插件的 token 贡献。",
      "settings.appearance.themeGlyphLight": "明",
      "settings.appearance.themeGlyphDark": "暗",
      "settings.appearance.themeDescLight": "浅色页面，白天使用",
      "settings.appearance.themeDescDark": "深色页面，夜间使用",

      "settings.appearance.backgroundGroupTitle": "背景",
      "settings.appearance.backgroundHelp":
        "选择页面背景。背景来源通过 background-provider 贡献，渲染由 background-renderer 执行。",
      "settings.appearance.backgroundAria": "页面背景",

      "settings.appearance.localeGroupTitle": "语言",
      "settings.appearance.localeHelp": "切换工作台界面语言。设置会写入当前工作区外观配置。",
      "settings.appearance.localeLabel": "当前语言",
      "settings.appearance.localeDesc": "影响工作台宿主文案和官方插件面板文案",
      "settings.appearance.localeAria": "选择语言",

      "settings.search.sectionTitle": "搜索",
      "settings.search.help": "搜索栏默认使用的搜索引擎。可在搜索框中用 @引擎名 临时切换。",
      "settings.search.errors.atLeastOne": "至少启用一个搜索源",
      "settings.search.errors.defaultNotEnabled": "默认搜索源未启用，请重新选择",
      "settings.search.errors.defaultUnavailable": "默认搜索源不可用，请重新选择",
      "settings.search.kind.code": "代码",
      "settings.search.kind.search": "搜索",
      "settings.search.current": "✓ 当前",
      "settings.search.toggle.disable": "禁用",
      "settings.search.toggle.enable": "启用",
      "settings.search.enabledHint": "已启用 {{count}} 个搜索源",

      "settings.workbench.layoutGroupTitle": "工作台布局",
      "settings.workbench.layoutHelp":
        "布局是插件。当前可用布局来自 layout contribution，Focus 布局用于深度专注工作流。",
      "settings.workbench.layoutHint": "不同的布局适合不同的使用习惯和工作流程。",

      "settings.workbench.workspaceGroupTitle": "工作区",
      "settings.workbench.currentWorkspace": "当前工作区",
      "settings.workbench.currentWorkspaceDesc": "存储布局、主题、背景和卡片配置",
      "settings.workbench.currentSuffix": " · 当前",
      "settings.workbench.switch": "切换",
      "settings.workbench.delete": "删除",
      "settings.workbench.createPlaceholder": "新建工作区",
      "settings.workbench.createAria": "新建工作区名称",
      "settings.workbench.createButton": "创建",
      "settings.workbench.export": "导出",
      "settings.workbench.import": "导入",
      "settings.workbench.importSuccess": "导入成功",
      "settings.workbench.exportFailed": "导出失败",
      "settings.workbench.importFailed": "导入失败",
      "settings.workbench.importActionFailed": "导入操作失败",
    }[key] ?? key

  if (!vars) return template
  let result = template
  for (const [varKey, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${varKey}}}`, String(value))
  }
  return result
}

function createT(props: SettingsPanelViewProps) {
  return (key: string, vars?: Record<string, string | number>) =>
    resolveI18n(props)?.t(key, vars) ?? fallbackText(key, vars)
}

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const t = createT(props)
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
        <div class="set-group-title">{t("settings.appearance.layoutGroupTitle")}</div>
        <p class="settings-help">{t("settings.appearance.layoutHelp")}</p>
        <div
          class="layout-picker"
          role="radiogroup"
          aria-label={t("settings.appearance.layoutAria")}
        >
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
          {t("settings.appearance.layoutCurrentPrefix")}
          {activeLayout()?.title ?? props.workspace.activeLayoutId}
        </div>
      </section>

      <section class="set-group">
        <div class="set-group-title">{t("settings.appearance.themeGroupTitle")}</div>
        <p class="settings-help">{t("settings.appearance.themeHelp")}</p>
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
                <span class="theme-card-glyph">{t("settings.appearance.themeGlyphLight")}</span>
                <span class="theme-card-name">{theme().title}</span>
                <span class="theme-card-desc">{t("settings.appearance.themeDescLight")}</span>
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
                <span class="theme-card-glyph">{t("settings.appearance.themeGlyphDark")}</span>
                <span class="theme-card-name">{theme().title}</span>
                <span class="theme-card-desc">{t("settings.appearance.themeDescDark")}</span>
              </button>
            )}
          </Show>
        </div>
      </section>

      <section class="set-group">
        <div class="set-group-title">{t("settings.appearance.backgroundGroupTitle")}</div>
        <p class="settings-help">{t("settings.appearance.backgroundHelp")}</p>
        <div class="bg-grid" role="radiogroup" aria-label={t("settings.appearance.backgroundAria")}>
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
          <div class="set-group-title">{t("settings.appearance.localeGroupTitle")}</div>
          <p class="settings-help">{t("settings.appearance.localeHelp")}</p>
          <div class="set-row">
            <div class="set-row-info">
              <div class="set-row-label">{t("settings.appearance.localeLabel")}</div>
              <div class="set-row-desc">{t("settings.appearance.localeDesc")}</div>
            </div>
            <select
              id="settings-locale-select"
              class="settings-select"
              value={localeValue()}
              onChange={(event) =>
                void props.host.switchLocale?.(event.currentTarget.value as "zh-CN" | "en-US")
              }
              aria-label={t("settings.appearance.localeAria")}
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

function providerKindLabel(
  provider: SettingsPanelViewProps["searchProviders"][number],
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (provider.id.includes("github")) return t("settings.search.kind.code")
  return t("settings.search.kind.search")
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
  const t = createT(props)
  const enabledIds = () => props.searchSettings.enabledProviderIds

  const enabledProviders = createMemo(() =>
    props.searchProviders.filter((p) => enabledIds().includes(p.id)),
  )

  const configurationError = createMemo(() => {
    if (enabledIds().length === 0) return t("settings.search.errors.atLeastOne")
    if (!enabledIds().includes(props.searchSettings.defaultProviderId)) {
      return t("settings.search.errors.defaultNotEnabled")
    }
    if (
      !props.searchProviders.some(
        (provider) => provider.id === props.searchSettings.defaultProviderId,
      )
    ) {
      return t("settings.search.errors.defaultUnavailable")
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
        <div class="set-group-title">{t("settings.search.sectionTitle")}</div>
        <p class="settings-help">{t("settings.search.help")}</p>
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
                    <span class="search-provider-kind">{providerKindLabel(provider, t)}</span>
                    <span class="search-provider-text">
                      <span class="search-provider-title">{provider.title}</span>
                      <span class="search-provider-alias">{providerAlias(provider)}</span>
                    </span>
                  </button>
                  <div class="search-provider-actions">
                    <span class="provider-state">
                      {isDefault() ? t("settings.search.current") : ""}
                    </span>
                    <SettingsSwitch
                      checked={isEnabled()}
                      label={`${isEnabled() ? t("settings.search.toggle.disable") : t("settings.search.toggle.enable")} ${provider.title}`}
                      onChange={() => handleToggle(provider.id)}
                    />
                  </div>
                </div>
              )
            }}
          </For>
        </div>
        <div class="set-hint">
          {t("settings.search.enabledHint", { count: enabledProviders().length })}
        </div>
      </section>
    </div>
  )
}

export function WorkbenchSettingsPanel(props: SettingsPanelViewProps) {
  const t = createT(props)
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
      setImportError(err instanceof Error ? err.message : t("settings.workbench.exportFailed"))
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
          setImportError(err instanceof Error ? err.message : t("settings.workbench.importFailed"))
        }
      }
      input.click()
    } catch (err: unknown) {
      setImportError(
        err instanceof Error ? err.message : t("settings.workbench.importActionFailed"),
      )
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
        <div class="set-group-title">{t("settings.workbench.layoutGroupTitle")}</div>
        <p class="settings-help">{t("settings.workbench.layoutHelp")}</p>
        <div class="set-hint">{t("settings.workbench.layoutHint")}</div>
      </section>

      <section class="set-group">
        <div class="set-group-title">{t("settings.workbench.workspaceGroupTitle")}</div>
        <div class="set-row">
          <div class="set-row-info">
            <div class="set-row-label">{t("settings.workbench.currentWorkspace")}</div>
            <div class="set-row-desc">{t("settings.workbench.currentWorkspaceDesc")}</div>
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
                    {ws.id === props.workspace.id ? t("settings.workbench.currentSuffix") : ""}
                  </span>
                  <div class="workspace-list-actions">
                    <Show when={ws.id !== props.workspace.id}>
                      <button
                        type="button"
                        class="settings-mini-btn"
                        onClick={() => void props.host.switchWorkspace?.(ws.id)}
                      >
                        {t("settings.workbench.switch")}
                      </button>
                    </Show>
                    <Show when={ws.id !== "default"}>
                      <button
                        type="button"
                        class="settings-mini-btn danger"
                        onClick={() => void props.host.deleteWorkspace?.(ws.id)}
                      >
                        {t("settings.workbench.delete")}
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
            placeholder={t("settings.workbench.createPlaceholder")}
            aria-label={t("settings.workbench.createAria")}
          />
          <button
            type="button"
            class="settings-mini-btn"
            disabled={!newWorkspaceName().trim()}
            onClick={() => void handleCreate()}
          >
            {t("settings.workbench.createButton")}
          </button>
        </div>
        <div class="workspace-actions">
          <button type="button" class="settings-mini-btn" onClick={() => void handleExport()}>
            {t("settings.workbench.export")}
          </button>
          <button type="button" class="settings-mini-btn" onClick={handleImport}>
            {t("settings.workbench.import")}
          </button>
        </div>
        <Show when={importError()}>
          <SettingsInlineError>{importError()!}</SettingsInlineError>
        </Show>
        <Show when={importSuccess()}>
          <div class="workspace-import-success">{t("settings.workbench.importSuccess")}</div>
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
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
          "settings.appearance.layoutGroupTitle": "工作台布局",
          "settings.appearance.layoutHelp":
            "布局是插件。当前可在 Dashboard 与 Focus 间切换，适配不同使用习惯和工作流程。",
          "settings.appearance.layoutAria": "工作台布局",
          "settings.appearance.layoutCurrentPrefix": "当前布局：",

          "settings.appearance.themeGroupTitle": "主题",
          "settings.appearance.themeHelp": "选择明亮或暗色主题。主题来自 theme 插件的 token 贡献。",
          "settings.appearance.themeGlyphLight": "明",
          "settings.appearance.themeGlyphDark": "暗",
          "settings.appearance.themeDescLight": "浅色页面，白天使用",
          "settings.appearance.themeDescDark": "深色页面，夜间使用",

          "settings.appearance.backgroundGroupTitle": "背景",
          "settings.appearance.backgroundHelp":
            "选择页面背景。背景来源通过 background-provider 贡献，渲染由 background-renderer 执行。",
          "settings.appearance.backgroundAria": "页面背景",

          "settings.appearance.localeGroupTitle": "语言",
          "settings.appearance.localeHelp": "切换工作台界面语言。设置会写入当前工作区外观配置。",
          "settings.appearance.localeLabel": "当前语言",
          "settings.appearance.localeDesc": "影响工作台宿主文案和官方插件面板文案",
          "settings.appearance.localeAria": "选择语言",

          "settings.search.sectionTitle": "搜索",
          "settings.search.help": "搜索栏默认使用的搜索引擎。可在搜索框中用 @引擎名 临时切换。",
          "settings.search.errors.atLeastOne": "至少启用一个搜索源",
          "settings.search.errors.defaultNotEnabled": "默认搜索源未启用，请重新选择",
          "settings.search.errors.defaultUnavailable": "默认搜索源不可用，请重新选择",
          "settings.search.kind.code": "代码",
          "settings.search.kind.search": "搜索",
          "settings.search.current": "✓ 当前",
          "settings.search.toggle.disable": "禁用",
          "settings.search.toggle.enable": "启用",
          "settings.search.enabledHint": "已启用 {{count}} 个搜索源",

          "settings.workbench.layoutGroupTitle": "工作台布局",
          "settings.workbench.layoutHelp":
            "布局是插件。当前可用布局来自 layout contribution，Focus 布局用于深度专注工作流。",
          "settings.workbench.layoutHint": "不同的布局适合不同的使用习惯和工作流程。",

          "settings.workbench.workspaceGroupTitle": "工作区",
          "settings.workbench.currentWorkspace": "当前工作区",
          "settings.workbench.currentWorkspaceDesc": "存储布局、主题、背景和卡片配置",
          "settings.workbench.currentSuffix": " · 当前",
          "settings.workbench.switch": "切换",
          "settings.workbench.delete": "删除",
          "settings.workbench.createPlaceholder": "新建工作区",
          "settings.workbench.createAria": "新建工作区名称",
          "settings.workbench.createButton": "创建",
          "settings.workbench.export": "导出",
          "settings.workbench.import": "导入",
          "settings.workbench.importSuccess": "导入成功",
          "settings.workbench.exportFailed": "导出失败",
          "settings.workbench.importFailed": "导入失败",
          "settings.workbench.importActionFailed": "导入操作失败",
        },
      },
      {
        locale: "en-US",
        messages: {
          "settings.appearance.layoutGroupTitle": "Workbench layout",
          "settings.appearance.layoutHelp":
            "Layouts are plugins. Switch between Dashboard and Focus to match your workflow.",
          "settings.appearance.layoutAria": "Workbench layout",
          "settings.appearance.layoutCurrentPrefix": "Current layout: ",

          "settings.appearance.themeGroupTitle": "Theme",
          "settings.appearance.themeHelp": "Choose a light or dark theme. Themes are token-based.",
          "settings.appearance.themeGlyphLight": "L",
          "settings.appearance.themeGlyphDark": "D",
          "settings.appearance.themeDescLight": "Light theme for daytime",
          "settings.appearance.themeDescDark": "Dark theme for night",

          "settings.appearance.backgroundGroupTitle": "Background",
          "settings.appearance.backgroundHelp":
            "Choose the page background. Sources come from background-provider contributions.",
          "settings.appearance.backgroundAria": "Page background",

          "settings.appearance.localeGroupTitle": "Language",
          "settings.appearance.localeHelp":
            "Switch the workbench language. This setting is saved in the current workspace.",
          "settings.appearance.localeLabel": "Current language",
          "settings.appearance.localeDesc": "Affects shell copy and official plugin panels",
          "settings.appearance.localeAria": "Choose language",

          "settings.search.sectionTitle": "Search",
          "settings.search.help":
            "Default provider for the search bar. Use @provider in the search box to switch temporarily.",
          "settings.search.errors.atLeastOne": "Enable at least one provider",
          "settings.search.errors.defaultNotEnabled":
            "Default provider is disabled. Choose another one.",
          "settings.search.errors.defaultUnavailable":
            "Default provider is unavailable. Choose another one.",
          "settings.search.kind.code": "Code",
          "settings.search.kind.search": "Web",
          "settings.search.current": "✓ Current",
          "settings.search.toggle.disable": "Disable",
          "settings.search.toggle.enable": "Enable",
          "settings.search.enabledHint": "{{count}} providers enabled",

          "settings.workbench.layoutGroupTitle": "Layouts",
          "settings.workbench.layoutHelp":
            "Layouts are plugins. Available layouts come from layout contributions.",
          "settings.workbench.layoutHint": "Different layouts fit different workflows.",

          "settings.workbench.workspaceGroupTitle": "Workspace",
          "settings.workbench.currentWorkspace": "Current workspace",
          "settings.workbench.currentWorkspaceDesc":
            "Stores layout, theme, background, and widgets",
          "settings.workbench.currentSuffix": " · current",
          "settings.workbench.switch": "Switch",
          "settings.workbench.delete": "Delete",
          "settings.workbench.createPlaceholder": "Create workspace",
          "settings.workbench.createAria": "Workspace name",
          "settings.workbench.createButton": "Create",
          "settings.workbench.export": "Export",
          "settings.workbench.import": "Import",
          "settings.workbench.importSuccess": "Import succeeded",
          "settings.workbench.exportFailed": "Export failed",
          "settings.workbench.importFailed": "Import failed",
          "settings.workbench.importActionFailed": "Import action failed",
        },
      },
    ])

    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      (props: SettingsPanelViewProps) =>
        AppearanceSettingsPanel({ ...props, i18n: context.i18n } as SettingsPanelViewProps & {
          i18n?: InjectedI18n
        }),
    )
    context.registry.views.register(
      "official.settings.workspace.search.view",
      (props: SettingsPanelViewProps) =>
        SearchSettingsPanel({ ...props, i18n: context.i18n } as SettingsPanelViewProps & {
          i18n?: InjectedI18n
        }),
    )
    context.registry.views.register(
      "official.settings.workspace.workbench.view",
      (props: SettingsPanelViewProps) =>
        WorkbenchSettingsPanel({ ...props, i18n: context.i18n } as SettingsPanelViewProps & {
          i18n?: InjectedI18n
        }),
    )
  },
}
