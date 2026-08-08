import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
import { QuickLinksCard } from "./quick-links-card"

function makeProps(overrides: Partial<WidgetViewProps> = {}): WidgetViewProps {
  return makeWidgetViewProps({
    instanceId: "quick-links-1",
    pluginId: "official.widgets.quick-links",
    contributionId: "quick-links",
    size: "M",
    supportedSizes: ["S", "M", "L"],
    config: { links: [] },
    ...overrides,
  })
}

async function flushMount() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("QuickLinksCard", () => {
  it("opens links through the widget host instead of a blank-target anchor", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const openExternal = vi.fn().mockResolvedValue(true)

    render(
      () => <QuickLinksCard {...makeProps({ host: { ...makeProps().host, openExternal } })} />,
      root,
    )
    await flushMount()

    expect(root.querySelector('a[target="_blank"]')).toBeNull()
    const button = root.querySelector("[data-quick-link]") as HTMLButtonElement
    expect(button).toBeTruthy()
    button.click()

    expect(openExternal).toHaveBeenCalledWith("https://github.com")
    root.remove()
  })

  it("uses the prototype default quick links when no config is provided", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <QuickLinksCard {...makeProps()} />, root)
    await flushMount()

    expect(root.querySelector("[data-quick-links-card]")).toBeTruthy()
    expect(root.querySelector(".quick-links")).toBeNull()
    expect(root.textContent).toContain("GitHub")
    expect(root.querySelector("button[aria-label='Notion']")).toBeTruthy()
    expect(root.querySelector("button[aria-label='Linear']")).toBeTruthy()
    expect(root.querySelector("button[aria-label='Figma']")).toBeTruthy()
    root.remove()
  })

  it("keeps rendering when the host rejects external open", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const openExternal = vi.fn().mockResolvedValue(false)

    render(
      () => <QuickLinksCard {...makeProps({ host: { ...makeProps().host, openExternal } })} />,
      root,
    )
    await flushMount()

    const button = root.querySelector("[data-quick-link]") as HTMLButtonElement
    button.click()

    expect(openExternal).toHaveBeenCalledWith("https://github.com")
    expect(root.textContent).toContain("GitHub")
    root.remove()
  })

  it("renders the size-specific quick-link composition", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <QuickLinksCard {...makeProps({ size: "L" })} />, root)
    await flushMount()

    expect(root.querySelector("[data-quick-links-variant='L']")).toBeTruthy()
    root.remove()
  })
})
