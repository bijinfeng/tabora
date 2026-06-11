# Shell 宿主 UI 文案国际化设计（第二批）

**目标：** 在不破坏包边界的前提下，将 workbench 宿主层（workbench-app + workbench-shell）仍残留的用户可见文案纳入 `tabora.shell`，支持 `zh-CN` / `en-US`，并保持缺失 key 时可回退到中文默认文案。

**范围：**

- Workbench 顶层宿主 UI：工具栏、添加卡片弹窗、关于信息、展开/弹窗/全屏 overlay、右键菜单 overlay。
- 宿主的 empty/error 占位文案（例如「卡片实例无效」「展开视图不可用」等）。
- 交互层的用户可见错误消息（仅限 UI 提示文案，不包含日志/调试信息）。

**非目标：**

- 不调整视觉样式与布局结构。
- 不引入第三方 i18n 库。
- 不修改插件自身文案（插件应通过 `context.i18n.registerMessages` 自行处理）。

---

## 约束与原则

- `@tabora/workbench-shell` 不直接依赖 runtime i18n：跨包的 shell 组件继续通过 `copy` props 注入文案。
- `@tabora/workbench-app` 允许直接依赖 runtime i18n：同包内部组件可以直接调用 `runtime.i18n.t()`。
- 文案 key 统一归入 `tabora.shell`，避免继续引入新的 namespace。

---

## 方案选择

采用「workbench-app 内部直接 `t()`，跨包组件继续注入 copy」的混合方案：

- 对 workbench-app 内部组件（例如 `WorkbenchShellChrome.tsx`）：
  - 直接使用 `runtime.i18n.t("tabora.shell", key)` 获取文案；
  - 保留中文 fallback，防止注入缺失导致 UI 为空。
- 对 `@tabora/workbench-shell` 组件（例如 `WidgetCardShell`、`PluginViewBoundary`、`CommandPalette`）：
  - 继续通过 `shellCopy.ts` 产出 `copy`，由装配层注入；
  - shell 包内不引入 `InjectedI18n` 或 i18n store 依赖。

---

## Key 设计

按模块分段，避免无序增长：

- `chrome.addWidget.title`
- `chrome.toolbar.search`
- `chrome.toolbar.settings`
- `chrome.toolbar.toggleThemeToDark`
- `chrome.toolbar.toggleThemeToLight`
- `chrome.settings.about.title`
- `chrome.settings.about.description`
- `chrome.settings.about.workspaceLabel`
- `chrome.settings.about.enabledPluginsLabel`
- `chrome.expand.meta.settings`
- `chrome.expand.meta.expand`
- `chrome.expand.close.settings`
- `chrome.expand.close.expand`
- `chrome.expand.viewMissing`
- `chrome.expand.footerHint`
- `chrome.modal.close`
- `chrome.fullscreen.close`
- `chrome.contextMenu.current`
- `placeholders.widgetInstanceInvalid`
- `placeholders.expandViewUnavailable`

注：字符串变量使用 `{name}` 风格占位，例如 `placeholders.widgetInstanceInvalid` 支持 `{instanceId}`。

---

## 接入点

- `packages/workbench-app/src/runtime/bootstrap.ts`
  - 扩展注册 `tabora.shell` 的 `zh-CN` / `en-US` messages。
- `packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts`
  - 补齐面向宿主 UI 的 `tShell`（或等价）接口，统一在装配层构造。
- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`
  - 将硬编码中文替换为 `t("tabora.shell", ...)`（保留 fallback）。
  - 继续给 `WidgetCardShell` / `PluginViewBoundary` 传入 copy，不破坏边界。
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
  - 将 `tShell` 透传到 `WorkbenchShellChrome` / overlays，避免散落重复绑定逻辑。

---

## 测试策略

- 优先复用现有单测入口：
  - 在 `WorkbenchShellSurfaceHost.test.tsx` 验证工具栏/弹窗/overlay 的关键文案可随 locale 变化。
  - 在 `WorkbenchShellInstanceRenderer.test.tsx` 验证空态/错误提示使用 `tabora.shell` key。
- 保持原有中文用例不被破坏；新增英文用例只覆盖关键路径，避免用例膨胀。
