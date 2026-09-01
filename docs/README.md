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
| `apps/app/AGENTS.md`       | 管理台、API/auth、TanStack Query 和破坏性操作边界 |
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
| 后台模型管理    | `docs/product/tabora-admin-model-management-prd.md`             | 管理云端内置 AI provider、模型目录、凭据与发布状态时                       |
| 技术架构         | `docs/technical/tabora-plugin-workbench-technical-design-v2.md` | 修改协议、runtime、storage、shell、包边界                                  |
| 回归/测试治理/Agent 评测 | `docs/technical/tabora-regression-baseline.md`            | 选择回归层级与验证命令、判断测试是否必要与清理、隔离 worktree 评测 agent   |
| Extension 分发   | `docs/technical/extension-github-actions-publish.md`            | 修改扩展 zip、商店提交、发布 workflow                                      |
| FNOS 分发        | `apps/fnos/README.md`                                           | 修改飞牛 manifest、统一网关、生命周期脚本、FPK 构建和安装验证               |
| 账号与数据同步   | `docs/technical/tabora-data-sync-prd.md`                        | 官方账号、同步范围与设置入口（需求）及后端形态、路由、同步引擎（§13 实现）   |

## 按任务选择文档

上表已把领域映射到事实源；下面只补充事实源之外要一起读的源码路径和易漏的点。

- **产品判断**：读工作台 PRD + 官方插件设计；涉及 AI 时加读 AI runtime / AI chat / 模型管理 PRD 与技术方案的 AI Runtime P0 补充。
- **技术实现 / 协议 / Kernel / Storage / Shell**：读技术方案 V2 + 回归基准，再看对应源码（`packages/plugin-api|platform-kernel|orchestrator|storage|workbench-app|host-adapters|workbench-shell/src/`、`apps/app/src/workbench/`、`apps/extension/entrypoints/newtab/`）。重点：平台包不引入具体业务；插件数据不混入 workspace 装配；插件不绕过权限桥外部打开；app 间共享逻辑进 package 而非互相 import 源码。
- **官方插件**：读官方插件设计 + `DESIGN.md` + 技术方案，再看 `packages/official-plugins|builtin-plugin-registry/src/`、`plugins/official|community/`。重点：官方插件也走 manifest/contribution/registry/runtime context/permission/storage 协议；`@tabora/official-plugins` 是集合，`@tabora/builtin-plugin-registry` 才是 shell 默认 builtin 入口。
- **UI / 交互**：读 `DESIGN.md` + 相关 Solid 组件/CSS/测试。原型预览 `docs/design/*.html`（workbench-prototype、component-spec、composite-spec、landing/download/docs）只是预览资产，不承载规范、不纳入 lint/测试，与 `DESIGN.md` 冲突以后者为准。
- **发布部署**：读 extension 分发文档 + 对应 `.github/workflows/`，按回归基准 L8 做发布前回归。
- **Agent 协作交付**：读回归基准（含测试治理 §12、Agent 评测 §13）。实际约束来自目标路径的 `AGENTS.md` 链；完成前跑 `node scripts/regression-summary.mjs` 选验证命令、清理测试前跑 `pnpm test:inventory`；PR/final 说明复用证据、生产 diff、新增公开面、事实源同步、验证结果、未覆盖项和风险，`pr-governance` workflow 会校验交付字段。

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

代码变更按 `AGENTS.md` 和 `docs/technical/tabora-regression-baseline.md` 追加 `pnpm test`、`pnpm build` 或浏览器检查。
