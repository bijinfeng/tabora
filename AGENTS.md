# AGENTS.md

本文件约束在 Tabora 仓库中工作的 Codex 和其他通用 coding agent。除非子目录中存在更近的 `AGENTS.md` 覆盖，本文件适用于整个仓库。

## 快速理解项目

Tabora 是一个插件优先的个人工作台新标签页产品。它不是把搜索、壁纸、卡片和设置写死在平台里的页面，而是一个由插件装配出来的模块仪表盘型工作台平台。

最高原则：

> 任何具体业务能力默认优先放进插件；平台只保留通用运行机制。

平台负责插件运行内核、扩展点协议、宿主容器、存储、权限、事件和故障恢复。用户看到的轻 rail、命令搜索、搜索源、背景、主题、布局、卡片、弹窗、全屏视图和设置面板，都应来自官方或未来第三方插件。

## 关键文档

开始较大任务前先读文档地图：

- `docs/README.md`

文档地图会说明当前事实源、历史规格和不同任务的阅读路径。不要在 `AGENTS.md` 中复制完整文档目录，避免双写双维护。

UI、token、基础组件或宿主容器视觉相关任务，需要额外优先阅读 `docs/product/tabora-design-system.md`；静态视觉预览在 `docs/product/tabora-design-system-preview.html`。

文档内容以中文为主。新增产品、技术、计划类文档也优先使用中文。

## 当前 MVP 口径

MVP 包含：

- 插件发现、manifest 校验、激活、registry、runtime context。
- 扩展点：`layout`、`widget`、`search`、`search-provider`、`background-provider`、`background-renderer`、`theme`、`settings-panel`。
- 官方内置插件包。
- `@tabora/ui` 基础组件包，用于插件内容区控件一致性。
- 左侧轻 rail + 顶部命令搜索 + 主网格工作台默认布局。
- 默认首屏核心卡片：今日重点、快捷入口、便签、待办；天气可作为可添加候选。
- Widget 多实例、多尺寸、拖拽排序、网格状态持久化。
- 卡片过多时主网格纵向滚动，不横向滚动，不强行压缩到不可读。
- 弹窗、全屏、轻量 settings host。
- 主题 token、背景来源和背景渲染。
- IndexedDB 本地持久化。
- 插件错误边界。
- `external-open` 最小权限桥。

MVP 不做：

- 第三方远程插件市场。
- 不可信远程插件沙箱运行时。
- 在线插件安装和自动升级。
- 云同步和账号系统。
- 团队或共享工作区。
- 完整插件开发者工具。
- AI 生成插件。
- 复杂 WebGL 背景编辑器。

## 工程结构

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

P0 规划中但当前尚未落地：

```txt
packages/
  ui/
    src/
      index.ts
      button.tsx
      form.tsx
      feedback.tsx
      layout.tsx
      styles.css
```

`@tabora/ui` 已进入 MVP 范围，但当前仓库还没有 `packages/ui`。新建前不要把它当成已完成包；新建时需要同步 package、tsconfig、exports、styles 入口、测试和官方插件迁移。

## 技术栈和命令

项目使用 pnpm workspace、Vite+、Solid、TypeScript、Tailwind CSS v4、Vitest、Dexie、Zod、tsdown。

环境：

- Node.js `>=24`
- pnpm `11.3.0`
- 包管理器只用 pnpm，不使用 npm 或 yarn。

常用命令：

```bash
pnpm dev
pnpm check
pnpm check:fix
pnpm test
pnpm build
pnpm --filter @tabora/playground build
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

`pnpm check` 覆盖格式化、lint、type check。文档变更至少跑 `pnpm check`。代码变更按范围追加 `pnpm test` 和 `pnpm build`。

## 代码风格

- TypeScript + ESM。
- Solid 组件使用 `.tsx`。
- 格式遵循 Vite+ 配置：双引号、无分号。
- `no-console` 是 lint error；只允许 `console.warn` 和 `console.error`。
- 搜索文件优先用 `rg` / `rg --files`。
- 修改文件优先使用补丁或编辑工具，不用 shell 重定向拼文件。
- 不做无关重构，不改无关格式。
- 不回滚用户或其他 agent 的改动。

## 架构边界

### `@tabora/plugin-api`

只定义协议、类型和 schema：

- manifest 类型。
- contribution 类型。
- workspace / region / plugin instance / grid placement / plugin record 数据模型。
- Zod schema。

不要在这里放运行时逻辑或业务 UI。

### `@tabora/platform-kernel`

只放通用运行机制：

- plugin kernel。
- event bus。
- extension registry。
- runtime context。
- permission bridge。

不要硬编码具体搜索引擎、便签、待办、天气、背景分类等业务能力。

### `@tabora/storage`

封装 IndexedDB / Dexie：

- workspace 装配状态。
- plugin instance 状态。
- plugin data。

workspace / instance / pluginData 要分层。插件业务数据不要混入 workspace 装配数据。

### `@tabora/theme`

负责把 theme contribution 的 token 应用为 CSS custom properties。新视觉能力应优先走 token，不要在插件里硬编码大面积颜色。

### `@tabora/ui`

P0 待建。目标是负责插件内容区基础组件，统一官方插件和未来第三方插件的控件视觉、状态和可访问性。

允许依赖：

- `solid-js`
- `@tabora/theme`

禁止依赖：

- `@tabora/platform-kernel`
- `@tabora/storage`
- `@tabora/official-plugins`
- `apps/playground`

`@tabora/ui` 不提供 `WidgetCard`、`Modal`、`FullscreenHost`、`SettingsHost`、`WorkbenchRail`、`WorkbenchGrid` 等宿主级容器。这些容器由 shell / host 统一提供，插件只渲染内容区。

### `@tabora/official-plugins`

官方默认体验来自这里。官方插件也必须遵守和第三方插件一样的协议：

- manifest 声明能力。
- activate 阶段注册 view。
- 宿主通过 registry 渲染 view。
- 外部能力通过 runtime context 和权限桥请求。
- 插件数据通过 storage repository 保存。
- 内容区 UI 优先使用 `@tabora/ui` 基础组件。

### `apps/playground`

MVP 第一个 shell：

- 启动 plugin kernel。
- 加载 workspace 和 plugin instances。
- 渲染默认工作台。
- 提供 modal / fullscreen / settings host / external-open 宿主能力。
- 用 `PluginViewBoundary` 隔离插件视图错误。

核心包不能依赖 playground。

## 插件开发规则

- 具体业务能力默认放进插件。
- manifest 只声明能力，不执行逻辑。
- 插件入口 `activate(context)` 只通过 runtime context 使用平台能力。
- 插件不能直接访问宿主内部 store。
- 插件不能直接创建全局 modal、fullscreen 或 settings 容器。
- 插件不能直接 `window.open` 执行外部打开；需要走 `context.permissions.openExternal(url)`。
- Widget 必须声明 `supportedSizes`、`defaultSize` 和 view id。
- Widget 内容过长时内部滚动或截断，不撑破卡片。
- 同一个 widget 可多实例，除非 contribution 显式禁止。
- 多实例数据默认按 instance 隔离；共享数据必须在产品文档中说明。

## 权限和安全

MVP 已建立 `external-open` 权限桥。原则：

- 插件请求外部打开必须通过 permission bridge。
- host 只执行权限桥批准后的 `host.external.open`。
- 权限拒绝不能导致宿主崩溃。
- 后续 `network`、`clipboard`、`local-file`、`workspace write` 都要使用时授权。

## 错误隔离

插件失败必须局部化：

- widget 失败：只显示该实例错误卡片。
- modal / fullscreen / settings panel 失败：只显示局部错误。
- search 失败：顶部区域显示搜索不可用占位。
- background 失败：回退到安全页面底色。
- theme 失败：回退到最小安全 token。

不要让单个插件视图导致整页白屏。

## 布局和卡片规则

- 目标默认布局是左侧轻 rail + 顶部命令搜索 + 主网格工作台。
- 当前代码仍可能处于顶部搜索 + 主网格实现阶段；修改时以 PRD 和官方插件设计为目标事实源，避免把旧实现当成最终产品方向。
- 默认首屏只保证命令搜索和 3-4 个核心卡片优先露出。
- 首屏核心卡片优先为今日重点、快捷入口、便签、待办；天气不强制默认进入首屏。
- 不要求所有官方卡片都塞进一屏。
- 卡片过多时，主网格纵向扩展并允许滚动。
- 不使用横向滚动作为默认工作台溢出方案。
- 不为了容纳更多卡片把卡片压缩到不可读。
- 新卡片追加到网格末尾。
- 用户通过拖拽排序和尺寸调整管理优先级。
- 移动端可以单列折叠，但保留实例语义 `size` 状态。
- Rail 只放主页、添加卡片、插件、设置等工作台级入口，不承载具体业务内容。

## 轻量设置中心

MVP 应包含轻量 settings host，但不做完整设置系统。

MVP 面板：

- `official.settings.plugins`：插件名称、ID、版本、启用状态、贡献能力、权限摘要，MVP 可只读。
- `official.settings.workspace.appearance`：主题和背景切换。
- `official.settings.workspace.search`：默认搜索源和搜索源启用状态。

延后能力：

- 设置搜索。
- 多 workspace。
- 导入 / 导出。
- 插件安装、卸载、更新。
- 复杂权限审计。
- 插件调试信息。

## UI 规则

- 产品气质是安静、清晰、可重复使用的个人工作台，不做营销页。
- 页面第一屏是可用工作台，不做 landing page。
- UI 工作以 `docs/product/tabora-design-system.md` 为视觉、token、基础组件、宿主容器和可访问性事实源。
- 使用主题 token 和 CSS variables。
- 插件内容区控件优先使用 `@tabora/ui`，避免在每个插件中重复实现基础按钮、输入、选择器和错误状态。
- 不要把宿主级容器放入 `@tabora/ui`；widget 卡片壳、modal、fullscreen、settings host、workbench rail/grid 由 shell 提供。
- 明暗主题都要保证可读。
- 卡片尺寸稳定，hover / focus / 拖拽不造成布局跳动。
- 不嵌套卡片。
- 控件按语义选择：checkbox 表示待办完成，select / combobox 表示搜索源，switch 表示启用状态。
- 新 UI 图标优先使用 `lucide-solid`。
- 不使用 emoji 作为新 UI 图标。
- 移动端不能出现横向滚动。
- 表单输入要有 label 或 aria label。
- 可点击元素要有 hover、focus-visible 和 pointer cursor。

## 测试和验证

交付前必须有新鲜验证证据：

- 文档或配置变更：运行 `pnpm check`。
- package / app 代码变更：运行 `pnpm test` 和 `pnpm check`。
- 跨包或发布相关变更：追加 `pnpm build`。
- 前端视觉/交互变更：启动 playground，并用浏览器检查关键路径。

推荐 E2E/视觉关注：

- 默认工作台首屏渲染。
- 添加 widget。
- 调整尺寸。
- 拖拽排序。
- 添加多张 widget 后主网格纵向滚动、无横向滚动、卡片仍可读。
- 切换主题和背景。
- 打开 modal / fullscreen / settings host。
- 搜索外部打开权限路径。
- 插件错误回退状态。

## 文档更新规则

项目文档和技术方案是持续演进的事实源，不是一次写死的静态说明。任何 agent 在修改产品口径、架构边界、运行机制、插件行为、UI 规则、数据模型、验证方式或实现进度时，都必须实时同步相关文档，防止文档过时并偏离项目现状。

产品或架构决策变更时，按影响范围同步更新相关文档：

- 文档地图：`docs/README.md`
- PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 设计体系：`docs/product/tabora-design-system.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design.md`

如果未来新增计划文档、阶段记录或实现进度文档，需要先在 `docs/README.md` 登记入口，再同步更新相关事实源；不要引用已经删除或当前分支不存在的文档路径。

如果代码实现和文档不一致，不能默认认为文档正确或代码正确。先查明当前真实状态，再更新事实源，必要时在 final 回复中说明文档与实现的差异和已采取的同步动作。

## Git 和协作

- 开始前查看 `git status --short --untracked-files=all`。
- 可能存在用户未提交改动；不要回滚不属于你的改动。
- 不使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 不自动 commit，除非用户要求。
- final 回复要说明改了什么、验证了什么、还有什么风险或未做。
