# workbench-shell overlays.css 拆分设计

## 背景

`packages/workbench-shell/src/styles/overlays.css` 当前承载了宿主 overlay 相关的大部分样式，包括：

- `expand`
- `modal`
- `settings`
- `context menu`
- `toast`
- `command palette`
- `fullscreen`
- `loading`
- 部分响应式样式
- 一组 prototype 阶段留下的通用 `.btn*` 样式
- `fade-in`、`scale-in`、`toast-in` 等动画

这类“全部堆在一个文件里”的 CSS 在前期迭代阶段是可接受的，但随着 `workbench-app` 的 TS/TSX 结构已经按 overlay 与 surface builder 拆开，样式层继续维持单文件会让修改路径与组件边界脱节。

## 目标

- 保持 `@tabora/workbench-shell/styles.css` 的外部入口不变
- 保持现有 overlay 视觉与交互行为不变
- 让样式边界对齐到 overlay 类型，而不是继续集中在一个大文件
- 明确动画、响应式和 prototype 通用按钮样式的归属
- 确保拆分后的 CSS 分片可以被 `exports` / `publishConfig` 正常发布

## 非目标

- 不修改任何 selector 命名
- 不调整视觉 token、颜色、间距或动画参数
- 不借此做新的 CSS 架构迁移，例如 CSS Modules、Tailwind 化或 token 重命名
- 不顺手修改 `workbench-app` 组件代码
- 不把 `.workbench-grid` 的响应式规则迁回 `base.css`，本次保持行为稳定优先

## 现状问题

### 1. 文件承担多类 overlay 语义

当前 `overlays.css` 同时负责弹层容器、上下文菜单、Toast、命令面板、全屏视图、加载态和网格响应式。阅读一个 overlay 的实现时，需要在一个 600+ 行文件中跳转。

### 2. 共享样式与业务样式混在一起

动画 `@keyframes fade-in` / `scale-in` / `toast-in`，以及 prototype 通用 `.btn` 样式和 overlay 具体样式混在同一文件。修改者很难判断一段样式是某个 overlay 独享，还是多个 overlay 的共享依赖。

### 3. 发布边界尚未随 CSS 分片细化

当前 `package.json` 只导出了：

- `./styles.css`
- `./styles/base.css`
- `./styles/overlays.css`

如果继续拆成多个文件而不补导出，构建或发布产物会丢失分片文件。

## 方案

采用“保留入口 + 按 overlay 类型拆分 + 共享样式单独收口”的方案。

### 入口保持不变

保留以下入口文件不变：

- `packages/workbench-shell/src/styles.css`
- `packages/workbench-shell/src/styles/overlays.css`

其中：

- `styles.css` 仍然只 import `base.css` 与 `overlays.css`
- `overlays.css` 从“完整样式实现”收敛为“overlay 分片入口”

这样可以保证：

- `stylePreset.ts` 中的 `@tabora/workbench-shell/styles.css` 引用无需修改
- 依赖方无需感知内部 CSS 继续被拆分

### 文件边界

#### 修改 `packages/workbench-shell/src/styles/overlays.css`

职责：

- 只保留 `@import` 列表
- 不再直接承载具体 overlay 样式

建议 import 顺序：

1. `overlay-animations.css`
2. `expand.css`
3. `modal.css`
4. `settings.css`
5. `context-menu.css`
6. `toast.css`
7. `command-palette.css`
8. `fullscreen.css`
9. `loading.css`
10. `overlay-responsive.css`

如果 `settings` 仍依赖 prototype 通用按钮样式，则把 `settings-controls.css` 放在 `settings.css` 之前，或将其作为 `settings.css` 的一部分一并搬运。推荐拆成独立文件，避免 `.btn` 样式继续漂浮为“看似全局但实际主要服务 settings”的残余段落。

#### 新增 `packages/workbench-shell/src/styles/overlay-animations.css`

职责：

- 承载 `@keyframes fade-in`
- 承载 `@keyframes scale-in`
- 承载 `@keyframes toast-in`

边界：

- 只放 `@keyframes`
- 不放具体 class selector

这样多个 overlay 文件可以继续使用相同动画，而不依赖某个具体 overlay 文件的顺序副作用。

#### 新增 `packages/workbench-shell/src/styles/expand.css`

职责：

- 承载 `.expand-*` 选择器

边界：

- 只包含 expand overlay 自身样式
- 不包含 animation 定义

#### 新增 `packages/workbench-shell/src/styles/modal.css`

职责：

- 承载 `.modal-*` 选择器

#### 新增 `packages/workbench-shell/src/styles/settings.css`

职责：

- 承载 `.settings-*` 选择器
- 包括侧栏、tab body、missing/empty、group/row 等 settings 专属样式

说明：

`/* SETTINGS GROUP (prototype) */` 这段虽然名字里有 prototype，但 selector 仍然明确属于 `settings-*`，应直接并入 `settings.css`，不要再保留一个“prototype settings”文件。

#### 新增 `packages/workbench-shell/src/styles/settings-controls.css`

职责：

- 承载 `.btn`、`.btn-subtle`、`.btn-sm`

说明：

这些样式现在实际上主要服务 settings 相关 prototype 交互，但 selector 太通用，不适合归入 `base.css`。单独拆一个局部文件，可以明确它是 overlay 侧遗留的宿主控件样式，而不是全平台按钮规范。

如果实现时确认 `.btn*` 只被 settings 使用，也允许并入 `settings.css`，但推荐单独文件，因为这组样式在语义上是“overlay controls”而非“settings layout”。

#### 新增 `packages/workbench-shell/src/styles/context-menu.css`

职责：

- 承载 `.ctx-menu-*` 选择器

#### 新增 `packages/workbench-shell/src/styles/toast.css`

职责：

- 承载 `.toast-*` 选择器

#### 新增 `packages/workbench-shell/src/styles/command-palette.css`

职责：

- 承载 `.cmd-*` 选择器

#### 新增 `packages/workbench-shell/src/styles/fullscreen.css`

职责：

- 承载 `.fullscreen-*` 选择器

#### 新增 `packages/workbench-shell/src/styles/loading.css`

职责：

- 承载 `.loading`

#### 新增 `packages/workbench-shell/src/styles/overlay-responsive.css`

职责：

- 承载与 overlay 相关的 responsive 规则
- 包括 `settings-drawer` 的 760px / 500px 断点规则
- 暂时保留当前文件中的 `.workbench-grid` / `.grid-item` 响应式规则

说明：

严格来说，`.workbench-grid` 更接近宿主布局基础样式，而不是 overlay 样式；但它当前位于 `overlays.css` 已经是既有事实。为了避免本次在拆 overlay 的同时又改动基础布局分层，本轮只做物理搬运，不迁移归属。后续若继续治理 `base.css`，再单开任务把这段移动到更合理的位置。

## 方案对比

### 方案 A：按 overlay 类型拆分（推荐）

优点：

- 和当前组件边界最一致
- 修改单个 overlay 时只需进入对应 CSS 文件
- 更适合后续继续拆 `WorkbenchShellChrome.tsx`

缺点：

- 需要补更多 `exports` / `publishConfig`
- 文件数会增加

### 方案 B：按“共享层”拆分

例如拆成 `containers.css`、`panels.css`、`animations.css`、`responsive.css`。

优点：

- 视觉层复用更集中

缺点：

- 单个 overlay 的样式会散落在多个文件
- 不利于与组件边界对齐

### 方案 C：最小拆分

只抽 `animations.css` 和 `responsive.css`。

优点：

- 风险最低

缺点：

- 主文件仍然很大
- 治理收益有限

本次采用方案 A。

## package.json 调整

需要更新 `packages/workbench-shell/package.json`：

- `exports`
- `publishConfig.exports`

新增导出至少包括：

- `./styles/overlay-animations.css`
- `./styles/expand.css`
- `./styles/modal.css`
- `./styles/settings.css`
- `./styles/settings-controls.css`
- `./styles/context-menu.css`
- `./styles/toast.css`
- `./styles/command-palette.css`
- `./styles/fullscreen.css`
- `./styles/loading.css`
- `./styles/overlay-responsive.css`

保留：

- `./styles.css`
- `./styles/base.css`
- `./styles/overlays.css`

## 风险与控制

### 风险 1：导入顺序导致样式覆盖变化

控制：

- 严格按原文件段落顺序搬运
- `@keyframes` 提前放到 `overlay-animations.css`
- 其余 class selector 只做原样移动，不做重排优化

### 风险 2：拆分后发布产物缺文件

控制：

- 同步更新 `exports` 与 `publishConfig.exports`
- 通过 `pnpm check` 和包内测试验证

### 风险 3：prototype 按钮样式归属不清

控制：

- 本次明确把 `.btn*` 标记为 `settings-controls.css`
- 不扩散到 `base.css`
- 后续如引入真正的宿主按钮规范，再统一替换

### 风险 4：responsive 归属仍不完美

控制：

- 本次只做物理拆分，不做语义迁移
- 在规格中显式记录 `.workbench-grid` 响应式暂留在 overlay-responsive，后续单独治理

## 测试与验证

需要运行：

- `pnpm --filter @tabora/workbench-shell test`
- `pnpm check`

验证标准：

- `src/styles/overlays.css` 收敛为入口文件
- 各 overlay 类型有独立 CSS 文件
- `package.json` 导出完整覆盖新增分片
- 工作区 `git status --short --untracked-files=all` 为空

## 范围判断

本次任务只覆盖 `@tabora/workbench-shell` 的 overlay 样式文件拆分，属于单一子系统内的可控重构，不需要再拆成多个规格。若后续继续治理 `base.css`、`WorkbenchShellChrome.tsx` 或宿主按钮系统，再单独开规格。
