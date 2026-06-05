# Tabora 文档地图

这份文档只回答一个问题：当前任务应该读哪些文档。它不是规格正文，也不重复维护 PRD、设计规范或技术方案。

## Agent 快速路径

开始较大任务时默认只读：

1. `AGENTS.md`：仓库级硬规则、架构边界、验证要求。
2. `docs/README.md`：本文档，选择后续事实源。
3. 与任务类型匹配的 1-3 个事实源。

不要默认通读 `docs/superpowers/**`、旧技术方案或历史计划。只有在用户明确要求继续某个计划、追溯历史决策或排查实现来源时才读取。

## 事实源优先级

当文档之间冲突时，按以下顺序判断：

1. 用户当前明确指令。
2. `AGENTS.md` 和本文档的读取规则。
3. 当前事实源：PRD、官方插件设计、`DESIGN.md`、技术方案 V2、回归基准。
4. 当前代码实现和测试。
5. 设计预览、阶段规格、历史计划、归档文档。

如果代码和事实源冲突，不要直接假设某一方正确。先查当前实现，再同步对应事实源，并在 final 中说明差异。

## 当前事实源

| 领域            | 当前事实源                                                      | 什么时候读                                     |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| 产品范围        | `docs/product/tabora-plugin-workbench-prd.md`                   | 判断 MVP 范围、用户流程、验收标准、非目标      |
| 官方插件        | `docs/product/tabora-official-plugins-design.md`                | 修改官方插件、默认装配、插件交互和插件验收     |
| 视觉与交互      | `DESIGN.md`                                                     | 修改 UI、token、布局视觉、组件语义、可访问性   |
| 设计实现映射    | `docs/product/tabora-design-system.md`                          | 判断 `DESIGN.md` 如何映射到 `@tabora/ui/theme` |
| 技术架构        | `docs/technical/tabora-plugin-workbench-technical-design-v2.md` | 修改协议、runtime、storage、shell、包边界      |
| 回归治理        | `docs/technical/tabora-regression-baseline.md`                  | 每轮迭代后选择回归层级、验证命令、报告模板     |
| Playground 部署 | `docs/technical/playground-github-actions-deploy.md`            | 修改 playground 发布链路或服务器部署           |
| Extension 分发  | `docs/technical/extension-github-actions-publish.md`            | 修改扩展 zip、商店提交、发布 workflow          |

## 按任务选择文档

### 产品判断

读：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`

不要读：

- 已完成的 `docs/superpowers/plans/**` 作为当前产品范围。
- 旧技术方案 V1 作为当前能力口径。

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

- `docs/design/03-工作台交互原型.html`
- `docs/design/04-官网预览.html`
- `docs/design/05-官网下载.html`

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

## 非默认入口

以下文档保留用于历史追溯或专项规划，不作为当前默认事实源。

| 路径                                                         | 状态                               | 读取条件                              |
| ------------------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| `docs/technical/tabora-plugin-workbench-technical-design.md` | V1 归档技术方案                    | 追溯 V1 设计背景                      |
| `docs/technical/tabora-ui-refactoring-plan.md`               | UI 重构历史方案                    | 追溯 `@tabora/ui` 架构讨论            |
| `docs/technical/tabora-plugin-package-splitting-plan.md`     | 插件拆包历史方案                   | 追溯插件包拆分讨论                    |
| `docs/superpowers/specs/**`                                  | 阶段规格和问题台账                 | 用户指定某个 spec，或需要追溯设计决策 |
| `docs/superpowers/plans/**`                                  | 已完成或阶段性 implementation plan | 用户明确要求继续/审查某个计划         |
| `docs/design/*.html`                                         | 可视原型和静态预览                 | 需要肉眼检查原型或还原页面            |

历史文档如果与当前事实源冲突，以当前事实源和当前代码为准。

## 文档维护规则

文档改动遵循“少事实源、少重复、可路由”的原则：

- 新增长期事实源前，先在本文档登记入口和读取条件。
- 不在 `AGENTS.md`、本文档、PRD、技术方案之间复制大段同一规则；只保留摘要并链接事实源。
- 已完成计划不要继续挂在默认阅读路径里。
- 计划文档完成后，如果产生新的产品、设计、协议、架构或验证事实，必须同步到当前事实源。
- 修改验证标准、已知债务或 agent 工作流时，同步 `docs/technical/tabora-regression-baseline.md`。

## 验证

文档整理或文档内容变更后至少运行：

```bash
pnpm check
```

代码变更按 `AGENTS.md` 和 `docs/technical/tabora-regression-baseline.md` 追加 `pnpm test`、`pnpm build`、E2E 或浏览器检查。
