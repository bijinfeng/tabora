import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { Input } from "@tabora/ui/input"
import { ListRow } from "@tabora/ui/list-row"
import { Switch } from "@tabora/ui/switch"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { contributionRefKey, sameContributionRef } from "@tabora/plugin-api/sdk"
import Check from "lucide-solid/icons/check"

import {
  CheckChipList,
  ContributionSegmented,
  providerAlias,
  providerKindLabel,
  RangeField,
  SettingsGroup,
  SettingsInlineError,
  SettingsSwitch,
} from "./settings-workspace.shared"
import { className, styles } from "./styles"

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const searchSettings = () => props.data.searchSettings
  const searchProviders = () => props.data.searchProviders ?? []
  const [placeholder, setPlaceholder] = createSignal("搜索网页、命令或卡片")
  const [prefixes, setPrefixes] = createSignal("@ / # / :")
  const [includeWidgetActions, setIncludeWidgetActions] = createSignal(true)
  const [includeWeb, setIncludeWeb] = createSignal(true)
  const [includeCards, setIncludeCards] = createSignal(true)
  const [includeCommands, setIncludeCommands] = createSignal(true)
  const [includeHistory, setIncludeHistory] = createSignal(false)
  const [debounceMs, setDebounceMs] = createSignal(180)
  const enabledProviders = () => searchSettings()?.enabledProviders ?? []
  const isProviderEnabled = (provider: NonNullable<SettingsPanelData["searchProviders"]>[number]) =>
    enabledProviders().some((ref) => sameContributionRef(ref, provider.ref))

  const enabledProviderEntries = createMemo(() =>
    searchProviders().filter((provider) => isProviderEnabled(provider)),
  )
  const providerOptions = () =>
    searchProviders().map((provider) => ({
      value: contributionRefKey(provider.ref),
      label: provider.title,
      disabled: !isProviderEnabled(provider) || !props.host.setDefaultSearchProvider,
    }))

  const configurationError = createMemo(() => {
    if (enabledProviders().length === 0) return "至少启用一个搜索源"
    if (
      !enabledProviders().some((provider) =>
        sameContributionRef(provider, searchSettings()?.defaultProvider ?? provider),
      )
    ) {
      return "默认搜索源未启用，请重新选择"
    }
    if (
      !searchProviders().some((provider) =>
        sameContributionRef(provider.ref, searchSettings()?.defaultProvider ?? provider.ref),
      )
    ) {
      return "默认搜索源不可用，请重新选择"
    }
    return null
  })

  const defaultKey = () =>
    contributionRefKey(
      searchSettings()?.defaultProvider ?? {
        pluginId: "",
        kind: "search-provider" as const,
        id: "",
      },
    )

  function handleToggle(provider: NonNullable<SettingsPanelData["searchProviders"]>[number]) {
    void props.host.setSearchProviderEnabled?.(provider.ref, !isProviderEnabled(provider))
  }

  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="search">
      <SettingsGroup title="默认搜索源" meta={enabledProviderEntries()[0]?.title ?? "未配置"}>
        <FieldRow
          class={className(styles.fieldRow)}
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
          class={className(styles.fieldRow)}
          label="默认引擎"
          description="也可以在搜索框里输入 @github 临时切换"
          trailing={
            <ContributionSegmented
              ariaLabel="默认搜索引擎"
              activeKey={defaultKey()}
              fallback={searchSettings()?.defaultProvider.id ?? "未配置"}
              items={searchProviders}
              options={providerOptions}
              onPick={(provider) => void props.host.setDefaultSearchProvider?.(provider.ref)}
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="命令前缀"
          description="用短前缀区分网页、卡片和插件命令"
          trailing={
            <Input size="sm" value={prefixes()} onInput={setPrefixes} aria-label="命令前缀" />
          }
        />
        <Show when={configurationError()}>
          <SettingsInlineError>{configurationError()!}</SettingsInlineError>
        </Show>
      </SettingsGroup>

      <SettingsGroup title="搜索范围" meta="4 项">
        <FieldRow
          class={className(styles.fieldRow)}
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
          class={className(styles.fieldRow)}
          label="默认搜索范围"
          description="选择输入框默认纳入的内容来源"
          trailing={
            <CheckChipList
              ariaLabel="默认搜索范围"
              items={() => [
                { label: "网页", checked: includeWeb(), onChange: setIncludeWeb },
                { label: "卡片", checked: includeCards(), onChange: setIncludeCards },
                { label: "命令", checked: includeCommands(), onChange: setIncludeCommands },
                { label: "历史", checked: includeHistory(), onChange: setIncludeHistory },
              ]}
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="输入防抖"
          description="减少输入时过于频繁的搜索刷新"
          trailing={
            <RangeField
              ariaLabel="输入防抖"
              value={debounceMs()}
              min={80}
              max={420}
              step={20}
              format={(value) => `${value}ms`}
              onChange={setDebounceMs}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="搜索源管理" meta={`${enabledProviderEntries().length} 个启用`}>
        <div {...stylex.attrs(styles.providerList)} id="settings-search-provider-select">
          <For each={searchProviders()}>
            {(provider) => {
              const isEnabled = () => isProviderEnabled(provider)
              const isDefault = () =>
                sameContributionRef(provider.ref, searchSettings()?.defaultProvider ?? provider.ref)
              return (
                <ListRow
                  xstyle={[
                    styles.providerRow,
                    isDefault() && styles.providerRowSelected,
                    !isEnabled() && styles.disabled,
                  ]}
                  primary={
                    <Button
                      size="md"
                      variant="ghost"
                      xstyle={styles.providerMain}
                      data-search-provider-main
                      onClick={() => {
                        if (!isEnabled()) return
                        void props.host.setDefaultSearchProvider?.(provider.ref)
                      }}
                      disabled={!isEnabled() || !props.host.setDefaultSearchProvider}
                    >
                      <span {...stylex.attrs(styles.providerText)}>
                        <span {...stylex.attrs(styles.providerTitle)}>{provider.title}</span>
                        <span {...stylex.attrs(styles.providerAlias)}>
                          {providerAlias(provider)}
                        </span>
                      </span>
                    </Button>
                  }
                  trailing={
                    <div {...stylex.attrs(styles.inlineActions)}>
                      <span {...stylex.attrs(styles.providerKind)}>
                        {providerKindLabel(provider)}
                      </span>
                      <span {...stylex.attrs(styles.providerState)}>
                        <Show when={isDefault()}>
                          <Check size={14} /> 当前
                        </Show>
                      </span>
                      <SettingsSwitch
                        checked={isEnabled()}
                        label={`${isEnabled() ? "禁用" : "启用"} ${provider.title}`}
                        onChange={() => handleToggle(provider)}
                      />
                    </div>
                  }
                  selected={isDefault()}
                />
              )
            }}
          </For>
        </div>
      </SettingsGroup>
    </div>
  )
}
