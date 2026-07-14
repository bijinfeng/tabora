import { Checkbox, FieldRow, Input, ListRow, SegmentedControl, Slider, Switch } from "@tabora/ui"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

import {
  providerAlias,
  providerKindLabel,
  SettingsInlineError,
  SettingsSwitch,
} from "./settings-workspace.shared"

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const [placeholder, setPlaceholder] = createSignal("搜索网页、命令或卡片")
  const [prefixes, setPrefixes] = createSignal("@ / # / :")
  const [includeWidgetActions, setIncludeWidgetActions] = createSignal(true)
  const [includeWeb, setIncludeWeb] = createSignal(true)
  const [includeCards, setIncludeCards] = createSignal(true)
  const [includeCommands, setIncludeCommands] = createSignal(true)
  const [includeHistory, setIncludeHistory] = createSignal(false)
  const [debounceMs, setDebounceMs] = createSignal(180)
  const enabledIds = () => props.searchSettings.enabledProviderIds

  const enabledProviders = createMemo(() =>
    props.searchProviders.filter((provider) => enabledIds().includes(provider.id)),
  )
  const providerOptions = () =>
    props.searchProviders.map((provider) => ({
      value: provider.id,
      label: provider.title,
      disabled: !enabledIds().includes(provider.id),
    }))

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
        <div class="set-group-title">
          默认搜索源<span>{enabledProviders()[0]?.title ?? "未配置"}</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="搜索框占位"
          description="输入命令、网页或卡片名称时显示的提示"
          trailing={
            <Input
              size="sm"
              value={placeholder()}
              onInput={setPlaceholder}
              aria-label="搜索框占位"
            />
          }
        />
        <FieldRow
          class="settings-form-row"
          label="默认引擎"
          description="也可以在搜索框里输入 @github 临时切换"
          trailing={
            <Show
              when={providerOptions().length > 0}
              fallback={<span class="settings-row-meta">{defaultId()}</span>}
            >
              <SegmentedControl<string>
                size="sm"
                value={defaultId()}
                options={providerOptions()}
                onChange={(providerId) => void props.host.setDefaultSearchProvider(providerId)}
                aria-label="默认搜索引擎"
              />
            </Show>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="命令前缀"
          description="用短前缀区分网页、卡片和插件命令"
          trailing={
            <Input size="sm" value={prefixes()} onInput={setPrefixes} aria-label="命令前缀" />
          }
        />
        <Show when={configurationError()}>
          <SettingsInlineError>{configurationError()!}</SettingsInlineError>
        </Show>
      </section>

      <section class="set-group">
        <div class="set-group-title">
          搜索范围<span>4 项</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="包含卡片动作"
          description="搜索结果显示添加卡片、打开详情等动作"
          trailing={
            <Switch
              size="sm"
              checked={includeWidgetActions()}
              onChange={setIncludeWidgetActions}
              aria-label="包含卡片动作"
            />
          }
        />
        <FieldRow
          class="settings-form-row"
          label="默认搜索范围"
          description="选择输入框默认纳入的内容来源"
          trailing={
            <div class="settings-check-chip-list" aria-label="默认搜索范围">
              <span class="settings-check-chip">
                <Checkbox checked={includeWeb()} onChange={setIncludeWeb} label="网页" />
              </span>
              <span class="settings-check-chip">
                <Checkbox checked={includeCards()} onChange={setIncludeCards} label="卡片" />
              </span>
              <span class="settings-check-chip">
                <Checkbox checked={includeCommands()} onChange={setIncludeCommands} label="命令" />
              </span>
              <span class="settings-check-chip">
                <Checkbox checked={includeHistory()} onChange={setIncludeHistory} label="历史" />
              </span>
            </div>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="输入防抖"
          description="减少输入时过于频繁的搜索刷新"
          trailing={
            <div class="settings-range-control">
              <Slider
                value={debounceMs()}
                min={80}
                max={420}
                step={20}
                onChange={setDebounceMs}
                aria-label="输入防抖"
              />
              <span>{debounceMs()}ms</span>
            </div>
          }
        />
      </section>

      <section class="set-group">
        <div class="set-group-title">
          搜索源管理<span>{enabledProviders().length} 个启用</span>
        </div>
        <div class="settings-provider-list" id="settings-search-provider-select">
          <For each={props.searchProviders}>
            {(provider) => {
              const isEnabled = () => enabledIds().includes(provider.id)
              const isDefault = () => provider.id === defaultId()
              return (
                <ListRow
                  class={`search-provider-row ${isDefault() ? "active" : ""} ${!isEnabled() ? "disabled" : ""}`.trim()}
                  primary={
                    <button
                      type="button"
                      class="search-provider-main"
                      onClick={() => {
                        if (!isEnabled()) return
                        void props.host.setDefaultSearchProvider(provider.id)
                      }}
                      disabled={!isEnabled()}
                    >
                      <span class="search-provider-kind">{providerKindLabel(provider)}</span>
                      <span class="search-provider-text">
                        <span class="search-provider-title">{provider.title}</span>
                        <span class="search-provider-alias">{providerAlias(provider)}</span>
                      </span>
                    </button>
                  }
                  trailing={
                    <div class="search-provider-actions">
                      <span class="provider-state">{isDefault() ? "✓ 当前" : ""}</span>
                      <SettingsSwitch
                        checked={isEnabled()}
                        label={`${isEnabled() ? "禁用" : "启用"} ${provider.title}`}
                        onChange={() => handleToggle(provider.id)}
                      />
                    </div>
                  }
                  selected={isDefault()}
                />
              )
            }}
          </For>
        </div>
      </section>
    </div>
  )
}
