import { afterEach, describe, expect, it } from "vitest"

import { createFnosStorageAdapter } from "../../frontend/src/localStorageAdapter"
import { createFnosServer } from "./server"

describe("FNOS 本地存储服务", () => {
  const servers: Array<ReturnType<typeof createFnosServer>> = []

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()))
  })

  it("保存工作区后可读取，删除后不再返回", async () => {
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)
    const workspace = { id: "default", name: "我的工作台" }

    expect(
      (
        await server.inject({
          method: "PUT",
          url: "/api/local-store/workspaces/default",
          payload: { value: workspace },
        })
      ).statusCode,
    ).toBe(204)

    const read = await server.inject({
      method: "GET",
      url: "/api/local-store/workspaces/default",
    })
    expect(read.statusCode).toBe(200)
    expect(read.json()).toEqual({ value: workspace })

    expect(
      (await server.inject({ method: "DELETE", url: "/api/local-store/workspaces/default" }))
        .statusCode,
    ).toBe(204)
    expect(
      (await server.inject({ method: "GET", url: "/api/local-store/workspaces/default" }))
        .statusCode,
    ).toBe(404)
  })

  it("前端 repository 将工作区与插件数据写入本地服务", async () => {
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)
    const apiBaseUrl = await server.listen({ host: "127.0.0.1", port: 0 })
    const adapter = createFnosStorageAdapter(apiBaseUrl)
    const workspace = {
      id: "default",
      name: "我的工作台",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "official.background.default",
      regions: {},
      createdAt: "2026-08-04T00:00:00.000Z",
      updatedAt: "2026-08-04T00:00:00.000Z",
    }

    await adapter.repositories.workspaceRepo.save(workspace)
    await adapter.repositories.pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspace.id,
      "search-history",
      [{ query: "Tabora", providerId: "official.search.google", timestamp: workspace.createdAt }],
    )

    expect(await adapter.repositories.workspaceRepo.get(workspace.id)).toEqual(workspace)
    expect(
      await adapter.repositories.pluginDataRepo.getByWorkspace(
        "official.search.command-bar",
        workspace.id,
        "search-history",
      ),
    ).toEqual([
      { query: "Tabora", providerId: "official.search.google", timestamp: workspace.createdAt },
    ])
  })
})
