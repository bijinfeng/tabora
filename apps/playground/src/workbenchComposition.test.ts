import "fake-indexeddb/auto"
import { afterEach, describe, expect, it } from "vitest"

import { createPlaygroundRuntimeBootstrap } from "./workbenchComposition"

function deletePlaygroundDatabase() {
  const request = indexedDB.deleteDatabase("tabora")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createPlaygroundRuntimeBootstrap", () => {
  afterEach(async () => {
    await deletePlaygroundDatabase()
  })

  it("always assembles account and sync settings in Playground", () => {
    const runtime = createPlaygroundRuntimeBootstrap()
    const accountSyncPlugin = runtime.plugins.find(
      (plugin) => plugin.module.manifest.id === "official.account-sync",
    )

    expect(
      accountSyncPlugin?.module.manifest.contributes.settingsPanels?.map((panel) => panel.id),
    ).toEqual(["official.settings.account-sync.account", "official.settings.account-sync.sync"])
    runtime.database?.close()
  })
})
