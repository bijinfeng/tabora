# Strapi Docker 镜像优化设计

## 目标

在不改变 Strapi 5 运行语义、不替换 `sharp` 或 `better-sqlite3` 等原生依赖的前提下，缩小生产镜像的冗余内容，并让镜像层与构建上下文可量化检查。

## 现状

`backend/strapi/Dockerfile` 已采用依赖、构建、运行三阶段。运行阶段只安装生产依赖，但缺少对最终复制内容和镜像层的显式约束。当前运行依赖包含原生模块；为体积强行切换到 distroless、删除共享库或替换依赖，会增加 Alpine/musl 兼容风险。

## 方案比较

1. 兼容性优先的分层精简：保留 Node Alpine 和现有依赖，严格限制 build context 与 runner 内容，使用 BuildKit cache 加速安装。
2. 激进运行时裁剪：改用 distroless 或手工收集 Node 与共享库。镜像可能更小，但原生模块兼容性和排障成本明显上升。
3. 业务依赖替换：移除或替换 `sharp`、`better-sqlite3`。收益不确定，且超出镜像优化范围。

采用方案 1。

## 设计

### Dockerfile

- 保留 `deps`、`build`、`runner` 三阶段与 `node:22-alpine` 基础镜像。
- 依赖安装使用锁文件，避免把 devDependencies 带入 runner。
- runner 仅复制生产运行所需的构建产物、配置、静态资源与应用元数据；不复制源代码、测试、缓存或开发期输出。
- 使用 BuildKit cache mount 缓存 npm 下载；缓存只影响构建速度，不写入最终镜像。
- 运行阶段以非 root 用户启动 Strapi，并保持上传目录可写。

### 构建上下文

- 扩展 `backend/strapi/.dockerignore`，排除本地依赖、构建结果、数据库、测试、覆盖率、环境文件、pnpm 元数据与 Docker 本地状态。
- 不排除 Docker 构建所需的 `package.json` 与 `package-lock.json`。

### 验证

- `docker build` 成功。
- 启动容器并检查 Strapi 健康可用性。
- 使用 `docker image inspect` 与 `docker history` 记录镜像总大小和最大层；与修改前基准比较。
- 执行后端测试与现有仓库检查。

## 非目标

- 不升级 Strapi 或替换数据库/图片处理依赖。
- 不修改生产 Compose 的环境变量、数据卷或网络行为。
- 不承诺消除原生运行依赖本身的镜像体积。
