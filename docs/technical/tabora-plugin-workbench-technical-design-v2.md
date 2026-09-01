# Tabora 插件化个人工作台技术方案 V2

本文件是当前架构与协议事实源，定义分层架构、扩展点协议、数据模型和测试策略。各领域的当前所有者和入口以源码、测试和 `docs/technical/tabora-regression-baseline.md` 为准，历史阶段变更查 git。Dashboard 是唯一 host builtin layout，mobile 是其响应式断点；layout 仍作为视图定义协议存在（`listLayouts` / `findLayoutContribution` 供 layoutEngine 取区域定义），但不支持运行时切换。

关联文档：产品 PRD `docs/product/tabora-plugin-workbench-prd.md`、官方插件设计 `docs/product/tabora-official-plugins-design.md`、设计事实源 `DESIGN.md`、交互原型 `docs/design/workbench-prototype.html`、回归基准 `docs/technical/tabora-regression-baseline.md`、文档地图 `docs/README.md`。

## 1. 架构总体设计

### 1.1 分层架构

```text
┌──────────────────────────────────────────────────────┐
│  Shell Layer (apps/app workbench, apps/extension)   │
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

关键变化：新增 **Orchestration Layer**（`@tabora/orchestrator`）。早期实现将编排逻辑散落在 `App.tsx` 中，造成 shell 与业务逻辑耦合。当前实现已开始把插件贡献查询、插件摘要、settings panel 收集、widget/search/layout contribution 解析收敛到 `@tabora/orchestrator` 的 `plugin-catalog.ts`，apps/app 的 workbench 只在组合根加载 builtin registry，业务渲染路径不直接扫描官方插件 manifest。搜索路由、拖拽排序、展开管理等复杂交互在编排层内聚。

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

包边界与装配约束（当前实现的具体文件划分以源码为准，此处只记不易从代码推断的边界规则）：

- `DESIGN.md` 中的组件 catalog 是**设计 catalog**，不是 `@tabora/ui` 的 1:1 导出清单。`@tabora/ui` 承接插件内容区基础组件和低层可访问 primitive；宿主级容器（`WidgetCardShell`、`ModalHost`、`SettingsHost`、`ToastHost`、`WorkbenchRail`、`WorkbenchGrid`、全局命令面板等）由 shell / `@tabora/workbench-app` / `@tabora/workbench-shell` 提供，宿主可复用 design spec 或 primitive，但不能把宿主所有权下沉到 `@tabora/ui`。
- 插件样式由 manifest `styles` 声明归属：`scope: "plugin"` 的 CSS 被宿主逐条前缀到该插件的 `data-tabora-plugin-id` 容器并以受管理的 `<style data-tabora-plugin-style>` 插入；`:root`/`html`/`body`/`:host`/`:global()` 及 `@keyframes`/`@font-face`/`@property`/`@page` 等无法安全收口的规则被拒绝，不静默退化为全局。`scope: "global"` 只允许 builtin 使用。此策略隔离样式资产，不把同一 JS realm 当作安全沙箱；不可信远程代码仍须走独立 sandbox runtime。宿主 app 入口只导入 app / `@tabora/ui` / `@tabora/workbench-shell` 的基础样式，不手动 import 插件 CSS。
- 默认 builtin plugin 列表、默认 workspace preset 和 shell 装配配置统一从 `@tabora/builtin-plugin-registry` 注入；`@tabora/workbench-app` 不直接依赖 `@tabora/official-plugins`。Package 聚合入口只用于真实 shell / 插件 pack / 完整公开 API 装配；消费单一能力时优先用与构建入口一致的稳定 subpath，避免加载无关模块图。
- 上线前不保留历史 manifest 兼容包袱：当前协议字段（`apiVersion`、settings panel `section/scope/surfaces/content`、workspace canonical contribution ref、widget instance `size` 等）必须显式声明，缺失即视为无效 manifest / 实例 / 导入数据，不做 silent backfill。`legacyMigration` 不作为 host capability 暴露。settings panel `content` 必须显式选 `{ kind: "schema", provider, schemaVersion: 1 }` 或 `{ kind: "custom-view", view }`。
- `WorkbenchSearchSettings` 为完整显式配置（`defaultProviderId`、`enabledProviderIds`，且默认 provider 必属启用列表）；workspace hydration / import-export / preset 统一走 schema 校验，不满足约束直接拒绝。theme resolver 仅在精确命中时返回 token，未命中应用显式 `SAFE_THEME_TOKENS` 并记录诊断，不回退 `themes[0]`。search provider 无隐式「首项 provider」兜底。
- AI Runtime P0：`@tabora/plugin-api` 定义文本/流式生成与 `ai.generate` 权限；`@tabora/platform-kernel` 仅按权限暴露可选 `context.ai`，不依赖第三方 agent 框架；`@tabora/ai-runtime` 提供基于 TanStack AI 的服务端 gateway 与统一 JSON/SSE transport。云端内置模型只接受已登录用户，插件只消费 Tabora 协议、不直接依赖 provider SDK。多轮对话见 `AiGatewayRequest.messages` 与 `context.ai.createChatConnection()`（实现 `createAiChatConnection`，`plugin-api` 只保留不依赖 TanStack 的 `AiChatConnection`）。
- 架构守卫（`pnpm check:architecture`）：`@tabora/orchestrator` 不依赖 `@tabora/storage` 或 `solid-js`；官方/community/example 插件不依赖 `@tabora/workbench-shell`、`@tabora/storage` 或 app 源码；app 间不直接 import 对方源码；生产源码不装配官方插件/layout package/core runtime，也不回流废弃 layout id；纯转导出兼容模块禁止回归。`WidgetSize -> grid span` 只由 `@tabora/plugin-api` 的 `widgetGeometry` 导出，避免三套映射漂移。
- `@tabora/storage` 通过 `StorageAdapter` port 支持注入 fake/memory adapter 或跨平台替换；当前 Dexie schema 为单 version、只声明 MVP 表、不保留旧版本迁移。FNOS 以 HTTP adapter 把 repository 操作交给本地 Hono + SQLite；账号与同步由 `official.account-sync` 可选插件装配，纯本地宿主不初始化认证/同步 runtime。
- 运行时收口规则：search provider 在 runtime catalog 带 `pluginId/pluginName` owner descriptor，外部打开按 provider owner 做 `external-open` 权限判断；插件禁用执行 activation disposer 并注销已注册 view，active contribution 只来自 enabled plugin，plugin summaries 保留全部插件供管理面板；布局 view 失败由 layout error tracker 记录 layout id 与错误并显示布局不可用状态；runtime context 无 `getConfig/setConfig`，实例数据通过 widget props 的 `data` 与 scoped data host 显式传递；搜索历史作为 plugin-owned workspace data 存于 `pluginData`。
- kernel loader 对内置和可信本地包强制 manifest schema 与 API major version 兼容检查、记录 skipped reason；远程不可信执行不在 MVP 范围。`@tabora/workbench-app` 承接 runtime bootstrap（database/repositories/catalog/kernel 集中创建）与共享 shell helper（`external-open` 判断、theme/background/grid/workspace session/import-export）；`@tabora/host-adapters` 提供 web/extension/HTTP 平台工厂，bootstrap 可接收不带 Dexie 的 host storage adapter（此类宿主不提供基于 Dexie 的导入导出）。`SearchViewProps` 是宿主注入 `query/results/activeResultIndex/host actions` 的状态机 contract，搜索栏只渲染和转发事件。
状态分层约束：持久化数据域（workspace / instances / searchSettings / searchHistory）用 `createSignal`（避免 store proxy 进入 IndexedDB 结构化克隆），纯 UI 域用 `createStore`。extension newtab 有自己的 shell entry，不直接 import apps/app workbench 源码；共享 shell helper 由 `@tabora/workbench-app` 暴露，`pnpm check:architecture` 禁止 app 间互相 import 源码。`workbench-app/src` 按垂直切片（shell/runtime/widget/search/workspace/layout/appearance/surface/command/drag/shared）组织，具体文件以源码为准。

`@tabora/orchestrator` 承载跨插件纯模型：插件贡献目录（catalog）、区域映射（Dashboard 唯一 builtin layout、无运行时切换）、搜索（模糊搜索 / 建议 / @语法 provider 解析）、拖拽排序计划、卡片展开、上下文菜单和设置导航。具体导出以 `packages/orchestrator/src` 为准，均为不依赖 storage 或 solid-js 的纯模型。

## 3. 布局架构

> **Phase 2 变更**：早期设计支持"多布局插件 + 运行时切换"。当前架构已收敛为**单一 Dashboard host builtin layout**，mobile 作为其响应式断点。运行时布局切换（`switchLayout`、layout-switcher 编排层、instance region 迁移、workspace snapshot 回滚）已全部移除。以下 3.1/3.2 的 layout contribution 协议仍作为**视图定义契约**保留（Dashboard 通过它声明 region 结构和响应式能力），但不再存在多个 layout 之间的运行时切换路径。

### 3.1 布局协议与壳体 Contract

Dashboard layout 通过 layout contribution 声明区域结构（`LayoutContribution` / `LayoutRegion` 类型见 `@tabora/plugin-api`：`regions` 带 `accepts` 扩展点、`required`、`maxInstances`、`defaultVisible` 等）。布局 view 接受泛化的 `{ regions, isMobile, host }` 而非硬编码 `{ rail, topbar, mainGrid }`；每个 `RegionSlot` 提供 `instances` 和 `render()/renderInstance()`。Solid 实现侧用 `LayoutViewProps<JSX.Element>`，协议层不绑定具体 renderer。

### 3.2 响应式与不可用状态

Dashboard 是唯一布局、无运行时切换：宿主加载 builtin layout contribution，按 `region.accepts` 把 instances 映射到 topbar/mainGrid，渲染 `DashboardLayout(regions, isMobile, host)`，`isMobile` 由 `@tabora/workbench-app` responsive state 提供（桌面 rail+顶部搜索+主网格，移动折叠为底部导航栏并按窄屏密度重排，跨 768px 断点时 layout renderer 重挂载）。工作区导入/切换直接用持久化的 instances 和 region 映射，不做 instance region 迁移或 snapshot 回滚。活跃布局未注册、view 不存在或渲染失败时，宿主记录 layout id 和错误并显示布局不可用状态。

## 4. 区域渲染引擎

shell renderer 提供通用区域渲染引擎，避免把 `rail`/`topbar`/`mainGrid` 的 JSX 生成硬编码进 App。该职责归 `@tabora/workbench-app` 的 `createLayoutEngine` / layout runtime：按 region 过滤 enabled instance、按 grid order 排序，逐个用 `PluginViewBoundary` 隔离渲染解析出的 view。`LayoutView` 只调用引擎填充区域，不知道内容类型；`@tabora/orchestrator` 只负责 region→instance 纯映射和编排模型，不绑定 JSX renderer。

Rail、工具条和错误状态入口不伪装成 `layout` 实例（否则污染扩展点语义）：布局壳体只决定入口出现在哪里、以什么容器呈现，动作由 `LayoutHostAPI` 提供（`getGlobalActions(surface)`、`openSettings/openCommandPalette/openAddWidget`、`readLayoutState/writeLayoutState`、`showToast`、`toggleTheme` 等，`HostActionItem` 的稳定 id 与类型见 `@tabora/plugin-api`）。Dashboard 把 `getGlobalActions("rail")` 渲染成 rail 按钮组；布局缺失或失败时显示错误状态而非伪装 contribution。

## 5. 搜索子系统

搜索分三层：UI 层（内联搜索栏 + ⌘K 命令面板浮层 + provider 提示），engine 层（`@tabora/orchestrator`：命令/卡片/网页模糊搜索、@语法解析路由、分组建议、键盘导航状态、内联与 ⌘K 状态同步），provider 协议层（`SearchProviderContribution` / `SearchViewProps` / `SearchResult`，见 `@tabora/plugin-api`）。

搜索输入按严格优先级路由：`@源` 单独输入进入 provider-pending，`@源 词` 路由到该 provider，否则依次尝试精确命令匹配、卡片名称模糊匹配，最后落到默认网页搜索。键盘导航（↑↓ 移动 activeIndex、Enter 执行、Esc 关闭/清空）是平台级协议由 engine 统一处理；插件只渲染搜索表面和结果项视觉，不负责结果计算、激活态、方向键导航和执行时机。

## 6. 拖拽排序子系统

拖拽采用实时交换（悬停即交换数组位置），落地为两层：`@tabora/orchestrator` 的 `createDragSortPlan()` 负责纯数组交换计划，`@tabora/workbench-app` 的 `WorkbenchShellDragState.ts` 负责移动阈值、命中目标解析和只在指针释放时提交持久化。协议约束是「只有真正发生位移才落库排序」——单击不能被当成排序，否则卡片会从指针下方挪走、双击展开随之失效。阈值、命中解析和点击/拖拽区分的实现细节及其成因见 `WorkbenchShellDragState.ts` 的行内注释。

## 6.6 卡片网格系统

Dashboard 用 10 列逻辑网格，`S/M/L/XL` 映射到固定的列/行跨度，是插件可依赖的稳定语义。网格常量、尺寸用途和设计理由（尺寸只表达跨度、行高跟随列宽、XL 占 4/10 宽）见 `packages/plugin-api/src/widgetGeometry.ts` 的 `WIDGET_GRID_GEOMETRY`；列宽同步与响应式列数（>768px 用桌面列数、窄屏降级）见 `packages/workbench-app/src/surface/dashboard/dashboard-layout.tsx`。宿主卡片外壳只提供边框、grid span、错误边界和移除按钮，插件 card view 负责内容区 padding、滚动和截断。

## 7. 卡片展开子系统

展开视图通过 widget contribution 的 `views`（card 必填，expand/expandFooter/settings 可选）注册，宿主用 registry 解析后在统一容器（ExpandHeader/ExpandBody/ExpandFooter?）中渲染，与卡片视图共用同一套 `WidgetViewProps`（见 §12.1），无独立 `ExpandViewProps`。约束：`expandFooter` 只在声明了 `expand` 时有意义，缺 `expand` 时按「无 footer」处理不报错；footer 与主体是两个独立组件，瞬时 UI 状态由插件自建「按 instanceId 的会话 store」共享、不进协议层；`mode: "settings"` 不渲染 footer。声明并注册 `expandFooter` 时宿主在 `expand-footer` 内用 `PluginViewBoundary` 隔离渲染，崩溃只局部兜底；未声明时不渲染 footer，关闭仍由关闭按钮、`Esc` 和点击遮罩提供。

## 8. 上下文菜单子系统

右键菜单用事件委托，不为每个卡片绑定独立处理器（`ContextMenuRegistry` / `ContextMenuItem` 类型见 `@tabora/plugin-api`）。平台为 widget 扩展点提供默认项（按 `supportedSizes` 动态生成的尺寸选择、展开详情、移除实例，插件无需声明即得）。插件通过 widget contribution 的 `contextMenus` 声明自定义项。orchestrator 的 context menu model 合并默认项与插件项；插件项必须绑定 command ID，缺失或不可用时不渲染，避免插件把任意函数注入宿主右键菜单。

## 9. 通知系统

Toast 统一由 `@tabora/orchestrator` 的 `createToastManager` 管理（`ToastManager` / `ToastOptions` 类型和默认时长见 `packages/orchestrator/src/toast-manager.ts`）：堆叠上限固定，超出移除最早一条；无 action 的 toast 自动消失，带 action 的常驻。协议约束是插件不直接操作 Toast，只通过 `context.ui.showToast(message, options)`；layout 通过 `LayoutHostAPI.showToast` 请求同一宿主 Toast；shell 由 `ToastHost` 渲染并用 `commandId` 回调 command executor，不允许插件把任意函数注入 Toast action。

## 10. 快捷键系统

快捷键通过 `KeybindingContribution` 声明并绑定到 command ID，而不是直接绑定任意函数（`CommandContribution` / `KeybindingContribution` 类型见 `@tabora/plugin-api`）。orchestrator 的 command catalog 合并平台命令与插件命令并生成 CommandPalette view model；`packages/orchestrator/src/shortcut-registry.ts` 负责平台过滤、归一化、冲突检测和禁用冲突 binding，shell 只读取 registry 并执行 command。

MVP 快捷键：⌘K 命令面板、⌘T 切换主题、⌘N 添加卡片、⌘, 设置、`?` 快捷键参考、Esc 关闭弹窗/菜单/面板；widget 层双击展开卡片、右键上下文菜单。

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

扩展点的 props/contribution 类型是插件与平台的类型契约，显式定义在 `@tabora/plugin-api`（`manifest.ts` / schema）；本节只记类型签名之外、不易从代码推断的语义约束。

### 12.1 Widget

Widget 展示元数据（title/icon/description/supportedSizes/defaultSize/views）归插件所有，shell 不按官方插件 ID 维护标题/图标映射。宿主渲染前必须校验实例显式声明的 `size` 属于 `supportedSizes`：缺 contribution、缺 `size` 或 size 不受支持时进入局部无效实例占位，不按 `defaultSize` 或硬编码 `"M"` 做读取时补齐；`defaultSize` 只用于新增实例取初值，preset 中的 widget instance 也必须显式写 `size`。`views` 的 card/expand/expandFooter/settings 都注册到 registry 并共用同一套 `WidgetViewProps`（host 能力含 `updateConfig`/`removeInstance`/`requestResize`/`openModal`/`openExpand`/`showToast`/`openExternal`），footer 注入见 §7。

### 12.2 Search

`WorkbenchSearchSettings` 以 `workbenchSearchSettingsSchema` 为唯一协议入口：`enabledProviderIds` 显式非空，`defaultProviderId` 必属其中。workspace hydration、import/export、preset 装配、settings 修改统一遵守此不变量，无效数据直接拒绝或显示错误，不按首个/全量 provider 猜测默认值。`SearchViewProps` 是宿主注入 `query/results/activeResultIndex/providerToken/host actions` 的状态机契约，搜索栏只渲染和转发事件。

### 12.3 SettingsPanel

`SettingsPanelContribution` 必须显式声明 `section`（general/appearance/search/account/ai/sync/plugins/about）、`scope`（global/workspace/plugin/instance）、非空 `surfaces` 和 `content`（`{ kind: "schema", provider, schemaVersion: 1 }` 或 `{ kind: "custom-view", view }`）；`SettingsPanelViewProps.data` 只携带 manifest `hostReads` 请求且宿主授予的只读 DTO。上线前阶段不按旧 id 推断 section、不为缺 scope/surfaces 的旧 manifest 补齐。SettingsHost 以 orchestrator navigator 为主路径，先按当前 `surface` 过滤再组织导航：desktop 抽屉式双栏、mobile 全屏单列。设置页由 `@tabora/workbench-app` 的 `/settings/<section>` 路由承载，分类切换/关闭/返回/历史都经路由同步。`scope: "instance"` 的 panel 未传入明确 `instanceId` 时不得出现在导航或渲染树。

### 12.4 Workspace Preset

默认工作台装配通过 `workspacePresets` contribution 表达（字段见 `@tabora/plugin-api`）。preset applier 只在创建新 workspace 时生成 workspace 与实例，已有 workspace 不 backfill、不覆盖、不迁移旧 seed；widget instance 缺 `size` 被拒绝，非 widget 不写 `size`。官方默认 preset 由 contract test 锁定 `pluginId/contributionId/layoutId/themeId/backgroundProviderId/search provider` 全链路引用必须命中当前 builtin 贡献。

Workspace 协议要求显式 `activeBackgroundProviderId` 和满足 `WorkbenchSearchSettings` 的搜索配置；import/export 只接受当前 schema，缺字段或不一致的旧数据直接拒绝，不按默认值补齐（背景 provider 找不到时由 resolver 用安全页面样式兜底，属错误恢复而非迁移）。严格拒绝不等于静默失败：import/export UI 必须暴露可读诊断（`schemaVersion` 不兼容、缺失字段路径、约束不满足项、被跳过的未知实例/数据）。export 同时打包 workspace scope 与 instance scope 的插件数据；import 遇 workspace ID 冲突时重建 workspaceId、instanceId 映射和 `pluginDataRow.id`，避免全局表主键冲突覆盖。

### 12.5 Background Source

`BackgroundSourceValue` 声明 source 类型（css/image/gradient/video/canvas，定义见 `@tabora/plugin-api`），renderer 的 `accepts` 与之对齐，resolver 优先读 `source`、缺失时用 `defaultCss` 兜底。关键约束：当前 MVP 只执行 builtin 插件，`image`/`video` URL 按「受信任包声明的背景资产」处理，不等于插件获得联网能力；背景渲染器不得把交互式网络请求伪装成背景协议，未来运行时拉取远端背景必须并入显式 `network` permission，而不是继续挂在宽松字符串 URL 上。

### 12.6 Loader 与兼容检查

`PluginManifest.apiVersion` 必填且缺失即拒绝。`PluginLoader` 当前只接受 `builtin` source，不执行远程或本地第三方代码；按 API major version 做兼容检查，future major 直接 skipped/rejected。引入其他 source 必须同时补 sandbox 与准入策略，不能只放宽 source 取值。

## 13. 持久化增强

### 13.1 Storage Adapter Port

`@tabora/storage` 的 `StorageAdapter` port 把 repository 创建与后端解耦（`{ database?, repositories }`，类型见包）。Web 默认 adapter 包装 Dexie/IndexedDB，bootstrap 优先接收 adapter 以支持测试与跨平台替换。插件业务数据只经 runtime context / repository port 访问，插件 package 不得直接依赖 `@tabora/storage`。`database?` 只是 Web/Dexie adapter 给 bootstrap/测试/调试的可选句柄，不是跨后端 contract：跨平台调用方只依赖 `repositories`，不得把 `database` 是否存在写进业务路径，否则会把 Dexie 细节泄漏回 app/shell。

### 13.2 当前 MVP 表

`TaboraDatabase` 当前表见 `@tabora/storage`（plugins/workspaces/pluginInstances/pluginData/meta/workspaceSnapshots）。`permissionGrants`、`eventLogs`、`searchHistory`、`shortcutBindings` 在对应 repository/runtime port 落地前不进 schema；搜索历史由官方 search command bar 作为 plugin-owned workspace data 写入 `pluginData`，避免平台 schema 与插件数据双写。

`external-open` 与 `network` 都走「manifest 请求 + host grant + runtime host 判断」最小闭环，按 hostname 求 request/grant 交集；`context.network.fetch()` 必须经宿主注入的 network bridge，插件不得直接调用全局 `fetch`，host 缺 capability/bridge 时声明 network 的插件在激活前跳过。当前无平台级持久授权记录或跨会话审计；后续 `clipboard`、`local-file` 等交互授权能力必须引入独立 permission repository / host grant store，不得把授权结果混入 workspace 表或 `pluginData`。

### 13.3 Plugin SDK v1 边界

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
| A11y Tests              | 键盘可达性、焦点管理、ARIA 角色                                                      | Vitest + jsdom        |

### 15.2 关键测试场景

必须覆盖的可观察行为：布局渲染 topbar/mainGrid region 与桌面/移动响应式切换、布局失败时的不可用状态；搜索的空态收藏命令、`@源` provider-pending、命令匹配、`@源 词` 路由、↑↓/Enter/Esc 键盘导航；设置侧栏分类切换、单面板渲染失败隔离、官方 panel 跨会话读写；拖拽交换、位移阈值内不触发排序、非卡片区域回原位、触屏不滚动；双击展开与 Esc 关闭；右键尺寸/展开/移除与当前尺寸高亮。

## 16. 风险与应对

| 风险                                       | 应对                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| orchestrator 抽象过度增加复杂度            | 每个模块独立可测试、独立可替换；不强求所有 orchestrator 模块同时完成  |
| 拖拽实时交换在大量卡片时性能下降           | 虚拟化 + requestAnimationFrame 节流；卡片数 > 50 时降级为简单排序     |
| 搜索 @语法 和命令/卡片模糊搜索的优先级冲突 | 严格优先级：@语法 > 命令精确匹配 > 卡片模糊匹配 > 网页搜索            |
| 严格 schema 拒绝导致导入可用性摩擦         | 保持协议严格，但宿主必须提供结构化诊断与可读错误，不做静默失败        |
| 背景远端资源与网络权限语义混淆             | 现阶段仅视为受信任包资产声明；未来运行时拉取背景必须并入 network 权限 |
| Dexie 细节经 `database?` 反向渗透到 shell  | 约束业务代码只依赖 repositories，把 `database` 视为调试/测试句柄      |
