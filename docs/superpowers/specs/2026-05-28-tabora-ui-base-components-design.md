# `@tabora/ui` 基础组件包落地设计

**日期：** 2026-05-28
**状态：** 设计已通过用户分段确认，等待 spec 终评
**关联文档：**

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 设计体系：`docs/product/tabora-design-system.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design.md`
- 项目入口：`AGENTS.md`、`docs/README.md`

## 1. 目标

把 PRD 已经定为 MVP 范围、当前仍是 P0 待建的 `@tabora/ui` 真正落地，并完成所有官方插件**内容区**控件的迁移：

- 新增 `packages/ui` workspace 包，依赖 `solid-js` + `@tabora/theme` + `@kobalte/core`（版本通过 `catalog:ui` 引用，对齐仓库依赖治理），使用 Kobalte 作为无样式 a11y 底层，外层套 Tabora 主题 token 样式。
- 交付 PRD 全量 MVP 控件清单：`Button`、`IconButton`、`Input`、`Textarea`、`Select`、`Checkbox`、`Switch`、`SegmentedControl`、`Tabs`、`Tooltip`、`Field`、`Badge`、`InlineError`、`Spinner`、`EmptyState`、`ListRow`、`CardSection`。
- 把 `official.widgets.productivity`、`official.search.command-bar`、`official.plugin-manager` 中的内容区控件全部迁移到 `@tabora/ui`。
- 同步 `docs/product/tabora-design-system.md`、`docs/product/tabora-official-plugins-design.md`、`docs/technical/tabora-plugin-workbench-technical-design.md`、`AGENTS.md` 中 `@tabora/ui` 的状态。

## 2. 范围

### 2.1 范围内 (IN)

- 新建 `packages/ui` 包及其测试、样式入口。
- 17 个控件全部交付。
- 迁移内容区控件：
  - `widgets-productivity.tsx`：`TodayFocusCard`、`QuickLinksCard`、`NotesCard`、`NotesModal`、`WeatherCard`。
  - `widget-todo.tsx`：`TodoCard`。
  - `search-command-bar.tsx`：`SearchCommandBar`。
  - `plugin-manager.tsx`：`PluginManagerCard`。
- 删除已被替换的原子控件级旧 CSS 类。
- 更新四份事实源文档。

### 2.2 范围外 (OUT)

- Settings host、`settings-panel` 协议落地。
- `background-provider` / `search-provider` 真正接管 playground 硬编码列表。
- `notes` / `todo` 数据按 `instanceId` 隔离迁到 plugin data。
- playground shell 自身宿主级控件迁移（toolbar、rail、size select、add-widget bar、modal close、widget header）——按 `AGENTS.md` 与技术方案 §2.7「宿主容器不变量」原则，宿主级容器不进 `@tabora/ui`。这些保留给后续 shell-host 任务统一处理；本轮只迁内容区。
- 视觉重设计、布局调整、新增插件能力。

## 3. 不变量

- `packages/ui` 只允许依赖 `solid-js`、`@tabora/theme`、`@kobalte/core`（`solid-js` 与 `@kobalte/core` 走 `catalog:ui`）。
- `packages/ui` **禁止**依赖 `@tabora/platform-kernel`、`@tabora/storage`、`@tabora/official-plugins`、`apps/playground`。
- `packages/ui` 不输出 `WidgetCard`、`Modal`、`FullscreenHost`、`SettingsHost`、`WorkbenchRail`、`WorkbenchGrid` 等宿主级容器。
- 控件颜色全部使用 theme token (`rgb(var(--color-*))`) 或本包定义的 `:root` 局部状态变量（如 `--tabora-danger`，因为 `@tabora/theme` 当前没有 danger token）；不在控件规则中直接出现 hex 字面量。spec 与 plan 验收阶段需 grep `packages/ui/src` 确认控件规则中无 `#[0-9a-fA-F]` 颜色字面量；`:root` 中的 rgb 三元组（如 `192 57 43`）不属于命中。
- 控件状态层（hover、focus-visible、disabled、loading、checked）通过 token + Kobalte data attrs 表达，不依赖颜色单一通道传达状态。
- 所有可点击控件必须键盘可聚焦，且具备可见 `:focus-visible` 样式。
- `IconButton`、纯图标按钮的 `aria-label` 在类型上必填。

## 4. 包结构

```txt
packages/ui/
  package.json
  tsconfig.json
  src/
    index.ts
    styles.css
    tokens.ts
    primitives/
      button.tsx
      input.tsx
      textarea.tsx
      select.tsx
      checkbox.tsx
      switch.tsx
      segmentedControl.tsx
      tabs.tsx
      tooltip.tsx
    composites/
      field.tsx
      badge.tsx
      inlineError.tsx
      spinner.tsx
      emptyState.tsx
      listRow.tsx
      cardSection.tsx
```

`button.tsx` 同时导出 `Button` 和 `IconButton`。

`tokens.ts` 把 `@tabora/theme` 的 token 名称（`color-page` / `color-surface` / `color-text` / `color-muted` / `color-accent` / `color-line` / `radius-card`）以 TS 常量形式 re-export，避免控件代码里出现拼写错误的 token 引用。

### 4.1 `package.json`

```json
{
  "name": "@tabora/ui",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles.css",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.js",
      "./styles.css": "./dist/styles.css",
      "./package.json": "./package.json"
    }
  },
  "scripts": {
    "build": "vp pack src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/theme": "workspace:*",
    "@kobalte/core": "catalog:ui",
    "solid-js": "catalog:ui"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*",
    "vite-plugin-solid": "catalog:build"
  }
}
```

跟 `@tabora/theme`、`@tabora/official-plugins` 等已有包一致：开发态走 src、`publishConfig` 走 dist 双 exports；`solid-js` 与 `@kobalte/core` 通过 `catalog:ui` 引用；因为存在 `.tsx`，devDeps 加入 `vite-plugin-solid`。

### 4.2 样式入口

- `packages/ui/src/styles.css` 集中所有控件 class，整体包在 `@layer tabora-ui {}` 内，避免与宿主样式抢权重。
- playground 在 `apps/playground/src/bootstrap.tsx` 顶部 `import "@tabora/ui/styles.css"` 一次。
- 状态层 selectors 优先使用：
  - `:hover`、`:focus-visible`
  - Kobalte data attrs：`[data-disabled]`、`[data-checked]`、`[data-highlighted]`、`[data-pressed]`
  - 自定义 attrs：`[data-loading]`

## 5. 控件 API 契约

控件遵循「smaller, well-bounded units」原则：每个控件只接受最小语义 props，不暴露内部 DOM 实现细节。本节列出代表性签名；plan 阶段拆任务时以本契约为锚。

### 5.1 `Button`

```ts
export type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger" // 默认 "secondary"
  size?: "sm" | "md" // 默认 "md"
  loading?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset" // 默认 "button"
  onClick?: (e: MouseEvent) => void
  "aria-label"?: string
  children: JSX.Element
}
```

### 5.2 `IconButton`

```ts
export type IconButtonProps = {
  variant?: "ghost" | "secondary" | "danger" // 默认 "ghost"
  size?: "sm" | "md"
  loading?: boolean
  disabled?: boolean
  "aria-label": string // 必填
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}
```

### 5.3 `Input`

```ts
export type InputProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  type?: "text" | "search" | "url" | "email"
  "aria-label"?: string
  id?: string
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
}
```

### 5.4 `Textarea`

```ts
export type TextareaProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  invalid?: boolean
  "aria-label"?: string
  id?: string
}
```

### 5.5 `Select<V>`（基于 `@kobalte/core/select`）

```ts
export type SelectOption<V extends string> = {
  value: V
  label: string
  disabled?: boolean
}
export type SelectProps<V extends string> = {
  value: V
  options: SelectOption<V>[]
  onChange: (value: V) => void
  placeholder?: JSX.Element
  size?: "sm" | "md"
  disabled?: boolean
  "aria-label"?: string
  id?: string
}
```

> 备注：`label` 类型为 `string` 而非 `JSX.Element`，因为 `@kobalte/core` 的 `optionTextValue` 需要 string 访问器（用于 a11y / 键入式过滤）。如未来需要图标等富内容标签，应另加 `leadingIcon?: JSX.Element` / `trailingIcon?: JSX.Element` 字段，而不是把 `label` 放宽。

Portal 挂载到 `document.body`，并通过 `z-index` 阶梯保证在 modal/fullscreen 内仍能展开。

### 5.6 `Checkbox`（基于 `@kobalte/core/checkbox`）

```ts
export type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element // 给出时整体作为 label 渲染
}
```

### 5.7 `Switch`（基于 `@kobalte/core/switch`）

```ts
export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element
}
```

### 5.8 `SegmentedControl<V>`（基于 `@kobalte/core/toggle-group`，单选）

```ts
export type SegmentedControlOption<V extends string> = {
  value: V
  label: JSX.Element
  disabled?: boolean
}
export type SegmentedControlProps<V extends string> = {
  value: V
  options: SegmentedControlOption<V>[]
  onChange: (value: V) => void
  size?: "sm" | "md"
  "aria-label": string // 必填，因为视觉上是一组按钮
}
```

### 5.9 `Tabs`（基于 `@kobalte/core/tabs`）

```ts
export type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: { value: string; label: JSX.Element; content: JSX.Element }[]
  "aria-label": string
}
```

### 5.10 `Tooltip`（基于 `@kobalte/core/tooltip`）

```ts
export type TooltipProps = {
  content: JSX.Element
  placement?: "top" | "bottom" | "left" | "right"
  children: JSX.Element // 触发器
}
```

### 5.11 `Field`

```ts
export type FieldProps = {
  label: JSX.Element
  helper?: JSX.Element
  error?: JSX.Element
  required?: boolean
  htmlFor?: string
  children: JSX.Element
}
```

### 5.12 `Badge`

```ts
export type BadgeProps = {
  variant?: "neutral" | "accent" | "success" | "warning" | "danger" // 默认 "neutral"
  children: JSX.Element
}
```

### 5.13 `InlineError`

```ts
export type InlineErrorProps = {
  children: JSX.Element
}
```

`role="alert"`，前置 warning 图标用纯 CSS 实现。

### 5.14 `Spinner`

```ts
export type SpinnerProps = {
  size?: "sm" | "md"
  "aria-label"?: string // 默认 "加载中"
}
```

### 5.15 `EmptyState`

```ts
export type EmptyStateProps = {
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element // 通常是 Button
}
```

### 5.16 `ListRow`

```ts
export type ListRowProps = {
  leading?: JSX.Element // 图标或 Avatar
  primary: JSX.Element
  secondary?: JSX.Element
  trailing?: JSX.Element // 操作按钮、Badge 等
  onClick?: () => void
}
```

`onClick` 给出时根 element 为 `button`，否则为 `div`。

### 5.17 `CardSection`

```ts
export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean // 默认 true
  children: JSX.Element
}
```

仅"内容分区"，不是 widget 卡片外壳——后者属于宿主级容器。

## 6. 测试策略

- 每个 primitive / composite 一个 `*.test.tsx`，沿用仓库既有单测工具链：Vitest + happy-dom（根 `vite.config.ts` 已配置 `environment: "happy-dom"`），DOM 直操，参考 `packages/theme/src/applyThemeTokens.test.ts` 的范式；组件渲染使用 `solid-js/web` 的 `render`，断言走原生 DOM API。
- 不引入 `@solidjs/testing-library` 等新测试库，避免在本轮变更里再加运行时不确定性。
- 至少覆盖：
  - 默认渲染（DOM 结构 + 关键 a11y 属性）。
  - 受控更新（`onChange` / `onInput` 触发）。
  - `disabled` 不响应交互。
  - 必要的 `aria-*` / `role` 属性存在。
- Kobalte 提供的内部行为（focus trap、键盘导航、portal 定位等）不重复测试，只测 Tabora 的封装契约。
- happy-dom 对 portal、`getBoundingClientRect`、focus 行为支持有限：涉及这些能力的控件（`Tooltip` 弹层定位、`Select` 下拉项 portal、`Tabs` 焦点切换）单测只覆盖契约层（事件触发、`onChange` 回调、ARIA 属性），交互层视觉验证留给 §8 的浏览器关键路径与既有 e2e。

## 7. 迁移路线（每阶段独立可绿）

每阶段都需 `pnpm test` + `pnpm check` + `pnpm --filter @tabora/playground build` 通过。

**阶段 A：包脚手架与最小控件**
新建 `packages/ui` 包，落地 `Button` / `IconButton` / `Input` / `Textarea` / `Field`。playground `bootstrap.tsx` 引入 `@tabora/ui/styles.css`。

**阶段 B：表单类控件**
落地 `Select` / `Checkbox` / `Switch` / `SegmentedControl` / `Tabs` / `Tooltip`。

**阶段 C：辅助控件**
落地 `Badge` / `InlineError` / `Spinner` / `EmptyState` / `ListRow` / `CardSection`。

**阶段 D：迁移 widgets-productivity 与 widget-todo**

- `TodayFocusCard` → `Field` + `Input` + `Checkbox`。
- `QuickLinksCard` → `ListRow` 排布两个外链；保留 `<a>` 语义，不改成 button。
- `NotesCard` / `NotesModal` → `Textarea`。
- `TodoCard` → `Field` + `Input` + `IconButton`(+) + `ListRow` + `Checkbox` + `IconButton`(×) + `EmptyState`（空列表态）。
- `WeatherCard` → 加 `Badge`（demo 标记）+ `CardSection`，不动业务逻辑。

**阶段 E：迁移 search-command-bar**

- 搜索源 `<select>` → `Select`。
- 输入框 → `Input`。
- 隐式提交按钮升级为显式 `Button`（`type="submit"`）。
- 快捷标签按钮 → `Button`（`variant="ghost"`、`size="sm"`）。
- `.search-bar` / `.search-wrapper` 布局类保留。

**阶段 F：迁移 plugin-manager**

- 根容器 → `CardSection`。
- 每行 → `ListRow`（leading=空、primary=插件名、secondary=ID + 贡献摘要、trailing=`Badge`）。
- 启用状态 → `Badge`（已启用 `accent`、已禁用 `neutral`）。

**阶段 G：清理与文档同步**

- 删除已被替换的原子控件 CSS 类：`todo-input`、`todo-add-btn`、`todo-del-btn`、`todo-label`、`todo-text`、`notes-textarea`、`notes-modal-textarea`、`today-focus-input`、`today-focus-label`、`today-focus-done`、`search-provider`、`search-input`、`suggestion-tag`、`plugin-name`、`plugin-id`、`plugin-extensions`、`plugin-status`。保留布局/容器类（`.workbench-grid`、`.todo-widget`、`.notes-modal`、`.search-wrapper`、`.search-bar`、`.search-suggestions`、`.plugin-manager`、`.plugin-list`、`.plugin-item`、`.plugin-info`、`.today-focus-widget`、`.quick-links`）。
- 删除前对每个 class 在仓库 grep 确认无引用。
- 更新事实源：
  - `docs/product/tabora-design-system.md`：`@tabora/ui` 状态从「P0 待建」改为「MVP 已交付」，列出 17 个控件。
  - `docs/technical/tabora-plugin-workbench-technical-design.md`：相关章节状态同步，记录依赖 `@kobalte/core`。
  - `docs/product/tabora-official-plugins-design.md`：矩阵备注列写明"已使用 `@tabora/ui` 控件"。
  - `AGENTS.md`：把 `packages/ui` 从「P0 规划中」挪到「工程结构」。

**阶段 H：新鲜验证**

- `pnpm test`、`pnpm check`、`pnpm build` 全部绿。
- `pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort` 启动正常。
- 浏览器手动跑 §8 关键路径。
- e2e：`apps/playground/src/workbenchDashboard.e2e.test.tsx` 关键路径无回退。

## 8. 浏览器关键路径

明亮和暗色主题各跑一次：

- 默认首屏渲染：rail + topbar + 主网格四张默认卡片可见。
- 添加 widget：从 add-widget 栏添加，新卡片立即出现且尺寸正确。
- 调整尺寸：size select 仍只展示 `supportedSizes`（playground 自己的 `<select>`，本轮不迁，保留原状）。
- 拖拽排序：跨卡片拖拽，刷新后顺序保留。
- 打开便签 modal：`Textarea` 在 modal 中可编辑、保存、关闭。
- 切换主题：所有 `@tabora/ui` 控件颜色随 token 切换，无遗漏 hardcoded 色。
- 切换背景：背景层切换不影响卡片可读性。
- 提交搜索：`Select` + `Input` + 快捷标签按钮均工作，外部打开走权限桥。
- 键盘可达：Tab 顺序覆盖所有 `@tabora/ui` 控件，`focus-visible` 在两套主题下都清晰。

## 9. 风险与回退

| 风险                                         | 影响                              | 应对                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kobalte 引入新运行时依赖                     | 包体增大、与现有 Solid 版本不兼容 | 阶段 A 先引入 1-2 个 Kobalte 控件验证版本兼容；不兼容时回退用纯 Solid 自实现，影响范围限于 `Select` / `Tabs` / `Tooltip` / `Switch` / `Checkbox` / `SegmentedControl` |
| `focus-visible` / 状态层在浅色主题下对比不足 | a11y 不达标                       | spec 中明确每个控件的 hover/focus/disabled token；阶段 H 浏览器跑明暗双主题路径                                                                                       |
| `@tabora/ui` 样式与 `app.css` 旧类抢权重     | 视觉错乱                          | 全部样式收在 `@layer tabora-ui` 中；阶段 G 集中清旧 CSS 类，删之前 grep 确认无引用                                                                                    |
| 阶段 D-F 大批量替换 widget 引入回退          | 默认工作台不可用                  | 每个插件迁移成对应一次 `pnpm --filter @tabora/playground build` + e2e 通过；任何失败回到上一步绿状态再继续                                                            |
| Kobalte portal 容器与 modal-overlay 层级冲突 | popover 被遮挡                    | portal 挂 `body`；spec §5.5 规定与 `z-index` 阶梯（modal/fullscreen）对齐；测试场景包含"在 modal 内打开 Select"                                                       |
| 视觉看起来"没动"                             | 用户难判断本轮价值                | 不强求视觉差异；阶段 H 在文档里附迁移前后说明，重点在 a11y / 状态层 / 可重用 / 解耦                                                                                   |

## 10. 验收标准

**产品验收**

- 默认工作台首屏视觉与本轮前在同一主题下基本等同（不要求像素一致，卡片尺寸 / 布局 / 文字层级稳定）。
- 所有 button、input、checkbox、switch、select、segmented control 键盘可聚焦，`focus-visible` 清晰。
- 表单输入有 `aria-label` 或可见 label。
- 明亮和暗色主题下文本与控件状态都清晰可读。

**工程验收**

- `pnpm check`、`pnpm test`、`pnpm build` 全部绿。
- `pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort` 启动正常。
- `apps/playground/src/workbenchDashboard.e2e.test.tsx` 关键路径通过。

**边界验收**

- `packages/ui/package.json` 依赖只有 `@tabora/theme`（workspace）+ `@kobalte/core`（`catalog:ui`）+ `solid-js`（`catalog:ui`）；devDeps 含 `vite-plugin-solid`（`catalog:build`）+ `@tabora/tsconfig`。
- `packages/ui/src/**` 不出现 `WidgetCard` / `Modal` / `FullscreenHost` / `SettingsHost` / `WorkbenchRail` / `WorkbenchGrid` 等宿主级容器名。
- `grep -rE "#[0-9a-fA-F]{3,8}" packages/ui/src` 控件规则内无颜色字面量命中（`:root` 中的 rgb 三元组形如 `192 57 43` 是 token 风格、不是 hex；`--tabora-danger` 单点定义允许）。

**文档验收**

- `docs/product/tabora-design-system.md`、`docs/technical/tabora-plugin-workbench-technical-design.md`、`docs/product/tabora-official-plugins-design.md`、`AGENTS.md` 中 `@tabora/ui` 状态全部从"P0 待建"挪到"MVP 已交付"。
- 本 spec 文件位于 `docs/superpowers/specs/2026-05-28-tabora-ui-base-components-design.md` 并入仓库。

## 11. 后续阶段（不在本 spec 范围内）

- Settings host + `settings-panel` 协议。
- `background-provider` / `search-provider` 接管 playground 硬编码列表。
- `notes` / `todo` 数据按 `instanceId` 隔离迁到 plugin data。
- shell-host 迁移：playground 自身的 toolbar / rail / size select / add-widget bar / modal close / widget header 控件统一收口。
