# WorkbenchShellChrome.tsx 拆分设计

## 背景

`packages/workbench-app/src/surface/WorkbenchShellChrome.tsx` 当前同时承载了 5 个独立导出组件：

- `WorkbenchAddWidgetModal`
- `WorkbenchSettingsAboutContent`
- `SafeWorkbenchLayout`
- `WorkbenchExpandOverlay`
- `WorkbenchContextMenuOverlay`

这 5 个组件都属于宿主壳（chrome / overlays）层，但职责并不相同：

- `WorkbenchAddWidgetModal` 是添加卡片弹窗
- `WorkbenchSettingsAboutContent` 是宿主关于页内容
- `SafeWorkbenchLayout` 是安全回退布局
- `WorkbenchExpandOverlay` 是展开态 overlay
- `WorkbenchContextMenuOverlay` 是右键菜单 overlay

当前文件的问题不在单个函数过于复杂，而在于多个独立单元被捆在同一个出口文件中。继续迭代时，开发者需要频繁在同一文件里来回切换不同宿主能力，降低了可读性，也让后续细分测试和导出边界变得含混。

## 目标

- 将 `WorkbenchShellChrome.tsx` 从“多组件实现文件”收敛为稳定入口
- 按导出组件维度拆分实现文件，使文件边界和组件职责一致
- 保持现有外部 import 路径与运行行为不变
- 为后续继续治理 `surface` 目录建立更清晰的组件出口结构
- 在不扩大范围的前提下，为相邻测试补足稳定性保护

## 非目标

- 不修改宿主 UI 结构、视觉样式、文案 key 或交互语义
- 不把这些组件下沉到 `@tabora/workbench-shell`
- 不借这次拆分继续重构 `SafeWorkbenchLayout` 内部 widget 渲染逻辑
- 不额外调整 `WorkbenchPluginOverlays.tsx`、`WorkbenchShellSurfaceHost.tsx` 的行为
- 不顺手做目录级大重组，例如新建 `surface/chrome/` 子目录

## 现状问题

### 1. 一个文件承载多个并列出口

当前 [WorkbenchShellChrome.tsx](file:///home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.tsx) 中的 5 个导出彼此并列，没有明显的主从关系。阅读时需要先判断“我关心的是哪个组件”，再跳过无关实现。

### 2. 类型定义与组件实现耦合在一起

文件顶部的 `SolidView`、`AvailableWidget`、`WidgetContextSection`、`ExpandState`、`SafeLayoutModel` 等类型同时服务多个组件。随着文件继续增长，这类共享类型容易变成“所有人都从这里拿一点”的隐性耦合点。

### 3. 稳定出口与实现细节没有分层

当前外部模块直接从 `WorkbenchShellChrome.tsx` 消费组件，这没有问题；但同一个文件既充当稳定出口，又充当全部组件实现容器，不利于后续继续分治。

## 方案

采用“保留稳定入口 + 按导出组件一一拆分实现 + 共享类型单独收口”的方案。

### 入口保持不变

保留：

- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`

但将其职责收敛为：

- 统一 re-export 宿主壳相关组件
- 不再承载全部具体实现

这样可以保证现有 import 路径不变，不需要同步改动全仓调用方。

### 文件边界

新增以下实现文件：

- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- `packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx`
- `packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx`
- `packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts`

其中：

- `WorkbenchAddWidgetModal.tsx` 只承载添加卡片弹窗实现
- `WorkbenchSettingsAboutContent.tsx` 只承载宿主关于页内容实现
- `SafeWorkbenchLayout.tsx` 只承载安全回退布局实现
- `WorkbenchExpandOverlay.tsx` 只承载展开 overlay 实现
- `WorkbenchContextMenuOverlay.tsx` 只承载右键菜单 overlay 实现
- `WorkbenchShellChrome.types.ts` 承载多个组件共享的局部类型

### 类型收口策略

共享类型放入 `WorkbenchShellChrome.types.ts`，只收口当前这批组件明确共用的局部类型，例如：

- `SolidView`
- `AvailableWidget`
- `WidgetContextSection`
- `ExpandState`
- `SafeLayoutModel`

边界要求：

- 仅收口这批宿主壳组件共用的类型
- 不把与其他 `surface` 模块无关的实现细节继续扩散
- 如果某个类型仅被单一组件使用，就直接留在对应组件文件，不强行上提

### 组件归属说明

#### `SafeWorkbenchLayout`

该组件虽然体量最大，但本轮只做“整体搬迁”，不继续拆其内部 widget 渲染子块。原因是：

- 当前主要问题是出口过于集中，不是内部逻辑已经失控
- 继续深入拆分会把本轮从“宿主壳边界治理”扩大为“布局渲染逻辑重构”
- 先把文件边界理顺，再判断是否需要第二轮细拆更稳妥

#### `WorkbenchExpandOverlay`

仍保留在 `workbench-app/surface` 层，不下沉到 `@tabora/workbench-shell`。因为它依赖：

- `ShellTranslation`
- 宿主级 copy 组织
- 宿主对 `PluginViewBoundary` 和插件 props 的编排方式

它是宿主 overlay 组合层，而不是纯 UI primitive。

#### `WorkbenchContextMenuOverlay`

同样保留在 `workbench-app/surface` 层。虽然它使用的是 `.ctx-menu-*` 样式，但其内容由宿主根据 widget 上下文拼装，仍属于宿主编排能力。

#### `WorkbenchSettingsAboutContent`

不迁移到 `official-plugins`。它展示的是宿主关于信息，而不是插件设置面板本体，应该继续归属于 `workbench-app`。

## 方案对比

### 方案 A：按导出组件一一拆分（推荐）

优点：

- 与现有 5 个导出完全对齐
- 风险最低，不改行为只改物理边界
- 后续继续拆宿主壳时最容易定位文件

缺点：

- 文件数量会增加
- 需要引入一个小型共享类型文件

### 方案 B：只拆最大块

例如仅拆 `SafeWorkbenchLayout`，其余组件继续保留在原文件。

优点：

- 改动最少

缺点：

- 稳定出口和多组件实现仍然混在一起
- 治理收益有限

### 方案 C：按目录整体重组

例如新建 `surface/chrome/` 或 `surface/overlays/` 目录。

优点：

- 长期结构更干净

缺点：

- 改动面明显扩大
- 需要同步调整更多相对路径和测试引用
- 不适合当前“逐步收口”的节奏

本次采用方案 A。

## 实施约束

- 原有导出名必须保持不变
- 原有 JSX 结构和 class 名保持不变
- 原有 `ShellTranslation` copy key 保持不变
- 原有插件视图渲染、错误边界和事件回调行为保持不变
- 原有宿主调用点优先不改路径，只通过 `WorkbenchShellChrome.tsx` 继续消费

## 测试与验证

最小验证集合：

- `pnpm --filter @tabora/workbench-app test`
- `pnpm check`
- IDE diagnostics 检查新建文件和入口文件

测试策略：

- 优先复用现有相邻测试，验证拆分后行为未变
- 如果当前没有覆盖“稳定入口导出”这一层，则补一个轻量测试，确保 `WorkbenchShellChrome.tsx` 仍能正确暴露这些组件
- 避免新增只是在重复 JSX 细节的低价值测试

## 风险与缓解

### 风险 1：类型移动后产生循环依赖

缓解方式：

- 共享类型文件只放纯类型，不引入运行时依赖
- 新组件文件只从类型文件单向引用

### 风险 2：re-export 入口和实现文件不一致

缓解方式：

- 将 `WorkbenchShellChrome.tsx` 简化为显式导出列表
- 用轻量测试或类型检查保护导出稳定性

### 风险 3：拆分过程中误改 JSX 结构

缓解方式：

- 本轮只做搬运，不顺手改名、不调整 DOM 结构
- 依赖现有测试和 `pnpm check` 做回归确认

## 预期结果

拆分完成后，`surface` 目录中的宿主壳组件会从“一个大文件集中承载”变为“稳定入口 + 多个单一职责实现文件”的结构：

- 入口职责清晰
- 组件边界更明确
- 后续 review 和继续拆分的成本更低
- 行为与调用路径保持稳定
