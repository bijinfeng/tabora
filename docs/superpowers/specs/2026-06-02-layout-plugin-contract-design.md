# 布局插件化契约重构设计

日期：2026-06-02

状态：已实现（2026-06-03，详见 `docs/superpowers/plans/2026-06-02-layout-plugin-contract.md`）

关联文档：

- 技术方案 V2：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 阶段路线图（Phase O 拆包债务）：`docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`
- 项目约束：`AGENTS.md`

## 1. 背景与问题

最终目标是开放第三方插件生态。当前架构号称"布局即插件"，但实现层无法支撑第三方 DIY 布局：

- **布局分发硬编码**：`apps/playground/src/App.tsx` 的 `renderActiveLayout` 用 `isDashboard / isStream` 两个 `if` 写死，非这两个 ID 的布局 view 永远不会被调用，直接落到默认网格兜底。
- **布局 view props 是 bespoke 的**：dashboard 收 `{rail, topbar, mainGrid}`，stream 收 `{toolbar, stream}`，每种布局一套形状；`plugin-api` 里没有通用的 `LayoutViewProps`。
- **强制可达入口无协议**：设置、添加卡片、主题切换、⌘K 等强制入口由 shell 直接渲染（含写死的 SVG），布局拿不到。
- **卡片交互锁在 shell**：拖拽、双击展开、右键菜单、尺寸条全在 `App.tsx` 的 `renderMainGrid` 内联，布局无法复用。

注意：搜索和设置在协议层**已经是插件 contribution**（`official.search.command-bar` 贡献 search view，`settings-workspace` 贡献 settings-panel）。真正缺失的是布局的"渲染出口"和"周边 chrome"的插件化。

## 2. 目标与范围

**目标**：让布局成为真正的第三方可实现插件——能力全部经公开契约注入，shell 不认识任何具体布局 ID。通过把两个官方布局拆成独立 package、并新增一个差异化的第三方 DIY 布局，验证架构是否真支持第三方布局。

**本次范围**：

- 在 `plugin-api` 落地布局契约类型 + 最小强制 schema。
- 在 `orchestrator` 实体化布局渲染引擎（产出 `RegionSlot` + 构造 `LayoutHostAPI`）。
- 在 `workbench-shell` 抽出宿主级卡片壳与浮层容器。
- 把官方 dashboard / stream 布局拆成独立 package（`plugins/layout-*`）。
- 新增第三方验证布局 `plugins/layout-diy-masonry`。
- 重写 `App.tsx` 的布局分发为通用 region 遍历。
- 安全布局 fallback + 布局错误边界。

**不在本次范围**（YAGNI）：

- official-plugins 其余 6 个插件的拆包（见路线图 Phase O，按优先级分批）。
- 远程插件加载机制（MVP 明确不做；三个布局仍走 builtin 加载路径）。
- 实时交换拖拽算法、5px 阈值、触屏拖拽（保持现有 splice 重排）。
- ToastManager / ShortcutRegistry 正规化（保持 App.tsx 现状）。
- 卡片壳双层接口（本次只做"平台提供壳"）。
- 跨 region 拖拽、视觉回归、a11y axe 扫描。

## 3. 四个关键决策

1. **插件边界 = 宿主动作注入**：强制入口由平台经 `LayoutHostAPI` 保证可达，布局只决定呈现表面。
2. **最小强制合格线**：布局只需声明至少一个 `accepts:["widget"]` 的 region + `view` 字段；search/settings region 可选。
3. **平台提供卡片壳**：`RegionSlot` 的渲染器返回带完整交互（拖拽/双击/右键/尺寸条）的卡片壳，布局只管摆放。
4. **布局独立成 package**：两个官方布局 + 一个 DIY 布局各自独立 package，依赖面逐字相同作为第三方隔离硬证据。

## 4. 架构与包边界

```txt
plugins/
  widget-*/                  已有业务卡片插件（不动）
  layout-dashboard/          新增：官方仪表盘布局，独立 package
  layout-stream/             新增：官方流式布局，独立 package
  layout-diy-masonry/        新增：第三方 DIY 验证布局，独立 package

packages/
  plugin-api/                新增布局契约类型 + Zod schema（纯类型，无运行时）
  orchestrator/              渲染引擎实体化：layout-engine 产出 RegionSlot；构造 LayoutHostAPI
  workbench-shell/           新增 WidgetCardShell / ContextMenuHost / ExpandHost / LayoutBoundary
  official-plugins/          移除两个内联布局，改为引入三个布局 package 再聚合
```

依赖方向（不破坏 AGENTS.md 边界）：

- `plugin-api` 纯协议，零运行时依赖。
- `orchestrator` 依赖 plugin-api + platform-kernel + storage。
- `workbench-shell` 提供 host 容器，依赖 plugin-api + ui，**不依赖** official-plugins。
- 三个布局 package 依赖面**逐字相同**，且**不含** orchestrator/workbench-shell/ui/official-plugins：

```jsonc
"dependencies": {
  "@tabora/plugin-api": "workspace:*",
  "@tabora/platform-kernel": "workspace:*",
  "solid-js": "catalog:ui"
}
```

这是第三方隔离的硬证据：官方布局和 DIY 布局走完全相同的 import 面，能力只能经 `LayoutViewProps` 运行时注入，无法 import 平台内部包。由 pnpm workspace 的 `package.json` 强制。

卡片壳 `WidgetCardShell` 放 workbench-shell（host 容器归 shell，AGENTS.md 边界），orchestrator 通过**注入**调用它，而非反向依赖（见 §6.1）。

## 5. 契约类型定义（plugin-api）

### 5.1 LayoutViewProps

布局 view 收到的 props，取代 `{rail,topbar,mainGrid}` / `{toolbar,stream}`：

```ts
type LayoutViewProps = {
  regions: Record<string, RegionSlot> // key = region.id
  isMobile: boolean
  host: LayoutHostAPI
}

type RegionSlot = {
  regionId: string
  title: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  isEmpty: boolean
  render: () => JSXElement // 整区一把梭渲染
  renderInstance: (instance: PluginInstance) => JSXElement // 单实例，供瀑布流分列
}
```

`render()` 与 `renderInstance()` 返回的卡片壳都自带平台统一的拖拽/双击/右键/尺寸条——交互能力来自这里，不来自布局自身。

### 5.2 LayoutHostAPI（宿主动作注入）

```ts
type LayoutHostAPI = {
  getGlobalActions: (surface: HostSurface) => HostActionItem[]
  openSettings: (panelId?: string) => void
  openCommandPalette: () => void
  openAddWidget: () => void
  toggleTheme: () => void
  isDark: () => boolean
}

type HostSurface = "rail" | "toolbar" | "menu"

type HostActionItem = {
  id: "home" | "add-widget" | "plugins" | "settings" | "theme" | "command"
  label: string
  icon: string // lucide 图标名字符串，布局自决渲染
  shortcut?: string
  isActive?: boolean
  run: () => void
}
```

强制入口动作集由平台保证存在；布局只能选择渲染在哪个 surface、长什么样，不能删除动作本身。

### 5.3 最小强制 schema

`layoutContributionSchema`（Zod）在现有基础上新增校验：

- 至少一个 region 的 `accepts` 包含 `"widget"`（否则卡片无处放）→ 否则该布局不可激活。
- `view` 字段必填（原为可选 `view?`）。
- search / settings region 完全可选。

### 5.4 图标契约

`HostActionItem.icon` 用 lucide 图标名字符串。平台给名字，布局决定怎么画——官方布局用 `@tabora/ui` 图标组件，DIY 布局可用纯文字/emoji。

## 6. orchestrator 渲染引擎

### 6.1 依赖方向与注入接口

orchestrator 不能依赖 workbench-shell（shell 反向依赖 orchestrator）。卡片壳由 shell **注入**，orchestrator 只定义注入接口：

```ts
// orchestrator 定义，shell 实现并注入
type InstanceRenderer = {
  renderWidget: (instance: PluginInstance, hostCallbacks: WidgetHostCallbacks) => JSXElement
  renderSearch: (instance: PluginInstance) => JSXElement
  renderSettings?: (instance: PluginInstance) => JSXElement
}

type LayoutEngineDeps = {
  catalog: PluginCatalog
  registry: ExtensionRegistry
  instanceRenderer: InstanceRenderer
  hostActions: HostActionsSource
  buildWidgetProps: (instance: PluginInstance) => WidgetViewProps
}
```

### 6.2 createLayoutEngine

```ts
function createLayoutEngine(deps: LayoutEngineDeps): {
  buildRegionSlots(layoutId: string, instances: PluginInstance[]): Record<string, RegionSlot>
  buildHostAPI(): LayoutHostAPI
}
```

`buildRegionSlots` 遍历 `layout.regions`，每个 region 产一个 `RegionSlot`：

- `instances` = 过滤 `regionId === region.id && enabled`，按 grid 排序。
- `render()` = 该 region 所有实例逐个调 instanceRenderer（widget 走卡片壳，search 走搜索表面）。
- `renderInstance(inst)` = 单实例走同一套渲染。
- `isEmpty / accepts / title` 来自实例列表与 region 声明。

`buildHostAPI().getGlobalActions(surface)` 返回固定强制动作集，每个 `run` 绑到 shell 注入的 `hostActions`。这是"强制可达"的唯一真源，动作集与布局无关。

### 6.3 现有代码处理

- 现有 `region-renderer.tsx` 的 `createRegionRenderer` 是半成品（异步、写死 `views.card`、不带交互、未被使用）→ **重写**为 `createLayoutEngine`（新文件 `layout-engine.tsx` 或原文件重构），保留 viewId 解析逻辑，去掉异步 instanceRepo 取数（改为接收已加载 instances）。
- `index.ts` 导出从 `createRegionRenderer` 切到 `createLayoutEngine`。
- `search-model.ts`（搜索路由纯函数）不动。

## 7. 官方布局迁移与 package 落地

### 7.1 三个 package 结构

照 `plugins/widget-notes` 模板：`package.json` + `tsconfig.json`（extends `@tabora/tsconfig/base.json`）+ `src/index.ts`（布局 view 组件 + BuiltinPlugin 导出）+ `src/styles.css`。依赖面见 §4。

### 7.2 layout-dashboard

view 从 `{rail,topbar,mainGrid}` 改为 `LayoutViewProps`：

- rail 用 `host.getGlobalActions("rail")` 渲染按钮组，不再硬编码 SVG。
- topbar 渲染 `regions["topbar"].render()`（search region，可选 `<Show>` 包裹）。
- mainGrid 渲染 `regions["mainGrid"].render()`。
- 问候语/日期等纯展示 chrome 归布局自身。
- **region 语义修正**：rail 原 `accepts:["layout"]` 是语义污染，改为不再是实例 region，而是布局用 host actions 渲染的 chrome；保留 mainGrid `accepts:["widget"]`、topbar `accepts:["search"]`。

### 7.3 layout-stream

收 `LayoutViewProps`，只声明一个 `stream` region（`accepts:["widget"]`）。工具条用 `host.getGlobalActions("toolbar")` 渲染 ⌘K/设置。stream-hero 问候归布局自身。

### 7.4 layout-diy-masonry（第三方验证布局）

故意与官方两个都不同，证明契约够用：

- 只声明一个 region `masonry`（`accepts:["widget"]`），不要 search region，验证"最小强制"。
- 用 `regions["masonry"].renderInstance` 自己分列做瀑布流（CSS columns），验证单实例接口。
- 强制入口塞进浮动圆形菜单按钮（`host.getGlobalActions("menu")`），验证 surface 自由度与可达性约束。
- 用纯 emoji/文字渲染图标，不依赖 `@tabora/ui`，验证图标契约字符串自由度。

### 7.5 装配

`official-plugins/index.ts` import 三个布局 package，加进 `officialPlugins` 数组；`official-plugins/package.json` 加三个 workspace 依赖，删除内联的 `layout-workbench-dashboard.tsx` / `layout-workbench-stream.tsx`。playground 加载入口不变。

### 7.6 App.tsx renderActiveLayout 重写

```tsx
function renderActiveLayout() {
  const layout = catalog.findLayoutContribution(activeLayoutId())
  const LayoutView = layout?.view ? viewOrUndefined(layout.view) : undefined
  if (!LayoutView) return renderSafeLayout()
  const regions = engine.buildRegionSlots(activeLayoutId(), instances())
  const host = engine.buildHostAPI()
  return (
    <LayoutBoundary
      fallback={renderSafeLayout()}
      onError={() => showToast("布局渲染失败，已回退安全布局")}
    >
      {LayoutView({ regions, isMobile: isMobile(), host })}
    </LayoutBoundary>
  )
}
```

shell 不再认识任何具体布局 ID；新增第三方布局零改动 shell。布局各自带 `styles.css`，不再堆在 `official-plugins/styles.css`。

## 8. 交互能力下沉（卡片壳 + host callbacks）

### 8.1 WidgetCardShell（workbench-shell）

```tsx
type WidgetCardShellProps = {
  instance: PluginInstance
  title: string
  icon?: string
  supportedSizes: WidgetSize[]
  currentSize: WidgetSize
  children: JSXElement // 插件 view，已用 PluginViewBoundary 包裹
  callbacks: WidgetHostCallbacks
}

type WidgetHostCallbacks = {
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  onDblClick: (e: MouseEvent) => void
  onContextMenu: (e: MouseEvent) => void
  onResize: (size: WidgetSize) => void
  onRemove: () => void
  onExpand: () => void
  isDragging: boolean
}
```

渲染现有 `App.tsx` 的 `widget-card` 结构（card-header + 尺寸条 + 展开/删除 + card-body），事件绑到 callbacks，不重新设计视觉。

### 8.2 callbacks 实现留在 App.tsx

callbacks 实现体仍在 App.tsx——因为拖拽要操作 `instances` 信号、`dragId`、`persistGridOrder`，展开要 set `expandState`，右键要 set `ctxMenu`，这些是 shell 持有的状态。流程：

```
App.tsx 持有状态/逻辑
  → 实现 InstanceRenderer.renderWidget(instance, callbacks) {
       构造 WidgetHostCallbacks（闭包捕获 App 状态/逻辑）
       return <WidgetCardShell ...><PluginViewBoundary><CardView/></PluginViewBoundary></WidgetCardShell>
     }
  → 注入 orchestrator 的 createLayoutEngine
  → 布局调 RegionSlot.render() 时间接拿到带交互的卡片
```

交互逻辑没消失，是从 `renderMainGrid` 内联 JSX 抽成可注入的 renderWidget。布局和插件碰不到这些闭包。理由：这些状态与 shell 其他状态（modal/fullscreen/workspace）深度耦合，搬进 orchestrator 会扯出一大片，违反"不做无关重构"；orchestrator 只负责编排渲染，状态归 shell。

### 8.3 ContextMenuHost / ExpandHost / 搜索表面

- 右键菜单、展开浮层抽成 shell 组件 `ContextMenuHost` / `ExpandHost`，是**全局单例浮层**（不属于任何卡片/区域），由 shell 在布局外层渲染，不进 RegionSlot。
- `InstanceRenderer.renderSearch` 把现有 `renderSearchRegion` 逻辑搬进去：取 search contribution → 解析 view → 注入 SearchViewProps → 包 PluginViewBoundary。

### 8.4 拖拽边界

保持现状：MVP 不做跨 region 拖拽，单 region 内 splice 重排。`WidgetCardShell` 的 drop 回调带 regionId，逻辑与现在一致。单 region 布局（如 masonry）拖拽天然只在区内。

## 9. 错误回退与安全布局

### 9.1 三层回退

```txt
Level 1 内容级：单 widget view 崩 → PluginViewBoundary 错误卡片（已有，不动）
Level 2 布局级：layout view 崩 / 解析失败 / schema 不合格 → 激活安全布局
Level 3 区域级：某 region 渲染抛错 → 该 region 显示占位，其余正常
```

### 9.2 安全布局（platform.safe-layout）

shell 内建函数 `renderSafeLayout()`，**不是插件**——安全网必须不依赖插件系统本身（对应技术方案 §3.4）：

- 单列流式渲染所有 widget 实例（取 `accepts:["widget"]` 实例，无视原 region）。
- 顶部最小工具条用同一套 `host.getGlobalActions("toolbar")` 渲染设置/⌘K/添加卡片，复用宿主动作，不引入伪 layout contribution。
- 不依赖任何第三方布局代码，第三方布局崩了它一定能起。

### 9.3 LayoutBoundary

基于 Solid `ErrorBoundary`，包住 `LayoutView(...)`，catch 后 fallback 到 `renderSafeLayout()` 并 toast（见 §7.6）。与 PluginViewBoundary 同思路，粒度是整个布局。

### 9.4 schema 不合格 / activeLayoutId 失效

- 不合格布局不进入可切换列表（设置布局选择器不显示）。
- workspace 持久化的 activeLayoutId 指向不合格/不存在布局 → `renderActiveLayout` 走 safe-layout + toast。

## 10. 测试策略

沿用 Vitest + happy-dom（`pnpm test` 走根 `vitest.config.ts` 的 `test.projects`，package 内 `pnpm --filter <pkg> test` 跑各自薄 `vitest.config.ts`），测试文件就近放源文件旁。

### 10.1 契约层 schema（plugin-api，扩展 manifestSchema.test.ts）

- 合格：含 widget region + view → 通过。
- 不合格：无 widget region → 失败；缺 view → 失败。
- search/settings region 缺失 → 通过（验证可选）。

### 10.2 引擎层单元（orchestrator，新 layout-engine.test.ts）

mock InstanceRenderer + hostActions：

- buildRegionSlots：映射正确、按 grid 排序、isEmpty 准确、跨 region 不串。
- RegionSlot.render() 对每实例调一次 renderer，widget/search 走对应分支。
- renderInstance 单实例只渲染该实例。
- buildHostAPI().getGlobalActions 三 surface 返回完整强制集，与布局无关。

### 10.3 卡片壳组件（workbench-shell，新 WidgetCardShell.test.tsx + LayoutBoundary.test.tsx）

- 尺寸条/删除/展开/双击/右键触发对应 callback，正确参数。
- 双击交互元素不触发 expand。
- LayoutBoundary：子组件 throw → 渲染 fallback、调 onError。

### 10.4 集成（playground，扩展 workbenchDashboard.e2e.test.tsx）

- 默认 dashboard 首屏：rail/topbar/mainGrid 都在。
- 布局切换 dashboard→stream→dashboard：实例数据保留。
- safe-layout 回退：activeLayoutId 指向不存在布局 → safe-layout，卡片在、设置可达。

### 10.5 第三方验证（layout-diy-masonry 包内 index.test.tsx，最关键）

- DIY 布局被 catalog 发现、schema 通过、出现在可切换列表。
- 激活 → masonry 渲染、widget 经 renderInstance 出现在瀑布列。
- 强制入口可达：`getGlobalActions("menu")` 含 settings/command，run 能触发。
- 卡片交互：DIY 布局卡片同样能 resize/remove/expand（证明交互来自协议注入）。
- DIY view 故意 throw → LayoutBoundary 回退 safe-layout。

### 10.6 依赖隔离静态验证

验收检查（非运行时）：三个布局 package.json 依赖面逐字相同且不含 orchestrator/shell/ui；`pnpm build` 编过即证明布局仅靠 plugin-api 契约可构建。靠 `pnpm build` + code review 把关。

### 10.7 交付验证（按 AGENTS.md）

跨包 + 新建 package + shell 改动 → `pnpm test`、`pnpm check`、`pnpm build`，外加启动 playground 手动验证三布局切换 + DIY 布局拖拽/展开/设置可达。

## 11. 文档同步

实现完成后需同步：

- 技术方案 V2：更新 §3（布局协议落地 LayoutViewProps/RegionSlot）、§4.2（LayoutHostAPI 落地）、§16/§17（包结构与实施进度）。
- `docs/README.md`：登记本 spec 入口。
- 路线图：本 spec 对应阶段标记，Phase O 拆包债务已登记。
