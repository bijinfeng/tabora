# Backend Admin Agent Rules

本文件适用于 `backend/admin/`，并继承仓库根 `AGENTS.md`。

## 边界

- 这里是 Tabora 同步服务的管理控制台，不承载终端用户的 workbench、插件运行时或官方插件业务。
- 页面通过既有 API/auth client 与服务端交互；不要直连数据库、在浏览器保存服务端密钥，或绕过认证与权限检查。
- 远程数据继续使用现有 TanStack Query/query client 模式。查询 key、失效策略、loading、empty 和 error 状态应明确，不能用页面级临时全局状态复制缓存。
- app 级 `AdminShell`、认证壳和页面容器留在本目录；业务无关的基础控件复用 `@tabora/ui`，不要把 admin 专用容器下沉到 UI package。

## 实现

- 新页面先复用现有 route、shell、table、dialog、form、query 和 API module 模式。
- 领域请求放在对应页面领域的 API module；不要建立无归属的 `utils.ts`、`api.ts` 大杂烩。
- 样式使用 `@tabora/theme` token 和现有 StyleX 约定；图表色板集中维护，不在页面散落硬编码颜色。
- mutation 成功后只失效受影响 query；失败必须保留用户输入并显示可操作错误。
- 管理员破坏性操作必须有明确对象、确认步骤和失败反馈。

## 验证

按根回归摘要执行；本目录代码变更至少运行：

```bash
pnpm --dir backend/admin test
pnpm --dir backend/admin build
pnpm check
```

认证、权限、表单或破坏性操作变化还需浏览器检查对应管理路径。
