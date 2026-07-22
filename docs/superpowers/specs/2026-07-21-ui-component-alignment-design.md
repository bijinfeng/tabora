# `@tabora/ui` 组件视觉对齐设计

日期：2026-07-21

## 目标

将 `packages/ui/src/styled/` 内已经实现、且在 `docs/design/component-spec.html` 中有对应规范的基础组件，对齐到 Tabora 当前设计体系。重点是组件视觉、状态、尺寸、动效和 token 使用的一致性，而不是引入新的基础组件或改变业务交互。

## 事实源与范围

判定优先级固定为：用户当前指令、`DESIGN.md`、`docs/design/component-spec.html`、当前实现。

`DESIGN.md` 定义视觉、可访问性和动效的约束；`component-spec.html` 仅补充组件的尺寸、间距、状态和内容层级。两者冲突时实现以 `DESIGN.md` 为准。例如，原型中的 Button 按下缩放不纳入实现，因为当前规范禁止会改变外部尺寸的交互变换。

范围包含所有已实现且有设计稿对应项的 styled 组件。设计稿未覆盖的组件，例如 `DatePicker`，不在本轮重设计范围内。组件的业务语义、Kobalte 可访问性行为和公开业务 API 保持不变。现有多 slot `*Class` / `*Style` API 与 `DESIGN.md` 的长期收敛要求存在差异，但不在本轮视觉对齐中破坏性移除。

## 实施结构

按共享视觉行为分四组实施，每组在完成 token、状态和尺寸的收敛后立即验证。

1. 表单与选择：Input、Textarea、Select、Combobox、TagInput、Field、FieldRow。统一 28px / 36px 控件高度、边框、焦点环、无效和禁用态、占位文本层级以及多选标签密度。
2. 动作与导航：Button、IconButton、Link、Tabs、SegmentedControl、ToggleGroup、Pagination、Breadcrumb、Kbd。统一圆角、尺寸、选中态、焦点态和禁用态；Button 不使用按下缩放。
3. 菜单与浮层：DropdownMenu、ContextMenu、Menubar、Popover、HoverCard、Tooltip、Dialog、Drawer、Toast、CommandPalette。统一 `surface`、`line`、浮层阴影、危险项和进入/退出动效，不引入触发布局跳动的属性动画。
4. 状态与内容组织：Checkbox、Switch、RadioGroup、Badge、Callout、InlineError、Progress、Spinner、Skeleton、Chip、Accordion、Collapsible、Slider、Table、TreeView、Steps、Timeline、EmptyState、ListRow、CardSection、CopyButton、Truncate、VisuallyHidden、ScrollArea、Divider。统一语义色、信息密度、选中反馈、加载占位和错误提示，确保状态变化不改变组件外部尺寸。

组件视觉层通过 `@tabora/theme/tokens.stylex` 使用 typed semantic token。普通颜色、圆角、阴影、字体和时长不直接消费 CSS variable；允许保留布局尺寸字面量，以及为透明度和 `color-mix` 组合的受控语义变量片段。不得引入固定色值或自定义时长。

## 验证

- 扩展 `packages/ui/src/styled/designContract.test.ts`，保护 typed token、动效约束、关键状态和 Select slot 转发。
- 保持 primitive 与 Kobalte 的键盘和可访问性行为，不在 styled 层重写逻辑。
- 运行 `pnpm --filter @tabora/ui test`、`pnpm test`、`pnpm check` 和 `pnpm build`。
- 启动 playground，在亮色和暗色主题中检查 Button、表单、菜单与浮层、Tabs、树和列表的代表路径，确认焦点可见、无横向溢出且状态切换无布局跳动。

## 风险处理

原型与 `DESIGN.md` 的冲突作为预览资产历史差异记录，不通过放宽实现或更改事实源来迁就。出现行为回归时，优先修复 styled 包装层，不修改 primitive 的语义契约；只有原始 primitive 无法表达设计要求时，才以独立设计讨论处理 API 变更。
