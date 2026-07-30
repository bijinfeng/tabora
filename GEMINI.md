# GEMINI.md

本文件是 Gemini CLI 的轻量入口。Tabora 的完整 agent 约束以根目录 `AGENTS.md` 为准，不在这里复制维护。

开始任何代码或文档修改前：

1. 读 `AGENTS.md`。
2. 读 `docs/README.md`，根据任务类型选择事实源。
3. 对代码、配置、CI、测试或发布相关改动，读 `docs/technical/tabora-regression-baseline.md`。

完成前运行 `node scripts/regression-summary.mjs`，按输出执行必要验证，并在最终回复或 PR 描述中说明验证结果、未覆盖项和风险。
