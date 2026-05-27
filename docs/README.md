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
- `official.layout.top-search-grid`。
- `official.search.command-bar`。
- `official.search-providers.basic`。
- `official.background.basic`。
- `official.theme.default-pack`。
- `official.widgets.productivity`。
- `official.plugin-manager`。
- `official.settings.workspace`。
- 跨插件流程。

### 技术方案

- `docs/technical/tabora-plugin-workbench-technical-design.md`

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
- 官方插件方案。
- 测试方案。
- 验收清单。

## 历史规格和实施计划

历史规格和阶段性实施计划已不再作为当前分支的文档入口。当前事实源以 `docs/product/` 和 `docs/technical/` 下的文档为准。

如果未来重新引入计划文档或阶段记录，需要先在本文档登记入口，再更新 `AGENTS.md` 的文档维护规则。

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
- 第三方插件市场是否进入当前阶段。

### 做技术实现

先读：

- `docs/technical/tabora-plugin-workbench-technical-design.md`
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
- `docs/technical/tabora-plugin-workbench-technical-design.md` 的官方插件方案。
- `packages/official-plugins/src/`

注意：

- 官方插件也必须走 manifest、contribution、registry、runtime context、permission 和 storage 协议。
- 不要因为是官方插件就绕过平台边界。

### 修改 UI / 交互

先读：

- `docs/product/tabora-official-plugins-design.md` 的全局设计语言。
- `AGENTS.md` 的 UI 规则。
- 相关 Solid 组件和 CSS。

必须保持：

- 工作台优先，不做 landing page。
- 明暗主题可读。
- 卡片稳定，不因 hover、focus、拖拽造成布局跳动。
- 移动端无横向滚动。
- 卡片过多时主网格纵向滚动，不强塞进一屏。

### 修改存储或数据模型

先读：

- `docs/technical/tabora-plugin-workbench-technical-design.md` 的数据模型和持久化方案。
- `packages/storage/src/`
- `packages/plugin-api/src/workspace.ts`

原则：

- workspace 存装配状态。
- plugin instance 存实例尺寸、区域、位置和配置。
- plugin data 存插件业务数据。
- 插件业务数据不要混入 workspace。

### 修改权限或安全

先读：

- `docs/technical/tabora-plugin-workbench-technical-design.md` 的权限与安全方案。
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
- MVP 使用主网格纵向滚动处理卡片过多，不强行塞进一屏。
- 默认首屏只保证搜索栏和 2-4 个核心卡片优先露出。
- 官方插件也是生态示例，不能绕过平台协议。
- 平台不硬编码具体业务能力。
- 文档和说明优先使用中文。

## 验证

文档整理或文档内容变更后至少运行：

```bash
pnpm check
```

代码变更按 `AGENTS.md` 中的验证要求追加 `pnpm test`、`pnpm build` 或浏览器检查。
