# 插件系统可扩展性评估与改造方向

日期：2026-06-04

状态：Phase X1 已完成，后续阶段待执行

关联事实源：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`
- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- `docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`
- `docs/superpowers/specs/2026-06-02-layout-plugin-contract-design.md`

## 1. 文档用途

本文记录当前围绕 Tabora 插件架构讨论识别出的系统性问题，并给出后续改造方向。它不替代 PRD、官方插件设计或技术方案，而是作为后续拆分 implementation plan 的问题台账和路线入口。

当前 Phase X1 的 implementation plan 位于：`docs/superpowers/plans/2026-06-04-phase-x1-shell-boundaries.md`。
当前分支已完成 Phase X1 的核心收口：新增 `@tabora/workbench-app`、`@tabora/host-adapters`，playground 改为通过 `workbenchComposition` / runtime bootstrap 组装基础设施，extension newtab 已切断对 playground `App` 的直接依赖。

评估视角：

- 第三方开发者希望不用改平台代码，重造一套符合自己工作习惯的工作台体验。
- 未来开放第三方插件、本地可信插件和更清晰的能力边界。
- 未来扩展到多个 shell，例如 playground、浏览器 extension、桌面客户端。
- 从前端工程角度审查 shell 复杂度、组件边界、状态管理、样式归属、插件 view 渲染、响应式和多端复用风险。

## 2. 当前支持能力

协议层当前定义 8 类扩展点：

- `layout`：布局插件，定义区域和布局 view。
- `widget`：卡片插件，提供 card / modal / fullscreen / settings view。
- `search`：搜索 UI 插件。
- `search-provider`：搜索源插件。
- `background-provider`：背景来源插件。
- `background-renderer`：背景渲染插件。
- `theme`：主题 token 插件。
- `settings-panel`：设置中心面板插件。

当前架构已经具备 MVP 插件底座：

- `plugin-api` 定义 manifest、contribution 和 view props。
- `platform-kernel` 提供插件发现、激活、registry、event bus、runtime context 和最小权限桥。
- `orchestrator` 已开始承接插件目录和布局 region 渲染引擎。
- `workbench-shell` 已承接部分宿主容器，例如 `WidgetCardShell`、`LayoutBoundary`、`SettingsHost`。
- 官方 dashboard、stream 和 DIY masonry 布局已拆成独立 package，用同一套 layout 契约验证第三方布局方向。

## 3. 总体判断

当前方向是正确的，但仍处于“Web/Solid 宿主内的官方插件化 MVP”阶段。

它可以支撑：

- 官方插件装配默认工作台。
- 第三方风格的布局 package 在 builtin 路径中验证。
- 单个 widget、theme、search provider、settings panel 的插件化。
- playground 和 extension 这类 Web shell 共享大部分平台内核。

它尚不能完整支撑：

- 第三方开发者无侵入发布一整套工作台体验。
- 第三方插件接入所需的加载、隔离、依赖边界和能力协商。
- 不同平台 shell 对同一插件能力的能力协商。
- 非 Web 原生 UI 平台复用当前插件 UI。

因此后续改造重点不是继续新增零散业务插件，而是补齐“shell 工程边界、组合装配协议、交互贡献协议、host capability contract、插件加载与权限隔离”五类基础能力。

## 4. 已识别架构问题

### 4.1 缺少整套体验装配协议

当前 extension point 覆盖单点能力，但没有定义“第三方整套工作台”的组合贡献。

缺口：

- 不能声明默认启用哪些插件。
- 不能声明默认 layout / theme / background / search。
- 不能声明默认 widget instances 和 region 放置。
- 不能声明默认命令、快捷键和全局入口。
- 不能声明设置中心默认结构。

影响：

- 第三方开发者可以写 layout 或 widget，但不能发布一个完整替代官方体验的包。
- 默认 workspace seed 仍容易偏官方实现，平台不够“插件优先”。

建议方向：

- 新增 `experience-pack` 或 `workspace-preset` contribution。
- 用它描述默认插件集合、workspace seed、实例装配、默认 layout/theme/background/search 和初始 host actions。
- shell 只负责选择和应用 preset，不硬编码官方默认装配。

### 4.2 缺少命令系统 contribution

MVP 要求命令搜索能触发本地命令，例如添加卡片、打开插件管理、切换主题、切换布局。但当前 `plugin-api` 没有 `command` 或 `command-provider` contribution。

缺口：

- 命令面板本地命令偏 shell 硬编码。
- 插件不能系统性贡献自己的命令。
- 命令和快捷键、host action、settings panel 的关系不稳定。

建议方向：

- 新增 `commands` contribution。
- 命令声明 `id`、`title`、`description`、`icon`、`category`、`keywords`、`defaultShortcut?` 和所需 host capability。
- 命令执行必须通过 runtime context / host API，不能直接访问 shell store。

### 4.3 缺少快捷键 contribution

技术方案提到插件可注册快捷键和冲突检测，但 manifest 中没有快捷键贡献类型。

缺口：

- 快捷键参考入口无法稳定展示插件贡献。
- 插件无法声明默认快捷键。
- 冲突解决、禁用、平台差异没有协议。

建议方向：

- 新增 `keybindings` contribution。
- 快捷键绑定命令 ID，而不是直接绑定任意函数。
- 由 orchestrator / kernel 统一做冲突检测、平台快捷键转换和快捷键参考展示。

### 4.4 缺少上下文菜单 contribution

MVP 要求右键菜单覆盖尺寸、展开、移除，并允许插件追加自定义操作；技术方案提到 context menu builder，但协议层未定义。

缺口：

- widget 只能获得平台默认菜单。
- 插件无法声明实例级自定义菜单项。
- 菜单 action、权限、可见性、禁用态没有统一模型。

建议方向：

- 新增 `contextMenus` contribution，优先限制在 `widget` 实例级。
- 菜单项绑定命令 ID 或 runtime action。
- 平台保留默认菜单项：展开、尺寸、移除、实例设置。

### 4.5 `LayoutHostAPI` 与全局入口协议不完整

布局通过 `LayoutHostAPI.getGlobalActions()` 获取全局动作，这是正确方向，但当前动作集合和语义还不稳定。

已识别问题：

- 动作 ID 缺少 `layout-switch`、`shortcuts` 等 MVP 入口。
- 实现中存在把布局切换伪装成 `theme` action 的语义污染。
- icon 契约说是 lucide 名称，但实际可能传入符号或 emoji。
- 第三方布局只能消费固定动作，不能扩展全局入口。

建议方向：

- 把 `HostActionItem` 和 `CommandContribution` 对齐。
- 全局入口来自平台强制动作 + 插件命令贡献。
- 布局只决定 surface 呈现，不决定动作来源和权限。

### 4.6 `settings-panel` 分组协议过弱

当前 `settings-panel` 只有 `id`、`title`、`view`、`order`，设置中心分组更多依赖 ID 推断。

缺口：

- 第三方面板进入通用、外观、搜索、插件、关于哪个 section 不稳定。
- 插件私有设置、实例设置和全局设置边界不够明确。
- 插件管理面板中的权限、启用状态、调试信息后续扩展缺少结构。

建议方向：

- 给 `SettingsPanelContribution` 增加显式 `section` 字段。
- 定义 `scope: "global" | "workspace" | "plugin" | "instance"`。
- widget 的 `views.settings` 形成实例设置打开路径和 props contract。

### 4.7 背景 provider / renderer 闭环不足

当前协议有 `background-provider` 和 `background-renderer`，但 provider 更接近静态 `defaultCss`。

缺口：

- provider 如何返回 image / video / gradient / canvas 数据未定义清楚。
- renderer 如何选择、fallback、错误恢复未完全协议化。
- 动态背景、远程背景、本地文件背景和权限关系还不清晰。

建议方向：

- 定义 `BackgroundSourceValue`，区分 `css`、`image`、`video`、`gradient`、`canvas`。
- provider 只提供 source，renderer 负责渲染。
- local file / remote background 必须走权限桥。

### 4.8 Runtime context 能力偏薄

当前 runtime context 主要有 registry、event bus、modal/fullscreen、external-open 和 config。

缺口：

- 没有 `context.ui.showToast()`。
- 没有 command、shortcut、context menu 注册能力。
- 没有安全 workspace 操作 API。
- 没有 network、clipboard、local-file 对应 host API。
- config store 在激活路径中尚未形成跨平台 adapter。

建议方向：

- 把 runtime context 拆成稳定 host services：`ui`、`commands`、`storage`、`workspace`、`permissions`、`logger`。
- 所有宿主能力经 permission broker 和 host capability 检查。
- 插件不能通过 event bus 任意 emit 宿主内部事件。

### 4.9 插件加载、隔离和分发未就绪

MVP 不做远程插件加载是合理的，但第三方插件接入需要前置代码架构。

缺口：

- 目前主要是 builtin import，缺少插件包格式和 loader。
- 缺少签名、完整性校验、版本兼容和依赖限制。
- 缺少禁用、升级、回滚和迁移策略。
- 第三方 JS 与宿主同权限运行，不适合不可信插件。

建议方向：

- 抽象 `PluginLoader`：builtin、本地目录、远程包、extension bundle 分开。
- manifest 增加 `apiVersion`、`supportedPlatforms`、`requiredCapabilities`。
- 可信本地插件和不可信远程插件采用不同隔离级别。
- 未来不可信第三方插件后续至少需要 iframe sandbox、worker、SES 或 extension isolated world 中的一种。

### 4.10 多平台 host capability contract 缺失

当前架构适合 WebView 类 shell，但没有定义各平台支持能力的协商机制。

缺口：

- playground、extension、桌面客户端的能力差异无法从协议层表达。
- IndexedDB / Dexie 绑定 Web 存储环境。
- 插件 UI 是 Solid + DOM + CSS，不支持非 Web 原生 UI。
- external open、clipboard、local file、network 在不同平台执行方式不同。

建议方向：

- 新增 `HostCapabilities`，由 shell 声明支持能力。
- `@tabora/storage` 抽象 `StorageAdapter`，Web 用 IndexedDB，桌面可用 SQLite / file-backed storage。
- 如果桌面端采用 Tauri/Electron/WebView，当前 UI 插件可继续复用。
- 如果要原生 UI，必须把插件分成跨平台数据/能力插件和 Web-only UI 插件，或另行设计 UI schema。

### 4.11 Shell composition root 过重

`apps/playground/src/App.tsx` 已承担过多职责：创建 DB/kernel、discover/activate 插件、加载 workspace、管理 instances、渲染 layout、处理 settings/modal/fullscreen/expand/context menu/toast、实现 drag/drop、command palette、search history、theme/background 和外部打开。

影响：

- 任一交互改动都容易牵动全局状态。
- playground 与 extension / desktop shell 难以复用同一套工程结构。
- orchestrator 和 workbench-shell 的职责被 `App.tsx` 重新吸回，后续协议改造会继续堆叠。

建议方向：

- 把 `App.tsx` 收缩为 composition root，只组合 providers、host adapters 和 shell containers。
- 拆出 `usePluginRuntimeBootstrap`、`useWorkspaceSession`、`useWorkbenchInstances`、`useThemeBackground`、`useSearchState`、`useHostSurfaces` 等前端状态模块。
- 把 modal/fullscreen/expand/context-menu/toast/command-palette/add-widget 等宿主容器迁入 `@tabora/workbench-shell`。

### 4.12 Extension shell 直接复用 playground App

当前 extension newtab 直接 import playground 的 `App`。这说明多端复用边界还没有成立：extension 复用的是 playground 具体实现，而不是平台无关的 workbench composition。

影响：

- extension 无法独立实现自己的 host adapter，例如 chrome.storage、extension 权限、浏览器 API 和打开外链策略。
- playground 样式和 extension 样式入口不一致时容易产生缺样式或重复样式。
- 桌面客户端如果沿用同样方式，会继续把 playground 变成事实上的平台核心。

建议方向：

- 新增可复用的 `WorkbenchApp` 或 `createWorkbenchComposition`，由 playground / extension / desktop shell 传入 host adapters。
- extension 保留自己的 entry 和 host capability 声明，不直接 import playground 源文件。
- 样式入口由 shell 明确装配，避免 bootstrap 差异导致视觉不一致。

### 4.13 Layout package 依赖 shell 包，削弱第三方隔离

布局 package 目前依赖 `@tabora/workbench-shell` 来使用 `HostActionIcon`。这与“第三方布局只依赖 plugin-api / platform-kernel / solid-js，通过 `LayoutViewProps` 获取能力”的隔离目标冲突。

影响：

- 第三方 layout 的依赖面无法作为架构隔离硬证据。
- shell 组件变更会影响布局插件编译和运行。
- 未来不可信第三方插件隔离时，layout 可 import shell 内部组件，扩大能力边界。

建议方向：

- `HostActionIcon` 不应作为 layout 必需依赖。可改为：布局自己按 `HostActionItem.icon` 字符串渲染、或由 `LayoutHostAPI` 提供纯数据 icon token、或在 `@tabora/plugin-api` 定义更稳定的 icon contract。
- 官方 layout 也遵守第三方依赖面，不 import `@tabora/workbench-shell`。

### 4.14 插件错误边界不是真正的响应式错误边界

当前 `PluginViewBoundary` 只是对 `props.children` 做同步 `try/catch`，并直接创建 DOM fallback。

影响：

- Solid reactive update、effect、事件回调、异步加载中的错误很难被捕获。
- fallback 使用 `location.reload()` 作为重试方式，偏整页恢复，不符合插件失败局部化原则。
- 直接 DOM 创建让错误边界和 Solid 渲染模型不一致。

建议方向：

- 用 Solid `ErrorBoundary` 实现真正的插件视图边界。
- fallback 返回 Solid JSX，并提供局部重试或禁用实例入口。
- widget、layout、settings、modal、fullscreen 分层使用不同错误边界和 fallback。

### 4.15 Shell 容器与业务模型混合

`CommandPalette` 同时负责 UI、搜索路由、历史记录、provider token、命令过滤和 widget 搜索；`SettingsHost` 通过 id 字符串推断 section；`WidgetCardShell` 写死 grid span、draggable 行为和常驻操作按钮。

影响：

- 后续新增 `commands`、`keybindings`、`contextMenus` contribution 时，会出现“协议有了，但 UI 仍走旧模型”的二次债务。
- 设置分组、命令分组、菜单 action 等交互模型难以测试和复用。
- 卡片壳同时承担布局计算和操作入口，布局插件的自由度与平台约束边界不清。

建议方向：

- orchestrator 负责 command catalog、search result model、settings navigator、context menu model、drag sort model。
- workbench-shell 只负责容器 UI 和 a11y/focus 管理。
- `WidgetCardShell` 只承接卡片外壳和触发事件，不持有布局策略；grid span 由 layout/region renderer 或 placement model 提供。

### 4.16 样式归属和加载顺序不稳定

当前样式分散在 `@tabora/ui`、`@tabora/official-plugins`、layout package、`@tabora/workbench-shell` 和 playground bootstrap 中。extension entry 只加载了部分样式。

影响：

- 多 shell 很容易漏引样式或顺序不同。
- class 命名如 `.widget-card`、`.card-header`、`.toolbar` 容易跨 package 碰撞。
- 第三方插件若复用这些 class，会隐式依赖官方视觉实现。

建议方向：

- 定义 shell 样式入口、layout 样式入口、plugin content 样式入口的加载规则。
- 宿主级 class 加前缀或明确层级，避免通用 `.card-*` 泄漏。
- extension / playground / desktop 都通过同一 workbench style preset 装配基础样式。

### 4.17 Web DOM 直接调用分散

当前 DOM 和浏览器 API 调用分散在 App、background resolver、plugin migration、settings import/export 等路径。

影响：

- Web shell 可运行，但多端 host adapter 边界不清。
- extension / desktop 需要替换 `window.open`、`document.documentElement`、`document.body.style`、`localStorage` 等行为时，只能分散修改。

建议方向：

- 将 theme/background application、external open、file import/export、legacy localStorage migration 包装为 host adapter。
- 插件 UI 不直接读取 `window.localStorage`；迁移逻辑进入 plugin data migration service。

### 4.18 文件组织仍以历史实现路径为中心

当前目录已经拆出了 `packages/`、`plugins/` 和多个 `apps/`，但组织策略仍有历史实现痕迹：

- `apps/playground` 仍承载大量可复用 workbench composition 逻辑。
- `apps/extension` 直接复用 playground 源文件，而不是复用平台级 package。
- `plugins/` 中官方插件、官方布局和 community DIY 验证布局同级混放。
- `packages/official-plugins` 同时像官方插件集合、builtin registry 和装配入口；其中还纳入 community layout 验证插件。
- `workbench-shell` 同时放 host UI 容器、部分搜索模型依赖和图标辅助。
- 历史计划和旧技术文档仍引用 `layout-top-search-grid.tsx`、`widgets-productivity.tsx`、`app.css` 等旧路径。

影响：

- 新 shell、新插件来源、新平台接入时，难以判断应该依赖哪个 package。
- 第三方插件边界、官方插件包边界、builtin 装配边界混在一起。
- 文档中的旧路径会误导后续 agent，把已经迁出的能力重新改回旧位置。

建议方向：

- 新增跨 shell 组合包，例如 `packages/workbench-app` 或 `packages/workbench-runtime`，承接 App 级 composition。
- 新增 `packages/host-adapters`，按 `web`、`extension`、`desktop-webview` 分离 host capability 实现。
- 将 `plugins/` 分层为 `official/`、`community/`、`examples/`。
- 将 `packages/official-plugins` 拆为官方插件集合和 builtin 装配 registry，避免 official pack 混入 community 验证插件。
- 对历史文档做 archive / stale cleanup，当前入口只保留文档地图登记的事实源和规划入口。

## 5. 目标文件组织方向

建议后续逐步收敛到以下结构：

```txt
apps/
  playground/              # Web playground shell，只放入口、adapter 选择和开发态能力
  extension/               # 浏览器 extension shell
  desktop/                 # 未来桌面 WebView shell
  site/
  storybook/

packages/
  plugin-api/              # 协议、类型、schema
  platform-kernel/         # 插件生命周期、registry、event bus、权限 broker
  orchestrator/            # 编排模型：layout/search/command/menu/settings/drag
  workbench-app/           # 新增：跨 shell workbench composition
  workbench-shell/         # 宿主 UI 容器：modal/fullscreen/settings/toast/card shell 等
  host-adapters/           # 新增：web/extension/desktop capability adapters
  storage/                 # repository ports + web IndexedDB adapter
  theme/
  ui/
  brand/
  official-plugin-pack/    # 官方插件集合
  builtin-plugin-registry/ # 当前内置装配：官方 + 验证插件 + 默认 preset

plugins/
  official/
    layout-dashboard/
    layout-stream/
    widget-notes/
    widget-todo/
    widget-quick-links/
    widget-today-focus/
    widget-weather/
  community/
    layout-diy-masonry/
  examples/
    hello-world/
```

边界规则：

- `apps/*` 不能被其他 app import；跨 app 复用必须进入 `packages/*`。
- `plugins/official/*` 和 `plugins/community/*` 都按第三方依赖面约束，不 import shell 内部包。
- `official-plugin-pack` 只表示官方插件集合，不负责混合 community 验证插件。
- `builtin-plugin-registry` 才负责“当前 shell 默认加载哪些 builtin plugins / presets”。
- `workbench-shell` 不持有业务编排模型；模型进入 `orchestrator`。
- `host-adapters` 是唯一直接处理 `window`、`document`、extension API、desktop API 的位置。

## 6. 当前实现中的具体债务

以下问题来自当前仓库代码口径，表示 **Phase X1 完成后仍然存在** 的后续任务：

- 默认 workspace seed 仍保留 `rail accepts:["layout"]`，与“rail 是 host chrome，不应作为实例 region”冲突。
- 布局切换仍在 shell 中处理较多逻辑，orchestrator 还没有完全接管布局切换、实例迁移和 unplaced 状态。
- 命令面板和 `LayoutHostAPI` 中布局切换仍偏 dashboard / stream 两种官方布局硬编码。
- `App.tsx` 仍然过重，当前只是收缩为 composition root + 宿主编排，尚未把 workspace session、instances、theme/background、search state、host surfaces 彻底下沉。
- extension newtab 虽然不再 import playground `App`，但当前仍通过相对路径复用 playground 的纯逻辑 helper，shared shell 状态和 helper 还没有完全抽到独立 package。
- layout package 依赖 `@tabora/workbench-shell`，不符合第三方布局隔离目标。
- modal / fullscreen / expand / context menu / add widget 等宿主容器仍内联在 playground；toast 已迁入 `@tabora/workbench-shell`，但 host surfaces 还未整体收口。
- CommandPalette、SettingsHost、WidgetCardShell 仍混合 UI 和业务/编排模型。
- 样式入口已在 playground/extension 间对齐，但 `workbenchShellStyleModules` 仍只是静态清单常量，还没有形成单一自动化装配入口。
- `workbench-app` / `host-adapters` 已建立，但 shared shell 逻辑仍有一部分停留在 app 层和 playground helper 中。
- `plugins/` 已分层为 official / community / examples，`packages/official-plugins` 与 `packages/builtin-plugin-registry` 的职责也已分离；后续问题转为 shared helper 与样式装配自动化。
- 历史文档和计划中仍残留旧路径，容易误导后续实现。
- `RegionSlot` 构建只按 `regionId` 过滤实例，没有按 `region.accepts` 防御 extensionPoint 错配。
- `isMobile` 传给 layout 时仍可能是固定值，响应式契约未完全接入。
- layout fallback 当前主要是渲染安全布局，toast 提示和激活安全布局状态闭环不足。
- `background-renderer` 协议存在，但 playground 背景应用主要依赖 `defaultCss` 解析。
- 部分 widget 仍直接访问 `window.localStorage`，不符合插件数据通过 storage repository 隔离的方向。

## 7. 改造路线建议

### Phase X1: Shell 工程边界收口

状态：已完成

目标：先把前端 shell 从“全能 App.tsx”收敛为可复用 composition root，避免后续协议改造继续堆到 playground。

主要任务：

- 新增 `packages/workbench-app` 或 `packages/workbench-runtime`，承接 playground / extension / desktop 可复用 composition。
- 新增 `packages/host-adapters`，将 Web DOM、extension API、未来 desktop WebView 能力封装为 adapters。
- 拆分 `App.tsx`：runtime bootstrap、workspace session、instances、theme/background、search state、host surfaces 分模块。
- 把 modal/fullscreen/expand/context-menu/toast/add-widget/command-palette 的宿主容器迁入 `@tabora/workbench-shell`。
- extension 不再 import playground `App`，改为独立 shell entry，共享 workbench composition 和 adapters。
- 建立 host adapters：external open、theme apply、background apply、file import/export、legacy migration。
- 用 Solid `ErrorBoundary` 重写 `PluginViewBoundary`，按 widget/layout/settings/modal/fullscreen 分层 fallback。
- 统一 shell/layout/plugin style entry，补齐 extension 样式装配。

验收标准：

- `apps/playground/src/App.tsx` 只保留组合根和少量 shell wiring，不再承载核心交互模型。
- extension 有自己的 host adapter 和样式入口，不直接依赖 playground 源文件。
- 插件视图错误局部 fallback，不触发整页 reload。
- 宿主容器可在 playground 和 extension 复用。

当前完成情况：

- 已新增 `packages/workbench-app`，集中创建 database、repositories、plugin catalog 和 kernel。
- 已新增 `packages/host-adapters`，拆出 web / extension adapter 工厂与测试。
- playground 已切到 `workbenchComposition` / runtime bootstrap，不再在 `App.tsx` 内直接 new 全套基础设施对象。
- extension newtab 已有自己的 `App.tsx` 与 `workbenchComposition.ts`，不再 import `@tabora/playground/src/App`。
- `PluginViewBoundary` 已改为 Solid `ErrorBoundary`，toast 已迁入 `@tabora/workbench-shell`。

### Phase X1.5: 文件组织和包边界整理

状态：已完成

目标：在继续补协议前，把 monorepo 目录和 package 边界整理到能支撑第三方插件和多 shell 的形态。

主要任务：

- 将 `plugins/` 分层为 `official/`、`community/`、`examples/`。
- 将 `packages/official-plugins` 拆分或改名为 `official-plugin-pack`，新增 `builtin-plugin-registry` 表达当前内置装配。
- 将 community DIY layout 从 official pack 中移出，由 builtin registry 决定是否加载。
- 建立“禁止 app 互相 import”的约束，extension 不再通过 alias 指向 playground src。
- 清理或归档历史文档中已不存在 / 已迁移的旧路径引用。
- 更新 `AGENTS.md` 和文档地图中的工程结构说明。

当前完成情况：

- 已新增 `packages/builtin-plugin-registry`，由它表达 shell 默认 builtin plugins。
- `@tabora/official-plugins` 已收缩为官方插件集合，不再混入 `community.layout.diy-masonry`。
- playground / extension 的 workbench bootstrap 与 `kernel.discover` 已统一切到 `builtinPlugins`。
- `plugins/` 已整理为 `plugins/official`、`plugins/community`、`plugins/examples`。
- `pnpm-workspace.yaml` 和测试 glob 已兼容两级插件目录。
- `AGENTS.md`、文档地图和技术设计已同步新结构。

验收标准：

- app 之间没有源码 import。
- 官方插件集合和 builtin 装配职责分离。
- 官方插件、community 验证插件、examples 在目录层级上可区分。
- 文档入口不再把旧文件路径描述为当前事实。

### Phase X2: 协议收口与语义修正

目标：修正当前 MVP 插件契约的语义债务，避免继续在错误模型上扩展。

主要任务：

- 移除默认 workspace 中的 `rail accepts:["layout"]` 语义污染。
- 补齐 `HostActionId`：`layout-switch`、`shortcuts`、`plugin-manager` 等。
- 统一 `HostActionItem.icon` 契约，明确 lucide name 或平台 icon token。
- 移除 layout package 对 `@tabora/workbench-shell` 的依赖，恢复第三方 layout 依赖面隔离。
- `RegionSlot` 构建按 `region.accepts` 校验实例 extensionPoint。
- 接入真实 `isMobile` / responsive state。
- 布局错误 fallback 增加 toast 和状态记录。

验收标准：

- Dashboard、Stream、DIY layout 都不依赖伪 `layout` region。
- 第三方 layout 不需要知道官方 layout ID 也能获得合规全局入口。
- 官方 layout 和 DIY layout 都只依赖公开协议面。
- 错配实例不会渲染到不接受该 extension point 的 region。

### Phase X3: 编排模型下沉

目标：把当前散落在 shell UI 中的编排模型下沉到 orchestrator，workbench-shell 只做容器和交互表面。

主要任务：

- 实现 layout switcher：实例迁移、unplaced、workspace region state 和 snapshot。
- 实现 settings navigator：不再靠 panel id 推断 section。
- 实现 command/search model：CommandPalette 只渲染计算后的结果。
- 实现 context menu model：默认菜单 + 插件菜单 + action 执行。
- 实现 drag sort model：排序、持久化、键盘替代方案。

验收标准：

- settings、command、context menu、drag sort 的核心逻辑可单测，不依赖 DOM。
- workbench-shell 组件只接收 view model 和 callbacks。
- shell 不再直接扫描官方插件 manifest 生成业务交互模型。

### Phase X4: 交互贡献协议

目标：把命令、快捷键和上下文菜单纳入插件协议，并与编排模型对齐。

主要任务：

- 新增 `commands` contribution。
- 新增 `keybindings` contribution，并绑定 command ID。
- 新增 widget `contextMenus` contribution。
- orchestrator 实现 command catalog、shortcut registry 和 context menu manager。
- 命令面板、快捷键参考和右键菜单统一读取 contribution。

验收标准：

- 官方添加卡片、打开设置、切换主题、切换布局都走 command model。
- 第三方插件可以贡献命令并出现在命令面板。
- 第三方 widget 可以贡献实例级右键菜单项。

### Phase X5: 设置与实例配置协议

目标：让设置中心和实例设置具备第三方扩展稳定性。

主要任务：

- `settings-panel` 增加 `section`、`scope`、`order` 明确规则。
- widget `views.settings` 补齐实例设置 props contract。
- settings host 不再依赖 id 推断 section。
- 插件管理、外观、搜索、关于面板保留平台骨架，内容来自 contribution。

验收标准：

- 第三方设置面板能稳定进入指定 section。
- widget 实例设置能从右键菜单打开并按 instance 保存配置。

### Phase X6: Experience Pack / Workspace Preset

目标：支持第三方发布一整套默认工作台体验。

主要任务：

- 新增 `experiencePacks` 或 `workspacePresets` contribution。
- 定义默认 layout、theme、background、search、plugins、instances、regions、commands。
- 默认 workspace seed 改为从官方 preset 应用。
- 支持用户选择 preset 创建 workspace。

验收标准：

- 官方默认体验本身成为一个 official preset。
- 第三方 preset 可以在不改 shell 的情况下创建完整工作台。
- 切换 preset 不会丢失已有 workspace 数据。

### Phase X7: Host Capability 与跨平台适配

目标：让插件系统能被 playground、extension 和桌面 WebView shell 复用。

主要任务：

- 定义 `HostCapabilities` 和 `requiredCapabilities`。
- 抽象 storage adapter。
- runtime context 按 capability 暴露 API。
- 为 extension / desktop 预留不同 `external-open`、clipboard、local-file、network 实现。
- manifest 增加 `supportedPlatforms` 和 `apiVersion`。

验收标准：

- 插件激活前能判断当前 host 是否满足能力要求。
- Web IndexedDB 与未来桌面 storage 可以通过同一 repository port 接入。
- 不支持某能力的平台能给出稳定降级，而不是运行时崩溃。

### Phase X8: 第三方插件加载与隔离

目标：为第三方插件接入做代码层加载、依赖边界和隔离准备。

主要任务：

- 定义插件包格式和 `PluginLoader`。
- 区分 builtin、本地可信、远程不可信插件来源。
- 增加依赖限制和插件 API 兼容检查。
- 明确本地可信插件和未来不可信第三方插件的代码隔离边界。

验收标准：

- 本地可信插件不需要改官方聚合入口即可被发现和加载。
- 插件禁用、升级、回滚不破坏 workspace 和 plugin data。
- 第三方插件不能 import shell 内部包或绕过 runtime context。

## 8. 决策建议

短期 MVP 收尾优先级：

1. 先收口 shell 工程边界，拆掉 `App.tsx` 全能组件，建立 playground / extension 独立 shell。
2. 整理文件组织和包边界，建立 `workbench-app` / `host-adapters` / plugin 分层 / builtin registry。
3. 修正当前协议语义债务，尤其是 rail region、host action、layout package 依赖面、layout switching、RegionSlot 校验。
4. 下沉 settings、command、context menu、drag sort 等编排模型。
5. 补 `command`、`keybinding`、`context-menu` 三类交互贡献协议。
6. 补 settings section 和 widget instance settings。
7. 再做 experience pack，让官方默认体验也通过 preset 进入。

中期插件扩展性优先级：

1. PluginLoader 和插件包格式。
2. HostCapabilities 和 StorageAdapter。
3. 本地可信插件加载。
4. 插件 API 兼容检查。
5. 第三方插件依赖边界和代码隔离。

跨平台策略：

- 如果桌面客户端采用 Tauri / Electron / WebView，当前 Web UI 插件体系可以继续演进。
- 如果要支持非 Web 原生 UI，当前 Solid view 插件不能直接复用，需要另行设计 UI schema 或限制 UI 插件为 Web-only。

## 9. 后续文档同步要求

当上述改造进入实施时，需要同步：

- PRD：仅在产品口径变化时更新第三方完整体验、命令/快捷键/菜单、experience pack。
- 官方插件设计：把官方默认体验改写为官方 preset。
- 技术方案：补 contribution 类型、runtime context、host capability、plugin loader、storage adapter 和 package 边界。
- 文档地图：登记新的 implementation plan。
- AGENTS.md：同步新的架构边界和验证要求。
