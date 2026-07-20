# Tabora 插件化个人工作台技术方案 V2

版本：V2.5

日期：2026-06-08

状态：当前架构与协议事实源；实施阶段见 §17。

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
│  - 布局切换引擎  - 区域实例映射  - 搜索路由            │
│  - 拖拽排序协调  - 展开视图管理  - 设置导航            │
│  - 实例迁移逻辑  - 上下文菜单分发                      │
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
│  - @tabora/ai-runtime (Vercel AI SDK adapter)         │
│  - @tabora/storage (IndexedDB 持久化)                  │
│  - @tabora/theme (CSS custom properties)              │
│  - @tabora/brand (品牌图标源与品牌组件)               │
│  - @tabora/ui (基础组件库)                             │
│  - @tabora/official-plugins (官方插件集合)             │
│  - @tabora/builtin-plugin-registry (默认 builtin 装配) │
└──────────────────────────────────────────────────────┘
```

关键变化：新增 **Orchestration Layer**（`@tabora/orchestrator`）。早期实现将编排逻辑散落在 `App.tsx` 中，造成 shell 与业务逻辑耦合。当前实现已开始把插件贡献查询、插件摘要、settings panel 收集、widget/search/layout contribution 解析收敛到 `@tabora/orchestrator` 的 `plugin-catalog.ts`，playground 只在组合根加载 `officialPlugins`，不再在业务渲染路径里直接扫描官方插件 manifest。后续继续把布局切换、区域实例渲染和搜索路由迁出 shell。

拆出独立编排层后：

- Shell 只负责 DOM 挂载、宿主容器渲染、全局生命周期
- Orchestrator 负责所有跨插件、跨区域的协调逻辑
- 布局切换、搜索路由、拖拽排序、展开管理等复杂交互在编排层内聚

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
  ai-runtime/           # AI Runtime adapter，P0 基于 Vercel AI SDK
  orchestrator/         # 新增：布局切换、区域映射、搜索路由、拖拽、展开、设置导航
  workbench-app/        # Phase X1 起步：跨 shell 的 workbench composition 承载层
  host-adapters/        # Phase X1 起步：Web / extension / desktop host capability adapters
  storage/              # IndexedDB 持久化（当前单版本 schema、quota / 错误处理）
  theme/                # Token 应用（不变）
  brand/                # 品牌图标源文件、品牌组件、静态图标路径导出
  ui/                   # 插件内容区基础组件（按 V2 组件规范扩展，不承接宿主容器）
  builtin-plugin-registry/ # Phase X1.5：默认 builtin 装配
  official-plugins/     # 官方插件集合
  workbench-shell/      # Shell host 样式与通用宿主容器组件
```

设计 catalog 与包边界的映射需要额外说明：

- `DESIGN.md` 中的组件 catalog 是**设计 catalog**，不是 `@tabora/ui` 的 1:1 导出清单。
- `@tabora/ui` 承接插件内容区基础组件和低层可访问 primitive，如 `Button`、`Input`、`Field`、`ListRow`、`CardSection`、`Kbd`、`Dialog`、`Drawer`、`Toast`、`ContextMenu`、通用 `CommandPalette` 等。
- Tabora 宿主级容器由 shell / `@tabora/workbench-app` / `@tabora/workbench-shell` 提供，例如 `WidgetCardShell`、全局 `ModalHost`、`FullscreenHost`、`SettingsHost`、`ToastHost`、`WorkbenchRail`、`WorkbenchGrid`、shell 全局命令面板和快捷键面板。宿主可复用 design spec 或 primitive，但不能把宿主所有权下沉到 `@tabora/ui`。
- 插件样式由插件 manifest 的 `styles` 声明归属：`scope: "plugin"` 的样式必须依赖宿主注入的 `data-tabora-plugin-id` 容器完成选择器收口，layout 这类需要影响页面骨架的样式可显式声明 `scope: "global"`。builtin 装配层通过 `@tabora/builtin-plugin-registry` 把 manifest 中的相对 `href` 映射为 Vite 可加载的 CSS asset URL；可信本地插件可基于 `baseUrl` 解析相对样式。`@tabora/workbench-app` bootstrap 汇总 loader 输出的 `pluginStyles`，`PluginStyleManager` 按插件启用状态和声明顺序在运行时插入 / 移除 `<link data-tabora-plugin-style>`。playground 与 extension 入口只导入 app / `@tabora/ui` / `@tabora/workbench-shell` 的宿主基础样式，不再手动 import 官方插件、layout 或第三方插件 CSS，也不提供 `@tabora/official-plugins/styles.css` 兼容聚合入口。
- StyleX authoring 与构建统一由 `@tabora/stylex-config` 管理：Solid host / Kobalte slot 使用 `stylex.attrs()`；跨 package 语义变量由 `@tabora/theme/tokens.stylex` 的 `defineVars` 提供；variant 使用普通 object map。根 `vite.config.ts` 把共享 Rolldown/unplugin pipeline 注入 `vp pack`，对声明 `./styles.css` 的 StyleX package 合并 source global CSS 与抽取规则、验证非空并写入 manifest 声明的 `dist/styles.css`。各 package 不再调用 StyleX CLI 或创建 `.stylex-build`。UI、shell、layout、官方插件 pack 和每个可独立启停的插件仍保留独立 CSS asset，`@tabora/builtin-plugin-registry` 的 `?url` 映射与运行时 style lifecycle 不变。非 StyleX CSS export 继续按 package source/publish 声明复制，不按包名写特殊分支。
- 默认工作区 preset 的归属也已与样式装配保持一致：`@tabora/workbench-app` 不再直接依赖 `@tabora/official-plugins` 或内置官方 preset 常量；shell 入口统一从 `@tabora/builtin-plugin-registry` 注入默认 builtin plugin 列表、默认 workspace preset 与 shell 装配配置，再由 runtime bootstrap / session seed / shell initial visual state / host command-layout bridge 显式消费。
- Phase X2 已完成布局协议语义收口：`HostActionId` 已包含 `layout-switch`、`shortcuts`、`plugin-manager` 等稳定动作 ID，布局切换不再伪装为 `theme` action；`RegionSlot` 为泛型渲染结果契约，`plugin-api` 不绑定 Solid JSX，workbench shell 的 `createLayoutEngine` 会按 `region.accepts` 过滤实例，避免 extension point 错配；官方与 community layout package 已移除对 `@tabora/workbench-shell` 的依赖，保持第三方 layout 依赖面隔离；playground / extension 通过 `@tabora/workbench-app` responsive state 向 layout 传入真实 `isMobile`；默认 workspace seed 不再保存伪 `rail` region；布局错误 fallback 会记录状态并触发 toast。
- Phase X3-X8 插件系统可扩展性收尾已完成：layout switcher、drag sort model、command catalog、shortcut registry、context menu model、settings navigator、toast manager、workspace preset applier 均已进入 `@tabora/orchestrator`；JSX 布局渲染桥、layout view 解析和 safe layout fallback 属于 shell renderer 职责，已归入 `@tabora/workbench-app`；apps 只消费模型和 host callbacks，不再保留对应纯推断逻辑。
- `@tabora/plugin-api` 已补齐 command、keybinding、widget context menu、settings section/scope、workspace preset、host compatibility、background source 等协议类型和 schema。当前为上线前阶段，不保留历史 manifest 兼容包袱：`apiVersion`、settings panel `section/scope`、workspace `activeBackgroundProviderId`、widget instance `size` 等当前协议字段必须显式声明；缺失即视为无效 manifest / 无效实例 / 无效导入数据。`legacyMigration` 不再作为 host capability 暴露。
- 2026-07-13 AI Runtime P0 补充：`@tabora/plugin-api` 新增 AI 协议类型、manifest `ai` 权限和 settings `ai` section；`@tabora/platform-kernel` 在 `PluginRuntimeContext` 中按 `{ type: "ai", access: [...] }` 授权暴露可选 `context.ai`，自身不依赖第三方 agent 框架；`@tabora/workbench-app` bootstrap 接收宿主注入的 `AiRuntimeBridge` 并传入 kernel；`@tabora/ai-runtime` 作为基础设施包，当前基于 Vercel AI SDK 的 `generateText` / `streamText` 提供默认 adapter，并把敏感工具执行收口到宿主审批回调。插件只消费 Tabora 协议，不直接依赖 Vercel AI SDK。
- 2026-06-07 发布前兼容性清理补充：仓库内部 refactor 不再为旧调用方式保留兼容 wrapper。helper 签名、模块出口和调用方允许一并重构；app 层仅保留 `workbenchComposition` 这类真实装配工厂，纯 `export * from "@tabora/workbench-app"` 的兼容转导出模块全部删除，并由 `pnpm check:architecture` 守卫禁止回归；同一批守卫也禁止废弃 `official.layout.dashboard` 等旧 layout id 回流到生产源码。
- `@tabora/plugin-api` 当前额外导出 `workbenchSearchSettingsSchema`、`pluginInstanceSchema`、`workspaceSchema`、`workspaceExportSchema` 作为当前工作台协议事实源。`WorkbenchSearchSettings` 当前协议为完整显式配置：`defaultProviderId: string`、`enabledProviderIds: string[]`，并要求默认 provider 必须属于启用列表。workspace hydration、import/export 和 preset 链路统一走 schema 校验；缺失字段、旧导出或不满足约束的数据直接拒绝，不再按“首个 provider”或“全量 providers”做 silent backfill。
- `@tabora/platform-kernel` 已提供 plugin loader abstraction、插件 API major version 兼容检查、host platform/capability 检查、skipped reason 记录，以及 runtime toast bridge。内置插件和可信本地包都必须通过 manifest schema 与 API 兼容检查；远程不可信执行仍不在 MVP 范围内。
- `@tabora/storage` 已引入 `StorageAdapter` port；Web 默认 adapter 包装当前 Dexie/IndexedDB repository，`workbench-app` bootstrap 可注入 fake/memory adapter 进行测试或未来跨平台替换。当前上线前 schema 采用单一 Dexie version，直接声明 MVP 所需表，不保留旧版本迁移/backfill 路径。
- 插件依赖边界已由测试守卫：官方、community、example 插件源码和 package manifest 不得依赖 `@tabora/workbench-shell`、`@tabora/storage` 或 app 源码/package。
- 2026-06-09 架构优化收口补充：`@tabora/orchestrator` 不再依赖 `@tabora/storage` 或 `solid-js`；playground / extension 生产依赖不再直接声明官方插件、layout package 或 core runtime package；`WidgetSize -> grid span` 映射统一由 `@tabora/plugin-api` 的 `widgetGeometry` 导出，避免 workbench grid、widget shell 和 drag sort model 三套映射漂移。
- 2026-06-09 架构优化第二轮补充：search provider 在 runtime catalog 中带有 `pluginId/pluginName` owner descriptor，inline search 和 shell `CommandPalette` 的外部打开都使用 provider owner 进行 `external-open` 权限判断；插件禁用会执行 activation disposer 并注销已注册 view，active contribution list 只来自 enabled plugin，plugin summaries 仍保留全部插件用于管理面板；`LayoutHostAPI.getGlobalActions("menu")` 成为第一等全局动作 surface；safe layout fallback 也会用 `data-tabora-plugin-id` 包裹 widget view，保证 plugin scoped styles 生效；runtime context 的 `getConfig/setConfig` 临时 API 已删除，实例数据通过 widget props 的 `data` 与 scoped data host 显式传递；Dexie schema 仅保留当前有 repository/runtime path 的 MVP 表，搜索历史继续作为 plugin-owned workspace data 存于 `pluginData`。
- 工程边界当前基线：`@tabora/workbench-app` 已承接 runtime bootstrap（database、repositories、plugin catalog、kernel 的集中创建），`@tabora/host-adapters` 已拆出 web / extension 平台工厂并提供稳定导出面。
- 2026-06-06 治理收口补充：`@tabora/workbench-app` 已新增 `shellController` 纯 helper，统一承接 plugin owner `external-open` 权限判断，以及基于切换前 workspace/instances 生成 layout switch plan 与 snapshot 的纯模型，避免 shell 在实例迁移后再生成失真的 snapshot；同日又承接了 theme/background/grid/workspace session/import-export 等共享 shell helper，extension 不再通过相对路径直接 import playground 源码。
- 2026-06-07 搜索与主题治理补充：`@tabora/workbench-app` 的 search helper / state、`@tabora/orchestrator` 的搜索模型、以及官方 search/settings 插件已统一删除“首项 provider”隐式兜底。theme resolver 仅在精确命中 theme 时返回对应 token；未命中时应用显式 `SAFE_THEME_TOKENS` 并记录诊断，不再回退到 `themes[0]`。同日 `CommandPalette` 与 `SearchCommandBar` 的 provider token、`@` 路由和 suggestions 生成进一步收敛到 `@tabora/orchestrator` 的共享 model，官方插件不再维护独立的 search-model 转导出层；`SearchViewProps` 也已升级为宿主注入 `query / results / activeResultIndex / host actions` 的状态机 contract，搜索栏只负责渲染和事件转发。
- 2026-06-07 治理自动化补充：仓库已新增 `pnpm check:architecture`、`pnpm quality`、`pnpm regression:summary`；PR CI 目前除 architecture/check/test/build 外，已新增按路径触发的 `browser-smoke` job，执行 `pnpm exec playwright install --with-deps chromium` + `pnpm test:e2e`；nightly workflow 继续保留全量 browser smoke，release/deploy workflow 在打包前输出 regression summary。`check:architecture` 同步新增 workflow contract 守卫，禁止 PR browser smoke job、路径门禁或 Chromium 安装步骤漂移。
- playground 当前通过 `apps/playground/src/workbenchComposition.ts` 组装 `@tabora/workbench-app`、`@tabora/host-adapters` 与 `@tabora/builtin-plugin-registry`；playground / extension 的 `App.tsx` 已收敛为薄 wrapper，共享宿主交互编排统一落在 `@tabora/workbench-app`。`workbench-app/src` 已按垂直切片重组，目录结构如下：
  - `shell/`：组合根与跨切片装配——`WorkbenchShellApp.tsx`（薄 composition root，现含 `WorkbenchShellProvider` 上下文）、`WorkbenchShellContext.tsx`（shell bundle context）、`WorkbenchShellState.ts`（聚合 6 个 domain store）、`WorkbenchShellControllerRuntime.ts`（命令/拖拽/搜索/widget/view 聚合）、`WorkbenchShellViewRuntime.ts`、`WorkbenchShellInstanceRenderer.tsx`。
  - `runtime/`：kernel bootstrap 与宿主运行时——`bootstrap.ts`、`WorkbenchRuntimeStore.ts`（kernelReady / pluginRecords / toasts）、`WorkbenchShellRuntimeState.ts`（discover/boot/kernel 事件接线）、`WorkbenchShellHostRuntime.ts`（host actions/dispose bridge）、`WorkbenchShellHostActions.ts`（rail action / grid 持久化 / 焦点定位）。
  - `widget/`：`WorkbenchWidgetStore.ts`、`WorkbenchShellWidgetState.ts`、`WorkbenchShellWidgetController.ts`、`WorkbenchShellWidgets.ts`。
  - `search/`：`WorkbenchSearchStore.ts`、`WorkbenchShellSearchState.ts`、`WorkbenchSearchSurfaceState.ts`、`WorkbenchShellSearchSurfaces.ts`、`WorkbenchInlineSearchViewProps.ts`。
  - `workspace/`：`WorkbenchWorkspaceStore.ts`、`WorkbenchShellWorkspaceState.ts`、`WorkbenchShellWorkspaceController.ts`（layout/theme/background/search/workspace lifecycle 编排）、`WorkbenchShellSessionState.ts`、`workspaceSession.ts`、`workspacePortability.ts`、`workspaceTransfer.ts`、`defaultWorkspaceSeed.ts`。
  - `layout/`：`WorkbenchShellLayoutState.ts`、`WorkbenchShellLayoutRuntime.ts`、`WorkbenchShellLayoutHost.ts`、`WorkbenchShellLayoutRenderer.tsx`、`layoutEngine.tsx`、`layoutFallback.ts`。
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

// 布局切换引擎
switchLayout(layoutId: string): Promise<void>
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

## 3. 多布局架构

### 3.1 布局插件协议

每个 layout 插件声明自己的区域结构：

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

### 3.3 布局切换流程

```text
用户选择新布局
  → orchestrator.switchLayout(newLayoutId)
    → 备份当前 workspace snapshot
    → 加载新 layout contribution
    → 遍历当前所有 instances:
        for each instance:
          if newLayout.regions 中存在匹配的 regionId:
            instance.regionId = matched
          else:
            尝试按 accepts 类型匹配:
              if 找到匹配区域:
                instance.regionId = matched
              else:
                instance.regionId = "unplaced"  // 进入待放置状态
    → 保存 workspace
    → 触发壳体重渲染
    → 渲染新 LayoutView + 映射后的 instances
    → 如果有 unplaced instances，渲染待放置提示区域
```

### 3.4 最小安全布局

平台内置一个不可禁用的 fallback 布局。当活跃布局插件渲染失败时自动激活：

```text
const SAFE_LAYOUT: LayoutContribution = {
  id: "platform.safe-layout",
  layoutKind: "minimal",
  regions: [{ id: "stream", accepts: ["widget"], required: false }],
  // 安全布局只保留 widget 承载区域；
  // 设置入口、⌘K 提示等强制可达入口通过 LayoutHostAPI 注入
  // ...安全布局的 view 组件由平台内建，不走插件 registry
}
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

Rail、顶部工具条和安全布局中的“强制可达入口”不应伪装成 `layout` 插件实例，否则会污染扩展点语义。

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
    | "layout-switch"
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
- Focus 布局可以把 `getGlobalActions("toolbar")` 渲染成居中命令入口和布局切换入口，其他全局动作继续复用 rail。
- `platform.safe-layout` 可以直接复用同一套宿主动作，而不用引入伪 `layout` contribution。

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

**固定比例是底线**：插件开发者必须知道确切的宽高比才能适配不同尺寸的卡片样式。

Dashboard 使用 **16 列网格系统**，提供中等密度的灵活布局。

### 网格定义

| 尺寸 | colSpan | 占比        | aspect-ratio   | 用途                       |
| ---- | ------- | ----------- | -------------- | -------------------------- |
| S    | 3       | 3/16 (19%)  | 3:2 (1.50:1)   | 纯展示：时钟、天气、小数据 |
| M    | 4       | 1/4 (25%)   | 16:10 (1.60:1) | 轻交互：快捷链接、开关     |
| L    | 6       | 3/8 (37.5%) | 16:9 (1.78:1)  | 中等交互：待办、便签       |
| XL   | 8       | 1/2 (50%)   | 21:9 (2.33:1)  | 丰富交互：复杂表单、图表   |

### 实际尺寸（1200px 容器）

| 尺寸 | 宽度  | 高度  | 说明     |
| ---- | ----- | ----- | -------- |
| S    | 217px | 145px | 小巧紧凑 |
| M    | 292px | 183px | 标准卡片 |
| L    | 444px | 250px | 宽松布局 |
| XL   | 595px | 255px | 横向展示 |

### 响应式断点

| 屏幕宽度   | 网格列数 |
| ---------- | -------- |
| > 1100px   | 16 列    |
| 768-1100px | 12 列    |
| 500-768px  | 8 列     |
| < 500px    | 1 列     |

### 技术实现

**CSS Grid 布局：**

```css
.workbench-grid {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 10px;
  align-items: start; /* 防止同行卡片互相拉伸 */
}

.grid-item[data-widget-size="S"] {
  aspect-ratio: 3 / 2;
}
.grid-item[data-widget-size="M"] {
  aspect-ratio: 16 / 10;
}
.grid-item[data-widget-size="L"] {
  aspect-ratio: 16 / 9;
}
.grid-item[data-widget-size="XL"] {
  aspect-ratio: 21 / 9;
}
```

**JavaScript 定义：**

```typescript
// packages/plugin-api/src/widgetGeometry.ts
export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 3, rowSpan: 1 },
  M: { colSpan: 4, rowSpan: 1 },
  L: { colSpan: 6, rowSpan: 1 },
  XL: { colSpan: 8, rowSpan: 1 },
}
```

### 关键设计决策

1. **16 列而非 12 列**：提供更密集的布局，同时保持灵活性
2. **align-items: start**：防止同行不同高度的卡片互相拉伸，保持 aspect-ratio
3. **所有 rowSpan = 1**：高度完全由 aspect-ratio 控制，插件开发者可预测
4. **XL 占 1/2 宽**：可以并排两个超大卡片，不会独占整行

### 插件开发指南

插件开发者可以依赖固定的 aspect-ratio 进行精确布局设计：

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

- `expandFooter` 仅在声明了 `expand` 时有意义。只声明 `expandFooter` 不声明 `expand`，按「无自定义 footer」处理，宿主回退默认 footer，不报错。
- footer 视图与主体视图同为 `WidgetViewProps`，共享 host 能力（`showToast`、`openExternal`、`data` 等）。
- footer 视图与主体视图是两个独立组件。瞬时 UI 状态（如当前面板、表单校验错误）由插件自行在内部建立「按 instanceId 的会话 store」共享，不进协议层。
- `mode: "settings"`（实例设置）不注入自定义 footer，维持默认 footer。

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
  ExpandFooter (插件 expandFooter 视图；未注入时回退元信息 + esc 提示)
```

footer 区域渲染规则：

- widget 声明并注册了 `views.expandFooter` 时，宿主在 `expand-footer` 内用 `PluginViewBoundary` 隔离渲染该 footer 视图；footer 视图崩溃只局部兜底，不影响 body。
- 否则回退默认 footer：左侧实例 ID，右侧 `chrome.expand.footerHint`（Esc 提示）。

> 详细技术方案见 `docs/technical/tabora-expand-footer-injection-design.md`。

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
| `toggle-layout` | ⌘L     | 切换布局           | global |
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
SettingsHost (shell 提供)
  ├── SettingsNav (侧栏导航，来自 orchestrator)
  │   ├── 通用 (平台 tab + 对应 settings-panel panels)
  │   ├── 外观 (平台 tab + 对应 settings-panel panels)
  │   ├── 搜索 (平台 tab + 对应 settings-panel panels)
  │   ├── 插件 (平台 tab + 对应 settings-panel panels)
  │   ├── AI (平台 tab + 对应 settings-panel panels)
  │   └── 关于 (平台 tab + 对应 settings-panel panels)
  └── SettingsContent (右侧内容区)
      └── SettingsTab (每个 tab 由 orchestrator 管理容器与顺序)
          ├── PlatformSection
          └── PluginViewBoundary
              └── SettingsPanelView (插件贡献)
```

每个标签页的内容：

- **通用**：布局选择器（列出所有 layout contributions）、工作区信息，以及注册到 `general` 分组的 `settings-panel` 内容。
- **外观**：主题切换、背景选择，以及相关插件贡献的外观面板内容。
- **搜索**：默认搜索引擎选择、`@语法` 说明，以及搜索相关插件贡献内容。
- **插件**：已安装插件列表、贡献能力摘要、权限摘要，以及插件管理相关面板内容。
- **AI**：模型 provider、默认模型、网关状态、插件 AI 授权摘要，以及注册到 `ai` 分组的设置面板内容。
- **关于**：平台内置说明，可附加只读插件贡献内容。

### 11.2 SettingsPanel 贡献的新角色

`settings-panel` contribution 在 V2 中的定位有所变化：

- **MVP 阶段**：设置中心的导航骨架、标签页顺序、平台内置信息块由 orchestrator 负责；插件化设置内容仍通过 `settings-panel` contribution 注册 view，并在对应 tab 中渲染。
- **MVP 阶段**：官方至少需要提供 `official.settings.workspace.appearance`、`official.settings.workspace.search`、`official.settings.plugins` 等 panel，验证 `settings-panel` 扩展点、错误边界和持久化闭环。
- **V1.1+ 阶段**：允许更多插件注册复杂设置视图，例如权限详情、调试信息、插件私有偏好等。

这种分层保持了 V2 原型中的“固定导航 + 插件内容混排”结构，同时不牺牲 MVP 对 `settings-panel` 协议的验证价值。

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
  host: {
    close(): void
    setDirty(isDirty: boolean): void
    showToast(message: string): void
    navigateTo(tab: string): void
  }
  // 由 orchestrator 注入的当前工作台配置
  workspace: {
    activeLayoutId: string
    activeThemeId: string
    availableLayouts: LayoutContribution[]
    availableThemes: ThemeContribution[]
    availableSearchProviders: SearchProviderContribution[]
  }
}
```

`SettingsPanelContribution` 必须显式声明 `section` 和 `scope`：

```txt
type SettingsPanelContribution = {
  id: string
  title: string
  view: string
  section: "general" | "appearance" | "search" | "plugins" | "about"
  scope: "global" | "workspace" | "plugin" | "instance"
  order?: number
}
```

当前上线前阶段不再按旧 id 推断 section，也不为缺失 scope 的旧 manifest 做默认补齐。SettingsHost 以 orchestrator navigator 作为主路径，panel props 中带入 scope，widget instance settings 通过实例级数据隔离路径保存。

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

当前 MVP 只执行 `builtin` 和 `local-trusted` 插件，因此 `image` / `video` URL 当前按“受信任包声明的背景资产”处理，而不是一条独立的 runtime network capability。也就是说：

- 背景 source 的 URL 允许作为 manifest 静态声明存在，但不代表插件获得任意联网能力。
- 背景渲染器不得把交互式网络请求伪装成背景协议能力；若未来允许运行时下载背景素材、远端背景集合或第三方远程插件，必须把这一路径并入显式 `network` permission / host policy，而不是继续挂在 `BackgroundSourceValue` 的宽松字符串 URL 上。
- 当前阶段的远端背景资源是否可用，属于受信任包发布内容审核与宿主加载策略问题，不属于权限桥的已授权行为记录。

### 12.6 Loader 与兼容检查

`PluginManifest.apiVersion` 必填。`PluginLoader` 当前支持 `builtin`、`local-trusted`、`remote-untrusted` source 记录；MVP 只执行 builtin 和可信本地包格式，不执行不可信远程代码。loader 按 Tabora plugin API major version 做兼容检查，future major 直接 skipped/rejected；缺失 `apiVersion` 的 manifest 无例外拒绝。

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

`external-open` 在当前 MVP 中仍采用“manifest 声明 + runtime host 判断”的最小闭环：`PermissionBridge` 只基于插件声明的 host 列表判断是否允许打开外链，不提供平台级持久授权记录，也不承诺跨会话审计。若后续扩展到 `network`、`clipboard`、`local-file` 等需要用户交互授权的能力，应统一引入独立 permission repository / host grant store，而不是把授权结果混入 workspace 表或 `pluginData`。

### 13.3 Workspace Snapshot

布局切换前自动备份当前 workspace：

```txt
type WorkspaceSnapshot = {
  id: string
  workspaceId: string
  layoutId: string        // 切换前的布局 ID
  regions: Workspace["regions"]
  instances: PluginInstance[]  // 完整的实例列表快照
  createdAt: string
}

// repository 方法
workspaceSnapshotRepository.save(snapshot)
workspaceSnapshotRepository.getLast(workspaceId): WorkspaceSnapshot | undefined
```

当前 shell 在切换布局前保存 snapshot。`createLayoutSwitchPlan` 输出 `placedInstances`、`unplacedInstances`、`nextRegions` 和 snapshot；不兼容目标布局 region 的实例保留数据并进入 `unplaced` 区域，不删除、不做旧 layout ID 迁移。

这里明确 snapshot 的边界：它服务于“布局切换后的装配回滚”，而不是通用时光机。当前 snapshot 只覆盖 `workspace.regions` 与完整 `instances` 列表，不覆盖 `pluginData`、插件启用状态记录或其他宿主运行时状态。因此“一键回滚”语义仅保证区域拓扑与实例摆放可恢复，不保证插件业务数据一起回退。

## 14. 错误回退体系

### 14.1 分层回退

```txt
Level 1: 内容级 → 单个 widget view 失败 → PluginViewBoundary 错误卡片
Level 2: 区域级 → 某个 region 所有实例失败 → 区域错误占位
Level 3: 插件级 → layout/theme/search 插件失败 → 平台安全默认
Level 4: 存储级 → IndexedDB 读失败 → 安全默认 workspace（不覆盖原有数据）
```

### 14.2 安全默认

| 失败组件       | 回退方案                                                            |
| -------------- | ------------------------------------------------------------------- |
| Layout         | 激活 `platform.safe-layout`（单列流式 + ⌘K + 设置入口）             |
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
| Orchestrator Tests      | 布局切换、区域映射、搜索路由、拖拽算法、command/keybinding/context menu/preset model | Vitest                |
| Boundary Tests          | 插件源码和 package manifest 不依赖宿主/storage/app 内部                              | Vitest                |
| Interaction Tests       | 搜索键盘导航、拖拽交换、Toast 堆叠、右键菜单                                         | Vitest Browser Mode   |
| Storage Migration Tests | Schema 升级、快照保存/恢复、quota 处理                                               | fake-indexeddb        |
| A11y Tests              | 键盘可达性、焦点管理、ARIA 角色                                                      | axe-core + Playwright |
| Visual Regression       | 双布局截图对比、主题切换、错误状态                                                   | Playwright screenshot |

### 15.2 关键测试场景

```txt
布局切换：
  - Dashboard → Focus → Dashboard：实例数据完整保留
  - 切换后无法匹配区域的实例进入 unplaced 状态
  - 布局插件失败时激活安全布局

搜索：
  - 空搜索：显示收藏快捷命令
  - Focus 布局无常驻搜索栏：通过居中命令入口或 ⌘K 打开命令面板
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
      search-engine.ts          # （Phase C 待实现）
      search-router.ts
      drag-sort-model.ts
      context-menu-model.ts
      settings-navigator.ts
      toast-manager.ts
      shortcut-registry.ts
      layout-switcher.ts
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
    layout-dashboard/   # 官方仪表盘布局，独立 package
    widget-*/           # 官方业务卡片插件
  community/
    layout-diy-masonry/ # 第三方 DIY 瀑布流验证 package
  examples/
```

## 17. 实施路线

### Phase A: 编排层基础（1-2 周）✅ 已完成

1. 创建 `@tabora/orchestrator` 包。已完成。
2. 实现 `PluginCatalog`：插件贡献枚举、layout/search/widget 查询、settings panel 收集和插件摘要。已完成。
3. 实现 `createLayoutEngine`：通用 region → 实例映射 + 卡片壳/搜索表面渲染注入 + LayoutHostAPI 构造。已完成并归入 `@tabora/workbench-app`，取代旧的 `region-renderer.tsx`，避免 `@tabora/orchestrator` 绑定 JSX renderer。
4. 重构 playground `App.tsx`：renderActiveLayout 从具体官方布局硬编码切换为协议驱动；新增 `renderSafeLayout` 兜底；用 `LayoutBoundary` 隔离布局错误。已完成。
5. 验证 Dashboard 布局功能不变。已完成。

### Phase A.1: 布局 package 拆分 + 第三方验证 ✅ 已完成

1. `plugin-api` 新增 `LayoutViewProps`/`RegionSlot`/`LayoutHostAPI`/`HostActionItem` 契约类型。
2. `manifestSchema` 新增最小强制 schema：layout 必须含至少一个 `accepts:["widget"]` 的 region 且 `view` 字段必填。
3. `workbench-shell` 抽出 `WidgetCardShell`（卡片壳）和 `LayoutBoundary`（错误边界）。
4. 把官方 dashboard/focus 布局放入同一个官方布局 package（`plugins/official/layout-dashboard`），依赖面只有 plugin-api/platform-kernel/solid-js 等布局所需依赖（隔离硬证据）。
5. 新增 `plugins/layout-diy-masonry`：第三方差异化 DIY 布局，验证只靠公开契约就能实现瀑布流分列、浮动菜单、自定义图标等创新形态。
6. `official-plugins` 装配层引入三个布局 package，删除原 `layout-workbench-*.tsx` 内联实现。
7. `App.tsx` 引入 `WidgetCardShell` 卡片壳，将拖拽/双击/右键/尺寸条等交互通过 `WidgetHostCallbacks` 闭包注入；layout view 负责包裹 `.workbench-grid`，`WidgetCardShell` 根据 `@tabora/plugin-api/widgetGeometry` 的 widget size span 写入 grid CSS 变量，避免协议驱动布局丢失原型的 4 列卡片排布。

### Phase X1-X8: 插件系统可扩展性收尾 ✅ 已完成

1. Shell 工程边界收口：`workbench-app` / `host-adapters` / `workbench-shell` / builtin registry 边界已建立。
2. Layout switcher 与 drag sort model 已下沉到 `@tabora/orchestrator`，playground / extension 复用同一纯模型。
3. Command contribution、keybinding registry、widget context menu contribution 已建立，shell 命令和快捷键通过 catalog/registry 消费。
4. Settings panel `section/scope` 已成为显式协议；widget instance settings path 已建立。
5. `workspacePresets` 已成为默认工作区装配协议，官方默认 workspace seed 已迁为 preset contribution。
6. Host capability、supported platform、required capability、plugin manager compatibility reason 已建立。
7. `StorageAdapter` port 与 background source contract 已建立。
8. Plugin loader abstraction、可信本地 package format、API major compatibility check 已建立；缺失 `apiVersion` 的 manifest 被拒绝。
9. 插件依赖边界测试已覆盖官方、community、example 插件源码和 package manifest。

### Phase B: 布局切换（已由 Phase X3 覆盖）✅ 已完成

1. 实现 `LayoutSwitcher`：workspace snapshot、实例迁移算法、unplaced 状态
2. 在设置中心添加布局选择器
3. 实现 `platform.safe-layout` fallback。已完成基础（renderSafeLayout）。
4. 开发 `official.layout.workbench-focus` 布局。已完成（由 dashboard layout package 同插件贡献）。

### Phase C: 搜索增强（1 周）

1. 实现 `SearchEngine`：模糊搜索、@语法路由、键盘导航状态机
2. 实现 Dashboard 内联搜索建议 UI（SearchBar + Suggestions）
3. 增强 CommandPalette：动态结果、分组显示、⌘K 同步，作为 Focus 的浮层搜索入口
4. 搜索历史持久化

### Phase D: 交互增强（部分已由 Phase X4/X5 覆盖）

1. 已于 2026-06-07 实现 `WorkbenchDragController` + `WorkbenchShellDragState`：实时交换算法、5px 阈值、pointer 统一输入与松手持久化
2. 实现 `ExpandManager`：6 种类型的展开视图渲染器
3. 实现 `ContextMenuManager`：事件委托、默认 + 插件自定义菜单。已完成模型与 UI 消费路径。
4. 实现 `ToastManager`：堆叠、自动消失、带 action

### Phase E: 快捷键与设置（已由 Phase X4/X5 覆盖）✅ 已完成

1. 实现 `ShortcutRegistry`：全局 + 插件快捷键、冲突检测
2. 重构 Settings host：侧栏导航、标签页切换
3. 实现 `SettingsNavigator`：组织固定 tab，并挂载 `settings-panel` contributions

## 18. 风险与应对

| 风险                                       | 应对                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| orchestrator 抽象过度增加复杂度            | 每个模块独立可测试、独立可替换；不强求所有 orchestrator 模块同时完成  |
| 布局切换时实例数据丢失                     | 强制 workspace snapshot 备份 + 一键回滚                               |
| 拖拽实时交换在大量卡片时性能下降           | 虚拟化 + requestAnimationFrame 节流；卡片数 > 50 时降级为简单排序     |
| 搜索 @语法 和命令/卡片模糊搜索的优先级冲突 | 严格优先级：@语法 > 命令精确匹配 > 卡片模糊匹配 > 网页搜索            |
| 严格 schema 拒绝导致导入可用性摩擦         | 保持协议严格，但宿主必须提供结构化诊断与可读错误，不做静默失败        |
| 背景远端资源与网络权限语义混淆             | 现阶段仅视为受信任包资产声明；未来运行时拉取背景必须并入 network 权限 |
| Dexie 细节经 `database?` 反向渗透到 shell  | 约束业务代码只依赖 repositories，把 `database` 视为调试/测试句柄      |
| orchestrator 引入后 playground 回归风险    | Phase A 先重构再扩展，保证每次 commit 后 Dashboard 布局可正常运行     |
