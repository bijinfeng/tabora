import { For } from "solid-js"
import type { PluginManifest, PluginPermission, SettingsPanelViewProps } from "@tabora/plugin-api"
import { assessPermissionRisk } from "@tabora/plugin-api"

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
  }
}

function pluginStatus(plugin: PluginSummary) {
  if (plugin.status === "error") return { label: "错误", tone: "danger" }
  if (plugin.status === "skipped") return { label: "不兼容", tone: "danger" }
  return plugin.enabled ? { label: "已启用", tone: "success" } : { label: "已禁用", tone: "muted" }
}

function PluginSwitch(props: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label class="plugin-switch">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.currentTarget.checked)}
        aria-label={props.label}
      />
      <span class="plugin-switch-track">
        <span class="plugin-switch-thumb" />
      </span>
    </label>
  )
}

export function PluginManagerCard(props: PluginManagerCardProps = {}) {
  const plugins = () => props.plugins ?? []

  return (
    <div class="plugin-settings-stack">
      <section class="set-group">
        <div class="set-group-title">已安装插件</div>
        <p class="plugin-settings-help">
          每个插件贡献的能力、版本和运行状态。插件启用状态控制是否加载到当前工作台。
        </p>
        <div class="plugin-list">
          <For each={plugins()}>
            {(plugin) => {
              const extensions = contributionLabels(plugin.contributes)
              const permissions = plugin.permissions.map(permissionLabel)
              const status = pluginStatus(plugin)
              return (
                <div class="plugin-card">
                  <div class="plugin-main">
                    <div class="plugin-name">{plugin.name}</div>
                    <div class="plugin-id-mono">{plugin.id}</div>
                    <div class="plugin-meta">
                      {extensions.length > 0 ? extensions.join(" · ") : "无贡献能力"}
                      {permissions.length > 0 ? ` · 权限 ${permissions.join(" / ")}` : ""}
                      {plugin.disabledReason ? ` · ${plugin.disabledReason}` : ""}
                      {plugin.lastError ? ` · ${plugin.lastError}` : ""}
                      {plugin.requiredCapabilities?.length
                        ? ` · 需要能力 ${plugin.requiredCapabilities.join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div class="plugin-controls">
                    <span class="plugin-version">v{plugin.version}</span>
                    <span class={`plugin-pill ${status.tone}`}>{status.label}</span>
                    <PluginSwitch
                      checked={plugin.enabled}
                      label={`${plugin.enabled ? "禁用" : "启用"} ${plugin.name}`}
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

      <section class="set-group">
        <div class="set-group-title">权限审计</div>
        <div class="plugin-audit-section">
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
                <div class="plugin-audit-item">
                  <span class="plugin-audit-name">{plugin.name}</span>
                  <div class="plugin-audit-tags">
                    <For each={risks}>
                      {(risk) => (
                        <span class={`plugin-pill ${risk.risk}`}>
                          {permissionType(risk.permission)}
                        </span>
                      )}
                    </For>
                    {plugin.permissions.length === 0 ? (
                      <span class="plugin-audit-none">无权限请求</span>
                    ) : (
                      <span class="plugin-audit-risk">风险: {maxRisk}</span>
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
