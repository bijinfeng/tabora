# @tabora/server

Tabora 自建后端服务。基于 Hono + better-auth + Drizzle ORM。

## 技术栈

- **Hono** + TypeScript（ESM），`@hono/node-server` 运行
- **better-auth**：邮箱密码认证，签发会话（cookie 与 bearer token）
- **Drizzle ORM**：开发 SQLite（better-sqlite3），生产 PostgreSQL（pg）
- **nodemailer**：邮件发送，异步队列处理

## 快速开始

```bash
cp .env.example .env                 # 端口、DB、CORS、auth secret、SMTP
pnpm --filter @tabora/server dev     # tsx watch 热重载
```

开发默认 SQLite（`./data/tabora.db`，首次启动幂等建表）。生产设 `DATABASE_CLIENT=postgres` 与 `DATABASE_URL`。

## 端点概览

| 前缀                 | 鉴权     | 说明                                                 |
| -------------------- | -------- | ---------------------------------------------------- |
| `/api/health`        | 无       | 健康检查                                             |
| `/api/auth/*`        | —        | better-auth 认证（注册/登录/会话/密码重置）          |
| `/api/sync/*`        | 登录用户 | 数据同步 push/pull，owner 隔离                       |
| `/api/attachments/*` | 登录用户 | 附件上传/绑定/访问                                   |
| `/admin-api/*`       | 管理员   | 用户、同步记录、附件、审计、邮件队列、设置、系统监控 |

`/admin-api/*` 全局挂 `requireAdmin` + 审计中间件；`/api/sync`、`/api/attachments` 挂 `requireUser`。全局 `onError` 兜底为 `{ error: { message } }`，不泄漏堆栈。

## 数据库迁移

运行时用幂等 `CREATE TABLE IF NOT EXISTS` 建表。需要迁移文件时：

```bash
pnpm --filter @tabora/server db:generate   # 按 DATABASE_CLIENT 生成到 drizzle/
```

## 验证

```bash
pnpm --filter @tabora/server build   # tsdown 打包
pnpm check                           # 格式 + lint + 类型 + 架构
```
