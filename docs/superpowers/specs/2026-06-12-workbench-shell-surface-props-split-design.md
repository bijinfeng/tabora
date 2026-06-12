# WorkbenchShellSurfaceProps 拆分设计

## 背景

`packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx` 当前承担了 8 组 surface props 的统一组装职责。文件本身不大，但已经同时包含：

- overlay props 组装
- settings host props 组装
- add-widget / toast / command palette 的动作型 props 组装
- 少量展示派生逻辑，例如 `aboutContent`

继续沿用单文件内联组装的方式，会让后续新增 surface、修改 overlay 行为或调整 settings 派生内容时，都必须进入同一个聚合函数，逐步放大耦合。

## 目标

- 保持 `WorkbenchShellSurfaceHost` 的消费方式不变
- 保持现有 surface 行为不变
- 把 `createWorkbenchShellSurfaceProps()` 收敛成总入口，而不是所有 props 的实现容器
- 顺手去掉 `pluginModal` / `fullscreenOverlay` 在 props 组装层的明显重复

## 非目标

- 不修改 `WorkbenchShellSurfaceHost.tsx` 的装配顺序
- 不修改 overlay 组件的 JSX 结构与交互语义
- 不引入跨层“万能 builder”或新的共享抽象层
- 不调整 shell state、controller runtime、catalog 的现有接口

## 现状问题

### 1. 单入口函数职责过多

`createWorkbenchShellSurfaceProps()` 当前同时知道 overlays、catalog、views、widget controller、settings copy、toast action 和 command palette，导致“任何一个 surface 的变化都需要重新理解整个函数”。

### 2. overlay 组装存在重复模式

`pluginModal` 与 `fullscreenOverlay` 的 props 结构高度一致：

- 都从 overlays 读取 `viewId` 与 props
- 都通过 `resolveWorkbenchView()` 解析 view
- 都透传 `tShell`
- 都透传 `pluginViewBoundaryCopy`
- 都只在 close handler 和 overlays getter 上有差异

这类重复如果继续留在总入口里，会让后续新增第三种插件 surface 时再次复制。

### 3. settings host 派生逻辑不够聚焦

`settingsHost` 除了基础 props，还内联构造了 `aboutContent`，并依赖 workspace state 与 plugin summaries。它本质上已经是独立的 builder，但当前与其他 surface 混在一起。

## 方案

采用“小步拆分 + 局部去重”的方案，把 `WorkbenchShellSurfaceProps` 拆成总入口 + 3 个 builder 文件。

### 文件结构

#### 修改 `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`

职责：

- 保留 `createWorkbenchShellSurfaceProps(shell)` 作为唯一对外入口
- 只负责读取 `shell`，调用子 builder，并汇总返回值
- 不再直接内联构造 8 组 surface props

#### 新增 `packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx`

职责：

- 组装 `expandOverlay`
- 组装 `pluginModal`
- 组装 `fullscreenOverlay`
- 组装 `contextMenuOverlay`
- 提供一个局部共享 helper，统一 `pluginModal` / `fullscreenOverlay` 的重复 props 构造

边界：

- 仅处理 overlays + views + widget controller + boundary copy
- 不负责 settings host、toast、command palette

#### 新增 `packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`

职责：

- 组装 `settingsHost`
- 构造 `aboutContent`
- 统一 `settings copy` 与 `panelProps`、`getView` 的注入方式

边界：

- 仅处理 settings host 所需的 workspace、catalog、views、copy
- 不关心其他 overlay

#### 新增 `packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts`

职责：

- 组装 `addWidgetModal`
- 组装 `toastHost`
- 组装 `commandPalette`

边界：

- 仅处理动作型 surface props
- 不依赖 settings host 的 about 信息

## 共享 helper 设计

在 `WorkbenchShellSurfaceOverlayProps.tsx` 内新增局部 helper，例如概念上形如：

```ts
function createPluginViewOverlayProps(options: {
  viewId: string | null
  viewProps: Record<string, unknown>
  getViewId: () => string | null
  getViewProps: () => Record<string, unknown>
  close: () => void
  views: WorkbenchShell["views"]
  tShell?: WorkbenchShell["tShell"]
  pluginViewBoundaryCopy?: WorkbenchShell["shellCopy"] extends infer _ ? unknown : never
})
```

实际实现不追求“通用到未来所有 overlay”，只抽出当前 `pluginModal` / `fullscreenOverlay` 已经重复且完全同构的部分：

- `viewId`
- `getView`
- `close handler`
- `tShell`
- `pluginViewBoundaryCopy`

`expandOverlay` 不并入该 helper，因为它额外依赖 `widgetIconForProps` 与 `widgetController.closeExpand`，语义不同，强行合并会损失可读性。

## 数据流

拆分后数据流保持不变：

1. `WorkbenchShellSurfaceHost` 调用 `createWorkbenchShellSurfaceProps(shell)`
2. 总入口读取 `shell` 上的共享依赖
3. 总入口调用：
   - `createWorkbenchShellSurfaceOverlayProps(shell)`
   - `createWorkbenchShellSurfaceSettingsProps(shell)`
   - `createWorkbenchShellSurfaceActionProps(shell)`
4. 合并结果并返回给 host

这样可以保持外层接口稳定，同时把内部实现拆成按职责聚合的单元。

## 测试策略

沿用现有 `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`，只做必要增强，不做低价值扩测。

需要覆盖的点：

- `aboutContent` 仍能正确读取 workspace name 与 enabled plugin count
- `addWidgetModal.onAdd()` 仍会调用 `addWidget` 并关闭 modal
- `contextMenuOverlay.sections` 在无模型时仍默认为空数组
- `toastHost.onAction()` 仍会把 commandId 转发给 `runCommand`

如果拆分后某个 builder 暴露了清晰纯函数接口，可以补 1 组 builder 级测试，但前提是测试成本低且能减少回归风险；否则保持现有 surface props 测试即可。

## 风险与控制

### 风险 1：拆分后 import 关系变乱

控制：

- 只允许总入口依赖各 builder
- builder 之间不交叉依赖
- 共享 helper 只留在 overlay builder 内部，不额外扩散

### 风险 2：去重过度导致抽象变形

控制：

- 只对 `pluginModal` / `fullscreenOverlay` 做局部去重
- `expandOverlay`、`settingsHost`、`addWidgetModal` 保持独立 builder 语义

### 风险 3：行为回归

控制：

- 不修改 `WorkbenchShellSurfaceHost.tsx` 的消费契约
- 不修改 surface 组件实现
- 以现有测试 + `pnpm check` 做最终验证

## 验证标准

- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx` 显著收敛为总入口
- overlay / settings / action props 各自有独立 builder 文件
- `pluginModal` / `fullscreenOverlay` 的 props 组装不再重复内联
- `pnpm test -- packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx` 通过
- `pnpm check` 通过

## 实施范围判断

本次范围只覆盖 `surface props` 组装层，属于单一子系统内的可控拆分，不需要进一步拆成多个独立规格。后续若继续治理 `WorkbenchShellSurfaceHost` 或 overlay JSX 本体，可单独开下一轮设计。
