# Directus Tabora 扩展重构设计

## 目标

在保留现有 `/auth/*` 和 `/attachments/*` 路径的前提下，将 Tabora Directus endpoint 扩展重构为职责清晰、输入可验证、错误语义统一、数据访问按用户隔离且可直接测试的实现。

## 当前问题

- `src/index.ts` 同时承担路由注册、认证、会话查询、上游 HTTP 调用和数据库访问。
- 认证服务依赖未包含在 endpoint extension 公共上下文契约中的 `req.schema`，并通过 HTTP 回调同一 Directus 实例。
- handler 广泛捕获所有异常并手写响应，绕过 Directus 的标准错误处理和服务端日志。
- 请求体无结构化校验，数据库查询使用 `select("*")`，会话接口直接返回内部 session 行。
- 附件提交与绑定未验证文件归属，引用计数未按用户隔离，删除接口未删除实际文件。
- 测试导入旧的 `dist`，可能无法覆盖当前源码。

## 结构

- `src/index.ts`：只调用 `defineEndpoint` 并注册各路由模块。
- `src/http.ts`：异步 handler 包装、Zod 请求解析、登录用户提取。
- `src/errors.ts`：扩展专用 Directus error 类型。
- `src/auth.ts`：注册、登录、刷新、退出、找回密码和当前用户。
- `src/sessionIdentity.ts`：稳定会话身份映射；只保存 refresh token 的 SHA-256 摘要。
- `src/sessions.ts`：会话列表与撤销；仅返回白名单字段和稳定 session UUID。
- `src/attachments.ts`：附件策略、归属、引用和文件删除。
- `src/types.ts`：扩展内部请求、数据行和路由类型。

## 数据与错误语义

- 服务 schema 统一通过 endpoint context 的 `getSchema()` 获取。
- 认证直接调用 `UsersService` 和 `AuthenticationService`，不再 HTTP 回调自身。
- 输入校验失败抛出 `InvalidPayloadError`；未登录抛出 `InvalidCredentialsError`；附件不存在或无权访问使用稳定的 Directus error。
- 未预期异常交给 Directus 全局错误处理器记录与脱敏。
- `send-code` 保持防账号枚举语义：服务端记录非输入类失败，对客户端仍返回 204。
- Directus 12.1.1 的 `directus_sessions` 不包含可供扩展写入的 `data` 列，因此扩展不得向该系统表追加自定义 JSON 数据，也不得依赖修改 Directus 系统表。
- 稳定会话身份复用业务表 `user_refresh_tokens`，保存 `user_id`、稳定 UUID `session_id` 和 refresh token 的 SHA-256 `token_hash`。数据库和客户端都不额外保存明文 refresh token。
- 登录在同一事务中创建 Directus session 和身份映射；刷新先锁定旧 hash 的映射，再调用 Directus 旋转 token，并把映射更新为新 hash；任何一步失败都回滚。
- 退出和按设备撤销都在同一事务中调用 Directus logout 并删除对应身份映射，避免留下可见的活动映射。
- 会话列表读取当前用户的 Directus session 白名单字段，在应用层计算 token hash 并与身份映射匹配，只返回稳定 `session_id`、时间和设备元数据。
- 撤销按当前用户和稳定 UUID 锁定身份映射，再锁定当前用户的非 OAuth Directus session，通过 constant-time hash 比较找到原 token，并在同一事务中调用 `AuthenticationService.logout()` 后删除映射。
- 没有身份映射的历史 session 不暴露 token 摘要，也不出现在设备列表中；后续成功刷新时为其补建稳定映射。
- 附件引用查询和计数按 `owner_user_id` 隔离；提交和绑定前验证 `directus_files.uploaded_by`。
- 文件删除统一委托 `FilesService.deleteOne()` 执行，让 Directus 负责数据库记录和存储对象的删除流程。

## 稳定会话身份表

`user_refresh_tokens` 由 Tabora schema provision 管理，至少包含：

- `user_id: uuid`：Directus 用户 id。
- `session_id: uuid`：暴露给客户端的稳定会话标识。
- `token_hash: string(64)`：当前 Directus refresh token 的 SHA-256 十六进制摘要。

约束：

- `session_id` 和 `token_hash` 必须唯一。
- 所有查找和撤销都必须同时限定 `user_id`，避免通过稳定 id 探测其他用户会话。
- hash 比较使用 constant-time 比较，避免直接比较用户可控摘要。
- 不把 `session_id` 等同于物理设备 id；一次重新登录会创建新的 session id。
- `user_refresh_tokens` 只承载 Tabora 的会话身份映射，不替代 Directus 对 refresh token 生命周期、认证和撤销的管理。

## 认证兼容与流量保护

- 自定义本地登录必须尊重 `AUTH_DISABLE_DEFAULT`；禁用时不绕过 Directus 的本地登录关闭意图。
- 当前用户读取与 Directus `/users/me` 对齐：若 `UsersService.readOne()` 返回 `FORBIDDEN`，仅返回 `{ id: userId }`。
- 注册继续直接调用 `UsersService.registerUser()`，生产 Nginx 对精确路径 `/tabora/auth/register` 配置独立 IP 限流。扩展不得导入未公开的 `@directus/api` 内部限流中间件。

## 附件安全边界

- 未配置 `attachment_policies` 的 `entity_type` 必须 fail closed；管理员必须先注册 policy，客户端不能用任意 entity type 绕过 MIME 和大小限制。
- 普通用户角色不得拥有绕过扩展直接修改 `directus_files`、`attachment_refs` 或 `attachment_policies` 的权限。
- `/assets/:id` 的最终下载授权仍由 Directus 文件权限决定；部署必须保证私有文件不会被公开角色直接读取。扩展的 `/attachments/:id/access` 只负责 Tabora 引用检查，不能替代 Directus 原生权限。
- 对任意 `entity_id` 的业务归属校验需要业务 authorizer 契约；在该契约落地前，`entity_id` 仅作为当前用户私有引用键，不得被解释为已经验证过的服务端业务实体。
- `FilesService.deleteOne()` 对数据库记录和对象存储的删除无法形成跨系统原子事务。当前实现依赖 Directus 的删除语义；需要强一致清理时应另行引入 outbox 和后台补偿任务。

## 兼容边界

- 保留现有 HTTP method、路径和主要成功响应外壳。
- 登录与刷新响应新增稳定 `session_id`；设备列表和撤销从 token 摘要切换为稳定 UUID。
- 安全不合理的响应会改变：不再透出上游错误文本、完整 session 行、token 摘要或其他用户的引用计数。
- 请求体从宽松 truthy 判断改为明确类型、长度和格式校验。

## 验证

- endpoint 测试直接导入 `src/index.ts`。
- 新增认证 service 调用、Directus error 转交、稳定会话映射与轮换、会话脱敏、附件归属、用户隔离和真实删除测试。
- schema 测试验证 `user_refresh_tokens` 的必需字段和唯一约束。
- 生产配置测试验证 `/tabora/auth/register` 的精确路径限流。
- 运行 Directus endpoint 测试、扩展 build、仓库 `pnpm test`、`pnpm check` 和 `pnpm build`。
