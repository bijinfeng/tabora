import { describe, expect, it } from "vitest"
import { pluginManifestSchema } from "./manifestSchema"

describe("pluginManifestSchema", () => {
  it("accepts a plugin that contributes a widget", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "official.notes.card", modal: "official.notes.modal" },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects a widget whose default size is not supported", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.widgets",
      name: "Bad Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S"],
            defaultSize: "XL",
            allowMultipleInstances: true,
            views: { card: "bad.notes.card" },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("accepts a dashboard layout contribution with a registered view", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.layout.workbench-dashboard",
      name: "Workbench Dashboard Layout",
      version: "0.0.0",
      entry: "./layout-workbench-dashboard",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "official.layout.workbench-dashboard",
            title: "工作台仪表盘布局",
            view: "official.layout.workbench-dashboard.view",
            regions: [
              {
                id: "rail",
                title: "工作台导航",
                accepts: ["layout"],
                required: true,
                maxInstances: 1,
              },
              {
                id: "topbar",
                title: "顶部搜索区",
                accepts: ["search"],
                required: true,
                maxInstances: 1,
              },
              {
                id: "mainGrid",
                title: "主网格",
                accepts: ["widget"],
                required: true,
              },
            ],
            defaultRegions: {
              rail: [],
              topbar: [{ instanceId: "search-main" }],
              mainGrid: [
                { instanceId: "today-focus-1" },
                { instanceId: "quick-links-1" },
                { instanceId: "notes-1" },
                { instanceId: "todo-1" },
              ],
            },
            supportsResponsive: true,
          },
        ],
      },
    })

    expect(result.success).toBe(true)
    expect(result.success ? result.data.contributes.layouts?.[0]?.view : undefined).toBe(
      "official.layout.workbench-dashboard.view",
    )
  })

  it("rejects a layout contribution with an empty view", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.layout",
      name: "Bad Layout",
      version: "0.0.0",
      entry: "./layout",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "bad.layout",
            title: "Bad Layout",
            view: "",
            regions: [
              {
                id: "mainGrid",
                title: "Main Grid",
                accepts: ["widget"],
              },
            ],
            defaultRegions: {
              mainGrid: [],
            },
            supportsResponsive: true,
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })
})
