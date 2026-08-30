# Tabora 插件化个人工作台技术方案 V2

版本：V2.6

日期：2026-06-08

状态：当前架构与协议事实源；当前实现地图见 §17。

## 架构变更记录（V2.6）

**Phase 2 完成（2026-06-08）**：单一 Dashboard 布局 + 响应式断点架构

- **移除布局切换机制**：删除完整的 layout-switcher 编排层（`createLayoutSwitchPlan`、`reconcileWorkbenchLayoutInstances`、`switchWorkbenchLayout`），删除 `WorkbenchShellWorkspaceController.switchLayout` 及相关测试（净删除 ~5000 行）
- **Mobile 作为响应式断点**：原独立 `layout-mobile` 插件包已删除，mobile 现在是 dashboard 的 `isMobile` 响应式变体，由同一 layout view 根据屏幕宽度切换 rail/bottom-bar
- **统一内建布局注入**：原 `layout-dashboard` 插件包已删除，dashboard 现在作为 host builtin layout 注入（`BUILTIN_DASHBOARD_LAYOUT_PLUGIN_ID = "official.layout.workbench-dashboard"`），与 theme/background/search 对齐
- **简化 workspace 导入**：workspace 导入流程不再调用 `reconcileInstancesForLayout`，直接使用导入的 instances
- **设置面板简化**：移除"默认布局"选择器及相关 `workspace.layout.write` / `catalog.layouts.read` 权限
- **保留的 layout 概念**：layout 作为视图定义协议仍然存在，`listLayouts` / `findLayoutContribution` 仍被 layoutEngine 使用以获取区域定义，但不再支持运行时切换

关联文档：

- 产品 PRD V2：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- V2 设计事实源：`DESIGN.md`
- V2 交互原型参考：`docs/design/workbench-prototype.html`
- 回归基准与 Agent 工程治理：`docs/technical/tabora-regression-baseline.md`
- 文档地图：`docs/README.md`

## 0. 评审起点

本方案基于以下输入：

- PRD V2 的核心需求：布局即插件、全局可达性约束、插件自由度/约束体系
- 设计原型中验证的交互模式：实时搜索内联建议、拖拽实时换位、双击展开卡片、右键上下文菜单、设置侧栏导航、Toast 堆叠、@语法搜索源切换

以下方案从架构师视角出发，定义分层架构、扩展点协议、数据模型和测试策略，不预设具体实现路径。

## 1. 架构总体设计

### 1.1 分层架构

```text
┌──────────────────────────────────────────────────────┐
│  Shell Layer (apps/playground, apps/extension)       │
│  - 生命周期编排  - 错误回退  - 宿主容器渲染           │
│  - 全局快捷键注册  - Toast 管理  - 拖拽协调           │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────┐
│  Orchestration Layer (新包: @tabora/orchestrator)     │
│  - 插件目录管理  - 搜索路由  - 拖拽排序协调            │
│  - 展开视图管理  - 设置导航  - 上下文菜单分发          │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────┐
│  Kernel Layer (packages/platform-kernel)              │
│  - 插件生命周期  - 扩展注册表  - 事件总线              │
│  - 运行时上下文  - 权限桥  - 快捷键注册                │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────┐
│  Protocol Layer (packages/plugin-api)                 │
│  - Manifest 类型  - Contribution 类型                  │
│  - 扩展点 Props Contract  - 交互行为 Contract          │
│  - Workspace/Instance/Region 数据模型                   │
│  - Zod Schema 校验                                     │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────┐
│  Infrastructure Layer                                 │
│  - @tabora/ai-runtime (TanStack AI server gateway)    │
│  - @tabora/storage (IndexedDB 持久化)                  │
│  - @tabora/theme (CSS custom properties)              │
│  - @tabora/brand (品牌图标源与品牌组件)               │
│  - @tabora/ui (基础组件库)                             │
│  - @tabora/official-plugins (官方插件集合)             │
│  - @tabora/builtin-plugin-registry (默认 builtin 装配) │
└──────────────────────────────────────────────────────┘
```

关键变化：新增 **Orchestration Layer**（`@tabora/orchestrator`）。早期实现将编排逻辑散落在 `App.tsx` 中，造成 shell 与业务逻辑耦合。当前实现已开始把插件贡献查询、插件摘要、settings panel 收集、widget/search/layout contribution 解析收敛到 `@tabora/orchestrator` 的 `plugin-catalog.ts`，playground 只在组合根加载 `officialPlugins`，不再在业务渲染路径里直接扫描官方插件 manifest。搜索路由、拖拽排序、展开管理等复杂交互在编排层内聚。

**Phase 2 架构简化**：原布局切换引擎已移除，Dashboard 现在是唯一的 host builtin layout，mobile 作为其响应式断点。编排层不再负责 layout switching 和 instance migration，专注于插件目录、搜索、命令、设置导航等跨插件协调。

拆出独立编排层后：

- Shell 只负责 DOM 挂载、宿主容器渲染、全局生命周期
- Orchestrator 负责所有跨插件、跨区域的协调逻辑（不含布局切换）
- 搜索路由、拖拽排序、展开管理等复杂交互在编排层内聚

### 1.2 核心设计原则

1. **区域即契约**：每个 Layout 插件定义 region 列表，Shell 和 Orchestrator 只通过 region ID 操作实例，不硬编码 rail/topbar/mainGrid 等区域名称；当当前布局不存在可写 widget region 时，宿主拒绝写入并给出局部可诊断反馈，不推断 `mainGrid` 之类的兜底区域。
2. **插件实例驱动 + 宿主入口注入**：插件内容区域由 PluginInstance 驱动渲染；平台强制可达入口（设置、添加卡片、快捷键参考等）通过 `LayoutHostAPI` 注入，不伪装成插件实例。
3. **扩展点 Props Contract 即文档**：每个扩展点的 view props 是插件和平台之间的类型契约，必须在 plugin-api 中显式定义，不可使用无约束泛型。
4. **交互行为也属于 Contract**：尺寸选择、拖拽排序、右键菜单、双击展开等交互行为的触发方式和参数，属于平台协议的一部分，插件只需声明支持即可获得对应交互。
5. **编排层不引入新依赖类型**：orchestrator 使用已有的 plugin-api 类型和 platform-kernel 能力，不创建新的插件协议概念。

## 2. 包拆分方案

```text
packages/
  plugin-api/           # 类型、Schema、Props Contract（不变）
  platform-kernel/      # 插件生命周期、Registry、EventBus、权限、快捷键注册（增强）
  ai-runtime/           # AI Runtime gateway，P0 基于服务端 TanStack AI
  orchestrator/         # 新增：插件目录、搜索路由、拖拽排序、展开、设置导航
  workbench-app/        # 跨 shell 的 workbench composition 承载层
  host-adapters/        # Web / extension / desktop host capability adapters
  storage/              # IndexedDB 持久化（当前单版本 schema、quota / 错误处理）
  theme/                # Token 应用（不变）
  brand/                # 品牌图标源文件、品牌组件、静态图标路径导出
  ui/                   # 插件内容区基础组件（按 V2 组件规范扩展，不承接宿主容器）
  builtin-plugin-registry/ # 默认 builtin 装配
  official-plugins/     # 官方插件集合
  workbench-shell/      # Shell host 样式与通用宿主容器组件
```

设计 catalog 与包边界的映射需要额外说明：

- `DESIGN.md` 中的组件 catalog 是**设计 catalog**，不是 `@tabora/ui` 的 1:1 导出清单。
- `@tabora/ui` 承接插件内容区基础组件和低层可访问 primitive，如 `Button`、`Input`、`Field`、`ListRow`、`CardSection`、`Kbd`、`Dialog`、`Drawer`、`Toast`、`ContextMenu`、通用 `CommandPalette` 等。
- Tabora 宿主级容器由 shell / `@tabora/workbench-app` / `@tabora/workbench-shell` 提供，例如 `WidgetCardShell`、全局 `ModalHost`、`FullscreenHost`、`SettingsHost`、`ToastHost`、`WorkbenchRail`、`WorkbenchGrid`、shell 全局命令面板和快捷键面板。宿主可复用 design spec 或 primitive，但不能把宿主所有权下沉到 `@tabora/ui`。
- 插件样式由 manifest 的 `styles` 声明归属：`scope: "plugin"` 的 CSS 由宿主读取后逐条前缀为该插件的 `data-tabora-plugin-id` 容器，并以受管理的 `<style data-tabora-plugin-style>` 插入；`:root`、`html`、`body`、`:host`、`:global()` 以及 `@keyframes`、`@font-face`、`@property`、`@page` 等无法安全收口的规则会被拒绝，不能静默退化为全局样式。layout 这类确实需要影响页面骨架的样式可显式声明 `scope: "global"`，但 loader 只允许 builtin 使用。builtin 装配层通过 `@tabora/builtin-plugin-registry` 把 manifest 中的相对 `href` 映射为 Vite 可加载的 CSS asset URL；可信本地插件可基于 `baseUrl` 解析相对样式。`@tabora/workbench-app` bootstrap 汇总 loader 输出的 `pluginStyles`，并按插件启用状态和声明顺序加载 / 移除。此策略隔离声明的样式资产，不把同一 JS realm 误述为安全沙箱；不可信远程代码仍必须走独立 sandbox runtime。playground 与 extension 入口只导入 app / `@tabora/ui` / `@tabora/workbench-shell` 的宿主基础样式，不再手动 import 官方插件、layout 或第三方插件 CSS，也不提供 `@tabora/official-plugins/styles.css` 兼容聚合入口。
- StyleX authoring 与构建统一由 `@tabora/stylex-config` 管理：Solid host / Kobalte slot 使用 `stylex.attrs()`；跨 package 语义变量由 `@tabora/theme/tokens.stylex` 的 `defineVars` 提供；variant 使用普通 object map。根 `vite.config.ts` 把共享 Rolldown/unplugin pipeline 注入 `vp pack`，对声明 `./styles.css` 的 StyleX package 合并 source global CSS 与抽取规则、验证非空并写入 manifest 声明的 `dist/styles.css`。各 package 不再调用 StyleX CLI 或创建 `.stylex-build`。UI、shell、layout、官方插件 pack 和每个可独立启停的插件仍保留独立 CSS asset，`@tabora/builtin-plugin-registry` 的 `?url` 映射与运行时 style lifecycle 不变。非 StyleX CSS export 继续按 package source/publish 声明复制，不按包名写特殊分支。
- 默认工作区 preset 的归属也已与样式装配保持一致：`@tabora/workbench-app` 不再直接依赖 `@tabora/official-plugins` 或内置官方 preset 常量；shell 入口统一从 `@tabora/builtin-plugin-registry` 注入默认 builtin plugin 列表、默认 workspace preset 与 shell 装配配置，再由 runtime bootstrap / session seed / shell initial visual state / host command-layout bridge 显式消费。
- Package 聚合入口只用于真实 shell、插件 pack 或完整公开 API 的装配。测试和业务代码只消费 preset、workspace/session、import-export、grid、background resolver、plugin manifest 或 UI primitive 等独立能力时，必须优先使用与构建入口一致的稳定 package subpath，避免加载无关插件、UI 或 shell 模块图；新增这类 subpath 时应同步 source/publish exports、构建 entry 和架构 contract。Builtin plugin 发现阶段只加载 manifest、启用状态和样式映射；包含 view 的实现通过 lazy descriptor 在激活前并行 preload，再按插件声明顺序执行 `activate`，单个 loader 失败继续由 kernel 记录为局部插件错误，不阻断后续插件。
- `@tabora/ui/component-docs` 只同步导出组件文档 metadata 与类型；真实 demo 由 `@tabora/ui/component-docs/renderers` 的显式动态 import registry 按 ID 加载。官网单组件路由可立即挂载对应 demo，“全部组件”目录只在卡片接近可视区时挂载，并对加载中和失败提供局部状态。新增文档组件时必须同时维护 metadata 与 loader ID；catalog contract 测试校验二者一一对应，但不应重复渲染已有独立行为测试覆盖的全部组件。
- 布局协议语义已收口：`HostActionId` 包含 `shortcuts`、`plugin-manager` 等稳定动作 ID；`RegionSlot` 为泛型渲染结果契约，`plugin-api` 不绑定 Solid JSX，workbench shell 的 `createLayoutEngine` 会按 `region.accepts` 过滤实例，避免 extension point 错配；playground / extension 通过 `@tabora/workbench-app` responsive state 向 layout 传入真实 `isMobile`；默认 workspace seed 不再保存伪 `rail` region；布局错误会记录状态并显示明确的布局不可用提示。**Phase 2 后 Dashboard 为唯一 host builtin layout，mobile 作为其响应式断点；运行时布局切换（`layout-switch` host action、layout-switcher 编排层）已删除。**
- 插件系统可扩展性已收口：drag sort model、command catalog、shortcut registry、context menu model、settings navigator、toast manager、workspace preset applier 均已进入 `@tabora/orchestrator`；JSX 布局渲染桥、layout view 解析和布局不可用状态属于 shell renderer 职责，已归入 `@tabora/workbench-app`；apps 只消费模型和 host callbacks，不再保留对应纯推断逻辑。**layout switcher 已随 Phase 2 移除，不再属于编排层职责。**
- `@tabora/plugin-api` 已补齐 command、keybinding、widget context menu、settings section/scope/surfaces/content、workspace preset、host compatibility、background source 等协议类型和 schema。当前为上线前阶段，不保留历史 manifest 兼容包袱：`apiVersion`、settings panel `section/scope/surfaces/content`、workspace canonical contribution ref（含 `activeBackgroundProvider`）、widget instance `size` 等当前协议字段必须显式声明；缺失即视为无效 manifest / 无效实例 / 无效导入数据。`legacyMigration` 不再作为 host capability 暴露。
- settings panel 的 `content` 必须显式选择 `{ kind: "schema", provider, schemaVersion: 1 }` 或 `{ kind: "custom-view", view }`。Kernel 为 schema provider 提供受 manifest 声明限制的 registry，停用插件时与 view 一起注销；宿主不再通过 `SettingsPanelViewProps.host` 注入账号或同步业务 API。
- AI Runtime P0：`@tabora/plugin-api` 定义文本生成/流式生成与 `ai.generate` 权限；`@tabora/platform-kernel` 仅按权限暴露可选 `context.ai`，自身不依赖第三方 agent 框架；`@tabora/workbench-app` bootstrap 接收宿主注入的 HTTP bridge 并传入 kernel；`@tabora/ai-runtime` 提供基于 TanStack AI 的服务端文本 gateway 和统一 JSON/SSE transport。云端内置模型只接受已登录用户，云端自定义 OpenAI-compatible provider 在单次请求中临时使用本机密钥，FNOS 只解析设备共享的 custom provider。插件只消费 Tabora 协议，不直接依赖 provider SDK。
- AI Runtime 多轮对话扩展（AI 对话插件）：`AiGatewayRequest` 支持与 `prompt` 互斥的 `messages` 历史，AG-UI anchor 线格式由 `@tabora/ai-runtime` 的 `parseAiGatewayRequest` 归一化校验，provider/参数选择经 `forwardedProps` 注入；`context.ai.createChatConnection()` 返回宿主构建、与 TanStack `ConnectionAdapter` 结构兼容的连接对象（实现在 `@tabora/ai-runtime` 的 `createAiChatConnection`，基于 `fetchServerSentEvents` + 异步 options 注入 provider 与鉴权），`plugin-api` 仅保留不依赖 TanStack 的结构化协议 `AiChatConnection`；插件 UI 层允许引入 `@tanstack/ai-solid-ui` 与 `solid-markdown`：两者的 `solid` 导出条件为 raw TSX/JSX，dep optimizer 无法转换，已通过仓库级 pnpm patch（`patches/`）将两者的导出固定到编译 dist，对所有宿主 app 全局生效，无需各自配置。
- 发布前兼容性边界：仓库内部 refactor 不再为旧调用方式保留兼容 wrapper。helper 签名、模块出口和调用方允许一并重构；app 层仅保留 `workbenchComposition` 这类真实装配工厂，纯 `export * from "@tabora/workbench-app"` 的兼容转导出模块全部删除，并由 `pnpm check:architecture` 守卫禁止回归；同一批守卫也禁止废弃 `official.layout.dashboard` 等旧 layout id 回流到生产源码。
- `@tabora/plugin-api` 当前额外导出 `workbenchSearchSettingsSchema`、`pluginInstanceSchema`、`workspaceSchema`、`workspaceExportSchema` 作为当前工作台协议事实源。`WorkbenchSearchSettings` 当前协议为完整显式配置：`defaultProviderId: string`、`enabledProviderIds: string[]`，并要求默认 provider 必须属于启用列表。workspace hydration、import/export 和 preset 链路统一走 schema 校验；缺失字段、旧导出或不满足约束的数据直接拒绝，不再按“首个 provider”或“全量 providers”做 silent backfill。
- `@tabora/platform-kernel` 已提供 plugin loader abstraction、插件 API major version 兼容检查、host platform/capability 检查、skipped reason 记录，以及 runtime toast bridge。内置插件和可信本地包都必须通过 manifest schema 与 API 兼容检查；远程不可信执行仍不在 MVP 范围内。
- `@tabora/storage` 已引入 `StorageAdapter` port；Web 默认 adapter 包装当前 Dexie/IndexedDB repository，`workbench-app` bootstrap 可注入 fake/memory adapter 进行测试或未来跨平台替换。当前上线前 schema 采用单一 Dexie version，直接声明 MVP 所需表，不保留旧版本迁移/backfill 路径。
- 插件依赖边界已由测试守卫：官方、community、example 插件源码和 package manifest 不得依赖 `@tabora/workbench-shell`、`@tabora/storage` 或 app 源码/package。
- 架构边界：`@tabora/orchestrator` 不依赖 `@tabora/storage` 或 `solid-js`；playground / extension 生产依赖不直接声明官方插件、layout package 或 core runtime package；`WidgetSize -> grid span` 映射统一由 `@tabora/plugin-api` 的 `widgetGeometry` 导出，避免 workbench grid、widget shell 和 drag sort model 三套映射漂移。
- 运行时收口：search provider 在 runtime catalog 中带有 `pluginId/pluginName` owner descriptor，inline search 和 shell `CommandPalette` 的外部打开都使用 provider owner 进行 `external-open` 权限判断；插件禁用会执行 activation disposer 并注销已注册 view，active contribution list 只来自 enabled plugin，plugin summaries 仍保留全部插件用于管理面板；`LayoutHostAPI.getGlobalActions("menu")` 成为第一等全局动作 surface；布局 view 失败时由 layout error tracker 记录 layout id 和具体错误，并显示布局不可用状态；runtime context 的 `getConfig/setConfig` 临时 API 已删除，实例数据通过 widget props 的 `data` 与 scoped data host 显式传递；Dexie schema 仅保留当前有 repository/runtime path 的 MVP 表，搜索历史继续作为 plugin-owned workspace data 存于 `pluginData`。
- 工程边界当前基线：`@tabora/workbench-app` 已承接 runtime bootstrap（database、repositories、plugin catalog、kernel 的集中创建），`@tabora/host-adapters` 已拆出 web / extension 平台工厂并提供稳定导出面。bootstrap 可接收不带 Dexie database 的 host storage adapter；此类宿主仍使用统一 repository port，但不提供基于 Dexie 的导入/导出。FNOS 以 HTTP adapter 把 repository 操作交给本地 Hono + SQLite。账号与同步则由 `official.account-sync` 可选插件装配，避免纯本地宿主初始化认证与同步 runtime。
- 组合与治理：`@tabora/workbench-app` 的 `shellController` 纯 helper 统一承接 plugin owner `external-open` 权限判断；theme/background/grid/workspace session/import-export 等共享 shell helper 也由该包承接，extension 不再通过相对路径直接 import playground 源码。（Phase 2 后 layout switch plan/snapshot 纯模型已删除。）
- 搜索与主题治理：`@tabora/workbench-app` 的 search helper / state、`@tabora/orchestrator` 的搜索模型、以及官方 search/settings 插件已统一删除“首项 provider”隐式兜底。theme resolver 仅在精确命中 theme 时返回对应 token；未命中时应用显式 `SAFE_THEME_TOKENS` 并记录诊断，不再回退到 `themes[0]`。`CommandPalette` 与 `SearchCommandBar` 的 provider token、`@` 路由和 suggestions 生成进一步收敛到 `@tabora/orchestrator` 的共享 model，官方插件不再维护独立的 search-model 转导出层；`SearchViewProps` 也已升级为宿主注入 `query / results / activeResultIndex / host actions` 的状态机 contract，搜索栏只负责渲染和事件转发。
- 治理自动化：仓库已新增 `pnpm check:architecture`、`pnpm quality`、`pnpm regression:summary`；PR CI 覆盖 architecture / check / test / build；release/deploy workflow 在打包前输出 regression summary。e2e browser smoke 已于 2026-08 移除，需要时按回归基准重建。
- playground 当前通过 `apps/playground/src/workbenchComposition.ts` 组装 `@tabora/workbench-app`、`@tabora/host-adapters` 与 `@tabora/builtin-plugin-registry`；playground / extension 的 `App.tsx` 已收敛为薄 wrapper，共享宿主交互编排统一落在 `@tabora/workbench-app`。`workbench-app/src` 已按垂直切片重组，目录结构如下：
  - `shell/`：组合根与跨切片装配——`WorkbenchShellApp.tsx`（薄 composition root，现含 `WorkbenchShellProvider` 上下文）、`WorkbenchShellContext.tsx`（shell bundle context）、`WorkbenchShellState.ts`（聚合 6 个 domain store）、`WorkbenchShellControllerRuntime.ts`（命令/拖拽/搜索/widget/view 聚合）、`WorkbenchShellViewRuntime.ts`、`WorkbenchShellInstanceRenderer.tsx`。
  - `runtime/`：kernel bootstrap 与宿主运行时——`bootstrap.ts`、`WorkbenchRuntimeStore.ts`（kernelReady / pluginRecords / toasts）、`WorkbenchShellRuntimeState.ts`（discover/boot/kernel 事件接线）、`WorkbenchShellHostRuntime.ts`（host actions/dispose bridge）、`WorkbenchShellHostActions.ts`（rail action / grid 持久化 / 焦点定位）。
  - `widget/`：`WorkbenchWidgetStore.ts`、`WorkbenchShellWidgetState.ts`、`WorkbenchShellWidgetController.ts`、`WorkbenchShellWidgets.ts`。
  - `search/`：`WorkbenchSearchStore.ts`、`WorkbenchShellSearchState.ts`、`WorkbenchSearchSurfaceState.ts`、`WorkbenchShellSearchSurfaces.ts`、`WorkbenchInlineSearchViewProps.ts`。
  - `workspace/`：`WorkbenchWorkspaceStore.ts`、`WorkbenchShellWorkspaceState.ts`、`WorkbenchShellWorkspaceController.ts`（layout/theme/background/search/workspace lifecycle 编排）、`WorkbenchShellSessionState.ts`、`workspaceSession.ts`、`workspacePortability.ts`、`workspaceTransfer.ts`、`defaultWorkspaceSeed.ts`。
  - `layout/`：`WorkbenchShellLayoutState.ts`、`WorkbenchShellLayoutRuntime.ts`、`WorkbenchShellLayoutHost.ts`、`WorkbenchShellLayoutRenderer.tsx`、`layoutEngine.tsx`、`layoutError.ts`。
  - `appearance/`：`WorkbenchAppearanceStore.ts`、`WorkbenchShellAppearanceState.ts`、`themeResolver.ts`、`backgroundResolver.ts`。
  - `surface/`：`WorkbenchOverlayStore.ts`、`WorkbenchShellSurfaceHost.tsx`（context 消费，不再接收拍平 props）、`WorkbenchShellSurfaceProps.tsx`（直接读 shell bundle 产出 8 组 surface props）、`WorkbenchShellChrome.tsx`、`WorkbenchShellInteractions.ts`、`WorkbenchShellSettings.ts`。
  - `command/`：`WorkbenchShellCommands.ts`。`drag/`：`WorkbenchDragController.ts`、`WorkbenchShellDragState.ts`。
  - `shared/`：跨切片基础设施——`shellConfig.ts`、`shellHelpers.ts`、`WorkbenchShellUtils.ts`、`workbenchGrid.ts`、`responsive.ts`、`WorkbenchShellViewBridge.ts`、`WorkbenchShellIcons.tsx`、`pluginStyleManager.ts`、`shellController.ts`。
  - 状态域分片：持久化数据域（workspace / instances / searchSettings / searchHistory）保留 `createSignal`（避免 store proxy 进入 IndexedDB 结构化克隆）；纯 UI 域用 `createStore`；`WorkbenchShellState.ts` 退化为组合根返回 `{ runtime, workspace, appearance, widgets, overlays, search }`；controller 工厂与测试零改动。`WorkbenchShellApp` 已实质收口为薄 composition root。
- extension newtab 已拥有自己的 shell entry，不再直接 import `@tabora/playground/src/App`；共享 shell helper 已统一由 `@tabora/workbench-app` 暴露，`pnpm check:architecture` 额外禁止 app 间直接 import 对方源码路径。

`@tabora/orchestrator` 的职责边界：

```text
// 插件贡献目录
const catalog = createPluginCatalog(plugins)
catalog.listWidgetContributions()
catalog.findWidgetContribution(pluginId, contributionId)
catalog.findSearchContribution(pluginId, contributionId)
catalog.findLayoutContribution(layoutId)
catalog.listSettingsPanels()
catalog.pluginSummaries()

// 布局区域映射（Phase 2 后无运行时切换，Dashboard 为唯一 builtin layout）
getActiveRegions(): RegionState[]
mapInstancesToRegions(): Map<string, PluginInstance[]>

// 搜索子系统
search(query: string): SearchResults
getSearchSuggestions(query: string): Suggestion[]
resolveSearchProvider(syntax: string): SearchProviderContribution | null

// 拖拽排序
initiateDrag(instanceId: string): void
onDragOver(targetInstanceId: string): void
commitDragOrder(): void

// 卡片展开
openExpandView(instance: PluginInstance): void
resolveExpandRenderer(type: string): ExpandRenderer
closeExpandView(): void

// 上下文菜单
showContextMenu(instanceId: string, position: Point): void
getContextActions(instance: PluginInstance): ContextAction[]

// 设置导航
getSettingsTabs(): SettingsTab[]
switchSettingsTab(tabId: string): void
```

## 3. 布局架构

> **Phase 2 变更**：早期设计支持"多布局插件 + 运行时切换"。当前架构已收敛为**单一 Dashboard host builtin layout**，mobile 作为其响应式断点。运行时布局切换（`switchLayout`、layout-switcher 编排层、instance region 迁移、workspace snapshot 回滚）已全部移除。以下 3.1/3.2 的 layout contribution 协议仍作为**视图定义契约**保留（Dashboard 通过它声明 region 结构和响应式能力），但不再存在多个 layout 之间的运行时切换路径。

### 3.1 布局插件协议

Dashboard layout 通过 layout contribution 声明自己的区域结构：

```text
type LayoutContribution = {
  id: string
  title: string
  view: string // 布局壳体的 Solid 组件 view ID
  regions: LayoutRegion[]
  defaultRegions: Record<string, string[]> // regionId -> default instance IDs
  supportsResponsive: boolean
  layoutKind: "dashboard" | "stream" | "kanban" | "minimal" // 布局范式分类
}

type LayoutRegion = {
  id: string // 区域唯一 ID
  title: string // 人类可读名称
  accepts: ExtensionPoint[] // 该区域接受的扩展点类型
  required: boolean // 是否必须至少有一个实例
  maxInstances?: number // 最大实例数限制
  defaultVisible: boolean // 默认是否可见
}
```

### 3.2 布局壳体组件 Contract

布局插件的 view 组件接受泛化的区域 props：

```text
// LayoutView 不再接受 { rail, topbar, mainGrid }
// 改为接受 { regions } —— 任意区域结构的通用接口
type LayoutViewProps<TRendered = unknown> = {
  regions: Record<string, RegionSlot<TRendered>>
  isMobile: boolean
  host: LayoutHostAPI
}

type RegionSlot<TRendered = unknown> = {
  regionId: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  render: () => TRendered
  renderInstance: (instance: PluginInstance) => TRendered
  isEmpty: boolean
}
```

Solid layout 插件在实现侧使用 `LayoutViewProps<JSX.Element>`；协议层本身不绑定具体 renderer。

### 3.3 响应式渲染流程

Dashboard 是唯一布局，不存在布局切换。屏幕宽度变化时通过响应式断点在同一 layout view 内切换呈现：

```text
宿主初始化
  → 加载 Dashboard builtin layout contribution
  → 按 region.accepts 将 instances 映射到 topbar / mainGrid
  → 渲染 DashboardLayout(regions, isMobile, host)
  → isMobile 由 @tabora/workbench-app responsive state 提供
    → 桌面：渲染左侧 rail + 顶部搜索 + 主网格
    → 移动：折叠 rail 为底部导航栏，同一网格按窄屏密度重排
  → 视口跨越 768px 断点时，layout renderer 重挂载以应用对应变体
```

工作区导入/切换时直接使用持久化的 instances 和 region 映射，不再执行 instance region 迁移或 snapshot 回滚。

### 3.4 布局不可用状态

平台不再内置第二套工作台布局。当活跃布局插件未注册、view 不存在或渲染失败时，宿主记录 layout id 和错误信息，并直接显示布局不可用状态：

```text
没有可用的布局插件
布局插件「<layout-id>」无法渲染
<具体错误信息>
```

## 4. 区域渲染引擎

### 4.1 核心抽象

当前实现的问题：`App.tsx` 中硬编码了 `rail`、`topbar`、`mainGrid` 三个区域的 JSX 生成逻辑。每种新布局都需要修改 App.tsx。

解决方案：由 shell renderer 提供通用区域渲染引擎 `RegionRenderer`。当前实现中，这部分职责已归入 `@tabora/workbench-app` 的 `createLayoutEngine` / layout runtime，而不是继续留在 `@tabora/orchestrator`：

```text
// workbench-app shell renderer 提供
function renderRegionInstances(
  regionId: string,
  instances: PluginInstance[],
  registry: ExtensionRegistry,
  kernel: PluginKernel
): JSXElement[] {
  return instances
    .filter(inst => inst.regionId === regionId && inst.enabled)
    .sort(byGridOrder)
    .map(inst => renderInstance(inst, registry, kernel))
}

function renderInstance(
  instance: PluginInstance,
  registry: ExtensionRegistry,
  kernel: PluginKernel
): JSXElement {
  const contribution = findContribution(instance, kernel)
  const viewId = resolveViewId(contribution, instance.extensionPoint)
  const View = registry.views.get(viewId)
  const props = buildViewProps(instance, contribution, kernel)
  return (
    <PluginViewBoundary instanceId={instance.id}>
      <View {...props} />
    </PluginViewBoundary>
  )
}
```

`LayoutView` 组件只需要调用 `renderRegionInstances` 来填充各个区域，不需要知道区域内容的具体类型。`@tabora/orchestrator` 继续只负责 region -> instance 的纯映射、切换计划和编排模型，不绑定 JSX renderer。

### 4.2 宿主级全局入口注入

Rail、顶部工具条和布局不可用状态中的错误信息不应伪装成 `layout` 插件实例，否则会污染扩展点语义。

推荐做法：布局壳体只决定这些入口**出现在哪里、以什么容器呈现**；入口动作本身由 `LayoutHostAPI` 提供。

```text
type LayoutHostAPI = {
  getGlobalActions(surface: "rail" | "toolbar" | "menu"): HostActionItem[]
  openSettings(panelId?: string): void
  openCommandPalette(): void
  openAddWidget(context?: AddWidgetContext): void
  readLayoutState<T = unknown>(key: string): T | undefined
  writeLayoutState(key: string, value: unknown): void
  showToast(message: string, opts?: ToastOptions): void
  toggleTheme(): void
  isDark(): boolean
}

type AddWidgetContext = {
  activeGroupLabel?: string
  onAdded?: (instance: PluginInstance) => void
}

type HostActionItem = {
  id:
    | "home"
    | "add-widget"
    | "plugins"
    | "plugin-manager"
    | "settings"
    | "theme"
    | "command"
    | "shortcuts"
  label: string
  icon: string
  shortcut?: string
  isActive?: boolean
  run: () => void
}
```

这样：

- Dashboard 布局可以把 `getGlobalActions("rail")` 渲染成 rail 按钮组。
- `LayoutUnavailableState` 不伪装成 `layout` contribution；布局插件缺失或失败时直接显示错误状态。

> **Phase 2 移除**：原设计提到的"Focus 布局"作为第二种官方布局已不存在，`layout-switch` host action 也已删除。

## 5. 搜索子系统

### 5.1 搜索架构

V2 设计原型验证了两种搜索入口：

- **Dashboard**：常驻搜索栏 + 内联实时建议下拉 + ⌘K 命令面板
- **Focus**：不放常驻搜索栏，通过居中命令入口或 ⌘K 命令面板唤起搜索；页面突出一个主卡片和 satellite 切换区

这需要搜索子系统分为三层：

```text
┌─────────────────────────────────────────┐
│  Search UI Layer                        │
│  - SearchBar (内联输入 + 建议下拉)       │
│  - CommandPaletteHost (⌘K 浮层容器)      │
│  - SearchSurface (搜索插件渲染内容)      │
│  - SearchProviderIndicator / Hint        │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│  Search Engine (orchestrator)           │
│  - 模糊搜索命令 / 卡片 / 网页            │
│  - @语法 解析和路由                      │
│  - 分组建议生成                          │
│  - 键盘导航状态管理 (↑↓ Enter Esc)       │
│  - Dashboard 内联建议与 ⌘K 状态同步      │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│  Search Provider Protocol (plugin-api)  │
│  - SearchProviderContribution           │
│  - SearchViewProps                      │
│  - SearchResult 类型                     │
└─────────────────────────────────────────┘
```

### 5.2 搜索路由

搜索输入按优先级匹配：

```text
function routeSearch(query: string): SearchAction {
  // 1. @语法切换搜索源
  const providerOnlyMatch = query.match(/^@([\w-]+)$/)
  if (providerOnlyMatch) {
    return { type: "provider-pending", provider: providerOnlyMatch[1] }
  }

  const providerQueryMatch = query.match(/^@([\w-]+)\s+(.*)/)
  if (providerQueryMatch) {
    return { type: "provider", provider: providerQueryMatch[1], query: providerQueryMatch[2] }
  }
  // 2. 精确命令匹配
  const cmd = commandRegistry.match(query)
  if (cmd) return { type: "command", command: cmd }
  // 3. 卡片名称模糊匹配
  const card = fuzzyMatchCards(query)
  if (card) return { type: "card", instance: card }
  // 4. 默认网页搜索
  return { type: "web", query, provider: defaultProviderId }
}
```

### 5.3 键盘导航协议

搜索建议列表的键盘导航是平台级交互协议：

```text
type SearchNavigationState = {
  results: SearchResult[]
  activeIndex: number
  isOpen: boolean
}

// 平台统一处理键盘事件：
// ArrowDown → activeIndex++
// ArrowUp → activeIndex--
// Enter → execute(activeResult)
// Escape → close or clear
```

插件只负责搜索表面的渲染和结果项的视觉表达；结果计算、激活态、方向键导航和执行时机由平台统一处理。

## 6. 拖拽排序子系统

### 6.1 实时交换算法

V2 原型采用实时交换而非占位符方案：拖拽悬停到目标卡片时，两张卡片立即交换数组位置并重新渲染。当前实现已落地为两层：

- `@tabora/orchestrator/createDragSortPlan()` 负责纯数组交换计划。
- `@tabora/workbench-app/WorkbenchDragController` 负责 5px 阈值、preview instances、重复悬停去抖，以及只在 pointer release 时提交持久化。

```text
type WorkbenchDragControllerState = {
  pointerId: number
  sourceId: string
  phase: "pending" | "dragging"
  startPoint: Point
  currentPoint: Point
  overId: string | null
  initialInstances: PluginInstance[]
  previewInstances: PluginInstance[]
}

const state = beginWorkbenchDragController({
  pointerId,
  sourceId: "widget-a",
  point: { x: 10, y: 10 },
  instances,
})

const next = updateWorkbenchDragController({
  state,
  point: { x: 20, y: 20 },
  overId: "widget-b",
})

const completed = completeWorkbenchDragController(next)
if (completed.instances) {
  await persistGridOrder(completed.instances)
}
```

### 6.2 拖拽交互约束

- 5px 移动阈值：防止点击误触拖拽
- 统一使用 Pointer Events；鼠标与触屏不再分两套拖拽实现
- drag handle 限定为 `.card-header`，避免卡片内容区滚动被拖拽手势劫持
- 不触发拖拽的元素：`button, input, textarea, select, a, [role="button"]`
- `card-header` 使用 `touch-action: none`，并通过 pointer capture 持续接收 move/up/cancel
- 命中目标实例通过 `document.elementFromPoint()` + `[data-widget-instance-id]` 解析
- 拖拽中禁止文字选择：`body.drag-active { user-select: none }`
- 只在 `pointerup` 时持久化排序；未发生 reorder 时直接取消，不写库不提示

## 6.6 卡片网格系统

### 设计原则

**固定网格跨度是底线**：插件开发者必须知道语义尺寸对应的列/行跨度，才能为不同尺寸适配卡片内容。

Dashboard 使用 **10 列逻辑网格系统**。网格行高由布局 view 根据单列实际宽度同步，保证 `S=1x1` 为正方形，其它尺寸由列/行跨度组合得到。

### 网格定义

| 尺寸 | colSpan | rowSpan | 用途                       |
| ---- | ------- | ------- | -------------------------- |
| S    | 1       | 1       | 纯展示：时钟、天气、小数据 |
| M    | 2       | 1       | 轻交互：快捷链接、开关     |
| L    | 2       | 2       | 中等交互：待办、便签       |
| XL   | 4       | 2       | 丰富交互：复杂表单、图表   |

### 实际尺寸（1200px 容器）

| 尺寸 | 宽度约 | 高度约 | 说明     |
| ---- | ------ | ------ | -------- |
| S    | 109px  | 109px  | 小巧紧凑 |
| M    | 230px  | 109px  | 标准横卡 |
| L    | 230px  | 230px  | 方形详情 |
| XL   | 472px  | 230px  | 横向展示 |

### 响应式断点

| 屏幕宽度 | 网格列数 |
| -------- | -------- |
| > 768px  | 10 列    |
| <= 768px | 1 列     |

### 技术实现

**CSS Grid 布局：**

```css
.workbench-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  grid-auto-rows: var(--dashboard-grid-cell, 96px);
  gap: 12px;
  align-items: stretch;
}
```

**JavaScript 定义：**

```typescript
// packages/plugin-api/src/widgetGeometry.ts
export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 1, rowSpan: 1 },
  M: { colSpan: 2, rowSpan: 1 },
  L: { colSpan: 2, rowSpan: 2 },
  XL: { colSpan: 4, rowSpan: 2 },
}
```

### 关键设计决策

1. **10 列逻辑网格**：让 `1x1 / 2x1 / 2x2 / 4x2` 四种尺寸直接映射到用户可理解的网格单位。
2. **行高跟随列宽**：布局 view 用 `ResizeObserver` 同步单元格尺寸，`S` 始终是正方形。
3. **尺寸只表达跨度**：卡片外壳不再通过 aspect-ratio 控制高度，插件只需按宿主给定内容区适配。
4. **XL 占 4/10 宽**：可以并排多个宽卡片，同时避免单个卡片独占整行。

### 插件开发指南

插件开发者可以依赖固定的语义跨度进行布局设计。宿主卡片外壳只提供边框、grid span、错误边界和右上角移除按钮；插件 card view 负责内容区 padding、滚动和截断：

```css
/* 针对不同尺寸优化布局 */
.widget[data-size="S"] {
  font-size: 12px;
  padding: 8px;
}
.widget[data-size="M"] {
  font-size: 14px;
  padding: 12px;
}
.widget[data-size="L"] {
  font-size: 16px;
  padding: 16px;
}
.widget[data-size="XL"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

## 7. 卡片展开子系统

### 7.1 展开视图协议

每种卡片类型有完全不同的展开视图内容。展开视图通过 widget contribution 的 `views` 注册，宿主用 registry 解析为组件后在统一容器中渲染。展开视图（含 footer 视图）与卡片视图共用同一套 `WidgetViewProps`（见 §12.1），不再有独立的 `ExpandViewProps`。

```text
// WidgetContribution.views（plugin-api/manifest.ts）
views: {
  card: string          // 必填：卡片视图
  expand?: string       // 可选：展开弹窗主体视图；缺省时回退渲染 card 视图
  expandFooter?: string // 可选：展开弹窗底部 footer 视图，注入宿主统一 footer 区域
  settings?: string     // 可选：实例设置视图
}
```

约束：

- `expandFooter` 仅在声明了 `expand` 时有意义。只声明 `expandFooter` 不声明 `expand`，按「无自定义 footer」处理，宿主不渲染 footer，不报错。
- footer 视图与主体视图同为 `WidgetViewProps`，共享 host 能力（`showToast`、`openExternal`、`data` 等）。
- footer 视图与主体视图是两个独立组件。瞬时 UI 状态（如当前面板、表单校验错误）由插件自行在内部建立「按 instanceId 的会话 store」共享，不进协议层。
- `mode: "settings"`（实例设置）不注入自定义 footer，也不渲染 footer。

### 7.2 展开容器动画

展开容器由宿主统一提供：

```text
打开：overlay fade in (250ms) + modal scale 0.95→1 + translateY 12px→0
内容：插件提供的 ExpandView
关闭：modal scale 1→0.95 + overlay fade out (250ms) → 移除
```

展开容器结构：

```text
ExpandModal
  ExpandHeader (图标 + 标题 + 关闭按钮)
  ExpandBody (插件 expand 视图)
  ExpandFooter? (仅插件提供 expandFooter 操作视图时渲染)
```

footer 区域渲染规则：

- widget 声明并注册了 `views.expandFooter` 时，宿主在 `expand-footer` 内用 `PluginViewBoundary` 隔离渲染该 footer 视图；footer 视图崩溃只局部兜底，不影响 body。
- 未声明或未注册 `views.expandFooter` 时，宿主不渲染 footer；关闭能力仍由右上角关闭按钮、`Esc` 和点击遮罩提供。

## 8. 上下文菜单子系统

### 8.1 右键菜单协议

上下文菜单使用事件委托，不为每个卡片绑定独立处理器：

```text
// platform-kernel 中注册
type ContextMenuRegistry = {
  register(extensionPoint: string, builder: ContextMenuBuilder): void
}

type ContextMenuBuilder = (instance: PluginInstance) => ContextMenuItem[]

type ContextMenuItem = {
  id: string
  label: string
  shortcut?: string
  danger?: boolean
  action: () => void
  separator?: "before" | "after"
}
```

### 8.2 默认菜单项

平台为 widget 扩展点提供默认菜单项（插件无需声明即可获得）：

```text
const DEFAULT_WIDGET_CONTEXT_MENU: ContextMenuItem[] = [
  // 尺寸选择（根据 supportedSizes 动态生成）
  ...getSizeMenuItems(instance),
  { separator: "before" as const },
  { id: "expand", label: "展开详情", shortcut: "双击", action: () => openExpand(instance) },
  { separator: "before" as const },
  {
    id: "remove",
    label: "移除实例",
    shortcut: "⌫",
    danger: true,
    action: () => removeInstance(instance),
  },
]
```

插件可以通过 widget contribution 的 `contextMenus` 声明自定义菜单项：

```text
type WidgetContextMenuContribution = {
  id: string
  label: string
  commandId?: string
  order?: number
  danger?: boolean
  when?: string
}
```

orchestrator 的 context menu model 负责合并默认 size / expand / remove 项与插件菜单项。插件菜单项优先绑定 command ID；缺失 command 或 command 不可用时不渲染，避免插件直接把 arbitrary function 注入宿主右键菜单。

## 9. 通知系统

### 9.1 Toast 组件

V2 原型验证了 Toast 堆叠模式。平台需要提供统一的 Toast 管理：

```text
// orchestrator 提供
type ToastManager = {
  show(message: string, options?: ToastOptions): string // 返回 toast ID
  dismiss(id: string): void
}

type ToastOptions = {
  type?: "success" | "error" | "warning" | "info"
  duration?: number // 默认 2500ms
  action?: { label: string; commandId: string }
}
```

Toast 行为：

- 新 Toast 从下方轻微上浮（`translateY(8px)→0`，200ms ease）
- 堆叠不超过 3 条，超出时移除最早的
- 每条独立计时 2.5s 后淡出移除
- 带 action 的 Toast 不自动消失
- 插件通过 `context.ui.showToast(message, options)` 触发 runtime toast bridge；layout 通过 `LayoutHostAPI.showToast(message, options)` 请求同一个宿主 Toast；shell 监听 `ui.toast.show`，由 `ToastHost` 渲染并通过 `commandId` 回调到 command executor，不允许插件直接注入任意函数到 Toast action。

### 9.2 插件可访问性

插件不直接操作 Toast 系统。通过 runtime context：

```text
context.ui.showToast("保存成功", { type: "success" })
```

## 10. 快捷键系统

### 10.1 全局快捷键注册

```text
// platform-kernel 新增
type ShortcutRegistry = {
  register(shortcut: ShortcutBinding): void
  unregister(id: string): void
}

type ShortcutBinding = {
  id: string
  keys: string // "mod+k", "mod+t", "mod+,", "?"
  description: string
  category: "global" | "layout" | "widget"
  action: () => void
  preventDefault?: boolean
}
```

### 10.2 MVP 快捷键表

| ID              | 快捷键 | 功能               | 类别   |
| --------------- | ------ | ------------------ | ------ |
| `cmd-palette`   | ⌘K     | 打开命令面板       | global |
| `toggle-theme`  | ⌘T     | 切换主题           | global |
| `add-widget`    | ⌘N     | 添加卡片           | global |
| `settings`      | ⌘,     | 打开设置           | global |
| `shortcuts`     | ?      | 快捷键参考         | global |
| `escape`        | Esc    | 关闭弹窗/菜单/面板 | global |
| `expand-card`   | 双击   | 展开卡片           | widget |
| `context-menu`  | 右键   | 上下文菜单         | widget |

快捷键通过 `KeybindingContribution` 声明，并绑定到 command ID，而不是直接绑定任意函数：

```text
type CommandContribution = {
  id: string
  title: string
  description?: string
  icon?: string
  category: string
  keywords?: string[]
  defaultShortcut?: string
  requiredCapabilities?: string[]
}

type KeybindingContribution = {
  id: string
  commandId: string
  key: string
  platform?: "mac" | "windows" | "linux" | string
  when?: string
  editable?: boolean
}
```

orchestrator 的 command catalog 合并平台强制命令与插件命令，并生成 CommandPalette 所需 view model；shortcut registry 负责平台过滤、冲突检测和禁用后注册的冲突 binding。shell 快捷键处理只读取 registry 并执行 command。

## 11. 设置架构

### 11.1 侧栏导航模型

V2 原型采用左侧分类导航 + 右侧内容区的结构。当前 PRD 已明确：设置中心仍需通过 `settings-panel` contribution 验证插件化闭环，因此技术方案不能把 `settings-panel` 降级为后续能力。

建议的分层方案：

```text
SettingsSurfaceHost (shell 提供，不可替换)
  ├── SettingsNav (侧栏导航，orchestrator 按已启用 contribution 组织)
  └── SettingsContent (右侧内容区)
      └── PluginViewBoundary
          ├── SettingsSchemaRenderer (官方默认安全 renderer)
          │   └── SettingsPanelProvider (插件模型、状态机和 actions)
          └── SettingsPanelCustomView (复杂场景逃生口)
```

每个标签页的内容：

- **通用**：布局选择器（列出所有 layout contributions）、工作区信息，以及注册到 `general` 分组的 `settings-panel` 内容。
- **外观**：主题切换、背景选择，以及相关插件贡献的外观面板内容。
- **搜索**：默认搜索引擎选择、`@语法` 说明，以及搜索相关插件贡献内容。
- **插件**：已安装插件列表、贡献能力摘要，以及插件管理相关面板内容。
- **AI**：模型 provider、默认模型、网关状态、插件 AI 授权摘要，以及注册到 `ai` 分组的设置面板内容。
- **关于**：平台内置说明，可附加只读插件贡献内容。

### 11.2 SettingsPanel 贡献的新角色

`settings-panel` contribution 将容器所有权、视觉所有权和业务所有权明确分开：

- `SettingsSurfaceHost` 只负责 modal、导航、焦点、滚动和错误边界；它不知道账号、同步、AI 或其他具体设置。
- `schema` 是默认路径。插件 provider 返回 `stack/group/text/field/status/row/actions` 语义节点，并处理 `dispatch(action, values)`；group 可提供右侧 meta，row 可提供说明、状态 meta 和行内 action；默认 renderer 用 `@tabora/ui` 统一渲染。账号类面板可声明 `layout: "account"` 与 `navigation` 摘要，actions 可声明 `segmented` 或 `form` 布局及 `pressed` 状态；这些字段只表达账号表单的交互语义，视觉仍由 shell renderer 和 Tabora token 统一提供。
- schema 不得携带 CSS、className、StyleX 样式、原始 token 或可执行 UI 代码。运行时使用严格 Zod schema 拒绝未知字段；password 字段必须为 `persistence: "ephemeral"` 且不允许 provider 给出默认值。
- provider 只能注册 manifest 已声明的 ID；停用或激活失败时由 kernel 统一回收。renderer 失败只影响当前 panel。
- `custom-view` 仅用于 schema 无法表达的复杂交互，仍必须使用宿主容器、`PluginViewBoundary` 和 `@tabora/ui`。

官方 `appearance/search/plugins` 面板当前显式声明为 `custom-view`；`official.account-sync` 作为第一个 schema provider，验证了页面状态机、敏感字段和按需装配闭环。

## 12. 扩展点 Props Contract V2

基于 V2 原型验证的交互模式，扩展点 props contract 需要增强：

### 12.1 Widget

Widget contribution 的展示元数据归插件所有，shell 不应按官方插件 ID 维护标题、图标或说明映射：

```text
type WidgetContribution = {
  id: string
  title: string
  icon?: string
  description?: string
  supportedSizes: WidgetSize[]
  defaultSize: WidgetSize
  allowMultipleInstances: boolean
  views: {
    card: string
    expand?: string
    expandFooter?: string
    settings?: string
  }
}
```

```text
type WidgetViewProps = {
  // 身份
  pluginId: string
  instanceId: string
  contributionId: string

  // 尺寸
  size: WidgetSize
  supportedSizes: WidgetSize[]

  // 数据
  config: Record<string, unknown>
  data: WidgetViewData

  // 宿主交互
  host: {
    updateConfig(value: Record<string, unknown>): Promise<void>
    removeInstance(): Promise<void>
    requestResize(size: WidgetSize): Promise<void>
    openModal(viewId: string, props?: unknown): void
    closeModal(): void
    openExpand(): void
    showToast(message: string, opts?: ToastOptions): void
    openExternal(url: string): Promise<boolean>
  }
}
```

宿主渲染 widget 前必须解析当前 `WidgetContribution` 并校验实例显式声明的 `size` 是否包含在 `supportedSizes` 内。缺少 contribution、缺少 `size` 或 size 不受支持时，该实例进入局部无效实例占位，不按 `defaultSize` 或硬编码 `"M"` 做读取时补齐。`defaultSize` 只用于用户新增实例时从 contribution 取初始尺寸；workspace preset 中的 widget instance 也必须显式写入 `size`。

`views.card` / `expand` / `expandFooter` / `settings` 都注册到 registry 并接收同一套 `WidgetViewProps`。展开弹窗的 footer 通过 `expandFooter` 视图注入宿主统一 footer 区域（详见 §7.1、§7.2）。

### 12.2 Search

```text
type WorkbenchSearchSettings = {
  defaultProviderId: string
  enabledProviderIds: string[]
}
```

当前实现以 `workbenchSearchSettingsSchema` 作为唯一协议入口：`enabledProviderIds` 必须显式存在且非空，`defaultProviderId` 必须包含在 `enabledProviderIds` 中。workspace session hydration、workspace import/export、preset 装配、settings 修改链路统一遵守这个不变量；遇到无效数据直接拒绝或显示错误状态，不再按首个 provider、首个 enabled provider 或全量 provider 列表猜测默认值。

```text
type SearchViewProps = {
  entry: "inline" | "palette"
  providers: SearchProviderContribution[]
  defaultProviderId: string
  activeProviderId: string
  query: string
  providerToken: string | null
  recentSearches: string[]
  results: SearchResultGroup[]
  activeResultIndex: number
  isOpen: boolean
  host: {
    setQuery(query: string): void
    submit(query: string, providerId?: string): Promise<void>
    setActiveProvider(providerId: string): void
    resolveProvider(keyword: string): SearchProviderContribution | null
    moveSelection(direction: "next" | "prev"): void
    executeSelection(resultIndex?: number): Promise<void>
    open(): void
    close(): void
    showToast(message: string): void
  }
}
```

### 12.3 SettingsPanel

```txt
type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
  scope: "global" | "workspace" | "plugin" | "instance"
  surface: "desktop" | "mobile"
  instanceId?: string // 仅 instance scope 且宿主明确指定目标时存在
  host: {
    close(): void
    setDirty(isDirty: boolean): void
    // 仅出现 manifest hostActions 请求且宿主授予的 action
  }
  data: {
    // 仅出现 manifest hostReads 请求且宿主授予的只读 DTO
    workspace?: SettingsWorkspaceSummary
    layouts?: OwnedContribution<LayoutContribution, "layout">[]
    themes?: OwnedContribution<ThemeContribution, "theme">[]
    searchProviders?: OwnedContribution<SearchProviderContribution, "search-provider">[]
  }
}
```

`SettingsPanelContribution` 必须显式声明 `section`、`scope` 和非空 `surfaces`：

```txt
type SettingsPanelContribution = {
  id: string
  title: string
  section: "general" | "appearance" | "search" | "account" | "ai" | "sync" | "plugins" | "about"
  scope: "global" | "workspace" | "plugin" | "instance"
  surfaces: Array<"desktop" | "mobile">
  order?: number
  content:
    | { kind: "schema"; provider: string; schemaVersion: 1 }
    | { kind: "custom-view"; view: string }
}
```

当前上线前阶段不再按旧 id 推断 section，也不为缺失 scope 或 surfaces 的旧 manifest 做默认补齐。SettingsHost 以 orchestrator navigator 作为主路径，先按当前 `surface` 过滤 panels，再组织导航和渲染；desktop 使用抽屉式双栏结构，mobile 使用全屏单列结构。设置页由 `@tabora/workbench-app` 的 `/settings/<section>` 路由承载，分类切换、关闭、移动端返回和浏览器历史都通过路由同步；SettingsHost 不直接管理 URL。provider context 和 custom-view props 都带入当前 surface；`scope: "instance"` 的 panel 在未传入明确 `instanceId` 时不得出现在导航或渲染树中，schema context 和 custom-view props 都只在显式目标存在时携带该 ID。

### 12.4 Workspace Preset

默认工作台装配通过 `workspacePresets` contribution 表达：

```txt
type WorkspacePresetContribution = {
  id: string
  title: string
  description?: string
  plugins: string[]
  layoutId: string
  themeId: string
  backgroundProviderId: string
  search: WorkbenchSearchSettings
  instances: WorkspacePresetInstanceContribution[]
  regions: WorkspacePresetRegionContribution[]
}
```

preset applier 只在创建新 workspace 时生成 workspace 与 plugin instances；已有 workspace 不做 backfill、不覆盖数据，也不为旧 seed 做迁移。preset widget instance 缺少 `size` 会被 schema 与 applier 拒绝，非 widget instance 不写入 `size`。官方默认 preset 额外通过 contract test 锁定 `pluginId / contributionId / layoutId / themeId / backgroundProviderId / search provider` 全链路引用必须命中当前 builtin 贡献，避免旧 ID 残留再次混入事实源。

Workspace 当前协议要求保存 `activeBackgroundProviderId`。导入 / 导出只接受当前 schema；缺失 `activeBackgroundProviderId` 的 workspace JSON 被拒绝，不按默认背景做补齐。搜索配置同样要求显式满足当前 `WorkbenchSearchSettings` 协议；缺失 `defaultProviderId`、缺失 `enabledProviderIds`、或二者不一致的旧 workspace / export 数据都会被拒绝。背景 provider 找不到时仍由背景 resolver 使用安全页面样式兜底，这是错误恢复机制，不是旧数据迁移。

当前实现中的 `parseExport()` 仍保持“schema 不通过即拒绝”的策略。这里额外明确一条宿主诊断约束：严格拒绝不等于静默失败，import/export UI 应向用户暴露可读诊断信息，例如 `schemaVersion` 不兼容、缺失字段路径、约束不满足项，以及被跳过的未知插件实例/插件数据。这些诊断只用于解释失败原因，不改变“不 silent backfill”的协议立场。

当前 export 会同时打包 workspace scope（`workspaceId`）与 instance scope（`instanceId`）的插件数据，避免只导出 workspace scope 而导致 widget 等实例数据丢失。import 遇到 workspace ID 冲突时会生成新 workspaceId，并为导入的实例生成新的 instanceId 映射，避免实例 ID 在全局表内冲突覆盖；同时会重建 `pluginDataRow.id` 以保持主键与 `workspaceId / instanceId` 一致。

### 12.5 Background Source

背景 provider 通过 `BackgroundSourceValue` 声明具体 source：

```txt
type BackgroundSourceValue =
  | { type: "css"; css: Record<string, string> }
  | { type: "image"; url: string; fit?: "cover" | "contain" | "fill" }
  | { type: "video"; url: string; poster?: string }
  | { type: "gradient"; css: string }
  | { type: "canvas"; view: string }
```

renderer contribution 的 `accepts` 与 source type 对齐，允许 `css`、`image`、`video`、`gradient`、`canvas`。宿主 resolver 优先读取 `source`，仅在缺失时使用 `defaultCss` 作为安全背景样式。

当前 MVP 只执行 `builtin` 插件，因此 `image` / `video` URL 当前按“受信任包声明的背景资产”处理，而不是一条独立的 runtime network capability。也就是说：

- 背景 source 的 URL 允许作为 manifest 静态声明存在，但不代表插件获得任意联网能力。
- 背景渲染器不得把交互式网络请求伪装成背景协议能力；若未来允许运行时下载背景素材、远端背景集合或第三方远程插件，必须把这一路径并入显式 `network` permission / host policy，而不是继续挂在 `BackgroundSourceValue` 的宽松字符串 URL 上。
- 当前阶段的远端背景资源是否可用，属于受信任包发布内容审核与宿主加载策略问题，不属于权限桥的已授权行为记录。

### 12.6 Loader 与兼容检查

`PluginManifest.apiVersion` 必填。`PluginLoader` 当前只接受 `builtin` source 记录，不执行远程或本地第三方代码；引入其他来源时需要同时补上 sandbox 与来源准入策略，不能只放宽 source 取值。loader 按 Tabora plugin API major version 做兼容检查，future major 直接 skipped/rejected；缺失 `apiVersion` 的 manifest 无例外拒绝。

## 13. 持久化增强

### 13.1 Storage Adapter Port

`@tabora/storage` 对外提供 `StorageAdapter` port，用于把 repository 创建与具体后端解耦：

```txt
type StorageAdapter = {
  database?: TaboraDatabase
  repositories: StorageRepositories
}
```

Web 默认 adapter 使用当前 Dexie/IndexedDB repository；app bootstrap 优先接收 `StorageAdapter` 以支持测试和未来跨平台替换。插件业务数据必须通过 runtime context / repository port 访问，插件 package 不得直接依赖 `@tabora/storage`。

这里额外约束 `database?` 的语义：它只是 Web/Dexie adapter 暴露给 bootstrap、测试或调试层的可选句柄，不是跨后端可移植 contract。跨平台调用方必须只依赖 `repositories`，不能把 `database` 是否存在写进业务路径判断，否则会把 Dexie 细节重新泄漏回 app / shell 层。

### 13.2 当前 MVP 表

```txt
class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>
  workspaceSnapshots!: Table<WorkspaceSnapshot, string>
}
```

`permissionGrants`、`eventLogs`、`searchHistory`、`shortcutBindings` 暂不进入 MVP schema，直到对应 repository 或 runtime port 落地。当前搜索历史由官方 search command bar 作为 plugin-owned workspace data 写入 `pluginData`，避免平台 schema 与插件数据路径双写。

`external-open` 与 `network` 都采用“manifest 请求 + host grant + runtime host 判断”的最小闭环：两者都按 hostname 求 request/grant 交集；`context.network.fetch()` 还必须经宿主注入的 network bridge 执行，插件业务不得直接调用全局 `fetch`。host 缺少 network capability 或 bridge 时，声明 network permission 的插件会在激活前跳过。当前不提供平台级持久授权记录或跨会话审计；后续 `clipboard`、`local-file` 等需要用户交互授权的能力也必须引入独立 permission repository / host grant store，而不是把授权结果混入 workspace 表或 `pluginData`。

### 13.3 Workspace Snapshot

> **Phase 2 移除**：原 Workspace Snapshot repository 和 `createLayoutSwitchPlan` 用于支持布局切换后的装配回滚，随布局切换机制一并删除。当前架构不存在”切换前备份 + 不兼容回滚”路径。

### 13.4 Plugin SDK v1 边界

插件协议分为四层，禁止把它们收进同一个 `BuiltinPlugin` 或 runtime context：

```text
1. declaration：PluginManifest、ContributionRef、settings/sync/command metadata
2. runtime registration：PluginModule.activate() 注册自己的 view/provider/command handler
3. host services：scoped data、UI、i18n、permission-gated external/network/file/AI 服务
4. host internal：installed record、runtime state、loader assets、workspace persistence model
```

`PluginModule` 只属于插件作者，包含 `manifest` 与 `activate(context)`。`InstalledPluginRecord` 保存 source、用户期望的启用状态与实际 permission grants；`LoadedPluginPackage` 保存 loader 解析后的 module 与资源；`PluginRuntimeState` 保存 active/error/skipped 等易变状态。插件 manifest 中的 permissions 是请求，不是 grant。

contribution 在 manifest 内只要求插件本地唯一 ID；kernel 生成 canonical `ContributionRef { pluginId, kind, id }` 并用于 catalog、workspace/template 和冲突诊断。持久化的 `PluginInstance` 只保存这一引用；旧 `pluginId / contributionId / extensionPoint` 只允许在 import 迁移边界读取，迁移完成后不得进入 runtime 或再次写入存储。只有 `RegionContentKind`（当前为 widget、search surface）能被 layout region 接收；theme、background、settings panel、command 和 keybinding 不属于 region instance。

存储仓库也是旧本地数据的受控迁移边界：它读取 legacy row 后校验、转换并立即覆写为 canonical row；`save()` 只接受 canonical instance。manifest 的单包校验建立 owner-aware 的本地 symbol table（注册型 view / command / settings provider 必须属于 manifest namespace），kernel 在完整发现批次上再执行 composition 校验，解析 workspace preset 的 plugin、contribution、region 与 layout default instance 链接。command 执行链统一返回 `Promise<boolean>`：programmatic 调用者可 await 结果，palette、shortcut、toast 等 UI 触发边界捕获 rejection 并显示局部失败提示。

manifest 校验除字段形状外，还必须验证引用完整性：插件包 ID 在一次发现中全局唯一；同一插件内的 view、provider、command、keybinding、widget context menu、layout region/defaultRegions 和 preset 引用均须可解析且符合所属插件。所有 manifest 引用的 view 由 kernel 纳入该插件的注册白名单；`canvas` 背景 source 的 view 也属于这一规则。发现期错误必须拒绝该包，不能等到首次渲染才暴露为白屏或未注册 view。

`PluginContext` 只能提供当前插件的 scoped registration facade，不暴露全局 Registry 的 `get/has`。command handler 必须在 activation 中注册，停用时和 view/provider 一起回收。runtime service 由 host 的实际服务集合提供；capability 表示服务是否存在，permission grant 表示插件是否能调用，服务调用仍必须执行范围检查。尚未实现 bridge 的 permission 不得出现在可授权 manifest 协议中；storage、workspace、network、clipboard、local-file、external-open 和 AI 任一项一旦公开，必须同时拥有 scope 收敛的 host service、request/grant 校验和拒绝时的明确错误。

插件 view 不得绕过 kernel 直接操作全局 overlay。modal/fullscreen 的目标 view 必须同时属于调用插件、已在 manifest 声明且已注册；关闭操作只影响调用插件拥有的 overlay。widget view 的 data/config/instance action 同样由按 plugin + workspace + instance scope 构造的 facade 提供，不能取得 repository、其他实例或其他插件的数据。

`@tabora/plugin-api/sdk` 是插件作者唯一允许导入的入口，只导出 manifest、runtime facade、view props、settings schema、layout view DTO 与安全辅助类型；插件边界测试禁止 `plugins/**` 和官方插件 pack 直接导入根 `@tabora/plugin-api`。`@tabora/plugin-api/host` 承载 Workspace、PluginInstance、PluginRecord、workspace schema 与 host-only validation；shell、storage、orchestrator 等宿主代码可以使用它。layout plugin 收到的 `LayoutInstance` 是只读投影，不含 workspace ID、创建时间或更新等持久化元数据。若 view 需要宿主状态，应通过只读 DTO，而不是泄漏持久化实体。

同步集合是 manifest 的可选声明。所有 plugin data 默认 `local-only`；只有显式声明 stable record key、updatedAt、merge 策略、schema version 与 excluded fields 的 collection 才能由同步基础设施观察。collection 是结构化记录空间，不是任意 repository key：每条记录必须保存 collection ID、稳定业务 record ID、scope、updatedAt 和 payload，ChangeDetector 据此决定是否入队并在上传前剔除 excluded fields。`StorageAdapter.repositories` 只包含 workspace、instance、plugin data、plugin record 与 snapshot 等核心端口；`StorageAdapter.sync` 是账号同步宿主显式装配的可选 queue/meta 端口。FNOS 不装配该插件时不创建认证、同步队列或同步调度。

`SyncManager.stop()` 是完整资源释放：必须注销数据库 change hooks、取消 timer、移除浏览器事件监听并阻止停止后的 public trigger 继续发起同步。重新启用账号插件只能创建一套监听器和一条变更队列路径。

账号/同步官方插件不接收 `StorageAdapter`、`TaboraDatabase` 或 Dexie table。host adapter 以 `AccountSyncService` 注入 auth client、sync manager 与 sync meta port；web / extension 只有在显式装配账号插件时创建该服务，FNOS 不创建它。

SettingsHost 是 shell 容器。schema provider 每次渲染都接收由 host 构造的受限 context：panel id、plugin id、scope、locale，以及 cancellation signal / invalidate；provider 不读取宿主 store。instance scope 还必须带有目标 instance identity，不能只靠字符串 scope 推断。custom-view 仍只能通过其明确声明的 view props 使用窄 facade，不能取得 registry、storage 或全局 overlay 控制权。custom-view 的可读数据必须用 `hostReads` 声明，再由宿主逐项授予；props 中只出现 `SettingsWorkspaceSummary`、catalog 摘要、搜索设置或插件摘要等只读 DTO，绝不注入 `Workspace`、regions、完整 manifest 或 repository record。custom-view 所需的 host action 以 panel contribution 的 `hostActions` 声明，再由宿主依据来源、platform capability 与 grant 逐项授予；不得以官方 plugin ID 白名单决定权限。未授予的 read 不出现在 `data` 中，未授予的 action 不出现在 `host` facade 中，绝不静默 no-op。

Theme token applier 只管理它自己最近一次写入的 CSS custom properties。切换主题时必须清理前一主题独有 token（包括 `@tabora/ui` 映射 token），但不得删除宿主或其他插件独立写入的变量。

Background applier 同样追踪它最近写入的 CSS properties；切换背景时移除上一背景独有属性后再应用新样式，未知 provider 则只应用安全页面底色。

FNOS 的生产包通过飞牛统一网关 `/app/tabora` 接入 NAS 登录态，Hono 只监听 `${TRIM_APPDEST}/app.sock`，不暴露独立 TCP 端口；本地开发才监听 loopback。CORS 仅允许无 Origin 的同源请求及 `localhost`/`127.0.0.1`/`[::1]` 本机开发 Origin，不能以 `origin: true` 向任意跨站页面开放本地数据。当前设备级 SQLite 数据库尚未按 `X-Trim-Userid` 隔离，因此桌面入口保持管理员可见，不能直接开放给所有 NAS 用户。

## 14. 错误回退体系

### 14.1 分层回退

```txt
Level 1: 内容级 → 单个 widget view 失败 → PluginViewBoundary 错误卡片
Level 2: 区域级 → 某个 region 所有实例失败 → 区域错误占位
Level 3: 插件级 → layout 插件失败显示布局不可用状态；theme/search 插件使用各自的显式局部状态或安全 token
Level 4: 存储级 → IndexedDB 读失败 → 安全默认 workspace（不覆盖原有数据）
```

### 14.2 安全默认

| 失败组件       | 回退方案                                                            |
| -------------- | ------------------------------------------------------------------- |
| Layout         | 显示“没有可用的布局插件”和具体错误，不激活替代布局                 |
| Theme          | 应用显式 `SAFE_THEME_TOKENS`（`platform.safe-theme` 最小 token 集） |
| Search         | 显示局部搜索不可用状态，⌘K 入口仍可达，不猜测首个 provider          |
| Background     | 移除背景层，使用安全纯色                                            |
| Settings Panel | 仅该面板显示错误，其他面板正常                                      |
| IndexedDB 读取 | 渲染默认工作台（manifest seed），不覆盖已有数据                     |
| IndexedDB 写入 | 捕获 QuotaExceededError，Toast 通知用户                             |

## 15. 测试策略

### 15.1 新增测试类型

| 类型                    | 覆盖目标                                                                             | 工具                  |
| ----------------------- | ------------------------------------------------------------------------------------ | --------------------- |
| Contract Tests          | 每个 contribution viewId 可解析、props 满足 contract                                 | Vitest                |
| Orchestrator Tests      | 区域映射、搜索路由、拖拽算法、command/keybinding/context menu/preset model           | Vitest                |
| Boundary Tests          | 插件源码和 package manifest 不依赖宿主/storage/app 内部                              | Vitest                |
| Interaction Tests       | 搜索键盘导航、拖拽交换、Toast 堆叠、右键菜单                                         | Vitest Browser Mode   |
| Storage Migration Tests | Schema 升级、quota 处理                                                              | fake-indexeddb        |
| A11y Tests              | 键盘可达性、焦点管理、ARIA 角色                                                      | axe-core + Playwright |
| Visual Regression       | 桌面/移动断点截图对比、主题切换、错误状态                                            | Playwright screenshot |

### 15.2 关键测试场景

```txt
布局：
  - Dashboard builtin layout 渲染 topbar / mainGrid region
  - 响应式断点：桌面 rail、移动 bottom-bar 在同一 layout view 内切换
  - 布局插件失败时显示布局不可用状态和具体错误

搜索：
  - 空搜索：显示收藏快捷命令
  - 输入 "@bing"：进入 provider-pending 状态并显示搜索源提示
  - 输入 "主题"：匹配切换主题命令
  - 输入 "@bing 天气"：路由到 Bing 搜索源
  - ↑↓ 导航，Enter 执行，Escape 关闭

设置：
  - 固定左侧导航正常切换：通用 / 外观 / 搜索 / 插件 / 关于
  - `settings-panel` 贡献渲染失败：仅对应面板报错，其他内容正常
  - 官方 settings panels 可读写并跨会话恢复

拖拽：
  - 拖拽卡片 A 到卡片 C 位置：A 和 C 交换
  - 拖拽 < 5px 不激活：不触发排序
  - 拖拽到非卡片区域：松手回原位
  - 触屏拖拽：passive: false 防止页面滚动

展开：
  - 双击便签：全高文本域
  - 双击待办：可交互列表（勾选实时同步）
  - Esc 关闭展开

右键：
  - 右键卡片：尺寸选择 + 展开 + 移除
  - 点击其他区域：菜单关闭
  - 当前尺寸高亮
```

## 16. 仓库结构调整

```txt
packages/
  plugin-api/           # 增加 layout.ts（LayoutViewProps/RegionSlot/LayoutHostAPI）和最小强制 schema
  platform-kernel/      # 增强：快捷键注册、上下文菜单注册
  orchestrator/         # 编排层
    src/
      plugin-catalog.ts
      search-model.ts           # provider token、@ 路由和搜索 URL
      command-palette-model.ts  # 命令面板和 inline 搜索结果模型
      drag-sort-model.ts
      context-menu-model.ts
      settings-navigator.ts
      toast-manager.ts
      shortcut-registry.ts
      workspace-preset.ts
      index.ts
  workbench-app/        # Shell composition/runtime：createLayoutEngine、renderer、workspace/session helper
  storage/              # StorageAdapter port + Web Dexie adapter + repository factory
  theme/                # 不变
  ui/                   # 仅扩展插件内容区组件，不承载宿主容器
  builtin-plugin-registry/ # 当前 shell 默认 builtin 插件列表
  official-plugins/     # 官方插件集合：引入官方 layout package + 其他官方 contribution
  workbench-shell/      # Shell host 样式 + WidgetCardShell + LayoutBoundary

plugins/
  official/
    widget-*/           # 官方业务卡片插件
  community/
  examples/
```

> **Phase 2 变更**：原独立 `layout-dashboard` 和 `layout-mobile` 插件包已删除，Dashboard 现作为 host builtin layout 注入。官方插件只包含 widget 和功能插件。

## 17. 当前实现地图

本节只记录当前职责和可验证入口，不维护已经完成的阶段计划。实现状态以源码、测试和
`docs/technical/tabora-regression-baseline.md` 为准。

| 领域 | 当前所有者 | 主要入口 |
| --- | --- | --- |
| 插件协议与校验 | `@tabora/plugin-api` | manifest、contribution、workspace、schema |
| 生命周期与权限 | `@tabora/platform-kernel` | plugin kernel、registry、runtime context、permission bridge |
| 跨插件纯模型 | `@tabora/orchestrator` | catalog、search、command、shortcut、context menu、workspace preset |
| 工作台组合与状态 | `@tabora/workbench-app` | runtime bootstrap、workspace/session、layout renderer、surface、shell controller |
| 宿主视图与错误隔离 | `@tabora/workbench-shell` | widget card shell、settings host、toast host、layout boundary |
| 持久化与导入导出 | `@tabora/storage` | repository、storage adapter、workspace snapshot |
| 默认装配 | `@tabora/builtin-plugin-registry` | builtin plugins、workspace preset、shell config |

关键用户路径由 `pnpm test`、`pnpm check` 和回归基准中的分层检查保护；
新增协议、storage、shell 或发布能力时，按回归基准同步扩展事实源和验证层级。

## 18. 风险与应对

| 风险                                       | 应对                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| orchestrator 抽象过度增加复杂度            | 每个模块独立可测试、独立可替换；不强求所有 orchestrator 模块同时完成  |
| 拖拽实时交换在大量卡片时性能下降           | 虚拟化 + requestAnimationFrame 节流；卡片数 > 50 时降级为简单排序     |
| 搜索 @语法 和命令/卡片模糊搜索的优先级冲突 | 严格优先级：@语法 > 命令精确匹配 > 卡片模糊匹配 > 网页搜索            |
| 严格 schema 拒绝导致导入可用性摩擦         | 保持协议严格，但宿主必须提供结构化诊断与可读错误，不做静默失败        |
| 背景远端资源与网络权限语义混淆             | 现阶段仅视为受信任包资产声明；未来运行时拉取背景必须并入 network 权限 |
| Dexie 细节经 `database?` 反向渗透到 shell  | 约束业务代码只依赖 repositories，把 `database` 视为调试/测试句柄      |
