import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { HoverCard } from "./hoverCard"

describe("HoverCard", () => {
  it("keeps the trigger keyboard-focusable and linked to tooltip content", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <HoverCard trigger="Tabora" title="插件工作台" description="协议优先" />, root)

    const trigger = root.querySelector(".tbr-hover-card-trigger") as HTMLSpanElement
    const content = root.querySelector(".tbr-hover-card-content") as HTMLSpanElement

    expect(trigger.getAttribute("tabindex")).toBe("0")
    expect(trigger.getAttribute("aria-describedby")).toBe(content.id)
    expect(content.getAttribute("role")).toBe("tooltip")

    root.remove()
  })
})
