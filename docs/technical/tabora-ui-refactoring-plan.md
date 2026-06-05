# @tabora/ui 组件库重构方案

版本：V1.0

日期：2026-05-30

状态：历史方案参考；当前 `@tabora/ui` 事实源以 `DESIGN.md`、设计实现映射和实际代码为准

> Agent 注意：本文用于追溯 UI 组件库重构讨论，不作为当前实施计划。修改 UI 时先读 `docs/README.md`、`DESIGN.md` 和 `docs/product/tabora-design-system.md`。

关联文档：

- V2 设计事实源：`DESIGN.md`
- V2 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`

## 1. 现状诊断

### 1.1 当前架构

```
packages/ui/src/
  primitives/       # 9 个基元组件（Button, Input, Select, Checkbox, Switch, Tabs, Tooltip, SegmentedControl, Textarea）
  composites/       # 7 个复合组件（Field, Badge, EmptyState, ListRow, CardSection, InlineError, Spinner）
  styles.css        # 610 行，所有 16 个组件的样式在一个文件
  tokens.ts         # Token 常量定义（11 行，未被组件引用）
  index.ts          # 统一导出全部 16 个组件
```

### 1.2 核心问题

| 问题                 | 详情                                                                                     | 影响                                                       |
| -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **单文件 CSS**       | `styles.css`（610 行）包含所有组件样式。导入 Button 也会加载 Tooltip 的 CSS              | 不可按需加载，无 tree-shaking                              |
| **全局类名**         | `tabora-button`、`tabora-input` 等全局命名空间                                           | 无作用域隔离，可能与其他库冲突                             |
| **样式和逻辑分离**   | 组件逻辑在 `.tsx`，样式在 `styles.css`                                                   | 改一个组件需跨两个文件，心智负担高                         |
| **导出粒度粗**       | `index.ts` 导出全部组件，消费者必须全量导入                                              | 虽然支持 tree-shaking，但语义不直观                        |
| **封装过度**         | `<Select>` 把 Kobalte 的 compound API（`.Trigger`/`.Content`/`.Item`）包成一个不透明组件 | 丢失了 Radix 式的组合灵活性，消费者无法自定义 Trigger 样式 |
| **tokens.ts 未使用** | 组件不引用 `TOKENS` 常量，只在 CSS 中硬编码                                              | 设计 Token 和代码实现脱节                                  |
| **无变体工具**       | 每个 variant 手写 `data-variant` CSS 选择器                                              | 变体逻辑和样式重复，无法工具化生成                         |

### 1.3 当前组件与 Kobalte 的关系

| 组件             | 依赖 Kobalte                  | 封装方式                                                   |
| ---------------- | ----------------------------- | ---------------------------------------------------------- |
| Select           | ✅ @kobalte/core/select       | 过度封装：把 Trigger/Content/Item 等 compound 组件完全隐藏 |
| Checkbox         | ✅ @kobalte/core/checkbox     | 适度封装                                                   |
| Switch           | ✅ @kobalte/core/switch       | 适度封装                                                   |
| Tabs             | ✅ @kobalte/core/tabs         | 适度封装                                                   |
| Tooltip          | ✅ @kobalte/core/tooltip      | 适度封装                                                   |
| SegmentedControl | ✅ @kobalte/core/toggle-group | 适度封装                                                   |
| Button           | ❌ 原生 button                | —                                                          |
| Input            | ❌ 原生 input                 | —                                                          |
| Textarea         | ❌ 原生 textarea              | —                                                          |
| 全部 composites  | ❌ 纯 DOM + Solid             | —                                                          |

## 2. 参考体系

### 2.1 shadcn/ui 模式

shadcn/ui 的核心思想：**组件源码在项目内，完全可控**。

关键特征：

- 每个组件是独立的 `.tsx` 文件，样式和逻辑在一起
- 基于 Radix 的无样式基元，样式层用 Tailwind CSS
- 消费者复制源码到自己的项目，可以自由修改
- 不是 npm 包，不锁版本，不隐藏实现

可借鉴的：

- **样式共置**：每个组件有自己的样式（CSS 文件或 Tailwind class）
- **细粒度导入**：`import { Button } from "@/components/ui/button"`
- **变体 API**：使用 `class-variance-authority`（cva）生成变体类名
- **消费者可控**：不是黑盒，源码在眼前

不适合 Tabora 的：

- shadcn/ui 是"复制粘贴"模型，不适合 npm 发布
- Tabora 需要作为一个 workspace 包供内部和未来第三方使用

### 2.2 Radix UI 模式

Radix 的核心思想：**无样式行为基元 + 样式层完全独立**。

关键特征：

- 每个组件是 `Compound Component`（如 `Dialog.Trigger`、`Dialog.Content`）
- 完全无样式，只提供 ARIA 属性、键盘导航、焦点管理
- 状态通过 `data-state`、`data-orientation` 等属性暴露
- 消费者完全控制渲染和样式

可借鉴的：

- **Compound Component 模式**：暴露内部子组件，让消费者组合
- **无样式基元**：把 Kobalte 的底层暴露出来，样式层在 Tabora 侧
- **状态属性**：`data-state="open"`、`data-disabled` 等，方便 CSS 选择

### 2.3 Park UI / Ark UI 模式

Ark UI（由 Chakra 团队开发）的核心思想：**状态机驱动的多框架组件**。

关键特征：

- 使用 Zag.js 状态机管理复杂交互
- 跨框架（React/Solid/Vue）一致性
- 组件拆为 `useXxx` hook + 渲染层

可借鉴的：

- **状态机和 UI 分离**：Kobalte 已经做了这一步（基于 Zag.js）
- **Hook 先行**：`createSelect`、`createDialog` 等 hook 可单独导出

## 3. 目标架构

### 3.1 目录结构

```
packages/ui/src/
  primitives/               # Kobalte 驱动的无样式行为基元（headless）
    button/
      index.ts              # export { Button, IconButton }
      button.tsx            # 无样式 button 组件
      styles.css            # 最小重置样式（cursor, user-select 等）
    select/
      index.ts              # export { Select } = { Root, Trigger, Content, Item, ... }
      select.tsx            # 暴露 Kobalte 的 compound API
      styles.css            # 列表项基础样式
    checkbox/
      index.ts
      checkbox.tsx
      styles.css
    switch/
    tabs/
    tooltip/
    input/
    textarea/
    segmentedControl/

  styled/                   # 带 Tabora 设计语言的样式版本
    button/
      index.ts              # export { Button } from "./button.styled"
      button.styled.tsx     # import { Button as Primitive } + styles
      styles.css            # 完整 Tabora 按钮样式
    select/
    input/
    ...                     # 每个组件独立文件夹

  composites/               # 由 primitives/styled 组合而成
    field/
      index.ts
      field.tsx
      styles.css
    listRow/
    badge/
    spinner/
    emptyState/
    cardSection/
    inlineError/

  tokens/
    tokens.ts               # CSS 变量名常量
    createVariants.ts       # Variant API（类似 cva，自实现 ~30 行）
    theme.css               # 全局 CSS 变量声明

  index.ts                  # 全量导出（向后兼容）
```

### 3.2 组件包结构（每个组件/文件夹内）

```
button/
  index.ts            # 公共 API 导出
  button.tsx          # 无样式基元（HeadlessButton）
  button.styled.tsx   # 带 Tabora 样式的版本（默认导出）
  styles.css          # 该组件独立 CSS
  button.test.tsx     # 单元测试
  types.ts            # Props 类型定义
```

### 3.3 CSS 命名空间

当前 `tabora-*` → 改为 `tbr-*`（Tabora 缩写，更短，全局唯一性足够）。

CSS 变量也加 `tbr-` 前缀：

```css
/* 当前 */
--color-accent: 26 144 112;

/* 改为 */
--tbr-color-accent: 26 144 112;
```

好处：避免与其他库的 CSS 变量冲突（如 `--color-accent` 是常见命名）。

### 3.4 package.json exports

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/styled/button/index.ts",
    "./input": "./src/styled/input/index.ts",
    "./select": "./src/styled/select/index.ts",
    "./checkbox": "./src/primitives/checkbox/index.ts",
    "./switch": "./src/primitives/switch/index.ts",
    "./tabs": "./src/primitives/tabs/index.ts",
    "./tooltip": "./src/primitives/tooltip/index.ts",
    "./field": "./src/composites/field/index.ts",
    "./badge": "./src/composites/badge/index.ts",
    "./spinner": "./src/composites/spinner/index.ts",
    "./empty-state": "./src/composites/emptyState/index.ts",
    "./list-row": "./src/composites/listRow/index.ts",
    "./card-section": "./src/composites/cardSection/index.ts",
    "./inline-error": "./src/composites/inlineError/index.ts",
    "./tokens": "./src/tokens/index.ts",
    "./styles.css": "./src/tokens/theme.css"
  }
}
```

### 3.5 消费者导入对比

```tsx
// ========== 当前 ==========
import { Button, Select, Input, Field } from "@tabora/ui"
// 导入全部 16 个组件的 CSS（styles.css 610 行）

// ========== 改进后 ==========
import { Button } from "@tabora/ui/button"
import { Select } from "@tabora/ui/select"
import { Input } from "@tabora/ui/input"
import { Field } from "@tabora/ui/field"
// 只加载 4 个组件的 CSS（每个 ~40 行）
```

## 4. 核心设计

### 4.1 两层架构：Headless + Styled

```
┌──────────────────────────────────────┐
│  Styled Layer (src/styled/)          │
│  - Tabora 设计语言                   │
│  - 颜色、间距、圆角、动效             │
│  - 默认给消费者开箱即用               │
└──────────────┬───────────────────────┘
               │ extends
┌──────────────┴───────────────────────┐
│  Headless Layer (src/primitives/)    │
│  - Kobalte 驱动的行为（aria, 键盘）   │
│  - 无样式，只有最小重置              │
│  - 暴露 compound components          │
│  - 暴露 data-state/data-disabled 等  │
└──────────────────────────────────────┘
```

消费者可以：

- **直接用 styled 版本**：`import { Button } from "@tabora/ui/button"` → 得到 Tabora 样式的按钮
- **只用 headless 版本 + 自己的样式**：`import { Button } from "@tabora/ui/button/headless"` → 得到行为基元，自己写样式
- **只用 hook**：`import { createSelect } from "@tabora/ui/select/hook"` → 只拿状态管理，完全自定义渲染

### 4.2 Compound Component 模式

```tsx
// select/index.ts
export const Select = {
  Root: SelectRoot, // value, onChange
  Trigger: SelectTrigger, // aria-label, placeholder
  Content: SelectContent, // Portal + dropdown
  Item: SelectItem, // value, disabled
  Group: SelectGroup, // label
  GroupLabel: SelectGroupLabel,
  Value: SelectValue, // 当前选中值展示
  Icon: SelectIcon, // chevron
}

// styled/select/select.styled.tsx
import { Select as HeadlessSelect } from "../../primitives/select"
import "./styles.css"

export function StyledSelect(props: SelectProps) {
  return (
    <HeadlessSelect.Root {...props}>
      <HeadlessSelect.Trigger class="tbr-select-trigger">
        <HeadlessSelect.Value />
        <HeadlessSelect.Icon class="tbr-select-icon" />
      </HeadlessSelect.Trigger>
      <HeadlessSelect.Content class="tbr-select-content">{props.children}</HeadlessSelect.Content>
    </HeadlessSelect.Root>
  )
}
StyledSelect.Trigger = HeadlessSelect.Trigger // 透传所有子组件
StyledSelect.Content = HeadlessSelect.Content
// ...

export { StyledSelect as Select }
```

消费者使用：

```tsx
// 默认 Tabora 样式
<Select value={v} onChange={fn}>
  <Select.Trigger /><Select.Content><Select.Item>...</Select.Item></Select.Content>
</Select>

// 或自定义 Trigger
<Select value={v} onChange={fn}>
  <Select.Trigger class="my-custom-trigger" />
  <Select.Content><Select.Item>...</Select.Item></Select.Content>
</Select>
```

### 4.3 Variant API

```ts
// tokens/createVariants.ts
type VariantConfig = {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export function tv(config: VariantConfig) {
  return (props: Record<string, string | undefined>): string => {
    const classes: string[] = []
    if (config.base) classes.push(config.base)
    for (const [key, variants] of Object.entries(config.variants ?? {})) {
      const value = props[key] ?? config.defaultVariants?.[key]
      if (value && variants[value]) classes.push(variants[value])
    }
    return classes.join(" ")
  }
}
```

使用：

```ts
// styled/button/styles.ts
import { tv } from "../../tokens/createVariants"

export const button = tv({
  base: "tbr-button",
  variants: {
    variant: {
      primary: "tbr-button--primary",
      secondary: "tbr-button--secondary",
      ghost: "tbr-button--ghost",
      danger: "tbr-button--danger",
    },
    size: {
      sm: "tbr-button--sm",
      md: "tbr-button--md",
      lg: "tbr-button--lg",
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
})
```

```tsx
// styled/button/button.styled.tsx
import { button } from "./styles"

export function Button(props: ButtonProps) {
  return <HeadlessButton class={button({ variant: props.variant, size: props.size })} {...props} />
}
```

### 4.4 CSS 变量体系

```css
/* tokens/theme.css */
:root {
  /* 颜色 */
  --tbr-color-page: 246 247 244;
  --tbr-color-surface: 255 255 255;
  --tbr-color-text: 28 30 28;
  --tbr-color-text-muted: 107 110 106;
  --tbr-color-text-subtle: 148 151 146;
  --tbr-color-line: 230 232 227;
  --tbr-color-accent: 26 144 112;
  --tbr-color-accent-hover: 21 120 92;
  --tbr-color-danger: 201 69 69;
  --tbr-color-success: 45 138 94;
  --tbr-color-warning: 166 106 18;

  /* 圆角 */
  --tbr-radius-1: 4px;
  --tbr-radius-2: 6px;
  --tbr-radius-control: 8px;
  --tbr-radius-card: 8px;
  --tbr-radius-panel: 12px;
  --tbr-radius-pill: 999px;

  /* 间距 */
  --tbr-space-1: 2px;
  --tbr-space-2: 4px;
  --tbr-space-3: 8px;
  --tbr-space-4: 12px;
  --tbr-space-5: 16px;
  --tbr-space-8: 32px;

  /* 字体 */
  --tbr-font-body: 400 14px/1.45 "Inter", system-ui, sans-serif;
  --tbr-font-body-sm: 400 13px/1.4 "Inter", system-ui, sans-serif;
  --tbr-font-caption: 400 12px/1.35 "Inter", system-ui, sans-serif;

  /* 控件尺寸 */
  --tbr-control-height-sm: 28px;
  --tbr-control-height-md: 36px;
  --tbr-control-height-lg: 44px;

  /* 动效 */
  --tbr-duration-fast: 120ms;
  --tbr-duration-normal: 180ms;
  --tbr-ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

组件 CSS 引用这些变量：

```css
/* styled/button/styles.css */
.tbr-button {
  height: var(--tbr-control-height-md);
  padding: 0 var(--tbr-space-5);
  background: rgb(var(--tbr-color-surface));
  color: rgb(var(--tbr-color-text));
  border: 1px solid rgb(var(--tbr-color-line));
  border-radius: var(--tbr-radius-control);
  font: var(--tbr-font-body-sm);
  transition: background var(--tbr-duration-fast) var(--tbr-ease-standard);
}
.tbr-button--primary {
  background: rgb(var(--tbr-color-accent));
  color: #fff;
}
.tbr-button--sm {
  height: var(--tbr-control-height-sm);
}
.tbr-button--lg {
  height: var(--tbr-control-height-lg);
}
```

### 4.5 tokens.ts 实际被组件引用

```ts
// tokens/tokens.ts
export const TOKEN = {
  color: {
    page: "tbr-color-page",
    surface: "tbr-color-surface",
    text: "tbr-color-text",
    accent: "tbr-color-accent",
    line: "tbr-color-line",
    // ...
  },
  radius: {
    control: "tbr-radius-control",
    card: "tbr-radius-card",
    // ...
  },
  space: {
    sm: "tbr-space-3",
    md: "tbr-space-5",
    // ...
  },
} as const
```

组件可以引用：

```tsx
import { TOKEN } from "../tokens"

// 在组件中动态设置 CSS 变量
<div style={{ ["--custom-bg" as string]: `var(--${TOKEN.color.accent})` }}>
```

## 5. 迁移路径

### Phase 1: 基础设施（1-2 天）

1. 创建 `src/tokens/createVariants.ts`（~30 行）
2. 创建 `src/tokens/theme.css`（全局 CSS 变量声明）
3. 更新 `tokens.ts` 为新的命名空间 `tbr-*`
4. 创建 `src/styled/button/` 作为第一个重构样本
   - `primitives/button/button.tsx`（从现有 button.tsx 提取无样式版本）
   - `styled/button/button.styled.tsx`（带 Tabora 样式）
   - `styled/button/styles.css`（独立按钮 CSS）
5. Button 的单测验证

### Phase 2: 核心控件迁移（3-5 天）

逐个迁移到新结构：

| 优先级 | 组件                            | 原因                         |
| ------ | ------------------------------- | ---------------------------- |
| P0     | Button                          | 使用频率最高，验证模式       |
| P0     | Input                           | 使用频率高，简单             |
| P1     | Select                          | 复杂，需要 compound API 改造 |
| P1     | Checkbox, Switch                | 简单                         |
| P2     | Tabs, Tooltip, SegmentedControl | 中等复杂度                   |
| P3     | Textarea                        | 简单                         |

### Phase 3: 复合组件迁移（2-3 天）

| 组件                       | 说明                   |
| -------------------------- | ---------------------- |
| Field                      | 依赖 Input，迁移后更新 |
| ListRow                    | 独立                   |
| Badge, Spinner, EmptyState | 简单                   |
| CardSection, InlineError   | 依赖项少               |

### Phase 4: 导出与兼容（1 天）

1. 更新 `index.ts` 同时支持新旧导出路径
2. 更新 `package.json` exports 字段
3. 验证全量导入和细粒度导入均可工作

### Phase 5: 消费者迁移（2-3 天）

1. 更新 `@tabora/official-plugins` 中的 import 路径
2. 更新 `apps/playground` 中的 import 路径
3. 删除旧 `styles.css` 和旧全局类名

### Phase 6: 文档更新（1 天）

1. 更新 `DESIGN.md` 中的组件 catalog 和组件语义
2. 新增 Headless 组件使用指南

## 6. 风险与应对

| 风险                               | 应对                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- |
| 迁移期间官方插件 UI 损坏           | 每个 Phase 保证 playground 可运行，新旧代码并行，Phase 5 前不删旧文件 |
| CSS 变量重命名导致现有主题贡献失效 | `@tabora/theme` 中增加映射层：旧名 → 新名                             |
| 细粒度导出增加构建复杂度           | tsdown 支持多入口，vp pack 按 `exports` 字段自动分包                  |
| Select 的 compound API 改动大      | 先在单独分支上重构 Select，验证通过再合并                             |
