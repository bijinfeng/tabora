# Tabora Directus 后端平台设计（当前实现对齐）

> **状态：** 已落地的最小实现（本地 Directus 栈 + schema provisioning + `/tabora/auth/*`、`/tabora/attachments/*` endpoint 扩展），本文档仅描述当前代码已实现的约束与流程

## 1. 目标与非目标

### 1.1 目标

- 在仓库内提供可启动的本地 Directus 环境（PostgreSQL / Redis / MinIO / Directus / Nginx）
- 用“schema manifest + snapshot.json”将 schema 变更纳入版本控制
- 通过脚本把 schema provisioning 自动化，减少手工点改导致的不可追溯差异

### 1.2 非目标（当前分支尚未实现）

- 不在当前实现中落地除 `/tabora/auth/*`、`/tabora/attachments/*` 之外的完整业务 endpoints（sync 等）
- 不在当前实现中提供基于 snapshot 的 schema apply / 回滚机制（`snapshot.json` 当前仅作为导出产物）
- 不在当前实现中覆盖权限、角色、关系、UI meta 的完整声明式管理

---

## 2. 目录与职责

```txt
backend/directus/
  extensions/
    directus-extension-tabora/
      package.json
      dist/index.js          # Directus endpoint 扩展（/tabora/auth/* + /tabora/attachments/*）
  schema/
    manifest.json         # 最低 schema 要求（collections + 必需 fields）
    snapshot.json         # 从 Directus 导出的 schema 快照（用于 diff/审计）
  scripts/
    provisionSchema.ts    # 读 manifest -> 确保 collection/field -> 导出 snapshot.json
    bootstrap.ts          # 启动本地 docker compose + 执行 schema:provision
  tests/
    bootstrap/workspace.test.ts
    endpoints/tabora-auth.test.ts
    endpoints/tabora-attachments.test.ts
    schema/schema.test.ts
infra/docker/
  compose.directus.yml
  nginx/default.conf
```

---

## 2.1 `/tabora/auth/*` endpoint 扩展（已实现）

位置：`backend/directus/extensions/directus-extension-tabora/dist/index.js`

目标：以“薄封装”的方式对齐 Directus 原生 auth 行为与字段命名（`access_token` / `refresh_token` / `expires`），减少 Tabora 后端对 Directus 内部实现的耦合。

接口：

- `POST /tabora/auth/register`：薄封装 Directus `POST /register`，保持 Directus 行为（始终 `204`）。
- `POST /tabora/auth/login`：复用 `AuthenticationService.login`，返回 `{ data: { access_token, refresh_token, expires } }`。
- `POST /tabora/auth/refresh`：复用 `AuthenticationService.refresh`，返回 `{ data: { access_token, refresh_token, expires } }`。
- `POST /tabora/auth/logout`：复用 `AuthenticationService.logout`，返回 `204`。
- `GET /tabora/auth/session`：复用 `UsersService.readOne("me")`，未登录返回 `401`。
- `POST /tabora/auth/send-code`：薄封装 Directus password reset request（转发 `POST /auth/password/request`），成功返回 `204`。
- `POST /tabora/auth/verify-code`：薄封装 Directus password reset（转发 `POST /auth/password/reset`），兼容 `code -> token` 映射，成功返回 `204`。
- `GET /tabora/auth/devices`：读取 `directus_sessions` 中当前用户的会话列表（未登录返回 `401`）。
- `POST /tabora/auth/revoke`：删除 `directus_sessions` 中属于当前用户的 `session_id`（未登录返回 `401`，成功返回 `204`）。

---

## 2.2 `/tabora/attachments/*` endpoint 扩展（已实现）

位置：`backend/directus/extensions/directus-extension-tabora/dist/index.js`

目标：在不暴露 Directus 通用 CRUD 的前提下，围绕 `attachment_refs` / `attachment_policies` 提供最小但真实的附件约束与私有访问控制。

接口：

- `POST /tabora/attachments/prepare`：要求已登录；按 `attachment_policies.entity_type` 读取 `mime_whitelist` / `max_size_bytes`，校验通过后返回默认 `private` 上传约束。
- `POST /tabora/attachments/commit`：要求已登录；校验 `directus_files` 中的 `file_id` 存在，为当前用户写入一条 owner 级 `attachment_refs` 绑定，并返回 `refs_count`。
- `GET /tabora/attachments/:id/access`：要求已登录；默认私有，只有上传者或 owner ref 持有者可访问，返回受控 `asset_url`。
- `POST /tabora/attachments/:id/bind`：要求已登录；为当前用户追加 `attachment_refs(file_id, owner_user_id, entity_type, entity_id)` 绑定，重复绑定幂等。
- `POST /tabora/attachments/:id/unbind`：要求已登录；删除当前用户对应的绑定并返回剩余 `refs_count`。
- `DELETE /tabora/attachments/:id`：要求已登录；默认私有校验通过后，仅在 `attachment_refs` 已清空时允许删除，仍被引用时返回 `409 attachment_in_use`。
- `GET /tabora/attachments/:id/meta`：要求已登录；返回文件基础元信息、默认 `private` 可见性与引用数。

约束：

- 当前实现不生成最终可长期缓存的公开 URL，客户端应始终通过 `/tabora/attachments/:id/access` 取受控访问入口。
- 当前实现将“上传者”或“owner ref 持有者”视为可访问主体，未引入更细粒度的共享策略。

---

## 3. Schema 管理模型

### 3.1 单一事实源与产物

- `manifest.json`：单一事实源（最低 schema contract）
  - “最低”意味着：只声明业务运行不可缺的集合与字段，不追求覆盖 Directus 侧所有可配置项
- `snapshot.json`：导出产物（用于 diff、审计、协作对齐）
  - 由脚本在 schema provisioning 后从 Directus 导出
  - 当前不作为 apply 输入，因此不能依赖它完成 schema 的回放或强制收敛

### 3.2 Provisioning 语义（当前实现）

`backend/directus/scripts/provisionSchema.ts` 的行为约定：

- 通过 Directus API 创建缺失的 collection
- 通过 Directus API 创建缺失的 field
- 导出 `/schema/snapshot` 并写入 `backend/directus/schema/snapshot.json`

限制：

- 当前 provisioning 为增量式：不会删除、重命名、也不会“对齐回滚” Directus 中的既有 schema
- 如果需要“强制一致”，应新增基于 Directus `schema apply` 的流程（不在当前实现范围）

---

## 4. 本地运行与脚本入口

### 4.1 Docker Compose（本地栈）

文件：`infra/docker/compose.directus.yml`

- postgres: `5433 -> 5432`
- redis: `6380 -> 6379`
- minio: `9000` / `9001`
- directus: `8055`
- nginx: `8080 -> 80`

### 4.2 根命令（面向仓库）

根 `package.json` 提供：

- `pnpm dev:directus:stack`：启动 docker compose
- `pnpm directus:bootstrap`：启动必要容器，并执行 `schema:provision`
- `pnpm directus:schema:provision`：执行 schema provisioning 并更新 snapshot.json
- `pnpm dev:directus`：本机启动 directus（用于非 docker 的调试场景）

首次启动说明：

- 初次拉起 Directus 时可能需要等待容器完成 DB 连接与迁移；在 Directus 还未就绪时，紧随其后的 `schema:provision` 可能会出现连接失败
- 若遇到 provisioning 失败，通常等待 10–30 秒后重试 `pnpm directus:schema:provision` 即可

### 4.3 环境变量与默认值

Directus 容器通过 `backend/directus/.env.example` 注入默认配置（本地开发用）。

schema provisioning 脚本使用的变量：

- `DIRECTUS_URL`（默认 `http://localhost:8055`）
- `ADMIN_EMAIL`（默认 `admin@example.com`）
- `ADMIN_PASSWORD`（默认 `replace-me`）

说明：

- Directus 自身使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 初始化管理员（来自 `.env.example`）
- provisioning 脚本读取同一组 `ADMIN_*` 变量以登录并进行 schema provisioning，因此在默认本地栈下无需额外设置也可工作

### 4.4 `dev:directus`（本机启动）所需 env

`pnpm dev:directus` 是在本机进程里运行 `directus start`，不会读取 docker compose 的 `env_file`。因此需要你在 `backend/directus` 目录准备本机 env（推荐用 `.env`）：

```bash
cp backend/directus/.env.example backend/directus/.env
```

随后按需修改 `KEY` / `SECRET` / `ADMIN_*` 等变量，再执行：

```bash
pnpm dev:directus
```

---

## 5. Docker 镜像拉取加速（snap Docker 备注）

若团队成员使用 Ubuntu 的 snap 版 Docker，daemon 配置路径与传统安装不同：

- apt 安装：`/etc/docker/daemon.json`，重启 `sudo systemctl restart docker`
- snap 安装：`/var/snap/docker/current/config/daemon.json`，重启 `sudo snap restart docker`

建议在团队文档中统一 mirror 配置口径，避免不同机器拉取速度差异导致的“启动 Directus 栈”体验不一致。
