import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodayFocusCard } from "./today-focus-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "focus-1",
    pluginId: "official.widgets.today-focus",
    contributionId: "today-focus",
    size: "M",
    supportedSizes: ["M", "L"],
    config: {},
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
  }
}

describe("TodayFocusCard", () => {
  it("renders input with placeholder", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodayFocusCard {...makeProps()} />, root)
    const input = root.querySelector("input.focus-input") as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.placeholder).toBe("写下今日重点")
    expect(root.textContent).toContain("尚未完成")
    root.remove()
  })
})
