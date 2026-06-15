# workbench 宿主与 `@tabora/ui` 边界收敛设计

## 背景

当前 `playground` 相关 UI 存在两个并行问题：

- 一部分宿主层文件仍然包含较多手写的低层 DOM 结构、样式类和交互细节
- `@tabora/ui` 已经承担了部分 primitive / 组合组件职责，但在 workbench 体系中的实际复用仍然偏少

这并不意味着所有手写 UI 都是不合理的。按照仓库当前边界：

- 宿主级容器应该继续留在 shell / host 层
- 可复用的低层 primitive、字段行、状态块和 action list 才适合进入 `@tabora/ui`

因此，这次任务的核心不是“把 workbench UI 全部搬到 `@tabora/ui`”，而是把当前混在宿主里的可复用低层单元识别出来，并按边界收敛。

## 目标

- 明确哪些 UI 单元必须留在宿主，哪些应下沉到 `@tabora/ui`
- 在不破坏现有宿主职责的前提下，提高 `@tabora/ui` 在 workbench 中的低层复用率
- 先解决重复最明显的 action/list/field/state block，而不是一开始就迁移整块宿主容器
- 为后续继续治理 `workbench-app` / `workbench-shell` 的 UI 重复建立一条可持续的迁移路径

## 非目标

- 不把 `WidgetCardShell`、settings host、fullscreen host、modal host、workbench grid / rail 迁移到 `@tabora/ui`
- 不把 `@tabora/ui` 变成承载 Tabora 宿主级业务布局的包
- 不在本轮顺手重做 design token、主题体系或 workbench 视觉风格
- 不把当前所有手写按钮、输入、列表一次性全部替换
- 不在一轮中同时做“边界治理 + overlay 行为重构 + 大规模视觉改版”

## 当前边界判断

### 应留在宿主的单元

以下单元强依赖 workspace 状态、插件运行时、overlay host 编排或 widget 容器语义，应继续留在宿主层：

- `packages/workbench-shell/src/WidgetCardShell.tsx`
- `packages/workbench-shell/src/settingsHost.tsx`
- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchPluginOverlays.tsx`
- workbench grid / rail / fullscreen / modal / toast host

这些组件可以消费 `@tabora/ui` 的 primitive 或组合组件，但不应整体下沉到 `@tabora/ui`。

### 应下沉到 `@tabora/ui` 的单元

以下单元具备跨宿主、跨插件的复用潜力，应收敛到 `@tabora/ui`：

- 通用 `ActionList` / `ActionRow`
- 通用 `MenuSection` / `MenuItem`
- 通用 `FieldRow` / `FieldLabel` / `FieldHint`
- 通用 `EmptyState` / `ErrorState` / `LoadingState`
- 对已有 dialog / drawer / popover / command list primitive 的统一封装

判断标准：

- 不依赖 workbench runtime
- 不要求知道 widget instance / workspace / plugin registry
- 具备多个调用点
- 可由 props 描述行为，而不是由宿主状态硬编码

## 现状问题

### 1. 宿主文件同时承担编排和低层 UI 实现

当前一些宿主文件不只是“拼装 overlay 和状态”，还直接定义了重复的按钮行、列表项、字段行和空状态结构。这会导致：

- 样式与 DOM 结构重复
- a11y 行为在多个文件中重复维护
- 后续修一个交互细节时需要多点同步

### 2. `@tabora/ui` 使用点过少

从当前代码扫描看，workbench 体系里真正直接使用 `@tabora/ui` 的点还比较少，主要集中在：

- `packages/workbench-shell/src/CommandPalette.tsx`
- `packages/official-plugins/src/search-command-bar.tsx`
- `plugins/official/widget-notes/src/notes-card.tsx`

而 `packages/workbench-app/src/` 当前基本没有直接消费 `@tabora/ui`。这意味着宿主侧的低层复用还没有真正建立起来。

### 3. 宿主级容器与低层 primitive 的边界容易被误解

如果只看“哪些地方还在手搓”，很容易把宿主级容器也误判成应该迁到 `@tabora/ui`。实际上，真正的问题不是“手搓了宿主壳”，而是“宿主壳里还包含了本可以抽出来的低层单元”。

## 方案

采用“宿主壳保留 + 低层单元渐进下沉”的方案。

### 核心原则

#### 1. 宿主继续负责编排

宿主层文件继续负责：

- runtime 状态编排
- overlay 打开/关闭
- widget / plugin / workspace 语义
- 焦点回退、快捷键、权限桥等宿主控制流

#### 2. `@tabora/ui` 负责低层复用

`@tabora/ui` 负责：

- 与宿主无关的通用 primitive
- 可组合的字段行、动作列表、状态块
- 已有 primitive 的行为一致性封装

#### 3. 迁移按“块”而不是按“页面”推进

不是一次迁移一个完整页面或 overlay，而是每次收敛一类低层块。例如：

- 先收敛 action list
- 再收敛 field row
- 再收敛 state block

这样可以降低回归风险，也更容易保持行为稳定。

## 第一批范围

第一批只处理重复最明显、边界最清楚、最不容易触碰宿主核心行为的单元。

### 第一批目标 1：Action list / row

收敛对象：

- 添加卡片弹窗中的可点击卡片列表项
- 右键菜单中的 action row
- 设置侧栏中的 section entry（如果结构足够接近）

交付形态：

- `@tabora/ui` 提供通用 action list / menu row 组合组件
- 宿主层只负责传入 icon、label、description、状态和回调

### 第一批目标 2：Field row

收敛对象：

- settings 中常见的 label + control + hint 结构
- 插件设置和 workspace 设置中相似的字段布局

交付形态：

- `@tabora/ui` 提供 `FieldRow`、`FieldLabel`、`FieldHint`
- control 仍由调用方决定，可以是 switch / select / button / custom content

### 第一批目标 3：状态块

收敛对象：

- empty state
- error state
- loading / missing view 占位

交付形态：

- `@tabora/ui` 提供最小状态块组合组件
- 宿主继续决定文案和恢复动作

## 第二批预留范围

以下内容暂不进入第一批，但可在第一批完成后继续推进：

- `CommandPalette` 内部的更多低层结构复用
- settings host 内部的 tab body 通用块收敛
- 插件管理与设置页的更多统一列表项
- overlay close button / panel header 等宿主通用块

## 方案对比

### 方案 A：边界收敛型（推荐）

做法：

- 宿主壳保留
- 低层复用块进入 `@tabora/ui`
- 渐进迁移消费方

优点：

- 完全符合当前架构边界
- 风险最低
- 可逐步验证收益

缺点：

- 宿主文件仍然存在
- 收敛速度不如“大搬家”快

### 方案 B：宿主 UI 大规模下沉

做法：

- 把添加卡片、上下文菜单、设置外壳等整体迁到 `@tabora/ui`

优点：

- 表面复用率提升快

缺点：

- 直接冲撞现有包边界
- 容易把 runtime 编排和 UI primitive 混在一起
- 后续维护成本高

### 方案 C：只做样式统一

做法：

- 仅抽 CSS / class / token，不调整组件结构

优点：

- 成本最低

缺点：

- 无法减少 DOM 与行为逻辑重复
- a11y 和交互治理收益有限

本次采用方案 A。

## 实施顺序

### 第 1 步：盘点重复块

在以下文件中确认第一批候选块：

- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- `packages/workbench-shell/src/settingsHost.tsx`
- `packages/workbench-shell/src/CommandPalette.tsx`

输出：

- 重复块清单
- 每个块的 props 边界
- 哪些行为必须留在宿主

### 第 2 步：在 `@tabora/ui` 中新增低层组合组件

优先新增：

- `ActionList`
- `ActionRow`
- `FieldRow`
- `FieldLabel`
- `FieldHint`
- `EmptyState` / `ErrorState` / `LoadingState`

要求：

- 不依赖 `@tabora/platform-kernel`
- 不依赖 `@tabora/storage`
- 不依赖 `@tabora/official-plugins`
- 保持 Solid + `@tabora/ui` 现有依赖边界

### 第 3 步：替换宿主消费方

按低风险顺序替换：

1. `WorkbenchContextMenuOverlay`
2. `WorkbenchAddWidgetModal`
3. `settingsHost` 中结构最简单的字段行
4. `CommandPalette` 中可安全替换的列表行

### 第 4 步：补测试与浏览器回归

验证：

- 单元测试覆盖新的 low-level component 行为
- 相邻宿主测试覆盖消费方没有回退
- playground 真实浏览器验证关键路径

## 测试与验证

代码落地时至少需要：

- `pnpm test`
- `pnpm check`

前端浏览器回归至少覆盖：

- `Ctrl+K` 打开命令面板
- 输入 `Focus` / `Dashboard` 命中布局命令
- 打开设置并切换分组
- 打开右键菜单并检查 action row 行为
- 打开添加卡片弹窗并检查列表可点击性

## 风险与缓解

### 风险 1：把宿主边界抽穿

表现：

- 新的 `@tabora/ui` 组件开始需要 widget instance、workspace state 或 plugin runtime

缓解：

- 任何需要 runtime 语义的逻辑都留在调用方
- `@tabora/ui` 只接收已经整理好的 props

### 风险 2：一次迁移范围过大

表现：

- 同一轮同时改 settings、command palette、context menu 和 modal 的结构

缓解：

- 严格按“低层块”推进
- 每轮只替换一到两类块

### 风险 3：低层复用过度抽象

表现：

- 新组件 props 过于泛化，反而比原始 JSX 更难读

缓解：

- 只抽已经在 2 个以上调用点重复出现的结构
- 不为“未来可能复用”预先设计复杂抽象

## 成功标准

完成第一批后，应满足：

- 宿主壳职责没有迁移到 `@tabora/ui`
- `@tabora/ui` 新增的 low-level component 已在至少 2 个 workbench 调用点复用
- 宿主文件中的重复 DOM 结构和重复 class 片段明显减少
- `Ctrl+K`、设置、右键菜单、添加卡片等关键交互无回退

## 范围判断

这次任务是单一方向的边界收敛，不需要拆成多个独立规格，但实现上应拆成多个小步骤逐步推进。第一批先做 action list、field row 和状态块；若完成后仍有明显收益，再为第二批单独立计划。
