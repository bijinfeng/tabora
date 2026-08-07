# AGENTS.md

本文件约束在 Tabora 仓库中工作的 Codex 和其他通用 coding agent。

## 指令解析

- 用户当前指令优先于仓库指令。
- 修改任何文件前，从仓库根目录开始，沿目标文件目录向下读取所有适用的 `AGENTS.md`；越接近目标文件的规则越具体，冲突时以更近的文件为准。
- 一次任务涉及多个目录时，分别解析每个目标路径的指令链，不能只读其中一个目录的规则。
- `.claude/CLAUDE.md`、`GEMINI.md` 和 `.github/copilot-instructions.md` 只是入口，不替代适用的 `AGENTS.md` 链。

## 项目原则

Tabora 是插件优先的个人工作台平台。

> 具体业务能力默认进入插件；平台只保留可被不同插件和宿主复用的运行机制。

开始较大任务前读 `docs/README.md`，只继续读取与任务匹配的事实源。不要把历史计划、原型或当前实现自动当成最终产品口径。代码与事实源不一致时先查明真实状态，再同步正确一方。

## 开始工作

1. 运行 `git status --short --untracked-files=all`，识别用户或其他 agent 的现有改动。
2. 解析所有目标路径适用的 `AGENTS.md` 链。
3. 读 `docs/README.md` 并选择必要事实源；UI 任务额外读 `DESIGN.md`。
4. 运行 `node scripts/regression-summary.mjs`，记录初始改动分类和建议验证。
5. 修改代码前先搜索现有实现、调用点、公共导出和相邻测试。

搜索文本和文件优先使用 `rg` / `rg --files`。项目工具版本以根 `package.json` 的 `engines` 和 `packageManager` 为准；只使用 pnpm，不使用 npm 或 yarn。

## 复用与最小改动

新增代码前按以下顺序选择：

1. 直接复用已有组件、函数、类型、schema、repository 或 package subpath。
2. 在最接近职责所有者的现有实现上扩展。
3. 仅在当前调用方内部建立私有 helper。
4. 只有存在多个真实消费者，或存在需要长期稳定的明确边界时，才建立公共抽象。

必须遵守：

- 不创建只改名、只转发参数或只包一层调用的 helper / component / adapter。
- 不为假设中的未来需求增加配置项、兼容层、backfill、fallback、adapter 或扩展点。
- 相似 JSX / 分支优先用数据、配置或同一渲染路径表达，不复制整段结构。
- 优先修改已有文件；只有出现新的独立职责时才新增文件，不为降低单文件行数制造大量小文件。
- 替换实现时，在同一改动中迁移调用方，并删除旧实现、无效分支、死代码和过时导出。
- 不做与任务无关的重命名、目录调整、格式化或“顺手重构”。
- 两种方案都满足需求时，选择更短、更直接、依赖更少的一种。

以下是审查信号，不是自动拒绝条件：

- 一个边界清晰的小任务新增超过约 300 行生产代码。
- 新增超过 3 个生产文件。
- 新增 dependency、workspace package 或 public export。

命中任一信号时，实施前重新确认能否复用或收缩范围，并在 PR / final 中写明必要性。生产代码统计不包含测试、文档、快照和生成文件。

## 架构硬边界

- `@tabora/plugin-api` 只放协议、类型和 schema，不放运行时逻辑或业务 UI。
- `@tabora/platform-kernel` 只放插件生命周期、registry、event、runtime context 和 permission 等通用机制，不硬编码具体业务。
- `@tabora/orchestrator` 负责跨插件编排模型，不拥有宿主 UI，也不直接依赖 storage 或 Solid。
- `@tabora/storage` 分开保存 workspace 装配、plugin instance 状态和 plugin data；插件业务数据不能混入 workspace 装配数据。
- `@tabora/workbench-app` 承担跨 shell 的应用组合与宿主编排；builtin 列表和默认 preset 由组合根注入，不在包内反向依赖官方插件集合。
- `@tabora/workbench-shell` 拥有可复用的宿主级视图和容器；插件内容组件不进入这里。
- `@tabora/ui` 只提供业务无关的基础组件和低层可访问 primitive，不依赖 kernel、storage、官方插件或 app，也不拥有工作台宿主容器。
- `@tabora/official-plugins` 是官方插件 pack；`@tabora/builtin-plugin-registry` 才是 shell 默认 builtin 聚合入口。
- app 是组合根。跨 playground、extension、site 或其他 app 复用的逻辑应进入合适 package，不能长期互相 import app 源码。
- 插件只通过 manifest、contribution、registry、runtime context、permission 和 storage contract 接入，不访问宿主内部 store。

安全与故障边界：

- 外部打开必须走 permission bridge，不直接使用 `window.open` 或裸 `_blank` 绕过权限。
- 不为旧 manifest 或旧数据猜测字段、静默补默认值或添加隐式兼容；显式迁移必须有当前需求和 contract。
- 插件失败必须局部化；widget、overlay、search、background 或 theme 的单点失败不能造成整页白屏。
- 新的权限能力采用使用时授权，拒绝路径必须可恢复。

## UI 实现

- UI、token、布局、宿主容器、交互或可访问性任务以 `DESIGN.md` 为事实源。
- `@tabora/ui` 已有的按钮、输入、选择器、菜单、Dialog、Drawer、Toast、CommandPalette 等一律复用；缺少通用能力时先判断是否应在 `@tabora/ui` 扩展。
- 宿主级 `WidgetCardShell`、overlay/settings/toast host、rail、grid 和全局命令面板不放入 `@tabora/ui`。
- 使用 theme token 和 CSS variables；明暗主题均可读，移动端不出现横向滚动。
- 不嵌套卡片，不用 emoji 充当新图标；新图标优先 `lucide-solid`。
- 表单输入有可访问名称；可点击元素有 hover、focus-visible 和 pointer cursor，状态变化不造成布局跳动。

## 测试与验证

新增、修改或删除测试前，先写清它保护的用户可观察行为、协议 contract 或已复现缺陷。

- 不为私有实现细节、单纯 mock 调用次数或无业务意义 snapshot 新增测试。
- 不按 mock、snapshot、文件数或覆盖率数字批量删除测试。
- 测试清理先运行 `pnpm test:inventory`，逐项证明替代覆盖后再删除。
- 协作者调用断言只有在同时证明可观察结果或明确 side effect 时才有价值。
- 协议、权限、数据迁移和已复现缺陷应包含失败路径。

完成前重新运行：

```bash
node scripts/regression-summary.mjs
```

先执行摘要列出的 focused tests，再执行 `commands to run` 的完整要求；focused tests 不能替代全量验证。最低规则和回归层级以 `docs/technical/tabora-regression-baseline.md` 为准：

- 文档或配置变更至少运行 `pnpm check`。
- package / app / plugin 代码变更至少运行 `pnpm test` 和 `pnpm check`。
- 跨包、协议、storage 或发布相关变更追加 `pnpm build`。
- 前端视觉或交互变更启动对应 app，并用浏览器检查关键路径。
- 所有改动运行 `git diff --check`。

不要把未运行的检查写成已通过；失败、已知 runner 噪声和未覆盖项分开报告。

## 文档同步

产品口径、架构边界、协议、数据模型、运行机制、UI 规则、验证方式或实现状态变化时，同步对应长期事实源。

- `docs/README.md` 只登记会反复使用且持续维护的长期事实源。
- 计划、阶段记录、交付证据和 retrospective 默认不进入文档地图。
- 不在 `AGENTS.md` 中复制 PRD、完整目录树、版本号、阶段进度或大段事实源正文。
- 新增仓库规则前确认它同时满足：不容易从代码推断、曾重复造成问题、能够转成具体行动或检查。一次性提醒放在任务或 PR，不永久写入指令文件。

## Git 与交付

- 保留用户和其他 agent 的改动，不回滚、不覆盖、不改无关格式。
- 不使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 不自动 commit 或 push；只有用户明确要求时才执行。
- 删除前确认目标和替代覆盖；删除重要内容后说明范围与可恢复性。

PR 或 final 必须说明：

- 改了什么，以及事实源是否同步。
- 复用了哪些现有实现。
- 是否新增 public export、dependency、package 或生产文件。
- 删除或替换了哪些旧实现。
- 生产 diff 的 `+/-` 规模；命中审查信号时说明为什么仍有必要。
- 实际运行的验证、结果、未运行项和剩余风险。

PR 描述使用 `.github/pull_request_template.md`；交付前可用 `docs/technical/agent-task-template.md` 自检。

<!-- CODEGRAPH_START -->

## CodeGraph

如果仓库根目录存在 `.codegraph/`，且任务需要定位实现、理解调用关系或评估影响，先使用 CodeGraph，再用 `rg` 和源码确认细节。

- MCP 可用时优先使用其查询、节点、caller/callee 和 impact 能力。
- CLI 先运行 `codegraph --help` 确认可用命令；当前常用命令包括 `codegraph query <search>`、`codegraph callers <symbol>`、`codegraph callees <symbol>`、`codegraph impact <symbol>`、`codegraph affected [files...]` 和 `codegraph files`。
- CodeGraph 索引可能落后于 worktree；修改后需要最新关系时先检查 `codegraph status`，必要时运行 `codegraph sync`。

没有 `.codegraph/` 时跳过，是否建立索引由用户决定。

<!-- CODEGRAPH_END -->
