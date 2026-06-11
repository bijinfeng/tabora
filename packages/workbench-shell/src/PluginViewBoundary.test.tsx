import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PluginViewBoundary } from "./PluginViewBoundary"

const mounts: HTMLElement[] = []

afterEach(() => {
  for (const root of mounts.splice(0)) {
    root.remove()
  }
})

function mount(view: () => JSX.Element, props?: Record<string, unknown>): HTMLElement {
  const root = document.createElement("div")
  document.body.append(root)
  render(
    () => (
      <PluginViewBoundary instanceId="broken-widget" title="Broken Widget" {...(props as object)}>
        {view()}
      </PluginViewBoundary>
    ),
    root,
  )
  mounts.push(root)
  return root
}

describe("PluginViewBoundary", () => {
  it("renders a scoped fallback when a plugin view throws", () => {
    const root = mount(() => {
      throw new Error("boom")
    })

    expect(root.textContent).toContain("Broken Widget")
    expect(root.textContent).toContain("插件视图加载失败")
    expect(root.textContent).toContain("broken-widget")
    expect(root.textContent).toContain("boom")
  })

  it("renders healthy plugin content normally", () => {
    const root = mount(() => "Healthy plugin")

    expect(root.textContent).toContain("Healthy plugin")
    expect(root.textContent).not.toContain("插件视图加载失败")
  })

  it("uses injected fallback copy", () => {
    const root = mount(
      () => {
        throw new Error("boom")
      },
      {
        copy: {
          loadFailed: "Plugin view failed to load",
          retry: "Retry",
        },
      },
    )

    expect(root.textContent).toContain("Plugin view failed to load")
    expect(root.querySelector("button")?.textContent).toBe("Retry")
  })

  it("renders a retry button without relying on full page reload", () => {
    const reloadSpy = vi.spyOn(window.location, "reload").mockImplementation(() => undefined)
    const root = mount(() => {
      throw new Error("retry-me")
    })

    const button = root.querySelector("button")
    expect(button?.textContent).toBe("重试")

    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(reloadSpy).not.toHaveBeenCalled()

    reloadSpy.mockRestore()
  })
})
