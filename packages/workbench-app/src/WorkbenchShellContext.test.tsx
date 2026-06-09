import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import {
  useWorkbenchShell,
  WorkbenchShellProvider,
  type WorkbenchShell,
} from "./WorkbenchShellContext"
import { createWorkbenchShellSurfaceStub } from "./WorkbenchShellSurfaceStub"

function Probe(props: { onShell: (shell: WorkbenchShell) => void }) {
  props.onShell(useWorkbenchShell())
  return null
}

describe("useWorkbenchShell", () => {
  it("throws when used outside a provider", () => {
    expect(() =>
      createRoot((dispose) => {
        try {
          useWorkbenchShell()
        } finally {
          dispose()
        }
      }),
    ).toThrow(/WorkbenchShellProvider/)
  })

  it("returns the provided shell within a provider", () => {
    const shell = createWorkbenchShellSurfaceStub()
    let received: WorkbenchShell | undefined

    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <WorkbenchShellProvider shell={shell}>
          <Probe onShell={(value) => (received = value)} />
        </WorkbenchShellProvider>
      ),
      root,
    )

    expect(received).toBe(shell)

    dispose()
    root.remove()
  })
})
