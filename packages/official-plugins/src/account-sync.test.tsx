import "fake-indexeddb/auto"
import type { AuthClient } from "@tabora/auth"
import {
  createAccountSyncService,
  createWebHostAdapter,
  createWebStorageAdapter,
} from "@tabora/host-adapters"
import { createBuiltinPluginPackage, createPluginKernel } from "@tabora/platform-kernel"
import type { SettingsPanelModel } from "@tabora/plugin-api/sdk"
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

function authClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue({ jwt: "jwt", userId: "u1" }),
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
    const storageAdapter = createWebStorageAdapter("tabora-account-sync-plugin-test", {
      enableSync: true,
    })
    const host = createWebHostAdapter()
    const plugin = createOfficialAccountSyncPlugin({
      service: createAccountSyncService({ host, storageAdapter, apiBaseUrl: "http://api.test" }),
    })
    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: { network: true, storage: true },
    })

    await kernel.discover([createBuiltinPluginPackage(plugin)])
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
      getSession: vi.fn().mockResolvedValue({ jwt: "jwt", userId: "u1" }),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)

    const model = await provider.getModel({ locale: "zh-CN", surface: "desktop" })

    expect(modelText(model)).toContain("a@test.com")
    expect(modelText(model)).toContain("已登录")
  })

  it("logs in with ephemeral renderer values and exposes credential failures in its model", async () => {
    const login = vi
      .fn()
      .mockRejectedValueOnce({ code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" })
      .mockResolvedValue({ jwt: "jwt", userId: "u1" })
    const client = authClient({
      login,
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)

    await provider.dispatch(
      {
        id: "account.login",
        values: { "account.email": "a@test.com", "account.password": "wrong123" },
      },
      { surface: "desktop" },
    )
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("邮箱或密码错误")

    await provider.dispatch(
      {
        id: "account.login",
        values: { "account.email": "a@test.com", "account.password": "pw12345678" },
      },
      { surface: "desktop" },
    )

    expect(login).toHaveBeenLastCalledWith("a@test.com", "pw12345678")
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("已登录")
  })

  it("validates registration confirmation before registering and logging in", async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const login = vi.fn().mockResolvedValue({ jwt: "jwt", userId: "u1" })
    const client = authClient({
      register,
      login,
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
    })
    const provider = createAccountSettingsProvider(client)
    await provider.dispatch({ id: "account.mode.register", values: {} }, { surface: "desktop" })

    await provider.dispatch(
      {
        id: "account.register",
        values: {
          "account.email": "a@test.com",
          "account.password": "pw12345678",
          "account.confirm-password": "different-password",
        },
      },
      { surface: "desktop" },
    )
    expect(register).not.toHaveBeenCalled()
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain(
      "两次输入的密码不一致",
    )

    await provider.dispatch(
      {
        id: "account.register",
        values: {
          "account.email": "a@test.com",
          "account.password": "pw12345678",
          "account.confirm-password": "pw12345678",
        },
      },
      { surface: "desktop" },
    )

    expect(register).toHaveBeenCalledWith("a@test.com", "pw12345678")
    expect(login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("owns the complete password-reset state machine", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue(undefined)
    const resetPassword = vi.fn().mockResolvedValue(undefined)
    const client = authClient({ requestPasswordReset, resetPassword })
    const provider = createAccountSettingsProvider(client)

    await provider.dispatch({ id: "account.mode.reset", values: {} }, { surface: "desktop" })
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("发送重置链接")

    await provider.dispatch(
      { id: "account.request-reset", values: { "account.email": "a@test.com" } },
      { surface: "desktop" },
    )
    expect(requestPasswordReset).toHaveBeenCalledWith("a@test.com")
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("设置新密码")

    await provider.dispatch(
      {
        id: "account.reset-password",
        values: {
          "account.reset-code": "123456",
          "account.new-password": "pw12345678",
          "account.confirm-new-password": "pw12345678",
        },
      },
      { surface: "desktop" },
    )

    expect(resetPassword).toHaveBeenCalledWith("123456", "pw12345678")
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("密码已重置")
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
    const provider = createSyncSettingsProvider(
      syncManager,
      syncMetaRepo as never,
      authClient({ getSession: vi.fn().mockResolvedValue({ jwt: "jwt" }) }),
    )

    await provider.dispatch({ id: "sync.now", values: {} }, { surface: "desktop" })

    expect(syncManager.triggerSync).toHaveBeenCalledOnce()
    expect(syncMetaRepo.set).toHaveBeenCalledWith("lastSyncAt", expect.any(String))
    expect(modelText(await provider.getModel({ surface: "desktop" }))).toContain("已同步")
  })

  it("exposes the design-specified sync status, scope, and unavailable follow-up actions", async () => {
    const syncMetaRepo = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(),
    }
    const provider = createSyncSettingsProvider(
      { triggerSync: vi.fn().mockResolvedValue(undefined) },
      syncMetaRepo as never,
      authClient(),
    )

    const model = await provider.getModel({ surface: "mobile" })
    const groups = model.nodes.filter(
      (node): node is Extract<typeof node, { type: "group" }> => node.type === "group",
    )

    expect(groups.map((group) => group.title)).toEqual(["同步状态", "同步范围", "处理"])
    expect(groups[0]?.meta).toBe("未开启")
    expect(groups[0]?.children).toHaveLength(3)
    expect(groups[0]?.children).toEqual([
      expect.objectContaining({
        type: "row",
        label: "本地模式",
        description: "未同步",
        meta: "未开启",
        metaVariant: "badge",
      }),
      expect.objectContaining({
        type: "field",
        id: "sync.auto",
        label: "后台自动同步",
        control: "switch",
        value: false,
        disabled: true,
      }),
      expect.objectContaining({
        type: "row",
        label: "立即同步",
        action: expect.objectContaining({
          id: "sync.now",
          label: "登录后可用",
          disabled: true,
        }),
      }),
    ])
    expect(groups[1]?.meta).toBe("V1")
    expect(groups[1]?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "row", label: "会同步" }),
        expect.objectContaining({ type: "row", label: "不会同步" }),
      ]),
    )
    expect(groups[2]?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "row",
          label: "冲突",
          action: expect.objectContaining({ disabled: true }),
        }),
        expect.objectContaining({
          type: "row",
          label: "恢复",
          action: expect.objectContaining({ disabled: true }),
        }),
      ]),
    )
  })

  it("matches the prototype before the signed-in user starts syncing", async () => {
    const syncMetaRepo = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(),
    }
    const provider = createSyncSettingsProvider(
      { triggerSync: vi.fn().mockResolvedValue(undefined) },
      syncMetaRepo as never,
      authClient({ getSession: vi.fn().mockResolvedValue({ jwt: "jwt" }) }),
    )

    const model = await provider.getModel({ surface: "desktop" })
    const syncGroup = model.nodes.find(
      (node): node is Extract<typeof node, { type: "group" }> =>
        node.type === "group" && node.title === "同步状态",
    )

    expect(syncGroup).toMatchObject({
      meta: "待开启",
      children: [
        {
          type: "row",
          label: "待开启",
          description: "登录后尚未开启同步",
          meta: "等待开启",
          metaTone: "accent",
          metaVariant: "badge",
        },
        {
          type: "field",
          id: "sync.auto",
          label: "后台自动同步",
          control: "switch",
          value: false,
          disabled: true,
        },
        {
          type: "row",
          label: "立即同步",
          action: { id: "sync.now", label: "开启同步", variant: "primary", disabled: false },
        },
      ],
    })
  })
})
