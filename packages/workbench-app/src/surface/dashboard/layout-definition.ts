import type { LayoutContribution } from "@tabora/plugin-api/sdk"

/** Synthetic plugin id retained so persisted layout refs and preset composition keep resolving. */
export const BUILTIN_DASHBOARD_LAYOUT_PLUGIN_ID = "official.layout.workbench-dashboard"

/**
 * The dashboard is a host builtin, not a plugin, but the layout engine still maps instances into
 * the topbar (search) and mainGrid (widget) regions this contribution declares.
 */
export const builtinDashboardLayout: LayoutContribution = {
  id: "official.layout.workbench-dashboard",
  title: "工作台仪表盘布局",
  view: "official.layout.workbench-dashboard.view",
  regions: [
    { id: "topbar", title: "顶部搜索区", accepts: ["search"] },
    { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
  ],
  defaultRegions: {
    topbar: [{ instanceId: "search-main" }],
    mainGrid: [],
  },
  supportsResponsive: true,
}
