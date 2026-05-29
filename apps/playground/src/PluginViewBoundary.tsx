import type { JSX } from "solid-js"

function appendText(parent: HTMLElement, tagName: string, text: string): void {
  const element = document.createElement(tagName)
  element.textContent = text
  parent.append(element)
}

export function createPluginErrorFallback(
  error: unknown,
  instanceId: string,
  title: string,
): HTMLElement {
  const root = document.createElement("div")
  root.className = "plugin-error-fallback"
  root.setAttribute("role", "alert")
  root.dataset.instanceId = instanceId
  appendText(root, "strong", title)
  appendText(root, "span", "插件视图加载失败")
  appendText(root, "small", instanceId)
  appendText(root, "pre", error instanceof Error ? error.message : String(error))
  const btn = document.createElement("button")
  btn.className = "plugin-error-retry-btn"
  btn.textContent = "重试"
  btn.addEventListener("click", () => location.reload())
  root.append(btn)
  return root
}

export function PluginViewBoundary(props: {
  instanceId: string
  title: string
  children: JSX.Element
}) {
  try {
    return props.children
  } catch (error) {
    return createPluginErrorFallback(error, props.instanceId, props.title)
  }
}
