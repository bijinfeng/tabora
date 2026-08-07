# @tabora/server

Tabora 自建后端服务，提供账号、数据同步、附件和管理端 API。服务基于 Hono + `@hono/node-server`，不依赖外部 CMS。

## 技术栈

- **Hono** + `@hono/node-server`：HTTP 路由和 Node 进程入口
- **Drizzle ORM**：本地开发使用 SQLite（better-sqlite3），生产可使用 PostgreSQL（node-postgres）
- **better-auth**：邮箱密码、会话、bearer token、管理员角色和密码重置
- **Nodemailer + 本地邮件队列**：验证邮件、密码重置和系统邮件
- **本地附件存储**：用户附件上传、绑定和访问

## 当前范围

- 普通用户认证、会话恢复和密码重置。
- 登录用户的 workspace、plugin、plugin instance、plugin data 同步。
- 登录用户的附件上传和访问。
- 管理员用户、同步记录、附件、系统信息、系统设置、邮件队列和审计日志。

## 快速开始

```bash
cp .env.example .env
pnpm --filter @tabora/server dev
```

开发默认使用 SQLite，写入 `./data/tabora.db`，启动时执行幂等建表。生产切换 PostgreSQL：设置 `DATABASE_CLIENT=postgres` 和 `DATABASE_URL`。

## API 端点

| 方法                 | 路径                                 | 访问                                             | 说明                                         |
| -------------------- | ------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| GET                  | `/api/health`                        | 公开                                             | 健康检查                                     |
| GET/POST             | `/api/auth/*`                        | 认证流程                                         | better-auth 注册、登录、会话、验证和密码重置 |
| POST                 | `/api/sync/records`                  | 登录用户                                         | 批量推送同步记录                             |
| GET                  | `/api/sync/records?since=<ISO time>` | 登录用户                                         | 增量拉取同步记录                             |
| `/api/attachments/*` | 登录用户                             | 上传、绑定和访问附件                             |
| `/admin-api/*`       | 管理员                               | 用户、同步记录、附件、系统、设置、邮件队列和审计 |

同步接口按当前用户隔离记录，服务端执行敏感字段过滤、版本冲突判断和 tombstone 删除传播。客户端可使用 cookie 或 bearer token。

## 配置

主要环境变量：

- `HOST`、`PORT`、`CORS_ORIGINS`
- `DATABASE_CLIENT`、`DATABASE_FILE`、`DATABASE_URL`
- `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
- `UPLOADS_DIR`

开发默认值见 [.env.example](./.env.example)。生产环境必须设置足够长度的 `BETTER_AUTH_SECRET`、受限的 CORS 来源和持久化数据库/附件目录。

## 数据库

运行时通过 Drizzle 执行幂等建表。需要生成迁移文件时：

```bash
pnpm --filter @tabora/server db:generate
```

## 验证

```bash
pnpm --dir backend/server test
pnpm --filter @tabora/server build
pnpm check
```
