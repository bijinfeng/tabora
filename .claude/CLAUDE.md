# Tabora Claude Code Instructions

本文件只是 Claude Code 的轻量入口，不复制仓库规则。

开始修改前：

1. 从根目录到每个目标文件的最近祖先目录，读取完整的 `AGENTS.md` 指令链。
2. 读取 `docs/README.md`，只选择与任务匹配的事实源。
3. UI 任务读取 `DESIGN.md`；代码、配置、CI、测试或发布任务读取 `docs/technical/tabora-regression-baseline.md`。
4. 检查 worktree，并在写代码前搜索现有实现、调用点和公共导出。

完成前运行 `node scripts/regression-summary.mjs`，按输出执行验证，并在 final / PR 中填写复用、改动规模、验证和风险证据。

<!-- CODEGRAPH_START -->

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
