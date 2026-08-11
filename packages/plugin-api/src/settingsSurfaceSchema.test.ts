import { describe, expect, it } from "vitest"

import { pluginManifestSchema } from "./manifestSchema"

describe("settings panel surfaces schema", () => {
  it("rejects settings panels without an explicit supported surface", () => {
    const basePanel = {
      id: "official.settings.workspace.appearance",
      title: "外观",
      content: {
        kind: "custom-view" as const,
        view: "official.settings.workspace.appearance.view",
      },
      section: "appearance" as const,
      scope: "workspace" as const,
    }

    for (const surfaces of [undefined, [], ["tablet"]]) {
      const result = pluginManifestSchema.safeParse({
        id: "official.settings.workspace",
        name: "Workspace Settings",
        version: "0.0.0",
        apiVersion: "1.0.0",
        entry: "./settings-workspace",
        engine: { platform: "^0.1.0" },
        contributes: {
          settingsPanels: [
            {
              ...basePanel,
              ...(surfaces === undefined ? {} : { surfaces }),
            },
          ],
        },
      })

      expect(result.success).toBe(false)
    }
  })
})
