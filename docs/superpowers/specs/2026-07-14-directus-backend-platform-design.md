# Tabora Directus 后端平台设计

> **状态：** 已确认的目标架构设计
> **设计原则：** 以 Directus 原生能力为底座，以扩展承载业务域，不修改 Directus 核心源码

## 1. 设计目标

本方案定义 Tabora 后端平台的目标形态。实现以 Directus 最佳实践为准，不受现有 Supabase、现有代码组织或当前客户端实现约束。

本方案需要覆盖以下能力：

- 用户注册、登录、登出、邮箱验证与会话续期。
- 附件上传、私有访问、后台治理与生命周期管理。
- 管理后台、角色权限、审计日志。
- 同步设备管理、同步网关、冲突收件箱、快照恢复。
- 可私有化部署，支持自建对象存储、数据库与邮件服务。

本方案不追求首版覆盖所有高级认证能力。首版优先保证平台稳定、可部署、可扩展。邮箱验证码登录、双因素认证和更复杂的风控策略作为后续增强能力。

## 2. 设计结论

### 2.1 总体方案

Tabora 后端采用以下分层：

- **平台底座：** Directus + PostgreSQL + Redis + S3 兼容对象存储。
- **Directus 原生能力：** 用户、角色、权限、文件、后台、活动日志。
- **自定义扩展：** 认证增强、同步网关、附件访问控制、后台增强面板。
- **异步任务：** 文件扫描、缩略图或转码、清理任务、快照与 tombstone 清理。

### 2.2 首版认证策略

首版采用 **邮箱 + 密码 + 邮箱验证**。

原因如下：

- 最贴合 Directus 原生用户体系。
- 可最大化复用 Directus 的用户、角色、后台与权限能力。
- 首版复杂度可控，便于尽快交付稳定的管理后台与附件体系。

后续可在不推翻本架构的前提下补充：

- 邮箱验证码登录。
- trusted device（可信设备）与设备信任策略。
- 双因素认证（2FA）。

### 2.3 附件策略

所有附件统一进入 `directus_files`，业务侧不直接保存文件 URL，而是通过 `attachment_refs` 建立业务对象与文件的映射关系。

附件默认私有。访问采用服务端签名 URL 或受控代理下载。公开访问只用于明确声明为公开资源的文件，不作为默认策略。

### 2.4 同步策略

同步能力不走 Directus 自动生成的 CRUD API。同步是业务核心链路，必须由自定义扩展提供显式 API 与服务层，统一处理鉴权、设备资格、敏感字段过滤、合并、冲突与快照。

## 3. 目标架构

```txt
┌─────────────────────────────────────────────┐
│ Tabora Client                               │
│ - 用户会话                                  │
│ - 附件上传/访问                              │
│ - 设备管理                                  │
│ - 数据同步                                   │
└─────────────────────┬───────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────┐
│ Directus API                                │
│                                             │
│ 原生能力：                                  │
│ - Users / Roles / Permissions               │
│ - Files                                     │
│ - Admin App                                 │
│ - Activity                                  │
│                                             │
│ 自定义扩展：                                │
│ - auth endpoints                            │
│ - sync endpoints                            │
│ - attachment endpoints                      │
│ - admin interfaces                          │
│ - hooks / services / policies               │
└───────────────┬───────────────┬─────────────┘
                │               │
                ▼               ▼
      ┌────────────────┐  ┌─────────────────┐
      │ PostgreSQL     │  │ Redis           │
      │ - 用户扩展      │  │ - 限流           │
      │ - 同步模型      │  │ - 短期状态       │
      │ - 附件引用      │  │ - 异步任务协调   │
      └────────────────┘  └─────────────────┘
                │
                ▼
      ┌──────────────────────────────────────┐
      │ S3 / MinIO                           │
      │ - 原始附件                           │
      │ - 缩略图/派生文件                    │
      │ - 导出文件                           │
      └──────────────────────────────────────┘
```

## 4. 模块边界

### 4.1 Directus 原生能力

Directus 原生层负责：

- 用户主表与基础身份。
- 角色与权限配置。
- 文件存储元数据管理。
- 后台管理界面。
- 基础活动日志与内容管理能力。

Directus 原生层不负责：

- 同步 push/pull 业务协议。
- 冲突合并。
- 快照恢复业务逻辑。
- 业务附件授权规则。

### 4.2 自定义扩展

自定义扩展分为 4 类：

- **Endpoints：** 对外 API，承载认证、同步与附件访问。
- **Hooks：** 在文件上传、用户状态变更、审计记录等场景注入规则。
- **Interfaces：** Directus Admin 自定义页面，例如冲突收件箱、快照恢复页。
- **Shared Services：** 鉴权、限流、日志、存储适配、领域服务。

### 4.3 异步任务

异步任务处理以下事项：

- 文件安全检查。
- 缩略图生成、转码或派生文件生成。
- 临时文件清理。
- tombstone 清理。
- 过期 refresh token 清理。
- 过期验证码清理。

### 4.4 Schema 版本化与 provisioning（manifest + snapshot.json）

目标：把“最低可运行的 schema 要求”纳入版本控制，并用脚本自动化 provisioning，避免只在 Directus Admin 里手工点改导致的不可追溯差异。

目录约定：

```txt
backend/directus/
  schema/
    manifest.json       # 单一事实源：最低 schema contract（collections + 必需 fields）
    snapshot.json       # 导出产物：从 Directus 导出的 schema 快照（用于 diff/审计/协作对齐）
  scripts/
    provisionSchema.ts  # 读 manifest -> 确保 collection/field -> 导出 snapshot.json
```

语义约定：

- `manifest.json` 是单一事实源，只声明业务运行不可缺的集合与字段（字段名 + Directus field type），不追求覆盖 UI meta、权限、关系等全部可配置项
- `snapshot.json` 是导出产物，由 provisioning 脚本在成功后从 Directus 导出，主要用于 diff、审计与协作对齐
- 当前 provisioning 采用“增量式”收敛：只确保 manifest 声明项存在，不会删除/重命名/回滚 Directus 侧已有 schema

## 5. 数据模型

## 5.1 复用 Directus 内置表

直接复用：

- `directus_users`
- `directus_files`
- `directus_roles`
- `directus_permissions`
- `directus_activity`

不复制一套新的用户主表，不为附件系统单独再造一套文件主表。

## 5.2 用户扩展表

### `user_profiles`

用途：承载用户业务资料。

关键字段：

- `id`
- `user_id`
- `display_name`
- `avatar_file_id`
- `status`
- `timezone`
- `locale`
- `created_at`
- `updated_at`

### `user_verification_codes`

用途：邮箱验证与后续验证码登录能力。

关键字段：

- `id`
- `email`
- `code_hash`
- `purpose`
- `expires_at`
- `consumed_at`
- `request_ip`
- `request_ua`
- `created_at`

约束：

- 只存验证码 hash，不存明文。
- 验证码短时有效。
- 消费后立即失效。

### `user_refresh_tokens`

用途：refresh token 持久化、轮换与撤销。

关键字段：

- `id`
- `user_id`
- `device_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `last_used_at`
- `created_at`

### `trusted_devices`

用途：可信设备与会话风险识别。

关键字段：

- `id`
- `user_id`
- `device_fingerprint`
- `device_name`
- `platform`
- `last_login_at`
- `trusted_at`
- `revoked_at`

## 5.3 同步域表

### `sync_devices`

用途：表示有同步资格的设备。

关键字段：

- `id`
- `user_id`
- `device_key`
- `name`
- `platform`
- `status`
- `last_sync_at`
- `last_seen_at`
- `created_at`

### `synced_records`

用途：云端当前态事实源。

关键字段：

- `id`
- `user_id`
- `scope`
- `entity_type`
- `record_key`
- `payload`
- `updated_at`
- `server_updated_at`
- `deleted_at`
- `schema_version`
- `last_writer_device_id`

约束：

- 对 `(user_id, scope, entity_type, record_key)` 建唯一约束。
- 删除采用 tombstone，不做立即物理删除。
- `server_updated_at` 作为增量拉取游标。

### `sync_snapshots`

用途：关键同步动作前的恢复点。

关键字段：

- `id`
- `user_id`
- `reason`
- `payload`
- `created_by`
- `created_at`

### `sync_conflicts`

用途：承载不可自动合并的记录。

关键字段：

- `id`
- `user_id`
- `scope`
- `entity_type`
- `record_key`
- `local_device_id`
- `remote_device_id`
- `local_payload`
- `remote_payload`
- `local_summary`
- `remote_summary`
- `status`
- `resolved_by`
- `resolved_at`
- `created_at`

### `sync_operation_logs`

用途：记录同步网关的关键操作与错误摘要。

关键字段：

- `id`
- `user_id`
- `device_id`
- `operation`
- `status`
- `summary`
- `created_at`

## 5.4 附件域表

### `attachment_refs`

用途：建立文件与业务对象的引用关系。

关键字段：

- `id`
- `file_id`
- `owner_user_id`
- `entity_type`
- `entity_id`
- `field_name`
- `visibility`
- `purpose`
- `created_at`

作用：

- 避免业务模型直接耦合 `directus_files`。
- 支持一个文件被多个业务对象引用。
- 在删除附件时做引用检查。

### `attachment_policies`

用途：按业务对象类型定义附件规则。

关键字段：

- `id`
- `entity_type`
- `mime_whitelist`
- `max_size_bytes`
- `visibility_default`
- `requires_scan`
- `created_at`

## 5.5 审计与系统表

### `audit_events`

用途：记录高风险或关键业务动作。

典型场景：

- 登录与登出。
- 邮箱验证。
- 设备撤销。
- 冲突处理。
- 快照恢复。
- 高风险附件删除。

### `system_settings`

用途：保存平台级可配置项，例如附件大小限制、默认策略、同步清理阈值。

## 6. API 设计

## 6.1 认证接口

首版提供以下认证接口：

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/session`
- `POST /auth/send-code`
- `POST /auth/verify-code`
- `GET /auth/devices`
- `POST /auth/devices/revoke`

说明：

- `send-code` 与 `verify-code` 首版用于邮箱验证；未来可扩展为验证码登录。
- refresh token 由扩展层持久化与轮换。

## 6.2 附件接口

提供以下附件接口：

- `POST /attachments/prepare`
- `POST /attachments/commit`
- `GET /attachments/:id/access`
- `POST /attachments/:id/bind`
- `POST /attachments/:id/unbind`
- `DELETE /attachments/:id`
- `GET /attachments/:id/meta`

约束：

- 客户端不直接持久保存最终文件 URL。
- 默认访问为私有，必须经服务端访问授权。
- 删除文件前必须检查是否仍被引用。

## 6.3 同步接口

同步网关提供以下接口：

- `POST /sync/register-device`
- `POST /sync/push`
- `POST /sync/pull`
- `POST /sync/snapshot`
- `GET /sync/devices`
- `POST /sync/remove-device`
- `GET /sync/conflicts`
- `POST /sync/resolve-conflict`
- `GET /sync/status`

这些接口统一由 `sync extension` 提供，不暴露为 Directus 默认 collection CRUD。

## 7. 关键业务规则

## 7.1 认证规则

- 首版采用邮箱密码登录。
- 注册后需要完成邮箱验证。
- access token 为短期令牌。
- refresh token 持久化存储，并支持轮换与撤销。
- 登录、刷新、登出、验证码校验都要进入审计日志。

## 7.2 附件规则

- 默认私有。
- 上传必须经过受控入口，按业务实体与策略校验类型、大小、用途。
- 文件与业务对象的关系统一经 `attachment_refs` 管理。
- 临时文件、处理中间产物与正式文件必须区分生命周期。
- 高风险删除进入审计日志。

## 7.3 同步规则

- 同步由自定义 endpoint 统一处理。
- 同步请求必须带用户会话与设备标识。
- 服务端负责敏感字段过滤与危险字段拒绝。
- 合并支持 `last-write-wins` 与 `record-merge`。
- 冲突进入 `sync_conflicts`，由后台或用户流程处理。
- 快照在关键同步动作前生成。
- 删除统一走 tombstone。

## 8. 权限模型

角色至少分为：

- `public`
- `user`
- `support`
- `admin`

权限原则如下：

- `public` 仅访问公开资源。
- `user` 仅管理自己的资料、附件、设备与同步数据。
- `support` 可只读查看用户、设备、附件、冲突，但不能执行高风险动作。
- `admin` 才能恢复快照、强制下线设备、删除他人附件、修改系统设置。

高风险动作统一走服务端校验，不依赖前端界面是否隐藏。

## 9. 后台设计

## 9.1 默认后台能力

Directus 默认后台用于管理：

- 用户与角色。
- 文件与文件元数据。
- 用户扩展资料。
- 系统策略。

## 9.2 自定义后台能力

需要新增 4 类自定义后台页面：

### 同步监控

展示：

- 活跃用户数。
- 活跃设备数。
- 同步成功率。
- 冲突数量。
- 快照数量。
- 最近失败请求摘要。

### 冲突收件箱

展示：

- 用户。
- 记录类型。
- 两端摘要。
- 冲突时间。
- 处理状态。

动作：

- 保留本地。
- 保留远端。
- 合并提交。
- 忽略。

### 快照恢复页

展示：

- 快照原因。
- 创建时间。
- 大小或摘要。
- 关联用户。

动作：

- 预览摘要。
- 恢复。
- 标记保留。
- 删除。

### 附件治理页

展示：

- 大文件。
- 孤儿文件。
- 扫描失败文件。
- 即将过期临时文件。
- 按用户或业务对象查询的文件引用情况。

## 10. 部署与运维

推荐起步部署：

- `directus`
- `postgres`
- `redis`
- `minio`
- `nginx`
- `worker`

### 10.1 镜像锁定策略

- **Directus 镜像固定：** 固定到 `directus/directus:12.1.1`，避免上游版本漂移引入不受控变更，并为后续升级留出明确的验证窗口。
- **其他基础镜像浮动：** PostgreSQL、Redis、MinIO、Nginx 等基础镜像维持浮动 tag（按环境基线统一管理），由基础设施侧节奏化升级与回归验证。
- **可选 digest pin 建议：** 在 `staging` 与 `prod` 环境，可对关键镜像追加 digest pin（例如 `directus/directus:12.1.1@sha256:<digest>`），以获得更强的可复现性与供应链防护；代价是需要显式更新 digest 并配套升级验证流程。

环境分层：

- `dev`
- `staging`
- `prod`

运维要求：

- 数据库自动备份。
- 文件对象存储备份或跨区冗余。
- 日志集中化。
- staging 先于 production 升级。
- schema 变更必须可回放，禁止只在生产手工修改。

### 10.2 本地开发口径（ADMIN\_\*、dev:directus env、首次启动闭环）

#### ADMIN\_\* 口径

使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 作为本地开发与脚本的一致口径：

- Directus 自身：首次启动时使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 初始化管理员账号（容器环境变量）
- Schema provisioning 脚本：读取同一组 `ADMIN_*` 变量，用管理员账号登录后执行 provisioning 与导出 `snapshot.json`

约束：

- 本地开发可以使用仓库内的 `.env.example` 提供默认值，但任何环境的真实密码都不应提交到仓库
- `staging/prod` 必须通过 secret 管理系统注入 `ADMIN_*`（并配套轮换与审计）

#### dev:directus（本机启动）env

当用 `dev:directus` 在本机进程里运行 `directus start` 时，不会读取 docker compose 的 `env_file`，需要在 `backend/directus` 目录准备 `.env`：

```bash
cp backend/directus/.env.example backend/directus/.env
```

随后按需修改 `KEY` / `SECRET` / `ADMIN_*` / 数据库与存储连接等变量，再启动 Directus。

#### 首次启动闭环（从零到可用）

1. 启动本地 Directus 栈（docker compose）
2. 等待 Directus 完成 DB 连接与迁移，访问 `http://localhost:8055` 可打开 Admin
3. 使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录
4. 执行 schema provisioning（确保 collections/fields 存在），并更新 `backend/directus/schema/snapshot.json`

首次启动时常见现象：

- 初次拉起 Directus 时可能需要等待容器完成 DB 连接与迁移；在 Directus 还未就绪时，紧随其后的 provisioning 可能出现连接失败
- 通常等待 10–30 秒后重试 provisioning 即可

## 11. 实施顺序

### 阶段 1：平台底座

- Directus、PostgreSQL、Redis、MinIO、SMTP 联通。
- 用户、角色、权限与后台可用。
- 文件上传与私有访问基础能力可用。

### 阶段 2：认证扩展

- 注册、登录、登出、邮箱验证。
- refresh token 轮换。
- 会话查询。
- 基础 trusted device 支撑。

### 阶段 3：同步扩展

- 设备注册。
- push/pull。
- 冲突落库。
- 快照生成。

### 阶段 4：后台增强

- 冲突收件箱。
- 快照恢复页。
- 同步监控页。
- 附件治理页。

### 阶段 5：可靠性建设

- 审计日志完善。
- 限流。
- 清理任务。
- 监控与告警。
- 压测与索引优化。

## 12. 非目标

首版不做：

- 把 Directus 改造成完全自定义核心框架。
- 绕开 Directus 再重复建设一套完整后台。
- 默认开放公开附件访问。
- 第一阶段就上线邮箱验证码登录、2FA、复杂风控。
- 用 Flow 承担同步核心链路。

## 13. 验收标准

- 可完成注册、登录、邮箱验证、登出与会话续期。
- 附件可上传、绑定、私有访问与后台治理。
- 管理员可在后台查看用户、附件、设备、冲突与快照。
- 同步接口可完成设备注册、push、pull、冲突记录与快照生成。
- 高风险动作有审计记录。
- 平台可通过自托管方式稳定部署在 `staging` 与 `prod`。

## 14. 后续增强

本方案为 Directus 最佳实践下的首版目标架构。后续增强方向包括：

- 邮箱验证码登录。
- 双因素认证。
- 高级附件风控。
- 更细粒度的冲突合并器。
- 更丰富的后台运营与支持工具。
