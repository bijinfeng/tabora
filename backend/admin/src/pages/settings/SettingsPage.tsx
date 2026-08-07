import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { Switch } from "@tabora/ui/switch"
import { createResource, createSignal, Show, type JSX } from "solid-js"

import { fetchSettings, saveSettings, type SettingsView } from "./settingsApi"
import { styles } from "./settings.styles"

function Section(props: { title: string; desc?: string; children: JSX.Element }) {
  return (
    <section {...stylex.attrs(styles.section)}>
      <h2 {...stylex.attrs(styles.sectionTitle)}>{props.title}</h2>
      <Show when={props.desc}>
        <p {...stylex.attrs(styles.sectionDesc)}>{props.desc}</p>
      </Show>
      {props.children}
    </section>
  )
}

export function SettingsPage() {
  const [loaded] = createResource(fetchSettings)
  const [form, setForm] = createSignal<SettingsView | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [saved, setSaved] = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  // resource 到达后初始化表单一次
  const model = () => {
    const data = loaded()
    if (data && !form()) setForm(data)
    return form()
  }

  function patch<K extends keyof SettingsView>(key: K, value: SettingsView[K]) {
    const current = form()
    if (!current) return
    setForm({ ...current, [key]: value })
    setSaved(false)
  }

  async function handleSave() {
    const current = form()
    if (!current || saving()) return
    setSaving(true)
    setError(null)
    try {
      await saveSettings(current)
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div {...stylex.attrs(styles.page)}>
      <Show when={loaded.error}>
        <InlineError>{(loaded.error as Error)?.message ?? "加载失败"}</InlineError>
      </Show>
      <Show when={model()}>{(m) => <SettingsForm model={m()} patch={patch} />}</Show>
      <Show when={form()}>
        <div {...stylex.attrs(styles.saveBar)}>
          <Show when={error()}>
            <InlineError>{error()}</InlineError>
          </Show>
          <Show when={saved()}>
            <span {...stylex.attrs(styles.savedHint)}>已保存</span>
          </Show>
          <Button variant="primary" loading={saving()} onClick={handleSave}>
            保存设置
          </Button>
        </div>
      </Show>
    </div>
  )
}

function SettingsForm(props: {
  model: SettingsView
  patch: <K extends keyof SettingsView>(key: K, value: SettingsView[K]) => void
}) {
  const m = props.model
  return (
    <>
      <Section title="注册与账号策略" desc="控制公开注册与新用户默认角色。">
        <div {...stylex.attrs(styles.row)}>
          <div>
            <div {...stylex.attrs(styles.rowLabel)}>开放公开注册</div>
            <div {...stylex.attrs(styles.rowHelp)}>关闭后仅管理员可创建账号</div>
          </div>
          <Switch
            checked={m.signupEnabled}
            onChange={(v) => props.patch("signupEnabled", v)}
            aria-label="开放公开注册"
          />
        </div>
        <Field label="默认角色" htmlFor="set-role">
          <Select
            value={m.defaultRole}
            onChange={(v) => props.patch("defaultRole", v)}
            options={[
              { value: "user", label: "普通用户" },
              { value: "admin", label: "管理员" },
            ]}
            aria-label="默认角色"
          />
        </Field>
        <div {...stylex.attrs(styles.row)}>
          <div {...stylex.attrs(styles.rowLabel)}>要求邮箱验证</div>
          <Switch
            checked={m.requireEmailVerification}
            onChange={(v) => props.patch("requireEmailVerification", v)}
            aria-label="要求邮箱验证"
          />
        </div>
      </Section>

      <Section title="附件全局默认" desc="未配置专属策略的实体沿用此默认。">
        <Field label="最大上传字节数" htmlFor="set-maxsize" helper="0 表示不限制">
          <Input
            id="set-maxsize"
            value={String(m.attachmentMaxSizeBytes)}
            onInput={(v) => props.patch("attachmentMaxSizeBytes", Number(v) || 0)}
            placeholder="例如 5242880"
          />
        </Field>
      </Section>

      <Section title="站点品牌信息">
        <Field label="站点名称" htmlFor="set-sitename">
          <Input id="set-sitename" value={m.siteName} onInput={(v) => props.patch("siteName", v)} />
        </Field>
        <Field label="联系邮箱" htmlFor="set-contact">
          <Input
            id="set-contact"
            type="email"
            value={m.contactEmail}
            onInput={(v) => props.patch("contactEmail", v)}
            placeholder="support@example.com"
          />
        </Field>
      </Section>

      <Section title="邮件 Provider" desc="用于密码重置邮件；密码字段留空表示不修改。">
        <Field label="SMTP 主机" htmlFor="set-smtphost">
          <Input id="set-smtphost" value={m.smtpHost} onInput={(v) => props.patch("smtpHost", v)} />
        </Field>
        <Field label="SMTP 端口" htmlFor="set-smtpport">
          <Input
            id="set-smtpport"
            value={String(m.smtpPort)}
            onInput={(v) => props.patch("smtpPort", Number(v) || 0)}
          />
        </Field>
        <Field label="发件人" htmlFor="set-smtpfrom">
          <Input id="set-smtpfrom" value={m.smtpFrom} onInput={(v) => props.patch("smtpFrom", v)} />
        </Field>
        <Field label="SMTP 用户名" htmlFor="set-smtpuser">
          <Input id="set-smtpuser" value={m.smtpUser} onInput={(v) => props.patch("smtpUser", v)} />
        </Field>
        <Field
          label="SMTP 密码"
          htmlFor="set-smtppass"
          helper={m.smtpPasswordConfigured ? "已配置，留空则不修改" : "尚未配置"}
        >
          <Input
            id="set-smtppass"
            type="password"
            value={m.smtpPassword}
            onInput={(v) => props.patch("smtpPassword", v)}
            placeholder="留空不修改"
          />
        </Field>
      </Section>
    </>
  )
}
