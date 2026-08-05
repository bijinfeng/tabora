import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const layoutDiyMasonryManifest: PluginManifest = {
  id: "community.layout.diy-masonry",
  name: "DIY Masonry Layout",
  version: "1.0.0",
  apiVersion: "1.0.0",
  publisher: "community",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "global", order: 20 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    layouts: [
      {
        id: "community.layout.diy-masonry",
        title: "DIY 瀑布流布局",
        view: "community.layout.diy-masonry.view",
        regions: [{ id: "masonry", title: "瀑布流", accepts: ["widget"], required: true }],
        defaultRegions: {
          masonry: [
            { instanceId: "quick-links-1" },
            { instanceId: "notes-1" },
            { instanceId: "todo-1" },
          ],
        },
        supportsResponsive: true,
      },
    ],
  },
}
