import { FieldRow } from "@tabora/ui"
import { For, Show } from "solid-js"
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
            {(background) => (
              <button
                type="button"
                class="bg-item"
                classList={{ active: activeBackground() === background.id }}
                style={background.defaultCss ?? {}}
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
          <FieldRow
            label="当前语言"
            description="影响工作台宿主文案和官方插件面板文案"
            trailing={
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
            }
          />
        </section>
      </Show>
    </div>
  )
}
