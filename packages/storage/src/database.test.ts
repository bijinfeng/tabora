import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"

import { createTaboraDatabase } from "./database"

function deleteTestDatabase(name: string) {
  const request = indexedDB.deleteDatabase(name)
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("TaboraDatabase", () => {
  beforeEach(() => deleteTestDatabase("tabora-database-schema-test"))

  it("declares current MVP storage tables without legacy fallback paths", async () => {
    const database = createTaboraDatabase("tabora-database-schema-test")

    await database.open()

    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "eventLogs",
      "meta",
      "permissionGrants",
      "pluginData",
      "pluginInstances",
      "plugins",
      "searchHistory",
      "shortcutBindings",
      "workspaceSnapshots",
      "workspaces",
    ])

    database.close()
  })
})
