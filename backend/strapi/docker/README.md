# Strapi Docker 部署

**重要**: Strapi 已从 pnpm monorepo 独立出来，使用 npm 管理依赖。

## 开发环境

开发环境使用热重载，代码挂载到容器内：

```bash
cd backend/strapi/docker
docker compose -f compose.dev.yml up
```

访问：

- Strapi Admin: http://localhost:1337/admin
- API: http://localhost:1337/api
- PostgreSQL: localhost:5433

## 生产环境

### 前置准备

1. **生成安全密钥**：

```bash
# 生成随机密钥
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

2. **创建 `.env` 文件**（不要提交到 Git）：

```bash
# 复制示例文件
cp ../.env.example ../.env

# 编辑并填入真实密钥
vim ../.env
```

必须修改的字段：

- `APP_KEYS`: 4个随机密钥，逗号分隔
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DATABASE_PASSWORD`: 强密码

### 启动生产容器

```bash
cd backend/strapi/docker
docker compose -f compose.prod.yml up -d
```

访问：http://localhost:1337

### 使用 Docker Secrets（推荐）

在 Swarm 或 Kubernetes 环境中，使用 secrets 而非 `.env` 文件：

```yaml
services:
  strapi:
    secrets:
      - db_password
      - app_keys
    environment:
      DATABASE_PASSWORD: /run/secrets/db_password
      APP_KEYS: /run/secrets/app_keys

secrets:
  db_password:
    external: true
  app_keys:
    external: true
```

## 数据持久化

生产环境使用 Docker volumes：

- `postgres_data`: 数据库数据
- `strapi_uploads`: 用户上传的文件

**备份**：

```bash
# 备份数据库
docker exec strapi-postgres-1 pg_dump -U strapi strapi > backup.sql

# 备份上传文件
docker run --rm -v strapi_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .
```

**恢复**：

```bash
# 恢复数据库
cat backup.sql | docker exec -i strapi-postgres-1 psql -U strapi strapi

# 恢复上传文件
docker run --rm -v strapi_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads.tar.gz -C /data
```

## 架构说明

### Dockerfile 多阶段构建

1. **build**: 安装全量依赖（包含 devDependencies），构建 Strapi Admin 面板并编译 TypeScript。
2. **runner**: 依据 `package-lock.json` 独立执行 `npm ci --omit=dev`，仅安装生产依赖和构建产物。

`build` 阶段包含 `python3`、`make` 和 `g++`，只用于本地 SQLite 开发依赖 `better-sqlite3` 等原生模块在预编译包不可用时的回退编译。生产 compose 固定使用 PostgreSQL，因此 `better-sqlite3` 是开发依赖，runner 不会安装它，也不带入编译工具。

runner 在安装 production dependencies 后执行 `scripts/prune-production-files.mjs`，只删除 source map、TypeScript 类型/源码、测试、示例和文档文件；JavaScript 运行文件与许可证保留。npm 下载缓存通过 BuildKit cache mount 复用，只加速构建，不会进入镜像层。

容器以 UID/GID `1001` 的 `strapi` 非 root 用户运行。`/app/public/uploads` 会在降权前创建并授权给该用户，因此 `strapi_uploads` Docker volume 可以继续保存用户上传文件。

**为何不在安装前设置 `NODE_ENV=production`？**

Strapi 文档明确要求：构建 admin 面板需要 devDependencies（如 `@strapi/admin`、Webpack 等）。如果过早设置 `NODE_ENV=production`，`npm install` 会跳过这些依赖，导致构建失败。

正确流程：

1. 安装全量依赖（无 `NODE_ENV=production`）
2. 构建（此时可以访问 devDependencies）
3. runner 依据 lockfile 独立安装 production dependencies（`npm ci --omit=dev`）
4. runner 裁剪仅开发/调试文件并复制构建产物

### 检查镜像体积

构建后可检查镜像总大小和各层大小，记录 `Size` 与最大的 `SIZE` 层，作为后续依赖变更的对比基准：

```bash
docker build --tag tabora-strapi:optimized --file ../Dockerfile ..
docker image inspect tabora-strapi:optimized --format '{{.Size}}'
docker history --no-trunc --format 'table {{.Size}}\t{{.CreatedBy}}' tabora-strapi:optimized
```

生产镜像不会包含本地 `node_modules`、测试、数据库文件、已有上传文件或 npm 下载缓存。

### 数据库连接池

配置 `pool.min = 0` 是 Docker 环境最佳实践：

- Docker 容器空闲时，数据库可能终止长时间未活动的连接
- `min: 0` 允许连接池在无请求时缩减到零，避免"连接已关闭"错误
- 新请求到达时，连接池会自动创建新连接

### 为何不用 nginx？

对于简单部署，直接暴露 Strapi 端口即可。需要反向代理的场景：

- 多服务统一入口（API + 前端）
- HTTPS 终止
- 静态资源缓存
- 速率限制、WAF

如需添加 nginx，参考 `nginx/` 目录中的配置模板。

## 生产检查清单

- [ ] 所有密钥已替换为随机值（不使用示例值）
- [ ] 数据库密码为强密码
- [ ] `.env` 文件未提交到 Git（已在 `.gitignore` 中）
- [ ] 配置了 volume 或外部存储（S3）持久化上传文件
- [ ] 设置了备份策略
- [ ] 验证了健康检查正常（`docker ps` 显示 healthy）
- [ ] 生产环境未暴露数据库端口（compose.prod.yml 中 postgres 无 `ports`）
- [ ] 设置了重启策略（`restart: unless-stopped`）

## 常见问题

**Q: 为何用 Node 22 而非 Node 20？**

A: Node 22 是当前 LTS 版本（截至 2026年），Strapi 5.x 支持 Node 20-26。

**Q: Apple Silicon (ARM64) 构建慢？**

A: 在 Dockerfile 添加：

```dockerfile
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
```

或移除 `platform: linux/amd64` 让镜像原生 ARM 构建。

**Q: 如何查看日志？**

A:

```bash
docker compose -f compose.prod.yml logs -f strapi
docker compose -f compose.prod.yml logs -f postgres
```

**Q: 数据库连接失败？**

A: 检查：

1. `DATABASE_HOST` 是否为服务名（`postgres`）而非 `localhost`
2. `depends_on` 健康检查是否配置
3. 密码、用户名是否匹配
