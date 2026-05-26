import { officialPlugins } from "./index"

export function PluginManagerCard() {
  return (
    <div class="plugin-manager">
      <ul class="plugin-list">
        {officialPlugins.map((plugin) => {
          const extensions: string[] = []
          const c = plugin.manifest.contributes
          if (c.layouts?.length) extensions.push("布局")
          if (c.widgets?.length) extensions.push(`卡片 (${c.widgets.length})`)
          if (c.searches?.length) extensions.push("搜索")
          if (c.searchProviders?.length) extensions.push("搜索源")
          if (c.backgroundProviders?.length) extensions.push("背景")
          if (c.backgroundRenderers?.length) extensions.push("背景渲染")
          if (c.themes?.length) extensions.push("主题")
          if (c.settingsPanels?.length) extensions.push("设置")

          return (
            <li class="plugin-item">
              <div class="plugin-info">
                <span class="plugin-name">{plugin.manifest.name}</span>
                <span class="plugin-id">{plugin.manifest.id}</span>
                <span class="plugin-extensions">{extensions.join(" · ")}</span>
              </div>
              <span classList={{ "plugin-status": true, enabled: plugin.enabled }}>
                {plugin.enabled ? "已启用" : "已禁用"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
