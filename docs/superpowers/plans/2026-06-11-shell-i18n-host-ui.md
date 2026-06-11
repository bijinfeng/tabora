# Shell 宿主 UI 文案国际化（第二批）实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 workbench 宿主层仍残留的用户可见文案纳入 `tabora.shell`（`zh-CN` / `en-US`），并保持 `@tabora/workbench-shell` 的包边界不引入 runtime i18n 依赖。

**架构：** workbench-app 内部组件直接使用 runtime i18n 的 `t("tabora.shell", key)`；跨包的 workbench-shell 组件继续通过 `copy` props 注入。

**技术栈：** Solid、TypeScript、Vitest、pnpm workspace、自研 `WorkbenchI18nStore`

---

## 文件结构（本批次）

**修改：**

- `packages/workbench-app/src/runtime/bootstrap.ts`：补齐 `tabora.shell` 第二批 key 的双语 messages
- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`：替换硬编码 UI 文案为 `tShell(...)`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`：透传 `tShell` 到 Chrome/overlays
- `packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts`：提供 `tShell` 的统一构造与透传
- `packages/workbench-app/src/shell/WorkbenchShellContext.tsx`：为 `WorkbenchShell` 暴露 `tShell`（如需要）

**测试：**

- `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`
- `packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
- `packages/workbench-app/src/runtime/bootstrap.test.ts`

---

### 任务 1：补齐 `tabora.shell` 第二批 messages

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/runtime/bootstrap.ts`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/runtime/bootstrap.test.ts`

- [ ] **步骤 1：新增失败测试（en-US）覆盖新增 key**

在 `bootstrap.test.ts` 中新增断言（示例）：

```ts
expect(i18n.t("tabora.shell", "chrome.toolbar.search")).toBe("Search")
expect(i18n.t("tabora.shell", "chrome.settings.about.title")).toBe("About Tabora")
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-app/src/runtime/bootstrap.test.ts`
预期：FAIL，提示 key 缺失或回退为中文。

- [ ] **步骤 3：在 `bootstrap.ts` 注册新增 key 的 zh-CN/en-US**

补齐 `tabora.shell` messages 表（避免改动现有 key）。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-app/src/runtime/bootstrap.test.ts`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/runtime/bootstrap.ts packages/workbench-app/src/runtime/bootstrap.test.ts
git commit -m "feat(i18n): expand tabora.shell host UI messages"
```

---

### 任务 2：为 Chrome/overlays 提供统一的 `tShell` 透传

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- （可选）修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/shell/WorkbenchShellContext.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

- [ ] **步骤 1：新增失败测试：toolbar 文案可随 `tShell` 变化**

在 `WorkbenchShellSurfaceHost.test.tsx` 新增一个用例：

- 构造 `tShell` 返回英文
- 渲染 surface host
- 断言工具栏出现 `Search` / `Settings`

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`
预期：FAIL，仍为中文。

- [ ] **步骤 3：在 runtime/props 链路增加 `tShell`**

将 `tShell` 从 runtime 构造层透传到 `WorkbenchShellChrome` 的 props。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx
git commit -m "feat(i18n): wire tabora.shell tShell into chrome surfaces"
```

---

### 任务 3：国际化 `WorkbenchShellChrome` 与 overlays 文案

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

- [ ] **步骤 1：新增失败测试：展开 overlay/meta/关闭按钮文案可被英文化**

在 `WorkbenchShellSurfaceHost.test.tsx` 新增用例：

- 打开 expand overlay（或调用对应动作）
- 断言包含 `Instance Settings` / `Expanded View`（或约定英文）

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`
预期：FAIL

- [ ] **步骤 3：替换 `WorkbenchShellChrome.tsx` 硬编码文案**

改造点（示例）：

- `添加卡片` → `tShell("chrome.addWidget.title")`
- `搜索` / `设置` → `tShell("chrome.toolbar.search")` / `tShell("chrome.toolbar.settings")`
- 主题切换 aria-label → `chrome.toolbar.toggleThemeToLight/ToDark`
- `关于 Tabora` 与描述文字 → `chrome.settings.about.*`
- expand overlay 的 meta/close/missing/footer hint → `chrome.expand.*`
- modal/fullscreen close aria-label → `chrome.modal.close` / `chrome.fullscreen.close`
- context menu 的 `当前` → `chrome.contextMenu.current`
- placeholder（如 `卡片实例无效`）→ `placeholders.widgetInstanceInvalid`

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/surface/WorkbenchShellChrome.tsx packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx
git commit -m "feat(i18n): internationalize workbench shell chrome copy"
```

---

### 任务 4：国际化宿主 empty/error 占位文案（renderer 等）

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`

- [ ] **步骤 1：新增失败测试：英文 `placeholders.*` 在 renderer 中生效**

在 `WorkbenchShellInstanceRenderer.test.tsx` 中：

- 构造一个缺失 model/view 的场景
- 断言文案为英文（例如 `Invalid widget instance: ...`）

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
预期：FAIL

- [ ] **步骤 3：将 renderer 的硬编码文案改为使用 `tShell` 或 injected copy**

优先复用任务 2 中的 `tShell` 链路，避免重复造 copy。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.tsx packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx
git commit -m "feat(i18n): internationalize shell placeholders"
```

---

### 任务 5：整体验证

- [ ] **步骤 1：运行全量检查**

运行：`pnpm test && pnpm check`
预期：全部通过。

- [ ] **步骤 2：Commit（如需要）**

如果出现仅格式化/类型修复的小改动，单独提交：

```bash
git add -A
git commit -m "chore(i18n): fix checks"
```
