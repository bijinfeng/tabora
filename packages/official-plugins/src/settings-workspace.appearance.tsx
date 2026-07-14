import { FieldRow, SegmentedControl, Select, Slider } from "@tabora/ui"
import { createSignal, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const [accentTone, setAccentTone] = createSignal("sage")
  const [density, setDensity] = createSignal("compact")
  const [radius, setRadius] = createSignal(8)
  const [fontSize, setFontSize] = createSignal(13)
  const activeTheme = () => props.workspace.activeThemeId
  const activeBackground = () => props.workspace.activeBackgroundProviderId
  const localeValue = () => props.locale ?? "zh-CN"
  const localeOptions = () => props.availableLocales ?? []
  const canSwitchLocale = () =>
    typeof props.host.switchLocale === "function" && localeOptions().length > 0
  const themeOptions = () =>
    props.themes.map((theme) => ({ value: theme.id, label: themeModeLabel(theme) }))
  const backgroundOptions = () =>
    props.backgrounds.map((background) => ({ value: background.id, label: background.title }))
  const activeThemeTitle = () =>
    props.themes.find((theme) => theme.id === activeTheme())?.title ?? activeTheme()
  const activeBackgroundTitle = () =>
    props.backgrounds.find((background) => background.id === activeBackground())?.title ??
    activeBackground()

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">
          主题<span>{activeThemeTitle()}</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="界面模式"
          description="明亮、暗色或跟随系统"
          trailing={
            <Show
              when={themeOptions().length > 0}
              fallback={<span class="settings-row-meta">{activeTheme()}</span>}
            >
              <SegmentedControl<string>
                size="sm"
                value={activeTheme()}
                options={themeOptions()}
                onChange={(themeId) => void props.host.switchTheme(themeId)}
                aria-label="界面模式"
              />
            </Show>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="强调色"
          description="用于焦点、选中状态和主操作按钮"
          trailing={
            <div class="settings-swatch-row" aria-label="强调色">
              <For each={ACCENT_TONES}>
                {(tone) => (
                  <button
                    type="button"
                    class="settings-swatch"
                    classList={{ "is-active": accentTone() === tone.id }}
                    style={{ "--tone": tone.color }}
                    aria-label={tone.label}
                    onClick={() => setAccentTone(tone.id)}
                  />
                )}
              </For>
            </div>
          }
        />
      </section>

      <section class="set-group">
        <div class="set-group-title">
          背景<span>{activeBackgroundTitle()}</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="页面背景"
          description="纯色、轻网格或本地图片；背景由插件渲染"
          trailing={
            <Select<string>
              size="sm"
              value={activeBackground()}
              options={backgroundOptions()}
              disabled={backgroundOptions().length === 0}
              onChange={(backgroundId) => void props.host.switchBackground(backgroundId)}
              aria-label="页面背景"
            />
          }
        />
        <FieldRow
          class="settings-form-row"
          label="背景渲染"
          description="由 background-renderer 插件渲染图片、渐变或画布背景"
          trailing={<span class="settings-row-meta">跟随背景源</span>}
        />
        <FieldRow
          class="settings-form-row"
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
          class="settings-form-row"
          label="圆角半径"
          description="控制卡片、输入框和浮层的圆角基准"
          trailing={
            <div class="settings-range-control">
              <Slider
                value={radius()}
                min={4}
                max={14}
                onChange={setRadius}
                aria-label="圆角半径"
              />
              <span>{radius()}px</span>
            </div>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="正文大小"
          description="仅调整工作台正文和卡片说明文字"
          trailing={
            <div class="settings-range-control">
              <Slider
                value={fontSize()}
                min={11}
                max={15}
                onChange={setFontSize}
                aria-label="正文大小"
              />
              <span>{fontSize()}px</span>
            </div>
          }
        />
      </section>

      <Show when={canSwitchLocale()}>
        <section class="set-group">
          <div class="set-group-title">
            语言<span>{localeValue()}</span>
          </div>
          <FieldRow
            class="settings-form-row"
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
        </section>
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

function themeModeLabel(theme: SettingsPanelViewProps["themes"][number]) {
  const key = `${theme.id} ${theme.title}`.toLowerCase()
  if (key.includes("dark") || key.includes("暗")) return "暗色"
  if (key.includes("system") || key.includes("系统")) return "系统"
  if (key.includes("light") || key.includes("明")) return "明亮"
  return theme.title
}
