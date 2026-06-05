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
    apiVersion: "1.0.0",
    entry: "./background-basic",
    engine: { platform: "^0.1.0" },
    contributes: {
      backgroundProviders: [
        {
          id: "background.solid-green",
          title: "纯色绿底",
          sourceType: "generated",
          source: { type: "css", css: { background: "rgb(237, 241, 238)" } },
          defaultCss: { background: "rgb(237, 241, 238)" },
        },
        {
          id: "background.solid-dark",
          title: "纯色暗底",
          sourceType: "generated",
          source: { type: "css", css: { background: "rgb(18, 18, 18)" } },
          defaultCss: { background: "rgb(18, 18, 18)" },
        },
        {
          id: "background.gradient-green",
          title: "渐变绿底",
          sourceType: "generated",
          source: {
            type: "gradient",
            css: "linear-gradient(135deg, rgba(35, 113, 89, 0.18), transparent 32%), rgb(var(--color-page))",
          },
          defaultCss: {
            background:
              "linear-gradient(135deg, rgba(35, 113, 89, 0.18), transparent 32%), rgb(var(--color-page))",
          },
        },
        {
          id: "background.gradient-blue",
          title: "渐变蓝底",
          sourceType: "generated",
          source: {
            type: "gradient",
            css: "linear-gradient(160deg, rgba(66, 133, 244, 0.15), transparent 40%), rgb(var(--color-page))",
          },
          defaultCss: {
            background:
              "linear-gradient(160deg, rgba(66, 133, 244, 0.15), transparent 40%), rgb(var(--color-page))",
          },
        },
        {
          id: "background.gradient-purple",
          title: "渐变紫底",
          sourceType: "generated",
          source: {
            type: "gradient",
            css: "linear-gradient(135deg, rgba(128, 90, 213, 0.15), transparent 35%), rgb(var(--color-page))",
          },
          defaultCss: {
            background:
              "linear-gradient(135deg, rgba(128, 90, 213, 0.15), transparent 35%), rgb(var(--color-page))",
          },
        },
      ],
      backgroundRenderers: [
        {
          id: "official.background.css-renderer",
          title: "CSS 背景渲染器",
          accepts: ["css", "gradient"],
          view: "official.background.css-renderer.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.background.css-renderer.view", BackgroundRenderer)
  },
}
