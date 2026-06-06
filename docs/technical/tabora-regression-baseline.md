# Tabora 回归基准与 Agent 友好工程治理标准

版本：V1.1

日期：2026-06-06

状态：作为每轮迭代后的回归检查基准；当前实现债务见 §10。

关联文档：

- 文档地图：`docs/README.md`
- Agent 约束：`AGENTS.md`
- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 设计事实源：`DESIGN.md`
- 设计实现映射：`docs/product/tabora-design-system.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`

## 1. 文档目标

本文件定义 Tabora 每轮迭代后的回归基准，目标是防止产品、设计、架构和代码在持续迭代中逐步漂移。

它不是一次性 QA 清单，而是一套可重复执行的工程治理标准：

- 人类开发者用它判断一轮迭代是否可以合入。
- Codex / Claude Code / Copilot / Gemini 等 coding agent 用它判断应该读哪些事实源、跑哪些命令、检查哪些风险。
- 后续新增 CI、E2E、视觉回归或发布流程时，以本文件为基准补齐自动化。

核心原则：

> 回归基准必须分层、可执行、可留证据。能自动化的检查优先自动化；不能自动化的检查必须有明确的人类或 agent 检查路径。

## 2. Agent 友好设计原则

本节结合 OpenAI Codex `AGENTS.md`、Anthropic Claude Code `CLAUDE.md` / best practices、GitHub Copilot repository instructions、Google Gemini CLI `GEMINI.md` 等公开最佳实践，抽象为适合 Tabora 的 agent 工作方式。

### 2.1 指令文件短而稳定

仓库级指令应回答：

- 这个项目是什么。
- 哪些文档是事实源。
- 哪些命令必须使用。
- 哪些边界不能破坏。
- 完成工作前必须留下什么验证证据。

不要把所有历史设计、阶段计划和任务细节塞进 agent 指令文件。大文件会增加上下文噪声，也会让 agent 难以判断当前事实源。

Tabora 当前做法：

- `AGENTS.md` 保留仓库级硬规则。
- `docs/README.md` 作为文档地图。
- 产品、设计、技术和回归基准拆成独立事实源。

### 2.2 上下文分层，按任务读取

Agent 每轮不应无差别读取所有文档。正确路径是：

1. 先读 `AGENTS.md` 和 `docs/README.md`。
2. 根据任务类型读取 PRD、设计事实源、技术方案、官方插件设计或本回归基准。
3. 再读相关源码和测试。

这样可以减少“旧计划覆盖当前事实”的风险。

### 2.3 验证命令比口头承诺可靠

Agent 最终回复不能只说“应该没问题”。每轮必须报告实际运行过的命令和结果。

Tabora 当前最低验证要求：

- 文档或配置变更：`pnpm check`
- package / app 代码变更：`pnpm test` + `pnpm check`
- 跨包、协议、存储、发布相关变更：追加 `pnpm build`
- 前端视觉 / 交互变更：启动 playground，并用浏览器检查关键路径

### 2.4 小步提交语义，小范围上下文

Agent 更适合处理边界清晰的任务。每轮任务应尽量声明：

- 改动类型。
- 影响包或目录。
- 不允许触碰的边界。
- 必须通过的回归层级。

如果一个任务同时涉及协议、storage、shell、UI 和发布，应该拆成多个可独立验证的阶段。

### 2.5 事实源必须随实现同步

如果实现改变了产品范围、技术边界、协议字段、设计规则或验证方式，必须同步对应事实源。不能只改代码，也不能只改计划文档。

同步优先级：

1. `docs/README.md`：新增事实源或入口时先登记。
2. PRD / 官方插件设计：产品口径变化。
3. `DESIGN.md` / 设计实现映射：视觉、交互、组件边界变化。
4. 技术方案：包边界、运行机制、协议、存储、权限变化。
5. 本文档：回归基准、检查项、已知债务、命令矩阵变化。

计划文档治理：

- `docs/superpowers/**` 默认视为阶段记录或归档计划，不作为当前事实源。
- 只有用户明确要求继续某个 plan / spec，才把对应文件作为当前任务输入。
- plan 执行完成后，不能让未勾选步骤继续作为默认待办残留；需要把真实完成状态同步到 PRD、设计、技术方案或本文档。
- 历史计划如果与当前事实源冲突，以当前事实源和当前代码为准。

### 2.6 Agent 输出必须可审计

每轮结束时，agent final 回复至少包含：

- 改了什么。
- 跑了什么验证命令。
- 哪些检查未跑以及原因。
- 是否有已知风险或剩余债务。

如果发现文档与实现冲突，应说明冲突点和处理方式。

## 3. 改动分类

每轮迭代开始前先分类。一个 PR / 任务可以命中多个类型。

| 改动类型       | 示例                                                         | 必跑层级                         |
| -------------- | ------------------------------------------------------------ | -------------------------------- |
| `docs`         | 文档、规格、计划、README                                     | L1 + L3                          |
| `protocol`     | `plugin-api` 类型、schema、manifest 字段                     | L1 + L2 + L3 + L6 + L7           |
| `kernel`       | plugin kernel、runtime context、event bus、permission bridge | L1 + L2 + L3 + L6 + L7           |
| `storage`      | Dexie schema、repository、import/export、workspace preset    | L1 + L2 + L3 + L6 + L7           |
| `orchestrator` | layout switcher、drag sort、command、settings、toast model   | L1 + L2 + L3 + L4 + L7           |
| `shell`        | playground / extension App、host adapters、workbench-shell   | L1 + L2 + L3 + L4 + L5 + L6 + L7 |
| `plugin`       | official/community widget、layout、search、settings panel    | L1 + L2 + L3 + L4 + L5 + L7      |
| `ui`           | `@tabora/ui`、主题 token、CSS、视觉交互                      | L1 + L3 + L4 + L5 + L7           |
| `quality`      | lint/test/build 配置、依赖、tsconfig、workspace 脚本         | L1 + L3 + L7                     |
| `release`      | workflow、build、extension zip、部署配置                     | L1 + L3 + L8                     |

## 4. 分层回归基准

### L0：回归范围判定

每轮先回答：

- 这轮触碰了哪些目录？
- 是否改变产品口径？
- 是否改变协议或数据模型？
- 是否改变 shell / host capability / 权限路径？
- 是否改变 UI、布局、交互或 token？
- 是否影响 playground、extension 或未来 shell 的复用边界？

建议命令：

```bash
git status --short --untracked-files=all
git diff --stat
```

如果工作区已有用户改动，不要回滚。只检查自己的改动范围，并在 final 中说明。

### L1：事实源一致性

检查本轮改动是否需要同步文档。

| 变化                                     | 必查文档                                     |
| ---------------------------------------- | -------------------------------------------- |
| MVP 范围、用户流程、验收标准变化         | PRD                                          |
| 官方插件职责、默认装配、插件交互变化     | 官方插件设计                                 |
| token、视觉、组件语义、可访问性变化      | `DESIGN.md` + 设计实现映射                   |
| 包边界、协议、runtime、storage、权限变化 | 技术方案                                     |
| 回归命令、风险基准、已知债务变化         | 本文档                                       |
| 新增事实源或计划入口                     | `docs/README.md`                             |
| 阶段计划完成、废弃或归档                 | `docs/README.md` + 对应 plan / spec 顶部状态 |

通过标准：

- 没有新增未登记的事实源。
- 没有“文档说已完成、实现未完成”的新矛盾。
- 如果保留已知矛盾，必须在 §10 或相关计划中登记。
- 默认阅读路径不包含已完成 implementation plan。

### L2：架构边界检查

每轮涉及代码时都要检查架构边界。

#### 核心包边界

- `@tabora/plugin-api` 只定义协议、类型和 schema，不放运行时逻辑或业务 UI。
- `@tabora/platform-kernel` 只放插件生命周期、registry、event bus、runtime context、permission bridge，不硬编码搜索源、便签、待办、天气、背景分类等业务。
- `@tabora/storage` 只封装 IndexedDB / repository / adapter，插件业务数据不得混入 workspace 装配数据。
- `@tabora/theme` 只负责应用 theme contribution token。
- `@tabora/ui` 只提供插件内容区基础组件，不提供宿主容器。
- `@tabora/official-plugins` 只表达官方插件 pack，不决定 shell 默认 builtin 装配。
- `@tabora/builtin-plugin-registry` 是 shell 默认 builtin 聚合入口，不承载 runtime。

#### 插件边界

- 插件不得依赖 `@tabora/workbench-shell`、`@tabora/storage`、app 源码或 app package。
- 插件不能直接创建全局 modal / fullscreen / settings host。
- 插件不能直接操作 workspace store。
- 插件不能直接 `window.open` 或裸 `<a target="_blank">` 绕过权限桥。
- widget 必须声明 `supportedSizes`、`defaultSize`、view id；实例必须显式保存 `size`。

#### Shell 边界

- shell 负责 DOM 挂载、host capability、宿主容器、错误边界、全局生命周期。
- shell 不应继续堆业务推断逻辑。
- playground 与 extension 的共享逻辑应进入 `@tabora/workbench-app`、`@tabora/host-adapters` 或其他独立 package。
- extension 不应长期通过相对路径 import playground helper。

建议检查命令：

```bash
pnpm check:architecture
```

脚本当前覆盖插件禁用依赖、`@tabora/ui` 分层依赖、core package 误引 app、插件裸外部打开、package `exports` / `publishConfig.exports` 与 `vp pack` entry 一致性、生产源码 type escape、非宿主执行点 `window.open` 以及 focused/skipped tests。需要人工复核时，再补充定向 `rg`。

### L3：自动化基础门禁

#### 文档或配置变更

```bash
pnpm check
```

#### package / app 代码变更

```bash
pnpm test
pnpm check
```

#### 跨包、协议、storage、发布相关变更

```bash
pnpm test
pnpm check
pnpm build
```

通过标准：

- 命令退出码为 0。
- 如果失败，不能声称完成；必须说明失败命令、失败原因和下一步。
- 如果某个命令因环境限制未运行，必须在 final 中说明。

### L4：产品关键路径冒烟

前端、shell、layout、official plugin、settings、search、storage 改动必须做 L4。

关键路径：

- 默认工作台首屏渲染，不是 landing page。
- Dashboard 布局可见：轻 rail、常驻搜索、主网格。
- Stream 布局可切换，卡片数据保留。
- 添加 widget 成功，新卡片追加到网格末尾。
- widget 支持多实例和多尺寸。
- 右键菜单包含尺寸、展开、移除；当前尺寸高亮。
- 双击 widget 打开展开视图，Esc 可关闭。
- 搜索栏和 `⌘K` 命令面板可用。
- `@provider query` 能路由到目标搜索源。
- 设置中心可打开，通用、外观、搜索、插件、关于五类可切换。
- 主题和背景切换可持久化。
- 导入 / 导出当前 schema 可用，旧 schema 明确拒绝。
- 插件 view 抛错只显示局部错误，不白屏。

建议自动化入口：

```bash
pnpm test:e2e
```

当前 `pnpm test:e2e` 已覆盖：

- 默认工作台首屏、添加 widget、尺寸菜单、展开视图、设置抽屉、拖拽排序。
- 搜索 external-open 允许/拒绝路径。
- Quick Links 通过 host callback 打开外链，而非裸 `<a target="_blank">`。
- safe layout fallback、搜索入口和设置入口可达。
- `1280x900`、`768x900`、`390x844` 三档无横向滚动断言。

如果 E2E 未覆盖本轮风险，需手动启动 playground 检查：

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

### L5：设计、视觉、交互和可访问性

UI / layout / shell / `@tabora/ui` / official plugin 改动必须做 L5。

检查标准：

- 对齐 `DESIGN.md`，第一屏是可用工作台。
- 明亮和暗色主题都可读。
- 页面和插件内容使用语义 token，不硬编码大面积颜色。
- 插件内容区控件优先使用 `@tabora/ui`。
- 宿主容器不放进 `@tabora/ui`。
- 卡片 hover / focus / dragging 不改变外部尺寸。
- 移动端无横向滚动。
- 表单输入有 label 或 aria-label。
- 可点击元素有 hover、focus-visible 和 pointer cursor。
- 新 UI 图标优先 `lucide-solid`，不使用 emoji 作为功能图标。
- 右键、展开、设置、命令面板、Toast 的浮层层级不冲突。

建议浏览器检查视口：

- Desktop：1280 x 900
- Tablet：768 x 900
- Mobile：390 x 844

其中移动端和窄屏无横向滚动可优先依赖 `pnpm test:e2e` 的浏览器断言；视觉细节、hover/focus 样式和复杂层级冲突仍需人工复核。

### L6：安全、权限和数据隔离

涉及 `runtimeContext`、permission bridge、host capability、plugin loader、storage、workspace import/export、外部打开路径时必须做 L6。

检查标准：

- `context.permissions.openExternal(url)` 按 manifest `external-open` hosts 校验。
- shell 注入给 widget/search/settings 的 `host.openExternal` 不得绕过权限。
- 插件不直接 `window.open`。
- 插件不直接渲染会绕过权限模型的外部打开入口。
- 权限拒绝只影响局部，不导致 shell 崩溃。
- `remote-untrusted` source 不执行代码。
- 缺失 `apiVersion` 的 manifest 被拒绝。
- future major API version 被 skipped/rejected。
- host platform / capability 不满足时插件 skipped，并在插件管理器展示原因。
- plugin data 按 plugin / workspace / instance scope 隔离。
- 导入 workspace 必须包含当前 schema 必填字段，例如 `activeBackgroundProviderId`。
- widget instance 缺失 `size` 或 size 不在 `supportedSizes` 内时显示局部无效占位，不读取时补默认值。

建议检查命令：

```bash
rg -n "window\\.open|target=\"_blank|openExternal|external-open|remote-untrusted|apiVersion" apps packages plugins
```

### L7：代码与工程质量

所有 package / app / plugin 代码变更都必须做 L7。文档变更如果修改了工程规则、脚本、CI 或质量标准，也必须做 L7 的相关部分。

本层目标不是追求抽象数量，而是保证代码可理解、可测试、可替换、可被 agent 稳定修改。

标准入口：先运行 `pnpm quality`，再按子项需要补充 `pnpm check`、`pnpm test` 或定向 `rg`。

#### L7.1 TypeScript 与类型契约

检查标准：

- 公共 API、manifest schema、view props、storage schema 使用显式类型或 Zod schema，不依赖隐式 `any`。
- 不用 `as any`、双重断言或非空断言绕过协议；确有必要时必须局部化，并说明边界来源。
- discriminated union 优先于字符串散落判断。
- package 导出面稳定，新增导出要有明确消费者；不暴露内部 helper 作为长期公共 API。
- 类型和 runtime 校验保持一致：协议字段改动必须同步 `manifestSchema` / workspace schema / 测试。

建议检查：

```bash
pnpm quality
pnpm check
rg -n "\\bas any\\b|@ts-expect-error|@ts-ignore|!\\." apps packages plugins
```

命中不一定都是错误，但新增命中必须逐项解释。

#### L7.2 模块职责与复杂度

检查标准：

- 一个模块只承担一个清晰责任：协议、编排、宿主容器、插件内容、存储、样式不要混写。
- 优先复用现有 package / helper；新增抽象必须减少真实重复或隔离明确风险。
- 避免“上帝组件”：大型 Solid 组件新增逻辑时，应优先下沉为纯模型、hook/helper 或子组件。
- 业务能力默认进入插件；平台层只保留通用机制。
- 不做顺手重构；与本轮无关的重排、重命名、格式 churn 不进入同一轮。

建议检查：

```bash
pnpm quality
find apps packages plugins -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -nr | head -20
```

原则：

- 新增 `TODO/FIXME/HACK` 需要有 owner、触发条件或后续计划；不能作为模糊欠账。
- `console.warn` / `console.error` 只用于可诊断错误；不要用 console 替代用户可见 fallback 或测试。

#### L7.3 Solid 前端实现质量

检查标准：

- 使用 Solid 细粒度响应式：派生状态优先 `createMemo`，副作用放 `createEffect`，不要用 effect 同步可直接计算的状态。
- 事件监听、timer、observer、storage subscription 必须有清理路径。
- 组件 props 保持小而稳定；跨层回调命名表达业务语义，不传递宿主内部 store。
- 列表渲染有稳定 key / identity；拖拽、排序、多实例不能依赖数组 index 作为业务身份。
- UI 状态、持久化状态和插件业务数据分层清晰。
- 错误 fallback 是局部 UI 状态，不把异常吞掉后静默失败。

建议检查：

```bash
rg -n "addEventListener|setInterval|setTimeout|ResizeObserver|MutationObserver|createEffect|createMemo|For each" apps packages plugins
```

涉及监听或异步副作用时，必须确认有 `onCleanup`、取消标记或等价清理。

#### L7.4 测试质量

检查标准：

- 纯模型、协议解析、storage、permission、orchestrator 必须优先有单元测试。
- UI 测试以用户行为和可访问查询为主，不测试实现细节。
- 修 bug 时补能失败的回归测试；高风险修复需要确认测试能覆盖原始症状。
- snapshot 不能替代行为断言；只用于稳定且有审查价值的结构。
- 测试数据使用 builder / fixture，避免每个测试手写不完整 manifest 或 workspace。
- 异步测试必须等待明确状态，不用固定 sleep 掩盖竞态。

建议检查：

```bash
pnpm test
pnpm check:architecture
```

如果本轮代码改动没有新增测试，final 必须说明原因，例如纯文案、死代码删除、已有测试覆盖的机械调整。

#### L7.5 依赖与包管理

检查标准：

- 只使用 `pnpm`，不引入 npm/yarn lockfile。
- 新依赖必须说明用途、所属层级和替代方案；优先 workspace 现有能力。
- app / shell 依赖可以比核心包更宽；核心包依赖必须保守。
- 插件不得依赖宿主容器、storage 或 app 源码；`@tabora/ui` 不得依赖 kernel/storage/official plugins/apps。
- package `exports` 和 `publishConfig.exports` 保持一致；未来可发布包不能只靠源码路径隐式消费。
- catalog 依赖优先沿用 workspace catalog，不随意散落具体版本。

建议检查：

```bash
git diff -- package.json pnpm-lock.yaml pnpm-workspace.yaml "**/package.json"
pnpm check:architecture
```

#### L7.6 CSS、Token 与样式工程

检查标准：

- 大面积颜色、背景、边框、阴影优先使用 theme token / CSS variables。
- 插件内容区控件优先使用 `@tabora/ui`，不重复造基础按钮、输入、选择器、错误状态。
- 宿主容器样式留在 shell / workbench-shell / layout package，不塞进插件内容组件。
- CSS class 命名有模块归属，避免全局通用词污染。
- hover/focus/dragging 不改变布局尺寸；移动端不引入横向滚动。
- 新 CSS 不使用 `!important` 作为常规覆盖手段。

建议检查：

```bash
pnpm quality
```

命中颜色不一定错误，但新增大面积视觉必须能解释为什么不用 token。

#### L7.7 性能与资源

检查标准：

- 默认新标签页首屏路径避免重计算、大同步循环和不必要的大依赖加载。
- 搜索输入、拖拽、滚动、resize 等高频路径不得执行昂贵全量扫描；必要时使用 memo、索引或节流。
- IndexedDB 读写避免在渲染路径重复触发；批量更新要考虑事务和失败回退。
- 图片、图标和样式资源按需进入对应 app/package，避免把官网或 demo 资源带进 extension 新标签页。
- 新增第三方库要关注包体、运行时开销、浏览器兼容和 extension 限制。

建议检查：

```bash
pnpm build
rg -n "JSON\\.parse|JSON\\.stringify|localStorage|indexedDB|querySelectorAll|getBoundingClientRect" apps packages plugins
```

命中高频路径相关 API 时，必须确认调用频率和缓存策略。

#### L7.8 可维护性与 Agent 友好性

检查标准：

- 文件、函数、类型命名表达领域含义，不用 `utils.ts` 堆无归属逻辑。
- 关键协议和复杂模型有邻近测试，比长注释更优先。
- 注释解释“为什么”，不复述“做什么”。
- 新增文档入口必须在 `docs/README.md` 登记；历史计划不得回到默认阅读路径。
- final / PR 描述能说明风险、验证和未覆盖项，便于下一轮 agent 接续。

### L8：发布前回归

发布 playground 前：

```bash
pnpm check
pnpm test
pnpm test:e2e
pnpm build
pnpm --filter @tabora/playground build
```

发布 extension 前：

```bash
pnpm check
pnpm test
pnpm build
pnpm --filter @tabora/extension zip
pnpm --filter @tabora/extension zip:firefox
```

发布前还需确认：

- Chrome / Firefox 扩展权限说明与 manifest 一致。
- store listing 截图和隐私说明没有过时。
- GitHub Actions secrets / variables 配置完整。
- 构建产物来自干净工作区或明确的 release commit。

## 5. 最低自动化覆盖标准

当前 CI 已覆盖：

- `pnpm check:architecture`
- `pnpm check`
- `pnpm test`
- `pnpm build`

Nightly CI 已覆盖：

- `pnpm test:e2e`

当前 browser smoke 已覆盖：

- 默认 dashboard 工作台关键操作。
- 搜索/Quick Links 外部打开权限路径。
- safe layout fallback 可达性。
- `1280x900`、`768x900`、`390x844` 无横向滚动。

本地脚本已覆盖：

- `pnpm check:architecture`：L2 + L7 的高信号架构/边界静态扫描。
- `pnpm quality`：L7 的类型逃逸、issue markers、大文件、raw color、external-open 信号报告；raw color 当前按 `workbench production / generated backgrounds / site styles / test fixtures` 分组，external-open 当前按 `host execution / capability reference / test fixture / bypass risk` 分组，并按文件级信号去重计数。截止 2026-06-06，raw color 四类命中均已清零，当前仓库已没有剩余 raw color / `!important` 报告项。
- `pnpm check:architecture` 已于 2026-06-06 将 `workbench production` raw color 基线收敛到 0，重新引入任何字面量颜色或 `!important` 都会直接失败；其余类别继续通过 `pnpm quality` 审计是否回归。
- `pnpm check:architecture` 同时禁止 workbench 生产样式里的零透明度 `rgba(...)` 和宿主题色变量字面量 fallback；前者统一改为 `transparent`，后者直接依赖宿主主题 token。

建议后续逐步补齐：

1. 按路径触发策略把 `pnpm test:e2e` 从 nightly 继续推进到 PR 强门禁。
2. 为 permission bridge 增加专门回归测试。
3. 为 playground / extension shell helper 复用边界增加依赖守卫。
4. 为 workspace preset 的 plugin id / contribution id 增加 contract test。
5. 将 `pnpm test:e2e` 从单一 dashboard smoke 扩展到更多 layout / settings / import-export 场景。
6. 为 layout failure fallback 的更多变体和触屏拖拽策略补细粒度浏览器断言。
7. 在 `check:architecture` / `quality` 之上继续扩展 package exports、mobile layout 和 layout failure fallback 的自动化守卫。

## 6. Agent 每轮工作流

### 6.1 开始前

Agent 必须：

1. 运行：

   ```bash
   git status --short --untracked-files=all
   ```

2. 读取 `docs/README.md`，判断应该继续读哪些事实源。
3. 根据任务分类选择回归层级。
4. 如果任务涉及 UI，优先读取 `DESIGN.md`。
5. 如果任务涉及协议、runtime、storage、shell，优先读取技术方案和本文档。

### 6.2 修改中

Agent 应：

- 优先使用 `rg` / `rg --files` 搜索。
- 优先使用现有 package 和 helper，不发明平行抽象。
- 修改前判断是否触碰事实源。
- 不回滚用户或其他 agent 的改动。
- 小范围修改，不做无关重构。
- 对风险较高的行为先写测试或补测试。

### 6.3 完成前

Agent 必须：

- 按本文件 L3-L8 运行对应命令。
- 如果变更了事实源，同步 `docs/README.md`。
- 用 §8 模板形成回归摘要。
- 在 final 回复中说明验证命令和未覆盖风险。

## 7. 质量门禁判定

### 7.1 `pass`

满足：

- 本轮触发的所有自动化命令通过。
- 必要的人工 / 浏览器冒烟完成。
- 文档事实源已同步。
- 没有新增未登记债务。

### 7.2 `pass with known debt`

允许条件：

- 新债务不影响当前用户主路径或安全底线。
- 债务已在本文档、计划文档或 issue 中登记。
- final 回复明确说明。

安全、权限、数据丢失、白屏、发布包不可用等问题不能用这个状态放行。

### 7.3 `blocked`

任一情况即 blocked：

- `pnpm check`、`pnpm test`、必要的 `pnpm build` 失败。
- 权限桥被绕过。
- 插件错误导致整页白屏。
- 数据迁移或导入会静默丢数据。
- 文档与实现产生新的关键矛盾且未同步。
- 发布构建不可用。
- 新增 focused test（`it.only` / `test.only`）、无解释的 skipped test、协议 / 权限路径上的 `as any` 绕过。
- 新增跨层依赖违规，例如插件依赖 app 源码、`@tabora/ui` 依赖 kernel/storage。
- 新增未清理的全局事件监听、timer、observer，且处于可重复打开/关闭的 UI 路径。

## 8. 回归报告模板

每轮迭代 final 回复或 PR 描述建议使用：

```md
## Regression Baseline

改动类型：

- docs / protocol / kernel / storage / orchestrator / shell / plugin / ui / release

事实源同步：

- PRD:
- 官方插件设计:
- DESIGN:
- 技术方案:
- 回归基准:
- docs/README:

自动化验证：

- pnpm check:architecture:
- pnpm quality:
- pnpm regression:summary:
- pnpm check:
- pnpm test:
- pnpm build:
- pnpm test:e2e:

代码与工程质量：

- 类型 / lint 新增豁免:
- 测试覆盖变化:
- 依赖 / package 导出变化:
- 架构边界扫描:
- 性能 / 高频路径风险:

人工 / 浏览器冒烟：

- 默认工作台:
- 布局切换:
- 添加 / 尺寸 / 拖拽 / 右键 / 展开:
- 搜索 / 命令面板:
- 设置中心:
- 主题 / 背景:
- 权限路径:
- 错误边界:

风险和债务：

- 新增债务:
- 已知债务受影响:
- 未验证项:

结论：

- pass / pass with known debt / blocked
```

## 9. 常见任务的回归选择

### 修改官方 widget

必做：

- L1：官方插件设计与 `DESIGN.md` 是否需要同步。
- L2：插件不得依赖 shell/storage/app。
- L3：`pnpm test` + `pnpm check`。
- L4：添加、多实例、尺寸、展开、右键。
- L5：明暗主题、移动端、控件语义。
- L7：组件职责、测试质量、CSS token、性能高频路径。

### 修改 layout package

必做：

- L1：PRD / 设计实现映射 / 技术方案是否需要同步。
- L2：layout 只依赖公开 contract。
- L3：`pnpm test` + `pnpm check` + `pnpm build`。
- L4：Dashboard / Stream / 第三方 layout 切换。
- L5：横向滚动、卡片可读性、全局入口可达。
- L7：layout 纯协议依赖、region 身份稳定、拖拽/resize 高频路径。

### 修改 runtime context 或 permission bridge

必做：

- L1：技术方案和本文档同步。
- L2：platform-kernel 不引入业务逻辑。
- L3：`pnpm test` + `pnpm check` + `pnpm build`。
- L6：权限拒绝、host callback、插件直接外部打开扫描。
- L7：类型契约、runtime 校验、回归测试和公共导出面。

### 修改 workspace / storage / import-export

必做：

- L1：技术方案同步数据模型。
- L2：workspace 装配数据、instance 状态、plugin data 分层。
- L3：`pnpm test` + `pnpm check` + `pnpm build`。
- L4：跨会话恢复、导入导出、布局切换数据保留。
- L6：缺失当前 schema 字段拒绝，不 silent backfill。
- L7：schema 类型一致性、事务边界、测试 fixture 完整性。

### 修改 CI / 发布流程

必做：

- L1：部署 / 分发文档同步。
- L3：`pnpm check`。
- L7：脚本、依赖、缓存、workspace 命令语义。
- L8：对应 app build / zip。

## 10. 当前已知债务基线

以下债务来自 2026-06-05 对技术方案落地情况的审查。后续每轮迭代如果触碰相关区域，必须优先修正或确认没有扩大影响面。

| 债务                                                                                   | 影响                                                                           | 建议优先级 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| shell 注入的 `host.openExternal()` 可绕过插件 manifest 权限                            | 已于 2026-06-06 通过 widget owner manifest 权限校验收口                        | 已解决     |
| `official.widgets.quick-links` 直接渲染 `<a target="_blank">` 且未声明 `external-open` | 已于 2026-06-06 改为声明 `external-open` 并走 host bridge                      | 已解决     |
| 布局切换 snapshot 在实例迁移后生成，不是真正切换前快照                                 | 已于 2026-06-06 改为通过切换前 workspace/instances 生成 snapshot               | 已解决     |
| playground / extension `App.tsx` 高度重复                                              | 多 shell 维护成本高，bug 修复易遗漏                                            | P1         |
| extension 仍通过相对路径 import playground helper                                      | shell 边界未收口                                                               | P1         |
| `SearchViewProps` 尚未升级到技术方案描述的状态机 contract                              | 搜索编排仍分散在插件和 shell                                                   | P2         |
| 拖拽未实现 5px 阈值、实时交换、触屏策略                                                | 与交互原型和技术方案不完全一致                                                 | P2         |
| Expand 不是独立 contribution contract                                                  | 展开能力可用但协议不完整                                                       | P2         |
| workspace preset 的 `plugins` 字段未校验，且存在疑似旧 layout id                       | 默认装配协议校验不完整                                                         | P2         |
| `pnpm test:e2e` 未进入 CI                                                              | 已于 2026-06-06 接入 nightly workflow；PR 路径强门禁仍待按路径策略推进         | 已解决     |
| L7 质量扫描尚未脚本化                                                                  | 已于 2026-06-06 通过 `pnpm check:architecture` / `pnpm quality` 收口高信号扫描 | 已解决     |

## 11. 后续治理建议

短期：

1. 已于 2026-06-06 修复 `external-open` 权限绕过，并补 runtime / shell / quick-links 回归测试。
2. 已于 2026-06-06 修正布局切换 snapshot 时机。
3. 把 extension 复用 playground helper 的路径迁入共享 package。
4. 已于 2026-06-06 接入 nightly workflow；后续按路径触发策略推进 PR 强门禁。
5. 已于 2026-06-06 将 L7 中的高信号扫描收敛为 `pnpm quality` / `pnpm check:architecture`，并在 release workflow 接入 `pnpm regression:summary`。

中期：

1. 将 L2 架构边界检查脚本化，减少人工判断。
2. 给 product critical path 建立 browser-mode smoke tests。
3. 为 mobile no-horizontal-scroll、settings host、layout fallback 加可重复截图或 DOM 断言。
4. 已于 2026-06-06 为依赖边界、package exports、生产源码 type escape、非宿主 `window.open` 和 focused tests 建立自动化守卫；后续继续收紧 CSS token 使用。
5. 让每个计划文档明确对应的回归层级。

长期：

1. CI 按路径触发不同强度的测试矩阵。
2. 发布前自动生成 regression baseline 摘要。
3. 为插件生态引入 manifest contract test kit。
4. 为第三方可信插件建立独立 conformance suite。

## 12. 外部实践参考

本文件参考以下官方公开资料的通用原则，并转化为 Tabora 的本地工程规则。资料核对日期：2026-06-06。

- OpenAI Codex：`AGENTS.md` 用于给 coding agent 提供仓库级说明，例如代码组织、测试命令、项目实践和 PR 约定；Codex 在清晰文档和可靠测试环境中表现更好。参考：[Introducing Codex](https://openai.com/index/introducing-codex/)。
- Anthropic Claude Code：推荐给 agent 明确可运行的验证信号，先探索再计划再编码；`CLAUDE.md` 应短、人类可读，并只保留广泛适用的命令、风格、测试和工作流规则。参考：[Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)。
- GitHub Copilot：repository custom instructions 应短小、自包含，并提供对仓库有用、适用于大多数请求的上下文；大型仓库应避免把太多窄场景内容塞进全局指令。参考：[About customizing GitHub Copilot responses](https://docs.github.com/en/copilot/concepts/prompting/response-customization)。
- Google Gemini CLI：`GEMINI.md` 用于提供持久项目上下文，支持全局、项目、父目录和子目录的分层上下文，也支持通过 import 拆分大文件。参考：[Provide Context with GEMINI.md Files](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html)。
- TypeScript：工程质量以类型契约和 TSConfig 严格检查为基础，协议边界不能靠 `any` 绕过。参考：[TSConfig Reference](https://www.typescriptlang.org/tsconfig/)。
- ESLint：静态检查用于提前发现 JavaScript / TypeScript 代码问题，并应与 type check 一起作为基础门禁。参考：[Getting Started with ESLint](https://eslint.org/docs/latest/use/getting-started)。
- Testing Library：组件测试应尽量接近用户使用方式，优先通过 DOM 和用户行为验证，而不是组件内部实例。参考：[Guiding Principles](https://testing-library.com/docs/guiding-principles/)。
- SolidJS：副作用由 `createEffect` 跟踪响应式依赖，事件监听、timer、observer 等资源需要用 `onCleanup` 或等价方式清理。参考：[createEffect](https://docs.solidjs.com/reference/basic-reactivity/create-effect) 与 [onCleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup)。
- web.dev：前端性能应关注加载、交互和视觉稳定性，Core Web Vitals 提供了可量化的用户体验指标。参考：[Web Vitals](https://web.dev/articles/vitals)。
- W3C WCAG：可访问性检查以 WCAG 2.2 的可感知、可操作、可理解、健壮原则为基准。参考：[WCAG 2.2](https://www.w3.org/TR/WCAG22/)。
- OWASP：前端安全需避免 XSS 和危险外部输入处理，URL、HTML、脚本上下文必须区分。参考：[Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)。

这些实践的共同点是：

- 指令要短、稳定、可版本化。
- 长上下文要分层，通过文档地图按需读取。
- 自动化验证比自然语言承诺可靠。
- 每轮 agent 工作都要留下可审计证据。
- 代码质量标准要能落到类型、测试、依赖、性能、可访问性和安全的具体检查上。
