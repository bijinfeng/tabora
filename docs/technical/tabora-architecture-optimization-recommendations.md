# Tabora 架构优化建议

版本：V1.0

日期：2026-06-09

状态：**本轮建议已全部落地**（截至 2026-06-09 commit e6023d4）。本文档保留作为架构演进事实源与决策记录。

关联文档：

- 文档地图：`docs/README.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归基准：`docs/technical/tabora-regression-baseline.md`

## 1. 本轮已收口项

### 1.1 文档入口恢复

`docs/README.md` 已把本文档登记为架构审查入口。本文档补齐后，架构 review 不再指向缺失路径。

### 1.2 编排层依赖收紧

`@tabora/orchestrator` 保持纯模型和编排职责，不再承接 JSX 布局渲染桥，也不依赖 `@tabora/storage` 或 `solid-js`。布局 view 渲染所需的 `createLayoutEngine` 已归入 `@tabora/workbench-app`，由 shell runtime 负责把 `PluginCatalog`、实例 renderer 和 `LayoutHostAPI` 组装成 Solid 可渲染的 `RegionSlot`。

### 1.3 协议层 renderer 解耦

`@tabora/plugin-api` 的 `RegionSlot` / `LayoutViewProps` 改为泛型渲染结果契约。协议层不再直接 import Solid JSX；Solid layout 插件和 workbench shell 在使用点显式声明 `LayoutViewProps<JSX.Element>`。

### 1.4 Widget geometry 单一事实源

`WidgetSize -> grid span` 映射已收敛到 `@tabora/plugin-api` 的 `widgetGeometry`。`@tabora/workbench-app` 的网格持久化、`@tabora/workbench-shell` 的卡片壳 CSS 变量、`@tabora/orchestrator` 的拖拽排序计划都从同一 helper 读取，避免视觉布局、排序模型和持久化状态漂移。

### 1.5 Shell app 生产依赖收紧

playground / extension 的生产依赖只保留真实宿主入口需要的 host composition 包、`@tabora/ui` / `@tabora/workbench-shell` 样式包和 Solid。官方插件、layout package、core runtime package 统一通过 `@tabora/builtin-plugin-registry` 与 `@tabora/workbench-app` 间接进入 shell。

### 1.6 自动化守卫补齐

`pnpm check:architecture` 新增守卫：

- shell app 生产依赖不能直接声明官方插件、layout package、插件 package 或 core runtime package。
- `@tabora/orchestrator` 不能依赖 `@tabora/storage` 或 `solid-js`。

### 1.7 WorkbenchShellApp 状态分片与 surface context 收口

`WorkbenchShellApp` 原本一次性创建 27 个扁平 `createSignal` 并解构约 50 个 accessor/setter 手工接线，且用一个 44 行 `createMemo` 把 ~50 个本地变量拍平成 surface props 再透传。现已按 domain 分片：

- 状态拆为 6 个 co-located store 模块：`WorkbenchRuntimeStore` / `WorkbenchWorkspaceStore` / `WorkbenchAppearanceStore` / `WorkbenchWidgetStore` / `WorkbenchOverlayStore` / `WorkbenchSearchStore`。`createWorkbenchShellState` 退化为组合根，返回 `{ runtime, workspace, appearance, widgets, overlays, search }`。
- 原语按数据性质选择：纯 UI 域（overlay flags、appearance、runtime）用 `createStore`；会写入 Dexie/IndexedDB 的数据域（workspace、instances、searchSettings、searchHistory）保留 `createSignal`，避免 store proxy 进入结构化克隆。`modalProps` 等需整体替换语义的对象字段也用 signal（`setStore(key, objectValue)` 是 merge 而非 replace）。
- 各模块统一对外暴露 `() => T` accessor + setter，controller 工厂与其单测**零改动**。
- 新增 `WorkbenchShellContext`：组合根装配出 shell bundle（`state` / `catalog` / `views` / `controllerRuntime` / `buildSettingsPanelProps` / `layoutContent`）并经 `WorkbenchShellProvider` 下发；`WorkbenchShellSurfaceHost` 改为 `useWorkbenchShell()` 消费，`createWorkbenchShellSurfaceProps` 直接读 shell bundle，消除 57 参数拍平。叶子组件（CommandPalette / SettingsHost / ToastHost 等）继续保持纯 props 驱动，不下沉 context 到 `@tabora/workbench-shell`。

净效果：`WorkbenchShellApp` 与 `WorkbenchShellState` 合计减少约 350 行，组合根降为「装配 + provide」。行为不变（393 单测、`pnpm build`、`pnpm check:architecture` 通过）。

### 1.8 workbench-app/src 按垂直切片重组

`packages/workbench-app/src` 原本 ~57 个非测试文件全部扁平排布，按技术层（state/controller/runtime/view/helper）横向散落。现已按功能域重组为 11 个子目录，move-only 保留文件名，行为零变更：

- `shell/`：组合根与跨切片装配——`WorkbenchShellApp.tsx`、`WorkbenchShellContext.tsx`、`WorkbenchShellState.ts`（聚合 6 store）、`WorkbenchShellControllerRuntime.ts`、`WorkbenchShellViewRuntime.ts`、`WorkbenchShellInstanceRenderer.tsx`、`createWorkbenchShellRuntimes.ts`（见 §1.9）。
- `runtime/`：bootstrap + kernel 运行时——`bootstrap.ts`、`WorkbenchRuntimeStore.ts`、`WorkbenchShellRuntimeState.ts`、`WorkbenchShellHostRuntime.ts`、`WorkbenchShellHostActions.ts`。
- `widget/ search/ workspace/ layout/ appearance/ surface/ command/ drag/`：各功能域的 store + state-fns + controller + view/surface 就近共置。
- `shared/`：跨切片基础设施——`shellConfig`、`shellHelpers`、`workbenchGrid`、`responsive`、`WorkbenchShellViewBridge`、`WorkbenchShellIcons`、`pluginStyleManager`、`shellController`、`WorkbenchShellUtils`。
- `index.ts` 保持单入口，re-export 路径更新为各子目录前缀；`tsconfig`/vitest 递归 glob 无需改动。
- 同步更新了 `scripts/lib/governance.mjs`、`regressionSummary.mjs`、`tooling/vitest/governance.test.ts` 中硬编码的 `WorkbenchShellApp.tsx` 路径至 `shell/WorkbenchShellApp.tsx`。

### 1.9 收薄 WorkbenchShellApp：controllerRuntime + layoutRuntime 提取

`WorkbenchShellApp` 原本在组件内联创建 4 个 runtime 对象。`workspaceController` 和 `hostRuntime` 因需要 Solid `onCleanup` / 异步 `initialize()` 仍留在组件内；`controllerRuntime` 和 `layoutRuntime` 不含响应式追踪依赖，已提取到 `shell/createWorkbenchShellRuntimes.ts`，入参为 `{ state, runtime, workspaceController, hostRuntime, layoutFallback, responsive, openSettings, showToast }`，组合根只调一次工厂。`WorkbenchShellApp` 从 ~330 行收薄至 ~200 行，装配逻辑与组件生命周期绑定清晰分离。

### 1.10 CommandPalette 改为受控 surface

`CommandPalette`（`@tabora/workbench-shell`）原本本地维护 `query` / `activeIdx` 两个 signal，无法复用 inline search 的宿主状态机。现已改为纯受控组件：

- `CommandPaletteProps` 新增必需属性：`query: string`、`activeIdx: number`、`onQueryChange: (q: string) => void`、`onActiveIdxChange: (i: number | (prev) => number) => void`。
- 面板关闭时（`isOpen` 变 false 或按 Escape/点击遮罩）通过 `createEffect` 自动重置宿主状态。
- `buildCommandPaletteProps`（`@tabora/workbench-app/search/WorkbenchShellSearchSurfaces`）传入 `inlineSearchQuery` / `inlineSearchActiveResultIndex` 作为受控 state，两个 surface 共用同一 search store 的 query/index 字段，行为分叉风险消除。

## 2. 下一轮可选方向

以下方向当前已充分或可暂缓，供未来架构 review 评估。

### 2.1 继续收薄 `WorkbenchShellApp`

状态分片（见 1.7）、切片重组（见 1.8）与 runtime 提取（见 1.9）已落地。`WorkbenchShellApp` 当前仍在组件内内联创建 `workspaceController` 和 `hostRuntime`——前者是纯计算工厂，后者因 `onCleanup(dispose)` 和 `void initialize()` 需要 Solid 生命周期上下文，短期内建议保留在组件内。若未来需要进一步拆分，可评估把 `hostRuntime.dispose` 和 `initialize` 的 Solid 绑定提取为一个微薄的 `useWorkbenchHostRuntime` hook。

**当前结论**：已充分收薄，暂无必要进一步拆分。

### 2.2 统一搜索 surface 的受控状态

CommandPalette 改为受控 surface 已落地（见 1.10）。inline search 与 command palette 现共用同一 `inlineSearchQuery` / `inlineSearchActiveResultIndex` 字段，行为分叉风险已消除。后续如需进一步统一，可评估把 command palette 的 providers / history 也走同一 search store 切片，而非每次调用时从 catalog 重新读取。

**当前结论**：关键分叉风险已消除，providers/history 从 catalog 读取符合当前职责划分，暂无必要强行统一。

### 2.3 保持协议层无 UI runtime 依赖

新增扩展点 contract 时，优先使用泛型、结构化数据和 host callback contract。只有具体 renderer 包或 shell 包可以绑定 Solid / JSX / DOM 类型。

## 3. 验证入口

本类架构治理变更至少运行：

```bash
pnpm check:architecture
pnpm test
pnpm check
pnpm build
```

如果触碰 layout / shell 渲染路径，还应追加 workbench-app、layout package 的定向测试；前端交互变更追加 playground 浏览器检查。
