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

  it("uses example ids instead of duplicated inline preview html for button demos", () => {
    const content = getDocsPageContent("en")
    const button = content.componentSpecs.inputControls.find(
      (spec: (typeof content.componentSpecs.inputControls)[number]) => spec.id === "button",
    )

    expect(button?.demos[0]).toEqual(
      expect.objectContaining({
        title: "Variants",
        exampleId: "button.variants",
      }),
    )
    expect("previewHtml" in (button?.demos[0] ?? {})).toBe(false)
  })

  it("migrates all selection controls to the shared example registry", () => {
    const content = getDocsPageContent("zh-CN")

    expect(
      content.sidebarGroups.find(
        (group: (typeof content.sidebarGroups)[number]) => group.title === "选择控件",
      )?.items,
    ).toHaveLength(4)
    expect(content.componentSpecs.selectionControls).toHaveLength(4)
    expect(content.componentSpecs.selectionControls[0]?.id).toBe("select")
    expect(content.componentSpecs.selectionControls[0]?.demos[0]).toEqual(
      expect.objectContaining({
        exampleId: "select.base-sizes",
      }),
    )
    expect(content.componentSpecs.selectionControls[1]?.demos[0]).toEqual(
      expect.objectContaining({
        exampleId: "checkbox.states",
      }),
    )
    expect(content.componentSpecs.selectionControls[2]?.demos[1]).toEqual(
      expect.objectContaining({
        exampleId: "switch.settings-panel",
      }),
    )
    expect(content.componentSpecs.selectionControls[3]?.demos[1]).toEqual(
      expect.objectContaining({
        exampleId: "radio.horizontal-disabled",
      }),
    )
  })
})
