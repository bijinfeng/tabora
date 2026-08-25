import { createEffect, onCleanup } from "solid-js"
import type { PluginModule } from "@tabora/plugin-api/sdk"
import type { BackgroundRendererViewProps } from "@tabora/plugin-api/sdk"

export function CSSBackgroundRenderer(props: BackgroundRendererViewProps) {
  createEffect(() => {
    const value = props.resolvedValue

    // 确定要应用的样式
    let style: Record<string, string>
    if (!value) {
      // 没有 resolved value，使用 fallback
      style = props.fallbackStyle
    } else if (value.type === "css") {
      style = value.css
    } else if (value.type === "gradient") {
      style = { background: value.css }
    } else {
      // 其他类型（image/video/canvas）不由 CSS renderer 处理
      style = props.fallbackStyle
    }

    // 应用样式到 body
    const appliedProps = Object.keys(style)
    for (const [prop, val] of Object.entries(style)) {
      document.body.style.setProperty(prop, val)
    }

    onCleanup(() => {
      // 清理应用的样式
      for (const prop of appliedProps) {
        document.body.style.removeProperty(prop)
      }
    })
  })

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
    context.views.register("official.background.basic.css-renderer.view", CSSBackgroundRenderer)
  },
}
