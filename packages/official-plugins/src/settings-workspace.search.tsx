import { createMemo, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

import {
  providerAlias,
  providerKindLabel,
  SettingsInlineError,
  SettingsSwitch,
} from "./settings-workspace.shared"

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const enabledIds = () => props.searchSettings.enabledProviderIds

  const enabledProviders = createMemo(() =>
    props.searchProviders.filter((provider) => enabledIds().includes(provider.id)),
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
