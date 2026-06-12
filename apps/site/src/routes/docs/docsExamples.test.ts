import { describe, expect, it } from "vitest"

import { getDocsExample } from "./docsExamples"

describe("getDocsExample", () => {
  it("loads docs examples from the registry with a single source payload", () => {
    const example = getDocsExample("button")

    expect(example?.language).toBe("tsx")
    expect(example?.source).toContain("export function ButtonDemo")
    expect(typeof example?.render).toBe("function")
  })

  it("returns the same source string for rendering and code display", () => {
    const example = getDocsExample("select")

    expect(example?.source).toContain("export function SelectDemo")
    expect(example?.source).toContain("createSignal")
  })

  it("loads remaining overlay and feedback examples from component demo files", () => {
    expect(getDocsExample("dialog")?.language).toBe("tsx")
    expect(getDocsExample("toast")?.source).toContain("export function ToastDemo")
    expect(getDocsExample("table")?.source).toContain("export function TableDemo")
  })
})
