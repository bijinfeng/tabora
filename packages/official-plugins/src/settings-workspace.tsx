import { For } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { Badge, CardSection, Field, ListRow, Select } from "@tabora/ui"

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

function searchProviderOptions(props: SettingsPanelViewProps) {
  return props.searchProviders.map((provider) => ({
    value: provider.id,
    label: provider.shortcut ? `${provider.title} (${provider.shortcut})` : provider.title,
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
  const providers = () => searchProviderOptions(props)
  const value = () => props.searchSettings.defaultProviderId || providers()[0]?.value || ""

  return (
    <CardSection title="搜索">
      <div class="settings-panel-stack">
        <Field label="默认搜索源" htmlFor="settings-search-provider-select">
          <Select
            id="settings-search-provider-select"
            value={value()}
            options={providers()}
            onChange={(providerId) => void props.host.setDefaultSearchProvider(providerId)}
            aria-label="选择默认搜索源"
          />
        </Field>
        <ul class="settings-provider-list">
          <For each={props.searchProviders}>
            {(provider) => (
              <li>
                <ListRow
                  primary={provider.title}
                  secondary={provider.urlTemplate}
                  trailing={
                    provider.id === value() ? (
                      <Badge variant="accent">默认</Badge>
                    ) : provider.shortcut ? (
                      <Badge>{provider.shortcut}</Badge>
                    ) : null
                  }
                />
              </li>
            )}
          </For>
        </ul>
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
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      AppearanceSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
  },
}
