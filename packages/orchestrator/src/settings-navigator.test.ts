import { describe, expect, it } from "vitest"
import type { SettingsPanelContribution } from "@tabora/plugin-api"
import {
  createSettingsNavigator,
  resolveInitialSettingsPanelId,
  resolveSettingsSectionId,
  type SettingsPanelDescriptor,
} from "./settings-navigator"

function panel(id: string, order?: number): SettingsPanelContribution {
  return order !== undefined
    ? { id, title: id, view: `${id}.view`, order }
    : { id, title: id, view: `${id}.view` }
}

describe("settings navigator", () => {
  it("resolves section ids without depending on DOM or settings host UI", () => {
    expect(resolveSettingsSectionId()).toBe("general")
    expect(resolveSettingsSectionId("official.settings.plugins")).toBe("plugins")
    expect(resolveSettingsSectionId("official.settings.workspace.appearance")).toBe("appearance")
    expect(resolveSettingsSectionId("official.settings.workspace.search")).toBe("search")
    expect(resolveSettingsSectionId("official.settings.workspace.workbench")).toBe("general")
    expect(resolveSettingsSectionId("community.settings.custom")).toBe("about")
  })

  it("uses requested panel when available and falls back to first sorted panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      { ...panel("official.settings.plugins", 10), pluginId: "plugin-a" },
      { ...panel("official.settings.workspace.search", 20), pluginId: "plugin-b" },
    ]

    expect(resolveInitialSettingsPanelId(panels, "official.settings.workspace.search")).toBe(
      "official.settings.workspace.search",
    )
    expect(resolveInitialSettingsPanelId(panels, "missing")).toBe("official.settings.plugins")
  })

  it("groups panels by section and resolves the initial section", () => {
    const navigator = createSettingsNavigator([
      { ...panel("official.settings.workspace.search", 30), pluginId: "plugin-b" },
      { ...panel("official.settings.workspace.appearance", 20), pluginId: "plugin-a" },
      { ...panel("official.settings.plugins", 10), pluginId: "plugin-a" },
      { ...panel("community.settings.misc"), pluginId: "plugin-c" },
    ])

    expect(navigator.initialSectionId("official.settings.workspace.search")).toBe("search")
    expect(navigator.sections.search.panels.map((item) => item.id)).toEqual([
      "official.settings.workspace.search",
    ])
    expect(navigator.sections.plugins.panels.map((item) => item.id)).toEqual([
      "official.settings.plugins",
    ])
    expect(navigator.sections.about.panels.map((item) => item.id)).toEqual([
      "community.settings.misc",
    ])
  })
})
