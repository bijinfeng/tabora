import { describe, expect, it } from "vitest"

import { getDocsExample } from "./docsExamples"

describe("getDocsExample", () => {
  it("loads docs examples from the registry with a single source payload", () => {
    const example = getDocsExample("button.variants")

    expect(example?.language).toBe("html")
    expect(example?.source).toContain('<button class="btn btn-primary btn-md">')
    expect(typeof example?.render).toBe("function")
  })

  it("returns the same source string for rendering and code display", () => {
    const example = getDocsExample("select.groups-disabled")

    expect(example?.source).toContain('<select class="sel">')
    expect(example?.source).toContain('<optgroup label="布局类">')
  })

  it("loads newly migrated selection-control examples from markdown in ui", () => {
    const example = getDocsExample("switch.settings-panel")

    expect(example?.language).toBe("html")
    expect(example?.source).toContain("<span>Dark mode</span>")
    expect(example?.source).toContain('<label class="swi">')
  })
})
