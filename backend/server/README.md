# @tabora/server

Tabora 自建后端服务，替代 Strapi。基于 Fastify + Drizzle ORM。

## 技术栈

- **Fastify 5** + TypeScript（ESM）
- **Drizzle ORM**：本地开发 SQLite（better-sqlite3），生产 PostgreSQL（node-postgres）
- **认证**：`@fastify/jwt` 签发管理员会话，`argon2id` 哈希密码

## 当前范围

仅管理员认证。用户认证、数据同步、附件为后续迭代。

## 快速开始

```bash
cp .env.example .env        # 配置端口、DB、JWT secret
pnpm --filter @tabora/server dev     # tsx watch 热重载
```

开发默认 SQLite，写入 `./data/tabora.db`，首次启动幂等建表。

生产切 PostgreSQL：设 `DATABASE_CLIENT=postgres` 和 `DATABASE_URL`。

## API 端点

| 方法 | 路径                       | 说明                                                        |
| ---- | -------------------------- | ----------------------------------------------------------- |
| GET  | `/api/health`              | 健康检查                                                    |
| GET  | `/admin-api/auth/init`     | 是否已存在管理员 `{ hasAdmin }`                             |
| POST | `/admin-api/auth/register` | 初始化首个管理员（仅当无管理员时），返回 `{ token, admin }` |
| POST | `/admin-api/auth/login`    | 管理员登录，返回 `{ token, admin }`                         |

`register` 弱密码返回 `422`；已存在管理员时返回 `409`。`login` 凭据错误返回 `401`。
错误体形如 `{ error: { name, message } }`，与 `@tabora/admin` 客户端归一化对齐。

## 数据库迁移

运行时用幂等 `CREATE TABLE IF NOT EXISTS` 建表。需要 Drizzle 迁移文件时：

```bash
pnpm --filter @tabora/server db:generate   # 按 DATABASE_CLIENT 生成到 drizzle/
```

## 验证

```bash
pnpm --filter @tabora/server build   # tsdown 打包
pnpm check                           # 格式化 + lint + 类型 + 架构
```
