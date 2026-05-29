import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { Badge, Button, CardSection, Field, InlineError, ListRow, Select, Switch } from "@tabora/ui"

function backgroundOptions(props: SettingsPanelViewProps) {
  return props.backgrounds.map((background) => ({
    value: background.id,
    label: background.title,
  }))
}

function themeOptions(props: SettingsPanelViewProps) {
  return props.themes.map((theme) => ({
    value: theme.id,
    label: theme.title,
  }))
}

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const themes = () => themeOptions(props)
  const backgrounds = () => backgroundOptions(props)
  const themeValue = () => props.workspace.activeThemeId
  const backgroundValue = () =>
    props.workspace.activeBackgroundProviderId ?? backgrounds()[0]?.value ?? ""

  return (
    <CardSection title="外观">
      <div class="settings-panel-stack">
        <Field label="主题" htmlFor="settings-theme-select">
          <Select
            id="settings-theme-select"
            value={themeValue()}
            options={themes()}
            onChange={(value) => void props.host.switchTheme(value)}
            aria-label="选择主题"
          />
        </Field>
        <Field label="背景" htmlFor="settings-background-select">
          <Select
            id="settings-background-select"
            value={backgroundValue()}
            options={backgrounds()}
            onChange={(value) => void props.host.switchBackground(value)}
            aria-label="选择背景"
          />
        </Field>
      </div>
    </CardSection>
  )
}

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const enabledIds = () =>
    props.searchSettings.enabledProviderIds ?? props.searchProviders.map((p) => p.id)

  const enabledProviders = createMemo(() =>
    props.searchProviders.filter((p) => enabledIds().includes(p.id)),
  )

  function enabledProviderOptions() {
    return enabledProviders().map((p) => ({
      value: p.id,
      label: p.shortcut ? `${p.title} (${p.shortcut})` : p.title,
    }))
  }

  const defaultId = () => props.searchSettings.defaultProviderId || enabledProviders()[0]?.id || ""

  function handleToggle(providerId: string) {
    const currentlyEnabled = enabledIds().includes(providerId)
    void props.host.setSearchProviderEnabled?.(providerId, !currentlyEnabled)
    if (currentlyEnabled && providerId === defaultId()) {
      const remaining = enabledProviders().filter((p) => p.id !== providerId)
      if (remaining[0]) {
        void props.host.setDefaultSearchProvider(remaining[0].id)
      }
    }
  }

  return (
    <CardSection title="搜索">
      <div class="settings-panel-stack">
        <Field label="默认搜索源" htmlFor="settings-search-provider-select">
          <Select
            id="settings-search-provider-select"
            value={defaultId()}
            options={enabledProviderOptions()}
            onChange={(providerId) => void props.host.setDefaultSearchProvider(providerId)}
            aria-label="选择默认搜索源"
          />
        </Field>
        <ul class="settings-provider-list">
          <For each={props.searchProviders}>
            {(provider) => {
              const isEnabled = () => enabledIds().includes(provider.id)
              return (
                <li>
                  <ListRow
                    primary={provider.title}
                    secondary={provider.urlTemplate}
                    trailing={
                      <div class="provider-controls">
                        {provider.id === defaultId() ? (
                          <Badge variant="accent">默认</Badge>
                        ) : provider.shortcut ? (
                          <Badge>{provider.shortcut}</Badge>
                        ) : null}
                        <Switch
                          checked={isEnabled()}
                          onChange={() => handleToggle(provider.id)}
                          aria-label={`${isEnabled() ? "禁用" : "启用"} ${provider.title}`}
                        />
                      </div>
                    }
                  />
                </li>
              )
            }}
          </For>
        </ul>
      </div>
    </CardSection>
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
    <CardSection title="工作区">
      <div class="settings-panel-stack">
        <div class="workspace-current">
          <Field label="当前工作区" htmlFor="ws-current-name">
            <span id="ws-current-name" class="workspace-active-name">
              {props.workspace.name}
            </span>
          </Field>
        </div>
        <Show when={workspaces().length > 1}>
          <div class="workspace-list">
            <div class="workspace-list-title">所有工作区</div>
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
                    {ws.id === props.workspace.id ? " (当前)" : ""}
                  </span>
                  <div class="workspace-list-actions">
                    <Show when={ws.id !== props.workspace.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void props.host.switchWorkspace?.(ws.id)}
                      >
                        切换
                      </Button>
                    </Show>
                    <Show when={ws.id !== "default"}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void props.host.deleteWorkspace?.(ws.id)}
                      >
                        删除
                      </Button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <div class="workspace-create">
          <Field label="新建工作区" htmlFor="ws-new-name">
            <div class="workspace-create-row">
              <input
                id="ws-new-name"
                class="workspace-create-input"
                value={newWorkspaceName()}
                onInput={(e) => setNewWorkspaceName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
                placeholder="工作区名称"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!newWorkspaceName().trim()}
                onClick={() => void handleCreate()}
              >
                创建
              </Button>
            </div>
          </Field>
        </div>
        <div class="workspace-actions">
          <Button variant="secondary" size="sm" onClick={() => void handleExport()}>
            导出工作区
          </Button>
          <Button variant="secondary" size="sm" onClick={handleImport}>
            导入工作区
          </Button>
        </div>
        <Show when={importError()}>
          <InlineError>{importError()}</InlineError>
        </Show>
        <Show when={importSuccess()}>
          <div class="workspace-import-success">导入成功</div>
        </Show>
        <Show when={importWarnings().length > 0}>
          <ul class="workspace-import-warnings">
            <For each={importWarnings()}>{(warning) => <li>{warning}</li>}</For>
          </ul>
        </Show>
      </div>
    </CardSection>
  )
}

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    entry: "./settings-workspace",
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.workspace.appearance",
          title: "外观",
          view: "official.settings.workspace.appearance.view",
          order: 20,
        },
        {
          id: "official.settings.workspace.search",
          title: "搜索",
          view: "official.settings.workspace.search.view",
          order: 30,
        },
        {
          id: "official.settings.workspace.workbench",
          title: "工作区",
          view: "official.settings.workspace.workbench.view",
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
