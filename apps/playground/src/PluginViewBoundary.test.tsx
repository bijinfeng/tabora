import { createComponent, createRoot } from "solid-js"
import type { JSX } from "solid-js"
import { afterEach, describe, expect, it } from "vitest"
import { PluginViewBoundary } from "./PluginViewBoundary"

const mounts: Array<{ root: HTMLElement; dispose: () => void }> = []

afterEach(() => {
  for (const { dispose, root } of mounts.splice(0)) {
    dispose()
    root.remove()
  }
})

function appendResult(root: HTMLElement, value: JSX.Element): void {
  if (value instanceof Node) {
    root.append(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) appendResult(root, item)
    return
  }
  if (typeof value === "string" || typeof value === "number") {
    root.append(String(value))
  }
}

function mount(view: () => JSX.Element): HTMLElement {
  const root = document.createElement("div")
  document.body.append(root)
  let dispose = () => {}
  createRoot((rootDispose) => {
    dispose = rootDispose
    const result = createComponent(PluginViewBoundary, {
      instanceId: "broken-widget",
      title: "Broken Widget",
      get children() {
        return view()
      },
    })
    appendResult(root, result)
  })
  mounts.push({ root, dispose })
  return root
}

describe("PluginViewBoundary", () => {
  it("renders a scoped fallback when a plugin view throws", () => {
    const root = mount(() => {
      throw new Error("boom")
    })

    expect(root.textContent).toContain("Broken Widget")
    expect(root.textContent).toContain("Plugin view failed")
    expect(root.textContent).toContain("broken-widget")
  })

  it("renders healthy plugin content normally", () => {
    const root = mount(() => "Healthy plugin")

    expect(root.textContent).toContain("Healthy plugin")
    expect(root.textContent).not.toContain("Plugin view failed")
  })
})
