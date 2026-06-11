import { describe, expect, it } from "vitest"

import { getDocsPageContent } from "./docsPageContent"

describe("getDocsPageContent", () => {
  it("returns localized sidebar labels for English", () => {
    const content = getDocsPageContent("en")

    expect(content.sidebarGroups[0]?.title).toBe("Getting started")
    expect(content.sidebarGroups[0]?.items[0]?.label).toBe("Quick start")
    expect(content.sections.quickstart.title).toBe("Create your first Tabora plugin in three steps")
  })
})
