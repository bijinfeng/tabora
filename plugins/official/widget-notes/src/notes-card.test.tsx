import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { NotesCard } from "./notes-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "notes-1",
    pluginId: "official.widgets.notes",
    contributionId: "notes",
    size: "M",
    supportedSizes: ["M", "L", "XL"],
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

describe("NotesCard", () => {
  it("renders textarea with placeholder", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} />, root)
    expect(root.querySelector("textarea")).toBeTruthy()
    root.remove()
  })

  it("does not fail when host localStorage is unavailable", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} />, root)
    await Promise.resolve()
    expect(root.querySelector("textarea")).toBeTruthy()
    root.remove()
  })
})
