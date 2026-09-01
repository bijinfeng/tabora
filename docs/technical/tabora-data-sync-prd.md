# Tabora 官方账号与数据同步

本文件是账号与数据同步的单一事实源：§1–§12 为需求与产品决策，§13 起为架构边界、HTTP 契约和信任边界。字段、方法名和错误细节以代码为最终依据（客户端模块见 `packages/sync/src` 各文件头注释，服务端见 `apps/app/src/server` 的 auth / sync / attachment 路由）。

关联文档：

- 工作台产品范围：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件与默认装配：`docs/product/tabora-official-plugins-design.md`
- 平台架构：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 工作台设计事实源：`DESIGN.md`

## 1. 产品定位

官方账号与数据同步由可选的官方 `official.account-sync` 插件提供，不是默认工作台的一部分。它让需要云端能力的宿主在多台设备之间延续工作区和已声明的插件数据，同时让纯本地宿主保持最小、离线可用的工作台。

账号插件负责账号与同步设置面板，并在激活期间启动或停止由宿主注入的账号同步服务。宿主组合根负责创建认证客户端和同步 manager；插件、普通插件 API 和 settings host 都不会得到数据库句柄、JWT 或云端 URL。平台与同步包仍负责离线队列、敏感字段过滤和记录合并。其他插件只声明可同步的数据集合，不能直接访问账号凭据或同步服务。

## 2. 已确认决策

| 主题     | 决策                                                      |
| -------- | --------------------------------------------------------- |
| 账号     | 官方邮箱密码注册、登录、退出、会话恢复和密码重置          |
| 本地模式 | 未登录或同步不可用时继续使用本地工作台                    |
| 产品入口 | 设置中心的账号与数据同步入口，不在工作台放同步卡片        |
| 装配方式 | `official.account-sync` 按宿主装配；Playground 始终装配并默认指向本地后端，FNOS 不装配 |
| 后端     | `apps/app`（better-auth + Drizzle），提供认证、同步和附件 API |
| 同步模型 | state-based 当前态；每条云端记录有更新时间和 tombstone    |
| 访问边界 | 客户端仅通过同步 API，不直连云端数据表                    |
| 合并     | 记录级 last-write-wins；无法自动处理的冲突保留为后续能力  |
| 隐私     | TLS、平台托管存储加密和敏感字段永不上传；不是 E2EE        |
| 插件边界 | manifest 显式声明同步集合；插件不接触 JWT 或云端接口      |

## 3. 目标与非目标

### 3.1 目标

- 提供官方账号注册、登录、退出、会话恢复和密码重置。
- 在已装配账号插件且账号可用时同步工作区、插件记录、插件实例和声明可同步的插件数据。
- 未登录时保持本地模式，不阻塞工作台打开和编辑。
- 在本地修改、应用启动、应用回到前台、网络恢复和用户主动操作后安排同步。
- 通过服务端字段过滤排除密钥、本机路径、缓存和临时内容。
- 通过 tombstone 传播删除，避免多设备之间已删除记录复活。
- 让设置入口能够说明同步状态、范围和最近同步时间。

### 3.2 非目标

- 完整端到端加密。
- 共享工作区、团队、实时协作或多人编辑。
- 插件自建同步协议或直接调用云端接口。
- 同步 API Key、访问令牌、本机路径、文件原件、缓存、临时图像或导出结果。
- 在工作台首屏显示同步状态卡片。
- 容量计费、企业审计或设备策略控制台。

## 4. 用户和职责边界

### 4.1 普通用户

用户需要知道自己是否处于本地模式、当前账号是否有效、哪些内容会同步、最近同步是否成功，以及如何主动触发同步。同步异常不得阻塞本地工作台。

### 4.2 插件开发者

普通插件开发者只声明可同步集合的稳定主键、更新时间、合并策略和排除字段。插件通过本地 storage 读写业务数据；账号插件与同步基础包统一处理会话、队列、网络请求、敏感过滤和合并。

### 4.3 平台维护者

平台维护者维护同步服务、字段过滤规则、可观测性和数据恢复策略。用户 JWT 只在官方账号插件和同步网关内部使用，永不作为通用插件 API 提供。

## 5. 账号与本地模式

账号插件提供邮箱和密码的注册、登录、退出及密码重置。登录成功后，插件服务持久化会话并恢复同步调度；退出仅清除本地会话，不删除本地工作台数据。

未登录、JWT 失效或网络不可用时，已装配插件的工作台进入本地模式：本地编辑照常完成，待同步变更保留在本地队列，直到账号和网络恢复。未装配该插件的宿主（例如 FNOS）不创建认证存储、同步队列或同步调度，数据只保存在宿主本地数据库。

## 6. 同步范围

### 6.1 Core 默认对象

| 对象     | 说明                                       |
| -------- | ------------------------------------------ |
| 工作区   | 工作区身份、名称、布局和外观选择           |
| 插件记录 | 插件身份、版本、启用状态和权限摘要         |
| 插件实例 | 插件、贡献、区域、尺寸、网格位置和实例配置 |
| 插件数据 | 已获准同步的实例或插件业务数据             |

### 6.2 插件数据声明

插件业务数据默认仅保留本机。需要同步时，manifest 声明 collection ID、稳定记录主键、更新时间、合并策略、schema version 和排除字段。每个 collection record 都独立保存业务 record ID 与 payload；平台不把任意 storage key 或展示名称当作同步记录标识。

```json
{
  "id": "official.widget.todo",
  "permissions": ["storage"],
  "sync": {
    "collections": [
      {
        "id": "tasks",
        "recordKey": "id",
        "updatedAt": "updatedAt",
        "merge": "lww",
        "schemaVersion": 1,
        "excludedFields": ["localReminderId"]
      }
    ]
  }
}
```

不参与同步的典型数据包括 API Key、token、密码、本机绝对路径、文件原件、缓存、临时图像、导出结果和一次性处理过程数据。

## 7. 同步语义

云端保存每个可同步实体的当前状态，而不是事件流。每条记录使用稳定键、服务端更新时间和删除标记表示当前状态。

- 本地修改先进入队列，短延迟合并后上传。
- 拉取按上次成功同步的游标获取增量。
- 同一记录采用记录级 last-write-wins；服务端时间更新更晚的版本胜出。
- 删除写入 tombstone，不物理删除，以便其他设备收到删除结果。
- 同步失败保留本地变更，并在后续触发点重试。

## 8. 设置中心

账号与数据同步入口应提供以下信息，不做复杂控制台：

1. 账号状态：本地模式、已登录或会话失效。
2. 同步状态：最近同步时间、错误摘要和立即同步操作。
3. 同步范围：core 对象、已声明的插件数据和敏感数据排除提示。
4. 隐私说明：传输受 TLS 保护，平台托管存储受保护，敏感字段不上传；不承诺 E2EE。

页面布局使用 `settings-panel` 声明式 schema：账号插件拥有会话恢复、登录、注册、密码重置和同步 actions，宿主默认 renderer 只负责统一样式与可访问性。密码与重置码是短生命表单值，不进入 workspace/pluginData、日志或快照。

## 9. 安全与隐私

敏感字段过滤是核心隐私边界，必须在服务端执行，客户端过滤只能作为额外保护。插件不能读取或写入官方会话，也不能绕过 core 调用同步接口。

用户可见文案必须准确使用“传输和存储受保护，敏感数据不上传”。不得使用“所有数据端到端加密”或等价的夸大承诺。

## 10. 失败体验

| 状态     | 产品表现           | 用户操作           |
| -------- | ------------------ | ------------------ |
| 未登录   | 本地模式，同步关闭 | 注册或登录         |
| 会话失效 | 保留本地数据和队列 | 重新登录           |
| 同步中   | 非阻塞状态         | 继续使用工作台     |
| 离线     | 保留待同步变更     | 等待网络或稍后同步 |
| 同步失败 | 展示简短错误摘要   | 立即同步或稍后重试 |

无论何种失败，本地工作台都必须可打开、可编辑、可持久化。

## 11. 验收标准

- `apps/app` 根工作台装配账号插件后，账号入口支持注册、登录、退出、会话恢复和密码重置；FNOS 不显示该入口。
- 未登录时工作台保持本地可用；登录后可恢复同步调度。
- 同步范围覆盖 core 装配和声明可同步的插件数据。
- 插件无法取得 JWT 或直接调用同步接口。
- 服务端拒绝或过滤敏感字段和危险路径字段。
- 同步使用增量拉取、记录级合并和 tombstone 删除传播。
- 网络或服务失败不阻塞本地编辑，后续可重新触发同步。
- 设置入口准确展示同步范围与非 E2EE 隐私语义。
- 账号与同步页面的模型、校验和 actions 由账号插件提供，settings host 不注入认证/同步业务 API。
- 账号插件未装配或被禁用时，不启动同步计时器、不注册账号/同步设置面板。

## 12. 后续路线

以下能力不属于当前已交付范围，需以独立需求推进：

- 用户可见的设备管理和设备撤销。
- 自动快照、恢复流程和历史版本浏览。
- 服务端冲突持久化、冲突收件箱和手动合并 UI。
- 完整 E2EE、共享工作区和多人协作。
- 文件原件同步、容量管理和企业审计。

## 13. 技术实现

当前后端是仓库内的 `apps/app`（TanStack Start 全栈应用），基于 better-auth 和 Drizzle ORM，开发用 SQLite、生产可用 PostgreSQL。设备管理、快照、冲突收件箱和 E2EE 尚未交付。架构分层：宿主 app 通过 `host-adapters` 的 `AccountSyncService` 组装 `@tabora/auth`（better-auth client）与 `@tabora/sync`（队列/push/pull/LWW/tombstone），后端 `apps/app` 提供 `/api/auth/*`、`/api/sync/*`、`/api/attachments/*` 与管理员 server function。`official.account-sync` 按宿主装配：`apps/app` 根工作台始终创建服务并装配插件、默认同源 `/api/*`，未装配的宿主不创建认证存储、同步队列或调度。

### 13.1 后端路由与认证

| 路径 | 访问范围 | 职责 |
| --- | --- | --- |
| `GET /api/health` | 公开 | 健康检查 |
| `GET/POST /api/auth/*` | better-auth | 注册、登录、会话、验证和密码重置 |
| `POST /api/sync/records` | 登录用户 | 批量推送当前态记录 |
| `GET /api/sync/records` | 登录用户 | 按 `since` 增量拉取记录 |
| `/api/attachments/*` | 登录用户 | 文件上传、绑定和访问 |
| 管理员操作（server function） | 管理员 | 用户、同步记录、附件、系统、设置和审计 |

`/api/sync/*` 和 `/api/attachments/*` 从 cookie 或 bearer token 解析会话并写入 `userId`，未登录返回 401，所有用户记录查询都带 owner 条件。管理端 server function 统一经授权（未登录 401、非管理员 403）和审计中间件。服务端 `apps/app/src/server/auth.ts` 用 better-auth 的邮箱密码/admin/bearer 插件：首个用户可作管理员初始化、后续公开注册由系统设置控制；密码重置与邮箱验证走服务端邮件队列，不把邮件凭据或重置值写入工作台数据。客户端 `@tabora/auth` 的 `createBetterAuthClient` 只暴露 `AuthClient`（注册/登录/登出/会话/密码重置），token 只交给 host-owned 同步服务，网页宿主用 `localStorage`、扩展宿主用 `chrome.storage.local`，`401` 清本地 token。通用插件 API、settings host 和普通插件都不能读取 JWT、认证存储、同步 manager 或后端 URL。

### 13.2 同步记录与 Push/Pull 契约

state-based 当前态模型，服务端保存每用户最新记录和 tombstone，`type` 为 `workspace | pluginInstance | plugin | pluginData`。推送记录字段（`type`/`id` 稳定键、`data` payload、`version`、`client_timestamp`、`device_id`、`deleted`）以 `apps/app/src/server/syncRecords.ts` 的 `PushRecord` 为准；插件数据只有 manifest 声明 collection 后才由 `createChangeDetector` 按 record key/更新时间/排除字段入队。`POST /api/sync/records` 接受 1–100 条，逐条校验字段、用敏感字段过滤器拒绝 token/密钥/密码/私钥/本机路径，按 `(ownerId, type, id)` 定位后比对版本与时间（版本不匹配或客户端时间不晚于服务端时返回 conflict），返回 `accepted`/`conflicts`/`rejected`/`server_time`。`GET /api/sync/records?since=<ISO time>` 按 owner 增量返回单次最多 1000 条，tombstone 返回 `deleted: true`、`data: null`。冲突服务端优先，错误码映射见 `packages/sync/src/syncGatewayClient.ts`，同步失败不阻塞本地读写。

### 13.3 信任边界与验证

服务端认证和 owner 隔离是唯一可信边界，客户端过滤只是额外保护；普通插件只能经 runtime context 读写本地 plugin data，不能访问同步 API、认证存储或数据库句柄。修改认证或同步契约时，除 `pnpm --dir apps/app test` 与 `pnpm exec vitest run packages/auth packages/sync` 的定向测试外，还应验证有效会话、owner 隔离、敏感字段拒绝、push、pull、冲突和 tombstone 路径，再按回归基准跑 `pnpm test` / `pnpm check` / `pnpm build`。

### 13.4 自托管镜像

仓库根 `Dockerfile` 只构建 `apps/app`，运行时单 Node 进程：`/` 由工作台路由响应，`/admin/*` 由管理后台响应，`/api/*` 与 `/_serverFn/*` 保持服务端契约。镜像默认把 SQLite 数据库和本地附件存到 `/data`（用 SQLite 时必须挂持久化 volume 且单副本）；生产可改用 `DATABASE_CLIENT=postgres` 与外部 `DATABASE_URL`，但 `UPLOADS_DIR` 仍需持久化存储。运行前必须设置 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` 和至少 32 位的 `TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY`；`HOST`、`PORT`、`DATABASE_FILE`、`UPLOADS_DIR` 已有容器默认值。
