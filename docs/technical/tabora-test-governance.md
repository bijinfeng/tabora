# Tabora 测试治理

状态：当前可用

本文件约束测试的新增、重构和清理，目标是以可验证的行为保护为准，而不是测试文件数量、断言数量或覆盖率数字。它不替代 `AGENTS.md`、产品 / 技术事实源或 `docs/technical/tabora-regression-baseline.md` 的回归分层。

## 1. 测试何时必要

新增或修改测试前，agent 必须能写清至少一项：

- 用户可观察行为，例如添加 widget 后布局持久化。
- 跨包协议 contract，例如 manifest schema 拒绝缺失字段。
- 已复现缺陷的最小回归条件。
- 难以由类型检查或架构脚本证明的失败分支、权限拒绝或数据边界。

仅为了增加覆盖率、复刻私有函数实现、验证静态常量，或让 mock 调用次数“看起来被覆盖”，都不是新增测试理由。

## 2. 可接受的 mock 和 snapshot

mock 用于隔离不可控边界，例如网络、存储、时间、宿主权限或昂贵的外部依赖。mock 不是问题本身；但测试应同时断言可观察结果、状态变化、输出或明确的 side effect。

snapshot 只适合稳定且人工审查有效的渲染 / 序列化 contract。不要用大 snapshot 代替对关键状态、错误提示、可访问性或交互的明确断言。

## 3. 存量盘点

运行：

```bash
pnpm test:inventory
```

该命令扫描仓库测试文件并输出三类人工复核候选：

- 三个或更多 module mock。
- 仅断言协作者调用。
- 三个或更多 snapshot 断言。

输出只是风险信号，绝不表示测试无价值，更不会自动删除任何文件。每个候选必须结合所保护的行为标记为：

- 保留：说明它覆盖的边界或 contract。
- 重构：将实现细节断言收敛为可观察行为。
- 删除：确认已有更高层测试或类型 / 架构门禁已经覆盖同一风险。

测试清理必须分批进行，并在每批后运行对应 package 测试和 `pnpm check`。不要把盘点输出作为一次性批量删除依据。

## 4. Agent 交付要求

开始测试相关任务时，使用 `docs/technical/agent-task-template.md` 记录目标行为与测试策略。完成时，PR 或 final 回归摘要必须包含：

- 新增、修改或删除测试的业务理由。
- `pnpm test:inventory` 的候选结论（若涉及测试清理）。
- 已运行的自动化验证和未覆盖的风险。

## 5. 后续自动化边界

当前脚本故意只告警，不在 CI 中因 mock 或 snapshot 数量失败。是否必要取决于业务行为，静态规则无法可靠判断。`.github/workflows/pr-governance.yml` 已校验 PR 是否填写测试决策字段，但不把候选信号直接升级为硬阻断。

该 workflow 使用 `pull_request_target`，只 checkout 基分支并读取 PR event body，因此 PR 不能通过改写自身分支中的校验脚本来放宽规则。它不 checkout 或执行 PR 分支代码。
