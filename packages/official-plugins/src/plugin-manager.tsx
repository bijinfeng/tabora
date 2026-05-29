import { For } from "solid-js"
import type { PluginManifest, PluginPermission, SettingsPanelViewProps } from "@tabora/plugin-api"
import { Badge, CardSection, InlineError, ListRow, Switch } from "@tabora/ui"

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

export function PluginManagerCard(props: PluginManagerCardProps = {}) {
  const plugins = () => props.plugins ?? []

  return (
    <CardSection title="官方插件">
      <ul class="plugin-list">
        <For each={plugins()}>
          {(plugin) => {
            const extensions = contributionLabels(plugin.contributes)
            const permissions = plugin.permissions.map(permissionLabel)
            return (
              <li class="plugin-item">
                <ListRow
                  primary={plugin.name}
                  secondary={
                    <span>
                      <span class="plugin-id-mono">{plugin.id}</span>
                      <span> · v{plugin.version}</span>
                      {extensions.length > 0 ? <span> · {extensions.join(" · ")}</span> : null}
                      {permissions.length > 0 ? (
                        <span> · 权限 {permissions.join(" / ")}</span>
                      ) : null}
                      {plugin.lastError ? (
                        <span>
                          {" "}
                          · <InlineError>{plugin.lastError}</InlineError>
                        </span>
                      ) : null}
                    </span>
                  }
                  trailing={
                    <div class="plugin-controls">
                      {plugin.status === "error" ? (
                        <Badge variant="danger">错误</Badge>
                      ) : (
                        <Badge variant={plugin.enabled ? "accent" : "neutral"}>
                          {plugin.enabled ? "已启用" : "已禁用"}
                        </Badge>
                      )}
                      <Switch
                        checked={plugin.enabled}
                        onChange={(enabled) => {
                          void props.host?.togglePluginEnabled?.(plugin.id, enabled)
                        }}
                        aria-label={`${plugin.enabled ? "禁用" : "启用"} ${plugin.name}`}
                      />
                    </div>
                  }
                />
              </li>
            )
          }}
        </For>
      </ul>
    </CardSection>
  )
}
