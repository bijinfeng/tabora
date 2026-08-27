import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { Switch } from "@tabora/ui/switch"
import { styles } from "./styles"

export type PluginSummary = NonNullable<SettingsPanelData["plugins"]>[number]

export type PluginManagerCardProps = {
  plugins?: PluginSummary[]
  host?: SettingsPanelViewProps["host"]
}

function contributionLabels(kinds: PluginSummary["contributionKinds"]): string[] {
  const labels = {
    layout: "布局",
    widget: "卡片",
    search: "搜索",
    "search-provider": "搜索源",
    "background-provider": "背景",
    "background-renderer": "背景渲染",
    theme: "主题",
    "settings-panel": "设置",
    command: "命令",
    keybinding: "快捷键",
    "workspace-preset": "工作区预设",
  } as const
  return kinds.map((kind) => labels[kind])
}

function pluginStatus(plugin: PluginSummary) {
  if (plugin.status === "error") return { label: "错误", tone: "danger" }
  if (plugin.status === "skipped") return { label: "不兼容", tone: "danger" }
  return plugin.enabled ? { label: "已启用", tone: "success" } : { label: "已禁用", tone: "muted" }
}

function pillTone(tone: string) {
  if (tone === "success" || tone === "low") return styles.pillSuccess
  if (tone === "danger" || tone === "high" || tone === "critical") return styles.pillDanger
  if (tone === "muted") return styles.pillMuted
  return null
}

export function PluginManagerCard(props: PluginManagerCardProps = {}) {
  const plugins = () => props.plugins ?? []

  return (
    <div {...stylex.attrs(styles.panelStack)} data-plugin-settings-card>
      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>已安装插件</div>
        <p {...stylex.attrs(styles.pluginHelp)}>
          每个插件贡献的能力、版本和运行状态。插件启用状态控制是否加载到当前工作台。
        </p>
        <div {...stylex.attrs(styles.list)}>
          <For each={plugins()}>
            {(plugin) => {
              const extensions = contributionLabels(plugin.contributionKinds)
              const status = pluginStatus(plugin)
              return (
                <div {...stylex.attrs(styles.pluginCard)}>
                  <div {...stylex.attrs(styles.pluginMain)}>
                    <div {...stylex.attrs(styles.pluginName)}>{plugin.name}</div>
                    <div {...stylex.attrs(styles.pluginId)}>{plugin.id}</div>
                    <div {...stylex.attrs(styles.pluginMeta)}>
                      {extensions.length > 0 ? extensions.join(" · ") : "无贡献能力"}
                      {plugin.disabledReason ? ` · ${plugin.disabledReason}` : ""}
                      {plugin.lastError ? ` · ${plugin.lastError}` : ""}
                      {plugin.requiredCapabilities?.length
                        ? ` · 需要能力 ${plugin.requiredCapabilities.join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div {...stylex.attrs(styles.pluginControls)}>
                    <span {...stylex.attrs(styles.pluginVersion)}>v{plugin.version}</span>
                    <span {...stylex.attrs(styles.pill, pillTone(status.tone))}>
                      {status.label}
                    </span>
                    <Switch
                      checked={plugin.enabled}
                      size="sm"
                      aria-label={`${plugin.enabled ? "禁用" : "启用"} ${plugin.name}`}
                      onChange={(enabled) => {
                        void props.host?.togglePluginEnabled?.(plugin.id, enabled)
                      }}
                    />
                  </div>
                </div>
              )
            }}
          </For>
        </div>
      </section>
    </div>
  )
}
