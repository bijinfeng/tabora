import * as stylex from "@stylexjs/stylex"
import { Button, Input, Tabs } from "@tabora/ui"
import { CircleCheck, RotateCcw } from "lucide-solid"
import { createSignal, onMount, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { styles } from "./styles"

type AccountPhase =
  | "loading"
  | "login"
  | "register"
  | "reset-request"
  | "reset-verify"
  | "signed-in"
type AuthMode = "login" | "register"

const MIN_PASSWORD = 8

export function AccountSettingsPanel(props: SettingsPanelViewProps) {
  const auth = () => props.host.auth
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [code, setCode] = createSignal("")
  const [newPassword, setNewPassword] = createSignal("")
  const [confirmNewPassword, setConfirmNewPassword] = createSignal("")
  const [phase, setPhase] = createSignal<AccountPhase>("loading")
  const [accountEmail, setAccountEmail] = createSignal("")
  const [status, setStatus] = createSignal("")
  const [busy, setBusy] = createSignal(false)

  const accountNavigation = (accountEmail: string) => ({
    name: accountEmail,
    meta: props.locale === "en-US" ? "Signed in" : "已登录",
    avatar: accountEmail.trim().slice(0, 1).toUpperCase() || "?",
  })
  const reportSignedIn = (accountEmail: string) =>
    props.host.updateAccountNavigation?.(accountNavigation(accountEmail))
  const reportSignedOut = () =>
    props.host.updateAccountNavigation?.({
      name: props.locale === "en-US" ? "Signed out" : "未登录",
      meta: props.locale === "en-US" ? "Local mode" : "本地模式",
      avatar: props.locale === "en-US" ? "?" : "未",
    })

  onMount(async () => {
    const client = auth()
    if (!client) {
      setPhase("login")
      return
    }

    try {
      const session = await client.getSession()
      if (session) {
        const user = await client.getCurrentUser()
        if (user) {
          const signedInEmail = user.email ?? ""
          setAccountEmail(signedInEmail)
          reportSignedIn(signedInEmail)
          setPhase("signed-in")
          return
        }
      }
    } catch {
      // 会话恢复失败时保留本地工作台，并回到登录入口。
    }
    setPhase("login")
  })

  function messageFor(error: unknown): string {
    const message = (error as { message?: string })?.message
    const code = (error as { code?: string })?.code
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

  function validEmail(): boolean {
    if (email().trim()) return true
    setStatus("请输入邮箱")
    return false
  }

  function validPassword(value: string, label: string): boolean {
    if (!value) {
      setStatus(`请输入${label}`)
      return false
    }
    if (value.length < MIN_PASSWORD) {
      setStatus(`${label}至少 ${MIN_PASSWORD} 位`)
      return false
    }
    return true
  }

  function handleLogin() {
    if (!validEmail() || !password()) {
      if (!password()) setStatus("请输入密码")
      return
    }
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.login(email().trim(), password())
      const user = await client.getCurrentUser()
      const signedInEmail = user?.email ?? email().trim()
      setAccountEmail(signedInEmail)
      reportSignedIn(signedInEmail)
      setPassword("")
      setPhase("signed-in")
    })
  }

  function handleRegister() {
    if (!validEmail() || !validPassword(password(), "密码")) return
    if (password() !== confirmPassword()) {
      setStatus("两次输入的密码不一致")
      return
    }
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.register(email().trim(), password())
      await client.login(email().trim(), password())
      const user = await client.getCurrentUser()
      const signedInEmail = user?.email ?? email().trim()
      setAccountEmail(signedInEmail)
      reportSignedIn(signedInEmail)
      setPassword("")
      setConfirmPassword("")
      setPhase("signed-in")
    })
  }

  function handleSendResetLink() {
    if (!validEmail()) return
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.requestPasswordReset(email().trim())
      setPhase("reset-verify")
      setStatus("重置链接已发送，请查收邮箱")
    })
  }

  function handleResetPassword() {
    if (!code().trim()) {
      setStatus("请输入重置码")
      return
    }
    if (!validPassword(newPassword(), "新密码")) return
    if (newPassword() !== confirmNewPassword()) {
      setStatus("两次输入的新密码不一致")
      return
    }
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.resetPassword(code().trim(), newPassword())
      setCode("")
      setNewPassword("")
      setConfirmNewPassword("")
      setPassword("")
      setPhase("login")
      setStatus("密码已重置，请使用新密码登录")
    })
  }

  function handleLogout() {
    const client = auth()
    if (!client) return
    void run(async () => {
      await client.logout()
      setAccountEmail("")
      reportSignedOut()
      setPassword("")
      setConfirmPassword("")
      setPhase("login")
      setStatus("已退出登录")
    })
  }

  function selectAuthMode(mode: AuthMode) {
    setStatus("")
    setConfirmPassword("")
    setPhase(mode)
  }

  const authMode = (): AuthMode => (phase() === "register" ? "register" : "login")
  const authNote = () =>
    authMode() === "register" ? "注册后登录，并注册当前设备。" : "登录后注册设备，同步前不上传数据"

  return (
    <section
      {...stylex.attrs(styles.accountPanel)}
      data-account-state={phase()}
      data-settings-panel="account"
      aria-label="官方账号登录注册"
    >
      <Show
        when={auth()}
        fallback={<p {...stylex.attrs(styles.authStatus)}>未配置同步服务，当前为本地模式</p>}
      >
        <Show
          when={phase() !== "loading"}
          fallback={<p {...stylex.attrs(styles.authStatus)}>正在恢复登录状态…</p>}
        >
          <Show when={phase() === "signed-in"}>
            <div {...stylex.attrs(styles.authForm)} data-account-signed-in>
              <div {...stylex.attrs(styles.authFieldsShell)}>
                <div {...stylex.attrs(styles.accountStateRow)}>
                  <span>账号</span>
                  <strong>{accountEmail()}</strong>
                </div>
                <div {...stylex.attrs(styles.accountStateRow)}>
                  <span>状态</span>
                  <strong {...stylex.attrs(styles.accountStateActive)}>
                    <CircleCheck size={14} aria-hidden="true" /> 已登录
                  </strong>
                </div>
              </div>
              <div {...stylex.attrs(styles.authActionRow)}>
                <p {...stylex.attrs(styles.authNote)}>
                  账号会话已保存到当前设备，可在数据同步中管理同步状态。
                </p>
                <Button
                  fullWidth
                  size="sm"
                  variant="secondary"
                  disabled={busy()}
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </div>
            </div>
          </Show>

          <Show when={phase() === "login" || phase() === "register"}>
            <div {...stylex.attrs(styles.authForm)} data-account-auth-form>
              <Tabs
                value={authMode()}
                onChange={(value) => selectAuthMode(value === "register" ? "register" : "login")}
                variant="pills"
                size="sm"
                listXstyle={styles.authTabsList}
                triggerXstyle={styles.authTabsTrigger}
                triggerSelectedXstyle={styles.authTabsSelected}
                aria-label="账号操作"
                tabs={[
                  { value: "login", label: "登录", content: <></> },
                  { value: "register", label: "注册", content: <></> },
                ]}
              />
              <div {...stylex.attrs(styles.authFieldsShell)}>
                <label {...stylex.attrs(styles.authField)}>
                  <span>邮箱</span>
                  <Input
                    size="sm"
                    type="email"
                    value={email()}
                    onInput={setEmail}
                    autocomplete="email"
                    placeholder="name@example.com"
                    aria-label="官方账号邮箱"
                    controlXstyle={styles.authInputControl}
                  />
                </label>
                <label {...stylex.attrs(styles.authField)}>
                  <span>密码</span>
                  <Input
                    size="sm"
                    type="password"
                    value={password()}
                    onInput={setPassword}
                    autocomplete={authMode() === "register" ? "new-password" : "current-password"}
                    placeholder={`至少 ${MIN_PASSWORD} 位`}
                    aria-label="官方账号密码"
                    controlXstyle={styles.authInputControl}
                    passwordVisibilityToggle={false}
                  />
                </label>
                <Show when={authMode() === "register"}>
                  <label {...stylex.attrs(styles.authField)}>
                    <span>确认密码</span>
                    <Input
                      size="sm"
                      type="password"
                      value={confirmPassword()}
                      onInput={setConfirmPassword}
                      autocomplete="new-password"
                      placeholder="再次输入密码"
                      aria-label="确认官方账号密码"
                      controlXstyle={styles.authInputControl}
                      passwordVisibilityToggle={false}
                    />
                  </label>
                </Show>
              </div>
              <div {...stylex.attrs(styles.authActionRow)}>
                <div {...stylex.attrs(styles.authHelperRow)}>
                  <p {...stylex.attrs(styles.authNote)}>{authNote()}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy()}
                    data-account-forgot
                    onClick={() => {
                      setStatus("")
                      setPhase("reset-request")
                    }}
                  >
                    忘记密码？
                  </Button>
                </div>
                <Button
                  fullWidth
                  size="sm"
                  variant="primary"
                  disabled={busy()}
                  data-account-submit
                  onClick={authMode() === "register" ? handleRegister : handleLogin}
                >
                  {busy()
                    ? "正在处理…"
                    : authMode() === "register"
                      ? "注册并登录"
                      : "登录并注册设备"}
                </Button>
              </div>
            </div>
          </Show>

          <Show when={phase() === "reset-request"}>
            <div {...stylex.attrs(styles.authForm)} data-account-reset-request>
              <div {...stylex.attrs(styles.authFieldsShell)}>
                <label {...stylex.attrs(styles.authField)}>
                  <span>邮箱</span>
                  <Input
                    size="sm"
                    type="email"
                    value={email()}
                    onInput={setEmail}
                    autocomplete="email"
                    placeholder="name@example.com"
                    aria-label="重置账号邮箱"
                    controlXstyle={styles.authInputControl}
                  />
                </label>
              </div>
              <div {...stylex.attrs(styles.authActionRow)}>
                <div {...stylex.attrs(styles.authHelperRow)}>
                  <p {...stylex.attrs(styles.authNote)}>发送重置链接，不登录不上传数据</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy()}
                    onClick={() => {
                      setStatus("")
                      setPhase("login")
                    }}
                  >
                    返回登录
                  </Button>
                </div>
                <Button
                  fullWidth
                  size="sm"
                  variant="primary"
                  disabled={busy()}
                  data-account-submit
                  onClick={handleSendResetLink}
                >
                  {busy() ? "正在发送…" : "发送重置链接"}
                </Button>
              </div>
            </div>
          </Show>

          <Show when={phase() === "reset-verify"}>
            <div {...stylex.attrs(styles.authForm)} data-account-reset-verify>
              <div {...stylex.attrs(styles.authFlowHeading)}>
                <RotateCcw size={16} aria-hidden="true" />
                <div>
                  <strong {...stylex.attrs(styles.authFlowHeadingCopy)}>设置新密码</strong>
                  <p {...stylex.attrs(styles.authFlowHint)}>
                    请粘贴重置链接中的 code，并设置新的登录密码。
                  </p>
                </div>
              </div>
              <div {...stylex.attrs(styles.authFieldsShell)}>
                <label {...stylex.attrs(styles.authField)}>
                  <span>重置码</span>
                  <Input
                    size="sm"
                    value={code()}
                    onInput={setCode}
                    autocomplete="one-time-code"
                    placeholder="粘贴 code"
                    aria-label="重置验证码"
                    controlXstyle={styles.authInputControl}
                  />
                </label>
                <label {...stylex.attrs(styles.authField)}>
                  <span>新密码</span>
                  <Input
                    size="sm"
                    type="password"
                    value={newPassword()}
                    onInput={setNewPassword}
                    autocomplete="new-password"
                    placeholder={`至少 ${MIN_PASSWORD} 位`}
                    aria-label="新密码"
                    controlXstyle={styles.authInputControl}
                    passwordVisibilityToggle={false}
                  />
                </label>
                <label {...stylex.attrs(styles.authField)}>
                  <span>确认新密码</span>
                  <Input
                    size="sm"
                    type="password"
                    value={confirmNewPassword()}
                    onInput={setConfirmNewPassword}
                    autocomplete="new-password"
                    placeholder="再次输入新密码"
                    aria-label="确认新密码"
                    controlXstyle={styles.authInputControl}
                    passwordVisibilityToggle={false}
                  />
                </label>
              </div>
              <div {...stylex.attrs(styles.authActionRow)}>
                <Button
                  fullWidth
                  size="sm"
                  variant="primary"
                  disabled={busy()}
                  data-account-submit
                  onClick={handleResetPassword}
                >
                  {busy() ? "正在重置…" : "重置密码"}
                </Button>
                <Button
                  fullWidth
                  size="sm"
                  variant="ghost"
                  disabled={busy()}
                  onClick={() => {
                    setStatus("")
                    setPhase("login")
                  }}
                >
                  返回登录
                </Button>
              </div>
            </div>
          </Show>

          <Show when={status()}>
            <p {...stylex.attrs(styles.authStatus)} role="status" aria-live="polite">
              {status()}
            </p>
          </Show>
        </Show>
      </Show>
    </section>
  )
}
