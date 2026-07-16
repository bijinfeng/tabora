import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { AccountSettingsPanel } from "./settings-workspace.account"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

function mountPanel(hostAuth?: SettingsPanelViewProps["host"]["auth"]) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const props = {
    panelId: "p",
    pluginId: "official.settings.workspace",
    scope: "workspace",
    host: { close: vi.fn(), setDirty: vi.fn(), auth: hostAuth },
    workspace: {} as never,
    layouts: [],
    themes: [],
    backgrounds: [],
    searchProviders: [],
    searchSettings: {} as never,
    plugins: [],
  } as unknown as SettingsPanelViewProps
  const dispose = render(() => <AccountSettingsPanel {...props} />, root)
  return { root, dispose }
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("AccountSettingsPanel", () => {
  it("shows local-mode notice when host.auth is undefined", async () => {
    const { root } = mountPanel(undefined)
    await flush()
    expect(root.textContent).toContain("未配置同步服务")
  })

  it("restores signed-in state when a session exists", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({ userId: "u1", sessionId: "s1" }),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    expect(root.textContent).toContain("a@test.com")
  })

  it("calls login with entered credentials", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "pw12345678"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    const loginBtn = Array.from(root.querySelectorAll("button")).find(
      (b) => b.textContent === "登录",
    )!
    loginBtn.click()
    await flush()
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("registers then auto-logs in", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "pw12345678"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    const registerBtn = Array.from(root.querySelectorAll("button")).find(
      (b) => b.textContent === "注册",
    )!
    registerBtn.click()
    await flush()
    expect(auth.register).toHaveBeenCalledWith("a@test.com", "pw12345678")
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("shows credential error message on login failure", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn().mockRejectedValue({ code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" }),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "wrong123"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    Array.from(root.querySelectorAll("button"))
      .find((b) => b.textContent === "登录")!
      .click()
    await flush()
    expect(root.textContent).toContain("邮箱或密码错误")
  })
})
