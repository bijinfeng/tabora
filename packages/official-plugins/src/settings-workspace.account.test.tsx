import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { AccountSettingsPanel } from "./settings-workspace.account"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

function mountPanel(
  hostAuth?: SettingsPanelViewProps["host"]["auth"],
  updateAccountNavigation = vi.fn(),
) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const props = {
    panelId: "p",
    pluginId: "official.settings.workspace",
    scope: "workspace",
    host: { close: vi.fn(), setDirty: vi.fn(), auth: hostAuth, updateAccountNavigation },
    workspace: {} as never,
    layouts: [],
    themes: [],
    backgrounds: [],
    searchProviders: [],
    searchSettings: {} as never,
    plugins: [],
  } as unknown as SettingsPanelViewProps
  const dispose = render(() => <AccountSettingsPanel {...props} />, root)
  return { root, dispose, updateAccountNavigation }
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
    const updateAccountNavigation = vi.fn()
    const { root } = mountPanel(auth, updateAccountNavigation)
    await flush()
    expect(root.textContent).toContain("a@test.com")
    expect(updateAccountNavigation).toHaveBeenCalledWith({
      name: "a@test.com",
      meta: "已登录",
      avatar: "A",
    })
    expect(root.querySelectorAll("button svg")).toHaveLength(0)
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
    const loginBtn = root.querySelector<HTMLButtonElement>("[data-account-submit]")!
    loginBtn.click()
    await flush()
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("uses the device-registration login copy from the account design", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()

    expect(root.textContent).toContain("登录后注册设备，同步前不上传数据")
    expect(root.querySelector<HTMLButtonElement>("[data-account-submit]")?.textContent).toContain(
      "登录并注册设备",
    )
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
    root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]?.click()
    const confirmation = root.querySelector<HTMLInputElement>('[aria-label="确认官方账号密码"]')!
    confirmation.value = "pw12345678"
    confirmation.dispatchEvent(new Event("input", { bubbles: true }))
    const registerBtn = root.querySelector<HTMLButtonElement>("[data-account-submit]")!
    registerBtn.click()
    await flush()
    expect(auth.register).toHaveBeenCalledWith("a@test.com", "pw12345678")
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("shows a confirmation password field for registration and blocks mismatched passwords", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()

    root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]?.click()
    expect(root.querySelector<HTMLInputElement>('[aria-label="确认官方账号密码"]')).toBeTruthy()

    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    const inputs = root.querySelectorAll<HTMLInputElement>('input[type="password"]')
    inputs[0]!.value = "pw12345678"
    inputs[0]!.dispatchEvent(new Event("input", { bubbles: true }))
    inputs[1]!.value = "different-password"
    inputs[1]!.dispatchEvent(new Event("input", { bubbles: true }))
    root.querySelector<HTMLButtonElement>("[data-account-submit]")!.click()
    await flush()

    expect(auth.register).not.toHaveBeenCalled()
    expect(root.textContent).toContain("两次输入的密码不一致")
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
    root.querySelector<HTMLButtonElement>("[data-account-submit]")!.click()
    await flush()
    expect(root.textContent).toContain("邮箱或密码错误")
  })

  it("sends reset code then shows verify step", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    root.querySelector<HTMLButtonElement>("[data-account-forgot]")!.click()
    await flush()
    expect(root.textContent).toContain("发送重置链接，不登录不上传数据")
    expect(root.querySelector("[data-account-reset-request] [data-account-submit] svg")).toBeNull()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    root.querySelector<HTMLButtonElement>("[data-account-submit]")!.click()
    await flush()
    expect(auth.requestPasswordReset).toHaveBeenCalledWith("a@test.com")
    expect(root.textContent).toContain("重置链接已发送")
  })

  it("resets password and returns to signed-out", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
    }
    const { root } = mountPanel(auth)
    await flush()
    root.querySelector<HTMLButtonElement>("[data-account-forgot]")!.click()
    await flush()
    const resetEmail = root.querySelector<HTMLInputElement>('input[type="email"]')!
    resetEmail.value = "a@test.com"
    resetEmail.dispatchEvent(new Event("input", { bubbles: true }))
    root.querySelector<HTMLButtonElement>("[data-account-submit]")!.click()
    await flush()
    const codeInput = root.querySelector<HTMLInputElement>('input[aria-label="重置验证码"]')!
    codeInput.value = "123456"
    codeInput.dispatchEvent(new Event("input", { bubbles: true }))
    const passwords = root.querySelectorAll<HTMLInputElement>('input[type="password"]')
    passwords[0]!.value = "pw12345678"
    passwords[0]!.dispatchEvent(new Event("input", { bubbles: true }))
    passwords[1]!.value = "pw12345678"
    passwords[1]!.dispatchEvent(new Event("input", { bubbles: true }))
    root.querySelector<HTMLButtonElement>("[data-account-submit]")!.click()
    await flush()
    expect(auth.resetPassword).toHaveBeenCalledWith("123456", "pw12345678")
    expect(root.textContent).toContain("密码已重置，请使用新密码登录")
  })
})
