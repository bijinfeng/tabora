# Backend App Agent Rules

本文件适用于 `backend/app/`，并继承仓库根 `AGENTS.md`。

## 边界

- 这里是 Tabora 同步服务的后端与管理控制台（TanStack Start 全栈应用），不承载终端用户的 workbench、插件运行时或官方插件业务。
- 服务端业务逻辑（db、auth、email、attachments、sync、guards、schema）在 `src/server/`；HTTP API（`/api/auth/*`、`/api/sync/*`、`/api/attachments/*`）在 `src/routes/api/`。
- 管理端操作是 `src/server/admin/` 下的 admin server function：页面通过 server function 与服务端交互；不在浏览器端直连数据库、保存服务端密钥，或绕过认证与权限检查。
- 每个 admin server function 必须挂 `adminAuthMiddleware`；写操作额外挂 `auditAdminAction`。授权与审计由中间件保证，路由 `beforeLoad` 只拦页面导航、拦不住 server function 调用。
- 远程数据继续使用现有 TanStack Query/query client 模式。查询 key、失效策略、loading、empty 和 error 状态应明确，不能用页面级临时全局状态复制缓存。
- app 级 `AdminShell`、认证壳、页面容器和 admin server function 留在本目录；业务无关的基础控件复用 `@tabora/ui`，不要把 admin 专用容器下沉到 UI package。

## 实现

- 新页面先复用现有 route、shell、table、dialog、form、query 和 server function 模式。
- 领域请求放在对应页面领域的文件；admin server function 按领域放在 `src/server/admin/` 对应模块。不要建立无归属的 `utils.ts`、`api.ts` 大杂烩。
- 样式使用 `@tabora/theme` token 和现有 StyleX 约定；图表色板集中维护，不在页面散落硬编码颜色。
- mutation 成功后只失效受影响 query；失败必须保留用户输入并显示可操作错误。
- 管理员破坏性操作必须有明确对象、确认步骤和失败反馈。
- 审计日志只存脱敏数据；任何写入 `audit_log.details` 的内容必须先过 `redactSensitive`。

## 验证

按根回归摘要执行；本目录代码变更至少运行：

```bash
pnpm --dir backend/app test
pnpm --dir backend/app build
pnpm check
```

认证、权限、表单或破坏性操作变化还需浏览器检查对应管理路径，并验证未登录/非管理员调用 server function 被拒绝。
