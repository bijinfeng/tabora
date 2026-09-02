import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { FieldRow } from "@tabora/ui/field-row"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import Plus from "lucide-solid/icons/plus"
import { createSignal, For, onMount, Show } from "solid-js"
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

export function AiSettingsPanel(props: SettingsPanelViewProps) {
  const [settings, setSettings] = createSignal<SettingsAiSettings | undefined>(props.data.ai)
  const [loading, setLoading] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const [formBaseUrl, setFormBaseUrl] = createSignal("")
  const [formModel, setFormModel] = createSignal("")
  const [formApiKey, setFormApiKey] = createSignal("")

  const view = () => settings() ?? fallback()
  const canCustom = () => (view().supportedProviders ?? []).includes("custom")
  const hasCustom = () => Boolean(view().custom.model)
  const builtinSelectable = () => view().builtin.status === "available"
  const isBuiltinActive = (id: string) =>
    view().activeProvider === "builtin" && view().builtin.modelId === id
  const isCustomActive = () => view().activeProvider === "custom"

  onMount(() => {
    if (!props.data.ai) {
      void load()
    }
  })

  async function load() {
    if (!props.host.getAiSettings) {
      setError("当前宿主未提供 AI 设置服务")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      setSettings(await props.host.getAiSettings())
    } catch {
      setError("无法读取 AI 配置，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // 统一保存入口：省略 custom.apiKey 时宿主保留已存密钥。
  async function persist(next: {
    activeProvider: ProviderMode
    builtinModelId: string
    custom: { baseUrl: string; model: string; apiKey?: string }
  }) {
    if (!props.host.saveAiSettings) {
      setError("当前宿主不允许修改 AI 配置")
      return false
    }
    setSaving(true)
    setError(undefined)
    try {
      setSettings(await props.host.saveAiSettings(next))
      return true
    } catch {
      setError("保存失败，请稍后重试")
      return false
    } finally {
      setSaving(false)
    }
  }

  function selectBuiltin(id: string) {
    const current = view()
    void persist({
      activeProvider: "builtin",
      builtinModelId: id,
      custom: { baseUrl: current.custom.baseUrl, model: current.custom.model },
    })
  }

  function selectCustom() {
    const current = view()
    void persist({
      activeProvider: "custom",
      builtinModelId: current.builtin.modelId,
      custom: { baseUrl: current.custom.baseUrl, model: current.custom.model },
    })
  }

  function openDialog() {
    const current = view()
    setFormBaseUrl(current.custom.baseUrl)
    setFormModel(current.custom.model)
    setFormApiKey("")
    setError(undefined)
    setDialogOpen(true)
  }

  async function saveCustom() {
    const current = view()
    const ok = await persist({
      activeProvider: "custom",
      builtinModelId: current.builtin.modelId,
      custom: {
        baseUrl: formBaseUrl().trim(),
        model: formModel().trim(),
        ...(formApiKey() ? { apiKey: formApiKey() } : {}),
      },
    })
    if (ok) setDialogOpen(false)
  }

  return (
    <SettingsGroup
      title="模型"
      meta={
        <Show when={canCustom()}>
          <Button size="sm" variant="secondary" onClick={openDialog}>
            <Plus size={14} />
            新增自定义模型
          </Button>
        </Show>
      }
    >
      <Show when={!loading()} fallback={<span {...stylex.attrs(styles.fieldNote)}>加载中…</span>}>
        <div {...stylex.attrs(styles.modelGrid)} role="radiogroup" aria-label="模型列表">
          <For each={view().builtin.models}>
            {(item) => (
              <button
                type="button"
                role="radio"
                aria-checked={isBuiltinActive(item.id)}
                disabled={!builtinSelectable() || saving()}
                onClick={() => selectBuiltin(item.id)}
                {...stylex.attrs(
                  styles.modelCard,
                  isBuiltinActive(item.id) && styles.modelCardActive,
                )}
              >
                <span {...stylex.attrs(styles.modelCardMain)}>
                  <span {...stylex.attrs(styles.modelName)}>{item.label}</span>
                  <span {...stylex.attrs(styles.modelId)}>{item.id}</span>
                </span>
                <Show when={isBuiltinActive(item.id)}>
                  <span {...stylex.attrs(styles.pill)}>默认</span>
                </Show>
              </button>
            )}
          </For>
          <Show when={hasCustom()}>
            <button
              type="button"
              role="radio"
              aria-checked={isCustomActive()}
              disabled={saving()}
              onClick={selectCustom}
              {...stylex.attrs(styles.modelCard, isCustomActive() && styles.modelCardActive)}
            >
              <span {...stylex.attrs(styles.modelCardMain)}>
                <span {...stylex.attrs(styles.modelName)}>{view().custom.model}</span>
                <span {...stylex.attrs(styles.modelId)}>
                  {view().custom.baseUrl || "自定义模型"}
                </span>
              </span>
              <Show when={isCustomActive()}>
                <span {...stylex.attrs(styles.pill)}>默认</span>
              </Show>
            </button>
          </Show>
        </div>
      </Show>
      <Show when={error()}>{(message) => <InlineError>{message()}</InlineError>}</Show>

      <Dialog
        open={dialogOpen()}
        onCancel={() => setDialogOpen(false)}
        title="新增自定义模型"
        okText="保存"
        cancelText="取消"
        onOk={saveCustom}
        confirmLoading={saving()}
        width={460}
      >
        <FieldRow
          label="Base URL"
          description="仅支持 OpenAI-compatible API。云端转发会校验公网 HTTPS 地址。"
          trailing={
            <Input
              size="sm"
              type="text"
              value={formBaseUrl()}
              onInput={setFormBaseUrl}
              aria-label="AI Base URL"
            />
          }
        />
        <FieldRow
          label="模型名称"
          description="使用你的提供商登记的模型标识。"
          trailing={
            <Input
              size="sm"
              type="text"
              value={formModel()}
              onInput={setFormModel}
              aria-label="AI 模型名称"
            />
          }
        />
        <FieldRow
          label="API Key"
          description="密钥仅保存在当前设备，每次请求临时转发且不会同步。"
          trailing={
            <Input
              size="sm"
              type="password"
              value={formApiKey()}
              onInput={setFormApiKey}
              placeholder={view().custom.apiKeyConfigured ? "已保存，可留空" : ""}
              aria-label="AI API Key"
            />
          }
        />
      </Dialog>
    </SettingsGroup>
  )
}
