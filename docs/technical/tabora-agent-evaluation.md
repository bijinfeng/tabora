# Tabora Agent 评测

状态：当前可用

本评测用于检查 coding agent 是否把 Tabora 的架构、测试和交付规则落实到真实改动中。它不按新增测试数量、解释篇幅或代码量评分。

## 1. 评测包

用例定义在 `tooling/agent-evals/cases.json`，运行以下命令检查结构：

```bash
pnpm agent:eval:check
```

当前用例覆盖：

- 仅文档的事实源同步，防止无关代码和无价值测试。
- 插件协议 contract，防止旧 manifest 的隐式兼容和无失败用例的 schema 改动。
- 宿主 UI 交互，防止绕过 `@tabora/ui`、只写 snapshot 或跳过浏览器验证。
- 测试清理，防止按 mock 数量批量删除。

## 2. 执行流程

1. 从干净基线创建隔离 worktree，每次只运行一个 case。
2. 将 case 的 `prompt` 原样交给被测 agent，不额外提示实现策略。
3. 限制改动在 `allowedPaths`；超出范围必须在报告中有明确且必要的理由。
4. 运行 `requiredEvidence` 中的命令，保存输出、diff 和 agent 的 final / PR 描述。
5. 按 `scoring` 逐项给分；若命中 `forbiddenOutcomes`，本 case 直接不通过。

每个 case 的分数总和为 10。建议通过条件：8 分及以上、没有禁止行为、没有遗漏要求的验证证据。任何单项为 0 分时，复盘该项的事实源、提示词或工具约束，再重新运行相同 case；不要只提高分数阈值。

## 3. 证据与边界

评测结果至少记录：case id、agent 使用的事实源、实际改动路径、自动化验证、浏览器检查（若适用）、得分、禁止行为检查和未覆盖风险。

该评测包验证用例结构，不直接启动或模拟外部 agent。不同 agent 的执行必须在独立 worktree 中进行，避免一个评测样本污染另一个样本或主工作区。
