# Tabora 插件化个人工作台技术方案 V2

版本：V2.3

日期：2026-06-03

状态：Phase A.1（布局插件化契约重构）已完成；其余 Phase 见 §17。

关联文档：

- 产品 PRD V2：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- V2 设计事实源：`DESIGN.md`
- V2 交互原型参考：`docs/design/03-工作台交互原型.html`
- UI 重构方案：`docs/technical/tabora-ui-refactoring-plan.md`
- 插件拆分方案：`docs/technical/tabora-plugin-package-splitting-plan.md`
- 文档地图：`docs/README.md`

## 0. 评审起点

本轮评审基于以下输入：

- PRD V2 的新增需求：布局即插件、至少两种布局验证、全局可达性约束、插件自由度/约束体系
- 设计原型中验证的交互模式：实时搜索内联建议、拖拽实时换位、双击展开卡片、右键上下文菜单、设置侧栏导航、Toast 堆叠、@语法搜索源切换
- 当前仓库实现的差距：rail/topbar 硬编码、单一布局假设、搜索无内联交互、无拖拽、无展开视图、无右键菜单、无通知系统

以下方案完全从零架构师视角出发，不预设当前实现是唯一正确方案。

## 1. 架构总体设计

### 1.1 分层架构

```txt
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

1. **区域即契约**：每个 Layout 插件定义 region 列表，Shell 和 Orchestrator 只通过 region ID 操作实例，不硬编码 rail/topbar/mainGrid 等区域名称。
2. **插件实例驱动 + 宿主入口注入**：插件内容区域由 PluginInstance 驱动渲染；平台强制可达入口（设置、添加卡片、快捷键参考等）通过 `LayoutHostAPI` 注入，不伪装成插件实例。
3. **扩展点 Props Contract 即文档**：每个扩展点的 view props 是插件和平台之间的类型契约，必须在 plugin-api 中显式定义，不可使用无约束泛型。
4. **交互行为也属于 Contract**：尺寸选择、拖拽排序、右键菜单、双击展开等交互行为的触发方式和参数，属于平台协议的一部分，插件只需声明支持即可获得对应交互。
5. **编排层不引入新依赖类型**：orchestrator 使用已有的 plugin-api 类型和 platform-kernel 能力，不创建新的插件协议概念。

## 2. 包拆分方案

```txt
packages/
  plugin-api/           # 类型、Schema、Props Contract（不变）
  platform-kernel/      # 插件生命周期、Registry、EventBus、权限、快捷键注册（增强）
  orchestrator/         # 新增：布局切换、区域映射、搜索路由、拖拽、展开、设置导航
  workbench-app/        # Phase X1 起步：跨 shell 的 workbench composition 承载层
  host-adapters/        # Phase X1 起步：Web / extension / desktop host capability adapters
  storage/              # IndexedDB 持久化（增强 migration 和 quota）
  theme/                # Token 应用（不变）
  brand/                # 品牌图标源文件、品牌组件、静态图标路径导出
  ui/                   # 插件内容区基础组件（按 V2 组件规范扩展，不承接宿主容器）
  builtin-plugin-registry/ # Phase X1.5：默认 builtin 装配
  official-plugins/     # 官方插件集合
  workbench-shell/      # Shell host 样式与通用宿主容器组件
```

设计 catalog 与包边界的映射需要额外说明：

- `DESIGN.md` 中的组件 catalog 是**设计 catalog**，不是 `@tabora/ui` 的 1:1 导出清单。
- `@tabora/ui` 只承接插件内容区基础组件和组合模式，如 `Button`、`Input`、`Field`、`ListRow`、`CardSection`、`Kbd` 等。
- `CommandPalette`、`Dialog`、`Drawer`、`Toast`、`ContextMenu`、`ExpandHost`、`SettingsHost`、快捷键面板等宿主级容器由 shell / orchestrator 提供，可复用 design spec，但不应强行收进 `@tabora/ui`。
- 官方插件样式由 `@tabora/official-plugins/styles.css` 提供；官方与 community layout 样式由各自 layout package 显式提供；shell host 样式与通用宿主容器组件由 `@tabora/workbench-shell` 提供。playground 与 extension 统一按样式入口装配这些模块，不在 `App.tsx` 内维护官方插件 class 或宿主容器 class 的 CSS。
- Phase X2 已开始修正布局协议语义：`HostActionId` 已包含 `layout-switch`、`shortcuts`、`plugin-manager` 等稳定动作 ID，布局切换不再伪装为 `theme` action；`RegionSlot` 构建会按 `region.accepts` 过滤实例，避免 extension point 错配；官方与 community layout package 已移除对 `@tabora/workbench-shell` 的依赖，保持第三方 layout 依赖面隔离；playground / extension 通过 `@tabora/workbench-app` responsive state 向 layout 传入真实 `isMobile`。
- Phase X1 当前状态已前进到“工程边界收口进行中”：`@tabora/workbench-app` 已承接 runtime bootstrap（database、repositories、plugin catalog、kernel 的集中创建），`@tabora/host-adapters` 已拆出 web / extension 平台工厂并提供稳定导出面。
- playground 当前通过 `apps/playground/src/workbenchComposition.ts` 组装 `@tabora/workbench-app`、`@tabora/host-adapters` 与 `@tabora/builtin-plugin-registry`，不再在 `App.tsx` 内直接 new 全套基础设施对象；`App.tsx` 仍是重型 shell，但已经收缩为组合根 + 宿主交互编排。
- extension newtab 已拥有自己的 shell entry，不再直接 import `@tabora/playground/src/App`。当前仍通过相对路径复用 playground 的纯逻辑 helper，这是 Phase X1 允许的过渡状态；后续需要继续把 shared shell 状态与 helper 收敛到独立 package。

`@tabora/orchestrator` 的职责边界：

```ts
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

```ts
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

```ts
// LayoutView 不再接受 { rail, topbar, mainGrid }
// 改为接受 { regions } —— 任意区域结构的通用接口
type LayoutViewProps = {
  regions: Record<string, RegionSlot>
  isMobile: boolean
  host: LayoutHostAPI
}

type RegionSlot = {
  regionId: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  renderInstance: (instance: PluginInstance) => JSXElement
  isEmpty: boolean
}
```

### 3.3 布局切换流程

```txt
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

```ts
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

解决方案：通用区域渲染引擎 `RegionRenderer`：

```ts
// orchestrator 提供
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

`LayoutView` 组件只需要调用 `renderRegionInstances` 来填充各个区域，不需要知道区域内容的具体类型。

### 4.2 宿主级全局入口注入

Rail、顶部工具条和安全布局中的“强制可达入口”不应伪装成 `layout` 插件实例，否则会污染扩展点语义。

推荐做法：布局壳体只决定这些入口**出现在哪里、以什么容器呈现**；入口动作本身由 `LayoutHostAPI` 提供。

```ts
type LayoutHostAPI = {
  renderRegion(regionId: string): JSXElement
  getGlobalActions(surface: "rail" | "toolbar" | "menu"): HostActionItem[]
  openSettings(tabId?: string): void
  openAddWidget(): void
  openPluginManager(): void
  openCommandPalette(): void
  toggleTheme(): Promise<void>
}

type HostActionItem = {
  id: "home" | "add-widget" | "plugins" | "settings" | "theme" | "shortcuts"
  label: string
  icon: string
  shortcut?: string
  action: () => void
}
```

这样：

- Dashboard 布局可以把 `getGlobalActions("rail")` 渲染成 rail 按钮组。
- Stream 布局可以把 `getGlobalActions("toolbar")` 渲染成轻工具入口，或只保留设置 / 主题等最少入口。
- `platform.safe-layout` 可以直接复用同一套宿主动作，而不用引入伪 `layout` contribution。

## 5. 搜索子系统

### 5.1 搜索架构

V2 设计原型验证了两种搜索入口：

- **Dashboard**：常驻搜索栏 + 内联实时建议下拉 + ⌘K 命令面板
- **Stream**：不放常驻搜索栏，完全通过 ⌘K 命令面板唤起搜索；页面只保留更轻的工具入口和搜索提示

这需要搜索子系统分为三层：

```txt
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

```ts
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

```ts
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

V2 原型采用实时交换而非占位符方案：拖拽悬停到目标卡片时，两张卡片立即交换数组位置并重新渲染。

```ts
// orchestrator 提供
class DragSortController {
  private dragState: DragState | null = null

  startDrag(instanceId: string, startPosition: Point): void {
    this.dragState = {
      instanceId,
      origIndex: this.instances.findIndex((i) => i.id === instanceId),
      lastSwapIndex: -1,
      isActive: true,
    }
  }

  onDragOver(clientPosition: Point): void {
    if (!this.dragState) return
    const targetCard = this.hitTestCard(clientPosition)
    if (!targetCard || targetCard.id === this.dragState.instanceId) return

    const targetIdx = this.instances.findIndex((i) => i.id === targetCard.id)
    if (targetIdx !== this.dragState.lastSwapIndex) {
      this.dragState.lastSwapIndex = targetIdx
      this.swapInstances(this.dragState.instanceId, targetCard.id)
      this.emitReorder()
    }
  }

  endDrag(): void {
    if (this.dragState?.isActive) {
      this.persistOrder()
      this.showConfirmation()
    }
    this.dragState = null
  }

  private swapInstances(idA: string, idB: string): void {
    const idxA = this.instances.findIndex((i) => i.id === idA)
    const idxB = this.instances.findIndex((i) => i.id === idB)
    ;[this.instances[idxA], this.instances[idxB]] = [this.instances[idxB], this.instances[idxA]]
  }
}
```

### 6.2 拖拽交互约束

- 5px 移动阈值：防止点击误触拖拽
- 不触发拖拽的元素：`button, input, textarea, .todo-check, .card-action`
- 拖拽中禁止文字选择：`body.drag-active { user-select: none }`
- 触屏支持：`touchstart → touchmove → touchend`，passive: false 防止页面滚动

## 7. 卡片展开子系统

### 7.1 展开视图协议

V2 原型中每种卡片类型有完全不同的展开视图内容。这是扩展点交互协议的一部分：

```ts
// plugin-api 中新增
type ExpandViewContribution = {
  viewId: string // 注册到 registry 的 expand view ID
  supportedActions: ExpandAction[] // 展开后可执行的操作
}

type ExpandViewProps = {
  instance: PluginInstance
  data: WidgetViewData
  host: {
    close(): void
    updateData(data: unknown): Promise<void>
    executeAction(action: string): void
  }
}

// 平台提供的展开容器
type ExpandHostProps = {
  instance: PluginInstance
  onClose: () => void
}
```

### 7.2 展开容器动画

展开容器由宿主统一提供：

```txt
打开：overlay fade in (250ms) + modal scale 0.95→1 + translateY 12px→0
内容：插件提供的 ExpandView
关闭：modal scale 1→0.95 + overlay fade out (250ms) → 移除
```

展开容器结构：

```txt
ExpandModal
  ExpandHeader (图标 + 标题 + 关闭按钮)
  ExpandBody (插件 ExpandView)
  ExpandFooter (元信息 + esc 提示)
```

## 8. 上下文菜单子系统

### 8.1 右键菜单协议

上下文菜单使用事件委托，不为每个卡片绑定独立处理器：

```ts
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

```ts
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

插件可以在 activate 中追加自定义菜单项。

## 9. 通知系统

### 9.1 Toast 组件

V2 原型验证了 Toast 堆叠模式。平台需要提供统一的 Toast 管理：

```ts
// orchestrator 提供
type ToastManager = {
  show(message: string, options?: ToastOptions): string // 返回 toast ID
  dismiss(id: string): void
}

type ToastOptions = {
  type?: "success" | "error" | "warning" | "info"
  duration?: number // 默认 2500ms
  action?: { label: string; onClick: () => void }
}
```

Toast 行为：

- 新 Toast 从右侧滑入（`translateX(20px)→0`，200ms ease）
- 堆叠不超过 3 条，超出时移除最早的
- 每条独立计时 2.5s 后淡出移除
- 带 action 的 Toast 不自动消失

### 9.2 插件可访问性

插件不直接操作 Toast 系统。通过 runtime context：

```ts
context.ui.showToast("保存成功", { type: "success" })
```

## 10. 快捷键系统

### 10.1 全局快捷键注册

```ts
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

插件可以在 activate 中注册自己的快捷键。冲突由平台检测并按优先级（global > layout > widget）处理。

## 11. 设置架构

### 11.1 侧栏导航模型

V2 原型采用左侧分类导航 + 右侧内容区的结构。当前 PRD 已明确：设置中心仍需通过 `settings-panel` contribution 验证插件化闭环，因此技术方案不能把 `settings-panel` 降级为后续能力。

建议的分层方案：

```txt
SettingsHost (shell 提供)
  ├── SettingsNav (侧栏导航，来自 orchestrator)
  │   ├── 通用 (平台 tab + 对应 settings-panel panels)
  │   ├── 外观 (平台 tab + 对应 settings-panel panels)
  │   ├── 搜索 (平台 tab + 对应 settings-panel panels)
  │   ├── 插件 (平台 tab + 对应 settings-panel panels)
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

```ts
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
    modal?: string
    fullscreen?: string
    settings?: string
  }
}
```

```ts
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
    // 基本
    updateConfig(value: Record<string, unknown>): Promise<void>
    removeInstance(): Promise<void>

    // 尺寸（平台通过右键菜单/尺寸选择器触发，插件也可请求）
    requestResize(size: WidgetSize): Promise<void>

    // 弹窗
    openModal(viewId: string, props?: unknown): void
    closeModal(): void

    // 展开（双击触发，或插件请求）
    openExpand(): void

    // 通知
    showToast(message: string, opts?: ToastOptions): void

    // 外部操作
    openExternal(url: string): Promise<boolean>
  }
}
```

### 12.2 Search

```ts
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
    executeSelection(): Promise<void>
    open(): void
    close(): void
    showToast(message: string): void
  }
}
```

### 12.3 SettingsPanel

```ts
type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
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

## 13. 持久化增强

### 13.1 新增表

```ts
class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>

  // V2 新增
  permissionGrants!: Table<PermissionGrant, string>
  eventLogs!: Table<EventLog, string>
  searchHistory!: Table<SearchHistoryEntry, string>
  shortcutBindings!: Table<ShortcutBindingRecord, string>
}
```

### 13.2 Workspace Snapshot

布局切换前自动备份当前 workspace：

```ts
type WorkspaceSnapshot = {
  id: string
  workspaceId: string
  layoutId: string        // 切换前的布局 ID
  instances: PluginInstance[]  // 完整的实例列表快照
  createdAt: string
}

// repository 方法
snapshotRepository.save(workspaceId, layoutId, instances)
snapshotRepository.getLast(workspaceId): WorkspaceSnapshot | null
snapshotRepository.restore(snapshotId): void
```

这在布局切换失败时提供一键回滚能力。

## 14. 错误回退体系

### 14.1 分层回退

```txt
Level 1: 内容级 → 单个 widget view 失败 → PluginViewBoundary 错误卡片
Level 2: 区域级 → 某个 region 所有实例失败 → 区域错误占位
Level 3: 插件级 → layout/theme/search 插件失败 → 平台安全默认
Level 4: 存储级 → IndexedDB 读失败 → 安全默认 workspace（不覆盖原有数据）
```

### 14.2 安全默认

| 失败组件       | 回退方案                                                |
| -------------- | ------------------------------------------------------- |
| Layout         | 激活 `platform.safe-layout`（单列流式 + ⌘K + 设置入口） |
| Theme          | 应用 `platform.safe-theme` 最小 token 集                |
| Search         | 命令面板仍可通过 ⌘K 唤起                                |
| Background     | 移除背景层，使用安全纯色                                |
| Settings Panel | 仅该面板显示错误，其他面板正常                          |
| IndexedDB 读取 | 渲染默认工作台（manifest seed），不覆盖已有数据         |
| IndexedDB 写入 | 捕获 QuotaExceededError，Toast 通知用户                 |

## 15. 测试策略

### 15.1 新增测试类型

| 类型                    | 覆盖目标                                             | 工具                  |
| ----------------------- | ---------------------------------------------------- | --------------------- |
| Contract Tests          | 每个 contribution viewId 可解析、props 满足 contract | Vitest                |
| Orchestrator Tests      | 布局切换、区域映射、搜索路由、拖拽算法               | Vitest                |
| Interaction Tests       | 搜索键盘导航、拖拽交换、Toast 堆叠、右键菜单         | Vitest Browser Mode   |
| Storage Migration Tests | Schema 升级、快照保存/恢复、quota 处理               | fake-indexeddb        |
| A11y Tests              | 键盘可达性、焦点管理、ARIA 角色                      | axe-core + Playwright |
| Visual Regression       | 双布局截图对比、主题切换、错误状态                   | Playwright screenshot |

### 15.2 关键测试场景

```txt
布局切换：
  - Dashboard → Stream → Dashboard：实例数据完整保留
  - 切换后无法匹配区域的实例进入 unplaced 状态
  - 布局插件失败时激活安全布局

搜索：
  - 空搜索：显示收藏快捷命令
  - Stream 布局无常驻搜索栏：仅通过 ⌘K 打开命令面板
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
  - 双击今日重点：大号输入框
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
      layout-engine.tsx        # createLayoutEngine 产出 RegionSlot + LayoutHostAPI
      search-engine.ts          # （Phase C 待实现）
      search-router.ts
      drag-sort-controller.ts   # （Phase D 待实现）
      expand-manager.ts         # （Phase D 待实现）
      context-menu-manager.ts   # （Phase D 待实现）
      settings-navigator.ts     # （Phase E 待实现）
      toast-manager.ts          # （Phase D 待实现）
      shortcut-registry.ts      # （Phase E 待实现）
      index.ts
  storage/              # 增强：snapshot repository、migration
  theme/                # 不变
  ui/                   # 仅扩展插件内容区组件，不承载宿主容器
  builtin-plugin-registry/ # 当前 shell 默认 builtin 插件列表
  official-plugins/     # 官方插件集合：引入官方 layout package + 其他官方 contribution
  workbench-shell/      # Shell host 样式 + WidgetCardShell + LayoutBoundary

plugins/
  official/
    layout-dashboard/   # 官方仪表盘布局，独立 package
    layout-stream/      # 官方流式布局，独立 package
    widget-*/           # 官方业务卡片插件
  community/
    layout-diy-masonry/ # 第三方 DIY 瀑布流验证 package
  examples/
```

## 17. 实施路线

### Phase A: 编排层基础（1-2 周）✅ 已完成

1. 创建 `@tabora/orchestrator` 包。已完成。
2. 实现 `PluginCatalog`：插件贡献枚举、layout/search/widget 查询、settings panel 收集和插件摘要。已完成。
3. 实现 `createLayoutEngine`：通用 region → 实例映射 + 卡片壳/搜索表面渲染注入 + LayoutHostAPI 构造。已完成，取代旧的 `region-renderer.tsx`。
4. 重构 playground `App.tsx`：renderActiveLayout 从 `isDashboard/isStream` 硬编码切换为协议驱动；新增 `renderSafeLayout` 兜底；用 `LayoutBoundary` 隔离布局错误。已完成。
5. 验证 Dashboard 布局功能不变。已完成。

### Phase A.1: 布局 package 拆分 + 第三方验证 ✅ 已完成

1. `plugin-api` 新增 `LayoutViewProps`/`RegionSlot`/`LayoutHostAPI`/`HostActionItem` 契约类型。
2. `manifestSchema` 新增最小强制 schema：layout 必须含至少一个 `accepts:["widget"]` 的 region 且 `view` 字段必填。
3. `workbench-shell` 抽出 `WidgetCardShell`（卡片壳）和 `LayoutBoundary`（错误边界）。
4. 把官方 dashboard、stream 布局拆成独立 package（`plugins/layout-dashboard`、`plugins/layout-stream`），依赖面只有 plugin-api/platform-kernel/solid-js（隔离硬证据）。
5. 新增 `plugins/layout-diy-masonry`：第三方差异化 DIY 布局，验证只靠公开契约就能实现瀑布流分列、浮动菜单、自定义图标等创新形态。
6. `official-plugins` 装配层引入三个布局 package，删除原 `layout-workbench-*.tsx` 内联实现。
7. `App.tsx` 引入 `WidgetCardShell` 卡片壳，将拖拽/双击/右键/尺寸条等交互通过 `WidgetHostCallbacks` 闭包注入；layout view 负责包裹 `.workbench-grid`，`WidgetCardShell` 根据当前 widget size 写入 grid span，避免协议驱动布局丢失原型的 4 列卡片排布。

### Phase B: 布局切换（1 周）

1. 实现 `LayoutSwitcher`：workspace snapshot、实例迁移算法、unplaced 状态
2. 在设置中心添加布局选择器
3. 实现 `platform.safe-layout` fallback。已完成基础（renderSafeLayout）。
4. 开发 `official.layout.workbench-stream` 插件。已完成（layout-stream package）。

### Phase C: 搜索增强（1 周）

1. 实现 `SearchEngine`：模糊搜索、@语法路由、键盘导航状态机
2. 实现 Dashboard 内联搜索建议 UI（SearchBar + Suggestions）
3. 增强 CommandPalette：动态结果、分组显示、⌘K 同步，作为 Stream 的唯一搜索入口
4. 搜索历史持久化

### Phase D: 交互增强（1-2 周）

1. 实现 `DragSortController`：实时交换算法、5px 阈值、触屏支持
2. 实现 `ExpandManager`：6 种类型的展开视图渲染器
3. 实现 `ContextMenuManager`：事件委托、默认 + 插件自定义菜单
4. 实现 `ToastManager`：堆叠、自动消失、带 action

### Phase E: 快捷键与设置（1 周）

1. 实现 `ShortcutRegistry`：全局 + 插件快捷键、冲突检测
2. 重构 Settings host：侧栏导航、标签页切换
3. 实现 `SettingsNavigator`：组织固定 tab，并挂载 `settings-panel` contributions

## 18. 风险与应对

| 风险                                       | 应对                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| orchestrator 抽象过度增加复杂度            | 每个模块独立可测试、独立可替换；不强求所有 orchestrator 模块同时完成 |
| 布局切换时实例数据丢失                     | 强制 workspace snapshot 备份 + 一键回滚                              |
| 拖拽实时交换在大量卡片时性能下降           | 虚拟化 + requestAnimationFrame 节流；卡片数 > 50 时降级为简单排序    |
| 搜索 @语法 和命令/卡片模糊搜索的优先级冲突 | 严格优先级：@语法 > 命令精确匹配 > 卡片模糊匹配 > 网页搜索           |
| orchestrator 引入后 playground 回归风险    | Phase A 先重构再扩展，保证每次 commit 后 Dashboard 布局可正常运行    |
