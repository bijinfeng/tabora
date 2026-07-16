# Directus Backend

Tabora 后端服务，基于 [Directus](https://directus.io/) 构建。

## 目录结构

```
backend/directus/
├── docker/
│   ├── compose.dev.yml      # 开发环境 Docker Compose
│   ├── compose.prod.yml     # 生产环境 Docker Compose
│   └── nginx/
│       └── default.conf     # Nginx 反向代理配置
├── extensions/
│   └── directus-extension-tabora/
│       └── src/
│           ├── index.ts       # endpoint 组合入口
│           ├── auth.ts        # 注册、登录和密码找回
│           ├── sessions.ts    # 会话列表与撤销
│           ├── sync.ts        # 数据同步 pull/push（LWW + tombstone）
│           ├── syncSensitiveFilter.ts # 同步 payload 敏感字段过滤
│           ├── attachments.ts # 附件 policy、引用和删除
│           ├── http.ts        # 请求校验与异步 handler
│           ├── errors.ts      # Directus 标准错误
│           └── types.ts       # 扩展内部类型
├── scripts/
│   └── provisionSchema.ts   # 数据库 schema 初始化
├── .env.example             # 环境变量模板
├── Dockerfile               # 生产镜像构建
├── DEPLOYMENT.md            # 详细部署文档
└── package.json
```

## 本地开发

### 前置要求

- Node.js >= 24
- pnpm >= 11.5.2
- Docker 和 Docker Compose（可选）

### 快速开始

#### 方式一：直接运行（需要手动启动依赖）

1. 确保 PostgreSQL、Redis、MinIO 已运行
2. 配置环境变量：
   ```bash
   cp .env.example .env
   # 编辑 .env 配置数据库连接
   ```
3. 启动：
   ```bash
   pnpm dev
   ```

#### 方式二：使用 Docker Compose（推荐）

```bash
# 启动所有服务（PostgreSQL, Redis, MinIO, Directus, Nginx）
pnpm docker:dev

# 首次运行需要初始化数据库
pnpm schema:provision

# 查看日志
docker compose -f docker/compose.dev.yml logs -f

# 停止服务
pnpm docker:stop
```

访问：

- Directus Admin: http://localhost:8055
- Nginx 代理: http://localhost:8080
- MinIO Console: http://localhost:9001

## 生产部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速部署：

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，设置生产凭据

# 2. 构建并启动
pnpm docker:build
pnpm docker:prod

# 3. 初始化数据库（首次部署）
docker compose -f docker/compose.prod.yml exec directus npx directus bootstrap
```

## 扩展开发

自定义扩展位于 `extensions/directus-extension-tabora/`。

开发流程：

1. 修改扩展代码
2. 运行扩展类型检查和构建：
   ```bash
   pnpm --filter directus-extension-tabora typecheck
   pnpm --filter directus-extension-tabora build
   ```
3. 运行 endpoint 测试：
   ```bash
   pnpm test -- tests/endpoints/tabora-auth.test.ts tests/endpoints/tabora-attachments.test.ts
   ```
4. 重启 Directus：`pnpm dev`

生产部署时，扩展会通过 Dockerfile 打包进镜像。

Endpoint 测试直接导入 `src/index.ts`，确保测试覆盖当前源码；部署仍以 SDK 生成的 `dist/index.js` 为准。

## 测试

```bash
pnpm test
```

## 常用命令

| 命令                    | 说明                         |
| ----------------------- | ---------------------------- |
| `pnpm dev`              | 启动 Directus 开发服务器     |
| `pnpm docker:dev`       | 启动 Docker Compose 开发环境 |
| `pnpm docker:prod`      | 启动 Docker Compose 生产环境 |
| `pnpm docker:stop`      | 停止 Docker Compose          |
| `pnpm docker:build`     | 构建生产镜像                 |
| `pnpm schema:provision` | 初始化数据库 schema          |
| `pnpm test`             | 运行测试                     |

## 环境变量

关键配置项（详见 `.env.example`）：

- `KEY` / `SECRET`: Directus 加密密钥
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: 管理员账号
- `DB_*`: PostgreSQL 连接配置
- `REDIS`: Redis 连接 URL
- `STORAGE_S3_*`: S3/MinIO 存储配置

## 相关文档

- [Directus 官方文档](https://docs.directus.io/)
- [部署指南](./DEPLOYMENT.md)
