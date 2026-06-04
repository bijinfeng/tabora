# Tabora 文档地图

这份文档帮助人类和 agent 快速判断：当前任务应该先读哪些文档、哪些文档是事实源、哪些文档是历史设计或实施记录。

## 阅读入口

开始任何较大的产品、技术或实现任务时，推荐顺序：

1. 根目录 `AGENTS.md`：agent 行为约束、工程规则、架构边界和验证要求。
2. 本文档：确认应该继续读哪些项目文档。
3. 与任务匹配的产品、技术或计划文档。

`CLAUDE.md` 只是 Claude Code 的薄入口，实际项目事实源仍是 `AGENTS.md` 和本文档列出的项目文档。

## 当前事实源

### 产品范围

- `docs/product/tabora-plugin-workbench-prd.md`

用途：

- 判断 MVP 是否应该包含某项能力。
- 确认产品目标、非目标、核心流程、验收标准和路线图。
- 做产品决策时优先读它。

重点章节：

- 产品定位。
- MVP 范围。
- 核心功能需求。
- 关键用户流程。
- 验收标准。
- 风险与开放问题。

### 官方插件设计

- `docs/product/tabora-official-plugins-design.md`

用途：

- 理解官方内置插件包。
- 判断某个能力应该放进哪个官方插件。
- 对齐交互示例、参考对象、设计语言和插件验收标准。

重点内容：

- 官方插件矩阵。
- 默认装配方案。
- `official.layout.workbench-dashboard`。
- `official.layout.workbench-stream`。
- `official.search.command-bar`。
- `official.search-providers.basic`。
- `official.background.basic`。
- `official.theme.default-pack`。
- `official.widgets.today-focus`。
- `official.widgets.quick-links`。
- `official.widgets.notes`。
- `official.widgets.todo`。
- `official.plugin-manager`。
- `official.settings.workspace`。
- 跨插件流程。

### 设计事实源（V2）

V2 设计体系基于 Refined Sage 色彩方案。根目录 `DESIGN.md` 是视觉语言、token、基础组件语义、宿主容器视觉、交互模式和可访问性规则的单一事实源。

- `DESIGN.md` — 按 `google-labs-code/design.md` 规范生成的仓库级设计事实源，提供机器可读 token front matter 和面向 AI / 工程实现的设计规范。

用途：

- 作为当前设计实现的视觉事实源。
- PRD 评审时验证产品口径完备性。
- 实现 UI 时参照颜色、间距、组件 API 和交互模式。
- 给 AI / agent 快速对齐设计语言。

### 设计预览资产

- `docs/design/03-工作台交互原型.html` — 双布局可交互产品原型，用于评审仪表盘式与流式布局、布局切换、⌘K 搜索、拖拽排序、右键菜单、双击展开、设置侧栏导航、Toast 堆叠和快捷键参考。
- `docs/design/04-官网预览.html` 和 `docs/design/05-官网下载.html` — 官网方向静态设计预览，用于评审信息架构和视觉方向。

这些 HTML 文件只作为可视原型或静态预览资产，不再承载规范事实。若预览资产与 `DESIGN.md` 冲突，以 `DESIGN.md` 为准，并同步修订预览或实现。

### 设计实现映射

- `docs/product/tabora-design-system.md`

用途：

- 作为 `DESIGN.md` 到当前仓库实现的桥接文档。
- 说明 `@tabora/theme`、`@tabora/ui`、shell 宿主容器和 Storybook 应如何承接设计规范。
- 记录实现映射、同步清单和历史预览文件的定位，不再重复维护完整视觉规范正文。

补充预览：

- `docs/product/tabora-design-system-preview.html` 是早期静态视觉预览，可作为历史参考，不再作为当前视觉事实源。

### 技术方案

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`

用途：

- 理解 monorepo 包边界、运行时架构、数据模型和宿主渲染方案。
- 实现或修改核心代码前优先读它。
- 判断平台层、官方插件层、playground shell 的责任边界。

重点章节：

- 技术目标。
- 设计原则。
- 技术栈。
- 仓库结构。
- 核心模块设计。
- 插件协议设计。
- Runtime Context。
- 持久化方案。
- 宿主渲染方案。
- 权限与安全方案。
- `@tabora/ui` 基础组件边界。
- 官方插件方案。
- 测试方案。
- 验收清单。

### Playground 部署

- `docs/technical/playground-github-actions-deploy.md`

用途：

- 配置 GitHub Actions 将 `apps/playground` 构建并发布到自有服务器。
- 确认仓库 Variables / Secrets、服务器目录和 SSH/rsync 前置条件。
- 排查静态部署链路问题时优先读它。

### Extension 分发

- `docs/technical/extension-github-actions-publish.md`

用途：

- 配置 GitHub Actions 将 `apps/extension` 构建为 WXT zip，并提交到 Chrome Web Store / Firefox Add-ons。
- 确认 `wxt submit init`、GitHub Secrets 和发布触发方式。
- 排查扩展构建与商店提交流程时优先读它。

### 阶段执行路线图

- `docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`

用途：

- 基于 PRD、官方插件设计、技术方案和当前实现状态，整理后续阶段的执行顺序。
- 后续使用 Superpowers 拆解实施任务时，先选中路线图中的阶段或子项目，避免每次重新探索下一阶段范围。

### 布局插件化契约重构设计

- `docs/superpowers/specs/2026-06-02-layout-plugin-contract-design.md`

用途：

- 把布局从 shell 硬编码分发改为协议驱动，落地 LayoutViewProps / RegionSlot / LayoutHostAPI 契约。
- 把官方两个布局拆成独立 package，并新增第三方 DIY 布局验证架构是否真支持第三方布局。
- 作为实施规划入口，不替代 PRD、官方插件设计和技术方案的事实源地位。

重点内容：

- 当前实现基线和关键差距。
- Shell 与插件边界口径。
- Phase A-H 的目标、进入条件、主要任务、验收标准和后续拆计划建议。
- 后续 Superpowers 使用方式。

## 历史规格和实施计划

历史规格和阶段性实施计划已不再作为当前分支的文档入口。当前事实源以 `DESIGN.md`、`docs/product/` 和 `docs/technical/` 下登记的文档为准。

`docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md` 是当前分支登记的阶段执行规划入口，用于辅助后续 Superpowers 任务拆解；它不覆盖当前事实源。

如果未来重新引入其他计划文档或阶段记录，需要先在本文档登记入口，再更新 `AGENTS.md` 的文档维护规则。

## 按任务选择文档

### 做产品判断

先读：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`

常见问题：

- MVP 是否包含某能力。
- 设置中心是否进入 MVP。
- 卡片过多如何处理。
- 官方插件默认包含哪些。
- 默认布局是否应使用轻 rail + 命令搜索 + 主网格。
- 第三方插件市场是否进入当前阶段。

### 做技术实现

先读：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- `docs/product/tabora-plugin-workbench-prd.md` 中对应功能章节。
- 相关 package 源码。

常见问题：

- 新能力应该放在哪个 package。
- 是否应该改平台 kernel。
- 插件如何注册 view。
- 数据应该放 workspace、plugin instance 还是 plugin data。
- 权限桥应该如何扩展。

### 修改官方插件

先读：

- `docs/product/tabora-official-plugins-design.md`
- `DESIGN.md`
- `docs/design/03-工作台交互原型.html`（仅用于查看可交互原型）
- `docs/product/tabora-design-system.md` 的实现映射与同步清单。
- `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 的官方插件方案。
- `packages/official-plugins/src/`

注意：

- 官方插件也必须走 manifest、contribution、registry、runtime context、permission 和 storage 协议。
- 不要因为是官方插件就绕过平台边界。

### 修改 UI / 交互

先读：

- `DESIGN.md` — V2 设计规范事实源（色彩 token、字体、间距、动效、组件语义、交互模式等）
- `docs/design/03-工作台交互原型.html` — V2 可交互原型参考（搜索、拖拽、双击展开、右键菜单等交互模式）
- `apps/storybook/` — `@tabora/ui` 基础组件的运行中示例与交互文档站，组件 API、状态和组合示例优先在这里对照
- `docs/product/tabora-official-plugins-design.md` 的插件规格和交互示例。
- `docs/product/tabora-design-system.md` 的实现映射与同步清单。
- `AGENTS.md` 的 UI 规则。
- 相关 Solid 组件和 CSS。

必须保持：

- 工作台优先，不做 landing page。
- 目标默认布局为轻 rail + 命令搜索 + 主网格，不退回纯搜索页。
- `@tabora/ui` 已落地为基础组件包；后续补齐或重构时继续以 V2 组件规范和 Storybook 为准，宿主级容器仍由 shell 提供。
- 明暗主题可读。
- 卡片稳定，不因 hover、focus、拖拽造成布局跳动。
- 移动端无横向滚动。
- 卡片过多时主网格纵向滚动，不强塞进一屏。

Storybook 使用约定：

- 启动：`pnpm storybook`
- 构建：`pnpm storybook:build`
- Storybook 作为 `@tabora/ui` 的组件示例和文档站，优先承载基础组件状态、变体、可访问性说明和组合示例。
- `storybook-static/` 是构建产物，不作为事实源提交；如需静态预览，重新构建即可。

### 修改存储或数据模型

先读：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 的数据模型和持久化方案。
- `packages/storage/src/`
- `packages/plugin-api/src/workspace.ts`

原则：

- workspace 存装配状态。
- plugin instance 存实例尺寸、区域、位置和配置。
- plugin data 存插件业务数据。
- 插件业务数据不要混入 workspace。

### 部署 Playground

先读：

- `docs/technical/playground-github-actions-deploy.md`
- `.github/workflows/deploy-playground.yml`

常见问题：

- 需要配置哪些 GitHub Variables / Secrets。
- workflow 什么时候会自动发布。
- 服务器目录需要什么权限。
- 如何在部署后追加 reload 或缓存刷新命令。

### 官网预览与站点实现

当前官网方向包含两层：

- `docs/design/04-官网预览.html` 和 `docs/design/05-官网下载.html`：静态设计预览，用于评审布局、文案和视觉方向；若视觉规范与 `DESIGN.md` 冲突，以 `DESIGN.md` 为准。
- `apps/site/`：按上述设计稿还原的 Vite + SolidJS + Tailwind CSS 官网应用，复用 `@tabora/ui` 和 `@tabora/theme`。

常用命令：

```bash
pnpm --filter @tabora/site dev
pnpm --filter @tabora/site build
```

### 修改权限或安全

先读：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 的权限与安全方案。
- `packages/platform-kernel/src/runtimeContext.ts`
- `packages/platform-kernel/src/runtimeContext.test.ts`

原则：

- 外部打开走 `external-open` 权限桥。
- host 只执行权限桥批准后的事件。
- 权限拒绝不能导致宿主崩溃。

## 文档维护规则

项目文档和技术方案是活的事实源，不是一次写死后长期不变的说明。产品口径、技术方案和实现状态一旦变化，相关文档也必须实时演进，避免 agent 后续基于过时文档做出错误判断。

产品或架构决策变更时，按影响范围同步文档：

- 产品范围变化：更新 PRD。
- 官方插件行为变化：更新官方插件设计。
- 视觉语言、token、基础组件、宿主容器视觉或可访问性规则变化：更新 `DESIGN.md`。
- 包边界、数据流、运行时、权限、宿主渲染变化：更新技术方案。
- agent 行为或验证要求变化：更新 `AGENTS.md`。
- 文档结构变化：更新本文档。

不要让同一事实在多处长期分叉。若必须重复关键规则，保留一句摘要，并链接到事实源。

如果发现代码、计划和文档互相矛盾：

- 先确认当前真实实现和用户最新决策。
- 再更新对应事实源文档。
- 不要静默忽略矛盾。
- 不要因为文档存在就假设它一定比代码更新。

## 当前特别口径

这些口径已经在当前文档中确认：

- MVP 包含轻量设置中心，但不做完整设置系统。
- MVP 包含 `@tabora/ui` 基础组件包，并继续按 `DESIGN.md` 的组件语义扩展，用于统一插件内容区控件。
- MVP 提供至少两种布局插件（仪表盘式和流式），且它们有显著不同的区域结构。
- MVP 默认布局为仪表盘式（左侧轻 rail + 顶部命令搜索 + 主网格），用户可在设置中切换到流式布局。
- 布局切换保留所有插件实例数据。区域不匹配的实例进入待放置状态。
- 所有布局必须满足全局可达性约束：搜索、添加卡片、插件管理、设置在任意布局下可达。
- 默认首屏按 `DESIGN.md` 的工作台规则和工作台原型参考样张优先露出命令搜索、今日重点、快捷入口、待办、便签和天气摘要。
- MVP 使用主网格纵向滚动处理卡片过多，不强行塞进一屏。
- 当前设计事实源为根目录 `DESIGN.md`。
- `docs/product/tabora-design-system.md` 是面向仓库实现的桥接文档，`docs/product/tabora-design-system-preview.html` 仅作历史预览参考。
- 官方插件也是生态示例，不能绕过平台协议。
- 平台不硬编码具体业务能力。
- 文档和说明优先使用中文。

## 验证

文档整理或文档内容变更后至少运行：

```bash
pnpm check
```

代码变更按 `AGENTS.md` 中的验证要求追加 `pnpm test`、`pnpm build` 或浏览器检查。
