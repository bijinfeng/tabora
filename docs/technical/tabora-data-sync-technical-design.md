# Tabora 官方账号与数据同步技术方案

版本：V0.5

日期：2026-08-07

状态：当前实现

关联文档：

- 需求与产品决策：`docs/technical/tabora-data-sync-prd.md`
- 平台架构：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归治理：`docs/technical/tabora-regression-baseline.md`
- 后端服务：`backend/app`

## 1. 文档定位

本文档描述当前账号与同步链路的实现边界、HTTP 契约和运行时接线。产品范围与验收以同步 PRD 为准，代码是字段和错误细节的最终依据。

当前后端是仓库内的 `backend/app`（TanStack Start 全栈应用），服务端基于 better-auth 和 Drizzle ORM。开发使用 SQLite，生产可使用 PostgreSQL。本文档不把设备管理、快照、冲突收件箱或 E2EE 描述成已交付能力。

## 2. 当前架构

```text
playground / extension
  |
  | host-adapters: AccountSyncService
  | @tabora/auth: better-auth client
  | @tabora/sync: queue、push、pull、LWW、tombstone
  v
backend/app
  |- /api/auth/*       better-auth 邮箱密码、会话和密码重置
  |- /api/sync/*       登录用户的同步记录 API
  |- /api/attachments  登录用户的附件 API
  `- admin server fn   管理员用户、记录、附件、设置和审计（同应用内 server function）
```

`official.account-sync` 是按宿主选择的 builtin 插件。Playground 组合根始终创建 `AccountSyncService` 并装配该插件，未配置环境变量时使用本地开发后端地址；环境变量只覆盖 API 地址，不决定设置面板是否存在。服务内部持有认证客户端、同步 manager 和同步元数据仓库，插件只获得设置 provider 所需的最小操作面。未装配账号插件的宿主不创建认证存储、同步队列或同步调度。

## 3. 后端路由边界

| 路径 | 访问范围 | 职责 |
| --- | --- | --- |
| `GET /api/health` | 公开 | 健康检查 |
| `GET/POST /api/auth/*` | better-auth | 注册、登录、会话、验证和密码重置 |
| `POST /api/sync/records` | 登录用户 | 批量推送当前态记录 |
| `GET /api/sync/records` | 登录用户 | 按 `since` 增量拉取记录 |
| `/api/attachments/*` | 登录用户 | 文件上传、绑定和访问 |
| 管理员操作（server function） | 管理员 | 用户、同步记录、附件、系统、设置和审计 |

`/api/sync/*` 和 `/api/attachments/*` 从 cookie 或 bearer token 解析会话并写入 `userId`，未登录返回 401。管理端操作是应用内的 admin server function，统一经过授权（未登录 401、非管理员 403）和审计中间件。所有用户记录查询都带 owner 条件。

## 4. 认证与会话

### 4.1 服务端

`backend/app/src/server/auth.ts` 使用 better-auth 的邮箱密码、admin 和 bearer 插件：

- 首个用户可作为管理员完成初始化；后续公开注册由系统设置控制。
- 密码重置和邮箱验证通过服务端邮件队列发送，不把邮件凭据或重置值写入工作台数据。
- bearer token 与 cookie 都可用于用户 API；服务端只把解析后的用户身份交给路由。

### 4.2 客户端

`@tabora/auth` 的 `createBetterAuthClient` 只暴露 `AuthClient`：

- `register`、`login`、`logout`、`getSession`、`getCurrentUser`。
- `requestPasswordReset` 和 `resetPassword`。
- 会话内部使用 `{ jwt, userId?, expiresAt? }`，token 只交给 host-owned 同步服务。
- 网页宿主使用 `localStorage` 适配器，扩展宿主使用 `chrome.storage.local` 适配器。
- `401` 会清除本地 token；网络错误和 HTTP 错误统一映射为 `AuthError`。

通用插件 API、settings host 和普通插件均不能读取 JWT、认证存储、同步 manager 或后端 URL。

## 5. 同步记录模型

同步采用 state-based 当前态模型，服务端保存每个用户的最新记录和 tombstone。支持的 `type` 为：

```text
workspace | pluginInstance | plugin | pluginData
```

客户端推送记录包含：

| 字段 | 说明 |
| --- | --- |
| `type` / `id` | 类型和类型内稳定记录键 |
| `data` | 当前 payload；删除记录可为 `null` |
| `version` | 客户端已知的服务端版本，可为 `null` |
| `client_timestamp` | 客户端写入时间 |
| `device_id` | 设备稳定标识 |
| `deleted` | 是否为 tombstone |

插件数据只有在 manifest 声明 collection 后才允许进入队列。`createChangeDetector` 使用声明的 record key、更新时间和排除字段生成同步记录；未声明的 plugin data 保持本机。

## 6. Push / Pull 契约

### 6.1 Push

`POST /api/sync/records` 接受 1 到 100 条记录。服务端逐条执行：

1. 校验类型、稳定 ID、时间戳、设备 ID 和删除标记。
2. 使用服务端敏感字段过滤器拒绝 token、密钥、密码、私钥和本机路径等字段。
3. 按 `(ownerId, type, id)` 查找已有记录。
4. 客户端版本不匹配，或客户端时间不晚于服务端更新时间时返回 conflict；否则写入新版本。
5. 返回 `accepted`、`conflicts`、`rejected` 和 `server_time`。

冲突采用服务端优先：客户端应用服务端记录并移除已处理的本地队列项；应用失败则保留队列项以便重试。

### 6.2 Pull

`GET /api/sync/records?since=<ISO time>` 按 owner 和服务端更新时间增量返回，单次最多 1000 条。响应包含记录数组和新的 `server_time`。tombstone 返回 `deleted: true`、`data: null`，客户端据此删除本地实体，避免离线设备重新上传旧内容。

### 6.3 错误

`@tabora/sync` 将未登录映射为 `AUTH_FAILED`，401/403 映射为 `AUTH_FAILED`，400 映射为 `INVALID_PAYLOAD`，网络异常映射为 `NETWORK_ERROR`，其他非 2xx 映射为 `SERVER_ERROR`。同步失败不能阻塞本地读写。

## 7. 客户端模块与生命周期

| 模块 | 职责 |
| --- | --- |
| `@tabora/sync/src/changeDetector.ts` | 监听本地数据库变化，按 manifest 生成队列记录 |
| `@tabora/sync/src/localChangeQueue.ts` | 合并、持久化和重试本地队列 |
| `@tabora/sync/src/syncGatewayClient.ts` | 处理 bearer header、push/pull 和响应映射 |
| `@tabora/sync/src/syncEngine.ts` | 执行 push、pull、冲突应用和游标持久化 |
| `@tabora/sync/src/syncManager.ts` | 管理 device ID、监听器和同步调度 |
| `@tabora/host-adapters/src/accountSyncService.ts` | 组装认证、同步和 host storage |

`SyncManager` 的触发点：启动、延迟合并后的本地修改、页面回到前台、网络恢复和设置中的“立即同步”。每次调度先检查会话；未登录直接跳过网络请求。账号插件停用时必须停止监听器和计时器。

## 8. 安全与权限边界

- 服务端认证和 owner 隔离是唯一可信边界，客户端过滤只是额外保护。
- 普通插件只能通过 runtime context 读写本地 plugin data，不能访问同步 API、认证存储或数据库句柄。
- 敏感字段、API key、token、密码、私钥、本机路径、缓存和导出结果不得上传。
- 删除使用 tombstone；服务端不因客户端离线而立即物理删除记录。
- 传输依赖 HTTPS，存储安全由部署环境负责；该方案不是 E2EE。

## 9. 已交付与后续能力

已交付：

- better-auth 账号客户端和 host-owned 会话存储。
- 可选账号插件、声明式账号/同步 settings provider。
- manifest collection 声明、敏感字段过滤、本地变更队列和增量 push/pull。
- owner 隔离、记录级 LWW、冲突服务端优先和 tombstone 删除传播。
- 2 秒延迟同步、网络恢复、页面可见性和手动同步触发。
- 后端用户、同步记录、附件、管理员和审计 API。

后续能力：

- 设备列表、设备撤销和跨设备会话管理。
- 服务端冲突持久化、冲突收件箱和手动合并 UI。
- 自动快照、恢复入口和历史版本浏览。
- 文件容量管理、共享工作区和完整 E2EE。

## 10. 验证入口

| 验证项 | 命令 |
| --- | --- |
| 后端服务 | `pnpm --dir backend/app test` |
| 认证与同步客户端 | `pnpm exec vitest run packages/auth packages/sync` |
| 全量单元测试 | `pnpm test` |
| 格式、lint、类型和架构检查 | `pnpm check` |
| 全仓构建 | `pnpm build` |

修改认证或同步契约时，除定向测试外，还应验证有效会话、owner 隔离、敏感字段拒绝、push、pull、冲突和 tombstone 路径。

## 11. 自托管镜像

仓库根目录的 `Dockerfile` 将 `backend/app` 和 `apps/playground` 构建为一个镜像。运行时只有一个 Node 进程：`/` 由 playground 静态产物响应，`/admin/*` 由管理后台响应，`/api/*` 与 `/_serverFn/*` 保持后端服务端契约。

镜像默认把 SQLite 数据库和本地附件保存到 `/data`；使用 SQLite 时必须为该目录挂载持久化 volume 且仅运行单副本。生产环境可改用 `DATABASE_CLIENT=postgres` 与外部 `DATABASE_URL`，但 `UPLOADS_DIR` 仍需持久化存储。运行镜像前必须设置 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` 和至少 32 位的 `TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY`；`HOST`、`PORT`、`DATABASE_FILE` 和 `UPLOADS_DIR` 已提供容器默认值。
