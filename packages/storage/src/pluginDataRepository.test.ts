import { describe, expect, it } from "vitest"
import "fake-indexeddb/auto"
import { createPluginDataRepository, createTaboraDatabase } from "@tabora/storage"

describe("createPluginDataRepository", () => {
  const database = createTaboraDatabase("test-plugin-data")
  const repo = createPluginDataRepository(database)

  const pluginId = "test.plugin"
  const instanceA = "instance-a"
  const instanceB = "instance-b"

  it("saves and retrieves plugin-level data", async () => {
    await repo.save(pluginId, "config", { theme: "dark" })
    const result = await repo.get<{ theme: string }>(pluginId, "config")
    expect(result).toEqual({ theme: "dark" })
  })

  it("getAll returns all plugin-level values", async () => {
    await repo.save(pluginId, "items", [1, 2, 3])
    const results = await repo.getAll(pluginId)
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results).toContainEqual([1, 2, 3])
  })

  it("removes plugin-level data", async () => {
    await repo.save(pluginId, "tmp", "value")
    await repo.remove(pluginId, "tmp")
    const result = await repo.get(pluginId, "tmp")
    expect(result).toBeUndefined()
  })

  it("saves and retrieves instance-scoped data", async () => {
    await repo.saveForInstance(pluginId, instanceA, "greeting", "hello")
    const result = await repo.getByInstance<string>(pluginId, instanceA, "greeting")
    expect(result).toBe("hello")
  })

  it("instance-scoped data is isolated between instances", async () => {
    await repo.saveForInstance(pluginId, instanceA, "value", "A")
    await repo.saveForInstance(pluginId, instanceB, "value", "B")

    const aVal = await repo.getByInstance<string>(pluginId, instanceA, "value")
    const bVal = await repo.getByInstance<string>(pluginId, instanceB, "value")
    expect(aVal).toBe("A")
    expect(bVal).toBe("B")
  })

  it("plugin-level get does not return instance-scoped data", async () => {
    await repo.saveForInstance(pluginId, instanceA, "secret", "hidden")
    const result = await repo.get(pluginId, "secret")
    expect(result).toBeUndefined()
  })

  it("getAllByInstance returns only that instance's data", async () => {
    await repo.saveForInstance(pluginId, instanceA, "a1", 1)
    await repo.saveForInstance(pluginId, instanceA, "a2", 2)
    await repo.saveForInstance(pluginId, instanceB, "b1", 3)

    const aData = await repo.getAllByInstance(pluginId, instanceA)
    expect(aData.length).toBeGreaterThanOrEqual(2)
    expect(aData).toContain(1)
    expect(aData).not.toContain(3)
  })

  it("removeForInstance deletes instance-scoped data", async () => {
    await repo.saveForInstance(pluginId, instanceA, "will-delete", "x")
    await repo.removeForInstance(pluginId, instanceA, "will-delete")
    const result = await repo.getByInstance(pluginId, instanceA, "will-delete")
    expect(result).toBeUndefined()
  })

  it("getByInstance returns undefined for non-existent key", async () => {
    const result = await repo.getByInstance(pluginId, instanceA, "nope")
    expect(result).toBeUndefined()
  })

  it("getAllByInstance returns empty for non-existent instance", async () => {
    const result = await repo.getAllByInstance(pluginId, "ghost-instance")
    expect(result).toEqual([])
  })
})
