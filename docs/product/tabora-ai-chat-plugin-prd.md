# Tabora AI 对话插件 PRD（AI Chat Plugin）

版本：V1.0

日期：2026-08-28

状态：已评审（可实施）。M1（多轮协议、connection 桥、插件骨架、错误降级）与 M2 核心（会话列表管理、实例数据持久化、默认装配）已实现；后续候选按 §10 推进。

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- AI Agent Runtime 设计：`docs/product/tabora-ai-agent-runtime-design.md`
- 设计事实源：`DESIGN.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 文档地图：`docs/README.md`

## 1. 背景与目标

平台 AI Runtime P0 已经闭环，当前实现包括：

- 插件协议 `context.ai.generate` / `context.ai.stream` / `context.ai.createChatClient`，由 `ai.generate` 权限门控（`packages/plugin-api/src/ai.ts`、`packages/platform-kernel/src/runtimeContext.ts`）。
- 服务端 TanStack AI gateway（`@tabora/ai-runtime`），OpenAI-compatible adapter，五个归一化错误码：`ai_not_configured`、`ai_auth_required`、`ai_model_unavailable`、`ai_request_rejected`、`ai_provider_failed`。
- 云端内置模型（登录后可用）、Web/Extension 本机自定义 provider（密钥仅随单次请求临时转发）、FNOS 设备共享 provider 三种模式，配置入口为设置中心 AI 面板。
- 首个 consumer 便签插件：对当前便签做一次性流式总结。

当前缺口：平台只有「单次文本操作」体验，没有多轮模型对话入口。用户想问模型一个问题时必须离开工作台。

本 PRD 定义官方内置插件 **「AI 对话」（`official.widgets.ai-chat`）**：工作台内的多轮模型对话组件。它遵守 AI Agent Runtime 设计的核心定位——平台只提供基础设施，具体 AI 体验由插件承载；本插件是该原则下的第二个 AI Consumer，也是第一个多轮对话 consumer，不是平台内置聊天机器人。

### 1.1 目标

- 用户在工作台内即可发起多轮对话：卡片上快速提问，展开视图里进行完整会话。
- 对话体验达到主流 AI 聊天产品的基础水准：流式输出、停止、重试、Markdown 与代码块渲染、多会话管理。
- 全部模型调用走平台 AI Gateway，复用现有 provider 模式、鉴权与错误归一化，插件不新增任何密钥或直连 provider 逻辑。
- 模型对话界面基于 `@tanstack/ai-solid` 与 `@tanstack/ai-solid-ui` 构建，并完全符合 `DESIGN.md`。

### 1.2 非目标

本插件不做：

- Agent 工具调用、审批、自动执行（平台协议 P0/P1 边界不变）。
- 工作区上下文注入、跨插件数据读取、长期记忆。
- 图片 / 文件 / 语音输入，视觉模型。
- 模型选择器：provider 与模型由设置中心 AI 面板决定，插件不可选。
- 对话云同步、多端漫游、用量统计与额度。

## 2. 产品原则与架构决策

### 2.1 复用平台 AI Runtime（不变量）

- 插件只通过 `context.ai` 访问模型，不持有 API key，不选择 provider，不直连模型服务。
- 权限：manifest 声明 `{ type: "ai", access: ["generate"] }`；builtin 插件声明即授予，无运行时弹窗，设置中不展示插件权限。
- provider / 模型 / 认证仍由宿主与设置中心决定；FNOS 上自动落到设备共享 provider。
- 五个归一化错误码语义不变，本插件只做错误码到文案的映射。

### 2.2 UI 层引入 TanStack AI Solid 客户端（新决策）

对话 UI 使用 `@tanstack/ai-solid`（`useChat` 等 Solid 绑定）与 `@tanstack/ai-solid-ui`（headless 聊天组件），作为插件包的 UI 层依赖。

这与 AI Agent Runtime 设计中「插件不直接依赖 TanStack AI」的表述存在口径演进：该约束的本意是「插件不得绕过网关、不得持有 provider SDK 与密钥」。本插件在保持传输与凭据全部走平台网关的前提下，允许 TanStack AI 的客户端绑定与 headless UI 进入插件 UI 层。该口径变更需要在实现时同步回 `docs/product/tabora-ai-agent-runtime-design.md`（见 §11）。

版本事实（与现有 `pnpm-workspace.yaml` catalog `ai` 组完全兼容）：

- `@tanstack/ai-solid@^0.19`：peer `solid-js >=1.9.10`、`@tanstack/ai ^0.51.0`，依赖 `@tanstack/ai-client ^0.29.1`。
- `@tanstack/ai-solid-ui@^0.7`：peer `@tanstack/ai-client ^0.29.0`、`@tanstack/ai-solid ^0.19.2`，内置 `solid-markdown` + `remark-gfm` + `rehype-highlight` / `rehype-sanitize` 渲染链。
- 现有 catalog：`@tanstack/ai ^0.51.0`、`@tanstack/ai-client ^0.29.1`、`@tanstack/ai-openai ^0.22.2`。

两个新依赖进入 catalog `ai` 组，仅由 `@tabora/plugin-ai-chat` 消费；平台包、其他插件与宿主不得引入。

选型遵循 TanStack AI 的 parts-based 消息模型（`UIMessage.parts`）：MVP 只渲染 text parts，但 thinking / tool-call / tool-result 的渲染与存储通道从一开始就按 parts 形态预留（见 §5.1、§6.3）。

### 2.3 连接桥：宿主注入网关连接（关键架构决策）

`useChat` / `<Chat>` 需要一个连接适配器（TanStack `ConnectionAdapter`，核心成员 `connect(messages, data, abortSignal, runContext): AsyncIterable<StreamChunk>`）。网关地址、登录态与 provider 配置都由宿主持有，插件无从构造，因此：

- `AiRuntimeBridge` 新增可选成员 `createChatConnection(options?)`，返回一个与 TanStack `ConnectConnectionAdapter` 结构兼容的连接对象（内部封装 gateway URL、Authorization、`AiSettingsService.getRequest()` 的 provider/model 选择、错误归一化）。
- `packages/plugin-api/src/ai.ts` 只定义结构化最小协议类型（不 import TanStack 类型）；`packages/host-adapters` 负责实现，并以类型测试保证其可赋值给 TanStack `ConnectionAdapter`。
- 插件侧：`useChat({ connection: context.ai.createChatConnection() })`。
- 现有 `AiChatClient`（`send` / `stop` / `dispose` / `getMessages`）保持不变，继续服务便签等一次性操作场景。

备选方案（已否决）：直接在 `AiChatClient` 上叠加 `connect` 语义——会把流式对话协议混进一次性客户端接口；或让插件自行构造 `fetchServerSentEvents(url)`——插件无法安全拿到 URL、鉴权与 provider 配置。

## 3. 用户场景

### 3.1 快速提问（卡片）

用户在主网格的「AI 对话」卡片底部输入框直接输入问题，回车发送，流式回答直接显示在卡片内。不展开、不打断工作台状态。

### 3.2 完整会话（展开视图）

用户双击卡片（或点展开按钮）进入展开视图：左侧会话列表 + 右侧消息流与输入区。可切换历史会话、新建会话、继续追问。

### 3.3 多会话管理

用户将不同主题拆成多个会话（如「周报草稿」「SQL 优化」），可重命名、删除；删除需确认。会话标题默认取首条用户消息截断，避免额外模型调用。

### 3.4 未配置引导

AI 未配置或未登录时，卡片与展开视图显示 EmptyState：说明当前宿主的 AI 状态，并提供「前往 AI 设置」动作（打开设置中心 AI 面板）。

### 3.5 宿主差异

- Web / Extension（已登录）：使用云端内置模型（设置中心显示可用状态）。
- Web / Extension（未登录）：使用本机自定义 provider；未配置时引导到设置。
- FNOS：仅设备管理员共享的自定义 provider；未配置时提示联系设备管理员。

## 4. MVP 范围

### 4.1 包含

- Widget contribution：支持尺寸 `S/M/L/XL`，默认 `L`；`allowMultipleInstances: true`（每个实例是独立的会话空间）。
- 默认装配：进入默认工作台 preset，预置一个 `M` 尺寸实例（用户可移除或调整尺寸）。
- 卡片视图：最近会话的紧凑消息预览 + 底部输入框；未有任何会话时显示 EmptyState 与引导。
- 展开视图（`expand`）：完整对话界面——会话列表（新建 / 切换 / 重命名 / 删除）、消息流、输入区（Textarea，Enter 发送、Shift+Enter 换行）。
- 对话能力：
  - 多轮流式输出（SSE），打字机式增量渲染。
  - 停止生成（保留已生成内容，可继续追问或重试）。
  - 失败重试：重新发送失败的用户消息或重新生成最后一条助手回复。
  - 复制单条消息（复用 `CopyButton` 语义）。
  - Markdown 渲染：标题、列表、表格、代码块与语法高亮，输出经 sanitize。
- 会话持久化：会话与消息存入 widget 实例数据（`props.data`），MVP 仅本机，不进入 sync collections。
- 错误降级：五个网关错误码到中文文案与下一步动作的映射（见 §8）。
- 内置系统提示词：简短工作台助手 persona（跟随用户语言、简洁、可说明自身是 Tabora 内 AI 助手），经连接请求的 `system` 字段传递；每会话可覆盖。
- 每会话运行参数：在展开视图的输入栏内联提供「模型切换 / 思考强度 / 上下文容量 / 添加上下文」四个 chip 控件；每会话独立保存并随每次发送透传给网关，缺省时使用工作台默认设置。

### 4.2 不包含（列为后续候选，见 §10）

- 消息编辑与分支（fork）重发。
- 思考过程（thinking parts）展示与落盘——存储与渲染路径已按 parts 预留，仅 UI 接入延后（见 §6.3、§10）。
- 命令面板入口与全局快捷键。
- 系统提示词的自由文本编辑（每会话运行参数已包含，见 §4.1；仅 persona 文本自定义延后）。
- 对话云同步、导出。
- 工具调用与审批 UI——`ChatMessage` 工具渲染器与 `ToolApproval` 接入口预留，待平台 P1 agent 工具协议落地后接入。

## 5. 界面与交互设计

### 5.1 组件策略

接入决策：**不采用** `<Chat>` compound 根组件与 `ChatMessages` / `ChatInput` 的结构——其 `class` 字符串样式管道与 StyleX / `DESIGN.md` 规则冲突，且多会话切换与持久化的状态所有权在组件树之外。状态用 `useChat`，消息循环与输入区用 `@tabora/ui` 自组，单条消息渲染复用 `ChatMessage` 叶子组件（可独立使用，直接传 `message` prop）。

| TanStack 组件 | 采用 | 说明 |
| --- | --- | --- |
| `useChat`（`@tanstack/ai-solid`） | 是 | 对话状态、流式、停止、重载；连接来自 `context.ai.createChatConnection()` |
| `ChatMessage`（独立使用） | 是 | 单条消息标准渲染入口，原生理解 parts 格式：MVP 仅出 text parts；thinking / tool-call / tool-result 渲染器插槽后续接入；气泡样式按 `DESIGN.md`（surface / line 层级，6px 圆角，不用大面积强调色） |
| `TextPart` | 间接复用 | `ChatMessage` 内部的 Markdown 链（remark-gfm、rehype-highlight，`rehype-sanitize` 固定最后执行）；排印 token 走 Tabora，代码块用等宽字体 token |
| `<Chat>` / `ChatMessages` / `ChatInput` | 否 | compound 结构不用；消息循环（内部滚动、auto-scroll）与输入区（`@tabora/ui` Textarea + Button，32px 控件密度、可访问名称）自组 |
| `ToolApproval` | 暂缓 | 平台 P1 agent 工具协议落地后作为审批 UI 接入 |

### 5.2 设计规范要点（以 `DESIGN.md` 为准）

- 复用 `@tabora/ui` 已有组件（Button、IconButton、Textarea、DropdownMenu、Dialog、Toast、EmptyState、ListRow、InlineError、Spinner、ScrollArea），不新建重复原语。
- 不嵌套卡片；消息气泡不是「卡片套卡片」，用 surface / line 表达层级；强调色只用于发送主按钮、焦点环与选中态，面积低于 5%。
- 圆角：气泡与行内元素 ≤ 6px；展开视图容器作为 panel 最多 8px。
- 图标一律 `lucide-solid` 精确导入（16px 内容区），如发送、停止、复制、重试、删除；不用 emoji。
- 动效仅用于流式指示与状态切换，120/180/240ms 三档；不动画化布局属性；加载状态预留稳定尺寸。
- 可访问性：输入框有可访问名称；消息流容器 `aria-live="polite"`；停止/重试/删除均有文字或 aria-label；明暗主题对比度满足 WCAG 2.2 AA。
- 移动端与 FNOS 窄屏：展开视图单列，会话列表折叠为 Drawer（保持对话上下文，符合 `DESIGN.md` 的 Drawer 语义；复用 `@tabora/ui` Drawer），无横向滚动。
- Markdown 中的链接 MVP 渲染为纯文本（不可点击），避免绕过 external-open 权限桥；代码块提供复制按钮。

## 6. 平台协议扩展（技术概要）

详细技术设计在实现 PR 中补充到技术方案 V2 的 AI Runtime 章节；本节界定协议事实。

### 6.1 多轮网关协议

当前 `AiGatewayRequest` 只携带单条 `prompt`（≤ 32,000 字符），服务端无法获得历史。扩展：

- `AiGatewayRequest` 增加可选 `messages: AiChatMessage[]`（`role: "user" | "assistant"` + `text`），与既有 `prompt` 字段互斥：带 `messages` 的请求为多轮对话请求，服务端将完整历史交给 TanStack AI `chat()`；仅 `prompt` 的单轮请求语义完全不变（便签等既有 consumer 不受影响）。
- `AiGatewayRequest` 另有可选运行参数 `modelId`、`temperature`、`maxOutputTokens` 与 `reasoningEffort`（`"low" | "medium" | "high"`）。多轮请求经 AG-UI `forwardedProps` 透传，服务端在 `createChatOptions` 合入 `modelOptions`：`reasoningEffort` 映射为 OpenAI chat-completions 的 `reasoning_effort`；未带这些字段时使用宿主默认设置。
- 服务端校验：角色枚举、最后一条必须为 user、单条长度沿用 32k 上限、条数 ≤ 100、历史总字符 ≤ 96,000（最终数值以技术设计为准）；`reasoningEffort` 只接受三档枚举，非法值返回 `ai_request_rejected`；超限返回 `ai_request_rejected`。
- 改动落点：`packages/plugin-api`（协议类型）、`packages/ai-runtime`（contracts + server 校验与转发）、`apps/app/src/server/ai.ts` 与 `/api/ai/*` 路由、`apps/fnos/backend`（设备后端透传）。错误码与鉴权逻辑不变。
- 演进预留：多轮请求体是 MVP 子集形态。后续工具调用迭代在同一请求上以「新增可选字段」演进（工具声明、parts 历史、审批往返）；TanStack AI `chat()` 与其 AG-UI 事件流原生承载 thinking / tool 事件，网关侧无破坏性变更，单轮与多轮既有语义保持不变。
- 历史裁剪：客户端发送前按「系统提示 + 最近 N 条消息」裁剪历史，确保请求保持在服务端校验上限内，并在会话内提示早期消息已省略；N 的具体数值随服务端上限在技术设计确定。

### 6.2 Chat Connection 桥

- `packages/plugin-api/src/ai.ts`：新增 `AiChatConnection` 结构化协议类型（`connect(messages, data?, abortSignal?, runContext?) → AsyncIterable<StreamChunk>` 形状）与 `AiRuntimeBridge.createChatConnection?(options?)`。
- `packages/host-adapters`：基于现有 `createHttpAiRuntime` 的网关配置实现连接对象，POST `/api/ai/stream` 携带完整 `messages` 与宿主 provider 配置；将网关错误响应归一化为 `AiRuntimeError` 后抛入连接错误路径，保证 UI 侧拿到与现有 consumer 相同的五个错误码。连接对象按 TanStack 形态透传 `runContext`（含 `clientTools` / `forwardedProps`），为后续客户端工具与审批往返预留通道，MVP 不使用。
- 权限门不变：`createChatConnection` 与 `generate` 一样要求 `ai.generate` 授权，在 `packages/platform-kernel/src/runtimeContext.ts` 的 ai bridge 内统一校验。
- 无 `createChatConnection` 的旧宿主：插件降级为仅展示说明状态（MVP 的所有宿主都会实现）。

### 6.3 数据模型（实例数据契约）

```text
会话:  { id, title, createdAt, updatedAt,
         modelId?, reasoningEffort?, temperature?, maxOutputTokens?,
         contextBlocks?: [{ id, label, text }] }
消息:  { id, role: "user" | "assistant", createdAt, status: "complete" | "error", errorCode?,
         parts: [{ type: "text", text }] }
存储:  widget 实例数据 key "ai-chat-conversations"，MVP 仅本机
```

- 会话级运行参数（`modelId` / `reasoningEffort` / `temperature` / `maxOutputTokens`）与 `contextBlocks` 均为可选字段：缺省即回退宿主默认设置，随每次发送经 `buildSendOptions` 组装并透传网关；`contextBlocks` 在发送前拼入系统提示。
- `parts` 数组是长期形态：MVP 只写入 text parts；thinking / tool-call / tool-result parts 由后续迭代追加类型，旧数据无需迁移。
- MVP 不落盘流式中间态与 thinking / tool parts（后续迭代再扩展落盘范围）。
- 运行时 `useChat` 的 `UIMessage`（原生 parts 模型）与存储消息按 parts 直接互转；切换会话通过重建/重置 `useChat` 状态实现。

## 7. 权限与安全

- manifest：`permissions: [{ type: "ai", access: ["generate"] }]`；无 network、无 external-open。
- 插件不读取、不存储、不回显任何 API key；连接对象由宿主构建并注入。
- 消息历史仅存本机实例数据；不上传到平台持久化服务，不参与同步（网关单次请求按现有安全模型临时转发 provider 配置）。
- 模型输出是不可信输入：Markdown 一律经 `rehype-sanitize` 后渲染，不执行内嵌脚本，不渲染可点击外链（MVP）。
- 单点失败局部化：任一会话的请求失败只影响该会话内状态，不影响其他会话、其他卡片与整页。

## 8. 失败状态与降级

| 错误码 | 触发 | 卡片 / 展开视图表现 |
| --- | --- | --- |
| `ai_not_configured` | 宿主未配置任何可用模型 | EmptyState + 「前往 AI 设置」 |
| `ai_auth_required` | 云端内置模型未登录 | EmptyState + 「登录」引导（沿用账号状态入口） |
| `ai_model_unavailable` | 内置模型不可用 / FNOS 无内置 | InlineError + 「前往 AI 设置」 |
| `ai_request_rejected` | 输入或历史超限、非法请求 | 会话内 InlineError，提示缩短输入或新建会话 |
| `ai_provider_failed` | 上游 provider 失败 / 网络失败 | 会话内 InlineError + 「重试」，保留已生成内容 |
| 流式中断 | 网络 / 服务端中断 | 保留已生成部分，提供「继续」或「重试」 |

所有失败状态停留在会话内部，带明确的下一步动作；不使用 Toast 承载需要用户处理的错误。

## 9. 验收标准

- [ ] 添加「AI 对话」卡片后，卡片内输入问题可获得流式回答；回答进行中可停止，已生成内容保留。
- [ ] 展开视图内可新建、切换、重命名、删除会话；重启 workbench 后会话与消息完整恢复（本机实例数据）。
- [ ] 未配置 / 未登录 / provider 失败 / 超限 / 流中断五种降级均按 §8 呈现，且不影响其他卡片。
- [ ] 云端内置模型（登录）、本机自定义 provider、FNOS 设备 provider 三种模式下对话均可用；provider / 模型切换只需改设置中心，无需改动插件。
- [ ] 对话 UI 在明暗主题下符合 `DESIGN.md`（token、圆角、密度、强调色占比、焦点态），移动端无横向滚动。
- [ ] Markdown 与代码块渲染正确且经 sanitize；外链不可点击；键盘可完成发送、停止、重试、复制、删除会话全部操作。
- [ ] 便签总结等既有 AI consumer 回归通过；不带 `messages` 的单轮请求行为不变。
- [ ] 插件错误可被宿主错误边界局部化，不产生白屏。

## 10. 分阶段路线图

### M1：协议 + 插件骨架

- 多轮网关协议（plugin-api / ai-runtime / 云端与 FNOS 后端）与 connection 桥。
- `@tabora/plugin-ai-chat` 包：manifest、卡片与展开视图、单会话流式对话（发送 / 停止 / 重试 / Markdown）。
- 错误降级全套文案与状态。

### M2：会话管理 + 设计与装配

- 会话列表、持久化、多实例。
- `DESIGN.md` 全面校准（明暗主题、移动端、可访问性）与 ai-solid-ui 样式定制收敛。
- 注册进 `@tabora/official-plugins` 与 `@tabora/builtin-plugin-registry`；默认工作台 preset 预置一个 `M` 尺寸实例（用户可移除）。
- 文档同步（§11）完成。

### 后续候选（不承诺排期）

- ~~命令面板「新建 AI 对话」入口与快捷键~~：已实现（`⌘I` / 面板检索「新建 AI 对话」，无卡片时提示先添加）。
- ~~自定义系统提示词与每会话参数~~：已实现（会话设置 Dialog：系统提示词 + 温度 0–2 校验，随会话持久化，仅作用于该会话）。
- ~~会话标题由模型生成~~：已实现（首轮对话完成后经 `context.ai.generate` 生成一次，失败静默保留自动标题；手动重命名优先）。
- 消息编辑 / 分支重发：**部分实现**——最后一条提问可编辑并重新生成（丢弃旧回答）；完整分支树仍属候选。
- **思考过程与工具调用渲染**：客户端渲染器已由 `ChatMessage` 默认通道就位（模型返回 thinking / tool 事件即可展示）；工具调用执行与审批依赖平台 P1 agent 工具协议，网关协议按可选字段扩展后接入。
- 对话云同步（依赖 sync collections 决策）。

## 11. 文档同步计划

实现合入时需同步更新以下既有事实源，消除口径冲突：

1. `docs/product/tabora-ai-agent-runtime-design.md`：
   - 「P0 不新增通用助手」的口径演进为「多轮对话以官方插件 `official.widgets.ai-chat` 形态提供」。
   - 「插件不直接依赖 TanStack AI」调整为「插件不得依赖 provider SDK、不得绕过网关；允许 TanStack AI 客户端绑定与 headless UI 作为插件 UI 层依赖」。
   - §6.2 的最小协议补入 `createChatConnection` 与多轮 `messages`。
2. `docs/product/tabora-official-plugins-design.md`：插件清单新增 AI 对话条目（manifest、contribution、验收）。
3. `docs/technical/tabora-plugin-workbench-technical-design-v2.md`：AI Runtime 章节补多轮网关协议与 connection 桥细节。
4. `docs/README.md`：本 PRD 已登记为产品事实源（随本 PRD 一并提交）。
