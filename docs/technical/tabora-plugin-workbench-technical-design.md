# Tabora 插件化个人工作台技术方案

版本：V1.0

日期：2026-05-27

状态：基于当前 MVP 实现和产品文档整理；目标产品方向已收敛为模块仪表盘型个人工作台

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 设计体系：`docs/product/tabora-design-system.md`
- 文档地图：`docs/README.md`

## 0. 本轮评审依据与补漏结论

本轮评审基于最新 PRD、官方插件设计、当前仓库实现和主流插件 / widget / 设计系统实践进行。参考对象不用于照搬视觉，而是用于校准 Tabora 的架构边界和验收标准：

- VS Code Extension API 的 contribution points：能力先由 manifest 声明，再由扩展在运行期注册命令、视图、菜单等入口，适合作为 Tabora `contributes` + registry 的参照。
- Chrome Extensions 的 override pages 和 Manifest V3：新标签页 shell 应保持轻量、快速、标题明确，浏览器权限声明与平台内部插件权限需要分层处理。
- Apple HIG Widgets 与 Windows Widgets：widget 应该是 glanceable、focused、quickly consumable 的信息 / 操作模块，不应把完整应用塞进卡片。
- WCAG 2.2：所有可操作控件需要键盘可达、焦点可见，modal / settings host 要有明确焦点管理。
- MDN Storage quotas and eviction criteria：IndexedDB 适合本地结构化数据，但必须处理配额、清除、迁移和失败回退。
- Carbon / Open UI / Material 设计系统实践：基础组件包应围绕 token、状态、可访问性和稳定 API 建立，而不是只抽 CSS 类名。

补漏结论：

- `@tabora/ui` 已作为 MVP 基础组件包交付，位于 `packages/ui`；当前仓库已存在 `packages/ui`。
- 插件协议需要从“通用 Solid view”收紧为按扩展点定义 props contract，避免后续第三方插件接入时出现隐式约定。
- 插件生命周期需要显式建模：discover、validate、record、activate、register、render、suspend、disable、uninstall。
- IndexedDB 方案需要补齐 schema version、migration、quota、eviction 和安全默认 workspace。
- 权限模型需要拆清楚“Tabora 插件权限”和“浏览器扩展 manifest 权限”，并加强 URL protocol 校验。
- 测试方案需要增加 contract tests、storage migration tests、UI a11y tests 和 extension shell 映射测试。

## 1. 技术目标

Tabora 的技术目标是构建一个插件优先的新标签页个人工作台平台。平台本身不实现具体业务功能，只提供插件运行所需的通用机制：

- 插件 manifest 和 contribution 协议。
- 插件发现、激活和 registry。
- 插件运行时上下文。
- 宿主 UI 容器和视图渲染边界，包括轻 rail、命令搜索区、主网格、modal、fullscreen 和 settings host。
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

### 2.6 贡献协议优先

任何可插拔能力都必须先出现在 manifest contribution 中，再由插件 activation 向 registry 注册实现，最后由宿主按扩展点协议渲染或调用。宿主不能因为“这是官方插件”而绕过 contribution 协议。

这条原则对应 VS Code contribution points 的经验：声明决定平台如何发现能力，运行期注册决定具体实现，二者共同构成插件契约。

### 2.7 宿主容器不变量

宿主负责所有结构级容器：workbench shell、rail、grid、widget card shell、modal、fullscreen、settings host、focus trap、scroll region 和错误边界。插件只能渲染容器内部内容。

这些容器是平台一致性和安全边界的一部分，不进入官方业务插件，也不进入第三方插件自定义范围。

### 2.8 扩展点 Props 显式类型化

每个扩展点都必须定义自己的 view props contract。registry 可以保留通用注册机制，但类型层和测试层必须知道 widget、search、settings、background renderer 等视图分别能拿到什么数据、能请求什么宿主动作。

不允许长期使用无约束 `Record<string, unknown>` 作为插件 view 的事实契约；它只能存在于边界解析层，并应尽快转换为具体 props。

## 3. 技术栈

```txt
Vite+ / vp
Solid + TypeScript
pnpm workspace
Tailwind CSS v4 + CSS Variables
Vitest via `pnpm test`
Vitest Browser Mode + Playwright provider via `pnpm test:e2e`
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

UI 组件策略：

- `@tabora/theme` 只负责 theme token 应用。
- `@tabora/ui` 已交付，位于 `packages/ui`，负责插件内容区基础组件，使用 theme token 和 CSS custom properties。
- 宿主级容器仍由 shell 提供，不进入 `@tabora/ui`。

命令约定：

```bash
pnpm check
pnpm test
pnpm test:e2e
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
      layout-workbench-dashboard.tsx
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

  ui/
    src/
      index.ts
      styles.css
      tokens.ts
      primitives/
      composites/

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
│ packages/ui                                │
│ - 插件内容基础组件                         │
│ - theme token 绑定                         │
└────────────────────────────────────────────┘
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

生命周期目标模型：

```txt
discover
  -> validate manifest
  -> record plugin
  -> activate enabled plugin
  -> register contributions/views
  -> render through host boundary
  -> suspend inactive view
  -> disable plugin
  -> uninstall plugin
```

MVP 可以先实现 discover、validate、record、activate、register、render，但数据模型和日志要预留 `status`、`lastActivatedAt`、`lastError` 和 `disabledReason`。后续实现 disable / uninstall 时，需要保证：

- 禁用插件时不删除插件私有数据。
- 禁用插件时宿主移除对应实例渲染，但保留可恢复的实例记录或给用户确认。
- 卸载插件时区分 manifest 记录、实例记录、权限授权记录和 plugin data 清理策略。
- 结构级插件如 layout、theme、search 被禁用时，宿主必须有安全默认实现。

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

### 6.6 `@tabora/ui`

当前状态：已交付。位于 `packages/ui`，依赖 `solid-js` + `@tabora/theme` + `@kobalte/core`，提供 17 个内容区基础控件（Button / IconButton / Input / Textarea / Select / Checkbox / Switch / SegmentedControl / Tabs / Tooltip / Field / Badge / InlineError / Spinner / EmptyState / ListRow / CardSection）。MVP 范围内官方插件（productivity、todo、search-command-bar、plugin-manager）已迁移到该包。

职责：

- 提供插件内容区基础 UI 组件。
- 统一官方插件和未来第三方插件的控件视觉、状态和可访问性。
- 绑定 `@tabora/theme` 输出的 CSS custom properties。
- 保持无业务、无宿主状态、无插件运行时依赖。

依赖边界：

- 可以依赖 `solid-js` 和 `@tabora/theme`。
- 不能依赖 `@tabora/platform-kernel`、`@tabora/storage`、`@tabora/official-plugins`。
- 不能持有 workspace、plugin instance 或 plugin data。
- 不能直接打开 modal、fullscreen、settings host 或外部 URL。

MVP 组件：

- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Switch`
- `SegmentedControl`
- `Tabs`
- `Tooltip`
- `Field`
- `Badge`
- `InlineError`
- `Spinner`
- `EmptyState`
- `ListRow`
- `CardSection`

明确不进入 `@tabora/ui`：

- `WidgetCard`
- `Modal`
- `FullscreenHost`
- `SettingsHost`
- `WorkbenchRail`
- `WorkbenchGrid`

这些宿主级结构必须由 shell / host 统一提供，插件只渲染内容区。

组件 API 约束：

- 基础组件 props 应优先使用稳定语义：`variant`、`size`、`disabled`、`loading`、`aria-label`、`data-state`。
- 图标使用 slot 或传入组件，不把某个图标库强绑定进核心 API；官方实现可以默认使用 `lucide-solid`。
- 组件必须使用 CSS custom properties，不直接硬编码大面积颜色。
- `styles.css` 作为明确样式入口，由 shell 或插件包统一引入一次。
- 所有可点击组件必须有 hover、pressed、focus-visible、disabled 状态。
- 表单组件必须支持 label / description / error 组合，错误状态不能只靠颜色表达。
- 组件尺寸要稳定，loading、图标切换、长文本不能造成按钮或列表行跳动。
- 组件不发起网络请求、不读写 storage、不调用 runtime context。

测试要求：

- 每个组件至少覆盖 disabled、focus-visible 相关 class / attribute、aria label 或 label 绑定。
- `Button`、`IconButton`、`Input`、`Select`、`Switch`、`Tabs` 需要覆盖键盘交互。
- 组件样式需要在 light / dark token 下都可读。
- 官方插件新增 UI 时，优先通过 `@tabora/ui` 示例或测试验证后再迁移。

### 6.7 `@tabora/official-plugins`

职责：

- 提供默认产品体验。
- 使用同一套插件协议注册官方能力。
- 证明平台不需要硬编码业务功能也能形成完整工作台。
- 使用 `@tabora/ui` 作为内容区控件基线，必要时补充局部业务样式。

关键官方插件：

- `official.layout.workbench-dashboard`
- `official.search.command-bar`
- `official.search-providers.basic`
- `official.background.basic`
- `official.theme.default-pack`
- `official.widgets.today-focus`
- `official.widgets.quick-links`
- `official.widgets.notes`
- `official.widgets.todo`
- `official.widgets.weather`
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

### 7.4 扩展点 Props Contract

MVP 需要把 view props 从隐式约定推进为显式类型。建议在 `@tabora/plugin-api` 中定义以下最小 contract：

```ts
type WidgetViewProps = {
  pluginId: string
  instanceId: string
  contributionId: string
  size: WidgetSize
  config: Record<string, unknown>
  host: {
    updateConfig(value: Record<string, unknown>): Promise<void>
    requestResize(size: WidgetSize): Promise<void>
    removeInstance(): Promise<void>
    openModal(viewId: string, props?: unknown): void
    openFullscreen(viewId: string, props?: unknown): void
  }
}

type SearchViewProps = {
  providers: SearchProviderContribution[]
  defaultProviderId: string
  submit(query: string, providerId: string): Promise<void>
}

type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
  host: {
    close(): void
    setDirty(isDirty: boolean): void
  }
}

type BackgroundRendererViewProps = {
  providerId: string
  rendererId: string
  value: unknown
  themeTokens: Record<string, string>
}
```

约束：

- props contract 属于插件 API，不属于 playground。
- 宿主在渲染前负责从 workspace、instance、contribution 和 runtime context 组装 props。
- 插件视图不能依赖未声明 props；新增 props 需要保持向后兼容或升级 manifest engine version。
- contract tests 必须验证每个 contribution 的 view ID 可以解析，并且宿主传入 props 满足对应扩展点约束。

### 7.5 Contribution 校验规则

Manifest schema 需要补齐交叉校验：

- `widget.defaultSize` 必须包含在 `widget.supportedSizes` 中。
- 每个 contribution 的 `viewId` 必须在插件 activation 后能从 registry 中解析。
- `layout.regions` 声明的 region ID 必须能被 workspace 中的 instance 引用。
- `settings-panel` 必须声明稳定 `id`、`title`、`viewId` 和可选 `order`。
- `search-provider.urlTemplate` 必须有 query placeholder，且生成 URL 后必须通过 URL protocol 校验。
- 重复 contribution ID 应在 manifest 校验阶段失败。

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

安全约束：

- `openExternal` 只允许 `http:` 和 `https:` URL。
- 必须拒绝 `javascript:`、`data:`、`file:`、`blob:`、空 URL 和 URL 解析失败场景。
- host 匹配应基于标准 `URL` 解析结果，不对原始字符串做手写截取。
- 权限拒绝需要返回明确失败结果，并允许 UI 显示轻量错误反馈。
- `hosts: ["*"]` 只允许官方可信插件在 MVP 使用；本地 / 第三方插件必须声明具体 host 或经过用户授权。

### 8.3 Config 与 Plugin Data 边界

`getConfig` / `setConfig` 只用于插件配置，不用于业务数据列表或大文本内容。

建议边界：

- 实例外观、用户选择的 provider、开关项：进入 instance config 或 plugin config。
- 便签正文、待办列表、快捷链接集合：进入 plugin data repository。
- 全局工作台主题、背景、布局：进入 workspace。
- 权限授权结果：进入 permission grants。

当前 runtime config 仍偏向内存 Map，后续必须接入 repository，否则设置中心和插件实例配置无法跨会话恢复。

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
  meta!: Table<StorageMeta, string>
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

Schema 与迁移：

- 数据库必须有显式 schema version，不允许直接修改表结构而不写 migration。
- `meta` 表记录 `schemaVersion`、`createdAt`、`updatedAt` 和最近一次 migration 结果。
- migration 必须幂等，失败时不能破坏旧数据。
- 插件私有数据如果需要迁移，应由插件提供 `migrations` 或通过插件版本升级任务执行，平台只负责调用和记录结果。
- 每个 repository 的测试都要覆盖空库初始化、旧版本升级和损坏数据回退。

配额与清除策略：

- IndexedDB 可能因为浏览器配额、用户清理站点数据、隐私模式或存储压力而失败或被清除。
- 写入失败需要捕获 `QuotaExceededError` 或同类异常，并返回可展示的错误结果。
- MVP 应提供安全默认 workspace：storage 读取失败时仍能渲染官方默认工作台，但要避免覆盖原有数据。
- 后续 extension shell 可以在浏览器支持时请求 persistent storage，并在设置中心显示本地数据状态。
- 大型 plugin data 需要按需读取，避免启动时一次性加载所有插件数据。

命名空间：

- `pluginData` 的唯一键建议由 `pluginId + instanceId + key` 组合生成。
- 多实例 widget 默认使用 instanceId 隔离数据；只有显式配置“共享数据”的插件才可以省略 instanceId。
- 删除实例时默认保留 plugin data 的短期可恢复窗口，后续由设置中心提供清理入口。

## 11. 宿主渲染方案

### 11.1 默认工作台装配

playground 启动时：

1. 创建 plugin kernel。
2. discover 官方插件。
3. activate enabled plugins。
4. 加载默认 workspace。
5. 加载 rail、topbar 和主网格实例。
6. 应用主题 token。
7. 应用背景。
8. 通过 registry 渲染 rail actions、search 和 widget views。

目标默认布局：

```txt
workbench-shell
  rail
    home / add widget / plugins / settings
  content
    topbar
      command search
    mainGrid
      today focus / quick links / notes / todo / optional widgets
```

当前实现已从 `official.layout.top-search-grid` 演进到 `official.layout.workbench-dashboard` 竖切：整体布局由 layout contribution 声明，宿主读取 `activeLayoutId` 后渲染 rail、topbar 和 mainGrid 的宿主容器。宿主仍负责真实 DOM 容器、焦点、滚动、错误边界、实例增删改和持久化；layout 插件只贡献区域结构和默认装配语义。

主网格溢出规则：

- grid 容器按当前布局的列数和语义尺寸映射自动排列。
- 当实例数量超过当前视口可见范围时，页面使用纵向滚动。
- 不使用横向滚动作为默认工作台溢出方案。
- 不为了容纳更多实例动态压缩卡片到不可读尺寸。
- 新实例追加到当前 region 的末尾，并分配下一个可用 grid order。
- 拖拽排序和尺寸调整更新 `PluginInstance.grid`，刷新后恢复。
- 移动端可把语义尺寸折叠为单列展示，但保留实例的语义 `size` 状态。

Rail 规则：

- Rail 是布局插件定义的工作台级区域，桌面端固定在左侧。
- Rail 默认入口包括主页、添加卡片、插件和设置。
- Rail 不直接渲染具体业务内容；添加卡片、插件管理和设置内容仍通过 widget 或 settings-panel contribution 呈现。
- 移动端 rail 可折叠为底部工具条或顶部紧凑入口，不产生横向滚动。

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

### 13.3 插件权限与浏览器权限分层

Tabora 插件权限和浏览器扩展 manifest 权限不是同一层：

- Tabora 插件权限描述插件向平台请求的能力，如 `external-open`、`network`、`clipboard`、`workspace`。
- 浏览器扩展 manifest 权限描述 extension shell 向 Chrome / Edge 等浏览器请求的宿主能力。
- extension shell 负责把平台能力映射到浏览器 API，但不能把所有浏览器权限直接暴露给插件。
- MVP playground 可以用 `window.open` 模拟外部打开；extension shell 需要根据 Chrome MV3 要求声明 new tab override、权限和 host permissions。
- 如果某个 Tabora 插件没有权限，即使浏览器扩展自身拥有权限，runtime 也必须拒绝该插件调用。

权限记录建议：

```txt
permissionGrants
  id
  pluginId
  permissionType
  scope
  granted
  source: manifest | user | system
  createdAt
  updatedAt
```

MVP 官方插件可以通过 manifest 默认授权最小权限，但记录模型要支持未来用户授权、撤销和审计。

### 13.4 后续扩展

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

`official.layout.workbench-dashboard`

职责：

- 贡献默认 layout。
- 定义 `rail`、`topbar` 和 `mainGrid` 区域。
- 定义主页、添加卡片、插件和设置等工作台级入口。
- 声明区域可接受的扩展点。
- 提供默认区域实例引用。

### 14.2 Search

`official.search.command-bar`

职责：

- 贡献命令搜索 UI。
- 编排搜索输入、快捷建议和默认搜索源。
- MVP 先覆盖网页搜索和快捷建议，后续再扩展为插件命令入口。
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

### 14.6 Workbench Widgets

`official.widgets.today-focus`

职责：

- 贡献今日重点 widget。
- 用最轻量的方式验证个人工作台心智。
- 保存单条重点和完成状态。

`official.widgets.quick-links`

职责：

- 贡献快捷入口 widget。
- 验证外部打开权限、实例配置和后续自定义链接。

`official.widgets.notes`

职责：

- 贡献便签 widget。
- 注册 card / modal 视图。
- 验证插件私有数据和 modal 宿主。

`official.widgets.todo`

职责：

- 贡献待办 widget。
- 验证交互型 widget、plugin data 和完成状态持久化。

`official.widgets.weather`

职责：

- 贡献天气摘要 widget。
- MVP 可作为可添加候选，不强制首屏默认。
- 验证非核心信息卡片和后续 network provider 扩展路径。

实现备注：

- 当前代码中快捷入口、便签、待办和天气仍位于 `official.widgets.productivity` 包内。
- 后续可以先在同包内新增 `today-focus`，再逐步拆分独立插件 ID。
- 无论是否物理拆包，manifest 和文档应按独立 widget 能力验收。

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

当前和后续应覆盖：

- manifest schema 校验。
- event bus。
- extension registry。
- plugin kernel 激活。
- workspace repository。
- instance repository。
- theme token 应用。
- `@tabora/ui` 基础组件。
- grid order 分配。
- plugin view boundary。
- runtime permission bridge。
- extension point props contract。
- contribution 交叉校验。
- storage schema migration。
- storage quota / failure fallback。
- `@tabora/ui` 键盘交互和 aria contract。
- URL protocol 校验。

### 15.2 集成测试

当前通过 `pnpm test` 执行快速单元 / 集成测试。该命令显式枚举当前已落地的普通测试文件，并排除 `*.e2e.test.tsx`，避免真实浏览器测试混入日常反馈路径。

重点覆盖：

- 插件注册和视图可访问。
- IndexedDB repository 在 fake IndexedDB 下可读写。
- 权限桥 allow / deny 行为。
- 默认 workspace 从空库恢复。
- 插件 activation 失败时不影响其他插件。
- settings host 渲染多个 settings panel，单个 panel 失败时其他 panel 可用。
- search plugin 从 `search-provider` contributions 动态读取 provider，不硬编码 provider 列表。

### 15.3 Contract Tests

需要新增专门的插件契约测试：

- 每个官方插件 manifest 能通过 schema 校验。
- 每个 contribution ID 在同一插件内唯一。
- 每个 contribution 声明的 view ID 在 activation 后都能解析。
- 每个 widget 的 `defaultSize` 属于 `supportedSizes`。
- 每个 settings panel 能被 settings host 列出并按 order 排序。
- 每个 search provider 生成的 URL 只能是 `http:` 或 `https:`。
- 官方插件不能调用未在 manifest 声明的权限。

### 15.4 静态检查

`pnpm check` 覆盖：

- 格式化。
- lint。
- type check。

### 15.5 构建验证

`pnpm build` 覆盖：

- package build。
- playground production build。

### 15.6 E2E、可访问性和视觉回归

当前 E2E 通过 `pnpm test:e2e` 执行，使用 `vitest.e2e.config.ts` 启用 Vitest Browser Mode、`@vitest/browser-playwright` provider 和本机 Chrome channel。`apps/playground/src/workbenchDashboard.e2e.test.tsx` 已覆盖默认工作台首屏、rail 添加入口、添加 widget、尺寸选项、notes modal、拖拽排序和移动端无横向滚动。

后续继续补齐：

- 轻 rail 插件、设置入口。
- 调整尺寸后持久化恢复。
- 添加多张 widget 后验证主网格纵向滚动、无横向滚动、卡片仍可读。
- 切换主题和背景。
- 打开 modal / fullscreen。
- 搜索外部打开权限路径。
- 插件错误回退状态。
- settings host 打开、关闭、焦点回收和键盘导航。
- 所有 rail 入口可键盘聚焦并有可见焦点。
- `@tabora/ui` 组件在 light / dark token 下无文本重叠、无不可读对比。
- 主网格长列表滚动时不出现横向滚动，不因 hover / loading 改变布局。
- 浏览器扩展 shell 中 new tab override 正常加载，且内部权限拒绝不依赖浏览器权限拒绝。

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

- 复用 `plugin-api`、`platform-kernel`、`storage`、`theme`、`ui`、`official-plugins`。
- extension shell 只处理浏览器扩展入口、权限声明和宿主适配。
- 不把业务能力写入 extension shell。
- Chrome / Edge 新标签页入口通过 manifest override pages 接入，shell 页面自身保持轻量。
- 浏览器 manifest 权限必须按实际 host 能力最小化声明，不能因为内部插件权限模型存在就默认声明宽权限。
- extension shell 需要把浏览器 API 包装成 Tabora runtime bridge，不允许插件直接访问浏览器扩展 API。
- extension shell 需要验证 IndexedDB / extension storage 的兼容策略，避免 playground 可用但扩展环境无法恢复状态。

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

- 工作台仪表盘布局：轻 rail + 命令搜索 + 主网格。
- `@tabora/ui` 基础组件包，并迁移官方插件内容区控件。
- 今日重点 widget。
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

| 风险                         | 描述                                                                     | 应对                                                       |
| ---------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| playground shell 逻辑变重    | App.tsx 可能承担过多编排职责                                             | 后续拆出 workspace orchestration hooks / services          |
| runtime config 仍是内存 Map  | `getConfig` / `setConfig` 还未接入持久化 repository                      | 接入 plugin config repository                              |
| `@tabora/ui` 已交付          | 位于 `packages/ui`，基于 `@kobalte/core`，官方插件已迁移                 | 继续补齐组件测试和视觉回归覆盖                             |
| 权限模型只实现 external-open | 其他权限仍是类型和设计                                                   | 分阶段实现 network、clipboard、local-file、workspace write |
| 第三方插件不可信执行未解决   | MVP 不包含沙箱                                                           | V2 引入 sandbox runtime                                    |
| E2E 覆盖仍需扩展             | 已引入 Vitest Browser Mode + Playwright provider，覆盖默认工作台关键路径 | 继续补齐主题/背景、settings host、权限路径和视觉回归       |
| 插件 view 类型较宽           | 当前使用通用 Solid view 函数                                             | 后续按 extension point 定义 props contract                 |
| IndexedDB 迁移和配额策略不足 | 当前持久化已可用，但 schema migration / quota 未成体系                   | 增加 meta 表、migration 测试和 storage 失败回退            |
| 浏览器扩展权限映射未定义     | playground 权限桥已跑通，但 extension shell 还未映射浏览器权限           | 在 WXT 阶段建立 Tabora 权限到 MV3 权限的适配层             |

## 21. 验收清单

技术验收：

- `pnpm check` 通过。
- `pnpm test` 通过。
- `pnpm test:e2e` 通过。
- `pnpm build` 通过。
- playground dev server 返回 HTTP 200。

功能验收：

- 默认工作台可渲染。
- 默认布局包含左侧轻 rail、顶部命令搜索和主网格。
- 默认首屏包含今日重点、快捷入口、便签和待办中的核心模块。
- 官方插件通过 manifest 注册能力。
- 官方插件内容区控件优先来自 `@tabora/ui`。
- `@tabora/ui` 包真实存在并通过组件测试，官方插件不再重复实现基础按钮、输入、选择器和错误状态。
- 每类扩展点都有明确 props contract，官方插件 view 不依赖隐式宿主字段。
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
- IndexedDB schema migration 和 storage 失败回退有测试覆盖。
- 权限桥拒绝非 http(s) URL。
- extension shell 权限映射方案明确，浏览器权限不会绕过 Tabora 插件权限。
