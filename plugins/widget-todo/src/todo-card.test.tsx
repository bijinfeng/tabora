import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodoCard } from "./todo-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "todo-1",
    pluginId: "official.widgets.todo",
    contributionId: "todo",
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as WidgetViewProps
}

describe("TodoCard", () => {
  it("renders add input", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    expect(root.querySelector("input")).toBeTruthy()
    root.remove()
  })
})
