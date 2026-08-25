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
  contributes: {},
}
