import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"

import { componentDocItems } from "./metadata"
import { ComponentDocDemo, componentDocDemoLoaders } from "./renderers"

describe("component doc demo loaders", () => {
  it("registers one lazy loader for every documented component", () => {
    expect(Object.keys(componentDocDemoLoaders).sort()).toEqual(
      componentDocItems.map((item) => item.id).sort(),
    )
  })

  it("loads and renders a requested demo", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(() => <ComponentDocDemo id="button" />, root)

    expect(root.textContent).toContain("正在加载示例")
    await vi.waitFor(() => expect(root.textContent).toContain("危险柔和"))

    dispose()
    root.remove()
  })

  it("renders nothing for an unknown demo id", () => {
    const root = document.createElement("div")
    const dispose = render(() => <ComponentDocDemo id="unknown" />, root)

    expect(root.textContent).toBe("")

    dispose()
  })
})
