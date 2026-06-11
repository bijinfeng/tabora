import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps, WidgetViewProps } from "@tabora/plugin-api"
import { PluginManagerCard } from "./plugin-manager"

type InjectedI18n = {
  t: (key: string, vars?: Record<string, string | number>) => string
}

function PluginStatusWidget(props: WidgetViewProps) {
  const t = (key: string, vars?: Record<string, string | number>) =>
    (props as WidgetViewProps & { i18n?: InjectedI18n }).i18n?.t(key, vars) ??
    {
      "pluginManager.widget.stat.activeWidgets": "Widget 活跃",
      "pluginManager.widget.stat.layout": "布局",
      "pluginManager.widget.stat.providers": "搜索源",
      "pluginManager.widget.stat.background": "背景",
    }[key] ??
    key

  return (
    <div class="plugin-stats">
      <div class="plugin-stat">
        <span>{t("pluginManager.widget.stat.activeWidgets")}</span>
        <span class="plugin-stat-val accent">6</span>
      </div>
      <div class="plugin-stat">
        <span>{t("pluginManager.widget.stat.layout")}</span>
        <span class="plugin-stat-val accent">Dashboard</span>
      </div>
      <div class="plugin-stat">
        <span>{t("pluginManager.widget.stat.providers")}</span>
        <span class="plugin-stat-val accent">google</span>
      </div>
      <div class="plugin-stat">
        <span>{t("pluginManager.widget.stat.background")}</span>
        <span class="plugin-stat-val">solid1</span>
      </div>
    </div>
  )
}

export const officialPluginManager: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.plugin-manager",
    name: "Plugin Manager",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./plugin-manager-entry",
    styles: [{ href: "./plugin-manager-entry.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "plugin-status",
          title: "插件状态",
          icon: "boxes",
          description: "查看工作台插件运行状态",
          supportedSizes: ["S"],
          defaultSize: "S",
          allowMultipleInstances: false,
          views: { card: "official.plugin-manager.status-widget" },
        },
      ],
      settingsPanels: [
        {
          id: "official.settings.plugins",
          title: "插件",
          view: "official.plugin-manager.card",
          section: "plugins",
          scope: "workspace",
          order: 10,
        },
      ],
    },
  },
  activate(context) {
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
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

          "pluginManager.widget.stat.activeWidgets": "Widget 活跃",
          "pluginManager.widget.stat.layout": "布局",
          "pluginManager.widget.stat.providers": "搜索源",
          "pluginManager.widget.stat.background": "背景",
        },
      },
      {
        locale: "en-US",
        messages: {
          "pluginManager.installed.title": "Installed plugins",
          "pluginManager.installed.help":
            "Each plugin's contributions, version, and runtime status. Toggle controls whether it loads in the current workbench.",
          "pluginManager.installed.noContributions": "No contributions",
          "pluginManager.installed.permissionsPrefix": "Permissions",
          "pluginManager.installed.requiredCapabilitiesPrefix": "Requires",
          "pluginManager.installed.versionPrefix": "v",

          "pluginManager.audit.title": "Permission audit",
          "pluginManager.audit.none": "No permission requests",
          "pluginManager.audit.riskPrefix": "Risk:",
          "pluginManager.audit.risk.low": "Low",
          "pluginManager.audit.risk.medium": "Medium",
          "pluginManager.audit.risk.high": "High",
          "pluginManager.audit.risk.critical": "Critical",

          "pluginManager.status.error": "Error",
          "pluginManager.status.incompatible": "Incompatible",
          "pluginManager.status.enabled": "Enabled",
          "pluginManager.status.disabled": "Disabled",

          "pluginManager.switch.enable": "Enable",
          "pluginManager.switch.disable": "Disable",

          "pluginManager.contribution.layout": "Layout",
          "pluginManager.contribution.widgets": "Widgets ({{count}})",
          "pluginManager.contribution.search": "Search",
          "pluginManager.contribution.searchProvider": "Search providers",
          "pluginManager.contribution.background": "Background",
          "pluginManager.contribution.backgroundRenderer": "Background renderer",
          "pluginManager.contribution.theme": "Theme",
          "pluginManager.contribution.settings": "Settings",
          "pluginManager.contribution.workspacePreset": "Workspace presets",

          "pluginManager.permission.type.externalOpen": "External open",
          "pluginManager.permission.type.storage": "Storage",
          "pluginManager.permission.type.workspace": "Workspace",
          "pluginManager.permission.type.network": "Network",
          "pluginManager.permission.type.clipboard": "Clipboard",
          "pluginManager.permission.type.localFile": "Local file",

          "pluginManager.permission.externalOpen": "External open: {{hosts}}",
          "pluginManager.permission.storage": "Storage: {{scope}}",
          "pluginManager.permission.workspace": "Workspace: {{access}}",
          "pluginManager.permission.network": "Network: {{hosts}}",
          "pluginManager.permission.clipboard": "Clipboard: {{access}}",
          "pluginManager.permission.localFile": "Local file: {{access}}",

          "pluginManager.widget.stat.activeWidgets": "Active widgets",
          "pluginManager.widget.stat.layout": "Layout",
          "pluginManager.widget.stat.providers": "Providers",
          "pluginManager.widget.stat.background": "Background",
        },
      },
    ])

    context.registry.views.register(
      "official.plugin-manager.card",
      (props: SettingsPanelViewProps) =>
        PluginManagerCard({
          plugins: props.plugins ?? [],
          host: props.host,
          ...(context.i18n ? { i18n: context.i18n } : {}),
        }),
    )
    context.registry.views.register(
      "official.plugin-manager.status-widget",
      (props: WidgetViewProps) =>
        PluginStatusWidget({ ...props, i18n: context.i18n } as WidgetViewProps & {
          i18n?: InjectedI18n
        }),
    )
  },
}
