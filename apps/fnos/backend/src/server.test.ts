import { createServer } from "node:http"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { Workspace } from "@tabora/plugin-api"

import { createFnosStorageAdapter } from "../../frontend/src/localStorageAdapter"
import { createFnosServer } from "./server"

async function createStreamingOpenAiCompatibleProvider(): Promise<{
  baseUrl: string
  close: () => Promise<void>
}> {
  const provider = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/event-stream" })
    response.write(
      'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":0,"model":"local-model","choices":[{"index":0,"delta":{"content":"local summary"},"finish_reason":null}]}\n\n',
    )
    response.write(
      'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":0,"model":"local-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
    )
    response.end("data: [DONE]\n\n")
  })
  await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", resolve))
  const address = provider.address()
  if (!address || typeof address === "string") throw new Error("Unable to start local AI provider")
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    close: () =>
      new Promise((resolve, reject) =>
        provider.close((error) => (error ? reject(error) : resolve())),
      ),
  }
}

describe("FNOS 本地存储服务", () => {
  const servers: Array<ReturnType<typeof createFnosServer>> = []
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()))
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("通过飞牛统一网关前缀提供工作台和本地 API", async () => {
    const frontendDist = mkdtempSync(join(tmpdir(), "tabora-fnos-static-"))
    temporaryDirectories.push(frontendDist)
    writeFileSync(join(frontendDist, "index.html"), "<main>Tabora FNOS</main>")

    const server = createFnosServer({
      databasePath: ":memory:",
      frontendDist,
      gatewayPrefix: "/app/tabora",
    })
    servers.push(server)

    const health = await server.inject({ url: "/app/tabora/api/health" })
    expect(health.statusCode).toBe(200)
    expect(health.json()).toEqual({ status: "ok" })

    const workbench = await server.inject({ url: "/app/tabora/" })
    expect(workbench.statusCode).toBe(200)
    expect(workbench.body).toContain("Tabora FNOS")
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

  it("拒绝将本地 API 暴露给外部 Origin", async () => {
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)

    const external = await server.inject({
      method: "OPTIONS",
      url: "/api/local-store/workspaces",
      headers: {
        origin: "https://attacker.example",
        "access-control-request-method": "GET",
      },
    })
    expect(external.headers["access-control-allow-origin"]).toBeUndefined()

    const local = await server.inject({
      method: "OPTIONS",
      url: "/api/local-store/workspaces",
      headers: {
        origin: "http://127.0.0.1:5173",
        "access-control-request-method": "GET",
      },
    })
    expect(local.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173")
  })

  it("保存设备共享 AI 配置时不回显密钥，且拒绝内置模型模式", async () => {
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)

    const saved = await server.inject({
      method: "PUT",
      url: "/api/ai/config",
      payload: { baseUrl: "http://127.0.0.1:11434/v1", apiKey: "local-secret", model: "llama" },
    })
    expect(saved.statusCode).toBe(200)
    expect(saved.json()).toEqual({
      configured: true,
      baseUrl: "http://127.0.0.1:11434/v1",
      model: "llama",
      hasApiKey: true,
    })
    expect(saved.body).not.toContain("local-secret")

    const builtIn = await server.inject({
      method: "POST",
      url: "/api/ai/generate",
      payload: { provider: "builtin", prompt: "hello" },
    })
    expect(builtIn.statusCode).toBe(400)
    expect(builtIn.json()).toMatchObject({ error: { code: "ai_model_unavailable" } })
  })

  it("使用设备共享的 localhost provider 输出标准流，不接受请求中的临时密钥", async () => {
    const provider = await createStreamingOpenAiCompatibleProvider()
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)
    try {
      const saved = await server.inject({
        method: "PUT",
        url: "/api/ai/config",
        payload: { baseUrl: provider.baseUrl, apiKey: "device-secret", model: "local-model" },
      })
      expect(saved.statusCode).toBe(200)

      const streamed = await server.inject({
        method: "POST",
        url: "/api/ai/stream",
        payload: {
          provider: "custom",
          prompt: "summarize",
          custom: {
            baseUrl: "http://example.invalid/v1",
            apiKey: "request-secret",
            model: "ignored",
          },
        },
      })

      expect(streamed.statusCode).toBe(200)
      expect(streamed.headers["content-type"]).toContain("text/event-stream")
      expect(streamed.body).toContain("TEXT_MESSAGE_CONTENT")
      expect(streamed.body).toContain("local summary")
      expect(streamed.body).not.toContain("device-secret")
      expect(streamed.body).not.toContain("request-secret")
    } finally {
      await provider.close()
    }
  })

  it("前端 repository 将工作区与插件数据写入本地服务", async () => {
    const server = createFnosServer({ databasePath: ":memory:" })
    servers.push(server)
    const apiBaseUrl = await server.listen({ host: "127.0.0.1", port: 0 })
    const adapter = createFnosStorageAdapter(apiBaseUrl)
    const workspace: Workspace = {
      id: "default",
      name: "我的工作台",
      activeLayout: {
        pluginId: "official.layout.workbench-dashboard",
        kind: "layout",
        id: "official.layout.workbench-dashboard",
      },
      activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
      activeBackgroundProvider: {
        pluginId: "official.background",
        kind: "background-provider",
        id: "official.background.default",
      },
      config: {
        search: {
          defaultProvider: {
            pluginId: "official.search",
            kind: "search-provider",
            id: "official.search.google",
          },
          enabledProviders: [
            {
              pluginId: "official.search",
              kind: "search-provider",
              id: "official.search.google",
            },
          ],
        },
      },
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
    expect(adapter.sync).toBeUndefined()
  })
})
