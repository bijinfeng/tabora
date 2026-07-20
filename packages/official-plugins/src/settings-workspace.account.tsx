import { Button, Input } from "@tabora/ui"
import { createSignal, onMount, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { styles, sx } from "./styles"

type AccountPhase = "loading" | "signed-out" | "reset-request" | "reset-verify" | "signed-in"

const MIN_PASSWORD = 8

export function AccountSettingsPanel(props: SettingsPanelViewProps) {
  const auth = () => props.host.auth
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [code, setCode] = createSignal("")
  const [newPassword, setNewPassword] = createSignal("")
  const [phase, setPhase] = createSignal<AccountPhase>("loading")
  const [accountEmail, setAccountEmail] = createSignal("")
  const [status, setStatus] = createSignal("")
  const [busy, setBusy] = createSignal(false)

  onMount(async () => {
    const client = auth()
    if (!client) {
      setPhase("signed-out")
      return
    }
    try {
      const session = await client.getSession()
      if (session) {
        const user = await client.getCurrentUser()
        setAccountEmail(user?.email ?? "")
        setPhase("signed-in")
        return
      }
    } catch {
      // 恢复失败按未登录处理
    }
    setPhase("signed-out")
  })

  function messageFor(error: unknown): string {
    const code = (error as { code?: string })?.code
    const message = (error as { message?: string })?.message
    return message ?? (code ? String(code) : "操作失败，请稍后重试")
  }

  async function run(action: () => Promise<void>) {
    if (busy()) return
    setBusy(true)
    setStatus("")
    try {
      await action()
    } catch (error) {
      setStatus(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  function validCredentials(requireLength: boolean): boolean {
    if (!email().trim()) {
      setStatus("请输入邮箱")
      return false
    }
    if (!password()) {
      setStatus("请输入密码")
      return false
    }
    if (requireLength && password().length < MIN_PASSWORD) {
      setStatus(`密码至少 ${MIN_PASSWORD} 位`)
      return false
    }
    return true
  }

  function handleLogin() {
    if (!validCredentials(false)) return
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.login(email().trim(), password())
      const user = await client.getCurrentUser()
      setAccountEmail(user?.email ?? email().trim())
      setPassword("")
      setPhase("signed-in")
    })
  }

  function handleRegister() {
    if (!validCredentials(true)) return
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.register(email().trim(), password())
      await client.login(email().trim(), password())
      const user = await client.getCurrentUser()
      setAccountEmail(user?.email ?? email().trim())
      setPassword("")
      setPhase("signed-in")
    })
  }

  function handleSendResetCode() {
    if (!email().trim()) {
      setStatus("请输入邮箱")
      return
    }
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.requestPasswordReset(email().trim())
      setPhase("reset-verify")
      setStatus("验证码已发送到邮箱")
    })
  }

  function handleResetPassword() {
    if (!code().trim()) {
      setStatus("请输入验证码")
      return
    }
    if (newPassword().length < MIN_PASSWORD) {
      setStatus(`新密码至少 ${MIN_PASSWORD} 位`)
      return
    }
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.resetPassword(code().trim(), newPassword())
      setCode("")
      setNewPassword("")
      setPhase("signed-out")
      setStatus("密码已重置，请登录")
    })
  }

  function handleLogout() {
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.logout()
      setAccountEmail("")
      setPassword("")
      setPhase("signed-out")
      setStatus("已退出登录")
    })
  }

  return (
    <section
      {...sx(styles.accountPanel)}
      data-account-state={phase()}
      data-settings-panel="account"
      aria-label="官方账号登录注册"
    >
      <Show
        when={auth()}
        fallback={<p {...sx(styles.authStatus)}>未配置同步服务，当前为本地模式</p>}
      >
        <Show
          when={phase() !== "loading"}
          fallback={<p {...sx(styles.authStatus)}>正在恢复登录状态…</p>}
        >
          <Show when={phase() === "signed-in"}>
            <div {...sx(styles.profileCard)}>
              <div {...sx(styles.profileInfo)}>
                <div {...sx(styles.avatar)}>
                  <span {...sx(styles.avatarInitial)}>
                    {accountEmail().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div {...sx(styles.profileDetails)}>
                  <div {...sx(styles.profileEmail)}>{accountEmail()}</div>
                  <div {...sx(styles.profileStatus)}>
                    <span {...sx(styles.statusDot)}></span>
                    已登录
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={handleLogout} disabled={busy()}>
                退出
              </Button>
            </div>
          </Show>

          <Show when={phase() === "signed-out"}>
            <div {...sx(styles.authForm)}>
              <label {...sx(styles.authField)}>
                <span>邮箱</span>
                <Input
                  size="sm"
                  type="email"
                  value={email()}
                  onInput={setEmail}
                  placeholder="name@example.com"
                  aria-label="账号邮箱"
                />
              </label>
              <label {...sx(styles.authField)}>
                <span>密码</span>
                <Input
                  size="sm"
                  type="password"
                  value={password()}
                  onInput={setPassword}
                  placeholder={`至少 ${MIN_PASSWORD} 位`}
                  aria-label="账号密码"
                />
              </label>
              <div {...sx(styles.accountActions)}>
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleLogin}>
                  登录
                </Button>
                <Button size="sm" variant="secondary" disabled={busy()} onClick={handleRegister}>
                  注册
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy()}
                onClick={() => {
                  setStatus("")
                  setPhase("reset-request")
                }}
              >
                忘记密码?
              </Button>
              <span {...sx(styles.authStatus)}>{status()}</span>
            </div>
          </Show>

          <Show when={phase() === "reset-request"}>
            <div {...sx(styles.authForm)}>
              <label {...sx(styles.authField)}>
                <span>邮箱</span>
                <Input
                  size="sm"
                  type="email"
                  value={email()}
                  onInput={setEmail}
                  placeholder="name@example.com"
                  aria-label="重置账号邮箱"
                />
              </label>
              <div {...sx(styles.accountActions)}>
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleSendResetCode}>
                  发送验证码
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy()}
                  onClick={() => {
                    setStatus("")
                    setPhase("signed-out")
                  }}
                >
                  返回
                </Button>
              </div>
              <span {...sx(styles.authStatus)}>{status()}</span>
            </div>
          </Show>

          <Show when={phase() === "reset-verify"}>
            <div {...sx(styles.authForm)}>
              <label {...sx(styles.authField)}>
                <span>验证码</span>
                <Input
                  size="sm"
                  value={code()}
                  onInput={setCode}
                  placeholder="邮箱验证码"
                  aria-label="重置验证码"
                />
              </label>
              <label {...sx(styles.authField)}>
                <span>新密码</span>
                <Input
                  size="sm"
                  type="password"
                  value={newPassword()}
                  onInput={setNewPassword}
                  placeholder={`至少 ${MIN_PASSWORD} 位`}
                  aria-label="新密码"
                />
              </label>
              <div {...sx(styles.accountActions)}>
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleResetPassword}>
                  重置密码
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy()}
                  onClick={() => {
                    setStatus("")
                    setPhase("signed-out")
                  }}
                >
                  返回
                </Button>
              </div>
              <span {...sx(styles.authStatus)}>{status()}</span>
            </div>
          </Show>
        </Show>
      </Show>
    </section>
  )
}
