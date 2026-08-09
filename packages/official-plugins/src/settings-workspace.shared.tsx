import * as stylex from "@stylexjs/stylex"
import { Checkbox } from "@tabora/ui/checkbox"
import { InlineError } from "@tabora/ui/inline-error"
import { SegmentedControl } from "@tabora/ui/segmented-control"
import { Slider } from "@tabora/ui/slider"
import { Switch } from "@tabora/ui/switch"
import { For, Show, type JSX } from "solid-js"
import type { ContributionRef, SettingsPanelData } from "@tabora/plugin-api/sdk"
import { contributionRefKey } from "@tabora/plugin-api/sdk"

import { styles } from "./styles"

export function SettingsInlineError(props: { children: string }) {
  return <InlineError>{props.children}</InlineError>
}

/** 设置面板中的一个分组：标题 + 右侧 meta + 内容。 */
export function SettingsGroup(props: {
  title: JSX.Element
  meta?: JSX.Element
  "data-settings-group"?: string
  children: JSX.Element
}) {
  return (
    <section {...stylex.attrs(styles.group)} data-settings-group={props["data-settings-group"]}>
      <div {...stylex.attrs(styles.groupTitle)}>
        {props.title}
        <Show when={props.meta !== undefined}>
          <span {...stylex.attrs(styles.groupTitleMeta)}>{props.meta}</span>
        </Show>
      </div>
      {props.children}
    </section>
  )
}

export type CheckChipItem = { label: string; checked: boolean; onChange: (next: boolean) => void }

/** 一组包在 checkChip 里的复选框，用于「搜索范围」「允许的权限」等多选。 */
export function CheckChipList(props: { ariaLabel: string; items: () => CheckChipItem[] }) {
  return (
    <div {...stylex.attrs(styles.checkList)} aria-label={props.ariaLabel}>
      <For each={props.items()}>
        {(item) => (
          <span {...stylex.attrs(styles.checkChip)}>
            <Checkbox checked={item.checked} onChange={item.onChange} label={item.label} />
          </span>
        )}
      </For>
    </div>
  )
}

/** 滑块 + 当前值文案的组合控件。 */
export function RangeField(props: {
  ariaLabel: string
  value: number
  min: number
  max: number
  step?: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div {...stylex.attrs(styles.rangeControl)}>
      <Slider
        value={props.value}
        min={props.min}
        max={props.max}
        {...(props.step === undefined ? {} : { step: props.step })}
        onChange={props.onChange}
        aria-label={props.ariaLabel}
      />
      <span>{props.format(props.value)}</span>
    </div>
  )
}

/**
 * 贡献项分段控件：候选为空时回退到只读文案。
 * 选中时按 key 找回对应 ref 再交给宿主 setter。
 */
export function ContributionSegmented<T extends { ref: ContributionRef }>(props: {
  ariaLabel: string
  activeKey: string
  fallback: JSX.Element
  items: () => T[]
  options: () => { value: string; label: string; disabled?: boolean }[]
  onPick: (item: T) => void
}) {
  return (
    <Show
      when={props.options().length > 0}
      fallback={<span {...stylex.attrs(styles.rowMeta)}>{props.fallback}</span>}
    >
      <SegmentedControl<string>
        size="sm"
        value={props.activeKey}
        options={props.options()}
        onChange={(key) => {
          const found = props.items().find((item) => contributionRefKey(item.ref) === key)
          if (found) props.onPick(found)
        }}
        aria-label={props.ariaLabel}
      />
    </Show>
  )
}

export function providerShortcut(
  provider: NonNullable<SettingsPanelData["searchProviders"]>[number],
) {
  return provider.shortcut ?? `@${provider.id.split(".").at(-1) ?? provider.id}`
}

export function providerAlias(provider: NonNullable<SettingsPanelData["searchProviders"]>[number]) {
  return providerShortcut(provider).startsWith("@")
    ? providerShortcut(provider)
    : `@${providerShortcut(provider)}`
}

export function providerKindLabel(
  provider: NonNullable<SettingsPanelData["searchProviders"]>[number],
) {
  if (provider.id.includes("github")) return "代码"
  return "搜索"
}

export function SettingsSwitch(props: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <Switch
      checked={props.checked}
      size="sm"
      aria-label={props.label}
      onChange={() => props.onChange()}
    />
  )
}
