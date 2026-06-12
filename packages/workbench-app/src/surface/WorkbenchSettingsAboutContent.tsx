import type { ShellTranslation } from "../i18n"

export function WorkbenchSettingsAboutContent(props: {
  workspaceName: string
  enabledPluginCount: number
  tShell?: ShellTranslation
}) {
  return (
    <div class="settings-panel-stack-host">
      <section class="widget-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-text">
              {props.tShell?.("chrome.settings.about.title") ?? "关于 Tabora"}
            </span>
          </div>
        </div>
        <div class="card-body">
          <p>
            {props.tShell?.("chrome.settings.about.description") ??
              "当前实现已切换到双布局工作台骨架，设置中心按固定分类组织插件设置内容。"}
          </p>
          <p>
            {props.tShell
              ? props.tShell("chrome.settings.about.workspaceLabel", { name: props.workspaceName })
              : `当前工作区：${props.workspaceName}。`}
          </p>
          <p>
            {props.tShell
              ? props.tShell("chrome.settings.about.enabledPluginsLabel", {
                  count: props.enabledPluginCount,
                })
              : `已启用官方插件：${props.enabledPluginCount}。`}
          </p>
        </div>
      </section>
    </div>
  )
}
