import "fake-indexeddb/auto"
import { afterEach, describe, expect, it } from "vitest"

import { createWorkbenchRuntimeBootstrap } from "./workbenchComposition"

function deleteWorkbenchDatabase() {
  const request = indexedDB.deleteDatabase("tabora")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createWorkbenchRuntimeBootstrap", () => {
  afterEach(async () => {
    localStorage.removeItem("tabora.ai.custom-provider")
    await deleteWorkbenchDatabase()
  })

  it("assembles account and sync settings for the root workbench", () => {
    const runtime = createWorkbenchRuntimeBootstrap()
    const accountSyncPlugin = runtime.plugins.find(
      (plugin) => plugin.module.manifest.id === "official.account-sync",
    )

    expect(
      accountSyncPlugin?.module.manifest.contributes.settingsPanels?.map((panel) => panel.id),
    ).toEqual(["official.settings.account-sync.account", "official.settings.account-sync.sync"])
    runtime.database?.close()
  })

  it("injects host-owned AI settings that keep custom secrets out of workspace storage", async () => {
    const runtime = createWorkbenchRuntimeBootstrap()
    const aiSettings = runtime.aiSettings
    expect(aiSettings).toBeDefined()
    if (!aiSettings) throw new Error("AI settings service is missing")

    await aiSettings.saveSettings({
      activeProvider: "custom",
      builtinModelId: "gpt-4.1-mini",
      custom: { baseUrl: "https://provider.example/v1", model: "custom-model", apiKey: "secret" },
    })

    await expect(aiSettings.getSettings()).resolves.toMatchObject({
      activeProvider: "custom",
      custom: { apiKeyConfigured: true },
    })
    runtime.database?.close()
  })
})
