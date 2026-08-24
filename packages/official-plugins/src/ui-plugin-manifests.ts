import type { PluginManifest } from "@tabora/plugin-api/sdk"
import { BUILTIN_SEARCH_PROVIDER_PLUGIN_ID } from "./builtinSearchProviders"

export const officialSearchCommandBarManifest: PluginManifest = {
  id: "official.search.command-bar",
  name: "Tabora Search Command Bar",
  version: "0.0.0",
  apiVersion: "1.0.0",
  entry: "./search-command-bar",
  styles: [{ href: "./styles.css", scope: "plugin", order: 30 }],
  engine: { platform: "^0.1.0" },
  permissions: [{ type: "external-open", hosts: ["*"] }],
  contributes: {
    searches: [
      {
        id: "official.search.command-bar",
        title: "搜索栏",
        defaultProviders: [
          {
            pluginId: BUILTIN_SEARCH_PROVIDER_PLUGIN_ID,
            kind: "search-provider",
            id: "official.search.google",
          },
          {
            pluginId: BUILTIN_SEARCH_PROVIDER_PLUGIN_ID,
            kind: "search-provider",
            id: "official.search.bing",
          },
        ],
        supportsSuggestions: true,
        view: "official.search.command-bar.view",
      },
    ],
  },
}

export const officialPluginManagerManifest: PluginManifest = {
  id: "official.plugin-manager",
  name: "Plugin Manager",
  version: "0.0.0",
  apiVersion: "1.0.0",
  entry: "./plugin-manager-entry",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    settingsPanels: [
      {
        id: "official.settings.plugins",
        title: "插件",
        content: { kind: "custom-view", view: "official.plugin-manager.card" },
        section: "plugins",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 10,
        hostActions: ["plugins.manage"],
        hostReads: ["plugins.read"],
      },
    ],
  },
}

export const officialSettingsWorkspaceManifest: PluginManifest = {
  id: "official.settings.workspace",
  name: "Workspace Settings",
  version: "0.0.0",
  apiVersion: "1.0.0",
  entry: "./settings-workspace",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    settingsPanels: [
      {
        id: "official.settings.workspace.appearance",
        title: "外观",
        content: {
          kind: "custom-view",
          view: "official.settings.workspace.appearance.view",
        },
        section: "appearance",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 20,
        hostActions: [
          "workspace.theme.write",
          "workspace.background.write",
          "workspace.locale.write",
        ],
        hostReads: ["workspace.current.read", "catalog.themes.read", "catalog.backgrounds.read"],
      },
      {
        id: "official.settings.workspace.search",
        title: "搜索",
        content: { kind: "custom-view", view: "official.settings.workspace.search.view" },
        section: "search",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 30,
        hostActions: ["workspace.search.write"],
        hostReads: ["catalog.search-providers.read", "workspace.search.read"],
      },
      {
        id: "official.settings.workspace.workbench",
        title: "工作区",
        content: {
          kind: "custom-view",
          view: "official.settings.workspace.workbench.view",
        },
        section: "general",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 40,
        hostActions: ["workspace.transfer", "workspace.manage"],
        hostReads: ["workspace.current.read", "workspace.list.read"],
      },
      {
        id: "official.settings.workspace.ai",
        title: "AI",
        content: { kind: "custom-view", view: "official.settings.workspace.ai.view" },
        section: "ai",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 50,
      },
      {
        id: "official.settings.workspace.plugins",
        title: "运行插件配置",
        content: { kind: "custom-view", view: "official.settings.workspace.plugins.view" },
        section: "plugins",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 20,
        hostReads: ["plugins.read"],
      },
    ],
  },
}

export const officialAccountSettingsProviderId = "official.account-sync.account.provider"
export const officialSyncSettingsProviderId = "official.account-sync.sync.provider"

export const officialAccountSyncManifest: PluginManifest = {
  id: "official.account-sync",
  name: "Tabora Account & Sync",
  version: "0.0.0",
  apiVersion: "1.0.0",
  entry: "./account-sync",
  engine: { platform: "^0.1.0" },
  requiredCapabilities: ["network", "storage"],
  contributes: {
    settingsPanels: [
      {
        id: "official.settings.account-sync.account",
        title: "账号",
        content: {
          kind: "schema",
          provider: officialAccountSettingsProviderId,
          schemaVersion: 1,
        },
        section: "account",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 10,
      },
      {
        id: "official.settings.account-sync.sync",
        title: "数据同步",
        content: {
          kind: "schema",
          provider: officialSyncSettingsProviderId,
          schemaVersion: 1,
        },
        section: "sync",
        scope: "workspace",
        surfaces: ["desktop", "mobile"],
        order: 10,
      },
    ],
  },
}
