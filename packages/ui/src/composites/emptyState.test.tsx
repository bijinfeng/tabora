import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { EmptyState } from "../primitives/emptyState/emptyState"

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <EmptyState title="无待办" description="今天先写一件事" action={<button>添加</button>} />
      ),
      root,
    )
    expect(root.textContent).toContain("无待办")
    expect(root.textContent).toContain("今天先写一件事")
    expect(root.querySelector("button")!.textContent).toBe("添加")
  })
})
