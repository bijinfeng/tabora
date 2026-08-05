import { describe, expect, it } from "vitest"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"
import { createWebHostAdapter } from "@tabora/host-adapters"

import { createWorkbenchComposition } from "./index"

const defaultWorkspacePreset: WorkspacePresetContribution = {
  id: "preset.default",
  title: "Default Workspace",
  plugins: ["official.search.command-bar"],
  layout: {
    pluginId: "official.layout",
    kind: "layout",
    id: "official.layout.workbench-dashboard",
  },
  theme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
  backgroundProvider: {
    pluginId: "official.background",
    kind: "background-provider",
    id: "official.background.default",
  },
  search: {
    defaultProvider: {
      pluginId: "official.search",
      kind: "search-provider",
      id: "official.search.google",
    },
    enabledProviders: [
      { pluginId: "official.search", kind: "search-provider", id: "official.search.google" },
      { pluginId: "official.search", kind: "search-provider", id: "official.search.duckduckgo" },
    ],
  },
  regions: [{ regionId: "topbar", accepts: ["search"] }],
  instances: [
    {
      contribution: {
        pluginId: "official.search.command-bar",
        kind: "search",
        id: "official.search.command-bar",
      },
      instanceId: "search-main",
      regionId: "topbar",
    },
  ],
}

describe("createWorkbenchComposition", () => {
  it("derives default search settings from the injected default workspace preset", () => {
    const composition = createWorkbenchComposition({
      host: createWebHostAdapter({ id: "host.test" }),
      defaultWorkspacePreset,
    })

    expect(composition.initialState.searchSettings).toEqual(defaultWorkspacePreset.search)
  })

  it("preserves explicitly injected search settings", () => {
    const composition = createWorkbenchComposition({
      host: createWebHostAdapter({ id: "host.test" }),
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
