# Tabora 工程与回归基准

以 `AGENTS.md` 为完整工作规则；本文只保留不应从代码推断的回归选择与交付底线。开始与结束均运行 `node scripts/regression-summary.mjs`，它以改动路径给出 focused tests 与必须执行的命令。

## 分层选择

| 改动 | 必要验证 |
| --- | --- |
| 文档、配置 | `pnpm check` |
| package、app、plugin | `pnpm test`、`pnpm check` |
| 跨包、协议、storage、发布 | 另加 `pnpm build` |
| 架构边界、测试清理 | 另加 `pnpm check:architecture`、`pnpm test:inventory` |
| UI、布局、交互 | 启动对应 app，在 desktop、tablet、mobile 检查关键路径 |
| extension 发布 | 另加 `pnpm --filter @tabora/extension zip` 与 `zip:firefox` |

`focused tests` 只用于反馈，不能替代 summary 的 `commands to run`。所有改动还要运行 `git diff --check`。

## 架构与安全底线

- `plugin-api` 只放协议/schema，kernel 只放通用运行机制，orchestrator 不依赖 storage 或 Solid；storage 分离 workspace、实例和插件数据。
- app 作为组合根；shell 拥有宿主容器；`ui` 只放业务无关 primitive；官方插件由 builtin registry 聚合。
- 插件不得直接访问宿主 store、storage、全局 overlay 或 `window.open`；权限和 capability 始终在 core / host bridge 强制。
- 不为旧数据或 manifest 猜测字段、补默认值或静默迁移；导入与运行时错误必须可理解且局部化。
- UI 使用 token、复用 `@tabora/ui`、保持可访问名称、focus 样式和移动端无横向滚动。

## 交付

final / PR 说明：事实源是否同步、复用的既有实现、新增 public export / dependency / package / 生产文件、删除或替换的旧实现、生产 diff `+/-`、实际验证与未覆盖风险。安全、权限、数据丢失、白屏、发布构建失败或新架构依赖违规均不能以“已知债务”放行。

测试应保护可观察行为、协议 contract 或已复现问题，不按 mock、snapshot 或文件数批量删除。协议、权限、数据迁移和已复现缺陷需覆盖失败路径。
