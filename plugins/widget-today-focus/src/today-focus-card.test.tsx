import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodayFocusCard } from "./today-focus-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "focus-1",
    pluginId: "official.widgets.today-focus",
    contributionId: "today-focus",
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as WidgetViewProps
}

describe("TodayFocusCard", () => {
  it("renders input with placeholder", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodayFocusCard {...makeProps()} />, root)
    expect(root.querySelector("input")).toBeTruthy()
    expect(root.textContent).toContain("今天最重要的一件事")
    root.remove()
  })
})
