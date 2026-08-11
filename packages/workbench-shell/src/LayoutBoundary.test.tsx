import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { LayoutBoundary } from "./LayoutBoundary"

function Boom(): never {
  throw new Error("布局崩了")
}

describe("LayoutBoundary", () => {
  it("子组件抛错时渲染错误状态并调用 onError", () => {
    const onError = vi.fn()
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <LayoutBoundary
          fallback={<div data-testid="error-state">布局不可用</div>}
          onError={onError}
        >
          <Boom />
        </LayoutBoundary>
      ),
      host,
    )
    expect(host.querySelector("[data-testid='error-state']")).toBeTruthy()
    expect(onError).toHaveBeenCalled()
    dispose()
  })

  it("子组件正常时渲染子内容", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <LayoutBoundary fallback={<div>布局不可用</div>} onError={vi.fn()}>
          <div data-testid="ok">正常</div>
        </LayoutBoundary>
      ),
      host,
    )
    expect(host.querySelector("[data-testid='ok']")).toBeTruthy()
    dispose()
  })
})
