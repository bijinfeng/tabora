# Tabora Strapi Backend

Strapi 5 后端，为 Tabora 插件工作台提供账号认证、数据同步和附件管理。

## 技术栈

- **Strapi 5** (TypeScript)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: users-permissions 插件，纯 JWT (30天过期)
- **Upload**: local (dev) / AWS S3 (prod)

## 快速开始

### 开发环境

```bash
# 从项目根目录
pnpm dev:strapi

# 或从 backend/strapi/
pnpm develop
```

访问：

- API: http://localhost:1337
- Admin Panel: http://localhost:1337/admin

首次启动需创建管理员账号（仅用于 Admin Panel）。

### 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# 核心配置
HOST=0.0.0.0
PORT=1337
APP_KEYS=随机生成的key1,key2,key3,key4
API_TOKEN_SALT=随机salt
ADMIN_JWT_SECRET=随机secret
TRANSFER_TOKEN_SALT=随机salt
JWT_SECRET=随机secret

# 数据库（开发默认 SQLite）
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# 认证 JWT 过期
JWT_EXPIRES_IN=30d

# 附件上传 provider（dev 默认 local；生产设 aws-s3）
UPLOAD_PROVIDER=local
# AWS_REGION=
# AWS_ACCESS_KEY_ID=
# AWS_ACCESS_SECRET=
# AWS_BUCKET=
```

生成随机密钥：`openssl rand -base64 32`

### 测试

```bash
# 从项目根目录
pnpm test:strapi

# 或从 backend/strapi/
pnpm test
```

## API 端点

### 认证 (users-permissions)

- `POST /api/auth/local/register` - 注册
- `POST /api/auth/local` - 登录
- `GET /api/users/me` - 当前用户
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码

### 数据同步 (自定义 controller)

- `GET /api/sync/records` - 拉取增量 (query: `since`, `limit`)
- `POST /api/sync/records` - 批量推送 (body: `changes[]`)

### 附件 (自定义 controller + upload 插件)

- `POST /api/attachment/prepare` - 准备上传（policy 校验）
- `POST /api/attachment/commit` - 提交上传
- `POST /api/attachment/access` - 获取访问 URL
- `POST /api/attachment/bind` - 绑定附件到实体
- `POST /api/attachment/unbind` - 解绑附件
- `POST /api/upload` - 上传文件 (multipart/form-data)

## Content Types

### synced-record

- `record_type`: enum (workspace/pluginInstance/plugin/pluginData)
- `record_id`: string (客户端稳定 ID)
- `data`: json (业务数据)
- `version`: integer (乐观锁)
- `device_id`: string (设备标识)
- `record_updated_at`: datetime (记录更新时间)
- `deleted`: boolean (tombstone 软删除)
- `owner`: relation → user

### attachment-policy

- `entity_type`: string (唯一)
- `mime_whitelist`: json (允许的 MIME 类型)
- `max_size_bytes`: biginteger (最大文件大小)

### attachment-ref

- `entity_type`: string
- `entity_id`: string
- `file`: relation → plugin::upload.file
- `uploaded_by`: relation → user

## 权限配置

`src/index.ts` bootstrap 自动授予 Authenticated 角色以下权限：

- `api::sync.sync.pull`
- `api::sync.sync.push`
- `api::attachment.attachment.prepare`
- `api::attachment.attachment.commit`
- `api::attachment.attachment.access`
- `api::attachment.attachment.bind`
- `api::attachment.attachment.unbind`
- `plugin::upload.content-api.upload`

## 部署

### Docker Compose (开发)

```bash
docker compose -f backend/strapi/docker/compose.dev.yml up -d
```

### Docker Compose (生产)

```bash
# 配置 backend/strapi/.env (生产环境变量)
docker compose -f backend/strapi/docker/compose.prod.yml up -d
```

生产环境需配置：

- PostgreSQL 连接 (`DATABASE_*`)
- AWS S3 (`UPLOAD_PROVIDER=aws-s3`, `AWS_*`)
- 强随机密钥 (`APP_KEYS`, `JWT_SECRET`, etc.)

### Nginx

`docker/nginx/strapi.conf` 提供反向代理配置（gzip、安全头、WebSocket 支持）。

## 技术文档

- 数据同步技术方案：`docs/technical/tabora-data-sync-technical-design.md`
- 同步 PRD：`docs/technical/tabora-data-sync-prd.md`

## 关键约束

- **纯 JWT 认证**：无 refresh token，客户端持久化 JWT；过期后重新登录
- **敏感字段过滤**：sync controller 服务端过滤 `apiKey`/`token`/`filePath` 等字段
- **冲突检测**：版本不匹配或客户端时间戳不晚于服务端时间 → conflict
- **Tombstone 删除**：`deleted=true` 保留记录，防止跨设备删除复活
- **文件大小单位**：Strapi upload `size` 字段为 KB (float)，转字节需 `Math.round(size*1024)`

## 开发提示

- 运行测试前需启动 Strapi (`pnpm develop`)，contract 测试为端到端验证
- Admin Panel 管理员账号独立于 API 用户（users-permissions）
- 修改 content-type schema 后需重启 Strapi
- SQLite 数据库位于 `.tmp/data.db`（已 gitignore）
