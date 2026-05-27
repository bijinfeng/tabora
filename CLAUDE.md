# CLAUDE.md

Claude Code 在本仓库工作时，必须先阅读并遵守根目录的 `AGENTS.md`。`AGENTS.md` 是项目事实源，包含项目定位、工程结构、MVP 范围、架构边界、插件规则、UI 规则、测试验证和文档同步要求。

本文件只保留 Claude Code 专属补充，避免和 `AGENTS.md` 重复维护。

## Claude Code 专属补充

- 修改文件时使用 Claude Code 的编辑工具；不要用 shell 重定向或脚本拼接文件。
- 搜索文件和文本优先使用 `rg` / `rg --files`。
- 较大任务先读 `AGENTS.md` 中列出的关键文档，再改代码或文档。
- 不要回滚用户或其他 agent 的改动。
- 不要做无关重构。
- 没有用户明确要求时不要自动 commit。
- 文档、计划、PRD、技术方案默认使用中文。

## 验证要求

交付前仍以 `AGENTS.md` 的验证规则为准：

- 文档或配置变更：运行 `pnpm check`。
- package / app 代码变更：运行 `pnpm test` 和 `pnpm check`。
- 跨包或构建相关变更：追加 `pnpm build`。
- 前端视觉或交互变更：启动 playground 并检查关键路径。

如果本文件与 `AGENTS.md` 冲突，以用户当前明确要求优先，其次以更具体的子目录指令优先。
