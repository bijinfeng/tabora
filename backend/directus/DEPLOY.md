# Directus 最小化部署指南

只部署 Directus + Postgres，无 Redis/MinIO/Nginx。适合快速上线或小规模使用。

## 方案 1: 自有服务器（VPS/云主机）

### 前置要求

- 服务器：Ubuntu 22.04+，≥1GB RAM
- Docker + Docker Compose 已安装
- 开放端口 8055

### 步骤

#### 1. 服务器安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 登出再登入
```

#### 2. 克隆仓库

```bash
git clone git@github.com:bijinfeng/tabora.git
cd tabora/backend/directus
```

#### 3. 配置环境变量

```bash
cp .env.minimal .env
nano .env
```

**必改项**：

```bash
# 生成密钥（本地执行）
openssl rand -base64 32  # 复制到 KEY
openssl rand -base64 32  # 复制到 SECRET

# 修改 .env
KEY=<刚才生成的值>
SECRET=<刚才生成的值>
ADMIN_EMAIL=你的邮箱@example.com
ADMIN_PASSWORD=<强密码>
DB_PASSWORD=<数据库密码>
PUBLIC_URL=http://<你的服务器IP>:8055
```

#### 4. 构建扩展

```bash
cd extensions/directus-extension-tabora
npm install && npm run build
cd ../..
```

#### 5. 启动服务

```bash
docker compose -f docker/compose.minimal.yml up -d

# 查看日志
docker compose -f docker/compose.minimal.yml logs -f directus
```

#### 6. Provision 数据库

等 Directus 启动后（日志显示 "Server started"），执行：

```bash
docker compose -f docker/compose.minimal.yml exec directus sh
ADMIN_EMAIL=你的邮箱 ADMIN_PASSWORD=你的密码 node --experimental-strip-types /directus/scripts/provisionSchema.ts
exit
```

#### 7. 访问

- Directus Admin: `http://<服务器IP>:8055`
- Tabora API: `http://<服务器IP>:8055/tabora`

### 管理命令

```bash
# 停止
docker compose -f docker/compose.minimal.yml down

# 重启
docker compose -f docker/compose.minimal.yml restart

# 查看日志
docker compose -f docker/compose.minimal.yml logs -f

# 备份数据库
docker compose -f docker/compose.minimal.yml exec postgres pg_dump -U tabora tabora_directus > backup.sql

# 恢复数据库
cat backup.sql | docker compose -f docker/compose.minimal.yml exec -T postgres psql -U tabora tabora_directus
```

---

## 方案 2: Railway（一键部署）

Railway 提供免费额度，适合快速测试。

### 步骤

1. 访问 [railway.app](https://railway.app)，用 GitHub 登录
2. New Project → Deploy from GitHub repo → 选择 `bijinfeng/tabora`
3. 添加 Postgres 数据库：Add Service → Database → PostgreSQL
4. 配置 Directus 服务：
   - Root Directory: `backend/directus`
   - Build Command: `cd extensions/directus-extension-tabora && npm install && npm run build && cd ../..`
   - Start Command: `directus start`
5. 添加环境变量（Settings → Variables）：
   ```
   KEY=<随机生成>
   SECRET=<随机生成>
   ADMIN_EMAIL=你的邮箱
   ADMIN_PASSWORD=你的密码
   DB_CLIENT=pg
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   STORAGE_LOCATIONS=local
   ```
6. Deploy，等待构建完成
7. 在 Railway 的 Directus 服务里，进入 Shell 执行 provision：
   ```bash
   ADMIN_EMAIL=你的邮箱 ADMIN_PASSWORD=你的密码 node --experimental-strip-types /app/scripts/provisionSchema.ts
   ```

---

## 方案 3: Render（类似 Railway）

1. 访问 [render.com](https://render.com)，GitHub 登录
2. New → Web Service → 选择 `bijinfeng/tabora`
3. 配置：
   - Name: `tabora-directus`
   - Root Directory: `backend/directus`
   - Build Command: `cd extensions/directus-extension-tabora && npm install && npm run build && cd ../.. && npm install`
   - Start Command: `npx directus start`
4. 添加 Postgres 数据库：Dashboard → New → PostgreSQL
5. 环境变量同 Railway 方案
6. Deploy

---

## 升级 Directus

### 方式 1: Docker（推荐）

```bash
cd tabora/backend/directus
git pull origin main
cd extensions/directus-extension-tabora && npm run build && cd ../..
docker compose -f docker/compose.minimal.yml build --no-cache
docker compose -f docker/compose.minimal.yml up -d
```

### 方式 2: Railway/Render

推送 GitHub，平台自动部署。

---

## 故障排查

### Directus 启动失败

```bash
# 查看详细日志
docker compose -f docker/compose.minimal.yml logs directus

# 常见问题：
# - "ECONNREFUSED postgres:5432" → 等 Postgres 完全启动（~10秒）
# - "Invalid KEY/SECRET" → 检查 .env 格式，KEY/SECRET 要 base64 编码
```

### 扩展不生效

```bash
# 重新构建扩展
cd extensions/directus-extension-tabora
rm -rf dist node_modules
npm install && npm run build

# 重启 Directus
docker compose -f docker/compose.minimal.yml restart directus
```

### 数据库连接失败

```bash
# 检查 Postgres 状态
docker compose -f docker/compose.minimal.yml ps postgres

# 进入 Postgres 容器测试
docker compose -f docker/compose.minimal.yml exec postgres psql -U tabora tabora_directus
```

---

## 生产优化建议

部署成功后，考虑这些改进：

1. **HTTPS**: 用 Caddy 或 Cloudflare Tunnel 加 HTTPS
2. **域名**: 配置自定义域名代替 IP
3. **备份**: 定时备份 Postgres（cron + pg_dump）
4. **监控**: 用 Uptime Kuma 监控服务健康
5. **Redis**: 加 Redis 缓存提升性能（可选）

---

## 联系

部署遇到问题？提 issue: https://github.com/bijinfeng/tabora/issues
