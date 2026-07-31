import { describe, expect, it } from "vitest"

import * as componentDocs from "./index"
import { componentDocItems, componentDocsCategories, getComponentDoc } from "./index"

describe("component docs catalog", () => {
  it("keeps the metadata entry free of demo implementations", () => {
    expect("ComponentDocDemo" in componentDocs).toBe(false)
    expect("componentDocDemoRenderers" in componentDocs).toBe(false)
  })

  it("keeps navigation, metadata, and routes on the same component ids", () => {
    const categoryIds = componentDocsCategories.flatMap((category) =>
      category.items.map((item) => item.id),
    )

    expect(componentDocsCategories[0]?.items[0]).toEqual({ id: "button", name: "Button" })
    expect(getComponentDoc("button")?.title).toBe("Button 按钮")
    expect(componentDocItems.some((item) => item.id === "patterns")).toBe(true)
    expect(categoryIds).toEqual(componentDocItems.map((item) => item.id))
    expect(getComponentDoc("unknown")).toBeUndefined()
  })
})
