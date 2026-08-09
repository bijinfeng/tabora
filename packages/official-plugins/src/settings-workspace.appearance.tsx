import * as stylex from "@stylexjs/stylex"
import { IconButton } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { SegmentedControl } from "@tabora/ui/segmented-control"
import { Select } from "@tabora/ui/select"
import { createSignal, For, Show } from "solid-js"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { contributionRefKey, sameContributionRef } from "@tabora/plugin-api/sdk"

import { ContributionSegmented, RangeField, SettingsGroup } from "./settings-workspace.shared"
import { className, styles } from "./styles"

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const [accentTone, setAccentTone] = createSignal("sage")
  const [density, setDensity] = createSignal("compact")
  const [radius, setRadius] = createSignal(8)
  const [fontSize, setFontSize] = createSignal(13)
  const workspace = () => props.data.workspace
  const themes = () => props.data.themes ?? []
  const backgrounds = () => props.data.backgrounds ?? []
  const activeTheme = () =>
    workspace()?.activeTheme ?? { pluginId: "", kind: "theme" as const, id: "" }
  const activeBackground = () =>
    workspace()?.activeBackgroundProvider ?? {
      pluginId: "",
      kind: "background-provider" as const,
      id: "",
    }
  const localeValue = () => props.locale ?? "zh-CN"
  const localeOptions = () => props.availableLocales ?? []
  const canSwitchLocale = () =>
    typeof props.host.switchLocale === "function" && localeOptions().length > 0
  const themeOptions = () =>
    themes().map((theme) => ({
      value: contributionRefKey(theme.ref),
      label: themeModeLabel(theme),
      disabled: !props.host.switchTheme,
    }))
  const backgroundOptions = () =>
    backgrounds().map((background) => ({
      value: contributionRefKey(background.ref),
      label: background.title,
    }))
  const activeThemeTitle = () =>
    themes().find((theme) => sameContributionRef(theme.ref, activeTheme()))?.title ??
    activeTheme().id
  const activeBackgroundTitle = () =>
    backgrounds().find((background) => sameContributionRef(background.ref, activeBackground()))
      ?.title ?? activeBackground().id

  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="appearance">
      <SettingsGroup title="主题" meta={activeThemeTitle()}>
        <FieldRow
          class={className(styles.fieldRow)}
          label="界面模式"
          description="明亮、暗色或跟随系统"
          trailing={
            <ContributionSegmented
              ariaLabel="界面模式"
              activeKey={contributionRefKey(activeTheme())}
              fallback={activeTheme().id}
              items={themes}
              options={themeOptions}
              onPick={(theme) => void props.host.switchTheme?.(theme.ref)}
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="强调色"
          description="用于焦点、选中状态和主操作按钮"
          trailing={
            <div {...stylex.attrs(styles.swatchRow)} aria-label="强调色">
              <For each={ACCENT_TONES}>
                {(tone) => (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    xstyle={[styles.swatch, accentTone() === tone.id && styles.selected]}
                    style={{ "background-color": tone.color }}
                    aria-label={tone.label}
                    onClick={() => setAccentTone(tone.id)}
                  >
                    <span aria-hidden="true" />
                  </IconButton>
                )}
              </For>
            </div>
          }
        />
      </SettingsGroup>

      <SettingsGroup title="背景" meta={activeBackgroundTitle()}>
        <FieldRow
          class={className(styles.fieldRow)}
          label="页面背景"
          description="纯色、轻网格或本地图片；背景由插件渲染"
          trailing={
            <Select<string>
              size="sm"
              value={contributionRefKey(activeBackground())}
              options={backgroundOptions()}
              disabled={backgroundOptions().length === 0 || !props.host.switchBackground}
              onChange={(key) => {
                const background = backgrounds().find(
                  (candidate) => contributionRefKey(candidate.ref) === key,
                )
                if (background) void props.host.switchBackground?.(background.ref)
              }}
              aria-label="页面背景"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="背景渲染"
          description="由 background-renderer 插件渲染图片、渐变或画布背景"
          trailing={<span {...stylex.attrs(styles.rowMeta)}>跟随背景源</span>}
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="界面密度"
          description="影响设置、弹窗、卡片列表的默认间距"
          trailing={
            <SegmentedControl<string>
              size="sm"
              value={density()}
              options={[
                { value: "compact", label: "紧凑" },
                { value: "standard", label: "标准" },
                { value: "spacious", label: "舒展" },
              ]}
              onChange={setDensity}
              aria-label="界面密度"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="圆角半径"
          description="控制卡片、输入框和浮层的圆角基准"
          trailing={
            <RangeField
              ariaLabel="圆角半径"
              value={radius()}
              min={4}
              max={14}
              format={(value) => `${value}px`}
              onChange={setRadius}
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="正文大小"
          description="仅调整工作台正文和卡片说明文字"
          trailing={
            <RangeField
              ariaLabel="正文大小"
              value={fontSize()}
              min={11}
              max={15}
              format={(value) => `${value}px`}
              onChange={setFontSize}
            />
          }
        />
      </SettingsGroup>

      <Show when={canSwitchLocale()}>
        <SettingsGroup title="语言" meta={localeValue()}>
          <FieldRow
            class={className(styles.fieldRow)}
            label="当前语言"
            description="影响工作台宿主文案和官方插件面板文案"
            trailing={
              <Select<"zh-CN" | "en-US">
                id="settings-locale-select"
                size="sm"
                value={localeValue()}
                options={localeOptions()}
                onChange={(value) => void props.host.switchLocale?.(value)}
                aria-label="选择语言"
              />
            }
          />
        </SettingsGroup>
      </Show>
    </div>
  )
}

const ACCENT_TONES = [
  { id: "sage", label: "Sage", color: "#1a9070" },
  { id: "blue", label: "Blue", color: "#316fd5" },
  { id: "olive", label: "Olive", color: "#8a6a2f" },
  { id: "clay", label: "Clay", color: "#8f4c45" },
]

function themeModeLabel(theme: NonNullable<SettingsPanelData["themes"]>[number]) {
  const key = `${theme.id} ${theme.title}`.toLowerCase()
  if (key.includes("dark") || key.includes("暗")) return "暗色"
  if (key.includes("system") || key.includes("系统")) return "系统"
  if (key.includes("light") || key.includes("明")) return "明亮"
  return theme.title
}
