import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { ToastHost } from "./ToastHost"

describe("ToastHost", () => {
  it("renders toast messages in order", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <ToastHost
          toasts={[
            { id: "toast-1", message: "A", type: "info", duration: 2500 },
            { id: "toast-2", message: "B", type: "success", duration: 2500 },
          ]}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("A")
    expect(root.textContent).toContain("B")
    expect(root.querySelectorAll("[data-toast-icon]")[0]?.textContent).toBe("✓")
    expect(root.querySelectorAll("[data-toast-message]")[1]?.textContent).toBe("B")
    expect(root.querySelector(".toast-item")).toBeNull()

    root.remove()
  })

  it("runs toast action commands by id", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const commandIds: string[] = []

    render(
      () => (
        <ToastHost
          toasts={[
            {
              id: "toast-1",
              message: "查看详情",
              type: "error",
              action: { label: "打开", commandId: "open-details" },
            },
          ]}
          onAction={(commandId) => commandIds.push(commandId)}
        />
      ),
      root,
    )

    root.querySelector<HTMLButtonElement>("[data-toast-action]")?.click()

    expect(commandIds).toEqual(["open-details"])

    root.remove()
  })
})
