# Extension GitHub Actions 分发说明

本文说明如何基于 WXT 为 `apps/extension` 配置 GitHub Actions，构建并提交浏览器扩展包到 Chrome Web Store 与 Firefox Add-ons。

关联文件：

- Workflow：`.github/workflows/release-extension.yml`
- 扩展工程：`apps/extension`
- WXT 官方文档：
  - `https://wxt.dev/guide/installation`
  - `https://wxt.dev/guide/essentials/publishing.html`

## 适用场景

- 扩展工程基于 WXT。
- 仓库使用 pnpm workspace。
- 你希望在 GitHub Actions 中自动构建 zip，并在满足凭据条件时提交到扩展商店。

当前 workflow 的行为是：

1. 安装依赖。
2. 构建 Chrome zip。
3. 构建 Firefox zip 与 source zip。
4. 上传 zip 产物到 GitHub Actions artifacts。
5. 调用 `wxt submit` 提交到商店。

## 触发方式

- 手动触发 `Release Extension`。
- 推送 tag：`extension-v*`

推荐做法：

- 日常测试用 `workflow_dispatch` 手动触发。
- 正式发布时打 tag，例如 `extension-v0.1.0`。

## 本地初始化

首次配置前，先在本地执行：

```bash
pnpm --filter @tabora/extension exec wxt submit init
```

作用：

- 让 WXT 生成各商店提交所需的配置模板。
- 帮助确认 Chrome / Firefox 所需环境变量名。

`wxt submit init` 生成的 `.env.submit` 不应提交到仓库。请将里面的值拆分到 GitHub Secrets。

## GitHub Secrets

在仓库 Settings -> Secrets and variables -> Actions 中配置：

Chrome：

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

Firefox：

- `FIREFOX_EXTENSION_ID`
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

如果某个商店暂时不发布，不要触发提交流程，或先在 workflow 中移除对应 `wxt submit` 参数。

## 扩展脚本

`apps/extension/package.json` 当前约定：

```json
{
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "postinstall": "wxt prepare"
  }
}
```

说明：

- `zip` 生成 Chrome 包。
- `zip:firefox` 生成 Firefox 包及 source zip。
- `postinstall` 用于执行 WXT prepare。

## Workflow 行为

workflow 执行顺序：

1. `actions/checkout`
2. 安装 pnpm `11.3.0`
3. 安装 Node.js `24`
4. `pnpm install --frozen-lockfile`
5. `pnpm --filter @tabora/extension zip`
6. `pnpm --filter @tabora/extension zip:firefox`
7. 上传 `.output` 中的 zip 产物
8. 运行 `wxt submit`

提交命令等价于：

```bash
wxt submit \
  --chrome-zip .output/*-chrome.zip \
  --firefox-zip .output/*-firefox.zip \
  --firefox-sources-zip .output/*-sources.zip
```

## 首次上架注意事项

- 首次创建扩展 listing 时，通常仍需在商店后台完成一次人工初始化。
- Chrome Web Store 与 Firefox Add-ons 对元数据、截图、隐私说明、权限说明都有审核要求。
- Firefox 发布通常要求 source zip；当前 workflow 已按 WXT 约定一并提交。

## 当前仓库注意事项

- 当前仓库 `pnpm install` 会执行 `prepare`，内部含 `vp config`。
- 如果 CI 环境出现 ignored builds 问题，需要保持 `pnpm-workspace.yaml` 中 `allowBuilds` 与 lockfile 同步。
- 当前 workflow 默认同时构建 Chrome 与 Firefox；如果实际只发布 Chrome，可移除 Firefox 步骤与 Secrets。

## 推荐发布流程

1. 本地确认 `pnpm --filter @tabora/extension zip` 可用。
2. 本地执行一次 `wxt submit init`，确认所需 Secrets。
3. 在 GitHub 配置全部 Secrets。
4. 手动触发 `Release Extension` 验证构建与 artifact 上传。
5. 用 tag `extension-vx.y.z` 触发正式发布。
