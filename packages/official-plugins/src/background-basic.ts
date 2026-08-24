import type { PluginModule } from "@tabora/plugin-api/sdk"

export function BackgroundRenderer() {
  return null
}

export const officialBackgroundBasic: PluginModule = {
  manifest: {
    id: "official.background.basic",
    name: "Basic Background Renderer",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./background-basic",
    engine: { platform: "^0.1.0" },
    contributes: {
      backgroundRenderers: [
        {
          id: "official.background.css-renderer",
          title: "CSS 背景渲染器",
          accepts: ["css", "gradient"],
          view: "official.background.basic.css-renderer.view",
        },
      ],
    },
  },
  activate(context) {
    context.views.register("official.background.basic.css-renderer.view", BackgroundRenderer)
  },
}
