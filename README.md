# Tabora

Tabora 是一个插件优先的个人工作台新标签页产品。它不是把搜索、壁纸、卡片和设置写死在平台里的页面，而是一个由插件装配出来的模块仪表盘型工作台平台。

核心原则：

> 任何具体业务能力默认优先放进插件；平台只保留通用运行机制。

平台负责插件运行内核、扩展点协议、宿主容器、存储、权限、事件和故障恢复。用户看到的布局、命令搜索、搜索源、背景、主题、卡片、弹窗、全屏视图和设置面板，都应来自官方或未来第三方插件。

## 当前定位

Tabora 当前处于 MVP 实现阶段，目标是验证一套可扩展的新标签页工作台架构：

- 插件发现、manifest 校验、激活、registry 和 runtime context。
- `layout`、`widget`、`search`、`search-provider`、`background-provider`、`background-renderer`、`theme`、`settings-panel` 等扩展点。
- 官方内置插件包和默认 builtin 装配。
- Dashboard 与 Focus 等布局插件，验证“布局也是插件”的产品原则。
- Widget 多实例、多尺寸、拖拽排序、右键菜单、双击展开和持久化。
- IndexedDB 本地持久化、主题 token、背景渲染、settings host、toast、modal、fullscreen 和插件错误边界。
- `external-open` 最小权限桥。

MVP 暂不包含远程插件市场、不可信远程插件沙箱、在线安装升级、云同步、账号系统、团队工作区或完整插件开发者工具。

## 快速开始

环境要求：

- Node.js `>=24`
- pnpm `11.5.2`

安装依赖：

```bash
pnpm install
```

启动 playground：

```bash
pnpm dev
```

也可以固定本地地址启动：

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

常用命令：

```bash
pnpm check
pnpm check:fix
pnpm test
pnpm build
pnpm --filter @tabora/playground build
pnpm --filter @tabora/extension build
pnpm --filter @tabora/site build
```

## 工作区结构

```txt
apps/
  playground/      # MVP shell 与本地调试入口
  extension/       # 浏览器扩展 newtab 入口
  site/            # 官网、下载页和文档站点

packages/
  plugin-api/      # manifest、contribution、workspace 数据模型和 schema
  platform-kernel/ # 插件生命周期、registry、event bus、runtime context、权限桥
  orchestrator/    # 跨插件编排模型，如布局、搜索、命令、设置、拖拽
  workbench-app/   # 跨 shell 的 workbench composition 和运行时编排
  workbench-shell/ # 宿主级 UI 容器、overlay、shell 样式
  storage/         # IndexedDB / Dexie 持久化
  theme/           # theme contribution 到 CSS custom properties 的应用
  ui/              # 插件内容区基础组件
  brand/           # 品牌资产和品牌组件
  host-adapters/   # web / extension host capability adapters
  official-plugins/
  builtin-plugin-registry/

plugins/
  official/        # 官方布局和 widget 插件
  community/       # 当前一起验证的社区 builtin 插件

examples/          # 插件示例
tooling/           # 共享 tsconfig 等工具配置
docs/              # 产品、设计、技术和回归事实源
```

## 架构边界

- `@tabora/plugin-api` 只定义协议、类型和 schema，不放运行时逻辑或业务 UI。
- `@tabora/platform-kernel` 只放通用运行机制，不硬编码具体业务能力。
- `@tabora/storage` 封装持久化，插件业务数据不要混入 workspace 装配数据。
- `@tabora/theme` 负责应用主题 token，视觉能力优先走 CSS custom properties。
- `@tabora/ui` 只提供插件内容区基础组件和低层可访问 primitive，不承载宿主级容器。
- `@tabora/official-plugins` 表达官方插件 pack，不决定 shell 最终默认加载哪些 builtin plugins。
- `@tabora/builtin-plugin-registry` 是当前 shell 默认 builtin 装配入口。
- `apps/playground`、`apps/extension` 和未来其他 shell 应优先复用 `@tabora/workbench-app`、`@tabora/workbench-shell` 与 `@tabora/host-adapters`。

## 插件规则摘要

- 具体业务能力默认放进插件。
- manifest 只声明能力，不执行逻辑。
- 插件入口 `activate(context)` 只通过 runtime context 使用平台能力。
- 插件不能直接访问宿主内部 store。
- 插件不能直接创建全局 modal、fullscreen 或 settings 容器。
- 插件不能直接 `window.open`，外部打开必须走 `context.permissions.openExternal(url)`。
- Widget 必须声明 `supportedSizes`、`defaultSize` 和 view id。
- Widget 内容过长时应内部滚动或截断，不撑破卡片。
- 多实例数据默认按 instance 隔离。

## 文档入口

开始较大任务前先读：

- `AGENTS.md`
- `docs/README.md`

按任务类型继续阅读事实源：

- 产品范围：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件：`docs/product/tabora-official-plugins-design.md`
- 视觉与交互：`DESIGN.md`
- 设计实现映射：`docs/product/tabora-design-system.md`
- 技术架构：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归治理：`docs/technical/tabora-regression-baseline.md`

文档内容以中文为主。新增产品、技术、计划类文档也优先使用中文。

## 开发约定

- TypeScript + ESM。
- Solid 组件使用 `.tsx`。
- 包管理器只用 pnpm。
- 格式遵循 Vite+ 配置：双引号、无分号。
- `no-console` 是 lint error，只允许 `console.warn` 和 `console.error`。
- UI 任务以 `DESIGN.md` 为视觉、token、基础组件、交互模式和可访问性事实源。
- 插件内容区控件优先使用 `@tabora/ui`。
- 新 UI 图标优先使用 `lucide-solid`，不使用 emoji 作为新 UI 图标。
- 不做无关重构，不回滚其他人或其他 agent 的改动。

## 验证

文档或配置变更至少运行：

```bash
pnpm check
```

代码变更按影响范围追加：

```bash
pnpm test
pnpm build
```

前端视觉或交互变更还需要启动 playground，并用浏览器检查关键路径，例如默认工作台、添加 widget、调整尺寸、拖拽排序、主题和背景切换、settings host、modal / fullscreen、搜索外部打开权限路径和插件错误回退状态。
