# GEMINI.md

本文件只是 Gemini CLI 的轻量入口，不复制仓库规则。

开始修改前：

1. 从根目录到每个目标文件的最近祖先目录，读取完整的 `AGENTS.md` 指令链。
2. 读取 `docs/README.md`，只选择与任务匹配的事实源。
3. UI 任务读取 `DESIGN.md`；代码、配置、CI、测试或发布任务读取 `docs/technical/tabora-regression-baseline.md`。
4. 检查 worktree，并在写代码前搜索现有实现、调用点和公共导出。

完成前运行 `node scripts/regression-summary.mjs`，按输出执行验证，并在 final / PR 中填写复用、改动规模、验证和风险证据。
