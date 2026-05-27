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
  appendText(root, "span", "Plugin view failed")
  appendText(root, "small", instanceId)
  appendText(root, "pre", error instanceof Error ? error.message : String(error))
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
