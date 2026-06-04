import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { ToastHost } from "./ToastHost"

describe("ToastHost", () => {
  it("renders toast messages in order", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <ToastHost
          toasts={[
            { id: 1, msg: "A" },
            { id: 2, msg: "B" },
          ]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("A")
    expect(root.textContent).toContain("B")

    root.remove()
  })
})
