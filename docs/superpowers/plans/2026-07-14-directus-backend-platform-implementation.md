# Tabora Directus 后端平台实现计划（当前实现对齐）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库内提供一套可本地启动的 Directus 后端栈，并建立“schema manifest + snapshot.json”的可重复 schema provisioning 流程，确保 schema 可被版本控制与回放（至少覆盖 baseline collections/fields 的创建与快照导出）。

**Architecture:** `backend/directus` 承载 Directus 侧的 schema 文件、脚本与测试；`infra/docker` 承载本地 Docker Compose 编排；根 `package.json` 提供面向仓库的统一命令入口。

**Tech Stack:** Directus, TypeScript, PostgreSQL, Redis, MinIO, Docker Compose, Vitest

---

## 当前实现范围（已落地）

**目录：**

- `backend/directus/schema/manifest.json`：最低 schema 要求（collections + 必需 fields）
- `backend/directus/schema/snapshot.json`：从 Directus 导出的 schema 快照（用于 diff/审计/回放参考）
- `backend/directus/scripts/provisionSchema.ts`：基于 manifest 进行 schema provisioning，并导出 snapshot.json
- `backend/directus/scripts/bootstrap.ts`：启动本地 Directus stack，并执行 schema provisioning
- `backend/directus/extensions/directus-extension-tabora/dist/index.js`：统一承载 `/tabora/auth/*` 与 `/tabora/attachments/*` endpoint
- `backend/directus/tests/endpoints/tabora-auth.test.ts`：认证扩展离线测试
- `backend/directus/tests/endpoints/tabora-attachments.test.ts`：附件扩展离线测试
- `infra/docker/compose.directus.yml`：postgres/redis/minio/directus/worker/nginx 编排
- `infra/docker/nginx/default.conf`：反代 Directus（便于后续统一入口）

**约束：**

- provisioning 当前是“增量式”的：只确保 manifest 声明的 collection/field 存在，不会删除/重命名 Directus 侧已有内容
- `snapshot.json` 是导出产物，不直接作为 apply 输入；单一事实源以 `manifest.json` 为主
- 附件 endpoint 当前只覆盖最小真实行为：`prepare/commit/access/bind/unbind/delete/meta`，依赖既有 `attachment_refs` / `attachment_policies` schema，不在本次实现中新增 schema 字段

---

## 命令与脚本（与仓库脚本对齐）

**仓库根命令（推荐）：**

- `pnpm dev:directus:stack`：仅启动 docker compose（用于调试容器或需要手动跑其他步骤）
- `pnpm dev:directus`：在本机启动 Directus（依赖你自行准备 DB/Redis/MinIO，通常搭配 `dev:directus:stack`；且需要本机 env，见下文）
- `pnpm directus:bootstrap`：启动 docker compose（postgres/redis/minio/directus/nginx）并执行 `schema:provision`
- `pnpm directus:schema:provision`：对正在运行的 Directus 进行 schema provisioning，并更新 `backend/directus/schema/snapshot.json`
- `pnpm test:directus`：运行 `backend/directus` 的 vitest 测试

**Directus 包内命令：**

- `pnpm --dir backend/directus bootstrap`
- `pnpm --dir backend/directus schema:provision`

---

## Schema provisioning 工作流

### 修改 schema（开发者流程）

- [ ] **步骤 1：修改 `manifest.json`**
  - 仅写“最低要求”：collection 名、以及必须存在的字段（字段名 + Directus field type）
  - 不把 UI meta、权限、关系等全部细节写进 manifest（这些细节当前由 Directus 侧管理与 `snapshot.json` 反映）

- [ ] **步骤 2：启动/确保 Directus 正在运行**

```bash
pnpm directus:bootstrap
```

首次启动说明：

- 初次拉起 Directus 时可能需要等待容器完成 DB 连接与迁移；在 Directus 还未就绪时，紧随其后的 `schema:provision` 可能会出现连接失败
- 若遇到 provisioning 失败，通常等待 10–30 秒后重试 `pnpm directus:schema:provision` 即可

或只启动容器：

```bash
pnpm dev:directus:stack
```

- [ ] **（可选）准备 `dev:directus` 的本机 env**

如果需要用 `pnpm dev:directus` 在本机进程启动 Directus，需要在 `backend/directus` 目录准备 `.env`（docker compose 的 `env_file` 不会影响本机进程）：

```bash
cp backend/directus/.env.example backend/directus/.env
```

- [ ] **步骤 3：执行 schema provisioning 并导出快照**

```bash
pnpm directus:schema:provision
```

预期：

- Directus 中自动创建缺失的 collections
- 为 manifest 中声明的 collection 自动创建缺失的 fields
- 更新并写入 `backend/directus/schema/snapshot.json`（文件末尾带换行）

- [ ] **步骤 4：提交变更**

至少应提交：

- `backend/directus/schema/manifest.json`
- `backend/directus/schema/snapshot.json`

---

## Docker 镜像拉取加速（含 snap 安装 Docker 的说明）

Directus stack 依赖多个公共镜像（`postgres:16`、`redis:7`、`minio/minio:latest`、`directus/directus:12.1.1`、`nginx:alpine`）。若镜像拉取较慢，可通过配置 Docker registry mirror 加速。

### 镜像锁定口径

- 仅固定 Directus 镜像版本到 `directus/directus:12.1.1`。
- postgres/redis/minio/nginx 使用浮动 tag（例如 `postgres:16`、`redis:7`、`minio/minio:latest`、`nginx:alpine`），以便跟随补丁更新与安全修复。
- 如需完全可复现构建（例如 CI 或发布环境），可选对任意镜像使用 digest 进行 pin，例如：

```yaml
services:
  directus:
    image: directus/directus:12.1.1@sha256:<digest>
```

### A. Debian/Ubuntu（apt 安装的 Docker）

- 配置文件通常为 `/etc/docker/daemon.json`
- 重启 Docker：`sudo systemctl restart docker`

### B. Ubuntu（snap 安装的 Docker）

snap 版 Docker 的 daemon 配置路径通常为：

- `/var/snap/docker/current/config/daemon.json`

重启方式通常为：

- `sudo snap restart docker`

`daemon.json` 示例（按团队/个人实际 mirror 调整）：

```json
{
  "registry-mirrors": ["https://<your-mirror-host>"]
}
```

---

## 验证清单（文档/脚本变更后）

- [ ] `pnpm check`
- [ ] `pnpm test:directus`（如果修改了 `backend/directus` 的脚本/测试）
