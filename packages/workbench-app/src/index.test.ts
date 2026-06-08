import { describe, expect, it } from "vitest"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"

import { createWorkbenchComposition } from "./index"

const defaultWorkspacePreset: WorkspacePresetContribution = {
  id: "preset.default",
  title: "Default Workspace",
  plugins: ["official.search.command-bar"],
  layoutId: "official.layout.workbench-dashboard",
  themeId: "official.theme.light",
  backgroundProviderId: "official.background.default",
  search: {
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google", "official.search.duckduckgo"],
  },
  regions: [{ regionId: "topbar", accepts: ["search"] }],
  instances: [
    {
      pluginId: "official.search.command-bar",
      contributionId: "official.search.command-bar",
      instanceId: "search-main",
      extensionPoint: "search",
      regionId: "topbar",
    },
  ],
}

describe("createWorkbenchComposition", () => {
  it("derives default search settings from the injected default workspace preset", () => {
    const composition = createWorkbenchComposition({
      host: { id: "host.test", platform: "web", capabilities: {} } as any,
      defaultWorkspacePreset,
    } as any)

    expect(composition.initialState.searchSettings).toEqual(defaultWorkspacePreset.search)
  })

  it("preserves explicitly injected search settings", () => {
    const composition = createWorkbenchComposition({
      host: { id: "host.test", platform: "web", capabilities: {} } as any,
      defaultWorkspacePreset,
      initialState: {
        workspace: null,
        instances: [],
        searchSettings: defaultWorkspacePreset.search,
      },
    })

    expect(composition.initialState.searchSettings).toEqual(defaultWorkspacePreset.search)
  })
})
