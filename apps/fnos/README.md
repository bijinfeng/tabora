# Tabora for 飞牛 fnOS

`apps/fnos` 是 Tabora 的飞牛 fnOS Native 宿主。生产包通过统一网关 `/app/tabora` 暴露工作台，Hono 服务监听 `${TRIM_APPDEST}/app.sock`，工作区、插件数据和设备共享 AI provider 配置写入 `${TRIM_PKGVAR}/tabora.db`。

## 本地开发

分别启动后端和前端：

```bash
pnpm --filter @tabora/fnos dev:backend
pnpm --filter @tabora/fnos dev:frontend
```

打开 `http://127.0.0.1:5173/app/tabora/`。开发环境的前端会把本地存储请求发送到 `http://127.0.0.1:43120`。

构建本地整合预览：

```bash
pnpm --filter @tabora/fnos start
```

打开 `http://127.0.0.1:43120/app/tabora/`。

## 构建 FPK

先按官方文档安装 `fnpack 1.2.3`，不要安装 npm 上同名的占位包。然后运行：

```bash
pnpm --filter @tabora/fnos pack:fnos
```

该命令会依次：

1. 从 `@tabora/brand` 的 SVG 源生成 64/256 px 图标。
2. 以 `/app/tabora/` 为 base 构建前端。
3. 将 Hono 后端打包为 Node.js 22 ESM bundle。
4. 把前端、后端以及 Linux x64/arm64 的 `better-sqlite3` 预构建产物放入 `tabora/app/dist/`。
5. 执行 `fnpack build --directory tabora`，生成 `apps/fnos/tabora.fpk`。

`tabora/app/dist/` 是构建产物，不提交到 Git。`tabora/` 下的 manifest、配置、生命周期脚本和图标属于应用包源文件。

## 飞牛运行契约

- 运行时依赖：`nodejs_v22`。
- 最低系统版本：`1.1.3100`，对应国内版统一网关支持基线。
- 应用以专用 `tabora` 包用户运行，不请求 root 或附加用户组。
- 不声明共享目录，也不请求用户目录授权；数据库保存在应用私有数据目录。
- 桌面入口仅对管理员可见。当前数据库是设备级单库，在实现按 `X-Trim-Userid` 隔离前不要改为 `allUsers=true`。
- 本地开发只监听 loopback；安装后只监听统一网关 Unix Socket，不暴露独立 TCP 端口。

## 官方资料

- [开发文档](https://developer.fnnas.com/docs/guide/)
- [Native 应用案例](https://developer.fnnas.com/docs/examples/native/)
- [Manifest](https://developer.fnnas.com/docs/core-concepts/manifest/)
- [统一网关](https://developer.fnnas.com/docs/core-concepts/gateway-registration/)
- [fnpack](https://developer.fnnas.com/docs/cli/fnpack/)
