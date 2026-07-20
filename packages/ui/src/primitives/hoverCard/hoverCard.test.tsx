import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { HoverCard } from "./hoverCard"

describe("HoverCard", () => {
  it("renders a focusable trigger accessible structure", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <HoverCard trigger="Tabora" title="插件工作台" description="协议优先" />, root)

    const trigger = Array.from(root.querySelectorAll("button, span")).find(
      (element) => element.textContent === "Tabora",
    ) as HTMLElement | undefined
    expect(trigger).toBeTruthy()
    expect(trigger?.textContent).toBe("Tabora")

    root.remove()
  })
})
