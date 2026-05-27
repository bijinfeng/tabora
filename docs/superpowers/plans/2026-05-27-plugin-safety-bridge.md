# 插件安全桥实现计划

> **给 agentic workers：** 必需子技能：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行本计划。步骤使用 checkbox（`- [ ]`）语法追踪进度。

**目标：** 补齐 MVP 的安全闭环：插件视图渲染失败只影响对应实例，外部 URL 打开能力必须通过运行时权限桥校验。

**架构：** 在 playground 宿主的插件渲染边界增加轻量错误回退，让失败插件显示局部失败状态，不拖垮同级 widget、弹窗或全屏视图。扩展 `@tabora/platform-kernel` 的 runtime context，加入最小权限桥：根据 manifest 授权校验 `external-open` host，并只向宿主派发已批准的外部打开事件。

**技术栈：** Solid、TypeScript、Vitest、Vite+、`@tabora/platform-kernel`、`@tabora/plugin-api`、`apps/playground`。

---

## 文件结构

```txt
apps/playground/src/
  PluginViewBoundary.tsx
  PluginViewBoundary.test.tsx
  App.tsx

packages/platform-kernel/src/
  runtimeContext.ts
  runtimeContext.test.ts
  pluginKernel.ts

packages/official-plugins/src/
  search-command-bar.tsx
```

## 任务 1：增加插件视图错误边界

**文件：**

- 新建：`apps/playground/src/PluginViewBoundary.tsx`
- 新建：`apps/playground/src/PluginViewBoundary.test.tsx`
- 修改：`apps/playground/src/App.tsx`

- [x] **步骤 1：编写失败的边界测试**

新建 `apps/playground/src/PluginViewBoundary.test.tsx`，覆盖两个行为：

- 插件视图抛错时，渲染带有实例 ID 和标题的局部失败回退。
- 插件视图正常时，原样渲染健康内容。

关键断言：

```ts
expect(root.textContent).toContain("Broken Widget")
expect(root.textContent).toContain("Plugin view failed")
expect(root.textContent).toContain("broken-widget")
expect(root.textContent).not.toContain("Plugin view failed")
```

- [x] **步骤 2：运行边界测试并确认红灯**

运行：

```bash
pnpm test apps/playground/src/PluginViewBoundary.test.tsx
```

预期：失败，原因是 `./PluginViewBoundary` 尚不存在。

- [x] **步骤 3：实现最小插件视图边界**

新建 `apps/playground/src/PluginViewBoundary.tsx`。实现要点：

- `createPluginErrorFallback(error, instanceId, title)` 生成局部失败 DOM。
- `PluginViewBoundary` 捕获同步插件视图渲染错误。
- 回退 DOM 使用 `role="alert"` 和 `data-instance-id`，便于测试和后续 UI 样式定位。

- [x] **步骤 4：包裹 widget、modal、fullscreen 插件视图**

修改 `apps/playground/src/App.tsx`：

```tsx
import { PluginViewBoundary } from "./PluginViewBoundary"
```

widget 渲染入口：

```tsx
<PluginViewBoundary instanceId={inst.id} title={widgetTitle(inst.contributionId)}>
  {View({})}
</PluginViewBoundary>
```

modal / fullscreen 渲染入口：

- 如果 props 中有 `instanceId`，使用该实例 ID。
- 否则使用当前 `viewId` 作为边界 ID。

- [x] **步骤 5：运行边界测试**

运行：

```bash
pnpm test apps/playground/src/PluginViewBoundary.test.tsx
```

预期：通过。

## 任务 2：增加最小运行时权限桥

**文件：**

- 新建：`packages/platform-kernel/src/runtimeContext.test.ts`
- 修改：`packages/platform-kernel/src/runtimeContext.ts`
- 修改：`packages/platform-kernel/src/pluginKernel.ts`

- [x] **步骤 1：编写失败的权限桥测试**

新建 `packages/platform-kernel/src/runtimeContext.test.ts`，覆盖三个行为：

- 声明了 `external-open` host 时，允许打开匹配 host 的 URL。
- 未声明的 host 被拒绝。
- 官方可信插件可使用 `hosts: ["*"]` 作为通配授权。

关键断言：

```ts
expect(context.permissions.canOpenExternal("https://github.com/search?q=tabora")).toBe(true)
expect(context.permissions.openExternal("https://github.com/search?q=tabora")).toBe(true)
expect(opened).toEqual([{ url: "https://github.com/search?q=tabora" }])
expect(context.permissions.canOpenExternal("https://example.com")).toBe(false)
expect(context.permissions.openExternal("https://example.com")).toBe(false)
```

- [x] **步骤 2：运行权限测试并确认红灯**

运行：

```bash
pnpm test packages/platform-kernel/src/runtimeContext.test.ts
```

预期：失败，原因是 `PluginRuntimeContext` 中还没有 `permissions`。

- [x] **步骤 3：实现权限桥**

修改 `packages/platform-kernel/src/runtimeContext.ts`：

- 引入 `PluginPermission`。
- 新增 `PermissionBridge`：

```ts
export type PermissionBridge = {
  canOpenExternal(url: string): boolean
  openExternal(url: string): boolean
}
```

- 在 `PluginRuntimeContext` 中加入 `permissions`。
- `createPluginRuntimeContext` 接收 `grantedPermissions?: PluginPermission[]`。
- `canOpenExternal(url)` 解析 URL hostname，并与 `external-open.hosts` 比对。
- `openExternal(url)` 只在授权通过时派发 `host.external.open`。

- [x] **步骤 4：通过 plugin kernel 传入 manifest permissions**

修改 `packages/platform-kernel/src/pluginKernel.ts`：

```ts
grantedPermissions: plugin.manifest.permissions ?? []
```

- [x] **步骤 5：运行权限测试**

运行：

```bash
pnpm test packages/platform-kernel/src/runtimeContext.test.ts
```

预期：通过。

## 任务 3：让搜索外部打开走 Runtime API

**文件：**

- 修改：`packages/official-plugins/src/search-command-bar.tsx`
- 修改：`apps/playground/src/App.tsx`

- [x] **步骤 1：搜索视图改走运行时权限桥**

修改 `packages/official-plugins/src/search-command-bar.tsx`：

- `SearchCommandBar` 接收可选 `openExternal(url: string)`。
- 搜索提交时调用 `props.openExternal?.(url)`，不再直接调用 `window.open`。
- `officialSearchCommandBar.manifest.permissions` 声明 `external-open`。
- `activate(context)` 注册视图时注入：

```ts
openExternal: (url) => {
  context.permissions.openExternal(url)
}
```

- [x] **步骤 2：playground 宿主执行已授权的外部打开事件**

修改 `apps/playground/src/App.tsx`，监听内核派发的宿主事件：

```ts
kernel.events.on("host.external.open", (payload: any) => {
  if (typeof payload.url === "string") {
    window.open(payload.url, "_blank")
  }
})
```

注意：搜索插件不直接拿到宿主 `window.open`，它只能通过 `context.permissions.openExternal` 请求打开 URL。

- [x] **步骤 3：运行全部测试**

运行：

```bash
pnpm test
```

预期：通过。

## 任务 4：验证并记录进度

**文件：**

- 修改：`docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md`
- 修改：`docs/superpowers/plans/2026-05-27-plugin-safety-bridge.md`

- [x] **步骤 1：运行静态检查**

运行：

```bash
pnpm check
```

预期：通过。

- [x] **步骤 2：运行 workspace build**

运行：

```bash
pnpm build
```

预期：通过。

- [x] **步骤 3：补充第二阶段实现记录**

在 `docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md` 追加：

```md
## 16. 第二阶段实现记录

第二阶段补齐 MVP 安全闭环：插件视图渲染通过宿主边界隔离，单个插件实例失败时只显示该实例的失败回退，不拖垮工作台；外部 URL 打开能力通过运行时权限桥路由，插件只能请求 manifest/granted permissions 声明允许的 host。

本阶段通过 `pnpm test`、`pnpm check` 和 `pnpm build` 验证。
```

- [ ] **步骤 4：提交安全桥改动**

```bash
git add apps/playground packages/platform-kernel packages/official-plugins docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md docs/superpowers/plans/2026-05-27-plugin-safety-bridge.md
git commit -m "feat: add plugin safety bridge"
```

## 自查清单

- 规格覆盖：补齐 MVP 对插件渲染错误隔离和 `external-open` 权限桥的要求。
- 明确排除：本阶段不做第三方插件沙箱、安装时权限弹窗、clipboard/local-file 权限 UI、远程插件市场。
- 测试覆盖：插件视图边界行为、权限允许/拒绝行为、全量 workspace 测试。
- 验证命令：`pnpm test`、`pnpm check`、`pnpm build`。

## 2026-05-27 进度同步

状态：已实现并验证，尚未提交。

证据：

- `pnpm test` 已通过：10 个测试文件通过，15 个测试通过。
- `pnpm check` 已通过：64 个文件格式正确，43 个文件无 warning、lint error 或 type error。
- `pnpm build` 已通过：workspace package build 和 playground production build 均成功完成。
- playground dev server 冒烟已通过：运行 `pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort` 后，`http://127.0.0.1:5173/` 返回 HTTP 200。

备注：

- `步骤 4：提交安全桥改动` 仍未勾选，因为当前工作树还包含上一轮 foundation plan 的进度同步文档改动，提交分组需要单独决定。
- 已尝试使用 Browser 插件做可视化验证，但 in-app browser 后端报告 `iab` 不可用；本阶段已通过 HTTP 冒烟和 production build 验证。
