import * as stylex from "@stylexjs/stylex"
import { Button, FieldRow, Input, Select, Switch } from "@tabora/ui"
import { createSignal, For } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { className, styles } from "./styles"

const TEXT_MODEL_OPTIONS = ["GPT-4.1 Mini", "Claude 3.5 Sonnet", "Gemini 1.5 Pro"]
const VISION_MODEL_OPTIONS = ["Gemini 1.5 Pro", "GPT-4.1 Mini", "Claude 3.5 Sonnet"]
const PROVIDER_TYPE_OPTIONS = ["OpenAI 兼容", "Anthropic", "Gemini", "自定义兼容网关"]

type TestState = "tested" | "testing" | "untested"

function testStateLabel(state: TestState) {
  if (state === "testing") return "测试中"
  if (state === "untested") return "未测试"
  return "已测试"
}

export function AiSettingsPanel(_props: SettingsPanelViewProps) {
  const [gatewayStatus, setGatewayStatus] = createSignal("可用")
  const [textModel, setTextModel] = createSignal("GPT-4.1 Mini")
  const [visionModel, setVisionModel] = createSignal("Gemini 1.5 Pro")
  const [textModelState, setTextModelState] = createSignal<TestState>("tested")
  const [visionModelState, setVisionModelState] = createSignal<TestState>("tested")
  const [providerType, setProviderType] = createSignal("OpenAI 兼容")
  const [providerName, setProviderName] = createSignal("OpenAI 主账号")
  const [baseUrl, setBaseUrl] = createSignal("https://api.openai.com/v1")
  const [apiKey, setApiKey] = createSignal("sk-••••••••••••8Q2m")
  const [geminiEnabled, setGeminiEnabled] = createSignal(true)
  const [grants, setGrants] = createSignal<Record<string, boolean>>({
    彩票中奖查询: true,
    图片压缩: false,
    今日重点: true,
  })

  function handleTest() {
    setGatewayStatus("测试中")
    setTextModelState("testing")
    setVisionModelState("testing")
    window.setTimeout(() => {
      setGatewayStatus("可用")
      setTextModelState("tested")
      setVisionModelState("tested")
    }, 520)
  }

  function toggleGrant(name: string) {
    setGrants((current) => ({ ...current, [name]: !current[name] }))
  }

  const grantRows = () => [
    { name: "彩票中奖查询", description: "申请 ai.vision · 票面识别与号码结构化" },
    { name: "图片压缩", description: "申请 ai.vision · 图片描述和优化建议" },
    { name: "今日重点", description: "申请 ai.text · 摘要、改写和步骤提取" },
  ]

  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="ai">
      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          AI 网关状态<span>{gatewayStatus()}</span>
        </div>
        <div {...stylex.attrs(styles.statusGrid)} aria-label="AI 网关状态">
          <div {...stylex.attrs(styles.statusCard)}>
            <span>默认文本模型</span>
            <strong>{textModel()}</strong>
            <span>摘要、改写、结构化抽取</span>
            <span {...stylex.attrs(styles.fieldNote)}>{testStateLabel(textModelState())}</span>
          </div>
          <div {...stylex.attrs(styles.statusCard)}>
            <span>默认图片理解模型</span>
            <strong>{visionModel()}</strong>
            <span>票面识别、截图分析</span>
            <span {...stylex.attrs(styles.fieldNote)}>{testStateLabel(visionModelState())}</span>
          </div>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="连接测试"
          description="验证默认模型是否可调用；密钥保存在 core 安全存储，插件不可读取"
          trailing={
            <Button size="sm" variant="primary" onClick={handleTest}>
              测试连接
            </Button>
          }
        />
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          模型提供商<span>2 个启用</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="提供商类型"
          description="OpenAI 兼容、Anthropic、Gemini 或自定义网关"
          trailing={
            <Select<string>
              size="sm"
              value={providerType()}
              options={PROVIDER_TYPE_OPTIONS.map((value) => ({ value, label: value }))}
              onChange={setProviderType}
              aria-label="AI 提供商类型"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="显示名称"
          description="用户可识别的账号或网关名称"
          trailing={
            <Input
              size="sm"
              value={providerName()}
              onInput={setProviderName}
              aria-label="AI 提供商显示名称"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="Base URL"
          description="兼容网关或自定义服务地址"
          trailing={
            <Input size="sm" value={baseUrl()} onInput={setBaseUrl} aria-label="AI Base URL" />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="API Key"
          description="保存后只显示掩码，写入 core 安全存储"
          trailing={
            <div {...stylex.attrs(styles.wideInlineActions)}>
              <Input size="sm" value={apiKey()} onInput={setApiKey} aria-label="AI API Key" />
              <Button size="sm" variant="secondary" onClick={() => setGatewayStatus("未测试")}>
                替换
              </Button>
            </div>
          }
        />
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          模型配置<span>默认槽位</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="默认文本模型"
          description="供摘要、改写、问答和结构化抽取调用"
          trailing={
            <Select<string>
              size="sm"
              value={textModel()}
              options={TEXT_MODEL_OPTIONS.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                setTextModel(value)
                setTextModelState("untested")
              }}
              aria-label="默认文本模型"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="默认图片理解模型"
          description="供图片识别、票面识别和截图分析调用"
          trailing={
            <Select<string>
              size="sm"
              value={visionModel()}
              options={VISION_MODEL_OPTIONS.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                setVisionModel(value)
                setVisionModelState("untested")
              }}
              aria-label="默认图片理解模型"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="gpt-4.1-mini"
          description="OpenAI 主账号 · 文本、图片理解 · 最近测试可用"
          trailing={<span {...stylex.attrs(styles.fieldNote)}>文本 / 图片</span>}
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="gemini-1.5-pro"
          description="Gemini 个人账号 · 图片理解 · 彩票票面识别默认"
          trailing={
            <div {...stylex.attrs(styles.inlineActions)}>
              <span {...stylex.attrs(styles.fieldNote)}>图片</span>
              <Switch
                size="sm"
                checked={geminiEnabled()}
                onChange={setGeminiEnabled}
                aria-label="启用 Gemini 模型"
              />
            </div>
          }
        />
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          插件 AI 使用<span>首次授权</span>
        </div>
        <For each={grantRows()}>
          {(grant) => (
            <FieldRow
              class={className(styles.fieldRow)}
              label={grant.name}
              description={grant.description}
              trailing={
                <Switch
                  size="sm"
                  checked={grants()[grant.name] ?? false}
                  onChange={() => toggleGrant(grant.name)}
                  aria-label={`${grant.name} AI 授权`}
                />
              }
            />
          )}
        </For>
        <FieldRow
          class={className(styles.fieldRow)}
          label="隐私提示"
          description="图片或文本只在用户触发 AI 功能时发送给当前模型提供商"
          trailing={<span {...stylex.attrs(styles.fieldNote)}>插件不会获得 API Key</span>}
        />
      </section>
    </div>
  )
}
