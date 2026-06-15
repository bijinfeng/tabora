import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { FieldRow } from "./fieldRow"

describe("FieldRow", () => {
  it("renders label, description, trailing and helper", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <FieldRow
          label="当前语言"
          description="影响工作台宿主文案和官方插件面板文案"
          helper="会写入当前工作区外观配置"
          trailing={<button type="button">切换</button>}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("当前语言")
    expect(root.textContent).toContain("影响工作台宿主文案")
    expect(root.textContent).toContain("会写入当前工作区外观配置")
    expect(root.querySelector("button")?.textContent).toBe("切换")
  })

  it("renders as compact row without helper when helper is omitted", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <FieldRow label="当前工作区" trailing={<span>默认</span>} />, root)

    expect(root.textContent).toContain("当前工作区")
    expect(root.textContent).toContain("默认")
    expect(root.querySelector(".tbr-field-row-helper")).toBeNull()
  })
})
