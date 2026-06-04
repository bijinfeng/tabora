# `@tabora/ui` 基础组件包实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 `@tabora/ui` 基础组件包（17 个控件，基于 `@kobalte/core`），并把 `widgets-productivity` / `widget-todo` / `search-command-bar` / `plugin-manager` 的内容区控件全部迁过去；同步更新四份事实源文档。

**Architecture:** 新建 `packages/ui` workspace 包，依赖 `solid-js` + `@tabora/theme` + `@kobalte/core`（catalog:ui）。控件以 Kobalte 无样式底层 + Tabora token 样式分层实现，样式收在 `@layer tabora-ui` 内避免抢权重。playground 通过 `import "@tabora/ui/styles.css"` 加载样式。每阶段独立可绿，先包脚手架 + 最小控件，再补齐表单类与辅助类，最后批量迁移并清理旧 CSS。

**Tech Stack:** Solid 1.9、TypeScript、pnpm workspace + catalog、`@kobalte/core` 0.13.x、Vitest（happy-dom）、tsdown via `vp pack`、Vite+/Vite。

**关联文档：**

- 历史 Spec：`docs/superpowers/specs/2026-05-28-tabora-ui-base-components-design.md`（已清理；当前 `@tabora/ui` 事实源以 `DESIGN.md`、`docs/product/tabora-design-system.md` 和实际实现为准）
- 项目入口：`AGENTS.md`、`docs/README.md`
- 设计体系：`docs/product/tabora-design-system.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design.md`

---

## 任务总览

- 阶段 A：包脚手架与最小控件
  - Task 1：新建 `packages/ui` 包脚手架（`package.json` / `tsconfig.json` / `src` 骨架 / `styles.css` 空入口）
  - Task 2：`tokens.ts` 暴露 token 常量
  - Task 3：`Button` + `IconButton`（含样式 + 测试）
  - Task 4：`Input`
  - Task 5：`Textarea`
  - Task 6：`Field`
  - Task 7：`packages/ui` 通过 `pnpm install` 注册并在 playground 引入 `styles.css`
- 阶段 B：表单类控件
  - Task 8：`Select<V>`
  - Task 9：`Checkbox`
  - Task 10：`Switch`
  - Task 11：`SegmentedControl<V>`
  - Task 12：`Tabs`
  - Task 13：`Tooltip`
- 阶段 C：辅助控件
  - Task 14：`Badge`
  - Task 15：`InlineError`
  - Task 16：`Spinner`
  - Task 17：`EmptyState`
  - Task 18：`ListRow`
  - Task 19：`CardSection`
- 阶段 D：迁移 widgets-productivity
  - Task 20：迁移 `TodayFocusCard`
  - Task 21：迁移 `QuickLinksCard`
  - Task 22：迁移 `NotesCard` / `NotesModal`
  - Task 23：迁移 `WeatherCard`
- 阶段 E：迁移 todo + search + plugin-manager
  - Task 24：迁移 `TodoCard`
  - Task 25：迁移 `SearchCommandBar`
  - Task 26：迁移 `PluginManagerCard`
- 阶段 F：清理与文档同步
  - Task 27：清理 `apps/playground/src/app.css` 中已替换的原子控件类
  - Task 28：更新 `docs/product/tabora-design-system.md`
  - Task 29：更新 `docs/technical/tabora-plugin-workbench-technical-design.md`
  - Task 30：更新 `docs/product/tabora-official-plugins-design.md`
  - Task 31：更新 `AGENTS.md`
- 阶段 G：终验
  - Task 32：`pnpm test`、`pnpm check`、`pnpm build` 全绿 + 浏览器关键路径

---

## 阶段 A：包脚手架与最小控件

### Task 1：新建 `packages/ui` 包脚手架

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/styles.css`

- [ ] **Step 1：新建 `packages/ui/package.json`**

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
    "@kobalte/core": "catalog:ui",
    "@tabora/theme": "workspace:*",
    "solid-js": "catalog:ui"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*",
    "vite-plugin-solid": "catalog:build"
  }
}
```

- [ ] **Step 2：新建 `packages/ui/tsconfig.json`**

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **Step 3：新建 `packages/ui/src/index.ts`（先空导出，后续 task 逐步追加）**

```ts
export {}
```

- [ ] **Step 4：新建 `packages/ui/src/styles.css`（先放 `@layer` 声明骨架）**

```css
@layer tabora-ui {
}
```

- [ ] **Step 5：运行 `pnpm install` 让 workspace 识别新包**

Run:

```bash
pnpm install
```

Expected：成功完成，无依赖解析错误，`packages/ui/node_modules` 出现。

- [ ] **Step 6：提交**

```bash
git add packages/ui pnpm-lock.yaml
git commit -m "feat(ui): scaffold @tabora/ui package"
```

---

### Task 2：暴露 token 常量

**Files:**

- Create: `packages/ui/src/tokens.ts`

- [ ] **Step 1：写 `tokens.ts`**

```ts
export const TOKENS = {
  page: "color-page",
  surface: "color-surface",
  text: "color-text",
  muted: "color-muted",
  accent: "color-accent",
  line: "color-line",
  radiusCard: "radius-card",
} as const

export type TokenName = (typeof TOKENS)[keyof typeof TOKENS]
```

- [ ] **Step 2：在 `index.ts` 中 re-export**

替换 `packages/ui/src/index.ts` 内容：

```ts
export * from "./tokens"
```

- [ ] **Step 3：提交**

```bash
git add packages/ui/src
git commit -m "feat(ui): expose theme token constants"
```

---

### Task 3：`Button` + `IconButton`

**Files:**

- Create: `packages/ui/src/primitives/button.tsx`
- Create: `packages/ui/src/primitives/button.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

`packages/ui/src/primitives/button.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Button, IconButton } from "./button"

describe("Button", () => {
  it("renders with text and triggers onClick", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(() => <Button onClick={onClick}>保存</Button>, root)

    const btn = root.querySelector("button")!
    expect(btn.textContent).toBe("保存")
    expect(btn.type).toBe("button")
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it("does not trigger onClick when disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(
      () => (
        <Button onClick={onClick} disabled>
          保存
        </Button>
      ),
      root,
    )

    root.querySelector("button")!.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it("respects type=submit", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Button type="submit">提交</Button>, root)
    expect(root.querySelector("button")!.type).toBe("submit")
  })
})

describe("IconButton", () => {
  it("requires aria-label and renders icon", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <IconButton aria-label="删除">
          <span data-testid="icon">×</span>
        </IconButton>
      ),
      root,
    )
    const btn = root.querySelector("button")!
    expect(btn.getAttribute("aria-label")).toBe("删除")
    expect(btn.querySelector("[data-testid='icon']")).toBeTruthy()
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- button
```

Expected：失败，因为 `./button` 模块不存在。

- [ ] **Step 3：实现 `button.tsx`**

```tsx
import type { JSX } from "solid-js"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md"

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  onClick?: (e: MouseEvent) => void
  "aria-label"?: string
  children: JSX.Element
}

export function Button(props: ButtonProps) {
  return (
    <button
      class="tabora-button"
      data-variant={props.variant ?? "secondary"}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      onClick={(e) => props.onClick?.(e)}
    >
      {props.children}
    </button>
  )
}

export type IconButtonProps = {
  variant?: "ghost" | "secondary" | "danger"
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  "aria-label": string
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}
export function IconButton(props: IconButtonProps) {
  return (
    <button
      class="tabora-icon-button"
      data-variant={props.variant ?? "ghost"}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      type="button"
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      onClick={(e) => props.onClick?.(e)}
    >
      {props.children}
    </button>
  )
}
```

- [ ] **Step 4：在 `styles.css` 内 `@layer tabora-ui` 中追加按钮样式**

替换 `packages/ui/src/styles.css` 内容：

```css
@layer tabora-ui {
  .tabora-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    font: inherit;
    line-height: 1;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      color 150ms ease;
  }
  .tabora-button[data-size="sm"] {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
  .tabora-button[data-size="md"] {
    height: 36px;
    padding: 0 14px;
    font-size: 13px;
  }
  .tabora-button[data-variant="primary"] {
    background: rgb(var(--color-accent));
    color: rgb(var(--color-surface));
  }
  .tabora-button[data-variant="primary"]:hover {
    background: color-mix(in srgb, rgb(var(--color-accent)) 90%, black);
  }
  .tabora-button[data-variant="secondary"] {
    background: rgb(var(--color-surface));
    color: rgb(var(--color-text));
    border-color: rgb(var(--color-line));
  }
  .tabora-button[data-variant="secondary"]:hover {
    background: rgba(var(--color-accent), 0.08);
    border-color: rgb(var(--color-accent));
    color: rgb(var(--color-accent));
  }
  .tabora-button[data-variant="ghost"] {
    background: transparent;
    color: rgb(var(--color-muted));
  }
  .tabora-button[data-variant="ghost"]:hover {
    background: rgba(var(--color-accent), 0.08);
    color: rgb(var(--color-accent));
  }
  .tabora-button[data-variant="danger"] {
    background: transparent;
    color: rgb(var(--color-text));
    border-color: rgb(var(--color-line));
  }
  .tabora-button[data-variant="danger"]:hover {
    color: #c0392b;
    border-color: #c0392b;
  }
  .tabora-button:focus-visible {
    outline: 2px solid rgb(var(--color-accent));
    outline-offset: 2px;
  }
  .tabora-button[disabled] {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .tabora-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: rgb(var(--color-muted));
    cursor: pointer;
    transition:
      background-color 150ms ease,
      color 150ms ease,
      border-color 150ms ease;
  }
  .tabora-icon-button[data-size="sm"] {
    width: 28px;
    height: 28px;
  }
  .tabora-icon-button[data-size="md"] {
    width: 32px;
    height: 32px;
  }
  .tabora-icon-button:hover {
    background: rgba(var(--color-accent), 0.08);
    color: rgb(var(--color-accent));
  }
  .tabora-icon-button[data-variant="danger"]:hover {
    color: rgb(var(--tabora-danger));
    background: rgba(var(--tabora-danger), 0.1);
  }
  .tabora-icon-button:focus-visible {
    outline: 2px solid rgb(var(--color-accent));
    outline-offset: 2px;
  }
  .tabora-icon-button[disabled] {
    cursor: not-allowed;
    opacity: 0.55;
  }
}
```

并在文件最顶端、`@layer` 之前补 token 别名：

```css
:root {
  --tabora-danger: 192 57 43;
}
```

> 备注：`--tabora-danger` 是 `@tabora/ui` 层局部语义状态色，不属于 theme token；spec 不变量「控件颜色全部使用 theme token / 不写 hex」放宽为「不在控件规则中直接出现 hex；语义状态色集中在 `:root` 中以变量形式声明」。

- [ ] **Step 5：在 `index.ts` 中 export**

替换 `packages/ui/src/index.ts` 内容：

```ts
export * from "./tokens"
export { Button, IconButton } from "./primitives/button"
export type { ButtonProps, IconButtonProps, ButtonVariant, ButtonSize } from "./primitives/button"
```

- [ ] **Step 6：跑测试验证通过**

```bash
pnpm --filter @tabora/ui test -- button
```

Expected：3 个用例全部通过。

- [ ] **Step 7：提交**

```bash
git add packages/ui/src
git commit -m "feat(ui): add Button and IconButton primitives"
```

---

### Task 4：`Input`

**Files:**

- Create: `packages/ui/src/primitives/input.tsx`
- Create: `packages/ui/src/primitives/input.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Input } from "./input"

describe("Input", () => {
  it("renders controlled value and calls onInput", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onInput = vi.fn()
    render(
      () => <Input value="hello" onInput={onInput} aria-label="搜索" placeholder="输入" />,
      root,
    )
    const el = root.querySelector("input")!
    expect(el.value).toBe("hello")
    expect(el.placeholder).toBe("输入")
    expect(el.getAttribute("aria-label")).toBe("搜索")
    el.value = "world"
    el.dispatchEvent(new Event("input", { bubbles: true }))
    expect(onInput).toHaveBeenCalledWith("world")
  })
  it("blocks input while disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Input value="" onInput={() => {}} disabled aria-label="x" />, root)
    expect(root.querySelector("input")!.disabled).toBe(true)
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- input
```

- [ ] **Step 3：实现 `input.tsx`**

```tsx
export type InputSize = "sm" | "md"
export type InputType = "text" | "search" | "url" | "email"

export type InputProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  size?: InputSize
  disabled?: boolean
  invalid?: boolean
  type?: InputType
  "aria-label"?: string
  id?: string
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function Input(props: InputProps) {
  return (
    <input
      class="tabora-input"
      data-size={props.size ?? "md"}
      data-invalid={props.invalid ? "" : undefined}
      type={props.type ?? "text"}
      id={props.id}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      aria-invalid={props.invalid ? true : undefined}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      onKeyDown={(e) => props.onKeyDown?.(e)}
      onFocus={() => props.onFocus?.()}
      onBlur={() => props.onBlur?.()}
    />
  )
}
```

- [ ] **Step 4：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-input {
  display: block;
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-line));
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  font: inherit;
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
}
.tabora-input[data-size="sm"] {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
}
.tabora-input[data-size="md"] {
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
}
.tabora-input::placeholder {
  color: rgb(var(--color-muted));
}
.tabora-input:hover:not([disabled]) {
  border-color: rgb(var(--color-accent));
}
.tabora-input:focus {
  outline: none;
  border-color: rgb(var(--color-accent));
  box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.18);
}
.tabora-input[data-invalid] {
  border-color: rgb(var(--tabora-danger));
}
.tabora-input[disabled] {
  background: rgba(var(--color-line), 0.4);
  cursor: not-allowed;
}
```

- [ ] **Step 5：在 `index.ts` 中追加 export**

```ts
export { Input } from "./primitives/input"
export type { InputProps, InputSize, InputType } from "./primitives/input"
```

- [ ] **Step 6：跑测试验证通过 + 提交**

```bash
pnpm --filter @tabora/ui test -- input
git add packages/ui/src
git commit -m "feat(ui): add Input primitive"
```

---

### Task 5：`Textarea`

**Files:**

- Create: `packages/ui/src/primitives/textarea.tsx`
- Create: `packages/ui/src/primitives/textarea.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Textarea } from "./textarea"

describe("Textarea", () => {
  it("renders controlled value and triggers onInput", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onInput = vi.fn()
    render(
      () => <Textarea value="hi" onInput={onInput} placeholder="写点什么" aria-label="便签" />,
      root,
    )
    const ta = root.querySelector("textarea")!
    expect(ta.value).toBe("hi")
    expect(ta.placeholder).toBe("写点什么")
    expect(ta.getAttribute("aria-label")).toBe("便签")
    ta.value = "ok"
    ta.dispatchEvent(new Event("input", { bubbles: true }))
    expect(onInput).toHaveBeenCalledWith("ok")
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- textarea
```

- [ ] **Step 3：实现 `textarea.tsx`**

```tsx
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

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      class="tabora-textarea"
      id={props.id}
      rows={props.rows ?? 4}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      aria-invalid={props.invalid ? true : undefined}
      data-invalid={props.invalid ? "" : undefined}
      onInput={(e) => props.onInput(e.currentTarget.value)}
    />
  )
}
```

- [ ] **Step 4：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-textarea {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-line));
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  font: inherit;
  resize: vertical;
}
.tabora-textarea::placeholder {
  color: rgb(var(--color-muted));
}
.tabora-textarea:focus {
  outline: none;
  border-color: rgb(var(--color-accent));
  box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.18);
}
.tabora-textarea[data-invalid] {
  border-color: rgb(var(--tabora-danger));
}
```

- [ ] **Step 5：在 `index.ts` 中追加 export**

```ts
export { Textarea } from "./primitives/textarea"
export type { TextareaProps } from "./primitives/textarea"
```

- [ ] **Step 6：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- textarea
git add packages/ui/src
git commit -m "feat(ui): add Textarea primitive"
```

---

### Task 6：`Field`

**Files:**

- Create: `packages/ui/src/composites/field.tsx`
- Create: `packages/ui/src/composites/field.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Field } from "./field"

describe("Field", () => {
  it("renders label, helper, error and links to control via htmlFor", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Field label="今日重点" helper="一句话即可" htmlFor="focus-input">
          <input id="focus-input" />
        </Field>
      ),
      root,
    )
    const label = root.querySelector("label")!
    expect(label.htmlFor).toBe("focus-input")
    expect(root.textContent).toContain("今日重点")
    expect(root.textContent).toContain("一句话即可")
  })
  it("renders error with role=alert", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Field label="x" error="必填">
          <input />
        </Field>
      ),
      root,
    )
    const err = root.querySelector("[role='alert']")!
    expect(err.textContent).toBe("必填")
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- field
```

- [ ] **Step 3：实现 `field.tsx`**

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldProps = {
  label: JSX.Element
  helper?: JSX.Element
  error?: JSX.Element
  required?: boolean
  htmlFor?: string
  children: JSX.Element
}

export function Field(props: FieldProps) {
  return (
    <div class="tabora-field">
      <label class="tabora-field-label" for={props.htmlFor}>
        {props.label}
        <Show when={props.required}>
          <span class="tabora-field-required" aria-hidden="true">
            *
          </span>
        </Show>
      </label>
      {props.children}
      <Show when={props.helper}>
        <div class="tabora-field-helper">{props.helper}</div>
      </Show>
      <Show when={props.error}>
        <div class="tabora-field-error" role="alert">
          {props.error}
        </div>
      </Show>
    </div>
  )
}
```

- [ ] **Step 4：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tabora-field-label {
  font-size: 12px;
  color: rgb(var(--color-muted));
  display: inline-flex;
  gap: 4px;
}
.tabora-field-required {
  color: rgb(var(--tabora-danger));
}
.tabora-field-helper {
  font-size: 11px;
  color: rgb(var(--color-muted));
}
.tabora-field-error {
  font-size: 11px;
  color: rgb(var(--tabora-danger));
}
```

- [ ] **Step 5：在 `index.ts` 中追加 export**

```ts
export { Field } from "./composites/field"
export type { FieldProps } from "./composites/field"
```

- [ ] **Step 6：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- field
git add packages/ui/src
git commit -m "feat(ui): add Field composite"
```

---

### Task 7：playground 接入 `@tabora/ui` styles

**Files:**

- Modify: `apps/playground/package.json`
- Modify: `apps/playground/src/bootstrap.tsx`

- [ ] **Step 1：在 `apps/playground/package.json` `dependencies` 中追加 `@tabora/ui`**

将依赖块改为（保持其它字段不变）：

```json
"dependencies": {
  "@kobalte/core": "catalog:ui",
  "@tabora/official-plugins": "workspace:*",
  "@tabora/platform-kernel": "workspace:*",
  "@tabora/plugin-api": "workspace:*",
  "@tabora/storage": "workspace:*",
  "@tabora/theme": "workspace:*",
  "@tabora/ui": "workspace:*",
  "lucide-solid": "catalog:ui",
  "solid-js": "catalog:ui",
  "zod": "catalog:data"
}
```

- [ ] **Step 2：在 `bootstrap.tsx` 中先 import `@tabora/ui/styles.css`**

修改 `apps/playground/src/bootstrap.tsx`：

```tsx
import { render } from "solid-js/web"
import "@tabora/ui/styles.css"
import { App } from "./App"
import "./app.css"

const root = document.getElementById("root")
if (!root) {
  throw new Error("Root element #root was not found")
}
render(() => <App />, root)
```

- [ ] **Step 3：`pnpm install` + 跑 playground build**

```bash
pnpm install
pnpm --filter @tabora/playground build
```

Expected：build 通过，无 module 解析错误。

- [ ] **Step 4：跑 `pnpm check`**

```bash
pnpm check
```

Expected：通过。

- [ ] **Step 5：提交**

```bash
git add apps/playground pnpm-lock.yaml
git commit -m "feat(playground): wire @tabora/ui styles"
```

---

## 阶段 B：表单类控件

### Task 8：`Select<V>`（基于 `@kobalte/core/select`）

**Files:**

- Create: `packages/ui/src/primitives/select.tsx`
- Create: `packages/ui/src/primitives/select.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

> 测试说明：happy-dom 对 portal/定位行为支持有限，单测只覆盖契约层（`onChange` 触发、`aria-label`、`disabled`），不打开下拉验证 list 渲染。

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Select } from "./select"

describe("Select", () => {
  it("renders trigger with current label and aria-label", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Select<"a" | "b">
          value="a"
          options={[
            { value: "a", label: "Apple" },
            { value: "b", label: "Banana" },
          ]}
          onChange={() => {}}
          aria-label="水果"
        />
      ),
      root,
    )
    const trigger = root.querySelector("button[aria-label='水果']")!
    expect(trigger.textContent).toContain("Apple")
  })
  it("respects disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Select<"a">
          value="a"
          disabled
          options={[{ value: "a", label: "Apple" }]}
          onChange={() => {}}
          aria-label="水果"
        />
      ),
      root,
    )
    expect(root.querySelector("button")!.disabled).toBe(true)
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- select
```

- [ ] **Step 3：实现 `select.tsx`**

```tsx
import { Select as KSelect } from "@kobalte/core/select"
import type { JSX } from "solid-js"

export type SelectOption<V extends string> = {
  value: V
  label: JSX.Element
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
export function Select<V extends string>(props: SelectProps<V>) {
  return (
    <KSelect<SelectOption<V>>
      value={props.options.find((o) => o.value === props.value) ?? null}
      onChange={(opt) => opt && props.onChange(opt.value)}
      options={props.options}
      optionValue="value"
      optionTextValue={(opt) => String(opt.label)}
      optionDisabled="disabled"
      disabled={props.disabled}
      placeholder={props.placeholder}
      itemComponent={(p) => (
        <KSelect.Item item={p.item} class="tabora-select-item">
          <KSelect.ItemLabel>{p.item.rawValue.label}</KSelect.ItemLabel>
        </KSelect.Item>
      )}
    >
      <KSelect.Trigger
        class="tabora-select-trigger"
        data-size={props.size ?? "md"}
        aria-label={props["aria-label"]}
        id={props.id}
      >
        <KSelect.Value<SelectOption<V>>>{(state) => state.selectedOption().label}</KSelect.Value>
        <KSelect.Icon class="tabora-select-icon" aria-hidden="true">
          ▾
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content class="tabora-select-content">
          <KSelect.Listbox class="tabora-select-listbox" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  )
}
```

- [ ] **Step 4：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-select-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-line));
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  font: inherit;
  cursor: pointer;
}
.tabora-select-trigger[data-size="sm"] {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
}
.tabora-select-trigger[data-size="md"] {
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
}
.tabora-select-trigger:hover:not([disabled]) {
  border-color: rgb(var(--color-accent));
}
.tabora-select-trigger:focus-visible {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: 2px;
}
.tabora-select-trigger[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
.tabora-select-icon {
  color: rgb(var(--color-muted));
  font-size: 10px;
}
.tabora-select-content {
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-line));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 1100;
}
.tabora-select-listbox {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}
.tabora-select-item {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: rgb(var(--color-text));
}
.tabora-select-item[data-highlighted] {
  background: rgba(var(--color-accent), 0.1);
  color: rgb(var(--color-accent));
}
.tabora-select-item[data-disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}
```

> 备注：`z-index: 1100` 高于 `app.css` 中 `.modal-overlay`（当前 CSS 中没有显式 z-index，但布局上使用 `position: fixed`），保证 Select 在 modal 内仍能展开。提交前 grep 确认 `app.css` 中 modal 相关 z-index 不超过 1000。

- [ ] **Step 5：在 `index.ts` 中追加 export**

```ts
export { Select } from "./primitives/select"
export type { SelectProps, SelectOption } from "./primitives/select"
```

- [ ] **Step 6：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- select
git add packages/ui/src
git commit -m "feat(ui): add Select primitive"
```

---

### Task 9：`Checkbox`（基于 `@kobalte/core/checkbox`）

**Files:**

- Create: `packages/ui/src/primitives/checkbox.tsx`
- Create: `packages/ui/src/primitives/checkbox.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Checkbox } from "./checkbox"

describe("Checkbox", () => {
  it("calls onChange when toggled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(() => <Checkbox checked={false} onChange={onChange} aria-label="完成" />, root)
    const input = root.querySelector("input[type='checkbox']") as HTMLInputElement
    input.click()
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2：跑测试确认失败**

```bash
pnpm --filter @tabora/ui test -- checkbox
```

- [ ] **Step 3：实现 `checkbox.tsx`**

```tsx
import { Checkbox as KCheckbox } from "@kobalte/core/checkbox"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element
}

export function Checkbox(props: CheckboxProps) {
  return (
    <KCheckbox
      class="tabora-checkbox"
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled}
    >
      <KCheckbox.Input class="tabora-checkbox-input" aria-label={props["aria-label"]} />
      <KCheckbox.Control class="tabora-checkbox-control">
        <KCheckbox.Indicator>✓</KCheckbox.Indicator>
      </KCheckbox.Control>
      <Show when={props.label}>
        <KCheckbox.Label class="tabora-checkbox-label">{props.label}</KCheckbox.Label>
      </Show>
    </KCheckbox>
  )
}
```

- [ ] **Step 4：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.tabora-checkbox[data-disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
.tabora-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 16px;
  height: 16px;
  pointer-events: none;
}
.tabora-checkbox-control {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgb(var(--color-line));
  background: rgb(var(--color-surface));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: transparent;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}
.tabora-checkbox[data-checked] .tabora-checkbox-control {
  background: rgb(var(--color-accent));
  border-color: rgb(var(--color-accent));
  color: rgb(var(--color-surface));
}
.tabora-checkbox:focus-within .tabora-checkbox-control {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: 2px;
}
.tabora-checkbox-label {
  font-size: 13px;
  color: rgb(var(--color-text));
}
```

- [ ] **Step 5：在 `index.ts` 中追加 export**

```ts
export { Checkbox } from "./primitives/checkbox"
export type { CheckboxProps } from "./primitives/checkbox"
```

- [ ] **Step 6：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- checkbox
git add packages/ui/src
git commit -m "feat(ui): add Checkbox primitive"
```

---

### Task 10：`Switch`（基于 `@kobalte/core/switch`）

**Files:**

- Create: `packages/ui/src/primitives/switch.tsx`
- Create: `packages/ui/src/primitives/switch.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Switch } from "./switch"

describe("Switch", () => {
  it("toggles via click and reports new value", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(() => <Switch checked={false} onChange={onChange} aria-label="启用" />, root)
    const input = root.querySelector("input[type='checkbox']") as HTMLInputElement
    input.click()
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2：跑测试确认失败 + 实现 + 跑测试通过**

`packages/ui/src/primitives/switch.tsx`:

```tsx
import { Switch as KSwitch } from "@kobalte/core/switch"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element
}

export function Switch(props: SwitchProps) {
  return (
    <KSwitch
      class="tabora-switch"
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled}
    >
      <KSwitch.Input class="tabora-switch-input" aria-label={props["aria-label"]} />
      <KSwitch.Control class="tabora-switch-control">
        <KSwitch.Thumb class="tabora-switch-thumb" />
      </KSwitch.Control>
      <Show when={props.label}>
        <KSwitch.Label class="tabora-switch-label">{props.label}</KSwitch.Label>
      </Show>
    </KSwitch>
  )
}
```

- [ ] **Step 3：在 `styles.css` 的 `@layer tabora-ui` 内追加样式**

```css
.tabora-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.tabora-switch[data-disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
.tabora-switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.tabora-switch-control {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: rgb(var(--color-line));
  position: relative;
  transition: background 150ms ease;
}
.tabora-switch[data-checked] .tabora-switch-control {
  background: rgb(var(--color-accent));
}
.tabora-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgb(var(--color-surface));
  transition: transform 150ms ease;
}
.tabora-switch[data-checked] .tabora-switch-thumb {
  transform: translateX(14px);
}
.tabora-switch:focus-within .tabora-switch-control {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: 2px;
}
.tabora-switch-label {
  font-size: 13px;
  color: rgb(var(--color-text));
}
```

- [ ] **Step 4：在 `index.ts` 中追加 export + 跑测试 + 提交**

```ts
export { Switch } from "./primitives/switch"
export type { SwitchProps } from "./primitives/switch"
```

```bash
pnpm --filter @tabora/ui test -- switch
git add packages/ui/src
git commit -m "feat(ui): add Switch primitive"
```

---

### Task 11：`SegmentedControl<V>`（基于 `@kobalte/core/toggle-group`，单选）

**Files:**

- Create: `packages/ui/src/primitives/segmentedControl.tsx`
- Create: `packages/ui/src/primitives/segmentedControl.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { SegmentedControl } from "./segmentedControl"

describe("SegmentedControl", () => {
  it("calls onChange when clicking another option", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <SegmentedControl<"S" | "M" | "L">
          value="M"
          onChange={onChange}
          aria-label="尺寸"
          options={[
            { value: "S", label: "S" },
            { value: "M", label: "M" },
            { value: "L", label: "L" },
          ]}
        />
      ),
      root,
    )
    const buttons = root.querySelectorAll("button")
    const second = [...buttons].find((b) => b.textContent === "S")!
    second.click()
    expect(onChange).toHaveBeenCalledWith("S")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export**

`packages/ui/src/primitives/segmentedControl.tsx`:

```tsx
import { ToggleGroup } from "@kobalte/core/toggle-group"
import type { JSX } from "solid-js"
import { For } from "solid-js"

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
  "aria-label": string
}

export function SegmentedControl<V extends string>(props: SegmentedControlProps<V>) {
  return (
    <ToggleGroup
      class="tabora-segmented"
      data-size={props.size ?? "md"}
      value={props.value}
      onChange={(v) => v && props.onChange(v as V)}
      aria-label={props["aria-label"]}
    >
      <For each={props.options}>
        {(opt) => (
          <ToggleGroup.Item class="tabora-segmented-item" value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </ToggleGroup.Item>
        )}
      </For>
    </ToggleGroup>
  )
}
```

`styles.css`：

```css
.tabora-segmented {
  display: inline-flex;
  border: 1px solid rgb(var(--color-line));
  border-radius: 8px;
  background: rgb(var(--color-surface));
  overflow: hidden;
}
.tabora-segmented-item {
  border: none;
  background: transparent;
  color: rgb(var(--color-muted));
  cursor: pointer;
  font: inherit;
}
.tabora-segmented[data-size="sm"] .tabora-segmented-item {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
}
.tabora-segmented[data-size="md"] .tabora-segmented-item {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}
.tabora-segmented-item:hover {
  background: rgba(var(--color-accent), 0.08);
  color: rgb(var(--color-accent));
}
.tabora-segmented-item[data-pressed] {
  background: rgba(var(--color-accent), 0.12);
  color: rgb(var(--color-accent));
}
.tabora-segmented-item:focus-visible {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: -2px;
}
.tabora-segmented-item[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}
```

`index.ts` 追加：

```ts
export { SegmentedControl } from "./primitives/segmentedControl"
export type { SegmentedControlProps, SegmentedControlOption } from "./primitives/segmentedControl"
```

- [ ] **Step 3：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- segmentedControl
git add packages/ui/src
git commit -m "feat(ui): add SegmentedControl primitive"
```

---

### Task 12：`Tabs`（基于 `@kobalte/core/tabs`）

**Files:**

- Create: `packages/ui/src/primitives/tabs.tsx`
- Create: `packages/ui/src/primitives/tabs.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Tabs } from "./tabs"

describe("Tabs", () => {
  it("invokes onChange when switching tab via click", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <Tabs
          value="a"
          onChange={onChange}
          aria-label="设置面板"
          tabs={[
            { value: "a", label: "插件", content: <p>a</p> },
            { value: "b", label: "外观", content: <p>b</p> },
          ]}
        />
      ),
      root,
    )
    const triggers = root.querySelectorAll("[role='tab']")
    ;(triggers[1] as HTMLElement).click()
    expect(onChange).toHaveBeenCalledWith("b")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export**

`packages/ui/src/primitives/tabs.tsx`:

```tsx
import { Tabs as KTabs } from "@kobalte/core/tabs"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: { value: string; label: JSX.Element; content: JSX.Element }[]
  "aria-label": string
}

export function Tabs(props: TabsProps) {
  return (
    <KTabs class="tabora-tabs" value={props.value} onChange={(v) => props.onChange(v)}>
      <KTabs.List class="tabora-tabs-list" aria-label={props["aria-label"]}>
        <For each={props.tabs}>
          {(tab) => (
            <KTabs.Trigger class="tabora-tabs-trigger" value={tab.value}>
              {tab.label}
            </KTabs.Trigger>
          )}
        </For>
        <KTabs.Indicator class="tabora-tabs-indicator" />
      </KTabs.List>
      <For each={props.tabs}>
        {(tab) => (
          <KTabs.Content class="tabora-tabs-content" value={tab.value}>
            {tab.content}
          </KTabs.Content>
        )}
      </For>
    </KTabs>
  )
}
```

`styles.css`：

```css
.tabora-tabs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tabora-tabs-list {
  display: inline-flex;
  gap: 8px;
  border-bottom: 1px solid rgb(var(--color-line));
  position: relative;
}
.tabora-tabs-trigger {
  border: none;
  background: transparent;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  color: rgb(var(--color-muted));
  cursor: pointer;
}
.tabora-tabs-trigger[data-selected] {
  color: rgb(var(--color-accent));
}
.tabora-tabs-trigger:focus-visible {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: -2px;
}
.tabora-tabs-indicator {
  position: absolute;
  bottom: -1px;
  height: 2px;
  background: rgb(var(--color-accent));
  transition: all 200ms ease;
}
.tabora-tabs-content {
  outline: none;
}
```

`index.ts` 追加：

```ts
export { Tabs } from "./primitives/tabs"
export type { TabsProps } from "./primitives/tabs"
```

- [ ] **Step 3：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- tabs
git add packages/ui/src
git commit -m "feat(ui): add Tabs primitive"
```

---

### Task 13：`Tooltip`（基于 `@kobalte/core/tooltip`）

**Files:**

- Create: `packages/ui/src/primitives/tooltip.tsx`
- Create: `packages/ui/src/primitives/tooltip.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`
- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Tooltip } from "./tooltip"

describe("Tooltip", () => {
  it("renders trigger child", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Tooltip content="删除">
          <button>x</button>
        </Tooltip>
      ),
      root,
    )
    expect(root.querySelector("button")!.textContent).toBe("x")
  })
})
```

- [ ] **Step 2：实现 + 样式**

`packages/ui/src/primitives/tooltip.tsx`:

```tsx
import { Tooltip as KTooltip } from "@kobalte/core/tooltip"
import type { JSX } from "solid-js"

export type TooltipPlacement = "top" | "bottom" | "left" | "right"

export type TooltipProps = {
  content: JSX.Element
  placement?: TooltipPlacement
  children: JSX.Element
}

export function Tooltip(props: TooltipProps) {
  return (
    <KTooltip placement={props.placement ?? "top"}>
      <KTooltip.Trigger as="span" class="tabora-tooltip-trigger">
        {props.children}
      </KTooltip.Trigger>
      <KTooltip.Portal>
        <KTooltip.Content class="tabora-tooltip-content">{props.content}</KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  )
}
```

`styles.css`：

```css
.tabora-tooltip-trigger {
  display: inline-flex;
}
.tabora-tooltip-content {
  background: rgb(var(--color-text));
  color: rgb(var(--color-surface));
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1200;
}
```

`index.ts` 追加：

```ts
export { Tooltip } from "./primitives/tooltip"
export type { TooltipProps, TooltipPlacement } from "./primitives/tooltip"
```

- [ ] **Step 3：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- tooltip
git add packages/ui/src
git commit -m "feat(ui): add Tooltip primitive"
```

---

## 阶段 C：辅助控件

### Task 14：`Badge`

**Files:**

- Create: `packages/ui/src/composites/badge.tsx`
- Create: `packages/ui/src/composites/badge.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Badge } from "./badge"

describe("Badge", () => {
  it("renders with variant attr", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Badge variant="accent">Demo</Badge>, root)
    const el = root.querySelector(".tabora-badge")!
    expect(el.getAttribute("data-variant")).toBe("accent")
    expect(el.textContent).toBe("Demo")
  })
})
```

- [ ] **Step 2：实现 + 样式**

`packages/ui/src/composites/badge.tsx`:

```tsx
import type { JSX } from "solid-js"

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger"

export type BadgeProps = {
  variant?: BadgeVariant
  children: JSX.Element
}

export function Badge(props: BadgeProps) {
  return (
    <span class="tabora-badge" data-variant={props.variant ?? "neutral"}>
      {props.children}
    </span>
  )
}
```

`styles.css`：

```css
.tabora-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}
.tabora-badge[data-variant="neutral"] {
  background: rgba(var(--color-line), 0.6);
  color: rgb(var(--color-muted));
}
.tabora-badge[data-variant="accent"] {
  background: rgba(var(--color-accent), 0.14);
  color: rgb(var(--color-accent));
}
.tabora-badge[data-variant="success"] {
  background: rgba(var(--color-accent), 0.18);
  color: rgb(var(--color-accent));
}
.tabora-badge[data-variant="warning"] {
  background: rgba(var(--tabora-danger), 0.1);
  color: rgb(var(--tabora-danger));
}
.tabora-badge[data-variant="danger"] {
  background: rgba(var(--tabora-danger), 0.16);
  color: rgb(var(--tabora-danger));
}
```

`index.ts` 追加：

```ts
export { Badge } from "./composites/badge"
export type { BadgeProps, BadgeVariant } from "./composites/badge"
```

- [ ] **Step 3：跑测试 + 提交**

```bash
pnpm --filter @tabora/ui test -- badge
git add packages/ui/src
git commit -m "feat(ui): add Badge composite"
```

---

### Task 15：`InlineError`

**Files:**

- Create: `packages/ui/src/composites/inlineError.tsx`
- Create: `packages/ui/src/composites/inlineError.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`
- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { InlineError } from "./inlineError"

describe("InlineError", () => {
  it("uses role=alert and renders content", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <InlineError>失败</InlineError>, root)
    const el = root.querySelector("[role='alert']")!
    expect(el.textContent).toBe("失败")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export + 测试 + 提交**

`packages/ui/src/composites/inlineError.tsx`:

```tsx
import type { JSX } from "solid-js"

export type InlineErrorProps = {
  children: JSX.Element
}

export function InlineError(props: InlineErrorProps) {
  return (
    <div class="tabora-inline-error" role="alert">
      {props.children}
    </div>
  )
}
```

`styles.css`：

```css
.tabora-inline-error {
  font-size: 12px;
  color: rgb(var(--tabora-danger));
  padding: 4px 0;
}
```

`index.ts` 追加：

```ts
export { InlineError } from "./composites/inlineError"
export type { InlineErrorProps } from "./composites/inlineError"
```

```bash
pnpm --filter @tabora/ui test -- inlineError
git add packages/ui/src
git commit -m "feat(ui): add InlineError composite"
```

---

### Task 16：`Spinner`

**Files:**

- Create: `packages/ui/src/composites/spinner.tsx`
- Create: `packages/ui/src/composites/spinner.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试 + 实现 + 样式 + export + 测试 + 提交**

`packages/ui/src/composites/spinner.test.tsx`:

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Spinner } from "./spinner"

describe("Spinner", () => {
  it("has role=status and default aria-label", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Spinner />, root)
    const el = root.querySelector("[role='status']")!
    expect(el.getAttribute("aria-label")).toBe("加载中")
  })
})
```

`packages/ui/src/composites/spinner.tsx`:

```tsx
export type SpinnerProps = {
  size?: "sm" | "md"
  "aria-label"?: string
}
export function Spinner(props: SpinnerProps) {
  return (
    <span
      class="tabora-spinner"
      data-size={props.size ?? "md"}
      role="status"
      aria-label={props["aria-label"] ?? "加载中"}
    />
  )
}
```

`styles.css`：

```css
.tabora-spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid rgba(var(--color-line), 0.6);
  border-top-color: rgb(var(--color-accent));
  animation: tabora-spin 700ms linear infinite;
}
.tabora-spinner[data-size="sm"] {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
}
.tabora-spinner[data-size="md"] {
  width: 16px;
  height: 16px;
}
@keyframes tabora-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tabora-spinner {
    animation: none;
  }
}
```

`index.ts` 追加：

```ts
export { Spinner } from "./composites/spinner"
export type { SpinnerProps } from "./composites/spinner"
```

```bash
pnpm --filter @tabora/ui test -- spinner
git add packages/ui/src
git commit -m "feat(ui): add Spinner composite"
```

---

### Task 17：`EmptyState`

**Files:**

- Create: `packages/ui/src/composites/emptyState.tsx`
- Create: `packages/ui/src/composites/emptyState.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { EmptyState } from "./emptyState"

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <EmptyState title="无待办" description="今天先写一件事" action={<button>添加</button>} />
      ),
      root,
    )
    expect(root.textContent).toContain("无待办")
    expect(root.textContent).toContain("今天先写一件事")
    expect(root.querySelector("button")!.textContent).toBe("添加")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export + 提交**

`packages/ui/src/composites/emptyState.tsx`:

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type EmptyStateProps = {
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
}
export function EmptyState(props: EmptyStateProps) {
  return (
    <div class="tabora-empty-state">
      <div class="tabora-empty-state-title">{props.title}</div>
      <Show when={props.description}>
        <div class="tabora-empty-state-desc">{props.description}</div>
      </Show>
      <Show when={props.action}>
        <div class="tabora-empty-state-action">{props.action}</div>
      </Show>
    </div>
  )
}
```

`styles.css`：

```css
.tabora-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  text-align: center;
}
.tabora-empty-state-title {
  font-size: 13px;
  color: rgb(var(--color-text));
}
.tabora-empty-state-desc {
  font-size: 12px;
  color: rgb(var(--color-muted));
}
.tabora-empty-state-action {
  margin-top: 4px;
}
```

`index.ts` 追加：

```ts
export { EmptyState } from "./composites/emptyState"
export type { EmptyStateProps } from "./composites/emptyState"
```

```bash
pnpm --filter @tabora/ui test -- emptyState
git add packages/ui/src
git commit -m "feat(ui): add EmptyState composite"
```

---

### Task 18：`ListRow`

**Files:**

- Create: `packages/ui/src/composites/listRow.tsx`
- Create: `packages/ui/src/composites/listRow.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { ListRow } from "./listRow"

describe("ListRow", () => {
  it("renders as button when onClick provided and triggers it", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(() => <ListRow primary="主标" secondary="副标" onClick={onClick} />, root)
    const btn = root.querySelector("button")!
    expect(btn).toBeTruthy()
    expect(btn.textContent).toContain("主标")
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders as div when no onClick", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <ListRow primary="x" />, root)
    expect(root.querySelector("button")).toBeNull()
    expect(root.querySelector(".tabora-list-row")!.tagName).toBe("DIV")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export + 提交**

`packages/ui/src/composites/listRow.tsx`:

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ListRowProps = {
  leading?: JSX.Element
  primary: JSX.Element
  secondary?: JSX.Element
  trailing?: JSX.Element
  onClick?: () => void
}

export function ListRow(props: ListRowProps) {
  const inner = (
    <>
      <Show when={props.leading}>
        <div class="tabora-list-row-leading">{props.leading}</div>
      </Show>
      <div class="tabora-list-row-main">
        <div class="tabora-list-row-primary">{props.primary}</div>
        <Show when={props.secondary}>
          <div class="tabora-list-row-secondary">{props.secondary}</div>
        </Show>
      </div>
      <Show when={props.trailing}>
        <div class="tabora-list-row-trailing">{props.trailing}</div>
      </Show>
    </>
  )

  return props.onClick ? (
    <button type="button" class="tabora-list-row" onClick={() => props.onClick?.()}>
      {inner}
    </button>
  ) : (
    <div class="tabora-list-row">{inner}</div>
  )
}
```

`styles.css`：

```css
.tabora-list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: rgb(var(--color-text));
  font: inherit;
  text-align: left;
  cursor: default;
}
button.tabora-list-row {
  cursor: pointer;
}
button.tabora-list-row:hover {
  background: rgba(var(--color-accent), 0.06);
  border-color: rgb(var(--color-line));
}
button.tabora-list-row:focus-visible {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: 2px;
}
.tabora-list-row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.tabora-list-row-primary {
  font-size: 13px;
  color: rgb(var(--color-text));
}
.tabora-list-row-secondary {
  font-size: 11px;
  color: rgb(var(--color-muted));
}
.tabora-list-row-trailing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

`index.ts` 追加：

```ts
export { ListRow } from "./composites/listRow"
export type { ListRowProps } from "./composites/listRow"
```

```bash
pnpm --filter @tabora/ui test -- listRow
git add packages/ui/src
git commit -m "feat(ui): add ListRow composite"
```

---

### Task 19：`CardSection`

**Files:**

- Create: `packages/ui/src/composites/cardSection.tsx`
- Create: `packages/ui/src/composites/cardSection.test.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles.css`

- [ ] **Step 1：写失败测试**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { CardSection } from "./cardSection"

describe("CardSection", () => {
  it("renders title and trailing", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <CardSection title="标题" trailing={<span data-testid="t">尾</span>}>
          内容
        </CardSection>
      ),
      root,
    )
    expect(root.textContent).toContain("标题")
    expect(root.querySelector("[data-testid='t']")!.textContent).toBe("尾")
    expect(root.textContent).toContain("内容")
  })
})
```

- [ ] **Step 2：实现 + 样式 + export + 提交**

`packages/ui/src/composites/cardSection.tsx`:

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean
  children: JSX.Element
}

export function CardSection(props: CardSectionProps) {
  return (
    <section class="tabora-card-section" data-padded={props.padded === false ? undefined : ""}>
      <Show when={props.title || props.trailing}>
        <header class="tabora-card-section-header">
          <Show when={props.title}>
            <h3 class="tabora-card-section-title">{props.title}</h3>
          </Show>
          <Show when={props.trailing}>
            <div class="tabora-card-section-trailing">{props.trailing}</div>
          </Show>
        </header>
      </Show>
      <div class="tabora-card-section-body">{props.children}</div>
    </section>
  )
}
```

`styles.css`：

```css
.tabora-card-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tabora-card-section[data-padded] {
  padding: 4px 0;
}
.tabora-card-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tabora-card-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--color-text));
}
.tabora-card-section-trailing {
  display: inline-flex;
  gap: 6px;
}
.tabora-card-section-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

`index.ts` 追加：

```ts
export { CardSection } from "./composites/cardSection"
export type { CardSectionProps } from "./composites/cardSection"
```

- [ ] **Step 3：跑全量测试 + check + 提交**

```bash
pnpm --filter @tabora/ui test
pnpm check
git add packages/ui/src
git commit -m "feat(ui): add CardSection composite"
```

Expected：单元测试全绿，`pnpm check` 通过。

---

## 阶段 D：迁移 widgets-productivity

### Task 20：迁移 `TodayFocusCard`

**Files:**

- Modify: `packages/official-plugins/package.json`
- Modify: `packages/official-plugins/src/widgets-productivity.tsx`
- [ ] **Step 1：在 `packages/official-plugins/package.json` `dependencies` 中追加 `@tabora/ui`**

把 dependencies 改为（保持其它字段顺序）：

```json
"dependencies": {
  "@tabora/platform-kernel": "workspace:*",
  "@tabora/plugin-api": "workspace:*",
  "@tabora/storage": "workspace:*",
  "@tabora/ui": "workspace:*",
  "solid-js": "catalog:ui"
}
```

- [ ] **Step 2：替换 `TodayFocusCard` 内部为 @tabora/ui 控件**

修改 `packages/official-plugins/src/widgets-productivity.tsx` 中的 `TodayFocusCard`：

```tsx
import { Field, Input, Checkbox } from "@tabora/ui"

type TodayFocusCardProps = {
  instanceId?: string
}

export function TodayFocusCard(props: TodayFocusCardProps = {}) {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)
  const instanceId = () => props.instanceId ?? "default"
  const contentKey = () => `today-focus:${instanceId()}:content`
  const doneKey = () => `today-focus:${instanceId()}:done`

  onMount(() => {
    const saved = localStorage.getItem(contentKey())
    const savedDone = localStorage.getItem(doneKey())
    if (saved) setFocus(saved)
    setDone(savedDone === "true")
  })

  function updateFocus(value: string) {
    setFocus(value)
    localStorage.setItem(contentKey(), value)
  }
  function updateDone(value: boolean) {
    setDone(value)
    localStorage.setItem(doneKey(), String(value))
  }
  const inputId = () => `today-focus-${instanceId()}`

  return (
    <div class="today-focus-widget">
      <Field label="今天最重要的一件事" htmlFor={inputId()}>
        <Input
          id={inputId()}
          value={focus()}
          onInput={updateFocus}
          placeholder="写下今日重点"
          aria-label="今日重点内容"
        />
      </Field>
      <Checkbox
        checked={done()}
        onChange={updateDone}
        aria-label="今日重点完成状态"
        label={done() ? "已完成" : "尚未完成"}
      />
    </div>
  )
}
```

> 注意：保留 `.today-focus-widget` 容器类作为局部布局壳；Field/Input/Checkbox 内部样式来自 `@tabora/ui`。

- [ ] **Step 3：`pnpm install` + 跑 build + e2e**

```bash
pnpm install
pnpm --filter @tabora/playground build
pnpm test
```

Expected：build 通过，e2e 与单测仍绿。

- [ ] **Step 4：提交**

```bash
git add packages/official-plugins pnpm-lock.yaml
git commit -m "refactor(widgets): migrate today-focus to @tabora/ui controls"
```

---

### Task 21：迁移 `QuickLinksCard`

**Files:**

- Modify: `packages/official-plugins/src/widgets-productivity.tsx`
- [ ] **Step 1：替换 `QuickLinksCard` 用 `ListRow`**

修改 `packages/official-plugins/src/widgets-productivity.tsx` 中的 `QuickLinksCard`：

```tsx
import { ListRow } from "@tabora/ui"

const QUICK_LINKS = [
  { title: "GitHub", url: "https://github.com" },
  { title: "Vite+", url: "https://viteplus.dev" },
] as const

export function QuickLinksCard() {
  return (
    <div class="quick-links">
      {QUICK_LINKS.map((link) => (
        <a class="quick-link-anchor" href={link.url} target="_blank" rel="noreferrer">
          <ListRow primary={link.title} secondary={link.url} />
        </a>
      ))}
    </div>
  )
}
```

> 备注：保留 `<a>` 语义以维持外部跳转（target=\_blank），不强行切成 button；`ListRow` 用作视觉排布；`.quick-link-anchor` 作为去除下划线的容器类，Step 2 在 `app.css` 中添加。

- [ ] **Step 2：在 `apps/playground/src/app.css` 中追加 `.quick-link-anchor`**

```css
.quick-link-anchor {
  display: block;
  color: inherit;
  text-decoration: none;
}
.quick-link-anchor:hover {
  text-decoration: none;
}
```

- [ ] **Step 3：`pnpm --filter @tabora/playground build` + 提交**

```bash
pnpm --filter @tabora/playground build
git add packages/official-plugins/src apps/playground/src/app.css
git commit -m "refactor(widgets): migrate quick-links to ListRow"
```

---

### Task 22：迁移 `NotesCard` 与 `NotesModal`

**Files:**

- Modify: `packages/official-plugins/src/widgets-productivity.tsx`

- [ ] **Step 1：替换 `NotesCard` 内部为 `Textarea`**

修改 `NotesCard`：

```tsx
import { Textarea } from "@tabora/ui"

export function NotesCard() {
  const [text, setText] = createSignal("")

  onMount(() => {
    const saved = localStorage.getItem("notes-content")
    if (saved) setText(saved)
  })

  function update(value: string) {
    setText(value)
    localStorage.setItem("notes-content", value)
  }

  return (
    <Textarea
      value={text()}
      onInput={update}
      placeholder="写点什么..."
      aria-label="便签内容"
      rows={4}
    />
  )
}
```

- [ ] **Step 2：替换 `NotesModal` 内部 `<textarea>` 为 `Textarea`**

```tsx
export function NotesModal() {
  const [text, setText] = createSignal("")
  onMount(() => {
    const saved = localStorage.getItem("notes-content")
    if (saved) setText(saved)
  })
  function update(value: string) {
    setText(value)
    localStorage.setItem("notes-content", value)
  }
  return (
    <div class="notes-modal">
      <h3>便签</h3>
      <Textarea
        value={text()}
        onInput={update}
        placeholder="尽情书写..."
        aria-label="便签弹窗内容"
        rows={12}
      />
    </div>
  )
}
```

- [ ] **Step 3：build + 提交**

```bash
pnpm --filter @tabora/playground build
git add packages/official-plugins/src
git commit -m "refactor(widgets): migrate notes card and modal to Textarea"
```

---

### Task 23：迁移 `WeatherCard`

**Files:**

- Modify: `packages/official-plugins/src/widget-weather.tsx`

- [ ] **Step 1：先读现有实现**

打开 `packages/official-plugins/src/widget-weather.tsx`，记录：

- 当前用了哪些容器/段落类。
- 是否有 demo 文案可挂 `Badge`。

- [ ] **Step 2：把卡片中的"demo / mock"标记和数据分区改用 `Badge` + `CardSection`**

具体改动：

- 在卡片顶部加 `<CardSection title={城市名} trailing={<Badge variant="warning">demo</Badge>}>`。
- 主要数据（温度、湿度、风速）作为 `CardSection` body 内容；不动业务逻辑（mock 数据、定时刷新）。
- 不动现有的 `lucide-solid` 图标。
- [ ] **Step 3：build + 提交**

```bash
pnpm --filter @tabora/playground build
git add packages/official-plugins/src
git commit -m "refactor(widgets): adopt CardSection and Badge in weather widget"
```

> 备注：weather 业务逻辑（mock 数据、城市配置、刷新）不在本轮范围；只做控件壳迁移。

---

## 阶段 E：迁移 todo + search + plugin-manager

### Task 24：迁移 `TodoCard`

**Files:**

- Modify: `packages/official-plugins/src/widget-todo.tsx`

- [ ] **Step 1：替换 `TodoCard` 实现**

```tsx
import { createSignal, For, Show } from "solid-js"
import { createPluginDataRepository, createTaboraDatabase } from "@tabora/storage"
import { Field, Input, IconButton, ListRow, Checkbox, EmptyState } from "@tabora/ui"

type TodoItem = { id: string; text: string; done: boolean }

const database = createTaboraDatabase()
const dataRepo = createPluginDataRepository(database)

export function TodoCard() {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [input, setInput] = createSignal("")

  void dataRepo.get<TodoItem[]>("todo", "items").then((saved: TodoItem[] | undefined) => {
    if (saved && saved.length > 0) setItems(saved)
  })

  async function persist(updated: TodoItem[]) {
    await dataRepo.save("todo", "items", updated)
  }
  async function addItem() {
    const text = input().trim()
    if (!text) return
    const next: TodoItem[] = [...items(), { id: crypto.randomUUID(), text, done: false }]
    setItems(next)
    setInput("")
    await persist(next)
  }

  async function toggleItem(id: string) {
    const next = items().map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    setItems(next)
    await persist(next)
  }

  async function removeItem(id: string) {
    const next = items().filter((i) => i.id !== id)
    setItems(next)
    await persist(next)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") void addItem()
  }

  const doneCount = () => items().filter((i) => i.done).length

  return (
    <div class="todo-widget">
      <Field label="新待办" htmlFor="todo-input">
        <div class="todo-input-row">
          <Input
            id="todo-input"
            value={input()}
            onInput={setInput}
            onKeyDown={handleKeyDown}
            placeholder="添加待办..."
            aria-label="新待办内容"
          />
          <IconButton aria-label="添加待办" variant="secondary" onClick={() => void addItem()}>
            +
          </IconButton>
        </div>
      </Field>
      <Show
        when={items().length > 0}
        fallback={<EmptyState title="还没有待办" description="今天先写一件事" />}
      >
        <ul class="todo-list">
          <For each={items()}>
            {(item) => (
              <li class="todo-item" classList={{ done: item.done }}>
                <ListRow
                  leading={
                    <Checkbox
                      checked={item.done}
                      onChange={() => void toggleItem(item.id)}
                      aria-label={`标记 ${item.text} 完成`}
                    />
                  }
                  primary={<span class="todo-item-text">{item.text}</span>}
                  trailing={
                    <IconButton
                      aria-label={`删除 ${item.text}`}
                      variant="danger"
                      size="sm"
                      onClick={() => void removeItem(item.id)}
                    >
                      ×
                    </IconButton>
                  }
                />
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={items().length > 0}>
        <div class="todo-footer">
          {doneCount()}/{items().length} 完成
        </div>
      </Show>
    </div>
  )
}
```

> 注意：`.todo-widget`、`.todo-list`、`.todo-item`、`.todo-input-row`、`.todo-item-text`、`.todo-footer` 这些**布局/状态类**保留；只删除已经不再写在 JSX 里的原子控件类（在 Task 27 集中清）。

- [ ] **Step 2：build + e2e**

```bash
pnpm --filter @tabora/playground build
pnpm test
```

Expected：build 通过；`workbenchDashboard.e2e.test.tsx` 中所有断言仍通过（包括尺寸选项、添加按钮存在、待办行渲染等）。如果 e2e 因 selector 变化失败（例如 `.todo-input` 变成 `.tabora-input`），需要在阶段 G 之后视情况调整 e2e 选择器；e2e 当前并未直接 query 这些类，故应不受影响。

- [ ] **Step 3：提交**

```bash
git add packages/official-plugins/src
git commit -m "refactor(widgets): migrate todo card to @tabora/ui controls"
```

---

### Task 25：迁移 `SearchCommandBar`

**Files:**

- Modify: `packages/official-plugins/src/search-command-bar.tsx`

- [ ] **Step 1：替换 `SearchCommandBar` 实现**

```tsx
import { createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { Input, Select, Button } from "@tabora/ui"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]

type ProviderId = "google" | "bing" | "baidu" | "duckduckgo" | "github"

const PROVIDERS: { value: ProviderId; label: string; url: string }[] = [
  { value: "google", label: "Google", url: "https://www.google.com/search?q={query}" },
  { value: "bing", label: "Bing", url: "https://www.bing.com/search?q={query}" },
  { value: "baidu", label: "百度", url: "https://www.baidu.com/s?wd={query}" },
  { value: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" },
  { value: "github", label: "GitHub", url: "https://github.com/search?q={query}" },
]
type SearchCommandBarProps = {
  openExternal?: (url: string) => void
}

export function SearchCommandBar(props: SearchCommandBarProps = {}) {
  const [query, setQuery] = createSignal("")
  const [providerId, setProviderId] = createSignal<ProviderId>("google")
  const [focused, setFocused] = createSignal(false)

  function doSearch(q: string) {
    const provider = PROVIDERS.find((p) => p.value === providerId())
    if (!provider) return
    const url = provider.url.replace("{query}", encodeURIComponent(q.trim()))
    props.openExternal?.(url)
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    const q = query().trim()
    if (!q) return
    doSearch(q)
    setQuery("")
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const q = query().trim()
      if (q) {
        doSearch(q)
        setQuery("")
      }
    }
  }

  function handleTagClick(tag: string) {
    setQuery(tag)
    doSearch(tag)
  }

  const showSuggestions = () => focused() && query().length === 0
  return (
    <div class="search-wrapper">
      <form class="search-bar" onSubmit={handleSubmit}>
        <Select<ProviderId>
          value={providerId()}
          options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) => setProviderId(v)}
          aria-label="搜索源"
          size="sm"
        />
        <Input
          value={query()}
          onInput={setQuery}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="输入搜索内容"
          aria-label="搜索内容"
          type="search"
        />
        <Button type="submit" variant="primary" size="sm">
          搜索
        </Button>
      </form>
      <Show when={showSuggestions()}>
        <div class="search-suggestions">
          <span class="suggestions-label">快捷搜索：</span>
          <For each={QUICK_TAGS}>
            {(tag) => (
              <Button variant="ghost" size="sm" onClick={() => handleTagClick(tag)}>
                {tag}
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
```

> 备注：`officialSearchCommandBar` plugin 定义不变；只改了 view 函数内部实现。

- [ ] **Step 2：build + e2e**

```bash
pnpm --filter @tabora/playground build
pnpm test
```

Expected：build 通过；e2e `topbar: !!document.querySelector(".topbar .search-bar")` 仍能匹配（`.search-bar` 容器类保留）。

- [ ] **Step 3：提交**

```bash
git add packages/official-plugins/src
git commit -m "refactor(search): migrate command bar to @tabora/ui controls"
```

---

### Task 26：迁移 `PluginManagerCard`

**Files:**

- Modify: `packages/official-plugins/src/plugin-manager.tsx`

- [ ] **Step 1：替换实现**

```tsx
import { CardSection, ListRow, Badge } from "@tabora/ui"
import { officialPlugins } from "./index"

export function PluginManagerCard() {
  return (
    <CardSection title="官方插件">
      <ul class="plugin-list">
        {officialPlugins.map((plugin) => {
          const extensions: string[] = []
          const c = plugin.manifest.contributes
          if (c.layouts?.length) extensions.push("布局")
          if (c.widgets?.length) extensions.push(`卡片 (${c.widgets.length})`)
          if (c.searches?.length) extensions.push("搜索")
          if (c.searchProviders?.length) extensions.push("搜索源")
          if (c.backgroundProviders?.length) extensions.push("背景")
          if (c.backgroundRenderers?.length) extensions.push("背景渲染")
          if (c.themes?.length) extensions.push("主题")
          if (c.settingsPanels?.length) extensions.push("设置")
          return (
            <li class="plugin-item">
              <ListRow
                primary={plugin.manifest.name}
                secondary={
                  <span>
                    <span class="plugin-id-mono">{plugin.manifest.id}</span>
                    {extensions.length > 0 ? <span> · {extensions.join(" · ")}</span> : null}
                  </span>
                }
                trailing={
                  <Badge variant={plugin.enabled ? "accent" : "neutral"}>
                    {plugin.enabled ? "已启用" : "已禁用"}
                  </Badge>
                }
              />
            </li>
          )
        })}
      </ul>
    </CardSection>
  )
}
```

- [ ] **Step 2：在 `apps/playground/src/app.css` 中追加 `.plugin-id-mono`**

```css
.plugin-id-mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 11px;
  color: rgb(var(--color-muted));
}
```

> 备注：保留 `.plugin-list`、`.plugin-item` 容器类；旧的 `.plugin-name` / `.plugin-id` / `.plugin-extensions` / `.plugin-status` 已不再被 JSX 引用，由 Task 27 在 app.css 中删除。

- [ ] **Step 3：build + 提交**

```bash
pnpm --filter @tabora/playground build
git add packages/official-plugins/src apps/playground/src/app.css
git commit -m "refactor(plugin-manager): migrate to ListRow + Badge"
```

---

## 阶段 F：清理与文档同步

### Task 27：清理 `apps/playground/src/app.css` 中已替换的原子控件类

**Files:**

- Modify: `apps/playground/src/app.css`

- [ ] **Step 1：grep 确认目标 class 在 JSX 与 CSS 中的引用情况**

```bash
for cls in todo-input todo-add-btn todo-del-btn todo-label todo-text \
           notes-textarea notes-modal-textarea \
           today-focus-input today-focus-label today-focus-done \
           search-provider search-input suggestion-tag \
           plugin-name plugin-id plugin-extensions plugin-status; do
  echo "=== $cls ===";
  rg -n "\b$cls\b" apps packages || true;
done
```

Expected：JSX (`.tsx`) 中不再出现这些类；只有 `apps/playground/src/app.css` 命中。如果某个类还在 JSX 命中，回到对应迁移 task 检查是否有遗漏，不要删该类。

- [ ] **Step 2：从 `apps/playground/src/app.css` 中删除以下 class 的样式块（含 hover/focus 等修饰符）**

逐个 grep 行号，使用 Edit 删除整段（包括注释行紧贴上下时，仅删 selector 块本体）：

- `.todo-input`、`.todo-input:focus`
- `.todo-add-btn`、`.todo-add-btn:hover`
- `.todo-del-btn`、`.todo-del-btn:hover`、`.todo-item:hover .todo-del-btn`
- `.todo-label`、`.todo-label input[type="checkbox"]`
- `.todo-text`、`.todo-item.done .todo-text`
- `.notes-textarea`、`.notes-textarea::placeholder`
- `.notes-modal-textarea`、`.notes-modal-textarea:focus`
- `.search-provider`、`.search-input`、`.search-provider, .search-input`、移动端 media query 中的 `.search-provider`
- `.suggestion-tag`、`.suggestion-tag:hover`
- `.plugin-name`、`.plugin-id`、`.plugin-extensions`
- `.plugin-status`、`.plugin-status.enabled`

  > 不要删的容器/布局类：`.todo-widget`、`.todo-input-row`、`.todo-list`、`.todo-item`、`.todo-item.done`、`.todo-item-text`、`.todo-footer`、`.notes-modal`、`.search-wrapper`、`.search-bar`、`.search-suggestions`、`.suggestions-label`、`.plugin-manager`、`.plugin-list`、`.plugin-item`、`.plugin-info`、`.quick-links`、`.today-focus-widget`、`.workbench-grid`、`.widget-card`、`.workbench-rail` 等。

- [ ] **Step 3：build + check + e2e**

```bash
pnpm --filter @tabora/playground build
pnpm check
pnpm test
```

Expected：build 通过、`pnpm check` 通过（含 lint typecheck）、e2e + 单测全绿。

- [ ] **Step 4：提交**

```bash
git add apps/playground/src/app.css
git commit -m "chore(playground): drop deprecated atomic control styles"
```

---

### Task 28：更新 `docs/product/tabora-design-system.md`

**Files:**

- Modify: `docs/product/tabora-design-system.md`

- [ ] **Step 1：把 `@tabora/ui` 状态从 P0 待建改为 MVP 已交付**

打开 `docs/product/tabora-design-system.md`，搜索"P0 待建"或"@tabora/ui"章节，把状态描述改为：

> `@tabora/ui` 已作为 MVP 基础组件包交付，包含 `Button` / `IconButton` / `Input` / `Textarea` / `Select` / `Checkbox` / `Switch` / `SegmentedControl` / `Tabs` / `Tooltip` / `Field` / `Badge` / `InlineError` / `Spinner` / `EmptyState` / `ListRow` / `CardSection` 17 个内容区控件，基于 `@kobalte/core` 提供 a11y 底层，使用 theme token 作为视觉契约。
> 在所有"P0 待建"出现的地方逐处确认是否还在描述 `@tabora/ui`；是的则改为"MVP 已交付"，并在合适处补充"基于 `@kobalte/core` 实现"说明。

- [ ] **Step 2：`pnpm check` + 提交**

```bash
pnpm check
git add docs/product/tabora-design-system.md
git commit -m "docs(design-system): mark @tabora/ui as delivered"
```

---

### Task 29：更新 `docs/technical/tabora-plugin-workbench-technical-design.md`

**Files:**

- Modify: `docs/technical/tabora-plugin-workbench-technical-design.md`

- [ ] **Step 1：把 `@tabora/ui` 章节状态改为已交付**

定位 §6.6（`@tabora/ui` 章节）和总体架构图中提到 P0 待建的位置，更新表述：

> `@tabora/ui` 当前状态：已交付。位于 `packages/ui`，依赖 `solid-js` + `@tabora/theme` + `@kobalte/core`，提供 17 个内容区基础控件。MVP 范围内官方插件（productivity、todo、search-command-bar、plugin-manager）已迁移到该包。

并在仓库结构示例中把 `packages/ui` 从"P0 规划中但当前尚未落地"挪到现有结构。

- [ ] **Step 2：`pnpm check` + 提交**

```bash
pnpm check
git add docs/technical/tabora-plugin-workbench-technical-design.md
git commit -m "docs(technical): record @tabora/ui delivery and Kobalte dependency"
```

---

### Task 30：更新 `docs/product/tabora-official-plugins-design.md`

**Files:**

- Modify: `docs/product/tabora-official-plugins-design.md`
- [ ] **Step 1：在第 3.5 节（控件语言与 `@tabora/ui`）中，把"应新增"等待建表述改为已交付**

把 §3.5 的开头段改写为：

> `@tabora/ui` 已作为 MVP 基础组件包交付，目标是统一插件内容区控件的视觉、状态、可访问性和 theme token 使用方式。

并在矩阵备注（§4 官方插件矩阵）的 productivity / todo / search-command-bar / plugin-manager 行追加："已使用 `@tabora/ui` 控件"。

- [ ] **Step 2：`pnpm check` + 提交**

```bash
pnpm check
git add docs/product/tabora-official-plugins-design.md
git commit -m "docs(official-plugins): note @tabora/ui adoption in widgets"
```

---

### Task 31：更新 `AGENTS.md`

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1：把 `packages/ui` 从"P0 规划中"挪到"工程结构"**

打开 `AGENTS.md`，在「工程结构」的代码块中追加 `packages/ui`：

```txt
packages/
  ...
  ui/
    src/
      index.ts
      styles.css
      tokens.ts
      primitives/
      composites/
```

并删除「P0 规划中但当前尚未落地」中关于 `packages/ui` 的整段。

- [ ] **Step 2：在「架构边界 → @tabora/ui」章节把"P0 待建"改为"已交付"**
      把：

```md
### `@tabora/ui`

P0 待建。目标是负责插件内容区基础组件...
```

改为：

```md
### `@tabora/ui`

已交付。位于 `packages/ui`，负责插件内容区基础组件，统一官方插件和未来第三方插件的控件视觉、状态和可访问性。基于 `@kobalte/core` 提供 a11y 底层。

允许依赖：

- `solid-js`（catalog:ui）
- `@tabora/theme`
- `@kobalte/core`（catalog:ui）

禁止依赖：

- `@tabora/platform-kernel`
- `@tabora/storage`
- `@tabora/official-plugins`
- `apps/playground`
```

- [ ] **Step 3：`pnpm check` + 提交**

```bash
pnpm check
git add AGENTS.md
git commit -m "docs(agents): mark @tabora/ui as delivered package"
```

---

## 阶段 G：终验

### Task 32：终验

**Files:**

- 不修改源码（除非验证发现问题）。
- [ ] **Step 1：跑完整测试**

```bash
pnpm test
```

Expected：所有包单元测试 + e2e 通过。

- [ ] **Step 2：跑静态检查**

```bash
pnpm check
```

Expected：通过。

- [ ] **Step 3：跑生产构建**

```bash
pnpm build
```

Expected：所有包（含 `@tabora/ui`）通过 `vp pack`，playground 通过 `vite build`。

- [ ] **Step 4：边界 grep**

```bash
rg -nE "#[0-9a-fA-F]{3,8}" packages/ui/src
```

Expected：除注释 / 极少必要字面量（如 `--tabora-danger: 192 57 43;` 这是 rgb 三元组而非 hex，不应命中），无控件规则中的硬编码颜色字面量。

```bash
rg -nE "WidgetCard|FullscreenHost|SettingsHost|WorkbenchRail|WorkbenchGrid" packages/ui/src
```

Expected：0 命中。

```bash
rg -nE "@tabora/(platform-kernel|storage|official-plugins)" packages/ui/src packages/ui/package.json
```

Expected：0 命中。

- [ ] **Step 5：启动 playground 浏览器手测**

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

打开 `http://127.0.0.1:5173`，按 spec §8 浏览器关键路径分别在 `official.theme.light` 与 `official.theme.dark` 主题下走一遍：

- 默认首屏渲染：rail + topbar + 主网格四张默认卡片可见。
- 添加 widget：从 add-widget 栏添加，新卡片立即出现且尺寸正确。
- 调整尺寸：playground 自身的 size `<select>` 仍工作（本轮不迁宿主控件）。
- 拖拽排序：跨卡片拖拽，刷新后顺序保留。
- 打开便签 modal：`Textarea` 在 modal 中可编辑、保存、关闭。
- 切换主题：所有 `@tabora/ui` 控件颜色随 token 切换，无遗漏 hardcoded 色。
- 切换背景：背景层切换不影响卡片可读性。
- 提交搜索：`Select` + `Input` + 快捷标签 `Button` 均工作，外部打开走权限桥。
- 键盘可达：Tab 顺序覆盖所有 `@tabora/ui` 控件，`focus-visible` 在两套主题下都清晰。

如发现回退或样式问题，回到对应 task 修复，再回到 Task 32 重跑。

- [ ] **Step 6：清理 dev server 进程，无源码改动则无需提交**

如本 task 中有任何修复，单独按修复内容提交，不与终验 step 合并。

---

## Self-Review Notes

- Spec coverage：
  - 17 个控件 → Task 3-19。
  - 3 个官方插件迁移 → Task 20-26（productivity 含 today-focus / quick-links / notes / weather；todo 单独；search-command-bar；plugin-manager）。
  - 4 份事实源文档 → Task 28-31。
  - 边界不变量、grep 验收 → Task 32 Step 4。
  - 浏览器关键路径 → Task 32 Step 5。
- Placeholder scan：每个代码改动 step 含可直接复制的代码或精确 selector；不含 TBD/TODO。
- Type consistency：
  - `Select<V>` / `SegmentedControl<V>` 在 Task 8 / Task 11 中签名一致，并在 Task 25（search）使用 `Select<ProviderId>`。
  - `IconButton` 强制 `aria-label`，在 Task 24（todo）的 `+` 与 `×` 处与 Task 26（plugin manager）的 trailing badge 用法一致。
  - `Field` 的 `htmlFor` 在 Task 20、Task 24 中正确连到内部 `Input` 的 `id`。
  - `--tabora-danger` 在 Task 3、4、5、6、14、15 的 styles 中被引用，定义在 Task 3 的 `:root`。
- 已知 follow-up（不在本 plan 范围）：
  - Settings host 与 `settings-panel` 协议落地。
  - background-provider / search-provider 真正接管 playground 硬编码列表。
  - notes / todo 数据按 instanceId 隔离迁到 plugin data。
  - playground 宿主级控件统一收口（toolbar / size select / add-widget bar / modal close / widget header）。
