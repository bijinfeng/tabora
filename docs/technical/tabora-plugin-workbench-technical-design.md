# Tabora 插件化个人工作台技术方案

版本：V1.0

日期：2026-05-27

状态：基于当前 MVP 实现和产品文档整理

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 文档地图：`docs/README.md`

## 1. 技术目标

Tabora 的技术目标是构建一个插件优先的新标签页工作台平台。平台本身不实现具体业务功能，只提供插件运行所需的通用机制：

- 插件 manifest 和 contribution 协议。
- 插件发现、激活和 registry。
- 插件运行时上下文。
- 宿主 UI 容器和视图渲染边界。
- 工作区、插件实例和插件数据持久化。
- 主题 token 和背景渲染能力。
- 权限桥和安全回退。
- 面向 playground、浏览器扩展和未来 shell 的可复用核心包。

## 2. 设计原则

### 2.1 插件优先

所有具体业务能力默认放进插件，包括搜索、搜索源、背景、主题、布局、widget 和设置面板。平台只保留通用机制。

### 2.2 平台和业务隔离

平台包不能硬编码 Google URL、便签 UI、待办逻辑、壁纸分类等具体业务能力。官方插件也必须通过和未来第三方插件相同的 manifest、contribution、runtime context、registry、permissions 和 plugin storage 流程接入。

### 2.3 物理包边界清晰

核心能力从 MVP 开始拆成 workspace packages，避免平台、插件、存储和主题混在应用壳里。

### 2.4 故障局部化

结构级插件失败要有平台级 fallback；内容级插件失败只影响对应实例。任何单个 widget、modal 或 fullscreen 插件视图失败，都不能导致整页白屏。

### 2.5 权限前置

MVP 面向官方和本地可信插件，但权限模型必须提前建立。未来接入第三方插件时，不能重写 runtime API。

## 3. 技术栈

```txt
Vite+ / vp
Solid + TypeScript
pnpm workspace
Tailwind CSS v4 + CSS Variables
Vitest via vp test
Oxlint / Oxfmt / tsgolint via vp check
Vite Task via vp run
tsdown via vp pack
Dexie + IndexedDB
Zod
Kobalte
lucide-solid
WXT（未来浏览器扩展 shell）
Playwright（未来 E2E 和视觉回归）
```

命令约定：

```bash
pnpm check
pnpm test
pnpm build
pnpm --filter @tabora/playground build
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

## 4. 仓库结构

当前核心结构：

```txt
apps/
  playground/
    src/
      App.tsx
      PluginViewBoundary.tsx
      bootstrap.tsx
      workbenchGrid.ts
      app.css

packages/
  plugin-api/
    src/
      manifest.ts
      manifestSchema.ts
      workspace.ts
      index.ts

  platform-kernel/
    src/
      eventBus.ts
      extensionRegistry.ts
      pluginKernel.ts
      runtimeContext.ts
      index.ts

  storage/
    src/
      database.ts
      workspaceRepository.ts
      instanceRepository.ts
      pluginDataRepository.ts
      index.ts

  theme/
    src/
      applyThemeTokens.ts
      index.ts

  official-plugins/
    src/
      index.ts
      layout-top-search-grid.tsx
      search-command-bar.tsx
      search-providers-basic.ts
      background-basic.ts
      theme-default-pack.ts
      widgets-productivity.tsx
      widget-todo.tsx
      widget-weather.tsx
      plugin-manager.tsx
      plugin-manager-entry.ts

tooling/
  tsconfig/
```

## 5. 总体架构

```txt
┌────────────────────────────────────────────┐
│ apps/playground                            │
│ - 应用宿主 shell                           │
│ - 工作台状态编排                           │
│ - 插件视图渲染边界                         │
│ - modal / fullscreen / external open 宿主  │
└────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│ packages/platform-kernel                   │
│ - plugin kernel                            │
│ - event bus                                │
│ - extension registry                       │
│ - runtime context                          │
│ - permission bridge                        │
└────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌─────────────────────┐   ┌─────────────────────┐
│ packages/plugin-api │   │ packages/storage     │
│ - manifest types    │   │ - Dexie database     │
│ - workspace types   │   │ - workspace repo     │
│ - schema validation │   │ - instance repo      │
└─────────────────────┘   │ - plugin data repo   │
                          └─────────────────────┘
          │
          ▼
┌────────────────────────────────────────────┐
│ packages/official-plugins                  │
│ - 官方 layout/search/theme/background/widget│
│ - 通过 manifest/contribution 注册能力       │
└────────────────────────────────────────────┘
```

## 6. 核心模块设计

### 6.1 `@tabora/plugin-api`

职责：

- 定义插件 manifest 类型。
- 定义 contribution 类型。
- 定义 workspace、region、plugin instance、grid placement、plugin record 等数据模型。
- 使用 Zod 校验 manifest。

关键文件：

- `packages/plugin-api/src/manifest.ts`
- `packages/plugin-api/src/manifestSchema.ts`
- `packages/plugin-api/src/workspace.ts`

设计要点：

- 插件不使用单一 `type` 分类，而是通过 `contributes` 声明能力。
- 一个插件可以贡献多个扩展点。
- Widget 必须声明 `supportedSizes`、`defaultSize` 和视图 ID。
- Manifest 只声明能力，不执行逻辑。

### 6.2 `@tabora/platform-kernel`

职责：

- 管理插件发现和激活。
- 提供 `ExtensionRegistry` 保存插件注册的 view。
- 提供 `EventBus` 作为宿主和插件之间的事件通道。
- 创建 `PluginRuntimeContext`。
- 提供最小权限桥。

关键文件：

- `packages/platform-kernel/src/pluginKernel.ts`
- `packages/platform-kernel/src/runtimeContext.ts`
- `packages/platform-kernel/src/extensionRegistry.ts`
- `packages/platform-kernel/src/eventBus.ts`

激活流程：

```txt
discover(plugins)
  -> 保存插件列表

activateEnabledPlugins()
  -> 遍历 enabled plugin
  -> createPluginRuntimeContext()
  -> plugin.activate(context)
  -> 插件向 registry 注册 view
```

### 6.3 `apps/playground`

职责：

- 作为 MVP 第一运行壳。
- 启动插件内核。
- 加载 workspace 和 plugin instances。
- 渲染默认工作台。
- 提供 modal、fullscreen、settings-host、external-open 等宿主能力。
- 将插件视图包在错误边界中。
- 将用户操作持久化到 storage。

关键文件：

- `apps/playground/src/App.tsx`
- `apps/playground/src/PluginViewBoundary.tsx`
- `apps/playground/src/workbenchGrid.ts`
- `apps/playground/src/bootstrap.tsx`

设计要点：

- playground 是第一 shell，不是最终扩展形态。
- 核心 package 不依赖 playground。
- 后续 WXT extension shell 应复用 kernel、api、storage、theme 和 official plugins。

### 6.4 `@tabora/storage`

职责：

- 封装 IndexedDB。
- 提供 workspace、plugin instance、plugin data repository。
- 保持平台装配状态和插件业务数据分离。

关键文件：

- `packages/storage/src/database.ts`
- `packages/storage/src/workspaceRepository.ts`
- `packages/storage/src/instanceRepository.ts`
- `packages/storage/src/pluginDataRepository.ts`

表设计：

```txt
plugins
workspaces
pluginInstances
pluginData
```

未来建议扩展：

```txt
pluginConfigs
permissionGrants
eventLogs
```

### 6.5 `@tabora/theme`

职责：

- 将主题 token 应用为 CSS custom properties。
- 让主题插件输出的 token 成为平台和官方插件共享的视觉契约。

关键文件：

- `packages/theme/src/applyThemeTokens.ts`

### 6.6 `@tabora/official-plugins`

职责：

- 提供默认产品体验。
- 使用同一套插件协议注册官方能力。
- 证明平台不需要硬编码业务功能也能形成完整工作台。

关键官方插件：

- `official.layout.top-search-grid`
- `official.search.command-bar`
- `official.search-providers.basic`
- `official.background.basic`
- `official.theme.default-pack`
- `official.widgets.productivity`
- `official.plugin-manager`

## 7. 插件协议设计

### 7.1 Manifest

插件 manifest 描述插件身份、运行要求、权限和贡献能力。

```ts
type PluginManifest = {
  id: string
  name: string
  version: string
  entry: string
  engine: {
    platform: string
  }
  permissions?: PluginPermission[]
  contributes: {
    layouts?: LayoutContribution[]
    widgets?: WidgetContribution[]
    searches?: SearchContribution[]
    searchProviders?: SearchProviderContribution[]
    backgroundProviders?: BackgroundProviderContribution[]
    backgroundRenderers?: BackgroundRendererContribution[]
    themes?: ThemeContribution[]
    settingsPanels?: SettingsPanelContribution[]
  }
}
```

### 7.2 扩展点

MVP 支持扩展点：

| 扩展点                | 说明                           |
| --------------------- | ------------------------------ |
| `layout`              | 定义页面结构、区域和响应式行为 |
| `widget`              | 定义工作台内容卡片             |
| `search`              | 定义搜索 UI 和搜索编排         |
| `search-provider`     | 定义搜索目标                   |
| `background-provider` | 定义背景内容来源               |
| `background-renderer` | 定义背景渲染方式               |
| `theme`               | 定义主题 token                 |
| `settings-panel`      | 定义设置面板                   |

### 7.3 View Registry

插件在 `activate(context)` 中注册视图：

```ts
context.registry.views.register("official.widgets.notes.card", NotesCard)
```

宿主通过 view ID 渲染插件视图：

```ts
const View = kernel.registry.views.get(viewId)
return View(props)
```

规则：

- 插件视图 ID 来自 manifest contribution。
- 插件不能直接访问宿主内部 store。
- 插件不能直接创建全局 modal 或 fullscreen。
- 宿主负责容器和边界，插件负责内容。

## 8. Runtime Context 设计

`PluginRuntimeContext` 是插件访问平台能力的唯一入口。

当前核心能力：

```ts
type PluginRuntimeContext = {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  ui: PluginUiBridge
  permissions: PermissionBridge
  logger: PluginLogger
  getConfig<T = unknown>(scope: RuntimeConfigScope): T | undefined
  setConfig<T = unknown>(scope: RuntimeConfigScope, value: T): Promise<void>
}
```

### 8.1 UI Bridge

插件通过 `context.ui` 请求宿主 UI 能力：

- `openModal(viewId, props)`
- `closeModal()`
- `openFullscreen(viewId, props)`
- `closeFullscreen()`

宿主通过 event bus 接收：

- `ui.modal.open`
- `ui.modal.close`
- `ui.fullscreen.open`
- `ui.fullscreen.close`

### 8.2 Permission Bridge

当前实现最小 `external-open`：

```ts
type PermissionBridge = {
  canOpenExternal(url: string): boolean
  openExternal(url: string): boolean
}
```

行为：

- `canOpenExternal(url)` 解析 URL hostname。
- 只有 manifest/granted permissions 中声明了匹配 host 的 `external-open` 才返回 true。
- `hosts: ["*"]` 允许官方可信插件通配。
- `openExternal(url)` 只在授权通过时派发 `host.external.open`。
- 宿主收到事件后执行 `window.open`。

## 9. 数据模型

### 9.1 Workspace

```ts
type Workspace = {
  id: string
  name: string
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundProviderId?: string
  activeBackgroundRendererId?: string
  regions: Record<string, RegionState>
  createdAt: string
  updatedAt: string
}
```

职责：

- 保存当前工作区装配状态。
- 保存当前布局、主题、背景。
- 保存各区域实例引用。

### 9.2 PluginInstance

```ts
type PluginInstance = {
  id: string
  pluginId: string
  contributionId: string
  extensionPoint: ExtensionPoint
  regionId: string
  enabled: boolean
  size?: WidgetSize
  grid?: GridPlacement
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
```

职责：

- 表示页面上的一个具体插件实例。
- 保存语义尺寸和网格位置。
- 保存实例级配置。
- 不保存插件业务数据。

### 9.3 PluginData

```ts
type PluginDataRow = {
  id: string
  pluginId: string
  instanceId?: string
  key: string
  value: unknown
  updatedAt: string
}
```

职责：

- 存插件业务数据。
- 按 pluginId 和可选 instanceId 隔离。
- 与 workspace 和 instance 装配状态分离。

## 10. 持久化方案

MVP 使用 Dexie 封装 IndexedDB。

数据库：

```ts
class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
}
```

Repository：

- `WorkspaceRepository`
  - `get(id)`
  - `save(workspace)`
- `InstanceRepository`
  - 保存、读取、删除插件实例。
- `PluginDataRepository`
  - 按插件和 key 保存业务数据。

持久化规则：

- workspace 保存装配状态。
- pluginInstances 保存实例状态和位置。
- pluginData 保存插件业务数据。
- 主题和背景选择记录在 workspace 上。
- grid 顺序记录在 instance 的 `grid` 字段上。

## 11. 宿主渲染方案

### 11.1 默认工作台装配

playground 启动时：

1. 创建 plugin kernel。
2. discover 官方插件。
3. activate enabled plugins。
4. 加载默认 workspace。
5. 加载主网格实例。
6. 应用主题 token。
7. 应用背景。
8. 通过 registry 渲染 search 和 widget views。

主网格溢出规则：

- grid 容器按当前布局的列数和语义尺寸映射自动排列。
- 当实例数量超过当前视口可见范围时，页面使用纵向滚动。
- 不使用横向滚动作为默认工作台溢出方案。
- 不为了容纳更多实例动态压缩卡片到不可读尺寸。
- 新实例追加到当前 region 的末尾，并分配下一个可用 grid order。
- 拖拽排序和尺寸调整更新 `PluginInstance.grid`，刷新后恢复。
- 移动端可把语义尺寸折叠为单列展示，但保留实例的语义 `size` 状态。

### 11.2 Widget 渲染

Widget 渲染流程：

```txt
PluginInstance
  -> find WidgetContribution
  -> get card view id
  -> registry.views.get(viewId)
  -> PluginViewBoundary
  -> View(props)
```

### 11.3 Modal / Fullscreen 渲染

插件通过 `context.ui` 或事件请求打开：

```txt
plugin
  -> context.ui.openModal(viewId, props)
  -> event bus: ui.modal.open
  -> App state: modalViewId/modalProps
  -> host modal container
  -> PluginViewBoundary
  -> View(props)
```

Fullscreen 同理。

### 11.4 Settings Host 渲染

MVP 需要提供轻量设置中心，用于验证 `settings-panel` 扩展点和统一插件设置入口。

Settings 渲染流程：

```txt
settings button
  -> host opens settings container
  -> read enabled settingsPanel contributions
  -> render settings navigation
  -> selected panel view id
  -> registry.views.get(viewId)
  -> PluginViewBoundary
  -> View(props)
```

宿主职责：

- 打开、关闭 settings host。
- 管理当前选中的 settings panel。
- 提供统一容器、导航、焦点和滚动区域。
- 将每个 settings panel 包在 `PluginViewBoundary` 中。
- 在单个 panel 失败时显示局部错误，不关闭整个设置中心。

插件职责：

- 通过 manifest 声明 `settingsPanels`。
- 在 activate 阶段注册 settings view。
- 只渲染面板内容，不直接创建全局设置容器。

MVP 必备面板：

- `official.settings.plugins`：插件列表、贡献能力、权限摘要，MVP 可只读。
- `official.settings.workspace.appearance`：主题和背景切换。
- `official.settings.workspace.search`：默认搜索源和搜索源启用状态。

## 12. 错误隔离方案

### 12.1 内容级错误

Widget、modal、fullscreen 插件视图都通过 `PluginViewBoundary` 包裹。

行为：

- 插件视图正常时渲染原内容。
- 插件视图抛出同步错误时，渲染局部失败回退。
- 回退包含 title、instanceId 和错误消息。
- 其他插件实例不受影响。

### 12.2 结构级错误

后续需要补齐更强 fallback：

- theme 失败：应用最小安全 token。
- background 失败：移除背景层。
- layout 失败：回退到官方默认布局。
- search 失败：显示搜索不可用占位。

MVP 当前已优先闭合内容级插件视图隔离。

## 13. 权限与安全方案

### 13.1 权限类型

```ts
type PluginPermission =
  | { type: "storage"; scope: "plugin" }
  | { type: "workspace"; access: "read" | "write" }
  | { type: "network"; hosts: string[] }
  | { type: "clipboard"; access: "read" | "write" }
  | { type: "local-file"; access: "read" | "write" }
  | { type: "external-open"; hosts: string[] }
```

### 13.2 MVP 已实现

- `external-open` host 校验。
- 通过 `context.permissions.openExternal(url)` 请求打开外部 URL。
- 宿主只执行权限桥批准后的 `host.external.open`。

### 13.3 后续扩展

需要逐步补齐：

- `network` 请求代理。
- `clipboard` 使用时授权。
- `local-file` 用户授权流程。
- `workspace write` 使用时授权。
- `permissionGrants` 持久化。
- 权限提示 UI。
- 权限审计日志。

## 14. 官方插件方案

### 14.1 Layout

`official.layout.top-search-grid`

职责：

- 贡献默认 layout。
- 定义 `topbar` 和 `mainGrid` 区域。
- 声明区域可接受的扩展点。
- 提供默认区域实例引用。

### 14.2 Search

`official.search.command-bar`

职责：

- 贡献搜索 UI。
- 编排搜索输入、快捷标签和默认搜索源。
- 通过权限桥请求外部打开。

### 14.3 Search Providers

`official.search-providers.basic`

职责：

- 贡献基础搜索源。
- 提供 URL template 和 shortcut。

### 14.4 Theme

`official.theme.default-pack`

职责：

- 贡献主题 token。
- 支持明亮和暗色等主题。

### 14.5 Background

`official.background.basic`

职责：

- 贡献背景来源和基础渲染能力。
- 支持纯色 / 渐变等 MVP 背景。

### 14.6 Productivity Widgets

`official.widgets.productivity`

职责：

- 贡献快捷入口、便签、待办、天气等 widget。
- 声明每个 widget 支持的尺寸。
- 注册 card / modal 等视图。

### 14.7 Plugin Manager

`official.plugin-manager`

职责：

- 展示插件 manifest 和 contribution 信息。
- 在 MVP 设置中心中提供插件面板，展示启用状态、贡献能力和权限摘要。
- 为后续启用 / 禁用、权限详情、版本管理和调试信息预留入口。

### 14.8 Workspace Settings

`official.settings.workspace`

职责：

- 贡献 MVP 轻量设置中心的基础面板。
- 聚合插件、外观和搜索三个全局设置入口。
- 让主题、背景、默认搜索源等全局配置通过 settings panel 统一进入。
- 不承载插件市场、导入导出、多 workspace、复杂权限审计等后续能力。

## 15. 测试方案

### 15.1 单元测试

已覆盖：

- manifest schema 校验。
- event bus。
- extension registry。
- plugin kernel 激活。
- workspace repository。
- instance repository。
- theme token 应用。
- grid order 分配。
- plugin view boundary。
- runtime permission bridge。

### 15.2 集成测试

当前通过 `pnpm test` 在 workspace 范围执行。

重点覆盖：

- 插件注册和视图可访问。
- IndexedDB repository 在 fake IndexedDB 下可读写。
- 权限桥 allow / deny 行为。

### 15.3 静态检查

`pnpm check` 覆盖：

- 格式化。
- lint。
- type check。

### 15.4 构建验证

`pnpm build` 覆盖：

- package build。
- playground production build。

### 15.5 E2E 和视觉回归

建议后续补齐：

- 默认工作台首屏渲染。
- 添加 widget。
- 调整尺寸。
- 拖拽排序。
- 添加多张 widget 后验证主网格纵向滚动、无横向滚动、卡片仍可读。
- 切换主题和背景。
- 打开 modal / fullscreen。
- 搜索外部打开权限路径。
- 插件错误回退状态。

## 16. 发布与运行方案

### 16.1 MVP 运行形态

MVP 首先以 `apps/playground` 运行。

原因：

- 降低浏览器扩展壳带来的变量。
- 先验证插件内核和工作台装配。
- 核心 package 保持与运行壳无关。

### 16.2 浏览器扩展形态

后续以 WXT 构建扩展 shell。

要求：

- 复用 `plugin-api`、`platform-kernel`、`storage`、`theme`、`official-plugins`。
- extension shell 只处理浏览器扩展入口、权限声明和宿主适配。
- 不把业务能力写入 extension shell。

## 17. 性能与可靠性

### 17.1 性能关注点

- 插件激活耗时。
- 首屏渲染耗时。
- IndexedDB 初始化和读取耗时。
- widget 数量增加后的渲染开销。
- 长工作台滚动流畅度。
- 背景渲染复杂度。

### 17.2 优化方向

- 插件 entry 懒加载。
- 非首屏 widget 延迟渲染。
- 大型插件数据按需读取。
- 背景 renderer 分层。
- registry 和 manifest 索引缓存。

### 17.3 可靠性要求

- 插件失败不能导致整页不可用。
- IndexedDB 失败时要提供安全默认 workspace。
- manifest 校验失败的插件不能激活。
- 权限拒绝不能导致宿主崩溃。

## 18. 可观测性建议

建议增加事件和日志：

- 插件发现开始 / 成功 / 失败。
- 插件激活耗时。
- 插件视图渲染失败。
- 权限请求 allow / deny。
- workspace restore 成功 / 失败。
- IndexedDB repository 错误。
- 外部 URL 打开请求。

未来可落表：

```txt
eventLogs
permissionGrants
pluginCrashReports
```

## 19. 演进计划

### 阶段 1：Foundation

已完成：

- Vite+ pnpm monorepo。
- Solid playground。
- plugin API。
- plugin kernel。
- workspace state。
- IndexedDB persistence。
- theme tokens。
- official plugin pack。
- 默认插件装配工作台。

### 阶段 2：Safety Bridge

已完成：

- 插件视图错误边界。
- runtime permission bridge。
- 搜索外部打开走权限桥。
- 第二阶段规格记录。

### 阶段 3：Workspace 和权限完善

建议下一步：

- 轻量 settings host。
- workspace settings 插件。
- permission grants 持久化。
- 插件管理面板展示权限。
- 插件启用 / 禁用完整流程。
- workspace import / export。
- 多 workspace 数据模型。

### 阶段 4：Extension Shell

建议：

- 引入 WXT。
- 新建 `apps/extension`。
- 复用核心 packages。
- 打通浏览器新标签页入口。

### 阶段 5：插件生态

建议：

- 本地插件安装。
- plugin SDK。
- 插件模板。
- 远程插件市场。
- 沙箱运行时。

## 20. 风险与技术债

| 风险                         | 描述                                                | 应对                                                       |
| ---------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| playground shell 逻辑变重    | App.tsx 可能承担过多编排职责                        | 后续拆出 workspace orchestration hooks / services          |
| runtime config 仍是内存 Map  | `getConfig` / `setConfig` 还未接入持久化 repository | 接入 plugin config repository                              |
| 权限模型只实现 external-open | 其他权限仍是类型和设计                              | 分阶段实现 network、clipboard、local-file、workspace write |
| 第三方插件不可信执行未解决   | MVP 不包含沙箱                                      | V2 引入 sandbox runtime                                    |
| E2E 未完善                   | 当前主要依赖单元测试和构建验证                      | 引入 Playwright 用例                                       |
| 插件 view 类型较宽           | 当前使用通用 Solid view 函数                        | 后续按 extension point 定义 props contract                 |

## 21. 验收清单

技术验收：

- `pnpm check` 通过。
- `pnpm test` 通过。
- `pnpm build` 通过。
- playground dev server 返回 HTTP 200。

功能验收：

- 默认工作台可渲染。
- 官方插件通过 manifest 注册能力。
- widget 可多实例添加。
- widget 尺寸可调整。
- grid 顺序可持久化。
- widget 数量超过首屏时，主网格纵向滚动且不出现横向滚动。
- theme / background 可切换。
- settings host 可打开并渲染插件、外观、搜索面板。
- modal / fullscreen 可打开。
- 插件视图错误只影响当前实例。
- 搜索外部打开通过权限桥。
- IndexedDB 状态可恢复。
