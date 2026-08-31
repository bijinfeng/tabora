import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { Drawer } from "@tabora/ui/drawer"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { Show, type Accessor, type JSX } from "solid-js"
import CircleCheck from "lucide-solid/icons/circle-check"

import type { AdminAiProvider, TestState } from "./model-management.types"
import { styles } from "./model-management.styles"

type Setter = (value: string) => void

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

function DrawerFooter(props: {
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
  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
      title={props.editing ? "编辑模型" : "新增模型"}
      description="模型是面向用户的发布单位；稳定 ID 由 Provider ID 与上游模型名生成。"
      footer={
        <DrawerFooter
          onClose={props.onClose}
          onDraft={props.onSaveDraft}
          onPublish={props.onPublish}
          publishDisabled={props.testState() !== "passed" || props.loading}
          publishLabel="上线模型"
        />
      }
    >
      <div {...stylex.attrs(styles.drawerBody)}>
        <SetupStep number="1" title="选择 Provider">
          <Field label="Provider" helper="草稿连接可用于测试；只有已启用连接下的模型可上线。">
            <Select
              value={props.providerId()}
              onChange={(value) => !isSaved() && props.setProviderId(value)}
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
          <Field
            label="上游模型名"
            htmlFor="model-upstream"
            helper="先获取模型列表，再从下拉项中选择。创建后不可修改。"
          >
            <div {...stylex.attrs(styles.modelIdControl)}>
              <Select
                id="model-upstream"
                value={props.upstreamModelId()}
                onChange={props.onSelectDiscoveredModel}
                options={props.discoveredModels().map((id) => ({ value: id, label: id }))}
                placeholder={
                  props.discoveredModels().length > 0 ? "请选择上游模型" : "请先获取模型列表"
                }
                aria-label="上游模型名"
                disabled={isSaved() || props.discoveredModels().length === 0}
                xstyle={styles.modelIdSelect}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={props.discovering}
                disabled={!props.providerId() || isSaved()}
                onClick={props.onDiscover}
              >
                获取模型列表
              </Button>
            </div>
          </Field>
          <Field label="显示名称" htmlFor="model-label" helper="面向用户展示。">
            <Input
              id="model-label"
              value={props.label()}
              onInput={props.setLabel}
              placeholder="例如 GPT-4.1 mini"
            />
          </Field>
          <div {...stylex.attrs(styles.idPreview)}>
            <span {...stylex.attrs(styles.idLabel)}>稳定模型 ID</span>
            <span {...stylex.attrs(styles.idValue)}>
              {props.savedModelId() ?? props.modelIdPreview()}
            </span>
          </div>
        </SetupStep>
        <SetupStep number="3" title="测试并发布">
          <p {...stylex.attrs(styles.helper)}>
            测试会先将模型保存为草稿，使用固定最小文本请求，不传输用户数据。
          </p>
          <TestAction state={props.testState()} onTest={props.onTest} />
        </SetupStep>
        <Show when={props.error()}>{(error) => <InlineError>{error()}</InlineError>}</Show>
      </div>
    </Drawer>
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
  apiKey: Accessor<string>
  setApiKey: Setter
  error: Accessor<string | null>
  loading: boolean
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
      title={props.editing ? "配置 Provider" : "新增 Provider"}
      description="Provider 只保存端点与写入型凭据。保存后添加模型并测试，才能启用连接。"
      footer={
        <DrawerFooter
          onClose={props.onClose}
          onDraft={props.onSave}
          onPublish={props.onSave}
          publishDisabled={props.loading}
          publishLabel="保存连接"
        />
      }
    >
      <div {...stylex.attrs(styles.drawerBody)}>
        <SetupStep number="1" title="基本配置">
          <Field
            label="Provider ID"
            htmlFor="provider-id"
            helper={
              props.editing ? "稳定 ID 创建后不可修改。" : "用于稳定路由，如 openai、deepseek。"
            }
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
          <Field
            label="Base URL"
            htmlFor="provider-url"
            helper="只接受 HTTPS 公网地址；保存与调用时均会执行 SSRF 防护。"
          >
            <Input
              id="provider-url"
              value={props.baseUrl()}
              onInput={props.setBaseUrl}
              placeholder="https://api.example.com/v1"
            />
          </Field>
        </SetupStep>
        <SetupStep number="2" title="凭据">
          <Field
            label="API Key"
            htmlFor="provider-key"
            helper={
              props.editing ? "已配置；留空不修改，页面不会回显旧密钥。" : "保存后只显示“已配置”。"
            }
          >
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
    </Drawer>
  )
}
