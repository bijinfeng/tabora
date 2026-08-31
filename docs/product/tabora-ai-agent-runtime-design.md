# Tabora AI Agent Runtime 产品设计

版本：V0.1

日期：2026-07-13

状态：产品设计草案

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 设计事实源：`DESIGN.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 文档地图：`docs/README.md`

## 1. 设计目标

Tabora 的 AI 能力不定义为平台内置的单一聊天机器人，而定义为插件化工作台的文本 AI 基础设施。平台提供统一、安全、可配置的 runtime，插件负责具体 AI 体验。

这个方向解决两个问题：

- 多个 AI 插件不需要重复实现模型配置、服务端转发、流式响应、错误处理和密钥边界。
- AI 能力仍然遵守 Tabora 的插件优先原则：平台保留通用运行机制，具体业务能力仍由官方或第三方插件贡献。

核心定位：

> Tabora 不是做一个 AI 聊天新标签页，而是让每个插件都能低成本获得一致、安全、可配置的 agent 能力。

### 1.1 当前技术选型

P0 阶段采用 **Tabora 自有协议 + 服务端 TanStack AI gateway**：

- `@tabora/plugin-api` 定义插件可见的文本请求、流式响应、标准错误码和 `ai.generate` 权限。
- `@tabora/platform-kernel` 只负责在 `PluginContext` 中按权限暴露 `context.ai`，不直接依赖第三方 AI SDK。
- `@tabora/ai-runtime` 作为共享服务端基础设施包，基于 TanStack AI 与 OpenAI-compatible adapter 执行文本生成和流式文本。
- 插件只依赖 Tabora 的 `context.ai`，不直接依赖 provider SDK，也不保存模型密钥。传输与凭据始终由宿主网关持有；插件 UI 层允许使用 TanStack AI 的客户端绑定与 headless 组件（`@tanstack/ai-solid`、`@tanstack/ai-solid-ui`）构建对话界面，但不得绕过网关直连模型。

云端内置模型由平台服务端统一配置和付费，必须通过 Tabora 登录态调用。Web 与 Extension 也可选择本机保存的自定义 OpenAI-compatible provider；其密钥只随单次请求临时转发到 gateway，不持久化到云端且不参与同步。FNOS 不提供内置模型，只使用设备管理员共享的自定义 provider，允许连接 localhost 或局域网模型。

云端内置 provider 与模型目录由 `backend/app` 的「模型管理」数据库维护；Provider 保存 OpenAI-compatible `baseUrl` 与加密 API Key，模型保存 `providerId:modelId` 形式的稳定 ID（例如 `deepseek:deepseek-chat`），因此不同 provider 的同名模型不会发生路由冲突。仅 Provider 与模型均处于 active 状态时，目录和网关才会使用该模型。部署必须配置 `TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY` 用于凭据加密；旧 `TABORA_AI_API_KEY`、`TABORA_AI_BASE_URL` 与 `TABORA_AI_MODELS` 已移除，服务检测到它们会在启动时给出迁移错误。

## 2. 产品原则

### 2.1 平台提供基础设施

平台负责 OpenAI-compatible 模型配置、服务端请求网关与流式响应、云端登录鉴权、FNOS 设备管理员配置，以及统一、脱敏的错误状态。

平台不负责：

- 把所有 AI 场景写成一个内置超级助手。
- 直接承载具体业务 agent 的长期逻辑。
- 绕过插件协议读写插件私有数据。
- 让 AI 绕过现有权限桥执行外部打开、剪贴板、本地文件或 workspace 写入。
- 在 P0 执行工具调用、审批、工作区上下文注入、视觉模型或用户额度产品化。

### 2.2 插件提供具体 agent

插件负责：

- 便签整理 agent。
- 待办拆解 agent。
- 搜索研究 agent。
- 图片处理 agent。
- 股票、彩票、天气等领域 agent。
- 未来第三方自定义 agent。

P0 的唯一插件角色是 AI Consumer：插件经 `context.ai.generate` 或 `context.ai.stream` 请求文本，展示结果但不自动写入数据或触发工具。未来的 Agent Provider、Tool Provider 与审批协议必须以服务端可序列化 contract 另行设计，不能把可执行函数传过当前 bridge。

## 3. MVP 范围

### 3.1 包含范围

第一阶段交付文本 AI Runtime：

- 插件调用 `context.ai.generate` / `context.ai.stream`，并获得标准错误码。
- 云端内置 OpenAI-compatible 模型由平台凭据支付，只允许登录用户调用。
- Web / Extension 自定义 OpenAI-compatible provider 不要求登录；Base URL、API key、模型名仅本机保存，调用时临时经服务端转发。
- FNOS 只支持设备管理员共享的自定义 provider；管理员可使用 HTTP(S) 的 localhost、局域网或公网模型地址。
- 云端自定义 provider 只允许 HTTPS 公网地址，拒绝回环、私网、链路本地地址和重定向目标，且不持久化或回显密钥。
- 设置中心按宿主呈现云端内置模型状态、本机自定义配置或 FNOS 设备共享配置；密钥读取均为掩码。
- 便签提供“总结”操作，支持流式结果、取消、重试和可见失败状态，不自动修改便签。

### 3.2 不包含范围

第一阶段不做：

- Agent 工具调用、审批与自动写入。
- 工作区上下文注入、跨插件私有数据读取、视觉模型与长期记忆。
- AI 生成插件、远程 agent 市场和用户额度产品化。

## 4. 用户场景

### 4.1 插件内文本助手

便签、待办、图片处理等插件可以声明自己的 agent 能力：

- 便签：总结当前便签；结果可流式查看、取消或重试。
- 未来待办等插件可以生成建议，但 P0 不自动执行建议。

### 4.2 设置与模型选择

登录用户可在 Web / Extension 查看云端内置模型；任何用户可在本机保存自定义 provider。FNOS 管理员编辑设备共享配置，调用者不需要 Tabora 账号。

## 5. 核心体验流程

1. 用户在插件中发起文本操作，例如便签总结。
2. 插件通过有权限的 `context.ai` 发起请求，不能选择 provider 或读取密钥。
3. 宿主选择云端内置、云端临时自定义或 FNOS 设备配置。
4. Gateway 完成登录校验、模型/URL 校验和 TanStack AI 调用；流式响应转换为 Tabora 事件。
5. 插件显示增量文本；取消、未登录、未配置或 provider 失败都局部化为本次操作状态。

## 6. 平台能力

### 6.1 AI Gateway

AI Gateway 统一处理模型选择、服务端凭据、临时自定义凭据、URL 安全校验、文本流与错误归一化。它不会把 provider 原始事件或密钥暴露给客户端。

当前默认底层 gateway 放在 `@tabora/ai-runtime`，基于 TanStack AI。P0 只覆盖服务端文本生成和 SSE 流式文本；工具执行、审批、工作区上下文和视觉模型不在本期范围。provider 配置由宿主决定，插件永远不读取明文密钥。

插件不直接保存模型密钥，也不读取明文 API key。

### 6.2 AI Runtime Context

当前最小协议收敛为 `context.ai.generate` 与 `context.ai.stream`。插件必须声明 `ai.generate` 权限后才会获得 bridge；模型选择、provider 配置与认证由宿主处理。

多轮对话扩展（随 AI 对话插件落地）：

- `context.ai.createChatConnection()` 返回宿主构建的网关连接对象（`plugin-api` 的 `AiChatConnection`，结构与 TanStack `ConnectionAdapter` 兼容，chunk 为网关 AG-UI 事件流）。插件把它传给 TanStack AI 客户端（如 `useChat`）使用；provider 选择、鉴权与密钥仍在宿主侧按请求注入。
- 网关 `/api/ai/stream` 在原单轮 `prompt` 之外接受 AG-UI `RunAgentInput` 形态的多轮请求：`messages` 走 AG-UI anchor 线格式，provider/参数选择经 `forwardedProps` 传入；校验角色、条数（≤100）、长度（单条 ≤32k、总量 ≤96k）且最后一条必须为 user，错误码与鉴权逻辑不变。单轮 `prompt` 语义完全不变。

### 6.3 AI Permission Bridge

在现有权限模型上增加 AI 相关能力：

- 调用模型：`{ type: "ai", access: ["generate"] }`，允许插件使用平台 AI Gateway。
- `context` 与 `tools` 不是 P0 可用能力；即使 manifest 中保留类型，也不得在 P0 bridge 中暴露实现。

## 7. 插件协议方向

建议后续在 manifest contribution 中增加或扩展以下能力：

- `agentProviders`：声明插件提供哪些 agent。
- `agentTools`：声明 agent 可请求哪些工具。
- `agentContext`：声明插件愿意提供哪些上下文摘要。
- `commands`：让 agent action 可以进入 `⌘K`。
- `settingsPanels`：继续用于插件自己的 AI 配置页。

P0 不引入这些协议；它只要求插件声明 `ai.generate` 并使用文本 bridge。

## 8. 信息架构

### 8.1 设置中心 / AI

新增一级设置面板“AI”，承载模型、网关和当前宿主可编辑的配置。它是 AI 能力控制中心，不是聊天入口。

建议分区：

- 云端：登录状态与服务端目录中的内置模型；登录后才显示可调用状态。
- Web / Extension：本机自定义 OpenAI-compatible Base URL、模型和一次写入后不回读的 API key。
- FNOS：管理员编辑设备共享配置，配置读取只显示掩码与状态。
- 所有宿主：当前模式和最近可操作的失败提示。

### 8.2 插件内容区

具体插件在自己的 widget、展开视图或设置面板中放置 AI 操作。例如便签卡片的“整理”、待办卡片的“拆解”。这些操作必须调用平台 AI Runtime。

## 9. 官方示范插件

便签是首个 consumer：它只总结当前内容，展示流式文本，且不会自动写回便签。多轮模型对话以官方插件 `official.widgets.ai-chat`（AI 对话）形态提供，是第一个多轮对话 consumer，产品口径见 `docs/product/tabora-ai-chat-plugin-prd.md`；工具调用、审批与自动执行仍属后续协议范围。

## 10. 权限与安全

### 10.1 权限分层

P0 只有调用模型这一层：插件是否拥有 `ai.generate`。后续上下文、工具和执行权限需在各自协议落地时设计。

### 10.2 安全原则

- 插件不能选择 provider、读取 API key 或请求可执行工具函数。
- 云端平台 API key 只在服务端环境/secret manager；Web/Extension 自定义 key 仅客户端本机保存；FNOS key 仅设备服务端保存。
- 云端临时自定义请求不持久化、不回显、不记录密钥，并进行 SSRF 防护。
- AI 错误只影响本次请求，不导致插件崩溃。

## 11. 失败状态

MVP 必须覆盖：

- 未配置模型：提示去 AI 设置。
- Provider 测试失败：显示具体错误摘要，不暴露密钥。
- 未登录内置模型：提示登录。
- 云端不允许的自定义 URL：显示不暴露网络细节的拒绝提示。
- 流式响应中断：保留已生成内容，并允许重试。

## 12. 验收标准

第一阶段完成后应满足：

- 用户可以在设置中心查看内置模型状态，或按宿主编辑允许的自定义 provider。
- 插件可以通过平台 Runtime 调用 AI，而不是自己保存密钥或直接请求模型。
- 便签可作为 AI consumer 调用平台能力并展示文本总结。
- 未配置、未登录、请求失败、流式中断都有清晰降级。
- AI 能力不破坏插件边界：业务能力仍在插件，平台只提供通用文本 runtime 与权限。

## 13. 分阶段路线图

### P0：AI 基础设施闭环

- AI 协议类型与 manifest `ai` 权限。
- `@tabora/ai-runtime` TanStack AI 服务端 gateway。
- `context.ai.generate` 和 `context.ai.stream`。
- 未配置和 provider 失败的归一化错误。

P0 模型策略：云端内置 OpenAI-compatible 模型由服务端环境配置，仅登录用户可调用；云端自定义 provider 免登录、密钥仅在每次请求内存中使用；FNOS 只支持设备共享的自定义 provider。

P0 尚未完成的能力：Agent 工具、审批、工作区上下文、视觉模型和额度产品化。

### P1：Agent 最小协议

- 工作区上下文摘要。
- Agent action 声明。
- 工具调用草案。
- 用户确认后执行。
- 官方工作台助手插件。

### P2：插件 AI 示例

- 便签总结和提取待办。
- 待办拆解和步骤生成。
- `⌘K` 中展示 agent action。
- 插件 AI 授权面板。

### P3：增强能力

- 视觉模型支持图片类插件。
- 更细的上下文授权。
- 本地 agent 调用日志。
- 多 agent 插件共存。
- 用量统计和请求限制。

## 14. 开放问题

- AI Gateway 的密钥保存位置和加密策略是否需要区分 web、extension 和未来 desktop。
- AI provider 是否允许插件声明推荐模型，还是只由用户全局选择。
- 工作区摘要的字段粒度如何标准化，避免泄露插件私有内容。
- Agent 工具调用日志保留多久，是否支持用户清空。
- 插件 AI 授权是按插件、按 agent、按工具，还是三者组合。
- 视觉模型能力是否进入第一阶段，还是只保留默认视觉模型配置入口。
