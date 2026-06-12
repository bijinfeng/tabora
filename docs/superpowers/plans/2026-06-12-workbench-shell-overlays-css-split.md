# workbench-shell overlays.css 拆分实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `@tabora/workbench-shell` 的 `overlays.css` 重构为稳定入口 + 多个按 overlay 类型划分的 CSS 分片，同时保持外部入口、样式语义和发布产物不变。

**架构：** 保留 `src/styles.css` 和 `src/styles/overlays.css` 两级入口不变，把原 `overlays.css` 中的样式按 `expand`、`modal`、`settings`、`context-menu`、`toast`、`command-palette`、`fullscreen`、`loading`、`responsive` 和共享 `animations` / `settings-controls` 拆到独立文件。同步更新 `package.json` 的 `exports` 与 `publishConfig.exports`，确保 dist 中新增 CSS 分片可被正确消费。

**技术栈：** CSS、TypeScript package exports、Vitest、pnpm workspace

---

## 文件结构

**创建：**

- `packages/workbench-shell/src/styles/overlay-animations.css`：承载 `fade-in`、`scale-in`、`toast-in` 三个 keyframes
- `packages/workbench-shell/src/styles/expand.css`：承载 `.expand-*`
- `packages/workbench-shell/src/styles/modal.css`：承载 `.modal-*`
- `packages/workbench-shell/src/styles/settings.css`：承载 `.settings-*` 与 `.settings-group*` / `.settings-row*`
- `packages/workbench-shell/src/styles/settings-controls.css`：承载 `.btn*`
- `packages/workbench-shell/src/styles/context-menu.css`：承载 `.ctx-menu-*`
- `packages/workbench-shell/src/styles/toast.css`：承载 `.toast-*`
- `packages/workbench-shell/src/styles/command-palette.css`：承载 `.cmd-*`
- `packages/workbench-shell/src/styles/fullscreen.css`：承载 `.fullscreen-*`
- `packages/workbench-shell/src/styles/loading.css`：承载 `.loading`
- `packages/workbench-shell/src/styles/overlay-responsive.css`：承载 `settings-drawer` 断点与当前遗留 `.workbench-grid` / `.grid-item` 响应式

**修改：**

- `packages/workbench-shell/src/styles/overlays.css`：改成分片入口
- `packages/workbench-shell/package.json`：补齐新增 CSS 分片导出

**验证：**

- `pnpm --filter @tabora/workbench-shell test`
- `pnpm check`

### 任务 1：建立分片入口和共享动画文件

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/overlay-animations.css`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/overlays.css`

- [ ] **步骤 1：先把动画定义抽成共享文件**

创建 `overlay-animations.css`，只搬运三个 `@keyframes`：

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.95) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **步骤 2：把 `overlays.css` 先改成入口骨架**

先创建任务 2、任务 3 中会用到的空分片文件，再将 `overlays.css` 改为仅保留 import，避免入口短暂引用不存在的文件。最终入口内容如下：

```css
@import "./overlay-animations.css";
@import "./expand.css";
@import "./modal.css";
@import "./settings-controls.css";
@import "./settings.css";
@import "./context-menu.css";
@import "./toast.css";
@import "./command-palette.css";
@import "./fullscreen.css";
@import "./loading.css";
@import "./overlay-responsive.css";
```

注意：即使后续文件还没创建完成，也要以最终顺序为准，避免后面反复改入口。

- [ ] **步骤 3：运行格式和诊断检查，确认入口文件语法正确**

使用 IDE diagnostics 检查：

```txt
packages/workbench-shell/src/styles/overlay-animations.css
packages/workbench-shell/src/styles/overlays.css
```

预期：无语法错误。

- [ ] **步骤 4：提交入口与动画分片**

运行：

```bash
git add \
  packages/workbench-shell/src/styles/overlay-animations.css \
  packages/workbench-shell/src/styles/overlays.css
git commit -m "refactor(workbench-shell): add overlay css entry files"
```

### 任务 2：拆分 expand、modal、settings 相关样式

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/expand.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/modal.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/settings.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/settings-controls.css`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/overlays.css`

- [ ] **步骤 1：搬运 expand 段到 `expand.css`**

把原 `overlays.css` 中 `/* ====== EXPAND ====== */` 下的 `.expand-*` 原样搬到新文件：

```css
.expand-overlay {
  /* 原样搬运 */
}
.expand-shell {
  /* 原样搬运 */
}
.expand-shell.is-fullscreen {
  /* 原样搬运 */
}
.expand-shell.is-card-fallback .expand-body {
  /* 原样搬运 */
}
.expand-header {
  /* 原样搬运 */
}
.expand-title {
  /* 原样搬运 */
}
.expand-title-icon {
  /* 原样搬运 */
}
.expand-title-texts {
  /* 原样搬运 */
}
.expand-title-text {
  /* 原样搬运 */
}
.expand-title-meta {
  /* 原样搬运 */
}
.expand-close-btn {
  /* 原样搬运 */
}
.expand-close-btn:hover {
  /* 原样搬运 */
}
.expand-body {
  /* 原样搬运 */
}
.expand-footer {
  /* 原样搬运 */
}
.expand-footer-meta {
  /* 原样搬运 */
}
.expand-close-hint {
  /* 原样搬运 */
}
```

- [ ] **步骤 2：搬运 modal 段到 `modal.css`**

把 `.modal-*` 样式原样搬运：

```css
.modal-overlay {
  /* 原样搬运 */
}
.modal-container {
  /* 原样搬运 */
}
.modal-title {
  /* 原样搬运 */
}
.modal-body {
  /* 原样搬运 */
}
.modal-close {
  /* 原样搬运 */
}
.modal-close:hover {
  /* 原样搬运 */
}
```

- [ ] **步骤 3：搬运 settings 布局样式到 `settings.css`**

把 `.settings-*` 与 settings group/row 样式搬运到同一文件：

```css
.settings-overlay {
  /* 原样搬运 */
}
.settings-drawer {
  /* 原样搬运 */
}
.settings-sidebar {
  /* 原样搬运 */
}
.settings-sidebar-spacer {
  /* 原样搬运 */
}
.settings-sidebar-title {
  /* 原样搬运 */
}
.settings-sidebar-group-title {
  /* 原样搬运 */
}
.settings-nav {
  /* 原样搬运 */
}
.settings-nav:hover {
  /* 原样搬运 */
}
.settings-nav.active {
  /* 原样搬运 */
}
.settings-content {
  /* 原样搬运 */
}
.settings-tab-title {
  /* 原样搬运 */
}
.settings-close-btn {
  /* 原样搬运 */
}
.settings-close-btn:hover {
  /* 原样搬运 */
}
.settings-tab-body {
  /* 原样搬运 */
}
.settings-empty {
  /* 原样搬运 */
}
.settings-panel-missing {
  /* 原样搬运 */
}
.settings-group {
  /* 原样搬运 */
}
.settings-group-title {
  /* 原样搬运 */
}
.settings-row {
  /* 原样搬运 */
}
.settings-row-label {
  /* 原样搬运 */
}
.settings-row-desc {
  /* 原样搬运 */
}
.settings-row-hint {
  /* 原样搬运 */
}
```

- [ ] **步骤 4：把 prototype 通用按钮样式单独搬到 `settings-controls.css`**

只搬运 `.btn*`：

```css
.btn {
  /* 原样搬运 */
}
.btn:focus-visible {
  /* 原样搬运 */
}
.btn-subtle {
  /* 原样搬运 */
}
.btn-subtle:hover {
  /* 原样搬运 */
}
.btn-sm {
  /* 原样搬运 */
}
```

- [ ] **步骤 5：运行 package 单测确认 shell 包没有回归**

运行：

```bash
pnpm --filter @tabora/workbench-shell test
```

预期：PASS。

- [ ] **步骤 6：提交核心 overlay 样式拆分**

运行：

```bash
git add \
  packages/workbench-shell/src/styles/expand.css \
  packages/workbench-shell/src/styles/modal.css \
  packages/workbench-shell/src/styles/settings.css \
  packages/workbench-shell/src/styles/settings-controls.css \
  packages/workbench-shell/src/styles/overlays.css
git commit -m "refactor(workbench-shell): split primary overlay styles"
```

### 任务 3：拆分 context menu、toast、command palette、fullscreen、loading 与 responsive

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/context-menu.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/toast.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/command-palette.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/fullscreen.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/loading.css`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/overlay-responsive.css`

- [ ] **步骤 1：搬运 `context menu` 样式**

创建 `context-menu.css` 并搬运：

```css
.ctx-menu-overlay {
  /* 原样搬运 */
}
.ctx-menu-panel {
  /* 原样搬运 */
}
.ctx-menu-item {
  /* 原样搬运 */
}
.ctx-menu-item:hover {
  /* 原样搬运 */
}
.ctx-menu-check {
  /* 原样搬运 */
}
.ctx-menu-danger {
  /* 原样搬运 */
}
.ctx-menu-sep {
  /* 原样搬运 */
}
```

- [ ] **步骤 2：搬运 `toast` 样式**

创建 `toast.css` 并搬运：

```css
.toast-stack {
  /* 原样搬运 */
}
.toast-item {
  /* 原样搬运 */
}
.toast-icon {
  /* 原样搬运 */
}
.toast-message {
  /* 原样搬运 */
}
.toast-action {
  /* 原样搬运 */
}
```

- [ ] **步骤 3：搬运 `command palette` 样式**

创建 `command-palette.css` 并搬运：

```css
.cmd-overlay {
  /* 原样搬运 */
}
.cmd-panel {
  /* 原样搬运 */
}
.cmd-input-wrap {
  /* 原样搬运 */
}
.cmd-input {
  /* 原样搬运 */
}
.cmd-input::placeholder {
  /* 原样搬运 */
}
.cmd-results {
  /* 原样搬运 */
}
.cmd-group {
  /* 原样搬运 */
}
.cmd-item {
  /* 原样搬运 */
}
.cmd-item:hover,
.cmd-item.active {
  /* 原样搬运 */
}
.cmd-item-icon {
  /* 原样搬运 */
}
.cmd-item-text {
  /* 原样搬运 */
}
.cmd-item-name {
  /* 原样搬运 */
}
.cmd-item-desc {
  /* 原样搬运 */
}
.cmd-empty {
  /* 原样搬运 */
}
```

- [ ] **步骤 4：搬运 `fullscreen` 与 `loading` 样式**

创建两个文件：

```css
/* fullscreen.css */
.fullscreen-overlay {
  /* 原样搬运 */
}
.fullscreen-close {
  /* 原样搬运 */
}
.fullscreen-body {
  /* 原样搬运 */
}
```

```css
/* loading.css */
.loading {
  /* 原样搬运 */
}
```

- [ ] **步骤 5：搬运响应式规则到 `overlay-responsive.css`**

把以下断点规则原样搬运：

```css
@media (max-width: 760px) {
  .settings-drawer {
    grid-template-columns: 160px minmax(0, 1fr);
    max-width: 100vw;
  }
}

@media (max-width: 500px) {
  .settings-drawer {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    max-height: 170px;
    overflow-y: auto;
    border-right: 0;
    border-bottom: 1px solid rgb(var(--color-line));
  }
}

@media (max-width: 640px) {
  .toast-stack {
    right: 12px;
    bottom: 12px;
    left: 12px;
  }
  .toast-item {
    max-width: 100%;
  }
}

@media (max-width: 1100px) {
  .workbench-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .workbench-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 500px) {
  .workbench-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
  .grid-item {
    grid-column: span 1;
    grid-row: auto;
  }
  .grid-item .widget-card {
    height: auto;
    min-height: 0;
  }
}
```

- [ ] **步骤 6：运行 package 单测，确认后半段样式拆分没有引入意外问题**

运行：

```bash
pnpm --filter @tabora/workbench-shell test
```

预期：PASS。

- [ ] **步骤 7：提交剩余 overlay 样式分片**

运行：

```bash
git add \
  packages/workbench-shell/src/styles/context-menu.css \
  packages/workbench-shell/src/styles/toast.css \
  packages/workbench-shell/src/styles/command-palette.css \
  packages/workbench-shell/src/styles/fullscreen.css \
  packages/workbench-shell/src/styles/loading.css \
  packages/workbench-shell/src/styles/overlay-responsive.css
git commit -m "refactor(workbench-shell): split secondary overlay styles"
```

### 任务 4：补齐 package 导出并做最终验证

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/package.json`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/overlays.css`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-shell/src/styles/*.css`

- [ ] **步骤 1：补齐 `package.json` 的 `exports` 与 `publishConfig.exports`**

在 `exports` 中新增：

```json
"./styles/overlay-animations.css": "./src/styles/overlay-animations.css",
"./styles/expand.css": "./src/styles/expand.css",
"./styles/modal.css": "./src/styles/modal.css",
"./styles/settings.css": "./src/styles/settings.css",
"./styles/settings-controls.css": "./src/styles/settings-controls.css",
"./styles/context-menu.css": "./src/styles/context-menu.css",
"./styles/toast.css": "./src/styles/toast.css",
"./styles/command-palette.css": "./src/styles/command-palette.css",
"./styles/fullscreen.css": "./src/styles/fullscreen.css",
"./styles/loading.css": "./src/styles/loading.css",
"./styles/overlay-responsive.css": "./src/styles/overlay-responsive.css"
```

在 `publishConfig.exports` 中新增对应 `dist` 路径：

```json
"./styles/overlay-animations.css": "./dist/styles/overlay-animations.css",
"./styles/expand.css": "./dist/styles/expand.css",
"./styles/modal.css": "./dist/styles/modal.css",
"./styles/settings.css": "./dist/styles/settings.css",
"./styles/settings-controls.css": "./dist/styles/settings-controls.css",
"./styles/context-menu.css": "./dist/styles/context-menu.css",
"./styles/toast.css": "./dist/styles/toast.css",
"./styles/command-palette.css": "./dist/styles/command-palette.css",
"./styles/fullscreen.css": "./dist/styles/fullscreen.css",
"./styles/loading.css": "./dist/styles/loading.css",
"./styles/overlay-responsive.css": "./dist/styles/overlay-responsive.css"
```

- [ ] **步骤 2：运行全量验证**

运行：

```bash
pnpm --filter @tabora/workbench-shell test
pnpm check
```

预期：

- 第一个命令 PASS
- 第二个命令 PASS，包含 format、lint、typecheck、architecture

- [ ] **步骤 3：检查编辑文件 diagnostics**

使用 IDE diagnostics 检查以下文件：

```txt
packages/workbench-shell/src/styles/overlays.css
packages/workbench-shell/src/styles/overlay-animations.css
packages/workbench-shell/src/styles/expand.css
packages/workbench-shell/src/styles/modal.css
packages/workbench-shell/src/styles/settings.css
packages/workbench-shell/src/styles/settings-controls.css
packages/workbench-shell/src/styles/context-menu.css
packages/workbench-shell/src/styles/toast.css
packages/workbench-shell/src/styles/command-palette.css
packages/workbench-shell/src/styles/fullscreen.css
packages/workbench-shell/src/styles/loading.css
packages/workbench-shell/src/styles/overlay-responsive.css
packages/workbench-shell/package.json
```

预期：无新增语法或配置错误。

- [ ] **步骤 4：提交最终导出与收尾改动**

运行：

```bash
git add \
  packages/workbench-shell/src/styles/overlays.css \
  packages/workbench-shell/src/styles/overlay-animations.css \
  packages/workbench-shell/src/styles/expand.css \
  packages/workbench-shell/src/styles/modal.css \
  packages/workbench-shell/src/styles/settings.css \
  packages/workbench-shell/src/styles/settings-controls.css \
  packages/workbench-shell/src/styles/context-menu.css \
  packages/workbench-shell/src/styles/toast.css \
  packages/workbench-shell/src/styles/command-palette.css \
  packages/workbench-shell/src/styles/fullscreen.css \
  packages/workbench-shell/src/styles/loading.css \
  packages/workbench-shell/src/styles/overlay-responsive.css \
  packages/workbench-shell/package.json
git commit -m "refactor(workbench-shell): split overlays css"
```

- [ ] **步骤 5：确认工作区干净**

运行：

```bash
git status --short --untracked-files=all
```

预期：无输出。
