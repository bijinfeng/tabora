# Directus 生产环境部署指南

## 部署架构

```
[Nginx] → [Directus] → [PostgreSQL]
                    ↓
                  [Redis]
                    ↓
                  [MinIO/S3]
```

## 部署方式

### 方式一：Docker Compose（推荐）

适合中小型部署，所有服务通过 Docker Compose 编排。

#### 1. 准备环境变量

复制并编辑生产环境配置：

```bash
cd backend/directus
cp .env.example .env
```

修改 `.env` 中的关键配置：

- `KEY` 和 `SECRET`：生成强随机值
- `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`：管理员凭据
- `DB_PASSWORD`：数据库密码
- `STORAGE_S3_KEY` 和 `STORAGE_S3_SECRET`：存储凭据

#### 2. 构建镜像

```bash
cd backend/directus
docker compose -f docker/compose.prod.yml build
```

#### 3. 启动服务

```bash
docker compose -f docker/compose.prod.yml up -d
```

#### 4. 初始化数据库（首次部署）

```bash
docker compose -f docker/compose.prod.yml exec directus npx directus bootstrap
```

#### 5. 查看日志

```bash
docker compose -f docker/compose.prod.yml logs -f directus
```

### 方式二：Kubernetes（适合大规模）

如果需要 K8s 部署，建议使用 Helm Chart：

- 官方 Chart：https://artifacthub.io/packages/helm/directus/directus
- 需要单独配置 PostgreSQL、Redis、S3 服务

### 方式三：云平台 PaaS

#### Railway / Render

- 使用 Dockerfile 部署
- 配置环境变量
- 需要外部 PostgreSQL 和 Redis

#### Fly.io

```bash
fly launch
fly secrets set KEY=xxx SECRET=xxx ...
fly deploy
```

## 数据持久化

Docker Compose 使用 named volumes：

- `postgres_data`：PostgreSQL 数据
- `redis_data`：Redis 持久化
- `minio_data`：文件存储

**备份**：

```bash
# 备份数据库
docker compose -f compose.directus.prod.yml exec postgres pg_dump -U tabora tabora_directus > backup.sql

# 备份文件存储
docker compose -f compose.directus.prod.yml exec minio mc mirror /data /backup
```

## 扩展管理

### 开发扩展

```bash
cd backend/directus/extensions/directus-extension-tabora
# 开发并测试
```

### 部署扩展

扩展已打包进 Docker 镜像，更新扩展需要：

1. 修改扩展代码
2. 重新构建镜像：`docker compose build directus`
3. 重新部署：`docker compose up -d directus`

## 环境变量说明

关键配置项：

| 变量                  | 说明         | 示例                       |
| --------------------- | ------------ | -------------------------- |
| `KEY`                 | 加密密钥     | 随机32字符                 |
| `SECRET`              | JWT密钥      | 随机32字符                 |
| `DB_HOST`             | 数据库地址   | `postgres` (compose内部)   |
| `DB_DATABASE`         | 数据库名     | `tabora_directus`          |
| `REDIS`               | Redis连接    | `redis://redis:6379`       |
| `STORAGE_S3_ENDPOINT` | S3端点       | `http://minio:9000` (本地) |
| `PUBLIC_URL`          | 公开访问地址 | `https://api.tabora.com`   |

## 监控与维护

### 健康检查

```bash
curl http://localhost:8055/server/health
```

### 查看日志

```bash
docker compose logs -f directus
```

### 更新版本

1. 修改 `Dockerfile` 中的基础镜像版本
2. 重新构建和部署

## 安全建议

1. **使用强密钥**：`KEY` 和 `SECRET` 使用 32+ 字符随机值
2. **限制端口暴露**：只暴露 Nginx 的 80/443，其他服务不对外
3. **配置 HTTPS**：生产环境必须使用 TLS
4. **定期备份**：自动化数据库和文件备份
5. **限制 CORS**：配置 `CORS_ORIGIN` 只允许前端域名
6. **更新依赖**：定期更新 Directus 和依赖镜像

## 常见问题

### 扩展未加载

检查：

1. 扩展是否正确复制到镜像：`docker compose exec directus ls /directus/extensions`
2. 扩展权限：应该属于 `node:node`
3. 重启服务

### 数据库连接失败

检查：

1. PostgreSQL 是否启动：`docker compose ps postgres`
2. 环境变量是否正确
3. 网络连通性

### 文件上传失败

检查：

1. MinIO/S3 服务状态
2. `STORAGE_S3_*` 环境变量
3. Bucket 是否存在并有权限
