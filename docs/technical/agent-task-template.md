# Tabora Agent 任务模板

状态：当前可用

本模板用于让 coding agent 在开始、实施和交付时把规范转成可审计动作。它不是新的事实源；事实源仍以 `AGENTS.md`、`docs/README.md` 和任务匹配的产品 / 设计 / 技术 / 回归文档为准。

## 开始前

```md
## Task Intake

用户请求：

改动类型：
- docs / protocol / kernel / storage / orchestrator / shell / plugin / ui / quality / release

预计影响路径：

不触碰范围：

需要读取的事实源：
- AGENTS.md
- docs/README.md
-

真实风险：

测试策略：
- 需要保护的行为 / contract / 已复现缺陷：
- 需要先失败的回归测试：
- 不新增测试的原因：
- 测试清理候选和逐项结论（保留 / 重构 / 删除）：
```

## 修改中

```md
## Implementation Notes

已确认的现有模式：

正在修改的边界：

需要同步的事实源：

需要脚本化的新规则：
```

## 完成前

先运行：

```bash
node scripts/regression-summary.mjs
```

再按输出和 `docs/technical/tabora-regression-baseline.md` 选择验证命令。

如果摘要输出了 `focused tests before the full suite`，先运行这些命令取得定向反馈；它们不能替代摘要要求的全量命令。

```md
## Regression Baseline

改动类型：

事实源同步：
- PRD：
- 官方插件设计：
- DESIGN：
- 技术方案：
- 回归基准：
- docs/README：

自动化验证：
- pnpm test:inventory：
- node scripts/regression-summary.mjs：
- pnpm check:architecture：
- pnpm quality：
- pnpm check：
- pnpm test：
- pnpm build：
- pnpm test:e2e：

人工 / 浏览器冒烟：

风险和债务：

结论：
- pass / pass with known debt / blocked
```
