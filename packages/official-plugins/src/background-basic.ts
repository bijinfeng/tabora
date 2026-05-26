import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function BackgroundRenderer() {
  return null
}

export const officialBackgroundBasic: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.background.basic",
    name: "Basic Background",
    version: "0.0.0",
    entry: "./background-basic",
    engine: { platform: "^0.1.0" },
    contributes: {
      backgroundProviders: [
        { id: "background.solid-green", title: "纯色绿底", sourceType: "generated" },
        { id: "background.solid-dark", title: "纯色暗底", sourceType: "generated" },
        { id: "background.gradient-green", title: "渐变绿底", sourceType: "generated" },
        { id: "background.gradient-blue", title: "渐变蓝底", sourceType: "generated" },
      ],
      backgroundRenderers: [
        {
          id: "official.background.css-renderer",
          title: "CSS 背景渲染器",
          accepts: ["image", "gradient"],
          view: "official.background.css-renderer.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.background.css-renderer.view", BackgroundRenderer)
  },
}
