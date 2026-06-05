import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"
import { createWebHostAdapter } from "@tabora/host-adapters"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { StorageAdapter } from "@tabora/storage"

import { createWorkbenchRuntimeBootstrap } from "./bootstrap"

const testPlugins: BuiltinPlugin[] = [
  {
    manifest: {
      id: "test.plugin",
      name: "Test Plugin",
      version: "0.0.1",
      entry: "./index.ts",
      engine: { platform: "^0.1.0" },
      contributes: {},
    },
    enabled: true,
    activate() {},
  },
]

describe("createWorkbenchRuntimeBootstrap", () => {
  it("creates kernel, catalog, database, and repositories together", () => {
    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: testPlugins,
      databaseName: "tabora-workbench-app-bootstrap-test",
    })

    expect(runtime.host.id).toBe("host.test")
    expect(runtime.kernel.plugins).toEqual([])
    expect(runtime.catalog.plugins).toBe(testPlugins)
    expect(runtime.repositories.workspaceRepo).toBeDefined()
    expect(runtime.repositories.instanceRepo).toBeDefined()
    expect(runtime.repositories.pluginDataRepo).toBeDefined()
    expect(runtime.repositories.pluginRecordRepo).toBeDefined()
  })

  it("accepts a storage adapter from the host", () => {
    const storageAdapter: StorageAdapter = {
      repositories: {
        workspaceRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
        },
        instanceRepo: {
          async getAll() {
            return []
          },
          async getByWorkspace() {
            return []
          },
          async getByRegion() {
            return []
          },
          async get() {
            return undefined
          },
          async save() {},
          async removeByWorkspace() {},
          async remove() {},
        },
        pluginDataRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
          async getByWorkspace() {
            return undefined
          },
          async getAllByWorkspace() {
            return []
          },
          async saveForWorkspace() {},
          async removeForWorkspace() {},
          async removeByWorkspace() {},
          async getByInstance() {
            return undefined
          },
          async getAllByInstance() {
            return []
          },
          async saveForInstance() {},
          async removeForInstance() {},
        },
        pluginRecordRepo: {
          async get() {
            return undefined
          },
          async getAll() {
            return []
          },
          async save() {},
          async remove() {},
        },
      },
    }

    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: testPlugins,
      storageAdapter,
    })

    expect(runtime.repositories).toBe(storageAdapter.repositories)
  })
})
