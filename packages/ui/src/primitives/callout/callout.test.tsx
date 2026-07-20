import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Banner } from "./callout"

describe("Banner", () => {
  it("spreads raw attrs to every rendered slot", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClose = vi.fn()

    render(
      () => (
        <Banner
          title="标题"
          description="说明"
          action={<span>操作</span>}
          onClose={onClose}
          attrs={{ class: "root" }}
          iconAttrs={{ class: "icon" }}
          bodyAttrs={{ class: "body" }}
          titleAttrs={{ class: "title" }}
          descriptionAttrs={{ class: "description" }}
          actionAttrs={{ class: "action" }}
          closeAttrs={{ class: "close", style: "width:28px" }}
        />
      ),
      root,
    )

    expect(root.querySelector("[role='status']")?.className).toBe("root")
    expect(root.querySelector("[aria-hidden='true']")?.className).toBe("icon")
    expect(root.querySelector("strong")?.parentElement?.className).toBe("body")
    expect(root.querySelector("strong")?.className).toBe("title")
    expect(root.querySelector("strong + span")?.className).toBe("description")
    expect(root.querySelector("[role='status'] > span:last-of-type")?.className).toBe("action")

    const close = root.querySelector("button[aria-label='关闭']") as HTMLButtonElement
    expect(close.className).toBe("close")
    expect(close.getAttribute("style")).toMatch(/28(?:px)?/)
    close.click()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
