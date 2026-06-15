# Tabora UI Kobalte 基础组件迁移计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `@tabora/ui` 中仍然手写 a11y/交互行为的基础组件迁移为 `@kobalte/core` primitives 实现，减少手搓交互与可访问性风险，同时尽量保持现有对外 API 不变。

**架构：** `packages/ui/src/primitives/*` 作为行为层，优先直接基于 `@kobalte/core/*`；`packages/ui/src/styled/*` 只负责引入 CSS 并做轻封装。迁移时优先保持 styled 层对外 API 与 class 体系稳定，通过 CSS 适配 Kobalte 的 `data-*` 状态属性。

**技术栈：** SolidJS + TypeScript + `@kobalte/core` + Tailwind CSS v4（仅作为项目依赖，不在 primitives 内引入）

---

## 范围（本批次：基础组件）

- [ ] VisuallyHidden → `@kobalte/core/visually-hidden`
- [ ] ScrollArea → `@kobalte/core/scroll-area`
- [ ] ToggleGroup（多选）→ `@kobalte/core/toggle-group`（`multiple` 模式）
- [ ] RadioGroup → `@kobalte/core/radio-group`
- [ ] Accordion → `@kobalte/core/accordion`
- [ ] Collapsible → `@kobalte/core/collapsible`
- [ ] HoverCard → `@kobalte/core/hover-card`

（Combobox/TreeView/CommandPalette 归入“复杂组件”下一批次）

---

## 任务 1：VisuallyHidden 迁移

**修改文件：**

- `packages/ui/src/primitives/visuallyHidden/visuallyHidden.tsx`

- [ ] 将手写 `sr-only` 样式替换为 `@kobalte/core/visually-hidden`
- [ ] 保持对外 props 兼容（`children` 仍允许传 string）

---

## 任务 2：RadioGroup 迁移

**修改文件：**

- `packages/ui/src/primitives/radioGroup/radioGroup.tsx`
- `packages/ui/src/styled/radioGroup/styles.css`

- [ ] 用 `@kobalte/core/radio-group` 替换手写 `fieldset/input` 组合
- [ ] 保留现有 `options` API（不要求业务侧改成 Kobalte anatomy）
- [ ] CSS 从 “手写 data-checked/data-disabled” 适配到 Kobalte 的状态属性（保留 class 名）

---

## 任务 3：Accordion 迁移

**修改文件：**

- `packages/ui/src/primitives/accordion/accordion.tsx`
- `packages/ui/src/styled/accordion/styles.css`

- [ ] 用 `@kobalte/core/accordion` 替换内部 `createSignal` 状态
- [ ] 保留现有 `items` API 与 `multiple` 行为
- [ ] CSS 调整箭头展开态选择器为 `Trigger[data-expanded]`

---

## 任务 4：Collapsible 迁移

**修改文件：**

- `packages/ui/src/primitives/collapsible/collapsible.tsx`
- `packages/ui/src/styled/collapsible/styles.css`

- [ ] 用 `@kobalte/core/collapsible` 替换内部 `createSignal` 状态
- [ ] 保留现有 `open` 作为初始值语义（映射到 `defaultOpen`）
- [ ] CSS 调整箭头展开态选择器为 `Trigger[data-expanded]`

---

## 任务 5：ToggleGroup（多选）迁移

**修改文件：**

- `packages/ui/src/primitives/toggleGroup/toggleGroup.tsx`
- `packages/ui/src/styled/toggleGroup/styles.css`

- [ ] 用 `@kobalte/core/toggle-group` + `multiple` 替换手写 `aria-pressed` 与数组 toggle
- [ ] `onChange` 统一回传 `string[]`
- [ ] CSS 从 `data-selected` 迁移到 `data-pressed`（可保留兼容选择器）

---

## 任务 6：ScrollArea 迁移

**修改文件：**

- `packages/ui/src/primitives/scrollArea/scrollArea.tsx`
- `packages/ui/src/styled/scrollArea/styles.css`

- [ ] 用 `@kobalte/core/scroll-area` 替换单纯 `div overflow:auto`
- [ ] 保留现有 props（`children/class/style/aria-label`）
- [ ] CSS 适配 Kobalte Viewport/Scrollbar/Thumb 结构，保持 6px scrollbar 的视觉

---

## 任务 7：HoverCard 迁移

**修改文件：**

- `packages/ui/src/primitives/hoverCard/hoverCard.tsx`
- `packages/ui/src/styled/hoverCard/styles.css`

- [ ] 用 `@kobalte/core/hover-card` 替换 CSS hover 展示方案（获得延迟、dismiss、定位、portal）
- [ ] 保持现有 props（`trigger/title/description/media/meta`）
- [ ] CSS 从 `.tbr-hover-card:hover ...` 调整到 `Content[data-expanded]` 动画

---

## 验证

- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] playground 目测：accordion/collapsible 展开收起、hovercard 显示/隐藏、scrollarea 滚动与滚动条、radiogroup 键盘操作、toggleGroup 方向键与多选
