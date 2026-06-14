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

  it("keeps richer form and feedback examples aligned with the docs scenarios", () => {
    const inputSource = getDocsExample("input")?.source ?? ""
    const selectSource = getDocsExample("select")?.source ?? ""
    const dialogSource = getDocsExample("dialog")?.source ?? ""
    const tableSource = getDocsExample("table")?.source ?? ""
    const toastSource = getDocsExample("toast")?.source ?? ""

    expect(inputSource).toContain("工作区搜索设置")
    expect(inputSource).toContain("InlineError")
    expect(selectSource).toContain("默认搜索源")
    expect(selectSource).toContain("打开方式")
    expect(dialogSource).toContain("移除插件")
    expect(dialogSource).toContain("清理本地数据")
    expect(tableSource).toContain("最近活动")
    expect(tableSource).toContain("权限")
    expect(toastSource).toContain("同步队列")
    expect(toastSource).toContain("重新连接")
  })

  it("keeps the second batch of docs examples grounded in realistic workbench scenarios", () => {
    const textareaSource = getDocsExample("textarea")?.source ?? ""
    const checkboxSource = getDocsExample("checkbox")?.source ?? ""
    const switchSource = getDocsExample("switch")?.source ?? ""
    const radioSource = getDocsExample("radio")?.source ?? ""
    const emptySource = getDocsExample("empty")?.source ?? ""
    const progressSource = getDocsExample("progress")?.source ?? ""
    const tooltipSource = getDocsExample("tooltip")?.source ?? ""
    const drawerSource = getDocsExample("drawer")?.source ?? ""

    expect(textareaSource).toContain("发布说明草稿")
    expect(checkboxSource).toContain("同步到所有工作区")
    expect(switchSource).toContain("启用命令搜索建议")
    expect(radioSource).toContain("搜索结果布局")
    expect(emptySource).toContain("暂时没有固定卡片")
    expect(progressSource).toContain("导入插件包")
    expect(tooltipSource).toContain("打开插件设置")
    expect(drawerSource).toContain("插件运行详情")
  })

  it("keeps the tabs docs example aligned with the visual prototype states", () => {
    const source = getDocsExample("tabs")?.source ?? ""

    expect(source).toContain('variant="pills"')
    expect(source).toContain("disabled: true")
    expect(source).toContain("<Badge")
  })

  it("keeps render functions available after helper-based registration", () => {
    expect(typeof getDocsExample("dialog")?.render).toBe("function")
    expect(typeof getDocsExample("toast")?.render).toBe("function")
    expect(typeof getDocsExample("table")?.render).toBe("function")
  })
})
