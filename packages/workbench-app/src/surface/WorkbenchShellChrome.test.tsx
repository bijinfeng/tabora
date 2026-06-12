import { describe, expect, it } from "vitest"

import {
  SafeWorkbenchLayout,
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchSettingsAboutContent,
} from "./WorkbenchShellChrome"

describe("WorkbenchShellChrome exports", () => {
  it("keeps the stable chrome component exports", () => {
    expect(typeof WorkbenchAddWidgetModal).toBe("function")
    expect(typeof WorkbenchSettingsAboutContent).toBe("function")
    expect(typeof SafeWorkbenchLayout).toBe("function")
    expect(typeof WorkbenchExpandOverlay).toBe("function")
    expect(typeof WorkbenchContextMenuOverlay).toBe("function")
  })
})
