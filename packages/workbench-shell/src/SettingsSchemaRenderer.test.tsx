import { render } from "solid-js/web"
import type { SettingsPanelProvider, SettingsPanelProviderContext } from "@tabora/plugin-api"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SettingsSchemaRenderer } from "./settingsSchema"

const mounts: Array<{ dispose: () => void; root: HTMLElement }> = []

afterEach(() => {
  for (const { dispose, root } of mounts.splice(0)) {
    dispose()
    root.remove()
  }
})

function mount(
  provider: SettingsPanelProvider,
  context: SettingsPanelProviderContext = { surface: "desktop" },
): HTMLElement {
  const root = document.createElement("div")
  document.body.append(root)
  const dispose = render(
    () => <SettingsSchemaRenderer provider={provider} context={context} />,
    root,
  )
  mounts.push({ dispose, root })
  return root
}

function input(root: HTMLElement, fieldId: string): HTMLInputElement {
  return root.querySelector<HTMLInputElement>(`[data-settings-schema-field="${fieldId}"]`)!
}

describe("SettingsSchemaRenderer", () => {
  it("renders semantic controls with shared UI and dispatches their in-memory values", async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined)
    const provider: SettingsPanelProvider = {
      getModel: vi.fn().mockResolvedValue({
        version: 1,
        ariaLabel: "Account settings",
        nodes: [
          {
            type: "group",
            title: "Account",
            children: [
              {
                type: "field",
                id: "email",
                label: "Email",
                control: "email",
                value: "initial@test.com",
              },
              {
                type: "field",
                id: "password",
                label: "Password",
                control: "password",
                persistence: "ephemeral",
              },
              { type: "status", label: "State", value: "Ready", tone: "success" },
              {
                type: "row",
                label: "Sync scope",
                description: "Workspace and plugin data",
                meta: "V1",
                metaVariant: "badge",
                action: { id: "sync.scope", label: "Details", disabled: true },
              },
              {
                type: "field",
                id: "sync.auto",
                label: "Background sync",
                control: "switch",
                value: false,
              },
              {
                type: "actions",
                actions: [{ id: "account.login", label: "Login", variant: "primary" }],
              },
            ],
          },
        ],
      }),
      dispatch,
    }
    const root = mount(provider)

    await vi.waitFor(() => expect(root.textContent).toContain("Account"))
    expect(root.querySelector('[data-settings-schema-status="success"]')).toBeTruthy()
    expect(root.querySelector('[data-settings-schema-row="Sync scope"]')).toBeTruthy()
    expect(root.querySelector('[data-settings-schema-field-row="sync.auto"]')).toBeTruthy()
    expect(
      root.querySelector<HTMLButtonElement>('[data-settings-schema-action="sync.scope"]')?.disabled,
    ).toBe(true)

    const email = input(root, "email")
    const password = input(root, "password")
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "secret-password"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    root.querySelector<HTMLButtonElement>('[data-settings-schema-action="account.login"]')!.click()

    await vi.waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        {
          id: "account.login",
          values: { email: "a@test.com", password: "secret-password", "sync.auto": false },
        },
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          invalidate: expect.any(Function),
        }),
      ),
    )
    await vi.waitFor(() => expect(input(root, "password").value).toBe(""))
  })

  it("contains malformed plugin models as a local renderer error", async () => {
    const provider = {
      getModel: vi.fn().mockResolvedValue({
        version: 1,
        nodes: [{ type: "text", text: "Unsafe", style: { color: "red" } }],
      }),
      dispatch: vi.fn(),
    } as unknown as SettingsPanelProvider
    const root = mount(provider)

    await vi.waitFor(() => expect(root.textContent).toContain("设置插件返回了不受支持的页面模型"))
    expect(root.querySelector('[role="alert"]')).toBeTruthy()
    expect(root.textContent).not.toContain("Unsafe")
  })

  it("renders the account layout contract with inline fields and form actions", async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined)
    const onNavigationChange = vi.fn()
    const provider: SettingsPanelProvider = {
      getModel: vi.fn().mockResolvedValue({
        version: 1,
        layout: "account",
        navigation: { title: "未登录", meta: "本地模式", avatar: "未" },
        nodes: [
          {
            type: "actions",
            layout: "segmented",
            actions: [
              { id: "account.mode.login", label: "登录", pressed: true },
              { id: "account.mode.register", label: "注册", pressed: false },
            ],
          },
          {
            type: "group",
            children: [
              { type: "field", id: "email", label: "邮箱", control: "email" },
              {
                type: "field",
                id: "password",
                label: "密码",
                control: "password",
                persistence: "ephemeral",
              },
              {
                type: "actions",
                layout: "form",
                description: "登录后注册设备，同步前不上传数据",
                actions: [
                  { id: "account.login", label: "登录并注册设备", variant: "primary" },
                  { id: "account.mode.reset", label: "忘记密码？", variant: "link" },
                ],
              },
            ],
          },
        ],
      }),
      dispatch,
    }
    const root = document.createElement("div")
    document.body.append(root)
    const dispose = render(
      () => (
        <SettingsSchemaRenderer
          provider={provider}
          context={{ surface: "desktop" }}
          onNavigationChange={onNavigationChange}
        />
      ),
      root,
    )
    mounts.push({ dispose, root })

    await vi.waitFor(() =>
      expect(root.querySelector('[data-settings-schema-layout="account"]')).toBeTruthy(),
    )
    expect(root.querySelector('[data-settings-schema-actions="segmented"]')).toBeTruthy()
    expect(root.querySelector('[data-settings-schema-actions="form"]')).toBeTruthy()
    expect(
      root.querySelector('[data-settings-schema-field="email"]')?.closest('[data-layout="inline"]')
        ?.textContent,
    ).toContain("邮箱")
    expect(
      root.querySelector<HTMLButtonElement>('[data-settings-schema-action="account.login"]')
        ?.dataset.fullwidth,
    ).toBe("")
    expect(root.querySelector<HTMLButtonElement>("[data-pressed]")?.textContent).toContain("登录")
    expect(root.querySelector('[data-settings-schema-actions="segmented"] button')).toBeTruthy()
    expect(
      root.querySelector<HTMLButtonElement>('[data-settings-schema-action="account.mode.reset"]')
        ?.dataset.variant,
    ).toBe("link")
    root
      .querySelector<HTMLButtonElement>(
        '[data-settings-schema-actions="segmented"] button:last-child',
      )!
      .click()
    await vi.waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        { id: "account.mode.register", values: { email: "", password: "" } },
        expect.anything(),
      ),
    )
    expect(onNavigationChange).toHaveBeenCalledWith({
      title: "未登录",
      meta: "本地模式",
      avatar: "未",
    })
  })

  it("aborts a schema provider context when its panel is unmounted", async () => {
    let receivedContext: SettingsPanelProviderContext | undefined
    const provider: SettingsPanelProvider = {
      getModel: vi.fn((context) => {
        receivedContext = context
        return { version: 1 as const, nodes: [] }
      }),
      dispatch: vi.fn(),
    }
    const root = mount(provider)

    await vi.waitFor(() => expect(receivedContext?.signal).toBeDefined())
    const mounted = mounts.find((entry) => entry.root === root)!
    mounted.dispose()

    expect(receivedContext?.signal?.aborted).toBe(true)
  })
})
