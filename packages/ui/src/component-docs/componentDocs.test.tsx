import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"

import {
  ComponentDocDemo,
  componentDocDemoRenderers,
  componentDocItems,
  componentDocsCategories,
  getComponentDoc,
} from "./index"

describe("component docs catalog", () => {
  it("keeps component docs metadata and renderable demos in the UI package", () => {
    expect(componentDocsCategories[0]?.items[0]).toEqual({ id: "button", name: "Button" })
    expect(getComponentDoc("button")?.title).toBe("Button 按钮")
    expect(componentDocItems.some((item) => item.id === "patterns")).toBe(true)

    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <ComponentDocDemo id="button" />, root)

    expect(root.textContent).toContain("主要")
    expect(root.textContent).toContain("危险柔和")

    root.remove()
  })

  it("renders the shared combination pattern demo from the UI package", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <ComponentDocDemo id="patterns" />, root)

    expect(root.textContent).toContain("插件设置")
    expect(root.textContent).toContain("搜索配置")

    root.remove()
  })

  it("registers a demo renderer for every documented component", () => {
    const categoryIds = componentDocsCategories.flatMap((category) =>
      category.items.map((item) => item.id),
    )

    expect(categoryIds).toEqual(componentDocItems.map((item) => item.id))
    expect(Object.keys(componentDocDemoRenderers).sort()).toEqual([...categoryIds].sort())
  })
})
