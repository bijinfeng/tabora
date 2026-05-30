# Tabora 插件化个人工作台技术方案 V2

版本：V2.0

日期：2026-05-30

状态：基于 V2 PRD（双布局、插件约束体系）、V2 设计原型（搜索/拖拽/展开/右键/设置交互模式）从零评审重写

关联文档：

- 产品 PRD V2：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- V2 设计体系：`docs/design/01-设计体系规范.html`
- V2 组件规范：`docs/design/02-基础组件规范.html`
- V2 交互原型：`docs/design/03-工作台交互原型.html`
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
│  - @tabora/ui (基础组件库)                             │
│  - @tabora/official-plugins (官方插件包)               │
└──────────────────────────────────────────────────────┘
```

关键变化：新增 **Orchestration Layer**（`@tabora/orchestrator`）。当前实现将编排逻辑散落在 `App.tsx` 中（837 行单体组件），造成 shell 与业务逻辑耦合。拆出独立编排层后：

- Shell 只负责 DOM 挂载、宿主容器渲染、全局生命周期
- Orchestrator 负责所有跨插件、跨区域的协调逻辑
- 布局切换、搜索路由、拖拽排序、展开管理等复杂交互在编排层内聚

### 1.2 核心设计原则

1. **区域即契约**：每个 Layout 插件定义 region 列表，Shell 和 Orchestrator 只通过 region ID 操作实例，不硬编码 rail/topbar/mainGrid 等区域名称。
2. **实例驱动渲染**：所有区域内容（包括 rail 按钮、搜索栏）都来自 PluginInstance，不硬编码 UI。
3. **扩展点 Props Contract 即文档**：每个扩展点的 view props 是插件和平台之间的类型契约，必须在 plugin-api 中显式定义，不可使用无约束泛型。
4. **交互行为也属于 Contract**：尺寸选择、拖拽排序、右键菜单、双击展开等交互行为的触发方式和参数，属于平台协议的一部分，插件只需声明支持即可获得对应交互。
5. **编排层不引入新依赖类型**：orchestrator 使用已有的 plugin-api 类型和 platform-kernel 能力，不创建新的插件协议概念。

## 2. 包拆分方案

```txt
packages/
  plugin-api/           # 类型、Schema、Props Contract（不变）
  platform-kernel/      # 插件生命周期、Registry、EventBus、权限、快捷键注册（增强）
  orchestrator/         # 新增：布局切换、区域映射、搜索路由、拖拽、展开、设置导航
  storage/              # IndexedDB 持久化（增强 migration 和 quota）
  theme/                # Token 应用（不变）
  ui/                   # 基础组件库（扩展至 52 组件）
  official-plugins/     # 官方插件包（新增 stream layout）
```

`@tabora/orchestrator` 的职责边界：

```ts
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
  regions: [
    { id: "toolbar", accepts: ["layout"], required: true },
    { id: "stream", accepts: ["widget"], required: false },
  ],
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

### 4.2 Rail 区域实例化

Rail 不再硬编码静态按钮。Rail 区域的 `accepts: ["layout"]` 类型的实例由平台提供的内置 `layout` contribution 填充：

```ts
// 平台内置的 rail action 贡献（不是插件，是平台提供的默认实例）
const RAIL_ACTIONS: PluginInstance[] = [
  {
    id: "rail-home",
    contributionId: "platform.rail.home",
    extensionPoint: "layout",
    regionId: "rail",
  },
  {
    id: "rail-add",
    contributionId: "platform.rail.add-widget",
    extensionPoint: "layout",
    regionId: "rail",
  },
  {
    id: "rail-plugins",
    contributionId: "platform.rail.plugins",
    extensionPoint: "layout",
    regionId: "rail",
  },
  {
    id: "rail-settings",
    contributionId: "platform.rail.settings",
    extensionPoint: "layout",
    regionId: "rail",
  },
]
```

这些内置实例的行为（打开添加卡片面板、打开设置等）通过 runtime context 的 UI bridge 实现，而非硬编码在 shell 中。

## 5. 搜索子系统

### 5.1 搜索架构

V2 设计原型验证了两种搜索入口：

- **Dashboard**：常驻搜索栏 + 内联实时建议下拉 + ⌘K 命令面板
- **Stream**：中心搜索栏 + ⌘K 命令面板

这需要搜索子系统分为三层：

```txt
┌─────────────────────────────────────────┐
│  Search UI Layer                        │
│  - SearchBar (内联输入 + 建议下拉)       │
│  - CommandPalette (⌘K 浮层)             │
│  - SearchProviderIndicator (常驻指示器)  │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│  Search Engine (orchestrator)           │
│  - 模糊搜索命令 / 卡片 / 网页            │
│  - @语法 解析和路由                      │
│  - 分组建议生成                          │
│  - 键盘导航状态管理 (↑↓ Enter Esc)       │
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
  const providerMatch = query.match(/^@(\w+)\s+(.*)/)
  if (providerMatch) {
    return { type: "provider", provider: providerMatch[1], query: providerMatch[2] }
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

插件只需提供搜索结果的 `action` 回调，键盘导航由平台统一处理。

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

V2 原型采用左侧分类导航 + 右侧内容区的结构。这与当前 PRD 中描述的"聚合 settings-panel contributions"有差异。

建议的分层方案：

```txt
SettingsHost (shell 提供)
  ├── SettingsNav (侧栏导航，来自 orchestrator)
  │   ├── 通用 (平台内置，非插件贡献)
  │   ├── 外观 (聚合 theme + background contributions)
  │   ├── 搜索 (聚合 search-provider contributions)
  │   ├── 插件 (聚合已安装插件列表)
  │   └── 关于 (平台内置)
  └── SettingsContent (右侧内容区)
      └── SettingsTab (每个 tab 由 orchestrator 管理)
          └── PluginViewBoundary
              └── SettingsPanelView (插件贡献)
```

每个标签页的内容：

- **通用**：布局选择器（列出所有 layout contributions）、工作区信息。由 orchestrator 直接渲染。
- **外观**：主题切换（列出所有 theme contributions）、背景选择（列出所有 background-provider contributions）。
- **搜索**：默认搜索引擎选择（列出所有 search-provider contributions）、@语法说明。
- **插件**：已安装插件列表，每个带启用/禁用开关、版本、贡献能力标签。
- **关于**：平台内置。

### 11.2 SettingsPanel 贡献的新角色

`settings-panel` contribution 在 V2 中的定位有所变化：

- **MVP 阶段**：设置内容主要由 orchestrator 聚合 contributions 信息后直接渲染（读取 manifest/contribution 元数据即可，不需要插件提供 view）。
- **V1.1+ 阶段**：当插件需要自定义复杂设置 UI 时，才通过 `settings-panel` contribution 注册 view。例如插件管理面板中的"权限详情"、"调试信息"等。

这种分层避免了 MVP 阶段每个设置面板都需要插件的 activate + view 注册 + 渲染的开销。

## 12. 扩展点 Props Contract V2

基于 V2 原型验证的交互模式，扩展点 props contract 需要增强：

### 12.1 Widget

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
  providers: SearchProviderContribution[]
  defaultProviderId: string
  recentSearches: string[]
  host: {
    submit(query: string, providerId?: string): Promise<void>
    resolveProvider(keyword: string): SearchProviderContribution | null
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
  - 输入 "主题"：匹配切换主题命令
  - 输入 "@bing 天气"：路由到 Bing 搜索源
  - ↑↓ 导航，Enter 执行，Escape 关闭

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
  plugin-api/           # 不变
  platform-kernel/      # 增强：快捷键注册、上下文菜单注册
  orchestrator/         # 新增：编排层
    src/
      layout-switcher.ts
      region-renderer.ts
      search-engine.ts
      search-router.ts
      drag-sort-controller.ts
      expand-manager.ts
      context-menu-manager.ts
      settings-navigator.ts
      toast-manager.ts
      shortcut-registry.ts
      index.ts
  storage/              # 增强：snapshot repository、migration
  theme/                # 不变
  ui/                   # 扩展
  official-plugins/     # 新增 layout-workbench-stream
```

## 17. 实施路线

### Phase A: 编排层基础（1-2 周）

1. 创建 `@tabora/orchestrator` 包
2. 实现 `RegionRenderer`：通用区域 → 实例 → view 映射
3. 重构 playground `App.tsx`：将 rail/topbar/mainGrid 硬编码改为 `RegionRenderer` 调用
4. 验证 Dashboard 布局功能不变

### Phase B: 布局切换（1 周）

1. 实现 `LayoutSwitcher`：workspace snapshot、实例迁移算法、unplaced 状态
2. 在设置中心添加布局选择器
3. 实现 `platform.safe-layout` fallback
4. 开发 `official.layout.workbench-stream` 插件

### Phase C: 搜索增强（1 周）

1. 实现 `SearchEngine`：模糊搜索、@语法路由、键盘导航状态机
2. 实现内联搜索建议 UI（SearchBar + Suggestions）
3. 增强 CommandPalette：动态结果、分组显示、⌘K 同步
4. 搜索历史持久化

### Phase D: 交互增强（1-2 周）

1. 实现 `DragSortController`：实时交换算法、5px 阈值、触屏支持
2. 实现 `ExpandManager`：6 种类型的展开视图渲染器
3. 实现 `ContextMenuManager`：事件委托、默认 + 插件自定义菜单
4. 实现 `ToastManager`：堆叠、自动消失、带 action

### Phase E: 快捷键与设置（1 周）

1. 实现 `ShortcutRegistry`：全局 + 插件快捷键、冲突检测
2. 重构 Settings host：侧栏导航、标签页切换
3. 实现 `SettingsNavigator`：聚合 contributions 渲染设置内容

## 18. 风险与应对

| 风险                                       | 应对                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| orchestrator 抽象过度增加复杂度            | 每个模块独立可测试、独立可替换；不强求所有 orchestrator 模块同时完成 |
| 布局切换时实例数据丢失                     | 强制 workspace snapshot 备份 + 一键回滚                              |
| 拖拽实时交换在大量卡片时性能下降           | 虚拟化 + requestAnimationFrame 节流；卡片数 > 50 时降级为简单排序    |
| 搜索 @语法 和命令/卡片模糊搜索的优先级冲突 | 严格优先级：@语法 > 命令精确匹配 > 卡片模糊匹配 > 网页搜索           |
| orchestrator 引入后 playground 回归风险    | Phase A 先重构再扩展，保证每次 commit 后 Dashboard 布局可正常运行    |
