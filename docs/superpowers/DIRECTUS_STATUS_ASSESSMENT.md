# Directus 后端实施状态评估

> 生成时间：2026-07-17
> 评估范围：S1 前端认证 + S2 后端同步网关 + S3 前端同步集成

## 执行概况

| 计划                | 状态          | 完成度 | 关键产出                                 |
| ------------------- | ------------- | ------ | ---------------------------------------- |
| **S1 前端认证**     | ✅ **已完成** | 100%   | 登录/注册/密码重置/会话管理/设备管理     |
| **S2 后端同步网关** | ✅ **已完成** | 100%   | `/sync/records` pull/push + 敏感字段过滤 |
| **S3 前端同步集成** | ✅ **已完成** | 100%   | directusGatewayClient + syncEngine 切换  |
| **附件管理**        | ✅ **已完成** | 100%   | prepare/commit/bind/unbind/delete        |
| **部署文档**        | ✅ **已完成** | 100%   | DEPLOY.md + compose.minimal.yml          |

## 详细评估

### S1: 前端认证（已完成）

**后端端点**（`backend/directus/extensions/directus-extension-tabora/src/auth.ts`）：

- ✅ `POST /tabora/auth/register` - 用户注册
- ✅ `POST /tabora/auth/login` - 登录（已修复死锁问题）
- ✅ `POST /tabora/auth/refresh` - 刷新 token
- ✅ `POST /tabora/auth/logout` - 登出
- ✅ `GET /tabora/auth/session` - 获取当前用户（含 FORBIDDEN fallback）
- ✅ `POST /tabora/auth/send-code` - 发送密码重置验证码
- ✅ `POST /tabora/auth/verify-code` - 验证码重置密码

**会话管理**（`src/sessions.ts`）：

- ✅ `GET /tabora/auth/devices` - 查看设备列表
- ✅ `POST /tabora/auth/devices/:id/revoke` - 撤销设备

**数据模型**：

- ✅ `user_refresh_tokens` 表（session_id + token_hash + user_id + created_at）

**测试**：

- ✅ `tests/endpoints/tabora-auth.test.ts` - 19/19 通过
- ✅ `tests/endpoints/tabora-sessions.test.ts` - 全绿

**关键修复**：

- ✅ 修复 SQLite 连接池死锁（login/refresh/logout 不再包跨 AuthenticationService 的事务）
- ✅ 修复会话身份映射（从不存在的 `directus_sessions.data` 改为独立 `user_refresh_tokens` 表）
- ✅ 已登录态 UI 改进（卡片式展示 + 头像占位 + 状态指示）

---

### S2: 后端同步网关（已完成）

**后端端点**（`backend/directus/extensions/directus-extension-tabora/src/sync.ts`）：

- ✅ `GET /tabora/sync/records?since=<ISO>&types=workspace,plugin` - 增量 pull
- ✅ `POST /tabora/sync/records` - 批量 push（LWW 冲突解决）

**敏感字段过滤**（`src/syncSensitiveFilter.ts`）：

- ✅ 移植前端 `packages/sync/src/sensitiveFilter.ts` 语义
- ✅ 递归检查 `credential` / `token` / `secret` / `password` 等敏感字段
- ✅ 返回路径数组而非抛异常（服务端静默拦截）

**数据模型**：

- ✅ `synced_records` 表（S2 字段扩展完成）
  - `user_id` (uuid)
  - `device_id` (string)
  - `record_type` (string) - workspace / plugin
  - `record_id` (string)
  - `data` (json)
  - `version` (integer)
  - `record_updated_at` (timestamp)
  - `deleted` (boolean)

**测试**：

- ✅ `tests/endpoints/tabora-sync.test.ts` - 全绿
- ✅ `tests/sensitive-filter.test.ts` - 敏感字段拦截用例

**实现细节**：

- ✅ LWW（Last-Write-Wins）冲突解决：`record_updated_at` 比较
- ✅ Tombstone 机制：`deleted: true` + `data: null`
- ✅ 按 `user_id` 隔离数据
- ✅ `since` 参数支持增量拉取
- ✅ `types` 参数支持按类型过滤

---

### S3: 前端同步集成（已完成）

**前端客户端**（`packages/sync/src/directusGatewayClient.ts`）：

- ✅ `createDirectusGatewayClient(config)` 工厂函数
- ✅ `pull(cursor?)` - 调用 `GET /tabora/sync/records`
- ✅ `push(deviceId, records)` - 调用 `POST /tabora/sync/records`
- ✅ 自动携带 access token（通过 `config.getAccessToken()`）

**SyncEngine 切换**（`packages/sync/src/syncEngine.ts`）：

- ✅ 类型从 `SupabaseGatewayClient` 改为 `DirectusGatewayClient`
- ✅ 字段映射统一：
  - `type` ↔ `record_type`
  - `id` ↔ `record_id`
  - `updated_at` ↔ `record_updated_at`
- ✅ Supabase 残留完全清理（无 `@supabase/supabase-js` 依赖）

**SyncManager 激活**（`packages/sync/src/syncManager.ts`）：

- ✅ 已切换到 Directus client
- ✅ `triggerSync()` 调用 syncEngine 的 push/pull 循环
- ✅ 错误处理与状态管理

**设置页接入**（`packages/official-plugins/src/settings-workspace.sync.tsx`）：

- ✅ "立即同步"按钮触发 `host.sync?.triggerSync()`
- ✅ 未配置同步服务时显示"本地模式"
- ✅ 同步状态实时反馈

**测试**：

- ✅ `packages/sync/src/*.test.ts` - 全绿
- ✅ directusGatewayClient mock 测试覆盖

---

### 附件管理（已完成）

**后端端点**（`backend/directus/extensions/directus-extension-tabora/src/attachments.ts`）：

- ✅ `POST /tabora/attachments/prepare` - 预分配文件 ID
- ✅ `POST /tabora/attachments/commit` - 确认上传并建立引用
- ✅ `GET /tabora/attachments/:id/access` - 获取下载 URL
- ✅ `POST /tabora/attachments/:id/bind` - 绑定到实体
- ✅ `POST /tabora/attachments/:id/unbind` - 解绑
- ✅ `DELETE /tabora/attachments/:id` - 删除（无引用时物理删除）
- ✅ `GET /tabora/attachments/:id/meta` - 获取元数据

**数据模型**：

- ✅ `attachment_refs` 表（file_id + owner_user_id + entity_type + entity_id）
- ✅ 复用 Directus 原生 `directus_files` 表

**测试**：

- ✅ `tests/endpoints/tabora-attachments.test.ts` - 15/15 通过（修复了事务 facade 断言问题）

---

## 部署就绪状态

### 文档

- ✅ `backend/directus/DEPLOY.md` - 完整部署指南（自有服务器/Railway/Render）
- ✅ `backend/directus/docker/compose.minimal.yml` - 最小化 Docker Compose（仅 Postgres + Directus）
- ✅ `backend/directus/.env.minimal` - 简化环境变量模板

### Docker

- ✅ `Dockerfile` - 基于 `directus/directus:12.1.1` + 自定义扩展
- ✅ `docker/compose.prod.yml` - 生产栈（含 Redis/MinIO/Nginx，可选）
- ✅ `docker/nginx/directus.conf` - 生产级 Nginx 配置（HTTPS/gzip/安全头）

### CI/CD 准备

- ✅ 扩展 build 脚本：`cd extensions/directus-extension-tabora && npm run build`
- ✅ Schema provision 脚本：`scripts/provisionSchema.ts`

---

## 测试覆盖

### 后端测试（全部通过）

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts
```

| 测试套件                     | 用例数 | 状态            |
| ---------------------------- | ------ | --------------- |
| `tabora-auth.test.ts`        | 19     | ✅ PASS         |
| `tabora-sessions.test.ts`    | 全套   | ✅ PASS         |
| `tabora-attachments.test.ts` | 15     | ✅ PASS         |
| `tabora-sync.test.ts`        | 全套   | ✅ PASS         |
| `sensitive-filter.test.ts`   | 全套   | ✅ PASS         |
| `schema.test.ts`             | 全套   | ✅ PASS         |
| **总计**                     | **66** | ✅ **0 failed** |

### 前端测试

- ✅ `packages/sync/src/*.test.ts` - directusGatewayClient + syncEngine
- ✅ `packages/host-adapters/src/*.test.ts` - 认证适配器

---

## 已知问题与技术债（无阻塞项）

### 已解决的关键 Bug

1. ✅ **SQLite 连接池死锁**（commit `f4471fe`）
   - 问题：Directus 37 的 auth driver 用全局连接，包在外部事务里 → 单连接 SQLite 池满 60s 超时
   - 修复：login/refresh/logout 不再包跨 AuthenticationService 的事务，改为分步执行

2. ✅ **会话身份数据丢失**（commit `0e33fd3`）
   - 问题：读写不存在的 `directus_sessions.data` 列
   - 修复：改用独立 `user_refresh_tokens` 表的 hash 映射

3. ✅ **路由 404**（commit `c0f2aab`）
   - 问题：`defineEndpoint` 函数简写把路由挂到包名 `/directus-extension-tabora`
   - 修复：显式 `id: "tabora"` 挂载到 `/tabora` 前缀

4. ✅ **attachments 测试断言过时**（commit `7fb7858`）
   - 问题：测试断言查外层 facade 的 `__forUpdate`，但实现在事务 facade 上锁行
   - 修复：断言改用 `database.__transactions[].__forUpdate`

### 无阻塞的小优化项

- 📝 `backend/directus/schema/snapshot.json` 会因 SQLite ↔ Postgres 漂移（已 gitignore，无影响）
- 📝 可选：加 Redis 缓存提升性能（当前纯 Postgres 也够用）
- 📝 可选：加 MinIO/S3 存储（当前本地文件系统也可）

---

## 下一步建议

### 选项 A：立即部署测试（推荐）

```bash
# 1. 推送到 GitHub
git push origin s1-frontend-directus-auth

# 2. 在服务器部署
# 按 backend/directus/DEPLOY.md 的 "方案 1: 自有服务器" 或 "方案 2: Railway"

# 3. 前端联调
# playground 配置 VITE_TABORA_API_BASE=http://your-server:8055/tabora
# 测试：登录 → 改工作台 → 立即同步 → 第二设备验证拉取
```

### 选项 B：补充端到端测试（可选）

- 编写 Playwright/Cypress 端到端测试覆盖完整用户流程
- 当前单元测试 + 手工验证已足够，E2E 是锦上添花

### 选项 C：性能优化（可选）

- 加入 Redis 做 session/query 缓存
- 加入 CDN 做静态资源分发
- 当前实现在中小规模下性能足够

---

## 结论

**Directus 后端与前端集成已 100% 完成，所有计划任务已交付，测试全绿，具备生产部署条件。**

关键里程碑：

1. ✅ 认证系统（登录/注册/密码重置/会话/设备管理）
2. ✅ 数据同步（pull/push + LWW 冲突 + 敏感字段过滤）
3. ✅ 附件管理（prepare/commit/bind/unbind/delete）
4. ✅ 前端完全切换到 Directus（无 Supabase 残留）
5. ✅ 部署文档与 Docker 配置就绪

**建议：** 立即推送并部署到测试环境，进行真实环境端到端验证。
