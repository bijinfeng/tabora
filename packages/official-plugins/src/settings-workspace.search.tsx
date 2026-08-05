import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Checkbox } from "@tabora/ui/checkbox"
import { FieldRow } from "@tabora/ui/field-row"
import { Input } from "@tabora/ui/input"
import { ListRow } from "@tabora/ui/list-row"
import { SegmentedControl } from "@tabora/ui/segmented-control"
import { Slider } from "@tabora/ui/slider"
import { Switch } from "@tabora/ui/switch"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { contributionRefKey, sameContributionRef } from "@tabora/plugin-api/sdk"
import Check from "lucide-solid/icons/check"

import {
  providerAlias,
  providerKindLabel,
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
      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          默认搜索源
          <span {...stylex.attrs(styles.groupTitleMeta)}>
            {enabledProviderEntries()[0]?.title ?? "未配置"}
          </span>
        </div>
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
            <Show
              when={providerOptions().length > 0}
              fallback={
                <span {...stylex.attrs(styles.rowMeta)}>
                  {searchSettings()?.defaultProvider.id ?? "未配置"}
                </span>
              }
            >
              <SegmentedControl<string>
                size="sm"
                value={defaultKey()}
                options={providerOptions()}
                onChange={(key) => {
                  const provider = searchProviders().find(
                    (candidate) => contributionRefKey(candidate.ref) === key,
                  )
                  if (provider) void props.host.setDefaultSearchProvider?.(provider.ref)
                }}
                aria-label="默认搜索引擎"
              />
            </Show>
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
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          搜索范围<span {...stylex.attrs(styles.groupTitleMeta)}>4 项</span>
        </div>
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
            <div {...stylex.attrs(styles.checkList)} aria-label="默认搜索范围">
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={includeWeb()} onChange={setIncludeWeb} label="网页" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={includeCards()} onChange={setIncludeCards} label="卡片" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={includeCommands()} onChange={setIncludeCommands} label="命令" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={includeHistory()} onChange={setIncludeHistory} label="历史" />
              </span>
            </div>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="输入防抖"
          description="减少输入时过于频繁的搜索刷新"
          trailing={
            <div {...stylex.attrs(styles.rangeControl)}>
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

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          搜索源管理
          <span {...stylex.attrs(styles.groupTitleMeta)}>
            {enabledProviderEntries().length} 个启用
          </span>
        </div>
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
      </section>
    </div>
  )
}
