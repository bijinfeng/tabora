import { For } from "solid-js"
import type { PluginManifest, PluginPermission, SettingsPanelViewProps } from "@tabora/plugin-api"
import { assessPermissionRisk } from "@tabora/plugin-api"

export type PluginSummary = SettingsPanelViewProps["plugins"][number]

type InjectedI18n = {
  t: (key: string, vars?: Record<string, string | number>) => string
}

export type PluginManagerCardProps = {
  plugins?: PluginSummary[]
  host?: SettingsPanelViewProps["host"]
  i18n?: InjectedI18n
}

function fallbackText(key: string, vars?: Record<string, string | number>) {
  const template =
    {
      "pluginManager.installed.title": "已安装插件",
      "pluginManager.installed.help":
        "每个插件贡献的能力、版本和运行状态。插件启用状态控制是否加载到当前工作台。",
      "pluginManager.installed.noContributions": "无贡献能力",
      "pluginManager.installed.permissionsPrefix": "权限",
      "pluginManager.installed.requiredCapabilitiesPrefix": "需要能力",
      "pluginManager.installed.versionPrefix": "v",

      "pluginManager.audit.title": "权限审计",
      "pluginManager.audit.none": "无权限请求",
      "pluginManager.audit.riskPrefix": "风险:",
      "pluginManager.audit.risk.low": "低",
      "pluginManager.audit.risk.medium": "中",
      "pluginManager.audit.risk.high": "高",
      "pluginManager.audit.risk.critical": "严重",

      "pluginManager.status.error": "错误",
      "pluginManager.status.incompatible": "不兼容",
      "pluginManager.status.enabled": "已启用",
      "pluginManager.status.disabled": "已禁用",

      "pluginManager.switch.enable": "启用",
      "pluginManager.switch.disable": "禁用",

      "pluginManager.contribution.layout": "布局",
      "pluginManager.contribution.widgets": "卡片 ({{count}})",
      "pluginManager.contribution.search": "搜索",
      "pluginManager.contribution.searchProvider": "搜索源",
      "pluginManager.contribution.background": "背景",
      "pluginManager.contribution.backgroundRenderer": "背景渲染",
      "pluginManager.contribution.theme": "主题",
      "pluginManager.contribution.settings": "设置",
      "pluginManager.contribution.workspacePreset": "工作区预设",

      "pluginManager.permission.type.externalOpen": "外部打开",
      "pluginManager.permission.type.storage": "存储",
      "pluginManager.permission.type.workspace": "工作区",
      "pluginManager.permission.type.network": "网络",
      "pluginManager.permission.type.clipboard": "剪贴板",
      "pluginManager.permission.type.localFile": "本地文件",

      "pluginManager.permission.externalOpen": "外部打开: {{hosts}}",
      "pluginManager.permission.storage": "存储: {{scope}}",
      "pluginManager.permission.workspace": "工作区: {{access}}",
      "pluginManager.permission.network": "网络: {{hosts}}",
      "pluginManager.permission.clipboard": "剪贴板: {{access}}",
      "pluginManager.permission.localFile": "本地文件: {{access}}",
    }[key] ?? key

  if (!vars) return template
  let result = template
  for (const [varKey, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${varKey}}}`, String(value))
  }
  return result
}

function createT(props: { i18n?: InjectedI18n }) {
  return (key: string, vars?: Record<string, string | number>) =>
    props.i18n?.t(key, vars) ?? fallbackText(key, vars)
}

function contributionLabels(
  contributes: PluginManifest["contributes"],
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] {
  const extensions: string[] = []
  if (contributes.layouts?.length) extensions.push(t("pluginManager.contribution.layout"))
  if (contributes.widgets?.length) {
    extensions.push(t("pluginManager.contribution.widgets", { count: contributes.widgets.length }))
  }
  if (contributes.searches?.length) extensions.push(t("pluginManager.contribution.search"))
  if (contributes.searchProviders?.length) {
    extensions.push(t("pluginManager.contribution.searchProvider"))
  }
  if (contributes.backgroundProviders?.length)
    extensions.push(t("pluginManager.contribution.background"))
  if (contributes.backgroundRenderers?.length) {
    extensions.push(t("pluginManager.contribution.backgroundRenderer"))
  }
  if (contributes.themes?.length) extensions.push(t("pluginManager.contribution.theme"))
  if (contributes.settingsPanels?.length) extensions.push(t("pluginManager.contribution.settings"))
  if (contributes.workspacePresets?.length) {
    extensions.push(t("pluginManager.contribution.workspacePreset"))
  }
  return extensions
}

function permissionLabel(
  permission: PluginPermission,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  switch (permission.type) {
    case "external-open":
      return t("pluginManager.permission.externalOpen", { hosts: permission.hosts.join(", ") })
    case "storage":
      return t("pluginManager.permission.storage", { scope: permission.scope })
    case "workspace":
      return t("pluginManager.permission.workspace", { access: permission.access })
    case "network":
      return t("pluginManager.permission.network", { hosts: permission.hosts.join(", ") })
    case "clipboard":
      return t("pluginManager.permission.clipboard", { access: permission.access })
    case "local-file":
      return t("pluginManager.permission.localFile", { access: permission.access })
  }
}

function permissionType(
  permission: PluginPermission,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  switch (permission.type) {
    case "external-open":
      return t("pluginManager.permission.type.externalOpen")
    case "storage":
      return t("pluginManager.permission.type.storage")
    case "workspace":
      return t("pluginManager.permission.type.workspace")
    case "network":
      return t("pluginManager.permission.type.network")
    case "clipboard":
      return t("pluginManager.permission.type.clipboard")
    case "local-file":
      return t("pluginManager.permission.type.localFile")
  }
}

function pluginStatus(
  plugin: PluginSummary,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (plugin.status === "error") return { label: t("pluginManager.status.error"), tone: "danger" }
  if (plugin.status === "skipped") {
    return { label: t("pluginManager.status.incompatible"), tone: "danger" }
  }
  return plugin.enabled
    ? { label: t("pluginManager.status.enabled"), tone: "success" }
    : { label: t("pluginManager.status.disabled"), tone: "muted" }
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
  const t = createT(props)
  const plugins = () => props.plugins ?? []

  return (
    <div class="plugin-settings-stack">
      <section class="set-group">
        <div class="set-group-title">{t("pluginManager.installed.title")}</div>
        <p class="plugin-settings-help">{t("pluginManager.installed.help")}</p>
        <div class="plugin-list">
          <For each={plugins()}>
            {(plugin) => {
              const extensions = contributionLabels(plugin.contributes, t)
              const permissions = plugin.permissions.map((permission) =>
                permissionLabel(permission, t),
              )
              const status = pluginStatus(plugin, t)
              return (
                <div class="plugin-card">
                  <div class="plugin-main">
                    <div class="plugin-name">{plugin.name}</div>
                    <div class="plugin-id-mono">{plugin.id}</div>
                    <div class="plugin-meta">
                      {extensions.length > 0
                        ? extensions.join(" · ")
                        : t("pluginManager.installed.noContributions")}
                      {permissions.length > 0
                        ? ` · ${t("pluginManager.installed.permissionsPrefix")} ${permissions.join(" / ")}`
                        : ""}
                      {plugin.disabledReason ? ` · ${plugin.disabledReason}` : ""}
                      {plugin.lastError ? ` · ${plugin.lastError}` : ""}
                      {plugin.requiredCapabilities?.length
                        ? ` · ${t("pluginManager.installed.requiredCapabilitiesPrefix")} ${plugin.requiredCapabilities.join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div class="plugin-controls">
                    <span class="plugin-version">
                      {t("pluginManager.installed.versionPrefix")}
                      {plugin.version}
                    </span>
                    <span class={`plugin-pill ${status.tone}`}>{status.label}</span>
                    <PluginSwitch
                      checked={plugin.enabled}
                      label={`${plugin.enabled ? t("pluginManager.switch.disable") : t("pluginManager.switch.enable")} ${plugin.name}`}
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
        <div class="set-group-title">{t("pluginManager.audit.title")}</div>
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
              const riskLabel = () =>
                t(`pluginManager.audit.risk.${maxRisk}` as "pluginManager.audit.risk.low")
              return (
                <div class="plugin-audit-item">
                  <span class="plugin-audit-name">{plugin.name}</span>
                  <div class="plugin-audit-tags">
                    <For each={risks}>
                      {(risk) => (
                        <span class={`plugin-pill ${risk.risk}`}>
                          {permissionType(risk.permission, t)}
                        </span>
                      )}
                    </For>
                    {plugin.permissions.length === 0 ? (
                      <span class="plugin-audit-none">{t("pluginManager.audit.none")}</span>
                    ) : (
                      <span class="plugin-audit-risk">
                        {t("pluginManager.audit.riskPrefix")} {riskLabel()}
                      </span>
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
