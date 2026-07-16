# Tabora 文档地图

这份文档只回答一个问题：当前任务应该读哪些文档。它不是规格正文，也不重复维护 PRD、设计规范或技术方案。

## Agent 快速路径

开始较大任务时默认只读：

1. `AGENTS.md`：仓库级硬规则、架构边界、验证要求。
2. `docs/README.md`：本文档，选择后续事实源。
3. 与任务类型匹配的 1-3 个事实源。

## 事实源优先级

当文档之间冲突时，按以下顺序判断：

1. 用户当前明确指令。
2. `AGENTS.md` 和本文档的读取规则。
3. 当前事实源：PRD、官方插件设计、`DESIGN.md`、技术方案 V2、回归基准。
4. 当前代码实现和测试。
5. 设计预览（`docs/design/*.html`）。

如果代码和事实源冲突，不要直接假设某一方正确。先查当前实现，再同步对应事实源，并在 final 中说明差异。

## 当前事实源

| 领域             | 当前事实源                                                           | 什么时候读                                                              |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 产品范围         | `docs/product/tabora-plugin-workbench-prd.md`                        | 判断 MVP 范围、用户流程、验收标准、非目标                               |
| 官方插件         | `docs/product/tabora-official-plugins-design.md`                     | 修改官方插件、默认装配、插件交互和插件验收                              |
| 视觉与交互       | `DESIGN.md`                                                          | 修改 UI、token、布局视觉、组件语义、可访问性                            |
| 设计实现映射     | `docs/product/tabora-design-system.md`                               | 判断 `DESIGN.md` 如何映射到 `@tabora/ui/theme`                          |
| AI Agent Runtime | `docs/product/tabora-ai-agent-runtime-design.md`                     | 判断 AI 基础设施、agent 协议、插件 AI 授权和 MVP 路线                   |
| 技术架构         | `docs/technical/tabora-plugin-workbench-technical-design-v2.md`      | 修改协议、runtime、storage、shell、包边界                               |
| 架构优化记录     | `docs/technical/tabora-architecture-optimization-recommendations.md` | 审查架构决策或排查已知优化项                                            |
| 回归治理         | `docs/technical/tabora-regression-baseline.md`                       | 每轮迭代后选择回归层级、验证命令、报告模板                              |
| Playground 部署  | `docs/technical/playground-github-actions-deploy.md`                 | 修改 playground 发布链路或服务器部署                                    |
| Extension 分发   | `docs/technical/extension-github-actions-publish.md`                 | 修改扩展 zip、商店提交、发布 workflow                                   |
| 展开 footer 注入 | `docs/technical/tabora-expand-footer-injection-design.md`            | 修改展开弹窗 footer 注入协议或快捷入口 footer                           |
| 账号与数据同步   | `docs/technical/mpz35mfq-16-data-sync-prd.md`                        | 官方账号、多设备同步、同步范围与设置入口（需求与决策）                  |
| 数据同步实现     | `docs/technical/tabora-data-sync-technical-design.md`                | Supabase 后端形态、DB schema、RLS、Edge Function 网关、同步引擎与包边界 |

## 阶段性实施记录

- `docs/superpowers/specs/2026-07-15-directus-extension-refactor-design.md`：Directus Tabora endpoint 扩展重构边界与安全语义。
- `docs/superpowers/plans/2026-07-15-directus-extension-refactor.md`：对应的测试先行实施步骤。
- `docs/superpowers/specs/2026-07-16-frontend-directus-auth-s1-design.md`：账号数据同步转向 Directus，S1 前端登录注册接入设计（独立认证模块 `@tabora/auth` + 账号页邮箱密码接线）。

## 按任务选择文档

### 产品判断

读：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`

涉及 AI agent、AI runtime、模型配置、插件 AI 授权或 agent 工具协议时，额外读：

- `docs/product/tabora-ai-agent-runtime-design.md`
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
- `docs/product/tabora-design-system.md`
- 相关 Solid 组件、CSS 和测试。

只在需要看原型效果时读：

- `docs/design/workbench-prototype.html`：工作台主交互原型（Stream 布局、卡片、命令面板）。
- `docs/design/focus-layout-prototype.html`：Focus 布局原型。
- `docs/design/component-spec.html`：基础组件规范预览。
- `docs/design/composite-spec.html`：官网/文档组合组件规范预览。
- `docs/design/landing.html`、`docs/design/download.html`、`docs/design/docs.html`：官网三页预览。
- `docs/design/添加卡片弹窗原型.html`：添加卡片弹窗交互。
- `docs/design/卡片展开弹窗原型.html`：卡片展开弹窗壳。
- `docs/design/快捷入口卡片原型.html`：快捷入口卡片及其弹窗。
- `docs/design/待办卡片原型.html`：待办卡片及其弹窗。
- `docs/design/天气卡片原型.html`：天气卡片及其弹窗。
- `docs/design/设置窗口原型.html`：设置窗口独立原型，包含 AI 模型提供商、模型配置和插件 AI 授权设置。
- `docs/design/卡片尺寸Dashboard与Focus对比原型.html`：Dashboard 与 Focus 卡片尺寸对照原型。
- `docs/design/股票查看卡片原型.html`：股票查看卡片及其弹窗。
- `docs/design/图片压缩卡片原型.html`：本地图片压缩卡片及其弹窗。
- `docs/design/彩票中奖查询卡片原型.html`：彩票中奖查询、票面识别与核奖弹窗。

这些 HTML 是预览资产，不承载规范事实。与 `DESIGN.md` 冲突时以 `DESIGN.md` 为准。

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

- `docs/technical/playground-github-actions-deploy.md`
- `docs/technical/extension-github-actions-publish.md`
- 对应 `.github/workflows/` 文件。

按 `docs/technical/tabora-regression-baseline.md` 的 L8 做发布前回归。

## 文档维护规则

- 新增长期事实源前，先在本文档登记入口和读取条件。
- 不在 `AGENTS.md`、本文档、PRD、技术方案之间复制大段同一规则；只保留摘要并链接事实源。
- 修改验证标准、已知债务或 agent 工作流时，同步 `docs/technical/tabora-regression-baseline.md`。

## 验证

文档整理或文档内容变更后至少运行：

```bash
pnpm check
```

代码变更按 `AGENTS.md` 和 `docs/technical/tabora-regression-baseline.md` 追加 `pnpm test`、`pnpm build`、E2E 或浏览器检查。
