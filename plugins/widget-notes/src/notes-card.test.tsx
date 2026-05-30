import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { NotesCard } from "./notes-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "notes-1",
    pluginId: "official.widgets.notes",
    contributionId: "notes",
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as WidgetViewProps
}

describe("NotesCard", () => {
  it("renders textarea with placeholder", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} />, root)
    expect(root.querySelector("textarea")).toBeTruthy()
    root.remove()
  })
})
