import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { Checkbox } from "@tabora/ui/checkbox"
import { Dialog } from "@tabora/ui/dialog"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { For, Show, type Accessor, type JSX } from "solid-js"
import CircleCheck from "lucide-solid/icons/circle-check"

import type {
  AdminAiProvider,
  ModelInputModality,
  ModelReasoningCapabilities,
  ProviderApi,
  TestState,
} from "./model-management.types"
import {
  BUILTIN_PROVIDER_PRESETS,
  builtinModelCapabilitiesFor,
} from "./builtinProviderCapabilities"
import { styles } from "./model-management.styles"

type Setter<T = string> = (value: T) => void

const MODALITY_LABELS: Record<ModelInputModality, string> = {
  text: "文本",
  image: "图片",
  audio: "音频",
  document: "PDF 文档",
}

function SetupStep(props: { number: string; title: string; children: JSX.Element }) {
  return (
    <section {...stylex.attrs(styles.setupStep)}>
      <div {...stylex.attrs(styles.stepHeader)}>
        <span {...stylex.attrs(styles.stepNumber)}>{props.number}</span>
        <span {...stylex.attrs(styles.stepTitle)}>{props.title}</span>
      </div>
      {props.children}
    </section>
  )
}

function ModelEditorFooter(props: {
  onClose: () => void
  onDraft: () => void
  onPublish: () => void
  publishDisabled: boolean
  publishLabel: string
}) {
  return (
    <div {...stylex.attrs(styles.footer)}>
      <Button variant="secondary" onClick={props.onClose}>
        取消
      </Button>
      <Button variant="secondary" onClick={props.onDraft}>
        保存为草稿
      </Button>
      <Button onClick={props.onPublish} disabled={props.publishDisabled}>
        {props.publishLabel}
      </Button>
    </div>
  )
}

function TestAction(props: { state: TestState; onTest: () => void }) {
  return (
    <div {...stylex.attrs(styles.testRow)}>
      <Button variant="secondary" loading={props.state === "testing"} onClick={props.onTest}>
        测试连接
      </Button>
      <Show
        when={props.state === "passed"}
        fallback={<span {...stylex.attrs(styles.testHint)}>通过测试后可上线。</span>}
      >
        <Badge variant="success" size="sm">
          <CircleCheck size={14} /> 测试通过
        </Badge>
      </Show>
    </div>
  )
}

export function ModelEditorDrawer(props: {
  open: boolean
  editing: boolean
  providers: Accessor<AdminAiProvider[]>
  providerId: Accessor<string>
  setProviderId: Setter
  upstreamModelId: Accessor<string>
  label: Accessor<string>
  setLabel: Setter
  inputModalities: Accessor<ModelInputModality[]>
  setInputModalities: Setter<ModelInputModality[]>
  reasoning: Accessor<ModelReasoningCapabilities | undefined>
  setReasoning: Setter<ModelReasoningCapabilities | undefined>
  savedModelId: Accessor<string | null>
  modelIdPreview: Accessor<string>
  testState: Accessor<TestState>
  discoveredModels: Accessor<string[]>
  discovering: boolean
  error: Accessor<string | null>
  loading: boolean
  onClose: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onTest: () => void
  onDiscover: () => void
  onSelectDiscoveredModel: (id: string) => void
}) {
  const isSaved = () => props.savedModelId() !== null
  const selectedProvider = () =>
    props.providers().find((provider) => provider.id === props.providerId())
  const availableModalities = (): ModelInputModality[] =>
    (selectedProvider()?.api ?? "chat-completions") === "responses"
      ? ["text", "image", "audio", "document"]
      : ["text", "image"]
  const builtinCapabilities = () =>
    builtinModelCapabilitiesFor(selectedProvider(), props.upstreamModelId())
  const setModality = (modality: ModelInputModality, checked: boolean) => {
    const selected = props.inputModalities()
    props.setInputModalities(
      checked ? [...selected, modality] : selected.filter((candidate) => candidate !== modality),
    )
  }
  const supportsReasoning = () =>
    selectedProvider()?.api === "responses" || Boolean(builtinCapabilities()?.reasoning?.effort)
  const applyCapabilities = (id: string) => {
    const capabilities = builtinModelCapabilitiesFor(selectedProvider(), id)
    if (capabilities) {
      props.setInputModalities(capabilities.inputModalities)
      props.setReasoning(capabilities.reasoning)
      return
    }
    props.setInputModalities(["text"])
    props.setReasoning(undefined)
  }
  const selectDiscoveredModel = (id: string) => {
    props.onSelectDiscoveredModel(id)
    applyCapabilities(id)
  }
  return (
    <Dialog
      open={props.open}
      onCancel={props.onClose}
      title={props.editing ? "编辑模型" : "新增模型"}
      width="640px"
      footer={
        <ModelEditorFooter
          onClose={props.onClose}
          onDraft={props.onSaveDraft}
          onPublish={props.onPublish}
          publishDisabled={props.testState() !== "passed" || props.loading}
          publishLabel="上线模型"
        />
      }
    >
      <div {...stylex.attrs(styles.editorBody)}>
        <SetupStep number="1" title="选择 Provider">
          <Field label="Provider">
            <Select
              value={props.providerId()}
              onChange={(value) => {
                if (isSaved()) return
                props.setProviderId(value)
                const provider = props.providers().find((candidate) => candidate.id === value)
                const capabilities = builtinModelCapabilitiesFor(provider, props.upstreamModelId())
                if (capabilities) {
                  props.setInputModalities(capabilities.inputModalities)
                  props.setReasoning(capabilities.reasoning)
                } else {
                  props.setInputModalities(["text"])
                  props.setReasoning(undefined)
                }
              }}
              options={props
                .providers()
                .filter((provider) => provider.status !== "disabled")
                .map((provider) => ({ value: provider.id, label: provider.label }))}
              aria-label="Provider"
              disabled={isSaved()}
            />
          </Field>
        </SetupStep>
        <SetupStep number="2" title="定义模型">
          <Field label="上游模型名" htmlFor="model-upstream">
            <div {...stylex.attrs(styles.modelIdControl)}>
              <Select
                id="model-upstream"
                value={props.upstreamModelId()}
                onChange={selectDiscoveredModel}
                options={props.discoveredModels().map((id) => ({ value: id, label: id }))}
                placeholder={
                  props.discoveredModels().length > 0 ? "请选择上游模型" : "请先获取模型列表"
                }
                aria-label="上游模型名"
                disabled={isSaved() || props.discoveredModels().length === 0}
                xstyle={styles.modelIdSelect}
              />
              <Button
                variant="secondary"
                loading={props.discovering}
                disabled={!props.providerId() || isSaved()}
                onClick={props.onDiscover}
              >
                获取模型列表
              </Button>
            </div>
          </Field>
          <Field label="显示名称" htmlFor="model-label">
            <Input
              id="model-label"
              value={props.label()}
              onInput={props.setLabel}
              placeholder="例如 GPT-4.1 mini"
            />
          </Field>
          <Field
            label={builtinCapabilities() ? "内置输入能力" : "已验证的输入能力"}
            helper={
              builtinCapabilities()
                ? "由内置模型目录维护；未知模型仍需按实际验证结果配置。"
                : "未知模型需按实际验证结果配置。"
            }
          >
            <div {...stylex.attrs(styles.testRow)}>
              <For each={availableModalities()}>
                {(modality) => (
                  <Checkbox
                    checked={props.inputModalities().includes(modality)}
                    onChange={(checked) => setModality(modality, checked)}
                    disabled={isSaved() || modality === "text" || Boolean(builtinCapabilities())}
                    label={MODALITY_LABELS[modality]}
                  />
                )}
              </For>
            </div>
          </Field>
          <Show when={supportsReasoning()}>
            <Field
              label={builtinCapabilities() ? "内置推理能力" : "已验证的推理能力"}
              helper={
                builtinCapabilities() ? "由内置模型目录维护。" : "仅在 Provider 已确认支持时启用。"
              }
            >
              <Checkbox
                checked={Boolean(props.reasoning()?.effort || props.reasoning()?.summary)}
                onChange={(checked) =>
                  props.setReasoning(
                    checked ? { effort: true, summary: true, continuation: true } : undefined,
                  )
                }
                disabled={props.loading || Boolean(builtinCapabilities())}
                label={
                  props.reasoning()?.summary ? "支持推理摘要、思考强度与会话续传" : "支持思考强度"
                }
              />
            </Field>
          </Show>
          <div {...stylex.attrs(styles.idPreview)}>
            <span {...stylex.attrs(styles.idLabel)}>稳定模型 ID</span>
            <span {...stylex.attrs(styles.idValue)}>
              {props.savedModelId() ?? props.modelIdPreview()}
            </span>
          </div>
        </SetupStep>
        <SetupStep number="3" title="测试并发布">
          <p {...stylex.attrs(styles.helper)}>使用最小文本请求，不传输用户数据。</p>
          <TestAction state={props.testState()} onTest={props.onTest} />
        </SetupStep>
        <Show when={props.error()}>{(error) => <InlineError>{error()}</InlineError>}</Show>
      </div>
    </Dialog>
  )
}

export function ProviderEditorDrawer(props: {
  open: boolean
  editing: boolean
  id: Accessor<string>
  setId: Setter
  label: Accessor<string>
  setLabel: Setter
  baseUrl: Accessor<string>
  setBaseUrl: Setter
  api: Accessor<ProviderApi>
  setApi: Setter<ProviderApi>
  apiKey: Accessor<string>
  setApiKey: Setter
  error: Accessor<string | null>
  loading: boolean
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Dialog
      open={props.open}
      onCancel={props.onClose}
      title={props.editing ? "配置 Provider" : "新增 Provider"}
      width="520px"
      footer={
        <div {...stylex.attrs(styles.footer)}>
          <Button variant="secondary" onClick={props.onClose}>
            取消
          </Button>
          <Button onClick={props.onSave} disabled={props.loading}>
            保存连接
          </Button>
        </div>
      }
    >
      <div {...stylex.attrs(styles.editorBody)}>
        <SetupStep number="1" title="基本配置">
          <Show when={!props.editing}>
            <Field label="快速选择内置 Provider">
              <Select
                value={props.id()}
                placeholder="选择一个服务商模板"
                options={BUILTIN_PROVIDER_PRESETS.map((preset) => ({
                  value: preset.id,
                  label: preset.label,
                }))}
                aria-label="快速选择内置 Provider"
                onChange={(value) => {
                  const preset = BUILTIN_PROVIDER_PRESETS.find((item) => item.id === value)
                  if (!preset) return
                  props.setId(preset.id)
                  props.setLabel(preset.label)
                  props.setBaseUrl(preset.baseUrl)
                  props.setApi(preset.api)
                }}
              />
            </Field>
          </Show>
          <Field
            label="Provider ID"
            htmlFor="provider-id"
            helper={props.editing ? "创建后不可修改。" : undefined}
          >
            <Input
              id="provider-id"
              value={props.id()}
              onInput={props.setId}
              disabled={props.editing}
              placeholder="例如 openai"
            />
          </Field>
          <Field label="显示名称" htmlFor="provider-label">
            <Input
              id="provider-label"
              value={props.label()}
              onInput={props.setLabel}
              placeholder="例如 OpenAI"
            />
          </Field>
          <Field label="Base URL" htmlFor="provider-url" helper="仅支持 HTTPS。">
            <Input
              id="provider-url"
              value={props.baseUrl()}
              onInput={props.setBaseUrl}
              placeholder="https://api.example.com/v1"
            />
          </Field>
          <Field label="请求 API" helper="Responses 支持音频与 PDF。">
            <Select
              value={props.api()}
              onChange={props.setApi}
              options={[
                { value: "chat-completions", label: "Chat Completions" },
                { value: "responses", label: "Responses" },
              ]}
              aria-label="请求 API"
            />
          </Field>
        </SetupStep>
        <SetupStep number="2" title="凭据">
          <Field label="API Key" htmlFor="provider-key">
            <Input
              id="provider-key"
              type="password"
              value={props.apiKey()}
              onInput={props.setApiKey}
              placeholder={props.editing ? "留空不修改" : "输入 API Key"}
            />
          </Field>
        </SetupStep>
        <Show when={props.error()}>{(error) => <InlineError>{error()}</InlineError>}</Show>
      </div>
    </Dialog>
  )
}
