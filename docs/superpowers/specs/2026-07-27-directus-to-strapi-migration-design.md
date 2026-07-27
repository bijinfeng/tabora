# Directus → Strapi 后端迁移设计

- 状态：已批准，待生成实现计划
- 日期：2026-07-27
- 范围：将 `backend/directus` 完整重写为 Strapi 5 后端，客户端 `packages/auth`、`packages/sync` 重命名并重指向，同步文档

## 背景与目标

Tabora 的官方账号与数据同步后端当前基于 Directus 12（自定义扩展 `directus-extension-tabora`，提供 auth / sessions / attachments / sync 四组端点）。本次将其**完整重写**为 Strapi 5 后端。

> 文档漂移纠正：`AGENTS.md` 第 55 行与 `docs/technical/mpz35mfq-16-data-sync-prd.md` 声称后端采用 Supabase，但实际实现是 Directus。本次迁移统一纠正为 Strapi，并在文档中反映真实现状。

目标：

- 后端从 Directus 迁到 Strapi 5，业务能力（认证、同步、附件）等价或简化
- 认证简化为纯 Strapi 原生 JWT
- 同步网关自定义 controller 移植，HTTP 契约尽量保持
- 附件基于 Strapi upload 插件移植
- 客户端类型/函数从 `Directus*` 彻底重命名为 `Strapi*`
- 文档实时同步

## 关键决策

| 决策点      | 选择                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| 迁移方式    | 方案 A：新建 `backend/strapi` 平行目录，全绿后删除 `backend/directus`       |
| 骨架生成    | 官方 CLI `create-strapi-app`，不手写模板；content-type 用 `strapi generate` |
| 包管理器    | pnpm（与仓库一致）                                                          |
| Strapi 版本 | Strapi 5（TypeScript）                                                      |
| 数据库      | dev SQLite + 生产 PostgreSQL（env 切换）                                    |
| 认证        | 纯 Strapi 原生 JWT，砍掉 refresh token / session_id / 滑动过期              |
| 同步        | 自定义 controller/service 移植 push/pull + 冲突检测，契约保持               |
| 附件        | Strapi upload 插件（dev local provider / 生产 S3），契约保持                |
| 客户端命名  | 彻底重命名 `Directus*` → `Strapi*`                                          |

## 1. 目录与工程结构

用官方 CLI 生成 Strapi 5 项目，只在骨架里做增量。

```txt
backend/strapi/                    # ← CLI 生成，不手改模板
  config/{database,server,admin,middlewares,plugins}.ts   # CLI 生成，按需改
  src/
    api/
      auth/       (仅密码重置等原生不足处的薄补充，尽量不写)
      sync/       (controllers/routes/services) — push/pull + 冲突检测
      attachment/ (controllers/routes/services) — prepare/commit/bind
      # content-types 用 `strapi generate content-type` 生成：
      #   synced-record, attachment-policy, attachment-ref
    extensions/users-permissions/  # 如需扩展原生认证
    index.ts                       # register/bootstrap 增量（provision/权限）
  docker/, Dockerfile              # 迁移 directus docker，改成 strapi
  tests/                           # vitest，移植端点契约测试
```

- 骨架、content-type schema 均用官方 CLI / `strapi generate`，不手拼 `schema.json`
- CLI 生成后纳入 `pnpm-workspace.yaml`（Strapi 单包，无 extensions 子包）
- 迁移期 `backend/directus` 保留，Strapi 全绿后删除

## 2. 认证 — 纯 Strapi 原生 JWT

全部走 users-permissions 原生端点，零自定义认证逻辑。`user_refresh_tokens`、`user_verification_codes`、`sessionIdentity` 相关表与逻辑**不迁移**。

| 旧 Directus 契约      | Strapi 5 原生                                                 |
| --------------------- | ------------------------------------------------------------- |
| `POST /auth/register` | `POST /api/auth/local/register`                               |
| `POST /auth/login`    | `POST /api/auth/local` → `{jwt, user}`                        |
| `POST /auth/refresh`  | 移除（JWT 过期即重新登录）                                    |
| `POST /auth/logout`   | 移除（客户端丢弃 jwt；`logout` 仅本地清 storage）             |
| `GET /auth/session`   | `GET /api/users/me`                                           |
| 密码重置              | `POST /api/auth/forgot-password` + `/api/auth/reset-password` |

客户端 `packages/auth` 重写：

- `StrapiSession`：`{ jwt, expiresAt }`（`expiresAt` 从 JWT `exp` 解出或按配置算），去掉 `refreshToken`/`sessionId`
- `StrapiAuthClient`：`register` / `login` / `getCurrentUser` / `requestPasswordReset` / `resetPassword`；`logout` 仅本地清 storage；去掉 `refreshSession`
- JWT `expiresIn` 在 `config/plugins.ts` 配置，生产 env 可覆盖（默认沿用 Strapi 默认）
- `packages/sync` 中 re-export 的 auth 类型（S1 遗留）同步改名/精简

## 3. 同步网关 — 自定义 controller 移植

Strapi 5 里新建 `sync` api，自定义 controller/service 移植 push/pull + 冲突检测，契约保持。

端点：

- `GET /api/sync/records?since=&types=` → `{ records, cursor }`（pull）
- `POST /api/sync/records`（body 记录数组）→ `{ accepted, conflicts, rejected, server_time }`（push）

content-type `synced-record`（表名保持 `synced_records`）：

- `record_type`(enum: workspace/pluginInstance/plugin/pluginData)、`record_id`、`data`(json)、`version`(int)、`device_id`、`record_updated_at`、`deleted`、`user`(关联登录用户)

移植要点（逻辑不变，只换底层 API）：

- knex `context.database.transaction` → `strapi.db.transaction()` + `strapi.db.query('api::sync.synced-record')`
- 冲突检测 `record.version !== null && version !== row.version` 照搬
- 敏感字段过滤 `syncSensitiveFilter.ts` 原样移植
- `MAX_PUSH_BATCH=100` / `MAX_PULL_LIMIT=1000` / zod 校验照搬
- 时间戳归一化 `toEpochMs`（pg 返回 Date、sqlite/client 返回 string）照搬，覆盖双库
- 用户隔离：每条记录挂 `user` 关联，query 按 `ctx.state.user` 过滤

客户端 `packages/sync`：

- `directusGatewayClient.ts` → `strapiGatewayClient.ts`，`Directus*` → `Strapi*`
- 路径 `/tabora/sync/records` → `/api/sync/records`，带 JWT 鉴权头
- push/pull 请求/响应结构不变

**未引用表不迁移**（YAGNI）：`sync_conflicts`、`sync_devices`、`sync_operation_logs`、`sync_snapshots`、`audit_events`、`user_profiles`、`trusted_devices`、`system_settings` 在扩展代码中无引用，不迁移。`directus_*` 系统表（activity/revisions/oauth/sessions）由 Strapi 系统表替代。

## 4. 附件 — Strapi upload 插件

自定义 controller 移植 prepare/commit/bind，用 Strapi upload 插件替代 Directus FilesService。

端点契约保持：

- `POST /api/attachments/prepare` → 校验 policy（mime 白名单 + max_size），返回 `{ upload: { endpoint, ... }, policy? }`
- `POST /api/attachments/commit` → 校验已传文件 vs policy，写 `attachment_refs`，返回 `refs_count`
- `GET /api/attachments/:id/access` → 访问校验
- bind/unbind → 增删 `attachment_refs`

content-type：

- `attachment-policy`（`attachment_policies`）：`entity_type`、`mime_whitelist`(json)、`max_size_bytes`
- `attachment-ref`（`attachment_refs`）：`entity_type`、`entity_id`、`file`(关联 `plugin::upload.file`)、`uploaded_by`(关联 user)

移植要点：

- `FilesService` → `strapi.plugin('upload').service('upload')`
- 上传两步：先 `POST /api/upload` 拿 fileId，再 `commit`（对齐 prepare→上传→commit 三段式），prepare 返回的 `endpoint` 由 `/files` 改为 `/api/upload`
- 属主校验：用 `attachment-ref.uploaded_by` 或 upload file `createdBy`
- policy/ref knex 查询 → `strapi.db.query`
- provider：dev local（`@strapi/provider-upload-local`），生产 S3（`@strapi/provider-upload-aws-s3`，env 切换），需 JWT

注：客户端 `packages/{auth,sync}` 当前未引用 attachments 端点，本块客户端零改动。

## 5. 数据库 / 配置 / 测试 / Docker / 文档 / 切换

**数据库**（`config/database.ts`，env 驱动）：dev SQLite（`.tmp/data.db`），prod pg（复用 directus compose 的 `DATABASE_*` 变量）。

**配置**：

- `config/plugins.ts`：users-permissions `jwt.expiresIn`；upload provider（local/S3 env 切换）
- `config/server.ts`：`APP_KEYS`、host、port、`url`
- `config/middlewares.ts`：CORS 指向 playground / extension origin
- `.env.example`：DB、APP_KEYS、JWT_SECRET、S3、CORS origin

**测试**（vitest，移植契约测试）：

- 移植 `tests/endpoints/tabora-{auth,attachments,sync-filter}.test.ts`（编程式启动 Strapi 或 supertest 打 HTTP）
- auth 测试按纯 JWT 重写（去掉 refresh/session 断言）
- 保留敏感字段过滤、冲突检测、policy 校验断言
- root `vitest.config.ts`：directus 入口 → strapi 入口

**Docker**：

- `docker/compose.{dev,prod}.yml`：directus 镜像 → Strapi（node + `pnpm build` + `strapi start`）
- nginx `directus.conf` → `strapi.conf`（8055 → 1337）
- `infra/docker/compose.directus.yml` → `compose.strapi.yml`

**root 工程接线**：

- `package.json` 脚本 `dev:directus*`/`test:directus`/`directus:*` → `*:strapi`
- `pnpm-workspace.yaml`：`backend/directus*` → `backend/strapi`
- 包名 `@tabora/directus-backend` → `@tabora/strapi-backend`

**文档同步**：

- `docs/README.md`、各 `README.md`/`DEPLOY.md`/`DEPLOYMENT.md`：directus → strapi
- 纠正漂移：`AGENTS.md` 第 55 行 + `docs/technical/mpz35mfq-16-data-sync-prd.md` 更新为 Strapi 现状
- `docs/superpowers/DIRECTUS_STATUS_ASSESSMENT.md`：标注为历史或更名

**切换与清理顺序**：

1. Strapi 全绿（`pnpm test` + `pnpm check` + 手动跑通 login/sync/attachment）
2. 客户端 `packages/{auth,sync}` 重命名 + 重指向，全仓测试绿
3. 删除 `backend/directus`，移除残留 directus 依赖/脚本/workspace 入口
4. `pnpm build` 验证

**验证口径**（AGENTS.md）：跨包 + 构建变更 → `pnpm test` + `pnpm check` + `pnpm build`；客户端库改名后跑一次冒烟确认 import 不断。

## 风险与未决

- Strapi 5 编程式测试启动比 Directus 慢；若过重退化为 supertest 打已启动实例
- `directus_*` 系统能力（activity/revisions/oauth）无对应迁移，已确认业务表未引用
- 客户端改名波及的所有 import 点，计划阶段全量扫描列出
- 未引用的 sync\_\*/audit/profile 等表不迁移，需确认无隐藏运行时依赖（已在设计评审确认）
