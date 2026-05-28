import { CardSection, ListRow, Badge } from "@tabora/ui"
import { officialPlugins } from "./index"

export function PluginManagerCard() {
  return (
    <CardSection title="官方插件">
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
              <ListRow
                primary={plugin.manifest.name}
                secondary={
                  <span>
                    <span class="plugin-id-mono">{plugin.manifest.id}</span>
                    {extensions.length > 0 ? <span> · {extensions.join(" · ")}</span> : null}
                  </span>
                }
                trailing={
                  <Badge variant={plugin.enabled ? "accent" : "neutral"}>
                    {plugin.enabled ? "已启用" : "已禁用"}
                  </Badge>
                }
              />
            </li>
          )
        })}
      </ul>
    </CardSection>
  )
}
