import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { QuickLinksCard } from "./quick-links-card"

function makeProps(overrides?: Partial<WidgetViewProps>): WidgetViewProps {
  return {
    instanceId: "quick-links-1",
    pluginId: "official.widgets.quick-links",
    contributionId: "quick-links",
    size: "M",
    supportedSizes: ["S", "M", "L"],
    config: {
      links: [],
    },
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    host: {
      updateConfig: vi.fn().mockResolvedValue(undefined),
      removeInstance: vi.fn().mockResolvedValue(undefined),
      requestResize: vi.fn().mockResolvedValue(undefined),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(true),
    },
    ...overrides,
  }
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
    const button = root.querySelector("button.link-anchor") as HTMLButtonElement
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

    expect(root.textContent).toContain("GitHub")
    expect(root.textContent).toContain("Notion")
    expect(root.textContent).toContain("Linear")
    expect(root.textContent).toContain("Figma")
    expect(root.textContent).toContain("YouTube")
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

    const button = root.querySelector("button.link-anchor") as HTMLButtonElement
    button.click()

    expect(openExternal).toHaveBeenCalledWith("https://github.com")
    expect(root.textContent).toContain("GitHub")
    root.remove()
  })
})
