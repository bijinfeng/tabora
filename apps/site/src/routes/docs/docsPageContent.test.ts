import { describe, expect, it } from "vitest"

import { getDocsPageContent } from "./docsPageContent"

describe("getDocsPageContent", () => {
  it("returns localized sidebar labels for English", () => {
    const content = getDocsPageContent("en")

    expect(content.sidebarGroups[0]?.title).toBe("Getting started")
    expect(content.sidebarGroups[0]?.items[0]?.label).toBe("Quick start")
    expect(content.sections.quickstart.title).toBe("Create your first Tabora plugin in three steps")
  })

  it("includes componentized input-control specs", () => {
    const content = getDocsPageContent("zh-CN")

    expect(content.componentSpecs.inputControls).toHaveLength(3)
    expect(content.componentSpecs.inputControls[0]?.id).toBe("button")
    expect(content.componentSpecs.inputControls[1]?.title).toBe("Input 输入框")
  })
})
