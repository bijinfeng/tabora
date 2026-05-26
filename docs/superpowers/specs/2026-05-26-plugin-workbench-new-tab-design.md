# Tabora 插件化个人工作台新标签页设计

日期：2026-05-26

状态：已确认的设计基线

## 1. 产品定位

Tabora 是一个插件优先的个人工作台新标签页产品。

它不是一个固定写死搜索、壁纸、卡片的新标签页。平台本身只提供插件运行内核。用户能看到的所有具体能力，都应该来自插件，包括搜索、搜索源、背景来源、背景渲染、主题、布局、卡片、设置面板等。

核心定位：

- 偏个人工作台，不是纯极简起始页。
- 默认体验由官方内置插件组合出来。
- 默认布局是顶部搜索区加下方网格工作台，由官方布局插件提供。
- 卡片支持多个语义尺寸，用户可以按插件实例选择当前尺寸。
- 插件可以定义卡片视图、弹窗视图、全屏视图、设置视图、搜索源、背景来源、背景渲染器、主题和布局。

最高设计原则：

> 平台不提供任何具体业务功能。平台只提供插件运行时、扩展点协议、宿主容器、存储、权限、事件和故障恢复机制。

当某个能力应该放在平台还是插件里不明确时，默认优先放进插件。平台只保留通用运行机制。

## 2. 扩展点

MVP 平台支持这些扩展点：

| 扩展点                | 作用                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `layout`              | 定义页面结构、区域、响应式行为和卡片尺寸映射。                       |
| `widget`              | 定义工作台内容块，例如便签、待办、天气、RSS、快捷入口。              |
| `search`              | 定义搜索 UI 和搜索编排逻辑。                                         |
| `search-provider`     | 定义具体搜索目标，例如 Google、Bing、百度、GitHub 或自定义搜索源。   |
| `background-provider` | 定义背景内容来源，例如本地图片、图片集合、远程图片、生成背景。       |
| `background-renderer` | 定义背景素材如何渲染，例如图片、渐变、视频、Canvas、WebGL。          |
| `theme`               | 定义设计 token，例如颜色、字体、圆角、阴影、间距、透明度和表面风格。 |
| `settings-panel`      | 定义由插件贡献的设置面板。                                           |

扩展点按影响范围分层：

- 结构级扩展点：`layout`、`search`、`theme`
- 内容级扩展点：`widget`、`search-provider`、`background-provider`、`background-renderer`、`settings-panel`

结构级扩展点失败时需要更强的恢复策略，因为它们会影响整个页面。内容级扩展点失败时，应该只影响对应插件实例或对应设置面板。

## 3. 插件生命周期和加载顺序

平台启动就是插件装配过程。

生命周期：

1. `discover`：扫描内置插件和已安装插件，读取 manifest，建立插件索引。
2. `resolve`：解析已启用插件、依赖关系、扩展点、当前工作区和当前布局。
3. `activate`：调用插件入口，让插件注册自己的运行时实现。
4. `mount-shell`：挂载很薄的平台宿主容器。
5. `mount-structure`：挂载结构级插件。
6. `mount-content`：挂载卡片实例、设置面板和其他内容插件。
7. `hydrate-and-run`：恢复工作区状态、插件实例状态、插件配置、主题、背景和数据缓存。

推荐加载优先级：

```txt
theme -> background-provider -> background-renderer -> layout -> search -> widgets -> settings
```

插件实例生命周期：

```txt
install -> enable -> create-instance -> mount -> update -> unmount -> disable -> remove
```

插件本体和插件实例必须区分：

- 插件本体：已安装的能力包，例如 `official.widgets.productivity`。
- 插件实例：某个具体放在页面上的对象，例如 `mainGrid` 区域里的某一张便签卡。

一个插件可以有多个实例。每个实例都可以有自己的尺寸、区域、网格位置和配置。

故障恢复：

- `theme` 失败：应用平台最小安全 token。
- `background` 失败：移除背景层，但工作台继续可用。
- `layout` 失败：回退到官方默认布局插件。
- `search` 失败：在布局区域中显示搜索不可用占位。
- `widget` 失败：只把该实例替换成错误卡片。

## 4. Manifest 和 Contributions

插件不通过单一 `type` 分类，而是通过 `contributes` 声明自己给平台贡献哪些能力。

这样一个插件可以同时提供多种能力。例如一个 Bing 插件既可以贡献搜索源，也可以贡献每日图片背景来源。

Manifest 模型：

```ts
type PluginManifest = {
  id: string
  name: string
  version: string
  publisher?: string
  description?: string
  icon?: string
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

Manifest 只声明能力，不直接执行业务逻辑。插件入口激活之后，才注册实际运行时实现。

Widget contribution：

```ts
type WidgetContribution = {
  id: string
  title: string
  icon?: string
  supportedSizes: WidgetSize[]
  defaultSize: WidgetSize
  allowMultipleInstances: boolean
  defaultConfig?: Record<string, unknown>
  views: {
    card: string
    modal?: string
    fullscreen?: string
    settings?: string
  }
}

type WidgetSize = "S" | "M" | "L" | "XL"
```

默认语义尺寸映射：

```ts
type WidgetSizePreset = {
  size: WidgetSize
  colSpan: number
  rowSpan: number
  minWidth?: number
  minHeight?: number
}
```

默认映射：

- `S = 1 x 1`
- `M = 2 x 1`
- `L = 2 x 2`
- `XL = 4 x 2`

布局插件可以提供自己的网格映射，但必须兼容这四个语义尺寸。

Layout contribution：

```ts
type LayoutContribution = {
  id: string
  title: string
  preview?: string
  regions: LayoutRegion[]
  defaultRegions: Record<string, PluginInstanceRef[]>
  supportsResponsive: boolean
}

type LayoutRegion = {
  id: string
  title: string
  accepts: ExtensionPoint[]
  required?: boolean
  maxInstances?: number
}
```

Search 和 Search Provider contribution：

```ts
type SearchContribution = {
  id: string
  title: string
  defaultProviderIds?: string[]
  supportsSuggestions?: boolean
  view: string
}

type SearchProviderContribution = {
  id: string
  title: string
  icon?: string
  urlTemplate: string
  suggestionEndpoint?: string
  shortcut?: string
}
```

Background Provider 和 Background Renderer contribution：

```ts
type BackgroundProviderContribution = {
  id: string
  title: string
  sourceType: "local" | "remote" | "generated" | "collection"
}

type BackgroundRendererContribution = {
  id: string
  title: string
  accepts: Array<"image" | "video" | "gradient" | "canvas" | "webgl">
  view: string
}
```

Theme contribution：

```ts
type ThemeContribution = {
  id: string
  title: string
  tokens: ThemeTokenSet
}
```

## 5. Runtime API 和通信模型

每个插件入口导出一个 `activate` 函数：

```ts
type PluginEntry = {
  activate(context: PluginRuntimeContext): void | Promise<void>
}
```

`PluginRuntimeContext` 是插件使用平台能力的唯一受支持入口：

```ts
type PluginRuntimeContext = {
  pluginId: string

  storage: PluginStorage
  events: EventBus
  registry: ExtensionRegistry
  ui: PluginUiBridge
  permissions: PermissionBridge
  logger: PluginLogger

  getConfig<T = unknown>(scope: ConfigScope): T
  setConfig<T = unknown>(scope: ConfigScope, value: T): Promise<void>
}
```

插件激活后注册运行时实现：

```ts
context.registry.registerWidget("notes.quick-note", {
  renderCard,
  renderModal,
  renderFullscreen,
  renderSettings,
})
```

插件之间通过事件和扩展点服务通信，不能直接 import 彼此内部实现，也不能直接调用其他插件实例。

规则：

- 插件可以依赖扩展点协议。
- 插件不应该依赖另一个插件的内部实现。
- 插件不能直接访问平台内部 store。
- 插件不能直接创建全局弹窗或全屏视图。
- 插件必须通过 `context.ui` 请求宿主 UI 能力。

配置作用域：

```ts
type ConfigScope =
  | { type: "plugin" }
  | { type: "instance"; instanceId: string }
  | { type: "workspace" }
```

## 6. 权限和安全边界

MVP 面向官方内置插件和本地可信插件。权限模型仍然必须在 V1 建好，这样平台未来走向第三方插件时不用重写运行时。

权限分类：

| 权限            | 作用                           |
| --------------- | ------------------------------ |
| `storage`       | 读写插件私有存储。             |
| `workspace`     | 读写工作区状态。               |
| `network`       | 访问外部网络。                 |
| `clipboard`     | 读写剪贴板。                   |
| `local-file`    | 通过用户授权流程读写本地文件。 |
| `external-open` | 打开外部 URL。                 |

权限模型：

```ts
type PluginPermission =
  | { type: "storage"; scope: "plugin" }
  | { type: "workspace"; access: "read" | "write" }
  | { type: "network"; hosts: string[] }
  | { type: "clipboard"; access: "read" | "write" }
  | { type: "local-file"; access: "read" | "write" }
  | { type: "external-open"; hosts: string[] }
```

授权层级：

- 默认允许：插件私有存储、读取自身配置、注册 manifest 已声明的 contribution。
- 安装时确认：network、external-open、workspace read。
- 使用时确认：clipboard read、本地文件读写、workspace write、访问未声明 host。

V1 策略：

> V1 支持官方和本地可信组件型插件。V2 引入用于不可信第三方远程插件的沙箱运行时。

## 7. 核心数据模型

数据围绕插件装配组织，而不是围绕固定页面功能组织。

Plugin record：

```ts
type PluginRecord = {
  id: string
  version: string
  source: "builtin" | "local" | "remote"
  enabled: boolean
  installedAt: string
  updatedAt: string
  manifest: PluginManifest
  grantedPermissions: PluginPermission[]
}
```

Workspace：

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

Region state：

```ts
type RegionState = {
  regionId: string
  accepts: ExtensionPoint[]
  instances: PluginInstanceRef[]
}
```

Plugin instance：

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

Grid placement：

```ts
type GridPlacement = {
  x: number
  y: number
  colSpan: number
  rowSpan: number
  locked?: boolean
}
```

Plugin data：

```ts
type PluginDataRecord = {
  pluginId: string
  instanceId?: string
  key: string
  value: unknown
  updatedAt: string
}
```

规则：

- `PluginRecord` 存插件身份和权限，不存页面位置。
- `PluginInstance` 存实例配置和位置，不存插件业务数据。
- `Workspace` 存装配状态，不存具体业务内容。
- `PluginDataRecord` 按插件和可选实例命名空间存插件业务数据。
- `GridPlacement` 是布局数据；语义尺寸 `size` 是用户可理解的实例状态。

## 8. 官方内置插件包

默认产品体验来自官方插件包，而不是平台硬编码。

推荐官方插件：

1. `official.layout.top-search-grid`
   - 贡献 `layout`。
   - 定义 `topbar`、`mainGrid`、`background` 和 `settings` 区域。
   - 提供响应式规则和默认尺寸映射。

2. `official.search.command-bar`
   - 贡献 `search` 和 `settings-panel`。
   - 渲染搜索 UI，编排已启用搜索源。
   - 不硬编码任何具体搜索引擎。

3. `official.search-providers.basic`
   - 贡献 `search-provider`。
   - 提供 Google、Bing、百度、DuckDuckGo、GitHub。

4. `official.background.providers.basic`
   - 贡献 `background-provider`。
   - 提供本地图片、纯色/渐变、每日图片占位、用户收藏背景来源。

5. `official.background.renderers.basic`
   - 贡献 `background-renderer`。
   - 提供静态图片和渐变渲染器，预留视频渲染支持。

6. `official.theme.default-pack`
   - 贡献 `theme` 和 `settings-panel`。
   - 提供明亮工作台、暗色工作台、毛玻璃、紧凑高对比主题。

7. `official.widgets.productivity`
   - 贡献 `widget` 和 `settings-panel`。
   - 提供快捷入口、便签、待办、天气、日历/倒计时、RSS。

8. `official.plugin-manager`
   - 贡献 `settings-panel`，可选贡献 `widget`。
   - 管理已安装插件、启用状态、权限和版本。

9. `official.settings.workspace`
   - 贡献 `settings-panel`。
   - 组织各插件贡献的设置面板。

官方插件也必须使用和未来第三方插件相同的 manifest、contribution、runtime context、registry、permission、instance config 和 plugin storage 流程。

## 9. 关键用户流程

首次启动：

1. 平台内核启动。
2. 发现官方插件。
3. 加载默认 workspace 模板。
4. 挂载默认主题、背景、布局、搜索和 widget 实例。
5. 用户看到一个完整工作台，但它完全由插件装配出来。

搜索：

1. 搜索插件渲染搜索 UI。
2. 搜索插件读取已启用的搜索源。
3. 用户选择搜索源并提交查询。
4. 搜索源通过已授权的外部 URL 打开结果。

添加卡片：

1. 添加面板列出已启用的 `widget` contribution。
2. 用户选择一个 widget 和一个支持的尺寸。
3. 平台创建 `PluginInstance`。
4. 布局把实例放入可接收的区域。
5. Widget 插件渲染卡片视图。

调整卡片尺寸：

1. 平台读取该 contribution 的 `supportedSizes`。
2. 用户选择支持的尺寸。
3. 平台通过当前布局把语义尺寸映射成网格跨度。
4. 实例更新，插件重新渲染对应卡片视图。

打开弹窗/全屏：

1. 平台检查 contribution 声明的视图。
2. 平台打开标准宿主容器。
3. 插件在宿主内容区渲染弹窗或全屏内容。

切换布局：

1. 用户选择另一个 `layout` contribution。
2. 平台检查区域兼容性。
3. 可迁移实例自动迁移。
4. 不可迁移实例进入未放置列表。

禁用插件：

1. 插件记录进入禁用状态。
2. 已有实例进入禁用状态。
3. 数据和配置保留。
4. 重新启用后恢复实例。

## 10. MVP 范围

MVP 要证明：

- 插件内核可以装配出产品体验。
- 官方插件可以组成默认工作台。
- 用户可以添加、删除、调整尺寸、配置和展开插件实例。
- 状态可以跨会话持久化。

MVP 包含：

- 插件发现、manifest 校验、激活、registry、runtime context。
- 本文列出的扩展点。
- 官方插件包。
- 通过布局插件提供顶部搜索加网格的默认布局。
- Widget 多实例和多尺寸支持。
- 拖拽放置和持久化网格状态。
- 弹窗和全屏宿主。
- 通过 token 切换主题。
- 切换背景来源和背景渲染器。
- 搜索源启用/禁用和默认搜索源。
- IndexedDB 持久化。
- 插件错误边界和安全回退状态。

MVP 不包含：

- 第三方远程插件市场。
- 不可信插件沙箱运行时。
- 在线插件安装和自动升级。
- 云同步和账号系统。
- 团队/共享工作区。
- 插件评论/评分系统。
- 完整插件开发者工具。
- AI 生成插件。
- 复杂 WebGL 背景编辑器。
- 深度移动端应用适配。

MVP 可以预留接口：

- 远程插件来源。
- 沙箱运行时。
- 权限弹窗。
- 多 workspace。
- 导入/导出。
- 插件版本迁移。
- 布局迁移策略。

## 11. Future Roadmap

未来路线图是方向记录，不属于 MVP 范围。

V1.1：

- 工作区导入/导出。
- 多工作区。
- 插件版本迁移机制。
- 更完善的布局迁移规则。
- 插件调试信息面板。
- 更完整的权限提示。

V1.5：

- 本地插件安装。
- 插件开发者 SDK。
- 插件模板脚手架。
- 更多官方插件。
- 主题编辑器。
- 壁纸收藏、轮播和远程来源。

V2：

- 第三方插件市场。
- 远程插件安装和升级。
- 不可信插件沙箱运行时。
- 插件审核、评分和审计流程。
- 云同步和账号系统。
- 多端同步。
- 权限审计工具。
- 插件崩溃上报。

V3：

- 插件生态商业化能力。
- 团队/共享工作区。
- AI 插件生成或配置助手。
- 高级自动化/工作流插件。
- 跨浏览器扩展版本。
- 桌面端/移动端伴随产品。

## 12. 技术架构

工程以 Vite+ 作为工程基础。

锁定技术栈：

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
Playwright
WXT if shipping as a browser extension
```

Vite+ 规则：

- `vp` 是项目主要命令入口。
- `vite-plus` 安装在项目本地。
- 根目录 `vite.config.ts` 负责共享 lint、format、type-check、test、task 和 pack 配置。
- `vp check` 是默认静态检查命令。
- `vp test` 运行 Vitest。
- `vp run` 运行 workspace task，并支持缓存和依赖顺序。
- `vp pack` 构建库包和独立产物。
- 包管理命令优先使用 `vp install`、`vp add`、`vp remove` 以及相关 Vite+ wrapper。

参考：

- Vite+ Getting Started: https://viteplus.dev/guide/
- Vite+ Monorepo: https://viteplus.dev/guide/monorepo
- Vite+ Check: https://viteplus.dev/guide/check
- Vite+ Run: https://viteplus.dev/guide/run
- Vite+ Lint: https://viteplus.dev/guide/lint

Monorepo 结构：

```txt
apps/
  extension/
  playground/

packages/
  platform-kernel/
  plugin-api/
  plugin-sdk/
  storage/
  ui/
  theme/
  official-plugins/
  config/
```

推荐命令约定：

```bash
vp install
vp dev apps/extension
vp check
vp check --fix
vp test
vp test watch
vp build apps/extension
vp run -r build
vp pack
```

Solid 架构：

- 使用 Solid 承载应用壳和插件渲染。
- 优先使用 Solid signals、stores、memos、resources，再考虑外部状态库。
- 插件视图注册为 Solid 组件。
- 平台只通过 view registry ID 渲染插件视图。
- 插件 entry 和非卡片视图按需懒加载。

Tailwind 和主题架构：

- Tailwind 是平台宿主和官方插件的样式书写工具。
- 视觉契约是 CSS variables 和 design tokens，不是 Tailwind class name。
- 主题插件输出 token set。
- 平台把 token 应用到 workspace root。
- Tailwind config 把 utility 名称映射到 token variables。
- 第三方插件可以使用其他样式方案，但相关场景必须尊重平台 token。

持久化：

- 使用 Dexie 封装 IndexedDB。
- 平台装配状态和插件业务数据分开存。
- 建议表：`plugins`、`pluginConfigs`、`workspaces`、`pluginInstances`、`pluginData`、`permissionGrants`、`eventLogs`。

质量：

- 静态检查：`vp check`。
- 单元/集成测试：`vp test`。
- E2E 和视觉回归：Playwright。
- 库包校验：`vp pack`，发布 SDK 包时再补 package export 检查。

浏览器扩展：

- 如果产品以浏览器扩展形式发布，使用 WXT 作为 Vite/Solid 之上的扩展框架。
- 核心平台 package 尽量保持和具体运行壳无关，以便复用于 playground、扩展页面和未来其他 shell。

## 13. 实现计划前的开放决策

这些不阻塞设计基线，但在写实现计划前需要决定：

1. MVP 是优先做浏览器扩展，还是先做独立 Web playground。
2. WXT 是首个 scaffold 就引入，还是等核心工作台 playground 跑通后再引入。
3. 使用哪个 Solid 兼容的拖拽网格实现，还是自研一个小型 grid layer。
4. 官方 widget 包里的天气和 RSS 在 MVP 使用真实网络源，还是先用本地 mock adapter。
5. MVP 阶段插件包边界是物理 package，还是先用逻辑目录，后续再拆成 package。

## 14. 验收标准

当以下条件满足时，认为设计被实现：

- 打开应用后看到一个完整的默认工作台，且它由官方插件装配出来。
- 平台代码不硬编码任何具体业务功能，例如 Google URL、便签 UI、壁纸分类或待办行为。
- 官方功能通过 manifest、contribution、runtime context、registry、permissions 和 plugin storage 实现。
- 用户可以添加同一个 widget 插件的多个实例。
- 用户可以从插件支持尺寸列表中选择每个 widget 实例的尺寸。
- 插件声明支持弹窗或全屏时，用户可以打开对应视图。
- 用户可以通过插件 contribution 切换主题和背景。
- 插件渲染错误只影响失败的插件实例。
- 关闭并重新打开后，工作区、实例、尺寸、位置、插件配置和插件数据完整恢复。
