import { render } from "solid-js/web"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getComponentDoc } from "@tabora/ui/component-docs"
import { ComponentDocCard } from "./ComponentDocCard"

describe("ComponentDocCard demo loading", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("waits for a catalog card to approach the viewport before mounting its demo", async () => {
    let notify: IntersectionObserverCallback | undefined
    let observer: IntersectionObserver | undefined

    class TestIntersectionObserver {
      readonly root = null
      readonly rootMargin = "400px 0px"
      readonly thresholds = [0]

      constructor(callback: IntersectionObserverCallback) {
        notify = callback
        observer = this as unknown as IntersectionObserver
      }

      disconnect = vi.fn()
      observe = vi.fn()
      takeRecords = vi.fn(() => [])
      unobserve = vi.fn()
    }

    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver)

    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => <ComponentDocCard doc={getComponentDoc("button")!} deferDemo />,
      root,
    )

    expect(root.querySelector('[aria-label="组件示例等待加载"]')).not.toBeNull()
    expect(root.textContent).not.toContain("危险柔和")

    notify?.(
      [
        {
          isIntersecting: true,
          target: root.querySelector("[data-docs-demo]")!,
        } as IntersectionObserverEntry,
      ],
      observer!,
    )

    await vi.waitFor(() => expect(root.textContent).toContain("危险柔和"))

    dispose()
    root.remove()
  })
})
