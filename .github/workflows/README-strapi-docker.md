# GitHub Actions - Strapi Docker 构建

该 workflow 自动构建 Strapi Docker 镜像并发布到 GitHub Container Registry (ghcr.io)。

## 触发条件

- **自动触发**: 当 `backend/strapi/` 目录或此 workflow 文件有变更并推送到 `main` 分支时
- **手动触发**: 在 GitHub Actions 页面手动运行

## 环境变量配置

**重要**: 所有敏感环境变量都在**运行时**注入，不会写入镜像。

### 必需的运行时环境变量

运行容器时必须传入以下环境变量：

#### Strapi 核心密钥（必需）

| 环境变量              | 描述                      | 生成方法                      |
| --------------------- | ------------------------- | ----------------------------- |
| `APP_KEYS`            | 应用密钥（4个，逗号分隔） | `openssl rand -base64 32` × 4 |
| `API_TOKEN_SALT`      | API token 加密盐          | `openssl rand -base64 32`     |
| `ADMIN_JWT_SECRET`    | Admin JWT 密钥            | `openssl rand -base64 32`     |
| `TRANSFER_TOKEN_SALT` | Transfer token 加密盐     | `openssl rand -base64 32`     |
| `JWT_SECRET`          | 用户 JWT 密钥             | `openssl rand -base64 32`     |
| `ENCRYPTION_KEY`      | 通用加密密钥              | `openssl rand -base64 32`     |

#### 数据库配置（必需）

- `DATABASE_CLIENT` - 数据库类型（postgres/mysql/sqlite）
- `DATABASE_HOST` - 数据库主机
- `DATABASE_PORT` - 数据库端口
- `DATABASE_NAME` - 数据库名称
- `DATABASE_USERNAME` - 数据库用户名
- `DATABASE_PASSWORD` - 数据库密码

#### 可选配置

- `NODE_ENV` - 运行环境（默认: production）
- `HOST` - 监听地址（默认: 0.0.0.0）
- `PORT` - 监听端口（默认: 1337）
- `JWT_EXPIRES_IN` - JWT 过期时间（默认: 30d）
- `UPLOAD_PROVIDER` - 上传提供商（local/aws-s3）
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`, `AWS_BUCKET` - AWS S3 配置

## 生成的镜像标签

- `main` - 最新的 main 分支构建
- `latest` - 同 main（仅默认分支）
- `sha-<commit-sha>` - 特定 commit
- `v1.0.0` - 如果推送了 git tag（语义化版本）

## 使用发布的镜像

### 1. 拉取镜像

```bash
# 拉取最新版本
docker pull ghcr.io/<your-username>/tabora/strapi:latest

# 拉取特定版本
docker pull ghcr.io/<your-username>/tabora/strapi:v1.0.0
```

### 2. 生成环境变量

```bash
# 使用脚本生成所有必需的密钥
cat > .env.strapi << 'EOF'
# Strapi 核心密钥
APP_KEYS=$(for i in {1..4}; do openssl rand -base64 32; done | tr '\n' ',' | sed 's/,$//')
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# 数据库配置
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your-secure-password

# 可选配置
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
JWT_EXPIRES_IN=30d
EOF

# 执行脚本生成实际值
source .env.strapi
```

### 3. 运行容器

```bash
docker run -d \
  --name strapi \
  -p 1337:1337 \
  --env-file .env.strapi \
  ghcr.io/<your-username>/tabora/strapi:latest
```

或使用单个环境变量：

```bash
docker run -d \
  --name strapi \
  -p 1337:1337 \
  -e NODE_ENV=production \
  -e APP_KEYS="key1,key2,key3,key4" \
  -e API_TOKEN_SALT="..." \
  -e ADMIN_JWT_SECRET="..." \
  -e TRANSFER_TOKEN_SALT="..." \
  -e JWT_SECRET="..." \
  -e ENCRYPTION_KEY="..." \
  -e DATABASE_CLIENT=postgres \
  -e DATABASE_HOST=postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=strapi \
  -e DATABASE_USERNAME=strapi \
  -e DATABASE_PASSWORD=your-password \
  ghcr.io/<your-username>/tabora/strapi:latest
```

### 4. 使用 docker-compose

创建 `.env` 文件（不要提交到 git）：

```bash
# .env
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
DATABASE_PASSWORD=your-password
```

修改 `compose.prod.yml` 使用发布的镜像：

```yaml
services:
  strapi:
    image: ghcr.io/<your-username>/tabora/strapi:latest
    # 移除 build 部分
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 1337
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME:-strapi}
      DATABASE_USERNAME: ${DATABASE_USERNAME:-strapi}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
```

启动：

```bash
docker compose -f compose.prod.yml up -d
```

## 多架构支持

镜像支持以下架构：

- `linux/amd64` - x86_64（Intel/AMD）
- `linux/arm64` - ARM64（Apple Silicon, AWS Graviton）

Docker 会自动选择适合你平台的镜像。

## 构建缓存

- 使用 GitHub Actions cache 加速构建
- 首次构建较慢，后续构建会复用缓存层

## 手动触发构建

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **Build and Push Strapi Docker Image** workflow
3. 点击 **Run workflow**
4. 可选择是否推送镜像（默认推送）

## 查看构建结果

构建完成后，在 Actions 页面的 Summary 中会显示：

- 镜像 registry 和名称
- 所有生成的 tags
- Pull 命令

## 安全注意事项

1. **环境变量管理**:
   - ✅ 镜像中**不包含**任何敏感信息
   - ✅ 所有密钥在运行时通过环境变量注入
   - ❌ 永远不要在代码中硬编码密钥
   - ❌ 不要将 `.env` 文件提交到 git

2. **密钥生成**:
   - 每个环境使用不同的密钥
   - 使用加密强度高的随机值（`openssl rand -base64 32`）
   - 定期轮换密钥

3. **镜像可见性**:
   - 默认镜像是 private（仅团队可见）
   - 可在 Package settings 中调整可见性
   - 即使公开镜像也是安全的（不含密钥）

4. **生产部署**:
   - 使用特定版本 tag 而非 `latest`
   - 使用 Docker secrets 或 Kubernetes secrets 管理敏感信息
   - 监控镜像漏洞（GitHub 提供 Dependabot alerts）

## 故障排查

### 构建失败：缺少 secrets

**错误**: `secrets.STRAPI_APP_KEYS` is empty

**解决**: 在仓库设置中添加缺失的 secret

### 推送失败：权限不足

**错误**: `denied: permission_denied`

**解决**:

1. 检查 workflow 权限：Settings → Actions → General → Workflow permissions
2. 确保勾选 "Read and write permissions"

### 镜像无法拉取：认证失败

**解决**:

```bash
# 登录 GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

生成 Personal Access Token (classic) with `read:packages` scope。

## 相关文档

- [GitHub Container Registry 文档](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Strapi Docker 最佳实践](https://docs.strapi.io/cms/installation/docker)
