# Playground GitHub Actions 部署说明

本文说明仓库中的 `Deploy Playground` workflow 如何把 `apps/playground` 的静态产物发布到自有服务器。

## 适用场景

- `playground` 以静态站点方式部署。
- 服务器已经有 Nginx、Caddy 或其他 Web Server，对某个目录做静态文件托管。
- 你希望在 GitHub Actions 中自动构建，并通过 SSH 上传到服务器。

当前 workflow 使用 `pnpm --filter @tabora/playground build` 生成产物，并通过 `rsync --delete` 同步 `apps/playground/dist/` 到目标目录。

## 触发方式

- 推送到 `main`，且本次提交涉及 `apps/playground`、共享 package、插件或部署 workflow 自身。
- 在 GitHub Actions 页面手动触发 `Deploy Playground`。

## 服务器准备

部署前请先确认服务器满足以下条件：

- 目标目录已经规划好，例如 `/var/www/tabora-playground`
- 用于部署的用户对目标目录有写权限
- 服务器已安装 `ssh` 与 `rsync`
- Web Server 已把域名或端口指向该目录

如果你还没配静态站点，最小 Nginx 思路可以是把站点根目录指向部署目录，并对 SPA 路由使用 `try_files $uri $uri/ /index.html;`

## GitHub 配置

在仓库 Settings 中配置以下 Variables：

- `PLAYGROUND_DEPLOY_HOST`：服务器地址，例如 `example.com`
- `PLAYGROUND_DEPLOY_PORT`：SSH 端口，可选；不填时默认 `22`
- `PLAYGROUND_DEPLOY_USER`：部署用户，例如 `deploy`
- `PLAYGROUND_DEPLOY_PATH`：服务器目标目录，例如 `/var/www/tabora-playground`
- `PLAYGROUND_DEPLOY_POST_COMMAND`：可选，部署完成后在服务器执行的命令

在仓库 Settings 中配置以下 Secrets：

- `PLAYGROUND_DEPLOY_SSH_PRIVATE_KEY`：用于登录服务器的私钥内容，推荐单独创建部署 key
- `PLAYGROUND_DEPLOY_SSH_KNOWN_HOSTS`：可选；服务器 host key。若不配置，workflow 会在运行时用 `ssh-keyscan` 拉取

生成 `PLAYGROUND_DEPLOY_SSH_KNOWN_HOSTS` 的常用命令：

```bash
ssh-keyscan -p 22 -H example.com
```

如果你的 SSH 端口不是 `22`，把命令中的端口改成实际值即可。

## Workflow 行为

workflow 会按下面的顺序执行：

1. 检出代码并安装 pnpm / Node.js 24
2. 执行 `pnpm install --frozen-lockfile`
3. 执行 `pnpm --filter @tabora/playground build`
4. 校验部署所需 Variables / Secrets 是否完整
5. 配置 SSH 私钥与 `known_hosts`
6. 在服务器上创建目标目录
7. 用 `rsync --delete` 同步 `apps/playground/dist/`
8. 如果配置了 `PLAYGROUND_DEPLOY_POST_COMMAND`，则执行该命令

`rsync --delete` 会删除服务器目标目录里已经不存在于本次构建产物中的旧文件，所以目标目录最好只用于该站点。

## 常见用法

如果你的站点只是纯静态托管，通常不需要 `PLAYGROUND_DEPLOY_POST_COMMAND`。

如果你在服务器上还做了额外缓存刷新，可以把类似命令放进去，例如：

```bash
sudo systemctl reload nginx
```

前提是部署用户有权限执行对应命令。

## 注意事项

- 当前 workflow 假设 `PLAYGROUND_DEPLOY_PATH` 不包含空格。
- 当前部署的是 `playground` 静态产物，不包含浏览器扩展。
- 如果未来改成子路径部署，需要同步调整 `apps/playground/vite.config.ts` 中的 `base` 配置。
