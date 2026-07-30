# Tabora Copilot Instructions

本文件是 GitHub Copilot 的轻量入口。Tabora 的完整 agent 约束以根目录 `AGENTS.md` 为准，不在这里复制维护。

## 必读路径

开始修改前：

1. 读 `AGENTS.md`。
2. 读 `docs/README.md`，按任务类型选择事实源。
3. 需要判断回归范围时读 `docs/technical/tabora-regression-baseline.md`。

## 工作要求

- 修改前检查 `git status --short --untracked-files=all`。
- 优先复用现有 package、helper 和 `@tabora/ui` 组件，不新增平行实现。
- 如果修改产品口径、架构边界、UI 规则、协议、数据模型或验证方式，同步对应事实源。
- 完成前运行 `node scripts/regression-summary.mjs`，再按输出选择验证命令。
- 摘要列出 focused tests 时先运行它们，但仍须完成要求的全量验证。
- PR 描述必须填写 `.github/pull_request_template.md` 中的 Regression Baseline 信息。
