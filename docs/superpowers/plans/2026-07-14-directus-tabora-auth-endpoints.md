# Directus /tabora/auth Endpoints 扩展实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在本地 Directus 栈中提供 endpoint 扩展，新增 `/tabora/auth/*`（register/login/refresh/logout/session/send-code/verify-code/devices/revoke），并提供不依赖运行中 Directus 的离线测试；更新 compose 挂载 extensions；跑通 `pnpm test`、`pnpm check`。

**架构：** 使用 Directus endpoint extension（`@directus/extensions-sdk` 的 `defineEndpoint`）在 `backend/directus/extensions/endpoints/tabora-auth` 中注册路由；对 auth 核心流程尽量复用 Directus service（AuthenticationService / UsersService）；`send-code/verify-code` 作为 Directus password reset 的薄封装（转发到 `/auth/password/request` 与 `/auth/password/reset`）；`devices/revoke` 通过数据库查询/删除 `directus_sessions`（仅允许操作当前用户）。

**技术栈：** Directus 12, TypeScript/ESM, Vitest

---

## 文件结构（创建/修改）

**创建：**

- `backend/directus/extensions/directus-extension-tabora/dist/index.js`：Directus endpoint 扩展（endpoint id=tabora），注册 `/tabora/auth/*` 路由
- `backend/directus/tests/endpoints/tabora-auth.test.ts`：离线测试（mock router / req / res / services / database / fetch）

**修改：**

- `infra/docker/compose.directus.yml`：为 directus/worker 挂载 `backend/directus/extensions` 到容器内 `/directus/extensions`
- `docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md`：同步“当前实现”范围，补充 auth endpoints 已落地说明

---

### 任务 1：更新 Docker Compose 挂载 extensions

**文件：**

- 修改：`infra/docker/compose.directus.yml`

- [ ] **步骤 1：为 directus 增加 extensions volume 挂载**

目标：在 `services.directus.volumes` 增加：

```yaml
- ../../backend/directus/extensions:/directus/extensions:ro
```

- [ ] **步骤 2：为 worker 增加 extensions volume 挂载**

目标：在 `services.worker.volumes` 增加同样挂载：

```yaml
- ../../backend/directus/extensions:/directus/extensions:ro
```

- [ ] **步骤 3：运行格式与类型检查**

运行：`pnpm check`
预期：PASS

---

### 任务 2：实现 Directus endpoint 扩展（/tabora/auth/\*）

**文件：**

- 创建：`backend/directus/extensions/directus-extension-tabora/dist/index.js`

**路由与行为：**

- `POST /tabora/auth/register`（router 路径 `/auth/register`）→ 薄封装 Directus `POST /register`（成功统一 204）
- `POST /tabora/auth/login`（router 路径 `/auth/login`）→ `AuthenticationService.login(...)`（JSON mode，返回 `{ data: { access_token, refresh_token, expires } }`）
- `POST /tabora/auth/refresh`（router 路径 `/auth/refresh`）→ `AuthenticationService.refresh(refresh_token)`（JSON mode，返回同结构）
- `POST /tabora/auth/logout`（router 路径 `/auth/logout`）→ `AuthenticationService.logout(refresh_token)`（204）
- `GET /tabora/auth/session`（router 路径 `/auth/session`）→ `UsersService.readOne("me")`（需要 bearer token / accountability.user）
- `POST /tabora/auth/send-code`（router 路径 `/auth/send-code`）→ 转发到 `POST /auth/password/request`（成功统一 204）
- `POST /tabora/auth/verify-code`（router 路径 `/auth/verify-code`）→ 转发到 `POST /auth/password/reset`（兼容 `code -> token`，成功统一 204）
- `GET /tabora/auth/devices`（router 路径 `/auth/devices`）→ select `directus_sessions` where `user = accountability.user`
- `POST /tabora/auth/revoke`（router 路径 `/auth/revoke`）→ delete `directus_sessions` where `id = session_id` and `user = accountability.user`（204）

- [ ] **步骤 1：先写失败的离线测试用例骨架**

在测试中先假设扩展导出 default，可被导入并注册路由。

- [ ] **步骤 2：实现最小 endpoint 扩展并跑测试**

实现内容：

- 使用 `defineEndpoint` 默认导出
- 注册上述 routes
- 对每个 handler：校验必填字段，缺失返回 400；需要登录的接口在 `!req.accountability?.user` 时返回 401

- [ ] **步骤 3：运行 directus 包测试**

运行：`pnpm --dir backend/directus test`
预期：PASS

---

### 任务 3：补齐“离线测试”（不依赖运行中 Directus）

**文件：**

- 创建：`backend/directus/tests/endpoints/tabora-auth.test.ts`

**测试策略：**

- mock `router.{get,post}` 捕获注册的 handler
- mock `req/res/next`，在不启动 express / 不启动 Directus 的情况下直接调用 handler
- mock `services.AuthenticationService` / `services.UsersService` / `database`（knex-like）/ `globalThis.fetch`

- [ ] **步骤 1：login/refresh/logout 的 token 形状测试**

示例断言（token 字段对齐 Directus）：

```ts
expect(jsonPayload).toEqual({
  data: {
    access_token: "token",
    refresh_token: "refresh",
    expires: 900,
  },
})
```

- [ ] **步骤 2：send-code/verify-code 转发测试**

断言：

- `send-code` → fetch `${baseUrl}/auth/password/request`
- `verify-code` → fetch `${baseUrl}/auth/password/reset`
- `verify-code` 支持 `code` 字段映射到 `token`

- [ ] **步骤 3：devices/revoke 需要登录**

断言：

- 未登录（无 accountability.user）→ 401
- revoke 成功 → 204

- [ ] **步骤 4：运行 directus 包测试**

运行：`pnpm --dir backend/directus test`
预期：PASS

---

### 任务 4：同步文档“当前实现对齐”

**文件：**

- 修改：`docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md`

- [ ] **步骤 1：更新非目标条目**

将“未实现业务 endpoints（auth/attachments/sync 等）”调整为：auth endpoints 已实现；其他仍未实现（attachments/sync 等）。

- [ ] **步骤 2：新增 auth endpoints 小节**

补充：

- endpoints 列表
- password reset 薄封装语义
- devices/revoke 基于 `directus_sessions` 的自助设备管理语义（仅操作自己的 session）

- [ ] **步骤 3：运行格式检查**

运行：`pnpm check`
预期：PASS

---

### 任务 5：全仓验证

- [ ] **步骤 1：运行测试**

运行：`pnpm test`
预期：PASS

- [ ] **步骤 2：运行检查**

运行：`pnpm check`
预期：PASS
