import { render } from "solid-js/web"
import { expect, it, vi } from "vitest"

vi.mock("../styled/button/button.demo", () => {
  throw new Error("demo chunk unavailable")
})

import { ComponentDocDemo } from "./renderers"

it("keeps a failed demo local and shows a readable fallback", async () => {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const dispose = render(() => <ComponentDocDemo id="button" />, root)

  await vi.waitFor(() => expect(root.textContent).toContain("示例加载失败"))

  dispose()
  root.remove()
})
