import "fake-indexeddb/auto"
import type { StrapiAuthClient } from "@tabora/auth"
import { createWebHostAdapter, createWebStorageAdapter } from "@tabora/host-adapters"
import { createPluginKernel } from "@tabora/platform-kernel"
import type { SettingsPanelModel } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  createAccountSettingsProvider,
  createOfficialAccountSyncPlugin,
  createSyncSettingsProvider,
} from "./account-sync"
import {
  officialAccountSettingsProviderId,
  officialSyncSettingsProviderId,
} from "./ui-plugin-manifests"

function authClient(overrides: Partial<StrapiAuthClient> = {}): StrapiAuthClient {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue({ jwt: "jwt", userId: 1 }),
    logout: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn().mockResolvedValue(null),
    getCurrentUser: vi.fn().mockResolvedValue(null),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function modelText(model: SettingsPanelModel): string {
  return JSON.stringify(model)
}

describe("official.account-sync", () => {
  it("exposes account and sync providers only while the optional plugin is enabled", async () => {
    const storageAdapter = createWebStorageAdapter("tabora-account-sync-plugin-test")
    const plugin = createOfficialAccountSyncPlugin({
      host: createWebHostAdapter(),
      storageAdapter,
      apiBaseUrl: "http://api.test",
    })
    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: { network: true, storage: true },
    })

    await kernel.discover([plugin])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.settings.has(officialAccountSettingsProviderId)).toBe(true)
    expect(kernel.registry.settings.has(officialSyncSettingsProviderId)).toBe(true)
    expect(kernel.registry.views.has("official.account-sync.account.view")).toBe(false)

    await kernel.setPluginEnabled("official.account-sync", false)

    expect(kernel.registry.settings.has(officialAccountSettingsProviderId)).toBe(false)
    expect(kernel.registry.settings.has(officialSyncSettingsProviderId)).toBe(false)
  })

  it("restores a signed-in session into the plugin-owned account model", async () => {
    const client = authClient({
      getSession: vi.fn().mockResolvedValue({ jwt: "jwt", userId: 1 }),
      getCurrentUser: vi.fn().mockResolvedValue({ id: 1, email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)

    const model = await provider.getModel({ locale: "zh-CN" })

    expect(modelText(model)).toContain("a@test.com")
    expect(modelText(model)).toContain("已登录")
  })

  it("logs in with ephemeral renderer values and exposes credential failures in its model", async () => {
    const login = vi
      .fn()
      .mockRejectedValueOnce({ code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" })
      .mockResolvedValue({ jwt: "jwt", userId: 1 })
    const client = authClient({
      login,
      getCurrentUser: vi.fn().mockResolvedValue({ id: 1, email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)

    await provider.dispatch(
      {
        id: "account.login",
        values: { "account.email": "a@test.com", "account.password": "wrong123" },
      },
      {},
    )
    expect(modelText(await provider.getModel({}))).toContain("邮箱或密码错误")

    await provider.dispatch(
      {
        id: "account.login",
        values: { "account.email": "a@test.com", "account.password": "pw12345678" },
      },
      {},
    )

    expect(login).toHaveBeenLastCalledWith("a@test.com", "pw12345678")
    expect(modelText(await provider.getModel({}))).toContain("已登录")
  })

  it("validates registration confirmation before registering and logging in", async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const login = vi.fn().mockResolvedValue({ jwt: "jwt", userId: 1 })
    const client = authClient({
      register,
      login,
      getCurrentUser: vi.fn().mockResolvedValue({ id: 1, email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)
    await provider.dispatch({ id: "account.mode.register", values: {} }, {})

    await provider.dispatch(
      {
        id: "account.register",
        values: {
          "account.email": "a@test.com",
          "account.password": "pw12345678",
          "account.confirm-password": "different-password",
        },
      },
      {},
    )
    expect(register).not.toHaveBeenCalled()
    expect(modelText(await provider.getModel({}))).toContain("两次输入的密码不一致")

    await provider.dispatch(
      {
        id: "account.register",
        values: {
          "account.email": "a@test.com",
          "account.password": "pw12345678",
          "account.confirm-password": "pw12345678",
        },
      },
      {},
    )

    expect(register).toHaveBeenCalledWith("a@test.com", "pw12345678")
    expect(login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("owns the complete password-reset state machine", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue(undefined)
    const resetPassword = vi.fn().mockResolvedValue(undefined)
    const client = authClient({ requestPasswordReset, resetPassword })
    const provider = createAccountSettingsProvider(client)

    await provider.dispatch({ id: "account.mode.reset", values: {} }, {})
    expect(modelText(await provider.getModel({}))).toContain("发送重置链接")

    await provider.dispatch(
      { id: "account.request-reset", values: { "account.email": "a@test.com" } },
      {},
    )
    expect(requestPasswordReset).toHaveBeenCalledWith("a@test.com")
    expect(modelText(await provider.getModel({}))).toContain("设置新密码")

    await provider.dispatch(
      {
        id: "account.reset-password",
        values: {
          "account.reset-code": "123456",
          "account.new-password": "pw12345678",
          "account.confirm-new-password": "pw12345678",
        },
      },
      {},
    )

    expect(resetPassword).toHaveBeenCalledWith("123456", "pw12345678")
    expect(modelText(await provider.getModel({}))).toContain("密码已重置")
  })

  it("records a fresh lastSyncAt after a successful manual sync", async () => {
    const values = new Map<string, string>()
    const syncMetaRepo = {
      get: vi.fn(async (key: string) => values.get(key)),
      set: vi.fn(async (key: string, value: string) => {
        values.set(key, value)
      }),
      remove: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(),
    }
    const syncManager = { triggerSync: vi.fn().mockResolvedValue(undefined) }
    const provider = createSyncSettingsProvider(syncManager, syncMetaRepo as never)

    await provider.dispatch({ id: "sync.now", values: {} }, {})

    expect(syncManager.triggerSync).toHaveBeenCalledOnce()
    expect(syncMetaRepo.set).toHaveBeenCalledWith("lastSyncAt", expect.any(String))
    expect(modelText(await provider.getModel({}))).toContain("已同步")
  })
})
