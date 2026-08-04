# Tabora 官方账号与数据同步技术方案

版本：V0.4

日期：2026-08-04

状态：当前实现事实源

关联文档：

- 需求与产品决策：`docs/technical/tabora-data-sync-prd.md`
- 平台架构：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归治理：`docs/technical/tabora-regression-baseline.md`
- 后端项目：`backend/strapi/README.md`

## 1. 文档定位

本文档描述当前已落地的官方账号与同步实现。同步 PRD 负责产品范围、用户流程和验收；本文档负责 Strapi、客户端同步包、运行时接线与 API 契约。

代码是实现细节的最终依据。文档不将规划中的设备管理、快照、冲突收件箱或 E2EE 描述成已经交付的能力。

## 2. 当前实现概览

```text
playground / extension
  |
  | @tabora/auth: Strapi JWT 会话
  | @tabora/sync: 本地变更队列、push、pull、合并
  v
Strapi 5
  |- users-permissions: 邮箱密码认证和 JWT
  |- api::sync.sync: 唯一同步 controller
  |- api::synced-record.synced-record: 当前态记录
  `- SQLite（开发）/ PostgreSQL（生产）
```

`official.account-sync` 是可选 builtin 插件。playground 仅在配置云端 API 时把它加入 builtin 装配；插件自身创建认证客户端和 `SyncManager`，并在 activation 时启动同步、注册账号与同步设置面板。FNOS 不装配该插件，工作台 bootstrap 不创建认证客户端、同步队列或同步定时器，改由本地 Fastify 服务持久化数据。

## 3. 认证与会话

### 3.1 后端

Strapi 的 users-permissions 插件承载用户与 JWT。客户端使用以下端点：

| 操作         | HTTP 端点                        |
| ------------ | -------------------------------- |
| 注册         | `POST /api/auth/local/register`  |
| 登录         | `POST /api/auth/local`           |
| 当前用户     | `GET /api/users/me`              |
| 请求重置密码 | `POST /api/auth/forgot-password` |
| 重置密码     | `POST /api/auth/reset-password`  |

`backend/strapi/config/plugins.ts` 配置 JWT 有效期。Strapi 在同步 controller 中把已验证用户提供为 `ctx.state.user`。

密码重置使用 Strapi email provider 发送链接，浏览器只将邮件中的 `code` 交给 `POST /api/auth/reset-password`，不从 API 响应或同步数据中暴露重置码。开发环境默认通过 Mailpit（SMTP `127.0.0.1:1025`，Web UI `http://localhost:8025`）捕获邮件；部署环境必须配置受支持的正式 provider 及其凭据。

### 3.2 客户端

`@tabora/auth` 的 `createStrapiAuthClient` 保存 `{ jwt, userId?, expiresAt? }`。`expiresAt` 由 JWT 的 `exp` 解析而来，解析失败不会阻断会话保存。

不同宿主使用对应存储适配器：扩展使用 `chrome.storage`，网页宿主使用 `localStorage`。退出登录只删除本地会话；收到 `401` 的当前用户请求同样清除本地会话。

用户 JWT 只在账号插件内部提供给同步网关客户端。通用插件 API 不暴露 JWT、认证 client 或后端 URL；`SettingsPanelViewProps.host` 也不暴露 `auth/sync` 特例。

### 3.3 账号与同步设置 provider

`official.account-sync` 在 manifest 中声明两个 `content.kind: "schema"` 的 settings panel，激活时通过受作用域约束的 provider registry 注册：

| Provider | 拥有的业务能力 |
| -------- | ------------------ |
| `official.account-sync.account.provider` | 会话恢复、登录、注册、退出、找回和重置密码的状态机、校验与 actions |
| `official.account-sync.sync.provider` | 最近同步状态、手动同步 action 和 `lastSyncAt` 持久化 |

provider 只返回语义页面模型，官方 `SettingsSchemaRenderer` 使用 `@tabora/ui` 渲染。运行时 schema 严格拒绝 CSS/class/style 字段；password 字段必须为 `ephemeral` 且不能由 provider 返回默认值。renderer 在每次 action 后销毁当前表单值，不写入 storage、日志或快照。

## 4. 同步数据模型与 API 契约

### 4.1 记录模型

服务端接受并保存以下记录类型：

```text
workspace | pluginInstance | plugin | pluginData
```

每条记录在服务端关联 owner，并包含以下语义字段：

| 字段                | 含义               |
| ------------------- | ------------------ |
| `type`              | 记录类型           |
| `id`                | 类型内稳定记录键   |
| `data`              | 当前有效负载       |
| `version`           | 服务端版本号       |
| `client_timestamp`  | 客户端写入时间     |
| `device_id`         | 最后写入设备标识   |
| `deleted`           | tombstone 删除标记 |
| `record_updated_at` | 服务端记录更新时间 |

数据库 content type 使用 `owner` relation 隔离用户记录。开发环境默认使用 SQLite，生产环境使用 PostgreSQL。客户端生成并在本地 `syncMeta` 中缓存 `deviceId`，首次 push 后跨重启复用。

### 4.2 Push

`POST /api/sync/records` 接收最多 100 条记录的数组。客户端将本地变更队列中的对象序列化为：

```json
[
  {
    "type": "pluginData",
    "id": "official.widget.todo:task-42",
    "data": { "title": "完成文档整理" },
    "version": null,
    "client_timestamp": "2026-07-29T10:00:00.000Z",
    "device_id": "f95f289a-13bb-4de9-8a9f-e7ef48d4477d",
    "deleted": false
  }
]
```

成功响应位于 Strapi 的 `data` 包装中，并包含 `accepted`、`conflicts`、`rejected` 和 `server_time`。已有记录在客户端版本不匹配，或客户端时间不晚于服务端更新时间时视为冲突；冲突响应携带服务端版本、数据、更新时间和设备标识。

### 4.3 Pull

`GET /api/sync/records` 接受可选的 `since=<ISO 时间>`。首次拉取不带游标；后续请求使用上次响应的 `server_time`。响应返回记录数组和新的 `server_time`，一次最多返回 1000 条记录。

服务端对已删除记录返回 `deleted: true` 与 `data: null`。客户端据此删除本地实体而不是重新上传旧内容，保证 tombstone 能跨设备传播。

### 4.4 合并与失败语义

同步为 state-based 当前态模型，不保存云端事件流。服务端以记录级 last-write-wins 判定写入；客户端遇到冲突时采用服务端返回的记录并将本地队列项出队。若应用服务端内容失败，队列项保留以便重试。

客户端将 `401` 和 Strapi action 授权层对匿名请求返回的 `403` 映射为 `AUTH_FAILED`，`400` 映射为 `INVALID_PAYLOAD`，网络异常映射为 `NETWORK_ERROR`，其他非成功状态映射为 `SERVER_ERROR`。这些错误不会影响本地数据读写。

## 5. 客户端同步引擎与运行时接线

`@tabora/sync` 由以下部分组成：

| 模块                        | 职责                                        |
| --------------------------- | ------------------------------------------- |
| `createChangeDetector`      | 监听本地数据库变更并创建待上传记录          |
| `createLocalChangeQueue`    | 读写持久化的本地同步队列                    |
| `createStrapiGatewayClient` | 处理认证头、push/pull 请求和错误归一        |
| `createSyncEngine`          | 执行 push、pull、冲突应用和游标持久化       |
| `createSyncManager`         | 创建稳定 `deviceId`、启动变更监听并调度同步 |

账号插件的 lifecycle 是同步调度的唯一入口：插件未装配、未激活或被禁用时，不会启动 change detector、浏览器事件监听或 2 秒同步计时器。

`SyncManager` 的触发规则：

1. 启动后启动变更监听并安排一次同步。
2. 本地变更经 2 秒延迟合并后同步。
3. 页面从后台回到前台时同步。
4. 浏览器恢复网络连接时同步。
5. 设置界面的“立即同步”操作调用同一调度入口。

调度前检查会话；未登录直接跳过，不创建网络请求。运行时仅记录错误，不让同步异常破坏 workbench 初始化。

## 6. 安全与权限边界

- 同步 controller 要求 `ctx.state.user.id`。无 JWT 时，users-permissions action 授权层通常在 controller 前返回 `403`；若请求进入 controller 但没有用户则返回 `401`。客户端将两者统一视为认证失败。
- 查询和写入同时按 owner 过滤；用户不能读取或修改其他用户的记录。
- 服务端使用敏感字段过滤，拒绝或过滤 API key、token、密码、私钥和文件路径等危险字段。客户端过滤不是唯一防线。
- 插件只使用 runtime context 暴露的本地 storage 能力；它们不能读取 JWT、认证存储、同步队列或同步端点。
- 删除使用 tombstone，而不是立即物理删除，避免离线设备重新同步时恢复旧记录。

平台依赖 HTTPS 保护传输，并由部署环境保护持久化存储。由于平台仍可在服务端处理有效负载，该实现不是端到端加密。

## 7. 已交付与后续能力

### 7.1 已交付

- Strapi 邮箱密码认证与纯 JWT 会话。
- 认证客户端、宿主存储适配和可选账号插件接线。
- 账号/同步声明式 settings provider、官方安全 renderer 与敏感表单字段约束。
- 同步记录 content type、owner 隔离、敏感字段过滤（排除设计 tokens）、push/pull controller。
- 本地变更检测（带 guard 抑制远程写入反向入队）、持久化队列、增量拉取、服务端优先冲突处理与 tombstone。
- 同步 manager 调度：2s 防抖、在线恢复、页面可见性触发、手动立即同步。
- 同步相关的单元与契约测试。

### 7.2 后续能力

- 用户可见的设备列表、命名、撤销和跨设备会话管理。
- 服务端持久化冲突记录、冲突收件箱和手动合并 UI。
- 自动快照、恢复入口和历史版本浏览。
- 插件声明的细粒度字段合并器。
- 文件原件同步、容量管理、团队协作和完整 E2EE。

## 8. 验证入口

| 验证项                     | 命令                             |
| -------------------------- | -------------------------------- |
| Strapi 契约与敏感字段测试  | `pnpm --dir backend/strapi test` |
| 认证与同步客户端测试       | `pnpm test`                      |
| 格式、lint、类型和架构检查 | `pnpm check`                     |
| 全仓构建                   | `pnpm build`                     |

修改认证或同步契约时，还应启动 Strapi 并以有效 JWT 验证注册、登录、push、pull、owner 隔离和 tombstone 路径。
