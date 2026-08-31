import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { createSignal, onMount, Show } from "solid-js"
import type { SettingsAiSettings, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"

import { SettingsGroup } from "./settings-workspace.shared"
import { styles } from "./styles"

type ProviderMode = SettingsAiSettings["activeProvider"]

function fallback(): SettingsAiSettings {
  return {
    supportedProviders: ["builtin", "custom"],
    activeProvider: "builtin",
    builtin: { status: "unavailable", models: [], modelId: "" },
    custom: { baseUrl: "", model: "", apiKeyConfigured: false },
  }
}

function builtinStatusCopy(settings: SettingsAiSettings) {
  if (settings.builtin.status === "available") return "可用"
  if (settings.builtin.status === "auth-required") return "登录后可用"
  return "暂不可用"
}

export function AiSettingsPanel(props: SettingsPanelViewProps) {
  const [settings, setSettings] = createSignal<SettingsAiSettings | undefined>(props.data.ai)
  const [provider, setProvider] = createSignal<ProviderMode>("builtin")
  const [builtinModelId, setBuiltinModelId] = createSignal("")
  const [baseUrl, setBaseUrl] = createSignal("")
  const [model, setModel] = createSignal("")
  const [apiKey, setApiKey] = createSignal("")
  const [loading, setLoading] = createSignal(!props.data.ai)
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string>()

  const supportedProviders = () => settings()?.supportedProviders ?? ["builtin", "custom"]

  const defaultModelValue = () => (provider() === "custom" ? "custom" : builtinModelId())

  const defaultModelOptions = () => [
    ...(settings()?.builtin.models ?? []).map((item) => ({
      value: item.id,
      label: item.label,
      disabled: settings()?.builtin.status !== "available",
    })),
    ...(supportedProviders().includes("custom") ? [{ value: "custom", label: "自定义模型" }] : []),
  ]

  function pickDefaultModel(value: string) {
    if (value === "custom") {
      setProvider("custom")
      return
    }
    setProvider("builtin")
    setBuiltinModelId(value)
  }

  function applySettings(next: SettingsAiSettings) {
    setSettings(next)
    setProvider(next.activeProvider)
    setBuiltinModelId(next.builtin.modelId)
    setBaseUrl(next.custom.baseUrl)
    setModel(next.custom.model)
  }

  async function load() {
    if (!props.host.getAiSettings) {
      setError("当前宿主未提供 AI 设置服务")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      applySettings(await props.host.getAiSettings())
    } catch {
      setError("无法读取 AI 配置，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!props.host.saveAiSettings) {
      setError("当前宿主不允许修改 AI 配置")
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      const next = await props.host.saveAiSettings({
        activeProvider: provider(),
        builtinModelId: builtinModelId(),
        custom: {
          baseUrl: baseUrl(),
          model: model(),
          ...(apiKey().trim() ? { apiKey: apiKey().trim() } : {}),
        },
      })
      applySettings(next)
      setApiKey("")
    } catch {
      setError("无法保存 AI 配置，请检查地址和模型后重试")
    } finally {
      setSaving(false)
    }
  }

  onMount(load)

  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="ai">
      <SettingsGroup
        title="AI 服务"
        meta={loading() ? "加载中" : builtinStatusCopy(settings() ?? fallback())}
      >
        <Show
          when={!loading()}
          fallback={<span {...stylex.attrs(styles.fieldNote)}>正在读取当前设备的 AI 配置…</span>}
        >
          <Show when={supportedProviders().includes("builtin")}>
            <FieldRow
              label="默认模型"
              description={
                settings()?.builtin.status === "auth-required"
                  ? "登录 Tabora 账号后可使用平台统一付费凭据。"
                  : "内置模型使用 Tabora 平台凭据；自定义模型仅保存到当前设备。"
              }
              trailing={
                <Select<string>
                  size="sm"
                  value={defaultModelValue()}
                  options={defaultModelOptions()}
                  onChange={pickDefaultModel}
                  aria-label="默认模型"
                />
              }
            />
            <FieldRow
              label="账号状态"
              description="模型目录仅在已登录状态下从服务端加载。"
              trailing={
                <span {...stylex.attrs(styles.fieldNote)}>
                  {builtinStatusCopy(settings() ?? fallback())}
                </span>
              }
            />
          </Show>
          <Show when={supportedProviders().includes("custom")}>
            <FieldRow
              label="Base URL"
              description={
                supportedProviders().length === 1
                  ? "设备管理员共享此配置；可使用 localhost 或局域网 OpenAI-compatible 服务。"
                  : "仅支持 OpenAI-compatible API。云端转发会校验公网 HTTPS 地址。"
              }
              trailing={
                <Input size="sm" value={baseUrl()} onInput={setBaseUrl} aria-label="AI Base URL" />
              }
            />
            <FieldRow
              label="模型名称"
              description="使用你的提供商登记的模型标识。"
              trailing={
                <Input
                  size="sm"
                  value={model()}
                  onInput={setModel}
                  aria-label="AI 自定义模型名称"
                />
              }
            />
            <FieldRow
              label="API Key"
              description={
                settings()?.custom.apiKeyConfigured
                  ? settings()?.custom.preservesApiKeyOnSave === false
                    ? "FNOS 不会回读密钥；保存设备共享配置时需要重新输入。"
                    : "密钥已保存在当前设备；留空会保留现有密钥。"
                  : "密钥仅保存在当前设备，每次请求临时转发且不会同步。"
              }
              trailing={
                <Input
                  size="sm"
                  value={apiKey()}
                  onInput={setApiKey}
                  type="password"
                  autocomplete="off"
                  placeholder={
                    settings()?.custom.apiKeyConfigured &&
                    settings()?.custom.preservesApiKeyOnSave !== false
                      ? "输入以替换"
                      : "输入 API Key"
                  }
                  aria-label="AI API Key"
                />
              }
            />
          </Show>
          <div {...stylex.attrs(styles.inlineActions)}>
            <Button size="sm" variant="primary" disabled={saving()} onClick={save}>
              {saving() ? "保存中" : "保存 AI 配置"}
            </Button>
            <Button size="sm" variant="secondary" disabled={loading()} onClick={load}>
              刷新状态
            </Button>
          </div>
        </Show>
        <Show when={error()}>{(message) => <InlineError>{message()}</InlineError>}</Show>
      </SettingsGroup>
    </div>
  )
}
