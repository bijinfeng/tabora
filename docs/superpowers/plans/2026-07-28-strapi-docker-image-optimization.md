# Strapi Docker 镜像优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变 Strapi 5 运行语义或替换原生依赖的前提下，减少生产 Docker 镜像的构建上下文和运行时冗余内容。

**Architecture:** 保留 `node:22-alpine` 的 `deps`、`build`、`runner` 三阶段。依赖阶段提供原生模块回退编译所需工具，构建完成后删除 devDependencies；最终阶段只复制已裁剪的生产依赖、构建产物、配置与静态资源。npm 下载缓存仅作为 BuildKit 挂载存在。运行服务改为专用非 root 用户，上传卷挂载点预先以该用户权限创建。

**Tech Stack:** Docker BuildKit、Node.js 22 Alpine、npm、Strapi 5、Docker Compose。

**设计源：** `docs/superpowers/specs/2026-07-28-strapi-docker-image-optimization-design.md`

---

## 文件结构与职责

- `backend/strapi/Dockerfile`：定义缓存安装、三阶段复制边界和非 root 运行时。
- `backend/strapi/.dockerignore`：从 Docker build context 排除本地依赖、测试、构建产物、持久化数据和部署辅助文件。
- `backend/strapi/package-lock.json`：与 Strapi 的 npm 依赖声明保持同步，确保 Docker 中的 `npm ci` 可复现执行。
- `backend/strapi/docker/README.md`：说明镜像构建、层大小检查与非 root 上传目录约束。
- `docs/README.md`：登记设计及实施计划作为当前 Docker 优化事实源入口。

### Task 0: 同步 Docker 使用的 npm 锁文件

**Files:**

- Modify: `backend/strapi/package-lock.json`

- [x] **Step 1: 再现锁文件与依赖声明不一致**

运行：`cd backend/strapi && npm ci --ignore-scripts --dry-run`

预期：修改前命令以 `EUSAGE` 退出，并指出 lock file 中的 `vite@5.4.21` 不满足 `package.json` 中的 `vite@^8.1.5`。

- [x] **Step 2: 仅重新生成 npm lockfile**

运行：`cd backend/strapi && npm install --package-lock-only --ignore-scripts`

预期：`package.json` 不变，`package-lock.json` 更新到与当前 Vite/Vitest 依赖声明一致的解析结果。

- [x] **Step 3: 验证可复现的 clean install**

运行：`cd backend/strapi && npm ci --ignore-scripts --dry-run`

预期：命令以 0 退出；Docker 的两个 `npm ci` 层可继续执行。

### Task 1: 收紧构建上下文

**Files:**

- Modify: `backend/strapi/.dockerignore`

- [x] **Step 1: 增加不参与构建的 Strapi 本地内容**

将以下规则加入 `.dockerignore`，保留 `package.json`、`package-lock.json`、`src/`、`config/`、`public/` 和 `favicon.png`：

```dockerignore
# Package-manager metadata unused by npm Docker builds
pnpm-lock.yaml
pnpm-workspace.yaml

# Test and local deployment material
tests/
vitest.config.ts
docker/
README.md

# Persistent runtime content must never be baked into the image
public/uploads/
database/
```

- [ ] **Step 2: 复查发送给 Docker daemon 的文件清单**

运行：`docker buildx build --progress=plain --no-cache --target deps -f backend/strapi/Dockerfile backend/strapi`

预期：构建上下文不包含 `node_modules`、`dist`、`tests`、`database` 或 `public/uploads`；`package.json` 与 `package-lock.json` 仍能被复制。

### Task 2: 精简运行阶段并保留运行兼容性

**Files:**

- Modify: `backend/strapi/Dockerfile`

- [x] **Step 1: 启用 Dockerfile BuildKit 语法、缓存与原生模块回退编译**

在 Dockerfile 首行加入：

```dockerfile
# syntax=docker/dockerfile:1.7
```

在 `deps` 阶段、复制锁文件前加入：

```dockerfile
RUN apk add --no-cache python3 make g++
```

将依赖安装命令替换为：

```dockerfile
RUN --mount=type=cache,target=/root/.npm npm ci
```

将 `build` 阶段改为继承 `deps`，并在构建后删除开发依赖：

```dockerfile
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build \
  && npm prune --omit=dev
```

`python3`、`make` 和 `g++` 只存在于构建阶段。它们用于 `better-sqlite3` 等原生依赖的预编译下载失败回退路径，最终镜像不复制这些工具。

- [x] **Step 2: 以固定 UID/GID 创建运行用户，并在复制时设置所有权**

在 `runner` 阶段、复制文件前加入：

```dockerfile
RUN addgroup --system --gid 1001 strapi \
  && adduser --system --uid 1001 --ingroup strapi strapi
```

将 runner 阶段的 `COPY` 命令改为下列内容：

```dockerfile
COPY --chown=strapi:strapi package*.json ./
COPY --from=build --chown=strapi:strapi /app/node_modules ./node_modules
COPY --from=build --chown=strapi:strapi /app/dist ./dist
COPY --from=build --chown=strapi:strapi /app/config ./config
COPY --from=build --chown=strapi:strapi /app/public ./public
COPY --from=build --chown=strapi:strapi /app/favicon.png ./favicon.png
```

保留构建阶段的 `COPY . .`，因为 Strapi admin 构建需要应用源代码。
不要在 runner 执行第二次 `npm ci`：构建阶段的 `npm prune --omit=dev` 已产生生产依赖，复制该目录避免原生模块在没有工具链的 runner 阶段重新编译。

- [x] **Step 3: 创建可写上传目录后降权启动**

在 `ENV NODE_ENV=production` 后使用：

```dockerfile
RUN mkdir -p public/uploads \
  && chown strapi:strapi public/uploads

USER strapi
```

保留 `EXPOSE 1337` 与 `CMD ["npm", "start"]`。不要修改基础镜像、Strapi 版本、数据库配置、Compose 环境变量或 volume 目标。

- [ ] **Step 4: 构建最终镜像并检查运行用户**

运行：

```bash
docker build --tag tabora-strapi:optimized --file backend/strapi/Dockerfile backend/strapi
docker run --rm --entrypoint sh tabora-strapi:optimized -c 'id && test -w /app/public/uploads'
```

预期：`id` 显示 UID/GID `1001`，且写权限检查成功。

### Task 3: 更新部署验证说明

**Files:**

- Modify: `backend/strapi/docker/README.md`
- Modify: `docs/README.md`

- [x] **Step 1: 更新多阶段构建说明**

在 `backend/strapi/docker/README.md` 的 Dockerfile 多阶段章节说明：`runner` 仅包含生产依赖、`dist`、`config`、`public` 和 `favicon.png`；npm cache 使用 BuildKit mount，不进入镜像层；服务以 UID/GID `1001` 的 `strapi` 用户运行，`/app/public/uploads` 可供名为 `strapi_uploads` 的 Docker volume 写入。

- [x] **Step 2: 添加可复现的镜像大小检查命令**

在部署文档新增以下命令，并说明记录 `Size` 和最大的 `SIZE` 层来比较优化结果：

```bash
docker image inspect tabora-strapi:optimized --format '{{.Size}}'
docker history --no-trunc --format 'table {{.Size}}\t{{.CreatedBy}}' tabora-strapi:optimized
```

- [x] **Step 3: 登记实施计划**

在 `docs/README.md` 的 Docker 优化设计文档条目后加入：

```markdown
- [Strapi Docker 镜像优化实施计划](superpowers/plans/2026-07-28-strapi-docker-image-optimization.md)：镜像上下文、运行阶段和验证执行清单。
```

### Task 4: 验证并报告限制

**Files:**

- Modify: `docs/superpowers/plans/2026-07-28-strapi-docker-image-optimization.md`

- [x] **Step 1: 运行后端单元测试**

运行：`pnpm --dir backend/strapi test`

预期：Vitest 所有测试通过。

- [x] **Step 2: 运行仓库检查与构建**

运行：

```bash
pnpm check
pnpm build
```

预期：格式、lint、类型检查与所有 workspace 构建成功。

- [ ] **Step 3: 执行镜像构建、层体积与 Compose 启动验证**

运行：

```bash
docker build --tag tabora-strapi:optimized --file backend/strapi/Dockerfile backend/strapi
docker image inspect tabora-strapi:optimized --format '{{.Size}}'
docker history --no-trunc --format 'table {{.Size}}\t{{.CreatedBy}}' tabora-strapi:optimized
cd backend/strapi/docker && docker compose -f compose.prod.yml config
```

预期：镜像构建成功，运行时层不含开发依赖或 npm 下载缓存，Compose 配置可解析。若本机 Docker daemon 不可用，记录该环境限制，不对构建或运行时健康状态作未经验证的声明。

- [ ] **Step 4: 提交前检查（不自动提交）**

运行：`git diff --check && git status --short --untracked-files=all`

预期：无空白错误，且只包含本次 Docker 优化相关文件和既有未提交的设计文档。依据仓库规则，除非用户再次明确要求，否则不创建 Git commit。
