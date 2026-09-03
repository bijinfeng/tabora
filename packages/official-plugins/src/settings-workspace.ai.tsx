import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import Info from "lucide-solid/icons/info"
import Pencil from "lucide-solid/icons/pencil"
import Plus from "lucide-solid/icons/plus"
import X from "lucide-solid/icons/x"
import { createSignal, For, onMount, Show } from "solid-js"
import type { SettingsAiSettings, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"

import { SettingsGroup } from "./settings-workspace.shared"
import { aiDialogStyles } from "./settings-workspace.ai.stylex"
import { styles } from "./styles"

type ProviderMode = SettingsAiSettings["activeProvider"]

function fallback(): SettingsAiSettings {
  return {
    supportedProviders: ["builtin", "custom"],
    activeProvider: "builtin",
    builtin: { status: "unavailable", models: [], modelId: "" },
    custom: { name: "", baseUrl: "", model: "", apiKeyConfigured: false },
  }
}

export function AiSettingsPanel(props: SettingsPanelViewProps) {
  const [settings, setSettings] = createSignal<SettingsAiSettings | undefined>(props.data.ai)
  const [loading, setLoading] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const [editingProvider, setEditingProvider] = createSignal(false)
  const [formBaseUrl, setFormBaseUrl] = createSignal("")
  const [formProviderName, setFormProviderName] = createSignal("")
  const [formApiKey, setFormApiKey] = createSignal("")
  const [formApiFormat, setFormApiFormat] = createSignal("openai")
  const [configuredModels, setConfiguredModels] = createSignal<string[]>([])
  const [fetchedModels, setFetchedModels] = createSignal<string[]>([])
  const [fetchingModels, setFetchingModels] = createSignal(false)
  const [modelFetchError, setModelFetchError] = createSignal<string | undefined>(undefined)

  const view = () => settings() ?? fallback()
  const canCustom = () => (view().supportedProviders ?? []).includes("custom")
  const customModels = () => {
    const configured = view().custom.models?.filter(Boolean) ?? []
    return configured.length ? configured : view().custom.model ? [view().custom.model] : []
  }
  const hasCustom = () => customModels().length > 0
  const builtinSelectable = () => view().builtin.status === "available"
  const isBuiltinActive = (id: string) =>
    view().activeProvider === "builtin" && view().builtin.modelId === id
  const isCustomActive = () => view().activeProvider === "custom"
  const isCustomModelActive = (model: string) => isCustomActive() && view().custom.model === model

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
  async function persist(
    next: {
      activeProvider: ProviderMode
      builtinModelId: string
      custom: { name?: string; baseUrl: string; model: string; models?: string[]; apiKey?: string }
    },
    refreshView = true,
    indicateSaving = true,
  ) {
    if (!props.host.saveAiSettings) {
      setError("当前宿主不允许修改 AI 配置")
      return false
    }
    if (indicateSaving) setSaving(true)
    setError(undefined)
    try {
      const saved = await props.host.saveAiSettings(next)
      if (refreshView) setSettings(saved)
      return true
    } catch {
      setError("保存失败，请稍后重试")
      return false
    } finally {
      if (indicateSaving) setSaving(false)
    }
  }

  async function selectBuiltin(id: string) {
    const current = view()
    const next = {
      activeProvider: "builtin" as const,
      builtinModelId: id,
      custom: {
        name: current.custom.name ?? "",
        baseUrl: current.custom.baseUrl,
        model: current.custom.model,
        models: customModels(),
      },
    }
    setSettings({
      ...current,
      activeProvider: "builtin",
      builtin: { ...current.builtin, modelId: id },
    })
    if (!(await persist(next, false, false))) setSettings(current)
  }

  async function selectCustomModel(model: string) {
    const current = view()
    const next = {
      activeProvider: "custom" as const,
      builtinModelId: current.builtin.modelId,
      custom: {
        name: current.custom.name ?? "",
        baseUrl: current.custom.baseUrl,
        model,
        models: customModels(),
      },
    }
    setSettings({ ...current, activeProvider: "custom", custom: { ...current.custom, model } })
    if (!(await persist(next, false, false))) setSettings(current)
  }

  function openDialog(editing = false) {
    const current = view()
    setEditingProvider(editing)
    setFormProviderName(editing ? (current.custom.name ?? "") : "")
    setFormBaseUrl(editing ? current.custom.baseUrl : "")
    setFormApiKey("")
    setFormApiFormat("openai")
    setConfiguredModels(editing && current.custom.model ? [current.custom.model] : [])
    setFetchedModels([])
    setModelFetchError(undefined)
    setError(undefined)
    setDialogOpen(true)
  }

  function addModel(model: string) {
    const normalized = model.trim()
    if (!normalized) return
    setConfiguredModels((models) =>
      models.includes(normalized) ? models : [...models, normalized],
    )
  }

  function removeModel(model: string) {
    setConfiguredModels((models) => models.filter((item) => item !== model))
  }

  async function fetchModels() {
    const baseUrl = formBaseUrl().trim().replace(/\/$/, "")
    if (!baseUrl) {
      setModelFetchError("请先填写 Base URL")
      return
    }
    const apiKey = formApiKey().trim()

    setFetchingModels(true)
    setModelFetchError(undefined)
    try {
      let models: string[]
      if (props.host.discoverAiModels) {
        models = await props.host.discoverAiModels(baseUrl, apiKey || undefined)
      } else {
        const response = await fetch("/api/ai/custom-models", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ baseUrl, apiKey }),
        })
        if (!response.ok) throw new Error()
        const payload = (await response.json()) as { data?: unknown; models?: unknown }
        const rawModels = Array.isArray(payload.data) ? payload.data : payload.models
        models = Array.isArray(rawModels)
          ? rawModels
              .map((item) =>
                typeof item === "string"
                  ? item
                  : item && typeof item === "object" && "id" in item && typeof item.id === "string"
                    ? item.id
                    : undefined,
              )
              .filter((item): item is string => Boolean(item))
          : []
      }
      setFetchedModels([...new Set(models)])
      if (!models.length) setModelFetchError("该端点没有返回可用模型")
    } catch {
      setModelFetchError("无法获取模型列表，请检查端点、密钥和跨域设置")
    } finally {
      setFetchingModels(false)
    }
  }

  async function saveCustom() {
    const current = view()
    const models = configuredModels()
    if (!formProviderName().trim() || !models.length || !formBaseUrl().trim()) {
      setError("请填写名称、Base URL 并至少添加一个模型")
      return
    }
    const ok = await persist({
      activeProvider: "custom",
      builtinModelId: current.builtin.modelId,
      custom: {
        name: formProviderName().trim(),
        baseUrl: formBaseUrl().trim(),
        model: models[0]!,
        models,
        ...(formApiKey() ? { apiKey: formApiKey() } : {}),
      },
    })
    if (ok) setDialogOpen(false)
  }

  return (
    <SettingsGroup title="模型">
      <Show when={!loading()} fallback={<span {...stylex.attrs(styles.fieldNote)}>加载中…</span>}>
        <div {...stylex.attrs(styles.aiProviderSections)}>
          <section {...stylex.attrs(styles.aiProviderSection)}>
            <div {...stylex.attrs(styles.aiProviderSectionHeader)}>
              <span {...stylex.attrs(styles.aiProviderSectionTitle)}>内置模型</span>
            </div>
            <div {...stylex.attrs(styles.modelGrid)} role="radiogroup" aria-label="内置模型">
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
            </div>
          </section>
          <Show when={canCustom()}>
            <div {...stylex.attrs(styles.customProvidersHeader)}>
              <span {...stylex.attrs(styles.customProvidersTitle)}>自定义供应商</span>
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => openDialog()}>
                添加提供商
              </Button>
            </div>
          </Show>
          <Show when={hasCustom()}>
            <section {...stylex.attrs(styles.aiProviderSection)}>
              <div {...stylex.attrs(styles.aiProviderSectionHeader)}>
                <div {...stylex.attrs(styles.modelCardMain)}>
                  <span {...stylex.attrs(styles.aiProviderSectionTitle)}>
                    {view().custom.name || "自定义提供商"}
                  </span>
                  <span {...stylex.attrs(styles.modelId)}>{view().custom.baseUrl}</span>
                </div>
                <div {...stylex.attrs(styles.aiProviderActions)}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Pencil}
                    onClick={() => openDialog(true)}
                  >
                    编辑
                  </Button>
                </div>
              </div>
              <div {...stylex.attrs(styles.modelGrid)} role="radiogroup" aria-label="自定义模型">
                <For each={customModels()}>
                  {(model) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isCustomModelActive(model)}
                      disabled={saving()}
                      onClick={() => selectCustomModel(model)}
                      {...stylex.attrs(
                        styles.modelCard,
                        isCustomModelActive(model) && styles.modelCardActive,
                      )}
                    >
                      <span {...stylex.attrs(styles.modelCardMain)}>
                        <span {...stylex.attrs(styles.modelName)}>{model}</span>
                        <span {...stylex.attrs(styles.modelId)}>{model}</span>
                      </span>
                      <Show when={isCustomModelActive(model)}>
                        <span {...stylex.attrs(styles.pill)}>默认</span>
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            </section>
          </Show>
          <Show when={!hasCustom() && canCustom()}>
            <section {...stylex.attrs(styles.aiProviderSection)}>
              <span {...stylex.attrs(styles.fieldNote)}>尚未配置自定义提供商。</span>
            </section>
          </Show>
        </div>
      </Show>
      <Show when={error()}>{(message) => <InlineError>{message()}</InlineError>}</Show>

      <Dialog
        open={dialogOpen()}
        onCancel={() => setDialogOpen(false)}
        title={editingProvider() ? "编辑模型供应商" : "添加模型供应商"}
        width={600}
        headerStyle={{ "font-size": "18px", "font-weight": 650 }}
        footerStyle={{
          "border-top": "1px solid rgb(var(--tbr-color-line))",
          "margin-top": "4px",
          "padding-top": "14px",
        }}
        footer={
          <div {...stylex.attrs(aiDialogStyles.footer)}>
            <span {...stylex.attrs(aiDialogStyles.hint)}>
              <Info size={14} />
              添加供应商前，请至少添加一个模型。
            </span>
            <Button variant="primary" loading={saving()} onClick={saveCustom}>
              {editingProvider() ? "保存修改" : "添加供应商"}
            </Button>
          </div>
        }
      >
        <div {...stylex.attrs(aiDialogStyles.body)}>
          <p {...stylex.attrs(aiDialogStyles.description)}>
            配置一个完全自定义的 API 端点和初始模型。
          </p>
          <div {...stylex.attrs(aiDialogStyles.fields)}>
            <Field label="名称" htmlFor="custom-provider-name">
              <Input
                id="custom-provider-name"
                value={formProviderName()}
                onInput={setFormProviderName}
                placeholder="如：智谱 GLM"
                autocomplete="off"
              />
            </Field>
            <Field label="Base URL" htmlFor="custom-provider-url">
              <Input
                id="custom-provider-url"
                value={formBaseUrl()}
                onInput={setFormBaseUrl}
                placeholder="https://api.example.com/v1"
                autocomplete="url"
              />
            </Field>
            <Field label="API Key" htmlFor="custom-provider-key">
              <Input
                id="custom-provider-key"
                type="password"
                value={formApiKey()}
                onInput={setFormApiKey}
                placeholder={view().custom.apiKeyConfigured ? "已保存，留空沿用" : "输入 API Key"}
                autocomplete="new-password"
              />
            </Field>
            <Field label="API 格式" htmlFor="custom-provider-format">
              <Select
                id="custom-provider-format"
                value={formApiFormat()}
                onChange={setFormApiFormat}
                options={[
                  { value: "openai", label: "OpenAI Chat Completions (/v1/chat/completions)" },
                  { value: "anthropic", label: "Anthropic Messages (/v1/messages)" },
                ]}
                aria-label="API 格式"
              />
            </Field>
          </div>
          <div {...stylex.attrs(aiDialogStyles.modelSection)}>
            <div {...stylex.attrs(aiDialogStyles.sectionHeader)}>
              <span {...stylex.attrs(aiDialogStyles.sectionLabel)}>模型列表</span>
              <Button
                size="sm"
                variant="secondary"
                loading={fetchingModels()}
                onClick={fetchModels}
              >
                获取模型
              </Button>
            </div>
            <Show
              when={configuredModels().length > 0 || fetchedModels().length > 0}
              fallback={
                <div {...stylex.attrs(aiDialogStyles.empty)}>
                  <Info size={15} />
                  <span>当前没有配置模型，获取后选择要在聊天中使用的模型。</span>
                </div>
              }
            >
              <div {...stylex.attrs(aiDialogStyles.modelList)}>
                <For each={fetchedModels()}>
                  {(model) => (
                    <div {...stylex.attrs(aiDialogStyles.modelItem)}>
                      <span>{model}</span>
                      <Show
                        when={configuredModels().includes(model)}
                        fallback={
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Plus}
                            onClick={() => addModel(model)}
                          >
                            添加
                          </Button>
                        }
                      >
                        <button
                          type="button"
                          aria-label={`删除模型 ${model}`}
                          onClick={() => removeModel(model)}
                          {...stylex.attrs(aiDialogStyles.remove)}
                        >
                          <X size={14} />
                        </button>
                      </Show>
                    </div>
                  )}
                </For>
                <For each={configuredModels().filter((model) => !fetchedModels().includes(model))}>
                  {(model) => (
                    <div {...stylex.attrs(aiDialogStyles.modelItem)}>
                      <span>{model}</span>
                      <button
                        type="button"
                        aria-label={`删除模型 ${model}`}
                        onClick={() => removeModel(model)}
                        {...stylex.attrs(aiDialogStyles.remove)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            <Show when={modelFetchError()}>
              {(message) => <InlineError>{message()}</InlineError>}
            </Show>
          </div>
        </div>
      </Dialog>
    </SettingsGroup>
  )
}
