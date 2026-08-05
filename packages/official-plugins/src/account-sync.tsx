import { type AccountSyncService, type SyncManager } from "@tabora/host-adapters"
import type { StrapiAuthClient } from "@tabora/auth"
import type { PluginModule } from "@tabora/plugin-api/sdk"
import type {
  SettingsNode,
  SettingsPanelAction,
  SettingsPanelModel,
  SettingsPanelProvider,
  SettingsStatusTone,
} from "@tabora/plugin-api/sdk"
import {
  officialAccountSettingsProviderId,
  officialAccountSyncManifest,
  officialSyncSettingsProviderId,
} from "./ui-plugin-manifests"

export type AccountSyncPluginOptions = {
  service: AccountSyncService
}

type AccountPhase = "login" | "register" | "reset-request" | "reset-verify" | "signed-in"
type ProviderStatus = { text: string; tone: SettingsStatusTone }

const MIN_PASSWORD = 8

function messageFor(error: unknown, fallback: string): string {
  const message = (error as { message?: string })?.message
  const code = (error as { code?: string })?.code
  return message ?? (code ? String(code) : fallback)
}

function stringValue(action: SettingsPanelAction, fieldId: string): string {
  const value = action.values[fieldId]
  return typeof value === "string" ? value : ""
}

function statusNode(status: ProviderStatus | null): SettingsNode[] {
  return status
    ? [{ type: "status", label: "操作状态", value: status.text, tone: status.tone }]
    : []
}

function accountModel(options: {
  phase: AccountPhase
  email: string
  accountEmail: string
  status: ProviderStatus | null
}): SettingsPanelModel {
  const { phase, email, accountEmail, status } = options

  if (phase === "signed-in") {
    return {
      version: 1,
      ariaLabel: "Tabora 账号",
      nodes: [
        {
          type: "group",
          title: "当前账号",
          description: "账号会话已保存到当前设备，同步前会先校验登录状态。",
          children: [
            { type: "status", label: "邮箱", value: accountEmail || "已登录", tone: "accent" },
            { type: "status", label: "状态", value: "已登录", tone: "success" },
            ...statusNode(status),
            {
              type: "actions",
              actions: [
                {
                  id: "account.logout",
                  label: "退出登录",
                  variant: "secondary",
                },
              ],
            },
          ],
        },
      ],
    }
  }

  if (phase === "reset-request") {
    return {
      version: 1,
      ariaLabel: "找回 Tabora 账号密码",
      nodes: [
        {
          type: "group",
          title: "找回密码",
          description: "发送重置链接，不登录不上传数据。",
          children: [
            {
              type: "field",
              id: "account.email",
              label: "邮箱",
              control: "email",
              value: email,
              required: true,
              autocomplete: "email",
              placeholder: "name@example.com",
            },
            ...statusNode(status),
            {
              type: "actions",
              actions: [
                {
                  id: "account.request-reset",
                  label: "发送重置链接",
                  variant: "primary",
                },
                { id: "account.mode.login", label: "返回登录", variant: "ghost" },
              ],
            },
          ],
        },
      ],
    }
  }

  if (phase === "reset-verify") {
    return {
      version: 1,
      ariaLabel: "设置 Tabora 账号新密码",
      nodes: [
        {
          type: "group",
          title: "设置新密码",
          description: "请粘贴重置链接中的 code，并设置新的登录密码。",
          children: [
            {
              type: "field",
              id: "account.reset-code",
              label: "重置码",
              control: "text",
              required: true,
              persistence: "ephemeral",
              autocomplete: "one-time-code",
              placeholder: "粘贴 code",
            },
            {
              type: "field",
              id: "account.new-password",
              label: "新密码",
              control: "password",
              required: true,
              minLength: MIN_PASSWORD,
              persistence: "ephemeral",
              autocomplete: "new-password",
              placeholder: `至少 ${MIN_PASSWORD} 位`,
            },
            {
              type: "field",
              id: "account.confirm-new-password",
              label: "确认新密码",
              control: "password",
              required: true,
              minLength: MIN_PASSWORD,
              persistence: "ephemeral",
              autocomplete: "new-password",
              placeholder: "再次输入新密码",
            },
            ...statusNode(status),
            {
              type: "actions",
              actions: [
                {
                  id: "account.reset-password",
                  label: "重置密码",
                  variant: "primary",
                },
                { id: "account.mode.login", label: "返回登录", variant: "ghost" },
              ],
            },
          ],
        },
      ],
    }
  }

  const registering = phase === "register"
  return {
    version: 1,
    ariaLabel: "Tabora 账号登录注册",
    nodes: [
      {
        type: "actions",
        actions: [
          {
            id: "account.mode.login",
            label: "登录",
            variant: registering ? "ghost" : "primary",
            disabled: !registering,
          },
          {
            id: "account.mode.register",
            label: "注册",
            variant: registering ? "primary" : "ghost",
            disabled: registering,
          },
        ],
      },
      {
        type: "group",
        title: registering ? "注册官方账号" : "登录官方账号",
        description: registering
          ? "注册后登录，并注册当前设备。"
          : "登录后注册设备，同步前不上传数据。",
        children: [
          {
            type: "field",
            id: "account.email",
            label: "邮箱",
            control: "email",
            value: email,
            required: true,
            autocomplete: "email",
            placeholder: "name@example.com",
          },
          {
            type: "field",
            id: "account.password",
            label: "密码",
            control: "password",
            required: true,
            ...(registering ? { minLength: MIN_PASSWORD } : {}),
            persistence: "ephemeral",
            autocomplete: registering ? "new-password" : "current-password",
            placeholder: registering ? `至少 ${MIN_PASSWORD} 位` : "输入密码",
          },
          ...(registering
            ? ([
                {
                  type: "field",
                  id: "account.confirm-password",
                  label: "确认密码",
                  control: "password",
                  required: true,
                  minLength: MIN_PASSWORD,
                  persistence: "ephemeral",
                  autocomplete: "new-password",
                  placeholder: "再次输入密码",
                },
              ] satisfies SettingsNode[])
            : []),
          ...statusNode(status),
          {
            type: "actions",
            actions: [
              {
                id: registering ? "account.register" : "account.login",
                label: registering ? "注册并登录" : "登录并注册设备",
                variant: "primary",
              },
              { id: "account.mode.reset", label: "忘记密码？", variant: "ghost" },
            ],
          },
        ],
      },
    ],
  }
}

export function createAccountSettingsProvider(authClient: StrapiAuthClient): SettingsPanelProvider {
  let phase: AccountPhase = "login"
  let email = ""
  let accountEmail = ""
  let status: ProviderStatus | null = null
  let initialization: Promise<void> | null = null

  async function ensureInitialized() {
    if (initialization) return initialization
    initialization = (async () => {
      try {
        const session = await authClient.getSession()
        if (!session) return
        const user = await authClient.getCurrentUser()
        if (!user) return
        accountEmail = user.email ?? ""
        email = accountEmail
        phase = "signed-in"
      } catch {
        // 会话恢复失败不影响本地工作台，回到登录入口。
      }
    })()
    return initialization
  }

  function fail(text: string) {
    status = { text, tone: "danger" }
  }

  function requireEmail(value: string): boolean {
    if (value) return true
    fail("请输入邮箱")
    return false
  }

  function requirePassword(value: string, label: string, minimum = 1): boolean {
    if (!value) {
      fail(`请输入${label}`)
      return false
    }
    if (value.length < minimum) {
      fail(`${label}至少 ${minimum} 位`)
      return false
    }
    return true
  }

  return {
    async getModel() {
      await ensureInitialized()
      return accountModel({ phase, email, accountEmail, status })
    },
    async dispatch(action) {
      await ensureInitialized()
      const submittedEmail = stringValue(action, "account.email").trim()
      if (submittedEmail) email = submittedEmail

      if (action.id === "account.mode.login") {
        phase = "login"
        status = null
        return
      }
      if (action.id === "account.mode.register") {
        phase = "register"
        status = null
        return
      }
      if (action.id === "account.mode.reset") {
        phase = "reset-request"
        status = null
        return
      }

      if (action.id === "account.login") {
        const password = stringValue(action, "account.password")
        if (!requireEmail(email) || !requirePassword(password, "密码")) return
        status = null
        try {
          await authClient.login(email, password)
          const user = await authClient.getCurrentUser()
          accountEmail = user?.email ?? email
          phase = "signed-in"
        } catch (error) {
          fail(messageFor(error, "登录失败，请稍后重试"))
        }
        return
      }

      if (action.id === "account.register") {
        const password = stringValue(action, "account.password")
        const confirmation = stringValue(action, "account.confirm-password")
        if (!requireEmail(email) || !requirePassword(password, "密码", MIN_PASSWORD)) return
        if (password !== confirmation) {
          fail("两次输入的密码不一致")
          return
        }
        status = null
        try {
          await authClient.register(email, password)
          await authClient.login(email, password)
          const user = await authClient.getCurrentUser()
          accountEmail = user?.email ?? email
          phase = "signed-in"
        } catch (error) {
          fail(messageFor(error, "注册失败，请稍后重试"))
        }
        return
      }

      if (action.id === "account.request-reset") {
        if (!requireEmail(email)) return
        status = null
        try {
          await authClient.requestPasswordReset(email)
          phase = "reset-verify"
          status = { text: "重置链接已发送，请查收邮箱", tone: "success" }
        } catch (error) {
          fail(messageFor(error, "重置链接发送失败"))
        }
        return
      }

      if (action.id === "account.reset-password") {
        const code = stringValue(action, "account.reset-code").trim()
        const password = stringValue(action, "account.new-password")
        const confirmation = stringValue(action, "account.confirm-new-password")
        if (!code) {
          fail("请输入重置码")
          return
        }
        if (!requirePassword(password, "新密码", MIN_PASSWORD)) return
        if (password !== confirmation) {
          fail("两次输入的新密码不一致")
          return
        }
        status = null
        try {
          await authClient.resetPassword(code, password)
          phase = "login"
          status = { text: "密码已重置，请使用新密码登录", tone: "success" }
        } catch (error) {
          fail(messageFor(error, "密码重置失败"))
        }
        return
      }

      if (action.id === "account.logout") {
        status = null
        try {
          await authClient.logout()
          accountEmail = ""
          phase = "login"
          status = { text: "已退出登录", tone: "success" }
        } catch (error) {
          fail(messageFor(error, "退出登录失败"))
        }
        return
      }

      throw new Error(`未知账号设置操作：${action.id}`)
    },
  }
}

function formatSyncTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}`
}

export function createSyncSettingsProvider(
  syncManager: Pick<SyncManager, "triggerSync">,
  syncMetaRepo: AccountSyncService["syncMetaRepo"],
): SettingsPanelProvider {
  let status: ProviderStatus | null = null

  return {
    async getModel() {
      const lastSyncAt = (await syncMetaRepo.get("lastSyncAt")) ?? null
      return {
        version: 1,
        ariaLabel: "Tabora 数据同步",
        nodes: [
          {
            type: "group",
            title: "同步状态",
            description: "登录后才会将本地工作台数据同步到官方服务。",
            children: [
              { type: "status", label: "模式", value: "官方云同步", tone: "accent" },
              {
                type: "status",
                label: "上次同步",
                value: lastSyncAt ? formatSyncTime(lastSyncAt) : "尚未同步",
                tone: lastSyncAt ? "success" : "neutral",
              },
              ...statusNode(status),
              {
                type: "actions",
                actions: [{ id: "sync.now", label: "立即同步", variant: "primary" }],
              },
            ],
          },
        ],
      } satisfies SettingsPanelModel
    },
    async dispatch(action) {
      if (action.id !== "sync.now") throw new Error(`未知同步设置操作：${action.id}`)
      status = null
      try {
        await syncManager.triggerSync()
        const completedAt = new Date().toISOString()
        await syncMetaRepo.set("lastSyncAt", completedAt)
        status = { text: "已同步", tone: "success" }
      } catch (error) {
        status = { text: messageFor(error, "同步失败，请稍后重试"), tone: "danger" }
      }
    },
  }
}

export function createOfficialAccountSyncPlugin(options: AccountSyncPluginOptions): PluginModule {
  const { authClient, syncManager, syncMetaRepo } = options.service
  const accountProvider = createAccountSettingsProvider(authClient)
  const syncProvider = createSyncSettingsProvider(syncManager, syncMetaRepo)

  return {
    manifest: officialAccountSyncManifest,
    activate(context) {
      context.settings.register(officialAccountSettingsProviderId, accountProvider)
      context.settings.register(officialSyncSettingsProviderId, syncProvider)
      syncManager.start()
      return () => syncManager.stop()
    },
  }
}
