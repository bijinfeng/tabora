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

## 扩展脚本与 Workflow

构建脚本以 `apps/extension/package.json` 的 `scripts` 为准（`zip` 生成 Chrome 包，`zip:firefox` 生成 Firefox 包及 source zip）。CI 步骤、pnpm / Node 版本和 `wxt submit` 参数以 `.github/workflows/release-extension.yml` 为准，本文不重复以免漂移。

## 首次上架注意事项

- 首次创建扩展 listing 时，通常仍需在商店后台完成一次人工初始化。
- Chrome Web Store 与 Firefox Add-ons 对元数据、截图、隐私说明、权限说明都有审核要求。
- Firefox 发布通常要求 source zip；当前 workflow 已按 WXT 约定一并提交。
- 若只发布 Chrome，可在 workflow 中移除 Firefox 步骤与对应 Secrets。
