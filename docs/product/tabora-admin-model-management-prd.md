# Tabora 管理后台模型管理 PRD

关联文档：

- AI Runtime 产品设计：`docs/product/tabora-ai-agent-runtime-design.md`
- AI 对话插件 PRD：`docs/product/tabora-ai-chat-plugin-prd.md`
- 后端实现事实源：`docs/technical/tabora-data-sync-prd.md`（§13 技术实现）
- 设计事实源：`DESIGN.md`
- 后端约束：`apps/app/AGENTS.md`

## 1. 背景

云端内置模型需要持续的后台运营能力：管理员应能查看可用模型、调整上线范围、验证新 provider，并留存可追溯的变更记录，而不是依赖部署配置与服务重启。

本 PRD 定义 `apps/app` 的「模型管理」：把**平台付费的云端内置模型目录**变为后台可管理、可审计、可安全发布的资源。它不新增终端用户模型配置入口，也不是通用 AI 用量或计费控制台。

现有架构边界保持不变：

- 内置模型由平台服务端持有凭据并支付，仅登录用户可调用。
- 用户本机自定义 provider 的 Base URL、模型和 API Key 只保存在当前设备，不进入后台。
- FNOS 设备共享 provider 由设备管理员在 FNOS 管理面配置，不接入云端 `apps/app`。
- 插件只通过 `context.ai` 调用网关，不能选择 provider、读取凭据或直连模型。

## 2. 目标与非目标

### 2.1 目标

- 管理员可查看、新增、修改、删除、上线、下线和测试平台内置的 provider 与文本模型。
- 已登录用户只能经既有 `/api/ai/models` 获得已上线模型目录；网关只可路由到已上线模型。
- API Key 在浏览器、普通 API、审计日志、错误信息和页面回显中均不可见；服务端仅以加密形式持久化。
- 所有写操作经现有 `adminAuthMiddleware` 与 `auditAdminAction`，失败状态明确且可恢复。
- 目录变更无需重启；单模型失败只影响新的 AI 请求，不影响工作台和其他插件。

### 2.2 非目标

首期不做：

- 管理用户本机自定义 provider、FNOS provider 或用户本机模型偏好。
- 计费、套餐、额度、速率限制、按用户/团队配额、账单或供应商采购管理。
- 图片/音频/嵌入、工具调用、模型路由策略、自动 fallback、A/B 实验、提示词管理。
- 自动轮询探活、后台重试、模型自动发现、Provider 市场或批量导入。
- 改变插件 API、`context.ai` 权限或既有五个归一化错误码。

## 3. 用户与使用场景

| 角色 | 需要的能力 | 明确禁止 |
| --- | --- | --- |
| 平台管理员 | 安全上线、下线和验证平台付费文本模型，查看当前目录与最近测试结果。 | 查看已保存 API Key、绕过审计、修改普通用户本机配置。 |
| 已登录用户 | 在 AI 设置和 AI 对话中选择当前上线的内置模型。 | 读取 provider URL/密钥、管理公共目录。 |
| 插件 | 经授权调用宿主选定的模型。 | 枚举后台 provider、指定私密凭据、绕过网关。 |

核心场景：

1. 管理员录入一个 OpenAI-compatible provider，保存密钥后添加一个或多个模型；测试成功后显式上线。
2. 管理员发现某模型质量或成本异常，在确认对话框中下线；用户刷新目录后不再看到它，旧选择在请求时得到 `ai_model_unavailable`。
3. 管理员轮换密钥：编辑页输入新值并保存，页面仅显示“已配置”和更新时间，绝不显示旧值。
4. 管理员排查问题时查看最近一次人工测试快照；打开列表不触发对每个 provider 的网络请求。

## 4. 已确认决策

| 主题 | 决策 |
| --- | --- |
| 管理对象 | 只管理云端内置、OpenAI-compatible 的文本模型。Provider 拥有连接与凭据；模型是可发布路由条目。 |
| 目录真相源 | `apps/app` 数据库是唯一运行时真相源，不提供环境变量目录 fallback 或导入路径。 |
| 职责分层 | Provider 仅管理可复用的端点、凭据与连接可用性；模型管理稳定 ID、上游部署映射及面向用户的发布状态。两者在数据与导航上分层，但“新增模型”可直接选择已有 Provider 并在无可用连接时引导新建。 |
| 发布单位 | 模型独立上下线。一个 provider 可保留连接和其他模型，单模型异常不必下线整个 provider；Provider 的 `active` 表示“连接已启用”，不等同于将任何模型对用户发布。 |
| 初始状态 | 新建 provider/model 默认为 `draft`；测试通过后仍必须显式上线，测试不是发布动作。 |
| 生命周期 | 资源状态为 `draft`、`active`（已上线）、`disabled`（已下线）、`deleted`（已删除）。删除是不可恢复的逻辑删除：从后台常规列表、用户目录与网关路由移除，同时保留最小 tombstone 以防稳定 ID 被复用并维持审计链。 |
| 默认模型 | 后台只管理目录，不新增全局默认模型。宿主继续保存用户本机选择；选择已下线模型时沿用既有引导。 |
| 公开目录 | `/api/ai/models` 保持 `{ models: [{ id, label }] }` 合约，仅返回 `active` 模型，不泄露 URL、密钥、测试错误或内部状态。 |
| 网关路由 | generate/stream 每次请求从当前目录解析 `modelId`。未上线或不存在的 ID 一律为 `ai_model_unavailable`。 |
| 健康状态 | 首期只支持管理员手动测试；列表显示最近测试快照，不在列表渲染、用户请求失败后或后台任务中隐式探测。 |

## 5. 领域模型

### 5.1 Provider

Provider 是一个平台控制的 OpenAI-compatible 服务端点及其服务端凭据。

| 字段 | 规则 |
| --- | --- |
| `id` | 不可变小写 slug，`[a-z0-9-]`，2–40 字符；创建后不可改名。 |
| `label` | 后台显示名称，1–80 字符。 |
| `baseUrl` | 仅接受 HTTPS 公网 URL；禁止用户名、密码、回环/私网/链路本地地址、不可解析域名和重定向目标。保存、测试和实际调用均做 SSRF 防护。 |
| `credential` | API Key 以服务器主密钥加密持久化；只返回 `credentialConfigured` 与更新时间。 |
| `status` | `draft`、`active`（连接已启用）、`disabled`（连接已停用）、`deleted`（已删除）。删除后不可恢复，只能以新 ID 新建。 |
| `lastTest` | 最近人工测试时间、结果、延迟和安全错误分类；不保存请求或供应商原始响应。 |

Provider 为 `disabled` 或 `deleted` 时，其所有模型均不可被网关路由；模型上线时必须拒绝这两种 provider 状态。

### 5.2 模型

模型是用户可选、网关可路由的文本能力，不是供应商完整模型清单。

| 字段 | 规则 |
| --- | --- |
| `id` | 稳定公共 ID，`providerId:upstreamModelId`；创建后不可改，供客户端保存选择和网关路由。 |
| `providerId` | 指向非删除 provider。 |
| `upstreamModelId` | 实际传给 provider 的模型名，1–160 字符；同一 provider 内唯一。 |
| `label` | 用户可见名称，1–120 字符；建议默认为“provider label · upstream model”，可编辑。 |
| `capabilities` | 首期固定 `text`；数据形态为受限枚举，不能从后台标记未实现能力。 |
| `status` | `draft`、`active`（已上线）、`disabled`（已下线）、`deleted`（已删除）。仅自身与 provider 均为 `active` 时出现在目录并可路由。 |
| 时间戳 | `createdAt`、`updatedAt`，用于列表、并发保护与审计关联。 |

模型 ID 一旦创建，不允许复用，即使删除后也不允许；避免旧客户端选择被意外路由到另一模型。

### 5.3 存储与密钥保护

新增 `ai_provider` 与 `ai_model` 表，并由 `schema.spec.ts` 单一事实源派生 SQLite/Postgres DDL；查询按领域放入 `src/server/db/`。Provider 保存密钥密文、密钥版本、状态与测试快照；模型保存稳定 ID、上游模型名、显示名、能力和状态。

凭据保护是上线前置条件：

- 新增 `TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY`。生产环境缺失、无效或密钥版本不可解时，后台拒绝保存 provider，运行时拒绝解密并将模型视为不可用。
- 使用带认证的加密保存 `ciphertext`、`nonce`、`keyVersion`；完整性校验失败不得继续调用 provider。
- 编辑 API Key 为空代表“不修改”；清除密钥为独立危险操作，清除后 provider 自动下线。删除 provider 时，密钥密文、nonce 与所有可解密凭据材料必须立即清除。
- 密钥、密文、nonce、完整 URL 查询参数、测试 prompt、供应商响应体不得进入 API、浏览器状态、错误对象、`audit_log.details`、日志或异常追踪。

首期不做密钥轮换 UI；数据与运行时必须支持按 `keyVersion` 读取，为后续受控轮换预留。

## 6. 功能需求

### 6.1 模型目录页面

后台一级导航新增「模型管理」。页面复用 `AdminShell`、TanStack Query、`Table`、`Dialog`、`Drawer`、`ConfirmDialog` 与 Toast，不新增通用组件。

页面包含：

- 概览数字：active provider、active model、待测试/测试失败模型；只反映目录状态与最近测试快照。
- 模型目录是默认视图：显示稳定 ID、显示名称、关联 Provider、测试与发布状态；可按 Provider 筛选。
- Provider 连接是次级视图：显示名称/ID、连接状态、关联模型数、凭据是否配置、最近测试、更新时间和操作。连接状态与模型发布状态不得混用。
- 关键字、provider、状态筛选；空目录给出「新建 Provider」主操作。
- 状态文字与 Badge 共同表达，不能仅用颜色；页面 loading、空和错误状态布局稳定。

刷新列表不得丢失正在编辑的字段；单个 mutation 成功后只失效模型目录 query。

### 6.2 创建与编辑 Provider

管理员通过 Drawer 创建或编辑 provider：ID（仅创建）、显示名称、Base URL、API Key 与状态。浏览器做格式校验，服务端必做完整重复校验。

- 创建必须填写全部字段；编辑 API Key 可留空保留旧值。
- provider 只有“凭据已配置且最近测试成功”时才可启用；provider 可以先启用为空目录，再逐个发布已测试模型。
- Base URL 或 API Key 变更后，provider 自动回到 `draft`，现有模型从用户目录与路由撤下，直到重新测试并显式上线。不得静默沿用旧发布状态。
- 下线或删除 provider 前显示受影响 active 模型数；确认后立即阻止其所有新请求。删除会同时删除其下全部模型并清除 provider 凭据。

### 6.3 创建与编辑模型

管理员默认从模型目录创建或编辑模型，并选择一个已启用的 Provider 连接；Provider 详情也提供“添加模型”快捷入口。创建时输入上游模型名、显示名和状态；稳定 ID 由服务端 `providerId:upstreamModelId` 生成，客户端不可自定义。

- 同一 provider 的上游模型名不可重复；跨 provider 可同名。
- 在已保存 Provider 的新增模型流程中，管理员可显式从上游 `GET /models` 获取最多 200 个模型 ID；结果只保存在当前浏览器表单中，需选择、测试和显式上线后才写入目录。
- 只有 provider 最近测试成功且已启用时，模型才可上线；provider 未启用时，模型可以编辑但不可上线。
- 下线或删除模型需确认，并提示已保存该选择的用户下次请求会被要求重新选择。
- 任意未删除模型均可删除；删除后从后台常规列表、用户目录与网关路由移除，保留最小 tombstone 与审计链，不提供恢复或 ID 复用。

### 6.4 手动测试

Provider 编辑页提供显式「测试连接」：

- 使用固定、无用户数据、最短可验证的文本请求；不使用工作台会话、系统提示或附件。
- 使用受控超时与最大输出；不写入用户会话、用量或对话记录。
- 成功记录时间和延迟；失败记录安全错误分类与短摘要。不得展示原始供应商 body、请求 headers 或密钥。
- 测试失败不自动改变已发布状态，管理员可修正后重试或主动停用。
- Provider 测试直接使用受保护的 `GET /models`，可在尚未配置模型时验证端点和凭据；模型测试才使用其上游模型发送最短 chat 请求。

### 6.5 新增、修改、上线、下线与删除

新增、修改、上线、下线、删除均是明确操作；上线、下线、删除不能由编辑表单保存隐式触发。

| 操作 | 允许条件 | 结果 |
| --- | --- | --- |
| 新增/修改 provider、模型 | 字段校验通过；修改密钥或端点后需重新测试。 | 保存为 draft 或保持当前非发布状态，不自动上线。 |
| 启用 provider 连接 | 凭据已配置且最近测试成功。 | provider 进入可连接状态；不会自动发布其模型。 |
| 停用 provider 连接 | 任意未删除状态。 | 危险确认并展示影响数；立即阻止对应新请求，可再次启用。 |
| 删除 provider | 任意未删除状态。 | 危险确认并展示下属模型数；事务性删除全部模型、清除凭据，并从常规列表、目录与路由移除。 |
| 上线模型 | provider 为 active 且最近测试成功。 | 模型进入用户目录。 |
| 下线模型 | 任意未删除模型。 | 危险确认并展示稳定 ID；立即从目录与路由移除，可再次上线。 |
| 删除模型 | 任意未删除模型。 | 危险确认并展示稳定 ID；逻辑删除、不可恢复、不可复用 ID，并立即从目录与路由移除。 |

### 6.6 API 与服务端职责

新增管理 server function 置于 `apps/app/src/server/admin/models.ts`；每个函数挂 `adminAuthMiddleware`，写操作另挂 `auditAdminAction`。页面不能直连数据库或保留密钥。

运行时调整：

1. `cloudAiModelsResponse` 从数据库查询 active 模型，保持登录校验与响应形状。
2. `createCloudAiGateway`/请求处理从同一只读目录解析模型与解密凭据，不再从浏览器或运行时环境变量接收内置 provider。
3. 目录读取失败、密钥解密失败或资源未上线/已删除时安全返回 `ai_model_unavailable`；供应商调用异常仍为 `ai_provider_failed`。
4. 自定义 provider 流程及其 HTTPS/SSRF 防护保持不变。

目录可有短时内存缓存，但写 mutation 成功后当前进程必须立即失效；多实例部署的跨进程一致性在技术设计中明确，首期不得用无限缓存或依赖重启生效。

## 7. 权限、安全与审计

### 7.1 访问控制

- 页面 route 的 `beforeLoad` 只改善导航体验；真实授权在每个 admin server function 的 `adminAuthMiddleware`。
- 未登录与非管理员分别以 401/403 拒绝任何管理 server function。
- 普通用户仅可经既有登录态读取 active 模型目录和调用内置模型。

### 7.2 SSRF 与网络边界

管理员配置并不等于可信网络目标。抽取并复用当前云端自定义 provider 的 URL 防护：HTTPS、无内嵌凭据、禁止回环/私网/链路本地/保留地址、DNS 全量解析检查、拒绝重定向。保存、测试和每次真实调用均执行验证，以防 DNS rebinding；请求继续使用 `redirect: "error"`。

策略拒绝在管理端显示为“端点不允许”；用户调用侧只得到 `ai_model_unavailable` 或 `ai_provider_failed`，不得泄露内部网络信息。

### 7.3 审计

新增、修改、密钥替换、测试、上线、下线、删除都必须审计；`resourceType` 为 `ai_provider` 或 `ai_model`，`resourceId` 为稳定 ID。details 只记录非敏感信息和状态变化，例如 ID、旧/新状态、标签变更标记、`credentialChanged: true`、测试结果类别；写入前必须经 `redactSensitive`。

不得记录密钥、密文、URL 查询参数、测试 prompt、供应商 response、完整网络错误或用户数据。

## 8. 失败体验

| 场景 | 管理后台 | 终端用户 / 网关 |
| --- | --- | --- |
| 空目录 | EmptyState，引导新建 provider。 | 内置模型不可选，沿用未配置引导。 |
| 未测试 | 显示“待测试”，禁止发布。 | 不在目录与路由中出现。 |
| 测试失败 | 保留输入与安全摘要，允许修正后重试。 | 已发布状态不自动改变；主动停用后不可用。 |
| 密钥不可用 | 显示“凭据不可用”，禁止上线。 | `ai_model_unavailable`，不泄露原因。 |
| 模型下线/删除 | 确认后刷新目录；删除项从常规列表消失，审计链仍可追溯。 | 新请求为 `ai_model_unavailable`。 |
| Provider 上游故障 | 列表不自动探测或改状态。 | 本次请求为 `ai_provider_failed`，局部影响会话。 |
| 并发编辑 | 用 `updatedAt` 乐观并发校验，不覆盖他人改动。 | 无影响。 |

管理端错误用字段级 `InlineError` 或区域错误呈现；Toast 仅用于完成后的非阻塞反馈。下线、删除和清除密钥均需含目标 ID 的确认 Dialog；删除 provider 还须展示将一并删除的模型数。

## 9. 发布与初始化

数据库目录是唯一运行时真相源。初始化发布时：

1. 部署数据库 schema 与加密能力，并配置 `TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY`。
2. 在管理后台将 Provider 与模型写为 `draft`；页面只接受一次 API Key 输入，不会回显。
3. 管理员逐个测试并显式上线要发布的资源。

没有 active 模型是预期的安全状态；用户本机自定义 provider 不受影响。紧急下线优先下线模型；恢复目录应恢复加密保护的数据库备份。

## 10. 验收标准

- 管理员可创建和编辑 provider、添加和编辑多个模型、测试连接，并满足条件后显式发布。
- 未登录与非管理员不能调用任一模型管理 server function；所有写操作有脱敏审计记录。
- API Key 只在写入时出现，之后页面、管理响应、审计、日志和错误均不可见。
- `/api/ai/models` 只为已登录用户返回 provider/model 均为 `active` 的 `{ id, label }`；既有合约不变。
- 新增、修改、上线、下线、删除 provider 或模型均有独立受鉴权 API 与后台操作入口；删除 provider 会逻辑删除其模型并清除凭据。
- 下线/删除 provider 或模型后，新请求立即不能路由到它并返回 `ai_model_unavailable`；其他模型与插件不受影响。
- 变更 Base URL 或凭据后必须重新测试并发布，不能沿用旧发布状态。
- 保存、测试与实际调用均拒绝不安全 URL 和重定向，没有请求可使服务端访问内网地址。
- 测试请求不含用户数据，列表不触发 provider 请求。
- 数据库是模型目录唯一的运行时真相源。
- 自定义 provider、FNOS provider、AI 对话、便签 AI consumer 与五个错误码回归通过。
- 页面亮/暗主题与窄屏可用、无横向滚动；输入和图标操作有可访问名称，危险动作有确认。

## 11. 实施边界与验证

实现复用既有边界：

- 复用 `@tabora/ai-runtime` 的模型解析与归一化错误码，只替换云端 builtin 目录来源。
- 复用 admin middleware、审计脱敏、TanStack Query、`AdminShell`、Table/Drawer/Dialog/ConfirmDialog 和既有数据库 schema 派生机制。
- 抽取 `validateCloudCustomProvider` 的通用 URL/SSRF 校验，同时供自定义和后台管理 provider 使用，不复制安全规则。

新增表、路由、导航、AI server 修改均扩展既有文件；不新增 workspace package、公共插件 export 或第三方依赖。

实现前补充技术设计，明确加密库和密钥轮换运行方式、双数据库 migration、跨进程缓存失效、URL 测试夹具与导入命令。并在浏览器验证管理员完整流程、未登录/非管理员拒绝、密钥不回显、下线后模型目录刷新及 AI 请求失败路径。
