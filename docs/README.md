# Tabora 文档地图

这份文档只回答一个问题：当前任务应该读哪些文档。它不是规格正文，也不重复维护 PRD、设计规范或技术方案。

## Agent 快速路径

开始较大任务时默认只读：

1. 从根目录到目标路径读取完整的 `AGENTS.md` 指令链。
2. `docs/README.md`：本文档，选择后续事实源。
3. 与任务类型匹配的 1-3 个事实源。

一次任务涉及多个目录时，分别解析每个目标路径；不要无差别读取所有目录级指令。

## 目录级 Agent 指令

| 适用路径                     | 额外约束重点                                      |
| ---------------------------- | ------------------------------------------------- |
| `backend/app/AGENTS.md`    | 管理台、API/auth、TanStack Query 和破坏性操作边界 |
| `apps/site/AGENTS.md`        | 官网/文档站、品牌复用、内容和路由边界             |
| `plugins/AGENTS.md`          | manifest、runtime context、permission 和实例隔离  |
| `packages/ui/AGENTS.md`      | primitive、Kobalte、public subpath 和宿主边界     |
| `packages/workbench-app/AGENTS.md` | 跨 shell 组合、状态分层和 builtin 注入边界 |

## 事实源优先级

当文档之间冲突时，按以下顺序判断：

1. 用户当前明确指令。
2. `AGENTS.md` 和本文档的读取规则。
3. 当前事实源：PRD、官方插件设计、`DESIGN.md`、技术方案 V2、回归基准。
4. 当前代码实现和测试。
5. 设计预览（`docs/design/*.html`）。

如果代码和事实源冲突，不要直接假设某一方正确。先查当前实现，再同步对应事实源，并在 final 中说明差异。

## 当前事实源

| 领域             | 当前事实源                                                      | 什么时候读                                                                 |
| ---------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 产品范围         | `docs/product/tabora-plugin-workbench-prd.md`                   | 判断 MVP 范围、用户流程、验收标准、非目标                                  |
| 官方插件         | `docs/product/tabora-official-plugins-design.md`                | 修改官方插件、默认装配、插件交互和插件验收                                 |
| 视觉与交互       | `DESIGN.md`                                                     | 修改 UI、token、布局视觉、组件语义、可访问性                               |
| AI Agent Runtime | `docs/product/tabora-ai-agent-runtime-design.md`                | 判断 AI 基础设施、agent 协议、插件 AI 授权和 MVP 路线                      |
| AI 对话插件      | `docs/product/tabora-ai-chat-plugin-prd.md`                     | 新增或修改 AI 对话插件、多轮对话协议和聊天 UI 时                           |
| 技术架构         | `docs/technical/tabora-plugin-workbench-technical-design-v2.md` | 修改协议、runtime、storage、shell、包边界                                  |
| 回归治理         | `docs/technical/tabora-regression-baseline.md`                  | 每轮迭代后选择回归层级、验证命令、报告模板                                 |
| 测试治理         | `docs/technical/tabora-test-governance.md`                      | 盘点冗余测试、决定测试是否必要、审查测试变更                               |
| Agent 评测       | `docs/technical/tabora-agent-evaluation.md`                     | 在隔离 worktree 中评估 agent 是否遵守范围、测试与交付规范                  |
| Agent 任务模板   | `docs/technical/agent-task-template.md`                         | 需要让 coding agent 按规范拆解任务、形成 PR / final 回归摘要时             |
| Extension 分发   | `docs/technical/extension-github-actions-publish.md`            | 修改扩展 zip、商店提交、发布 workflow                                      |
| FNOS 分发        | `apps/fnos/README.md`                                           | 修改飞牛 manifest、统一网关、生命周期脚本、FPK 构建和安装验证               |
| 账号与数据同步   | `docs/technical/tabora-data-sync-prd.md`                        | 官方账号、同步范围与设置入口（需求与决策）                                 |
| 数据同步实现     | `docs/technical/tabora-data-sync-technical-design.md`           | 后端形态（现为 backend/app）、DB schema、认证、sync 路由、同步引擎与包边界 |

## 按任务选择文档

### 产品判断

读：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`

涉及 AI agent、AI runtime、模型配置、插件 AI 授权或 agent 工具协议时，额外读：

- `docs/product/tabora-ai-agent-runtime-design.md`
- `docs/product/tabora-ai-chat-plugin-prd.md`
- `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 中的 AI Runtime P0 补充

### 技术实现

读：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- `docs/technical/tabora-regression-baseline.md`
- 相关 package / app 源码和测试。

必要时再读：

- PRD 中对应功能章节。
- 官方插件设计中对应插件章节。

### UI / 交互

读：

- `DESIGN.md`
- 相关 Solid 组件、CSS 和测试。

只在需要看原型效果时读：

- `docs/design/workbench-prototype.html`：当前唯一保留的工作台交互原型，集中展示布局、卡片、弹窗、设置和命令面板等设计。
- `docs/design/component-spec.html`：基础组件规范预览。
- `docs/design/composite-spec.html`：官网/文档组合组件规范预览。
- `docs/design/landing.html`、`docs/design/download.html`、`docs/design/docs.html`：官网三页预览。

这些 HTML 是预览资产，不承载规范事实，也不纳入自动格式化、lint 或测试覆盖目标。与 `DESIGN.md` 冲突时以 `DESIGN.md` 为准。

### 官方插件

读：

- `docs/product/tabora-official-plugins-design.md`
- `DESIGN.md`
- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- `packages/official-plugins/src/`
- `packages/builtin-plugin-registry/src/`
- `plugins/official/`、`plugins/community/`

重点确认：

- 官方插件也必须走 manifest、contribution、registry、runtime context、permission 和 storage 协议。
- `@tabora/official-plugins` 是官方插件集合，不决定 shell 默认 builtin 装配。
- `@tabora/builtin-plugin-registry` 才是当前 shell 默认 builtin 聚合入口。

### 协议 / Kernel / Storage / Shell

读：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- `docs/technical/tabora-regression-baseline.md`
- 对应源码：
  - `packages/plugin-api/src/`
  - `packages/platform-kernel/src/`
  - `packages/orchestrator/src/`
  - `packages/storage/src/`
  - `packages/workbench-app/src/`
  - `packages/host-adapters/src/`
  - `packages/workbench-shell/src/`
  - `apps/playground/src/`
  - `apps/extension/entrypoints/newtab/`

重点确认：

- 平台包不引入具体业务能力。
- 插件业务数据不混入 workspace 装配数据。
- 插件不能绕过权限桥直接外部打开。
- playground / extension 的共享逻辑优先进入 package，不长期互相 import app 源码。

### 发布和部署

读：

- `docs/technical/extension-github-actions-publish.md`
- 对应 `.github/workflows/` 文件。

按 `docs/technical/tabora-regression-baseline.md` 的 L8 做发布前回归。

### Agent 协作和交付

读：

- `docs/technical/tabora-regression-baseline.md`
- `docs/technical/tabora-test-governance.md`
- `docs/technical/agent-task-template.md`

重点确认：

- Agent 入口文件只做轻量指引；实际约束来自目标路径适用的 `AGENTS.md` 指令链。
- 写代码前搜索现有实现、调用点和公共导出，按“复用 → 扩展 → 私有 helper → 有真实消费者的公共抽象”选择。
- 完成前运行 `node scripts/regression-summary.mjs`，再按输出选择验证命令。
- 新增、修改或清理测试前运行 `pnpm test:inventory`，候选项逐项确认后才删除。
- 使用 `node scripts/regression-summary.mjs` 输出的 focused tests 先做定向反馈，再运行全量要求的命令。
- PR 会由 `pr-governance` workflow 校验交付字段是否已填写。
- PR 或 final 回复要说明复用证据、生产 diff、新增公开面、事实源同步、验证结果、未覆盖项和风险。

## 文档维护规则

- 只有未来迭代会反复使用、描述当前有效事实且后续会持续维护的长期事实源，才在本文档登记入口和读取条件。
- 计划、设计过程稿、日期审计、阶段记录、实现进度、交付证据和 retrospective 不登记；通过相关 PR、final 或长期事实源按需引用。
- 不在 `AGENTS.md`、本文档、PRD、技术方案之间复制大段同一规则；只保留摘要并链接事实源。
- 修改验证标准、已知债务或 agent 工作流时，同步 `docs/technical/tabora-regression-baseline.md`。

## 验证

文档整理或文档内容变更后至少运行：

```bash
pnpm check
```

代码变更按 `AGENTS.md` 和 `docs/technical/tabora-regression-baseline.md` 追加 `pnpm test`、`pnpm build`、E2E 或浏览器检查。
