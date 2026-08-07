# Tabora 官方账号与数据同步技术方案

版本：V0.5 ｜ 状态：当前实现事实源

关联：需求见 `docs/technical/tabora-data-sync-prd.md`；后端见 `backend/server`。代码为实现细节的最终依据；本文不把规划中的设备管理、快照、冲突收件箱、E2EE 当作已交付能力。

## 1. 架构概览

```text
playground / extension
  | @tabora/auth: better-auth 会话（bearer token）
  | @tabora/sync: 本地变更队列、push、pull、合并
  v
backend/server（Hono + better-auth + Drizzle）
  |- /api/auth/*    邮箱密码认证与会话
  |- /api/sync/*    同步 push/pull，owner 隔离
  `- SQLite（开发）/ PostgreSQL（生产）
```

`official.account-sync` 是可选 builtin 插件。playground / extension 仅在显式配置云端 API 时装配它；组合根创建 `AccountSyncService`（认证客户端、`SyncManager`、sync meta port）注入插件，插件在激活时启停服务并注册账号/同步设置面板。FNOS 不装配该插件。

## 2. 认证与会话

后端用 better-auth 承载用户与会话，认证端点统一在 `/api/auth/*`（注册、登录、会话、密码重置）。密码重置发送链接邮件，浏览器只将 token 交回重置端点，不在响应或同步数据中暴露。开发环境用 Mailpit（SMTP `127.0.0.1:1025`，UI `http://localhost:8025`）捕获邮件；生产须配置正式 provider。

客户端 `@tabora/auth` 的 `createBetterAuthClient` 保存会话 `{ jwt }`（bearer token）；扩展用 `chrome.storage`，网页用 `localStorage`。退出或收到 `401` 均清除本地会话。用户 token 仅在 host-owned `AccountSyncService` 内部提供给同步网关客户端；通用插件 API 不暴露 token、认证 client 或后端 URL。

`official.account-sync` 声明两个 `content.kind: "schema"` 设置面板，经受作用域约束的 provider registry 注册：`account.provider`（登录/注册/退出/找回重置状态机）与 `sync.provider`（同步状态、手动同步、`lastSyncAt`）。provider 只返回语义页面模型，官方 `SettingsSchemaRenderer` 用 `@tabora/ui` 渲染；运行时 schema 拒绝 CSS/class/style，password 字段必须 `ephemeral` 且无默认值，renderer 每次 action 后销毁表单值。

## 3. 同步数据模型与 API 契约

### 3.1 记录模型

服务端接受并保存 `workspace | pluginInstance | plugin | pluginData` 四类记录，每条按 `owner` 隔离，含语义字段：`type`、`id`（类型内稳定键）、`data`、`version`、`client_timestamp`、`device_id`、`deleted`（tombstone）、`record_updated_at`。客户端在本地 `syncMeta` 缓存 `deviceId`，跨重启复用。

### 3.2 Push / Pull

- **Push** `POST /api/sync/records`：最多 100 条记录数组。响应 `{ data: { accepted, conflicts, rejected, server_time } }`。已有记录在 `version` 不匹配、或 `client_timestamp` 不晚于服务端更新时间时判为冲突，冲突项携带服务端版本、数据、更新时间与设备标识。
- **Pull** `GET /api/sync/records?since=<ISO>`：首次不带游标，之后用上次 `server_time`；一次最多 1000 条。响应 `{ data: { records, server_time } }`。已删除记录返回 `deleted: true` 与 `data: null`，客户端据此删本地实体，保证 tombstone 跨设备传播。

### 3.3 合并与失败语义

state-based 当前态模型，不保存云端事件流；记录级 last-write-wins。客户端遇冲突采用服务端记录并出队；应用服务端内容失败则保留队列项重试。客户端将 `401/403` 映射为 `AUTH_FAILED`、`400` 为 `INVALID_PAYLOAD`、网络异常为 `NETWORK_ERROR`、其余非成功为 `SERVER_ERROR`，均不影响本地读写。

## 4. 客户端同步引擎

`@tabora/sync` 组成：`createChangeDetector`（监听本地变更、生成待上传记录）、`createLocalChangeQueue`（持久化队列）、`createSyncGatewayClient`（认证头、push/pull、错误归一）、`createSyncEngine`（push/pull/冲突应用/游标持久化）、`createSyncManager`（稳定 `deviceId`、启动监听、调度同步）。

账号插件 lifecycle 是同步调度的唯一入口——未装配/未激活/被禁用时不启动 change detector、事件监听或计时器。`SyncManager` 触发时机：启动后一次、本地变更经 2s 防抖后、前台恢复、网络恢复、设置界面「立即同步」。调度前检查会话，未登录直接跳过；运行时仅记录错误，不破坏 workbench 初始化。

## 5. 安全与权限边界

- 同步端点要求登录用户；无有效会话返回 `401/403`，客户端统一视为认证失败。
- 查询与写入均按 owner 过滤，用户不能读写他人记录。
- 服务端敏感字段过滤，拒绝 API key、token、密码、私钥、文件路径等；客户端过滤不是唯一防线。
- 插件只用 runtime context 的本地 storage，不能读取 token、认证存储、同步队列或端点。
- 删除用 tombstone 而非物理删除，避免离线设备重同步时恢复旧记录。
- 依赖 HTTPS 保护传输、部署环境保护存储；平台可处理有效负载，故非 E2EE。

## 6. 后续能力

设备列表/命名/撤销与跨设备会话管理、服务端冲突记录与合并 UI、自动快照与历史浏览、插件声明的字段合并器、文件原件同步与容量管理、团队协作、完整 E2EE。

## 7. 验证

| 验证项                     | 命令                    |
| -------------------------- | ----------------------- |
| 服务端契约与敏感字段测试   | `pnpm --dir backend/server test` |
| 认证与同步客户端测试       | `pnpm test`             |
| 格式、lint、类型、架构     | `pnpm check`            |
| 全仓构建                   | `pnpm build`            |

修改认证或同步契约时，应启动 `backend/server` 并以有效会话验证注册、登录、push、pull、owner 隔离与 tombstone 路径。
