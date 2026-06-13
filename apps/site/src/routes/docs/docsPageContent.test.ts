import { describe, expect, it } from "vitest"

import {
  defaultDocsSectionId,
  getDocsPageContent,
  getDocsSectionPath,
  resolveDocsPage,
} from "./docsPageContent"

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
        title: "Example",
        exampleId: "button",
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
        exampleId: "select",
      }),
    )
    expect(content.componentSpecs.selectionControls[1]?.demos[0]).toEqual(
      expect.objectContaining({
        exampleId: "checkbox",
      }),
    )
    expect(content.componentSpecs.selectionControls[2]?.demos[0]).toEqual(
      expect.objectContaining({
        exampleId: "switch",
      }),
    )
    expect(content.componentSpecs.selectionControls[3]?.demos[0]).toEqual(
      expect.objectContaining({
        exampleId: "radio",
      }),
    )
  })

  it("migrates overlays, feedback, and structure sections to example ids", () => {
    const content = getDocsPageContent("zh-CN")
    const componentSpecs = content.componentSpecs as typeof content.componentSpecs & {
      overlayControls?: Array<{ demos: Array<{ exampleId?: string }> }>
      feedbackControls?: Array<{ demos: Array<{ exampleId?: string }> }>
      structureControls?: Array<{ demos: Array<{ exampleId?: string }> }>
    }

    expect(componentSpecs.overlayControls?.[0]?.demos[0]).toEqual(
      expect.objectContaining({ exampleId: "tabs" }),
    )
    expect(componentSpecs.feedbackControls?.[0]?.demos[0]).toEqual(
      expect.objectContaining({ exampleId: "toast" }),
    )
    expect(componentSpecs.structureControls?.[2]?.demos[0]).toEqual(
      expect.objectContaining({ exampleId: "card" }),
    )
  })

  it("maps every sidebar item to a standalone docs route", () => {
    const content = getDocsPageContent("zh-CN")
    const sidebarIds = content.sidebarGroups.flatMap((group) => group.items.map((item) => item.id))

    expect(defaultDocsSectionId).toBe("quickstart")
    expect(new Set(sidebarIds).size).toBe(sidebarIds.length)
    expect(sidebarIds.map(getDocsSectionPath)).toContain("/docs/quickstart")
    expect(sidebarIds.map(getDocsSectionPath)).toContain("/docs/button")
    expect(sidebarIds.map(getDocsSectionPath)).toContain("/docs/card")
  })

  it("resolves one sidebar item into one docs page payload", () => {
    const content = getDocsPageContent("zh-CN")

    expect(resolveDocsPage(content, "quickstart")).toEqual(
      expect.objectContaining({
        id: "quickstart",
        kind: "guide",
        title: "三步创建第一个 Tabora 插件",
      }),
    )
    expect(resolveDocsPage(content, "button")).toEqual(
      expect.objectContaining({
        id: "button",
        kind: "component",
        title: "Button 按钮",
      }),
    )
    expect(resolveDocsPage(content, "missing")).toEqual(
      expect.objectContaining({
        id: "missing",
        kind: "missing",
      }),
    )
  })
})
