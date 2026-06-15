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

  it("renders richer interactive discovery demos for component doc pages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ComponentDocDemo id="combobox" />
          <ComponentDocDemo id="dropdown" />
          <ComponentDocDemo id="contextmenu" />
          <ComponentDocDemo id="command" />
        </>
      ),
      root,
    )

    expect(root.textContent).toContain("搜索插件与搜索源")
    expect(root.textContent).toContain("今日重点卡片")
    expect(root.textContent).toContain("右键卡片快捷操作")
    expect(root.textContent).toContain("工作台命令中心")

    root.remove()
  })

  it("renders richer structural and guidance demos for component doc pages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ComponentDocDemo id="popover" />
          <ComponentDocDemo id="hovercard" />
          <ComponentDocDemo id="menubar" />
          <ComponentDocDemo id="treeview" />
        </>
      ),
      root,
    )

    expect(document.body.textContent).toContain("背景来源")
    expect(document.body.textContent).toContain("工作区状态说明")
    expect(document.body.textContent).toContain("设置导航")
    expect(document.body.textContent).toContain("插件文件")

    root.remove()
  })

  it("renders richer configuration flow demos for component doc pages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ComponentDocDemo id="pagination" />
          <ComponentDocDemo id="slider" />
          <ComponentDocDemo id="togglegroup" />
          <ComponentDocDemo id="collapsible" />
        </>
      ),
      root,
    )

    expect(root.textContent).toContain("插件日志分页")
    expect(root.textContent).toContain("背景蒙层强度")
    expect(root.textContent).toContain("每周工作日")
    expect(root.textContent).toContain("高级同步策略")

    root.remove()
  })

  it("renders richer information and action demos for component doc pages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ComponentDocDemo id="accordion" />
          <ComponentDocDemo id="listrow" />
          <ComponentDocDemo id="copybutton" />
          <ComponentDocDemo id="timeline" />
        </>
      ),
      root,
    )

    expect(root.textContent).toContain("插件接入问答")
    expect(root.textContent).toContain("插件设置列表")
    expect(root.textContent).toContain("复制插件标识")
    expect(root.textContent).toContain("最近同步记录")

    root.remove()
  })

  it("renders richer identity and navigation demos for component doc pages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ComponentDocDemo id="avatar" />
          <ComponentDocDemo id="chip" />
          <ComponentDocDemo id="breadcrumb" />
          <ComponentDocDemo id="emptystate" />
        </>
      ),
      root,
    )

    expect(root.textContent).toContain("插件协作成员")
    expect(root.textContent).toContain("当前筛选标签")
    expect(root.textContent).toContain("设置路径")
    expect(root.textContent).toContain("固定卡片区域")

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
