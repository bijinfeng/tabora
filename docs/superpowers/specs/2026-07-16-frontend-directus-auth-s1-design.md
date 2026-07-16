# S1 前端登录注册接入 Directus 设计

日期：2026-07-16

状态：设计稿（已与用户逐节确认）

## 背景与定位

Tabora 官方账号与数据同步已确认**全面转向 Directus 后端**（放弃前端现有的 Supabase 方案），认证方式采用**邮箱 + 密码**。

当前状态盘点：

- **Directus 后端 auth 端点已就绪**：`/tabora/auth/register`、`/login`、`/refresh`、`/logout`、`/session`、`/devices`、`/revoke`、`/send-code`、`/verify-code`，且已有 endpoint 测试覆盖。
- **前端账号页**（`packages/official-plugins/src/settings-workspace.account.tsx`）是**邮箱 + 验证码(OTP) 的纯 mock**，全部本地状态，无任何 API 调用。
- **前端认证/同步层**（`packages/sync/src/authSession.ts`、`gatewayClient.ts`、`syncManager.ts`）基于 **Supabase**（`@supabase/supabase-js` + Email OTP + Edge Function 网关）。
- **同步在 `bootstrap.ts` 中完全禁用**：`supabaseUrl`/`supabaseAnonKey`/`gatewayUrl` 硬编码为 `undefined`，`createSyncManager` 从不执行。

整体工作拆为三个子项目，各自独立 spec → plan → implement：

- **S1（本文档）**：前端登录注册接入。抽出独立认证模块，接通账号页的登录/注册/退出/会话恢复/忘记密码。后端已就绪。
- **S2**：Directus 数据同步网关（后端）。新增同步 schema + gateway 端点。
- **S3**：前端同步客户端接入与装配。`gatewayClient`/`syncManager`/`bootstrap` 指向 Directus，清理 Supabase 依赖，接通同步设置页与"立即同步"。

本文档只覆盖 S1。

## 目标

- 新建独立包 `@tabora/auth`，承载 Directus 邮箱+密码认证会话逻辑。
- 账号设置页从 OTP mock 改为真实的邮箱+密码登录/注册/退出。
- 支持会话恢复（刷新页面/重启后自动恢复登录态）与 access token 自动刷新。
- 支持"忘记密码"流程（复用后端 `send-code` / `verify-code`）。
- 后端地址通过 Vite 环境变量注入，未配置时降级为纯本地模式，不报错。

## 非目标（YAGNI）

- 设备列表 UI、移除设备（S3 / 设备管理）。
- 立即同步、同步状态页真实化（S3）。
- 清理 `packages/sync` 的 supabase-js 依赖（S3 彻底处理；S1 只做 re-export 兼容）。
- 任何后端改动（后端 auth 已就绪并有测试）。

## 架构

### 1. 独立认证模块 `@tabora/auth`

新建 `packages/auth/`，把认证会话逻辑从 `packages/sync` 抽出，供 S1 的 UI 与后续 S3 的 sync 共用。只依赖 `@tabora/host-adapters` 的 `AuthStorage`，不依赖 sync。

工厂 `createDirectusAuthClient(config)`：

```
config: { apiBaseUrl: string; storage: AuthStorage }
```

会话形状（替代原 Supabase `AuthSession`）：

```ts
type DirectusSession = {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch ms
  sessionId: string // 后端返回的稳定 session_id
}
```

方法与后端映射：

| 方法                                        | 后端端点                       | 说明                                   |
| ------------------------------------------- | ------------------------------ | -------------------------------------- |
| `register(email, password)`                 | `POST /auth/register` (204)    | 注册，不返回会话                       |
| `login(email, password): DirectusSession`   | `POST /auth/login`             | 返回 access/refresh/expires/session_id |
| `logout(): void`                            | `POST /auth/logout`            | 带 `refresh_token`，清本地会话         |
| `getSession(): DirectusSession \| null`     | 读 storage，过期则自动 refresh | 会话恢复入口                           |
| `refreshSession(): DirectusSession \| null` | `POST /auth/refresh`           | 写回新 token + 新 session_id           |
| `getCurrentUser(): {id,email,...} \| null`  | `GET /auth/session`            | 带 access token                        |
| `requestPasswordReset(email): void`         | `POST /auth/send-code` (204)   | 忘记密码第一步                         |
| `resetPassword(code, newPassword): void`    | `POST /auth/verify-code` (204) | 忘记密码第二步                         |

会话持久化：沿用 `AuthStorage`（web=localStorage，extension=chrome.storage.local），存 JSON 串（key `tabora.auth.session`）。内部一个薄 `fetch` 包装负责 JSON 编解码、Bearer 头、错误归一化。

边界：此包只管认证会话，不碰同步、不碰 supabase-js。原 `packages/sync/src/authSession.ts` 在 S1 改为从 `@tabora/auth` re-export（保持 sync 现有 import 不断），S3 再彻底清理 Supabase 依赖。

### 2. 配置注入与 host 接线

后端地址注入链路：Vite 环境变量 → shellConfig → runtime → host。

1. `WorkbenchShellConfig` 增加可选字段 `auth?: { apiBaseUrl: string }`。可选：未配置时降级为纯本地模式。
2. 两个 app 各自读环境变量并透传：
   - playground：`apps/playground/src/workbenchComposition.ts` 读 `import.meta.env.VITE_TABORA_API_BASE`，拼进 `shellConfig`。
   - extension：`apps/extension/entrypoints/newtab/workbenchComposition.ts` 同样读 `import.meta.env.VITE_TABORA_API_BASE`（WXT 走 Vite）。
   - 两个 app 各加 `.env.example` 条目，值形如 `http://localhost:8080/tabora`（Nginx 代理前缀）。
3. `builtinWorkbenchShellConfig` 不写死地址，app 层注入后覆盖 `auth` 字段。

runtime 侧：

4. `createWorkbenchRuntimeBootstrap`（`bootstrap.ts`）：当 `shellConfig.auth?.apiBaseUrl` 存在时，用 `createDirectusAuthClient({ apiBaseUrl, storage })` 建认证客户端（storage 按 `host.platform` 选 local/chrome，复用现有逻辑），挂到 bootstrap 返回值新增字段 `authClient?`。当前禁用的 supabase/gateway 分支 S1 不动（留给 S3），只新增 authClient。

host 接线：

5. `SettingsPanelViewProps.host` 增加可选认证方法（未配置时为 `undefined`，UI 据此降级）：

```ts
auth?: {
  getSession(): Promise<Session | null>
  login(email: string, password: string): Promise<void>
  register(email: string, password: string): Promise<void>
  logout(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, password: string): Promise<void>
}
```

6. `WorkbenchShellApp.tsx` 的 `host: { ... }` 对象里把这些方法接到 bootstrap 的 `authClient`（存在才接）。

账号页只通过 `props.host.auth` 拿能力，不直接 import `@tabora/auth`，符合"面板经 host 访问平台能力"的边界。

### 3. 账号页 UI 改造与状态

改造 `settings-workspace.account.tsx`，从 OTP mock 换成真实邮箱+密码，通过 `props.host.auth` 调用。

页面状态机（`phase` 信号）：

```
"loading"       → 挂载时 getSession() 探测会话恢复中
"signed-out"    → 邮箱 + 密码 + [登录] [注册] + "忘记密码?" 链接
"reset-request" → 忘记密码第一步：邮箱 + [发送验证码]
"reset-verify"  → 忘记密码第二步：验证码 + 新密码 + [重置密码]
"signed-in"     → 显示邮箱/账号 + [退出]
```

交互与调用：

- 挂载 `onMount` 调 `host.auth?.getSession()`：有会话 → 拉 `getCurrentUser()` 显示邮箱，进 `signed-in`；无 → `signed-out`。若 `host.auth` 为 `undefined` → 显示"未配置同步服务，当前为本地模式"，隐藏表单。
- 登录：`login(email, password)`，成功进 `signed-in`。
- 注册：`register(email, password)` 成功后**自动接一次 login**（后端 register 返回 204 不带会话），进 `signed-in`。
- 忘记密码：`requestPasswordReset(email)` → `reset-verify`；`resetPassword(code, newPassword)` 成功 → 回 `signed-out` 并提示"密码已重置，请登录"。
- 退出：`logout()` → `signed-out`。

校验与错误：

- 客户端最小校验：邮箱格式、密码非空、注册密码长度（≥8，实现时与后端 Directus 密码策略对齐确认）。
- 每个异步动作有 loading 态（按钮 disabled + 文案），失败把归一化错误码映射成中文提示，放在现有 `auth-status` 行。
- 表单用现有 `@tabora/ui` 的 `Input`/`Button`，复用现有 CSS 结构，尽量不动样式类名，密码框 `type="password"`。

范围边界：账号页不触发同步、不显示设备列表。S1 只做"能登录/注册/找回/退出/刷新恢复"。

## 错误处理

`@tabora/auth` 内部统一错误归一化，`fetch` 包装把所有失败收敛成结构化结果，不向 UI 抛裸 `Error`：

```ts
type AuthResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
```

错误码：

| 码                    | 触发                                                |
| --------------------- | --------------------------------------------------- |
| `NETWORK_ERROR`       | 网络/超时/JSON 解析失败                             |
| `INVALID_CREDENTIALS` | 登录 401（Directus `INVALID_CREDENTIALS`）          |
| `INVALID_PAYLOAD`     | 400 校验失败（邮箱格式、密码策略）                  |
| `EMAIL_IN_USE`        | 注册邮箱已存在（Directus `RECORD_NOT_UNIQUE` 映射） |
| `RESET_INVALID`       | 验证码错误/过期                                     |
| `UNKNOWN`             | 兜底                                                |

映射规则：读 Directus 错误响应的 `errors[0].extensions.code`，翻译成上述码。UI 层维护"码 → 中文文案"表，不把后端英文原文透给用户（与后端"不透出上游错误文本"一致）。

会话刷新语义：`getSession()` 发现 `expiresAt` 已过（留 30s 余量）时自动调 `refreshSession()`；刷新失败（refresh token 失效）则清空本地会话、返回 `null`，UI 落回 `signed-out`；刷新成功写回新 token + 新 `sessionId`。

## 测试

- `packages/auth`：单测（mock `fetch`）覆盖 register / login / logout / getSession 命中缓存 / getSession 触发自动刷新 / 刷新失败清会话 / requestPasswordReset / resetPassword / 各错误码映射。
- 账号页组件测：`signed-out → signed-in`（登录）、注册后自动登录、忘记密码两步、退出、`host.auth` 未配置降级、会话恢复。
- 不新增后端测试（后端 auth 端点已有覆盖）。

## 验证

按 AGENTS.md（package 代码变更 + 新增包 + 跨包类型导出）：

```bash
pnpm test
pnpm check
pnpm build
```

## 文档同步

- 在 `docs/README.md` 的「阶段性实施记录」登记本 spec 与后续 plan。
- S1 落地后如影响架构边界描述，同步相关事实源（本项目主要是新增前端认证包，暂不改 PRD/技术方案核心口径；数据同步后端形态由 S2 决定，届时需处理 PRD 中"后端平台 = Supabase"与实际转向 Directus 的差异）。
