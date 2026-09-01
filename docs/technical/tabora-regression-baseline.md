# Tabora 回归基准与 Agent 友好工程治理标准

本文件是每轮迭代后的回归检查基准。当前未解决实现债务以 git 历史与 issue 为准，登记方式见 §10。

## 1. 文档目标

本文件定义 Tabora 每轮迭代后的回归基准，防止产品、设计、架构和代码在持续迭代中逐步漂移。它不是一次性 QA 清单，而是可重复执行的工程治理标准：人类开发者用它判断迭代能否合入，coding agent 用它判断读哪些事实源、跑哪些命令、检查哪些风险，后续 CI / E2E / 视觉回归 / 发布流程以它为基准补齐自动化。

核心原则：

> 回归基准必须分层、可执行、可留证据。能自动化的检查优先自动化；不能自动化的检查必须有明确的人类或 agent 检查路径。

## 2. Agent 友好设计原则

通用原则以 `AGENTS.md` 为准：指令文件短而稳定、上下文分层按需读取、验证命令优先于口头承诺、小步提交、事实源随实现同步、输出可审计。本节只保留回归基准相关的落点。

- 读取顺序：目标路径的 `AGENTS.md` 链 → `docs/README.md` → 按任务读 PRD / `DESIGN.md` / 技术方案 / 官方插件设计 / 本文档 → 源码与测试，减少旧计划覆盖当前事实的风险。
- 最低验证：文档或配置 `pnpm check`；package / app 代码 `pnpm test` + `pnpm check`；跨包、协议、存储、发布追加 `pnpm build`；前端视觉 / 交互变更启动 apps/app 并用浏览器检查关键路径（详见 §4 L3-L5、§5）。
- 事实源同步优先级：`docs/README.md`（新增事实源入口）→ PRD / 官方插件设计（产品口径）→ `DESIGN.md`（视觉、交互、组件边界）→ 技术方案（包边界 / 协议 / 存储 / 权限）→ 本文档（回归基准 / 检查项 / 债务 / 命令矩阵）；冲突时以当前事实源与当前代码为准。
- 审查信号：边界清晰的小任务新增超过约 300 行生产代码、超过 3 个生产文件，或新增 dependency / workspace package / public export 时暂停复核范围，它们是必须解释的信号而非自动失败阈值（测试、文档、快照、生成文件不计入）。
- final 输出的可审计字段以 §8 报告模板为准；发现文档与实现冲突时说明冲突点和处理方式。

## 3. 改动分类

每轮迭代开始前先分类。一个 PR / 任务可以命中多个类型。

| 改动类型       | 示例                                                         | 必跑层级                         |
| -------------- | ------------------------------------------------------------ | -------------------------------- |
| `docs`         | 文档、规格、计划、README                                     | L1 + L3                          |
| `protocol`     | `plugin-api` 类型、schema、manifest 字段                     | L1 + L2 + L3 + L6 + L7           |
| `kernel`       | plugin kernel、runtime context、event bus、permission bridge | L1 + L2 + L3 + L6 + L7           |
| `storage`      | Dexie schema、repository、import/export、workspace preset    | L1 + L2 + L3 + L6 + L7           |
| `backend`      | `apps/app` 后端服务与管理台                                   | L1 + L2 + L3 + L7                |
| `orchestrator` | layout switcher、drag sort、command、settings、toast model   | L1 + L2 + L3 + L4 + L7           |
| `shell`        | apps/app workbench / extension App、host adapters、workbench-shell | L1 + L2 + L3 + L4 + L5 + L6 + L7 |
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
- 是否影响 apps/app workbench、extension 或未来 shell 的复用边界？

运行 `node scripts/regression-summary.mjs`：它按当前 dirty 文件推导改动类型和必需回归层级。如果工作区已有用户改动，不要回滚，只检查自己的改动范围并在 final 中说明。

### L1：事实源一致性

检查本轮改动是否需要同步文档。

| 变化                                     | 必查文档                                     |
| ---------------------------------------- | -------------------------------------------- |
| MVP 范围、用户流程、验收标准变化         | PRD                                          |
| 官方插件职责、默认装配、插件交互变化     | 官方插件设计                                 |
| token、视觉、组件语义、可访问性变化      | `DESIGN.md`                                  |
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
- `@tabora/orchestrator` 只承接跨插件纯模型和编排计划，不依赖 `@tabora/storage` 或 Solid renderer；JSX 布局渲染桥属于 `@tabora/workbench-app`。

#### 插件边界

- 插件不得依赖 `@tabora/workbench-shell`、`@tabora/storage`、app 源码或 app package。
- 插件不能直接创建全局 modal / fullscreen / settings host。
- 插件不能直接操作 workspace store。
- 插件不能直接 `window.open` 或裸 `<a target="_blank">` 绕过权限桥。
- widget 必须声明 `supportedSizes`、`defaultSize`、view id；实例必须显式保存 `size`。

#### Shell 边界

- shell 负责 DOM 挂载、host capability、宿主容器、错误边界、全局生命周期。
- shell 不应继续堆业务推断逻辑。
- apps/app workbench 与 extension 的共享逻辑应进入 `@tabora/workbench-app`、`@tabora/host-adapters` 或其他独立 package。
- extension 不应长期通过相对路径 import apps/app workbench helper。
- 仓库内部 refactor 不为旧调用方式保留兼容层；允许同步修改 helper 签名、模块出口和调用方。
- app 层不保留纯 pass-through `@tabora/workbench-app` 兼容模块；只有真实装配工厂或宿主入口文件可以继续存在。
- apps/app workbench source 与 extension 生产代码只通过 `@tabora/builtin-plugin-registry`、`@tabora/workbench-app` 和 host adapters 装配工作台；官方插件、layout package 与 core runtime package 不直接进入 workbench composition。

运行 `pnpm check:architecture` 覆盖上述边界的静态扫描（具体守卫项见 §5）；需要人工复核时再补充定向 `rg`。

### L3：自动化基础门禁

按改动类型运行门禁命令，具体命令由 `node scripts/regression-summary.mjs` 的 `commands to run` 给出：文档或配置变更至少 `pnpm check`；package / app 代码变更为 `pnpm test` + `pnpm check`；跨包、协议、storage、发布相关变更追加 `pnpm build`。

通过标准：

- 命令退出码为 0。
- 如果失败，不能声称完成；必须说明失败命令、失败原因和下一步。
- 如果某个命令因环境限制未运行，必须在 final 中说明。

### L4：产品关键路径冒烟

前端、shell、layout、official plugin、settings、search、storage 改动必须做 L4。

关键路径：

- 默认工作台首屏渲染，不是 landing page。
- Dashboard 布局可见：轻 rail、常驻搜索、主网格。
- 添加 widget 成功，新卡片追加到网格末尾。
- widget 支持多实例和多尺寸。
- 右键菜单包含尺寸、展开、移除；当前尺寸高亮。
- 双击 widget 打开展开视图，Esc 可关闭。
- 搜索栏和 `⌘K` 命令面板可用。
- `@provider query` 能路由到目标搜索源。
- 设置中心可打开，通用、外观、搜索、插件、关于五类可切换。
- 设置入口导航到 `/settings/<section>`；直接访问设置二级路由、分类切换、关闭/移动端返回和浏览器前进/后退都恢复正确面板。
- 主题和背景切换可持久化。
- 导入 / 导出当前 schema 可用，旧 schema 明确拒绝。
- 插件 view 抛错只显示局部错误，不白屏。

当前仓库不维护 e2e 套件，关键路径由 `pnpm test` 单测与人工检查覆盖。涉及浏览器行为的风险，手动启动 apps/app 检查：`pnpm --dir apps/app exec vp dev --host 127.0.0.1 --port 4000 --strictPort`。

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

建议浏览器检查视口：Desktop 1280x900、Tablet 768x900、Mobile 390x844。移动端和窄屏无横向滚动、视觉细节、hover/focus 样式和复杂层级冲突需人工在上述视口下复核。

### L6：安全、权限和数据隔离

涉及 `runtimeContext`、permission bridge、host capability、plugin loader、storage、workspace import/export、外部打开路径时必须做 L6。

检查标准：

- `context.permissions.openExternal(url)` 按 manifest `external-open` hosts 校验。
- shell 注入给 widget/search/settings 的 `host.openExternal` 不得绕过权限。
- 插件不直接 `window.open`。
- 插件不直接渲染会绕过权限模型的外部打开入口。
- 权限拒绝只影响局部，不导致 shell 崩溃。
- plugin loader 只执行 `builtin` source 的包，不执行远程或本地第三方代码。
- 缺失 `apiVersion` 的 manifest 被拒绝。
- future major API version 被 skipped/rejected。
- host platform / capability 不满足时插件 skipped，并在插件管理器展示原因。
- plugin data 按 plugin / workspace / instance scope 隔离。
- 导入 workspace 必须包含当前 schema 必填字段，例如 `activeBackgroundProviderId`。
- `WorkbenchSearchSettings` 必须显式包含 `defaultProviderId` 与 `enabledProviderIds`，且默认 provider 属于启用列表；旧数据缺字段时直接拒绝，不 silent backfill。
- widget instance 缺失 `size` 或 size 不在 `supportedSizes` 内时显示局部无效占位，不读取时补默认值。

建议检查：`pnpm check:architecture` 覆盖裸外部打开与权限桥绕过；必要时用 `rg` 定向扫描 `window.open`、`target="_blank"`、`openExternal`、`external-open`、`apiVersion`。

### L7：代码与工程质量

所有 package / app / plugin 代码变更都必须做 L7。文档变更如果修改了工程规则、脚本、CI 或质量标准，也必须做 L7 的相关部分。

本层目标是保证代码可理解、可测试、可替换、可被 agent 稳定修改。标准入口是 `pnpm quality`，再按子项补充 `pnpm check`、`pnpm test` 或定向 `rg`。

#### L7.1 TypeScript 与类型契约

- 公共 API、manifest schema、view props、storage schema 使用显式类型或 Zod schema，不依赖隐式 `any`。
- 不用 `as any`、双重断言或非空断言绕过协议；确有必要时局部化并说明边界来源。
- discriminated union 优先于字符串散落判断。
- package 导出面稳定，新增导出要有明确消费者；不暴露内部 helper 作为长期公共 API。
- 类型和 runtime 校验保持一致：协议字段改动必须同步 `manifestSchema` / workspace schema / 测试。
- 运行时安全恢复只能使用显式、固定的安全值（如 `SAFE_THEME_TOKENS`），不允许以“第一个可用项”猜测 theme、provider 或 region。
- 用 `rg` 扫描 `as any`、`@ts-expect-error`、`@ts-ignore`、非空断言；新增命中必须逐项解释。

#### L7.2 模块职责与复杂度

- 一个模块只承担一个清晰责任：协议、编排、宿主容器、插件内容、存储、样式不混写。
- 写代码前搜索现有组件、helper、model、schema、package subpath、调用点和公共导出。
- 选择顺序：直接复用 → 扩展职责所有者 → 调用方私有 helper → 有真实消费者或稳定边界的公共抽象；不创建只改名、只转发或只包一层的 helper / component / adapter。
- 不为未来猜测增加配置、兼容、backfill、fallback、adapter 或扩展点。
- 相似 JSX 优先收敛为数据、配置或同一渲染路径；新文件只对应新的独立职责。
- 替换实现时同步迁移调用方并删除旧实现、死代码和过时导出。
- 避免“上帝组件”：大型 Solid 组件新增逻辑优先下沉为纯模型、hook/helper 或子组件。
- 业务能力默认进入插件，平台层只保留通用机制；不做顺手重构。
- 新增 `TODO/FIXME/HACK` 需要 owner、触发条件或后续计划；`console.warn` / `console.error` 只用于可诊断错误，不替代用户可见 fallback 或测试。

#### L7.3 Solid 前端实现质量

- 派生状态优先 `createMemo`，副作用放 `createEffect`，不用 effect 同步可直接计算的状态。
- 事件监听、timer、observer、storage subscription 必须有清理路径。
- 组件 props 小而稳定；跨层回调命名表达业务语义，不传递宿主内部 store。
- 列表渲染有稳定 key / identity；拖拽、排序、多实例不依赖数组 index 作为业务身份。
- UI 状态、持久化状态和插件业务数据分层清晰；错误 fallback 是局部 UI 状态，不静默吞异常。
- 用 `rg` 扫描 `addEventListener`、`setInterval`、`setTimeout`、`ResizeObserver`、`MutationObserver`、`createEffect`、`createMemo`，确认有 `onCleanup`、取消标记或等价清理。

#### L7.4 测试质量

- 纯模型、协议解析、storage、permission、orchestrator 优先有单元测试。
- UI 测试以用户行为和可访问查询为主，不测试实现细节。
- 修 bug 时补能失败的回归测试；高风险修复确认测试能覆盖原始症状。
- snapshot 不替代行为断言，只用于稳定且有审查价值的结构。
- 测试数据用 builder / fixture，避免手写不完整 manifest 或 workspace；异步测试等待明确状态，不用固定 sleep 掩盖竞态。
- 本轮代码改动没有新增测试时，final 必须说明原因（如纯文案、死代码删除、已有测试覆盖的机械调整）。

#### L7.5 依赖与包管理

- 只使用 `pnpm`，不引入 npm/yarn lockfile；新依赖说明用途、所属层级和替代方案，优先 workspace 现有能力。
- app / shell 依赖可比核心包更宽，核心包依赖必须保守；插件不得依赖宿主容器、storage 或 app 源码，`@tabora/ui` 不得依赖 kernel/storage/official plugins/apps。
- package `exports` 和 `publishConfig.exports` 保持一致；导出 `./*.css` subpath 的包必须显式声明对应 `publishConfig.exports`，不靠源码路径隐式消费。
- catalog 依赖优先沿用 workspace catalog，不散落具体版本。检查 `git diff` 依赖清单（`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`）。

#### L7.6 CSS、Token 与样式工程

- 大面积颜色、背景、边框、阴影优先使用 theme token / CSS variables。
- 插件内容区控件优先使用 `@tabora/ui`，不重复造基础按钮、输入、选择器、错误状态。
- 宿主容器样式留在 shell / workbench-shell / layout package，不塞进插件内容组件。
- CSS class 命名有模块归属，避免全局通用词污染。
- hover/focus/dragging 不改变布局尺寸；移动端不引入横向滚动；新 CSS 不用 `!important` 作为常规覆盖手段。
- `pnpm quality` 输出 raw color 报告，新增大面积视觉必须能解释为什么不用 token。

#### L7.7 性能与资源

- 默认新标签页首屏路径避免重计算、大同步循环和不必要的大依赖加载。
- 搜索输入、拖拽、滚动、resize 等高频路径不执行昂贵全量扫描；必要时用 memo、索引或节流。
- IndexedDB 读写避免在渲染路径重复触发；批量更新考虑事务和失败回退。
- 图片、图标和样式资源按需进入对应 app/package，不把官网或 demo 资源带进 extension 新标签页。
- 新增第三方库关注包体、运行时开销、浏览器兼容和 extension 限制。
- 用 `rg` 扫描 `JSON.parse`、`localStorage`、`indexedDB`、`querySelectorAll`、`getBoundingClientRect` 等高频路径 API，确认调用频率和缓存策略。

#### L7.8 可维护性与 Agent 友好性

- 文件、函数、类型命名表达领域含义，不用 `utils.ts` 堆无归属逻辑。
- 关键协议和复杂模型有邻近测试，优先于长注释；注释解释“为什么”，不复述“做什么”。
- 新增文档入口必须在 `docs/README.md` 登记，历史计划不回到默认阅读路径。
- final / PR 描述说明风险、验证和未覆盖项，便于下一轮 agent 接续。

### L8：发布前回归

在 `pnpm check` + `pnpm test` + `pnpm build` 基础上，发布 apps/app 单一镜像追加 `pnpm --filter @tabora/app build`；发布 extension 追加 `pnpm --filter @tabora/extension zip` 与 `zip:firefox`。

发布前还需确认：

- Chrome / Firefox 扩展权限说明与 manifest 一致。
- store listing 截图和隐私说明没有过时。
- GitHub Actions secrets / variables 配置完整。
- 构建产物来自干净工作区或明确的 release commit。

## 5. 最低自动化覆盖标准

CI 与本地共用 `pnpm check:architecture`、`pnpm check`（先生成 backend 路由树）、`pnpm test`、`pnpm build`。Agent 本地优先运行 `node scripts/regression-summary.mjs` 推导改动类型、必需回归层级、验证命令和触碰的已知债务，并用它给出的 `focused tests` 做快速反馈；`commands to run` 才是交付必须满足的范围，两者不能互相替代。

守卫脚本承担的覆盖标准（不在本文档重复其命令输出）：

- `pnpm quality`：L7 的类型逃逸、issue markers、大文件、raw color、external-open 信号报告；raw color 按 `workbench production / generated backgrounds / site styles / test fixtures` 分组，external-open 按 `host execution / manifest declaration / runtime method reference / test fixture / bypass risk` 分组，并按文件级信号去重计数。生产侧 raw color / `!important` 报告项应保持为 0。
- `pnpm check:architecture`：L2 + L7 高信号架构/边界静态扫描，将 `workbench production` raw color 基线锁定为 0（重新引入字面量颜色或 `!important` 直接失败），禁止零透明度 `rgba(...)` 与宿主题色变量字面量 fallback，并守卫搜索配置首项 provider 兜底、`enabledProviderIds` backfill、widget region `?? "mainGrid"` 推断、废弃 `official.layout.dashboard` 回流、app 层纯 `@tabora/workbench-app` pass-through wrapper、shell app 生产依赖直接声明官方插件 / layout / core runtime package、`@tabora/orchestrator` 依赖 `@tabora/storage` 或 `solid-js`。
- 单元测试统一由根 `vitest.config.ts` 管理：project 按 `node` / `dom` / `backend` 三个环境划分，不按 package 维护 per-package 配置；`maxWorkers` 上限 50% 逻辑核。定向验证用 `pnpm exec vitest run <目录>` 或 `pnpm test:changed`（基于模块图只跑与 git 变更相关的测试；`vitest.config.ts` / `package.json` 自身变更强制全量）。

## 6. Agent 每轮工作流

- 开始前：`git status --short --untracked-files=all` → 目标路径 `AGENTS.md` 链 → `docs/README.md` → `node scripts/regression-summary.mjs` → 按 §3 分类选择层级；UI 任务读 `DESIGN.md`，协议 / runtime / storage / shell 任务读技术方案和本文档；写代码前搜索现有实现、调用点、公共导出和相邻测试并记录复用决策与预计规模。
- 修改中：优先 `rg` 搜索；按“复用 → 扩展 → 私有 helper → 有真实消费者的公共抽象”实现；命中 §2 审查信号时重新确认范围；替换实现同步清理旧调用方、死代码和过时导出；不回滚他人改动，不做无关重构，风险行为先补测试。
- 完成前：重跑 `node scripts/regression-summary.mjs` 确认 touched paths 对应层级与命令 → 按 L3-L8 运行 → 变更事实源时同步 `docs/README.md` → 用 §8 模板记录并在 final 说明验证命令与未覆盖风险。

## 7. 质量门禁判定

### 7.1 `pass`

本轮触发的自动化命令全部通过，必要的人工 / 浏览器冒烟完成，文档事实源已同步，且没有新增未登记债务。

### 7.2 `pass with known debt`

新债务不影响当前用户主路径或安全底线，已在本文档、计划文档或 issue 登记，且 final 回复明确说明。安全、权限、数据丢失、白屏、发布包不可用等问题不能用这个状态放行。

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

复用与改动规模：

- 已复用的现有实现:
- 新增 public export / dependency / package / 生产文件:
- 删除或替换的旧实现:
- 生产 diff（additions / deletions）及必要性:

自动化验证：

- pnpm check:architecture:
- pnpm quality:
- node scripts/regression-summary.mjs:
- pnpm check:
- pnpm test:
- pnpm build:

代码与工程质量：

- 类型 / lint 新增豁免:
- 测试覆盖变化:
- 依赖 / package 导出变化:
- 架构边界扫描:
- 性能 / 高频路径风险:

人工 / 浏览器冒烟：

- 默认工作台:
- 移动端响应式断点:
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

各任务必跑层级见下表，具体检查项以 §4 对应层级为准。

| 任务                              | 必跑层级                | 该任务的重点               |
| --------------------------------- | ----------------------- | -------------------------- |
| 修改官方 widget                   | L1 L2 L3 L4 L5 L7       | 插件不依赖 shell/storage/app；添加、多实例、尺寸、展开、右键；组件职责、CSS token |
| 修改 layout（内建 dashboard）     | L1 L2 L3 L4 L5 L7       | layout 只依赖公开 contract；桌面/移动断点、横向滚动、region 身份、拖拽 resize |
| 修改 runtime context / permission | L1 L2 L3 L6 L7          | kernel 不引入业务；权限拒绝、host callback、外部打开扫描；类型契约与导出面 |
| 修改 workspace / storage / import-export | L1 L2 L3 L4 L6 L7 | 装配/instance/plugin data 分层；跨会话恢复、导入导出保留；缺字段拒绝不 backfill；schema 一致性与事务边界 |
| 修改 CI / 发布流程                | L1 L3 L7 L8             | 部署文档同步；脚本、依赖、缓存、workspace 命令语义；对应 app build / zip |

## 10. 已知债务登记

本节是当前未解决实现债务的登记位置，不记录历史过程。登记规则：

- 每轮迭代触碰相关区域时，必须优先修正债务，或确认没有扩大影响面。
- 债务解决后从本节移除，不在此处保留「已于某日解决」的历史记录；解决动作的细节由 git 历史与对应自动化守卫承载。
- 安全、权限、数据丢失、白屏、发布包不可用等问题不能以债务形式长期挂起，必须按 §7.3 视为 `blocked`。

登记格式：债务描述、影响、建议优先级。

## 11. 测试治理

测试何时必要、批量删除禁令等基础规则见 `AGENTS.md` 的“测试与验证”，本节只补充无法从中推断的操作细节。

**可接受的 mock 和 snapshot**：mock 用于隔离不可控边界（网络、存储、时间、宿主权限或昂贵外部依赖），但测试仍须断言可观察结果、状态变化、输出或明确 side effect。snapshot 只适合稳定且人工审查有效的渲染 / 序列化 contract，不得用大 snapshot 代替对关键状态、错误提示、可访问性或交互的明确断言。

**存量盘点**：`pnpm test:inventory` 扫描测试文件并输出三类人工复核候选——三个或更多 module mock、仅断言协作者调用、三个或更多 snapshot 断言。输出只是风险信号，不代表测试无价值也不自动删除文件。每个候选必须结合所保护行为标记为「保留」（说明覆盖的边界/contract）、「重构」（把实现细节断言收敛为可观察行为）或「删除」（确认已有更高层测试或类型/架构门禁覆盖同一风险）。清理必须分批，并在每批后跑对应 package 测试和 `pnpm check`；涉及清理时 PR / final 需给出候选结论。

**自动化边界**：盘点脚本故意只告警，不因 mock/snapshot 数量在 CI 失败——是否必要取决于业务行为，静态规则无法可靠判断。`.github/workflows/pr-governance.yml` 校验 PR 是否填写测试决策字段但不硬阻断；它用 `pull_request_target`、只 checkout 基分支并读取 PR event body，因此 PR 无法通过改写自身分支的校验脚本放宽规则。

## 12. Agent 评测

本评测检查 coding agent 是否把架构、测试和交付规则落实到真实改动，不按新增测试数量、解释篇幅或代码量评分。

**评测包**：用例定义在 `tooling/agent-evals/cases.json`，`pnpm agent:eval:check` 检查结构。当前用例覆盖：仅文档的事实源同步（防无关代码和无价值测试）、插件协议 contract（防旧 manifest 隐式兼容和无失败用例的 schema 改动）、宿主 UI 交互（防绕过 `@tabora/ui`、只写 snapshot 或跳过浏览器验证）、测试清理（防按 mock 数量批量删除）、重复宿主图标实现收敛（检查是否先搜索真实调用点、选最小复用边界并清理被替代代码）。

**执行流程**：从干净基线创建隔离 worktree，每次只跑一个 case；把 case 的 `prompt` 原样交给被测 agent，不额外提示实现策略；改动限制在 `allowedPaths`，超范围须在报告中说明必要理由；运行 `requiredEvidence` 命令保存输出/diff/final；按 `scoring` 逐项给分，命中 `forbiddenOutcomes` 直接不通过。每 case 满分 10，建议通过条件为 8 分及以上、无禁止行为、无遗漏验证证据；任何单项为 0 时复盘该项事实源/提示词/工具约束再重跑，不只提高阈值。

**证据与边界**：结果至少记录 case id、指令链与事实源、搜索到的现有实现、复用/扩展决策、实际改动路径、生产 diff、新增公开面、删除的旧实现、自动化验证、浏览器检查（若适用）、得分、禁止行为检查和未覆盖风险。评测包只验证用例结构，不启动或模拟外部 agent；不同 agent 必须在独立 worktree 执行，避免样本互相污染或污染主工作区。
