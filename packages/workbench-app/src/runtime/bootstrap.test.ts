import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"
import { createWebHostAdapter } from "@tabora/host-adapters"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { StorageAdapter } from "@tabora/storage"

import { createWorkbenchRuntimeBootstrap } from "./bootstrap"

const testPlugins: BuiltinPlugin[] = [
  {
    manifest: {
      id: "test.plugin",
      name: "Test Plugin",
      version: "0.0.1",
      apiVersion: "1.0.0",
      entry: "./index.ts",
      engine: { platform: "^0.1.0" },
      styles: [{ href: "./styles.css" }],
      contributes: {},
    },
    styleAssetUrls: {
      "./styles.css": "/assets/test-plugin.css",
    },
    enabled: true,
    activate() {},
  },
]

const defaultWorkspacePreset: WorkspacePresetContribution = {
  id: "preset.default",
  title: "Default Workspace",
  plugins: ["test.plugin"],
  layoutId: "official.layout.workbench-dashboard",
  themeId: "official.theme.light",
  backgroundProviderId: "official.background.default",
  search: {
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google"],
  },
  regions: [{ regionId: "mainGrid", accepts: ["widget"] }],
  instances: [],
}

const shellConfig = {
  themeIds: {
    light: "theme.light.custom",
    dark: "theme.dark.custom",
  },
  layoutIds: {
    dashboard: "layout.dashboard.custom",
    focus: "layout.focus.custom",
  },
  settingsPanelIds: {
    appearance: "settings.appearance.custom",
  },
  searchHistory: {
    pluginId: "search.plugin.custom",
    key: "search-history-custom",
  },
}

describe("createWorkbenchRuntimeBootstrap", () => {
  it("creates kernel, catalog, database, and repositories together", () => {
    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: testPlugins,
      databaseName: "tabora-workbench-app-bootstrap-test",
      defaultWorkspacePreset,
      shellConfig,
    } as any)

    expect(runtime.host.id).toBe("host.test")
    expect(runtime.kernel.plugins).toEqual([])
    expect(runtime.plugins[0]).toBe(testPlugins[0])
    expect(runtime.catalog.plugins[0]).toBe(testPlugins[0])
    expect(runtime.repositories.workspaceRepo).toBeDefined()
    expect(runtime.repositories.instanceRepo).toBeDefined()
    expect(runtime.repositories.pluginDataRepo).toBeDefined()
    expect(runtime.repositories.pluginRecordRepo).toBeDefined()
    expect(runtime.defaultWorkspacePreset).toBe(defaultWorkspacePreset)
    expect(runtime.shellConfig).toBe(shellConfig)
    expect(runtime.pluginStyles).toEqual([
      {
        pluginId: "test.plugin",
        href: "/assets/test-plugin.css",
        sourceHref: "./styles.css",
        scope: "plugin",
        order: 0,
        source: "builtin",
      },
    ])
  })

  it("accepts a storage adapter from the host", () => {
    const storageAdapter: StorageAdapter = {
      repositories: {
        workspaceRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
        },
        instanceRepo: {
          async getAll() {
            return []
          },
          async getByWorkspace() {
            return []
          },
          async getByRegion() {
            return []
          },
          async get() {
            return undefined
          },
          async save() {},
          async removeByWorkspace() {},
          async remove() {},
        },
        pluginDataRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
          async getByWorkspace() {
            return undefined
          },
          async getAllByWorkspace() {
            return []
          },
          async saveForWorkspace() {},
          async removeForWorkspace() {},
          async removeByWorkspace() {},
          async getByInstance() {
            return undefined
          },
          async getAllByInstance() {
            return []
          },
          async saveForInstance() {},
          async removeForInstance() {},
        },
        pluginRecordRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
        },
        workspaceSnapshotRepo: {
          async save() {},
          async getLast() {
            return undefined
          },
        },
      },
    }

    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: testPlugins,
      storageAdapter,
      defaultWorkspacePreset,
      shellConfig,
    } as any)

    expect(runtime.repositories).toBe(storageAdapter.repositories)
  })

  it("registers shell message bundles for both locales", () => {
    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: testPlugins,
      defaultWorkspacePreset,
      shellConfig,
    } as any)

    runtime.i18n.setLocale("en-US")
    expect(runtime.i18n.t("tabora.shell", "commandPalette.placeholder")).toBe(
      "Search commands, widgets, or type @bing weather",
    )
    expect(runtime.i18n.t("tabora.shell", "chrome.toolbar.search")).toBe("Search")
    expect(runtime.i18n.t("tabora.shell", "chrome.settings.about.title")).toBe("About Tabora")
    expect(runtime.i18n.t("tabora.shell", "settingsHost.sidebarTitle")).toBe("Settings")
    expect(runtime.i18n.t("tabora.shell", "placeholders.searchContributionMissing")).toBe(
      "Search contribution not found",
    )
    expect(runtime.i18n.t("tabora.shell", "widget.addNotSupported")).toBe(
      "This layout cannot add widgets",
    )

    runtime.i18n.setLocale("zh-CN")
    expect(runtime.i18n.t("tabora.shell", "pluginView.retry")).toBe("重试")
    expect(runtime.i18n.t("tabora.shell", "chrome.toolbar.settings")).toBe("设置")
    expect(runtime.i18n.t("tabora.shell", "settingsHost.closeAriaLabel")).toBe("关闭设置")
    expect(runtime.i18n.t("tabora.shell", "placeholders.searchViewUnavailable", { id: "x" })).toBe(
      "搜索视图不可用：x",
    )
    expect(runtime.i18n.t("tabora.shell", "widget.instanceSettings.title", { title: "便签" })).toBe(
      "便签 设置",
    )
  })
})
