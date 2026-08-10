import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"
import { TaboraMark } from "./TaboraMark"

describe("TaboraMark", () => {
  it("renders as inline SVG with correct viewBox and brand shapes", () => {
    const host = document.createElement("div")
    const dispose = render(() => <TaboraMark />, host)

    const svg = host.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute("viewBox")).toBe("0 0 628 628")
    expect(svg?.getAttribute("role")).toBe("img")

    // 检查品牌形状是否存在
    const rects = svg?.querySelectorAll("rect")
    expect(rects?.length).toBe(4) // 背景 + 3 个品牌元素

    // 背景矩形
    const bg = rects?.[0]
    expect(bg?.getAttribute("width")).toBe("628")
    expect(bg?.getAttribute("rx")).toBe("152")
    expect(bg?.getAttribute("fill")).toBe("#1c1e1c")

    // 绿色方块
    const greenRect = rects?.[3]
    expect(greenRect?.getAttribute("fill")).toBe("#1a9070")

    expect(svg?.getAttribute("aria-hidden")).toBe("true")

    dispose()
  })

  it("accepts class and style props", () => {
    const host = document.createElement("div")
    const dispose = render(() => <TaboraMark class="test-class" style={{ width: "32px" }} />, host)

    const svg = host.querySelector("svg")
    expect(svg?.getAttribute("class")).toBe("test-class")
    expect(svg?.style.width).toBe("32px")

    dispose()
  })

  it("renders title when provided", () => {
    const host = document.createElement("div")
    const dispose = render(() => <TaboraMark title="Tabora Logo" />, host)

    const svg = host.querySelector("svg")
    const title = svg?.querySelector("title")
    expect(title?.textContent).toBe("Tabora Logo")
    expect(svg?.getAttribute("aria-labelledby")).toBe("tabora-logo-title")
    expect(svg?.getAttribute("aria-hidden")).toBeNull()

    dispose()
  })
})
