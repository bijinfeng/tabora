import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"
import type { PluginManifest, PluginPermission, SettingsPanelViewProps } from "@tabora/plugin-api"
import { assessPermissionRisk } from "@tabora/plugin-api"
import { Switch } from "@tabora/ui"
import { styles } from "./styles"

export type PluginSummary = SettingsPanelViewProps["plugins"][number]

export type PluginManagerCardProps = {
  plugins?: PluginSummary[]
  host?: SettingsPanelViewProps["host"]
}

function contributionLabels(contributes: PluginManifest["contributes"]): string[] {
  const extensions: string[] = []
  if (contributes.layouts?.length) extensions.push("布局")
  if (contributes.widgets?.length) extensions.push(`卡片 (${contributes.widgets.length})`)
  if (contributes.searches?.length) extensions.push("搜索")
  if (contributes.searchProviders?.length) extensions.push("搜索源")
  if (contributes.backgroundProviders?.length) extensions.push("背景")
  if (contributes.backgroundRenderers?.length) extensions.push("背景渲染")
  if (contributes.themes?.length) extensions.push("主题")
  if (contributes.settingsPanels?.length) extensions.push("设置")
  if (contributes.workspacePresets?.length) extensions.push("工作区预设")
  return extensions
}

function permissionLabel(permission: PluginPermission): string {
  switch (permission.type) {
    case "external-open":
      return `外部打开: ${permission.hosts.join(", ")}`
    case "storage":
      return `存储: ${permission.scope}`
    case "workspace":
      return `工作区: ${permission.access}`
    case "network":
      return `网络: ${permission.hosts.join(", ")}`
    case "clipboard":
      return `剪贴板: ${permission.access}`
    case "local-file":
      return `本地文件: ${permission.access}`
    default:
      return permission.type
  }
}

function permissionType(permission: PluginPermission): string {
  switch (permission.type) {
    case "external-open":
      return "外部打开"
    case "storage":
      return "存储"
    case "workspace":
      return "工作区"
    case "network":
      return "网络"
    case "clipboard":
      return "剪贴板"
    case "local-file":
      return "本地文件"
    default:
      return permission.type
  }
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
              const extensions = contributionLabels(plugin.contributes)
              const permissions = plugin.permissions.map(permissionLabel)
              const status = pluginStatus(plugin)
              return (
                <div {...stylex.attrs(styles.pluginCard)}>
                  <div {...stylex.attrs(styles.pluginMain)}>
                    <div {...stylex.attrs(styles.pluginName)}>{plugin.name}</div>
                    <div {...stylex.attrs(styles.pluginId)}>{plugin.id}</div>
                    <div {...stylex.attrs(styles.pluginMeta)}>
                      {extensions.length > 0 ? extensions.join(" · ") : "无贡献能力"}
                      {permissions.length > 0 ? ` · 权限 ${permissions.join(" / ")}` : ""}
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

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>权限审计</div>
        <div {...stylex.attrs(styles.list)}>
          <For each={plugins()}>
            {(plugin) => {
              const risks = plugin.permissions.map(assessPermissionRisk)
              const riskLevels: Record<string, number> = {
                low: 0,
                medium: 1,
                high: 2,
                critical: 3,
              }
              const maxRisk = risks.reduce(
                (max: string, r) =>
                  (riskLevels[r.risk] ?? 0) > (riskLevels[max] ?? 0) ? r.risk : max,
                "low",
              )
              return (
                <div {...stylex.attrs(styles.pluginCard)}>
                  <span {...stylex.attrs(styles.pluginName)}>{plugin.name}</span>
                  <div {...stylex.attrs(styles.pluginControls)}>
                    <For each={risks}>
                      {(risk) => (
                        <span {...stylex.attrs(styles.pill, pillTone(risk.risk))}>
                          {permissionType(risk.permission)}
                        </span>
                      )}
                    </For>
                    {plugin.permissions.length === 0 ? (
                      <span {...stylex.attrs(styles.mutedText)}>无权限请求</span>
                    ) : (
                      <span {...stylex.attrs(styles.dangerText)}>风险: {maxRisk}</span>
                    )}
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
