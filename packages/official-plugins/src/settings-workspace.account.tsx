import { Button, Input } from "@tabora/ui"
import { createSignal, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

type AccountPhase = "signed-out" | "code-sent" | "signed-in"

export function AccountSettingsPanel(_props: SettingsPanelViewProps) {
  const [email, setEmail] = createSignal("")
  const [code, setCode] = createSignal("")
  const [phase, setPhase] = createSignal<AccountPhase>("signed-out")
  const [statusNote, setStatusNote] = createSignal("未登录 · 本地模式")

  const signedIn = () => phase() === "signed-in"

  function handleSendCode() {
    if (!email().trim()) {
      setStatusNote("请输入官方账号邮箱")
      return
    }
    setPhase("code-sent")
    setStatusNote(`验证码已发送到 ${email().trim()}`)
  }

  function handleAuth() {
    if (!email().trim()) {
      setStatusNote("请输入官方账号邮箱")
      return
    }
    if (!code().trim()) {
      setStatusNote("请输入邮箱验证码")
      return
    }
    setPhase("signed-in")
    setStatusNote(`已登录 · ${email().trim()}`)
  }

  function handleLogout() {
    setPhase("signed-out")
    setCode("")
    setStatusNote("未登录 · 本地模式")
  }

  return (
    <section class="account-auth-panel" aria-label="官方账号登录注册">
      <div class="account-auth-form">
        <div class="auth-fields-shell">
          <label class="auth-field">
            <span>邮箱</span>
            <Input
              size="sm"
              type="email"
              value={email()}
              onInput={setEmail}
              placeholder="name@example.com"
              disabled={signedIn()}
              aria-label="官方账号邮箱"
            />
          </label>
          <label class="auth-field">
            <span>验证码</span>
            <div class="auth-code-row">
              <Input
                size="sm"
                value={code()}
                onInput={setCode}
                placeholder="6 位验证码"
                disabled={signedIn()}
                aria-label="邮箱验证码"
              />
              <Button size="sm" variant="secondary" disabled={signedIn()} onClick={handleSendCode}>
                发送验证码
              </Button>
            </div>
          </label>
        </div>
        <div class="auth-action-row">
          <span class="auth-note">新邮箱会自动注册</span>
          <div class="account-actions">
            <Button size="sm" variant="secondary" disabled={!signedIn()} onClick={handleLogout}>
              退出
            </Button>
            <Show
              when={!signedIn()}
              fallback={
                <Button size="sm" variant="primary" disabled>
                  已登录
                </Button>
              }
            >
              <Button size="sm" variant="primary" onClick={handleAuth}>
                登录 / 注册
              </Button>
            </Show>
          </div>
        </div>
        <span class="auth-status">{statusNote()}</span>
      </div>
    </section>
  )
}
