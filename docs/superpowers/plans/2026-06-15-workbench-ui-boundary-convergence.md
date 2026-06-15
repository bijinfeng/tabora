# workbench 宿主与 `@tabora/ui` 边界收敛实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在不迁移宿主壳职责的前提下，把第一批低层复用块收敛到 `@tabora/ui`，并让 workbench overlays 与 workspace settings 开始消费这些复用单元。

**架构：** 优先复用 `@tabora/ui` 里已经存在的 `ListRow`、`Field`、`EmptyState`、`InlineError`、`Switch`，只新增一个专门服务设置类布局的 `FieldRow`，并给现有 `ListRow` 增加 danger / selected / divider 等状态能力。宿主层继续保留 modal、context menu、settings host 和 widget runtime 编排，只把重复的行项、字段行和状态块替换成 `@tabora/ui` 消费。

**技术栈：** SolidJS、TypeScript、`@tabora/ui`、Vitest、pnpm workspace、真实浏览器回归

---

## 文件结构

**创建：**

- `packages/ui/src/primitives/fieldRow/fieldRow.tsx`：定义设置类字段行 primitive
- `packages/ui/src/primitives/fieldRow/fieldRow.test.tsx`：覆盖 `FieldRow` 的 label / description / trailing / helper 契约
- `packages/ui/src/primitives/fieldRow/index.ts`：导出 `FieldRow`
- `packages/ui/src/styled/fieldRow/fieldRow.styled.tsx`：提供带样式的 `FieldRow`
- `packages/ui/src/styled/fieldRow/index.ts`：导出 styled `FieldRow`
- `packages/ui/src/styled/fieldRow/styles.css`：字段行样式

**修改：**

- `packages/ui/src/primitives/listRow/listRow.tsx`：补充 `danger`、`selected`、`interactive`、`aria-pressed` 等状态
- `packages/ui/src/primitives/listRow/listRow.test.tsx`：锁定新增状态属性和交互契约
- `packages/ui/src/styled/listRow/listRow.styled.tsx`：透传新增 props
- `packages/ui/src/styled/listRow/styles.css`：补充 interactive / danger / selected 样式
- `packages/ui/src/index.ts`：导出 `FieldRow` 并继续暴露 `ListRow`
- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`：改为消费 `ListRow`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`：改为消费 `ListRow`
- `packages/official-plugins/src/settings-workspace.shared.tsx`：删除手搓 `SettingsInlineError` / `SettingsSwitch`，改用 `InlineError`、`Switch`
- `packages/official-plugins/src/settings-workspace.search.tsx`：用 `ListRow` + `Switch` + `InlineError` 重写搜索源列表
- `packages/official-plugins/src/settings-workspace.appearance.tsx`：用 `FieldRow` 包装语言选择行
- `packages/official-plugins/src/settings-workspace.workbench.tsx`：用 `FieldRow` 与 `InlineError` 重写当前工作区、创建工作区与导入报错块
- `packages/workbench-shell/src/settingsHost.tsx`：把 empty / panel missing fallback 改成 `EmptyState` / `InlineError`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`：补充 overlay 消费 `ListRow` 后的最小行为回归
- `packages/official-plugins/src/settings-workspace.test.tsx`：补充 settings 行为回归
- `packages/workbench-shell/src/settingsHost.test.tsx`：补充状态块替换后的回归

**验证：**

- `pnpm --filter @tabora/ui test -- listRow`
- `pnpm --filter @tabora/ui test -- fieldRow`
- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`
- `pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`
- `pnpm --filter @tabora/workbench-shell test -- settingsHost.test.tsx`
- `pnpm test`
- `pnpm check`

## 任务 1：先给 `@tabora/ui` 补齐 `FieldRow` 与 `ListRow` 状态能力

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/ui/src/primitives/fieldRow/fieldRow.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/ui/src/primitives/fieldRow/fieldRow.test.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/ui/src/primitives/fieldRow/index.ts`
- 创建：`/home/kebai/桌面/tabora/packages/ui/src/styled/fieldRow/fieldRow.styled.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/ui/src/styled/fieldRow/index.ts`
- 创建：`/home/kebai/桌面/tabora/packages/ui/src/styled/fieldRow/styles.css`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/primitives/listRow/listRow.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/primitives/listRow/listRow.test.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/listRow/listRow.styled.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/listRow/styles.css`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/index.ts`

- [ ] **步骤 1：先写 `FieldRow` 的失败测试**

创建 `packages/ui/src/primitives/fieldRow/fieldRow.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { FieldRow } from "./fieldRow"

describe("FieldRow", () => {
  it("renders label, description, trailing and helper", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <FieldRow
          label="当前语言"
          description="影响工作台宿主文案和官方插件面板文案"
          helper="会写入当前工作区外观配置"
          trailing={<button type="button">切换</button>}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("当前语言")
    expect(root.textContent).toContain("影响工作台宿主文案")
    expect(root.textContent).toContain("会写入当前工作区外观配置")
    expect(root.querySelector("button")?.textContent).toBe("切换")
  })

  it("renders as compact row without helper when helper is omitted", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <FieldRow label="当前工作区" trailing={<span>默认</span>} />, root)

    expect(root.textContent).toContain("当前工作区")
    expect(root.textContent).toContain("默认")
    expect(root.querySelector(".tbr-field-row-helper")).toBeNull()
  })
})
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm --filter @tabora/ui test -- fieldRow`

预期：FAIL，报错 `./fieldRow` 模块不存在。

- [ ] **步骤 3：实现 `FieldRow` primitive 与 styled 包装**

创建 `packages/ui/src/primitives/fieldRow/fieldRow.tsx`：

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldRowProps = {
  label: JSX.Element
  description?: JSX.Element
  helper?: JSX.Element
  trailing?: JSX.Element
  class?: string
}

export function FieldRow(props: FieldRowProps) {
  return (
    <div class={props.class}>
      <div class="tbr-field-row-main">
        <div class="tbr-field-row-info">
          <div class="tbr-field-row-label">{props.label}</div>
          <Show when={props.description}>
            <div class="tbr-field-row-description">{props.description}</div>
          </Show>
        </div>
        <Show when={props.trailing}>
          <div class="tbr-field-row-trailing">{props.trailing}</div>
        </Show>
      </div>
      <Show when={props.helper}>
        <div class="tbr-field-row-helper">{props.helper}</div>
      </Show>
    </div>
  )
}
```

创建 `packages/ui/src/primitives/fieldRow/index.ts`：

```ts
export { FieldRow } from "./fieldRow"
export type { FieldRowProps } from "./fieldRow"
```

创建 `packages/ui/src/styled/fieldRow/fieldRow.styled.tsx`：

```tsx
import { FieldRow as Primitive } from "../../primitives/fieldRow/fieldRow"
import type { FieldRowProps } from "../../primitives/fieldRow/fieldRow"
import "./styles.css"

export function FieldRow(props: FieldRowProps) {
  return <Primitive {...props} class="tbr-field-row" />
}

export type { FieldRowProps }
```

创建 `packages/ui/src/styled/fieldRow/index.ts`：

```ts
export { FieldRow } from "./fieldRow.styled"
export type { FieldRowProps } from "./fieldRow.styled"
```

创建 `packages/ui/src/styled/fieldRow/styles.css`：

```css
.tbr-field-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
}

.tbr-field-row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tbr-field-row-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.tbr-field-row-label {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--tabora-fg-primary));
}

.tbr-field-row-description,
.tbr-field-row-helper {
  font-size: 12px;
  color: rgb(var(--tabora-fg-secondary));
}

.tbr-field-row-trailing {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}
```

- [ ] **步骤 4：扩展 `ListRow` 的状态契约**

将 `packages/ui/src/primitives/listRow/listRow.tsx` 改为：

```tsx
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ListRowProps = {
  leading?: JSX.Element
  primary: JSX.Element
  secondary?: JSX.Element
  trailing?: JSX.Element
  onClick?: () => void
  divider?: boolean
  danger?: boolean
  selected?: boolean
  interactive?: boolean
  class?: string
}

export function ListRow(props: ListRowProps) {
  const isInteractive = () => props.interactive ?? Boolean(props.onClick)
  const inner = (
    <>
      <Show when={props.leading}>
        <div class="tbr-list-row-leading">{props.leading}</div>
      </Show>
      <div class="tbr-list-row-main">
        <div class="tbr-list-row-primary">{props.primary}</div>
        <Show when={props.secondary}>
          <div class="tbr-list-row-secondary">{props.secondary}</div>
        </Show>
      </div>
      <Show when={props.trailing}>
        <div class="tbr-list-row-trailing">{props.trailing}</div>
      </Show>
    </>
  )

  return props.onClick ? (
    <button
      type="button"
      class={props.class}
      data-divider={props.divider ? "" : undefined}
      data-danger={props.danger ? "" : undefined}
      data-selected={props.selected ? "" : undefined}
      data-interactive={isInteractive() ? "" : undefined}
      aria-pressed={props.selected ? true : undefined}
      onClick={() => props.onClick?.()}
    >
      {inner}
    </button>
  ) : (
    <div
      class={props.class}
      data-divider={props.divider ? "" : undefined}
      data-danger={props.danger ? "" : undefined}
      data-selected={props.selected ? "" : undefined}
      data-interactive={isInteractive() ? "" : undefined}
    >
      {inner}
    </div>
  )
}
```

将 `packages/ui/src/styled/listRow/styles.css` 追加：

```css
.tbr-list-row[data-interactive] {
  cursor: pointer;
}

.tbr-list-row[data-interactive]:hover {
  border-color: rgb(var(--tabora-border-secondary));
  background: rgb(var(--tabora-surface-hover));
}

.tbr-list-row[data-selected] {
  border-color: rgb(var(--tabora-brand-500));
  background: rgb(var(--tabora-brand-soft));
}

.tbr-list-row[data-danger] .tbr-list-row-primary {
  color: rgb(var(--tabora-danger-500));
}
```

- [ ] **步骤 5：补 `ListRow` 状态测试**

在 `packages/ui/src/primitives/listRow/listRow.test.tsx` 追加：

```tsx
it("exposes selected and danger state via data attributes", () => {
  const root = document.createElement("div")
  document.body.appendChild(root)

  render(() => <ListRow primary="删除实例" selected danger onClick={() => {}} />, root)

  const button = root.querySelector("button")
  expect(button?.dataset.selected).toBe("")
  expect(button?.dataset.danger).toBe("")
  expect(button?.getAttribute("aria-pressed")).toBe("true")
})
```

- [ ] **步骤 6：导出并跑组件测试**

在 `packages/ui/src/index.ts` 追加：

```ts
export { FieldRow } from "./styled/fieldRow"
export type { FieldRowProps } from "./styled/fieldRow"
```

运行：

- `pnpm --filter @tabora/ui test -- fieldRow`
- `pnpm --filter @tabora/ui test -- listRow`

预期：PASS。

- [ ] **步骤 7：提交 `@tabora/ui` 第一批底层扩展**

```bash
git add \
  packages/ui/src/primitives/fieldRow \
  packages/ui/src/styled/fieldRow \
  packages/ui/src/primitives/listRow/listRow.tsx \
  packages/ui/src/primitives/listRow/listRow.test.tsx \
  packages/ui/src/styled/listRow/listRow.styled.tsx \
  packages/ui/src/styled/listRow/styles.css \
  packages/ui/src/index.ts
git commit -m "feat(ui): add field row and list row states"
```

## 任务 2：让 add-widget 与右键菜单改用 `ListRow`

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

- [ ] **步骤 1：先为 overlay 行项补回归测试**

在 `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx` 追加断言：

```tsx
it("renders add-widget and context-menu rows through the host overlays", () => {
  const root = document.createElement("div")
  document.body.appendChild(root)

  render(
    () => (
      <WorkbenchShellSurfaceHost
        addWidgetOpen
        availableWidgets={[
          {
            pluginId: "official.widget.todo",
            id: "todo",
            icon: "✓",
            title: "待办",
            description: "记录当天任务",
          },
        ]}
        widgetIconLabel={(icon) => icon ?? "•"}
        ctxMenu={{ x: 12, y: 12, instanceId: "todo-1" }}
        ctxSections={[
          {
            items: [{ label: "移除实例", danger: true, run: vi.fn() }],
          },
        ]}
        {...createSurfaceHostProps()}
      />
    ),
    root,
  )

  expect(root.textContent).toContain("待办")
  expect(root.textContent).toContain("记录当天任务")
  expect(root.textContent).toContain("移除实例")
})
```

- [ ] **步骤 2：运行测试确认当前实现仍然通过**

运行：`pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`

预期：PASS，作为迁移前基线。

- [ ] **步骤 3：把 add-widget 列表替换成 `ListRow`**

把 `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx` 改成：

```tsx
import { ListRow } from "@tabora/ui"
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"

export function WorkbenchAddWidgetModal(props: {
  open: boolean
  availableWidgets: AvailableWidget[]
  widgetIconLabel: (icon?: string) => string
  tShell?: ShellTranslation
  onAdd: (pluginId: string, widgetId: string) => void
  onClose: () => void
}) {
  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-container" onClick={(event) => event.stopPropagation()}>
          <div class="modal-title">{props.tShell?.("chrome.addWidget.title") ?? "添加卡片"}</div>
          <div class="modal-body">
            <For each={props.availableWidgets}>
              {(widget) => (
                <ListRow
                  leading={
                    <span class="add-widget-modal-icon">{props.widgetIconLabel(widget.icon)}</span>
                  }
                  primary={<div class="add-widget-modal-name">{widget.title}</div>}
                  secondary={<div class="add-widget-modal-desc">{widget.description}</div>}
                  interactive
                  onClick={() => props.onAdd(widget.pluginId, widget.id)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}
```

- [ ] **步骤 4：把右键菜单替换成 `ListRow`**

把 `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx` 改成：

```tsx
import { ListRow } from "@tabora/ui"
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { WidgetContextSection } from "./WorkbenchShellChrome.types"

export function WorkbenchContextMenuOverlay(props: {
  menu: { x: number; y: number; instanceId: string } | null
  sections: WidgetContextSection[]
  tShell?: ShellTranslation
  onClose: () => void
}) {
  return (
    <Show when={props.menu}>
      {(menu) => (
        <div class="ctx-menu-overlay" onClick={props.onClose}>
          <div class="ctx-menu-panel" style={{ left: `${menu().x}px`, top: `${menu().y}px` }}>
            <For each={props.sections}>
              {(section, sectionIndex) => (
                <>
                  <Show when={sectionIndex() > 0}>
                    <hr class="ctx-menu-sep" />
                  </Show>
                  <For each={section.items}>
                    {(item) => (
                      <ListRow
                        primary={item.label}
                        trailing={
                          <Show when={item.isCurrent}>
                            <span class="ctx-menu-check">
                              {props.tShell?.("chrome.contextMenu.current") ?? "当前"}
                            </span>
                          </Show>
                        }
                        danger={item.danger}
                        interactive
                        selected={item.isCurrent}
                        onClick={() => {
                          item.run()
                          props.onClose()
                        }}
                      />
                    )}
                  </For>
                </>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  )
}
```

- [ ] **步骤 5：回归测试并提交**

运行：`pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`

预期：PASS。

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx \
  packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx
git commit -m "refactor(workbench-app): adopt ui list rows in overlays"
```

## 任务 3：把 workspace settings 的共享控件换成 `@tabora/ui`

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.shared.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.search.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.test.tsx`

- [ ] **步骤 1：先补 workspace settings 的失败测试**

在 `packages/official-plugins/src/settings-workspace.test.tsx` 追加：

```tsx
it("renders provider rows with current marker and toggle switch", () => {
  const root = document.createElement("div")
  document.body.appendChild(root)

  render(() => <SearchSettingsPanel {...createSettingsPanelProps()} />, root)

  expect(root.textContent).toContain("默认搜索引擎")
  expect(root.textContent).toContain("✓ 当前")
  expect(root.querySelector('[aria-label="禁用 Google"]')).toBeTruthy()
})
```

- [ ] **步骤 2：运行测试确认基线通过**

运行：`pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`

预期：PASS。

- [ ] **步骤 3：删除手搓 `SettingsInlineError` / `SettingsSwitch`**

把 `packages/official-plugins/src/settings-workspace.shared.tsx` 改成：

```tsx
export { InlineError as SettingsInlineError, Switch as SettingsSwitch } from "@tabora/ui"

import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function providerShortcut(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return provider.shortcut ?? `@${provider.id.split(".").at(-1) ?? provider.id}`
}

export function providerAlias(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return providerShortcut(provider).startsWith("@")
    ? providerShortcut(provider)
    : `@${providerShortcut(provider)}`
}

export function providerKindLabel(provider: SettingsPanelViewProps["searchProviders"][number]) {
  if (provider.id.includes("github")) return "代码"
  return "搜索"
}
```

- [ ] **步骤 4：用 `ListRow` + `Switch` 重写搜索源列表**

把 `packages/official-plugins/src/settings-workspace.search.tsx` 中 provider list 段改成：

```tsx
import { ListRow } from "@tabora/ui"
import { createMemo, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

import {
  providerAlias,
  providerKindLabel,
  SettingsInlineError,
  SettingsSwitch,
} from "./settings-workspace.shared"

// 保留前置 memo 和 handleToggle，不变
;<div class="settings-provider-list" id="settings-search-provider-select">
  <For each={props.searchProviders}>
    {(provider) => {
      const isEnabled = () => enabledIds().includes(provider.id)
      const isDefault = () => provider.id === defaultId()
      return (
        <ListRow
          leading={<span class="search-provider-kind">{providerKindLabel(provider)}</span>}
          primary={<span class="search-provider-title">{provider.title}</span>}
          secondary={<span class="search-provider-alias">{providerAlias(provider)}</span>}
          trailing={
            <div class="search-provider-actions">
              <span class="provider-state">{isDefault() ? "✓ 当前" : ""}</span>
              <SettingsSwitch
                checked={isEnabled()}
                label={`${isEnabled() ? "禁用" : "启用"} ${provider.title}`}
                onChange={() => handleToggle(provider.id)}
              />
            </div>
          }
          interactive
          selected={isDefault()}
          onClick={() => void props.host.setDefaultSearchProvider(provider.id)}
        />
      )
    }}
  </For>
</div>
```

执行要求：

- 保留 `enabledProviders()`、`configurationError()`、`handleToggle()` 逻辑不变
- 仅当 provider disabled 时，把 `onClick` 包成 no-op：`onClick={() => isEnabled() && void props.host.setDefaultSearchProvider(provider.id)}`
- 不删除 `.search-provider-kind`、`.search-provider-actions`、`.provider-state`，以复用现有局部样式

- [ ] **步骤 5：跑测试并提交**

运行：`pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`

预期：PASS。

```bash
git add \
  packages/official-plugins/src/settings-workspace.shared.tsx \
  packages/official-plugins/src/settings-workspace.search.tsx \
  packages/official-plugins/src/settings-workspace.test.tsx
git commit -m "refactor(settings): adopt ui controls in search settings"
```

## 任务 4：把 appearance / workbench settings 行项与 settings host 状态块收敛到 `@tabora/ui`

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.appearance.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.workbench.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/src/settingsHost.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-shell/src/settingsHost.test.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/official-plugins/src/settings-workspace.test.tsx`

- [ ] **步骤 1：先为 settings host 状态块补失败测试**

在 `packages/workbench-shell/src/settingsHost.test.tsx` 追加：

```tsx
it("renders empty and missing states through shared ui blocks", () => {
  const root = document.createElement("div")
  document.body.appendChild(root)

  render(
    () => (
      <SettingsHost
        open
        panels={[
          {
            id: "missing.panel",
            pluginId: "official.missing",
            title: "缺失面板",
            view: "missing.view",
            section: "general",
            scope: "workspace",
          },
        ]}
        activeSectionId="general"
        onSectionChange={() => {}}
        onClose={() => {}}
        getView={() => undefined}
        panelProps={() => ({}) as never}
      />
    ),
    root,
  )

  expect(root.textContent).toContain("设置面板不可用：missing.panel")
})
```

- [ ] **步骤 2：运行局部测试确认基线通过**

运行：

- `pnpm --filter @tabora/workbench-shell test -- settingsHost.test.tsx`
- `pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`

预期：PASS。

- [ ] **步骤 3：把 appearance 的语言行改成 `FieldRow`**

在 `packages/official-plugins/src/settings-workspace.appearance.tsx` 中引入 `FieldRow`，并把当前语言块替换成：

```tsx
import { FieldRow } from "@tabora/ui"
;<FieldRow
  label="当前语言"
  description="影响工作台宿主文案和官方插件面板文案"
  trailing={
    <select
      id="settings-locale-select"
      class="settings-select"
      value={localeValue()}
      onChange={(event) =>
        void props.host.switchLocale?.(event.currentTarget.value as "zh-CN" | "en-US")
      }
      aria-label="选择语言"
    >
      <For each={localeOptions()}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  }
/>
```

- [ ] **步骤 4：把 workbench 面板中的信息行与报错块改成 `FieldRow` / `InlineError`**

在 `packages/official-plugins/src/settings-workspace.workbench.tsx` 中引入：

```tsx
import { FieldRow, InlineError } from "@tabora/ui"
```

替换“当前工作区”行：

```tsx
<FieldRow
  label="当前工作区"
  description="存储布局、主题、背景和卡片配置"
  trailing={<span class="settings-row-meta">{props.workspace.name}</span>}
/>
```

替换导入报错块：

```tsx
<Show when={importError()}>
  <InlineError>{importError()!}</InlineError>
</Show>
```

将新建工作区输入行保留局部布局壳，但把 label / helper 折成字段行：

```tsx
<FieldRow
  label="新建工作区"
  description="创建独立的布局、主题和卡片配置"
  trailing={
    <div class="workspace-create-row">
      <input
        id="ws-new-name"
        class="workspace-create-input"
        value={newWorkspaceName()}
        onInput={(event) => setNewWorkspaceName(event.currentTarget.value)}
        onKeyDown={(event) => event.key === "Enter" && void handleCreate()}
        placeholder="新建工作区"
        aria-label="新建工作区名称"
      />
      <button
        type="button"
        class="settings-mini-btn"
        disabled={!newWorkspaceName().trim()}
        onClick={() => void handleCreate()}
      >
        创建
      </button>
    </div>
  }
/>
```

- [ ] **步骤 5：把 settings host fallback 收敛到共享状态块**

在 `packages/workbench-shell/src/settingsHost.tsx` 中引入：

```tsx
import { EmptyState, InlineError } from "@tabora/ui"
```

将 about fallback 改成：

```tsx
fallback={
  props.aboutContent ?? (
    <EmptyState
      class="settings-empty"
      compact
      title={props.copy?.aboutUnavailable ?? "关于信息暂不可用"}
    />
  )
}
```

将 empty section fallback 改成：

```tsx
fallback={
  <EmptyState
    class="settings-empty"
    compact
    title={props.copy?.emptySection ?? "该分类下暂无设置内容"}
  />
}
```

将 missing panel fallback 改成：

```tsx
return (
  <InlineError>{props.copy?.panelMissing(panel.id) ?? `设置面板不可用：${panel.id}`}</InlineError>
)
```

- [ ] **步骤 6：运行测试并提交**

运行：

- `pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`
- `pnpm --filter @tabora/workbench-shell test -- settingsHost.test.tsx`

预期：PASS。

```bash
git add \
  packages/official-plugins/src/settings-workspace.appearance.tsx \
  packages/official-plugins/src/settings-workspace.workbench.tsx \
  packages/workbench-shell/src/settingsHost.tsx \
  packages/workbench-shell/src/settingsHost.test.tsx \
  packages/official-plugins/src/settings-workspace.test.tsx
git commit -m "refactor(settings): adopt ui field rows and state blocks"
```

## 任务 5：全量验证并做真实浏览器回归

**文件：**

- 不新增文件；只在验证发现问题时回到对应任务修复

- [ ] **步骤 1：运行受影响包测试**

运行：

- `pnpm --filter @tabora/ui test -- listRow`
- `pnpm --filter @tabora/ui test -- fieldRow`
- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`
- `pnpm --filter @tabora/official-plugins test -- settings-workspace.test.tsx`
- `pnpm --filter @tabora/workbench-shell test -- settingsHost.test.tsx`

预期：全部 PASS。

- [ ] **步骤 2：运行全仓测试**

运行：`pnpm test`

预期：全部 PASS。

- [ ] **步骤 3：运行静态检查**

运行：`pnpm check`

预期：PASS，包含 format、lint、typecheck、architecture。

- [ ] **步骤 4：检查 diagnostics**

检查以下文件：

- `packages/ui/src/primitives/fieldRow/fieldRow.tsx`
- `packages/ui/src/styled/fieldRow/fieldRow.styled.tsx`
- `packages/ui/src/primitives/listRow/listRow.tsx`
- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- `packages/official-plugins/src/settings-workspace.shared.tsx`
- `packages/official-plugins/src/settings-workspace.search.tsx`
- `packages/official-plugins/src/settings-workspace.appearance.tsx`
- `packages/official-plugins/src/settings-workspace.workbench.tsx`
- `packages/workbench-shell/src/settingsHost.tsx`

预期：无新增 diagnostics。

- [ ] **步骤 5：启动 playground 做真实浏览器回归**

运行：`pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort`

打开 `http://127.0.0.1:5173/`，按以下路径回归：

- 打开「添加卡片」，确认列表项仍可点击并保留标题 + 描述
- 对 widget 标题右键，确认上下文菜单可见，danger 行项仍显示正确
- 打开设置，切到「搜索」，确认搜索源列表可切默认项、可切开关
- 打开设置，切到「外观」，确认语言行布局稳定且无横向抖动
- 切到没有内容或缺失视图的设置分类，确认 empty / missing fallback 仍可读

- [ ] **步骤 6：提交最终收尾**

```bash
git add \
  packages/ui/src/primitives/fieldRow \
  packages/ui/src/styled/fieldRow \
  packages/ui/src/primitives/listRow/listRow.tsx \
  packages/ui/src/primitives/listRow/listRow.test.tsx \
  packages/ui/src/styled/listRow/listRow.styled.tsx \
  packages/ui/src/styled/listRow/styles.css \
  packages/ui/src/index.ts \
  packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx \
  packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx \
  packages/official-plugins/src/settings-workspace.shared.tsx \
  packages/official-plugins/src/settings-workspace.search.tsx \
  packages/official-plugins/src/settings-workspace.appearance.tsx \
  packages/official-plugins/src/settings-workspace.workbench.tsx \
  packages/official-plugins/src/settings-workspace.test.tsx \
  packages/workbench-shell/src/settingsHost.tsx \
  packages/workbench-shell/src/settingsHost.test.tsx
git commit -m "refactor(workbench): converge host ui building blocks"
```

## Self-Review Notes

- 规格覆盖度：
  - 第一批 `ActionRow/ListRow` → 任务 1、2。
  - 第一批 `FieldRow` → 任务 1、4。
  - 第一批状态块 → 任务 3、4。
  - 宿主边界不迁移 → 所有任务都只替换消费方，不移动 host 容器。
- 占位符扫描：
  - 所有任务都给出了精确文件路径、示例代码和测试命令。
  - 没有使用 `TODO`、`待后续`、`类似上面` 这类占位描述。
- 类型一致性：
  - `FieldRow` 的 `label / description / helper / trailing` 在计划中前后一致。
  - `ListRow` 的 `danger / selected / interactive` 在 `@tabora/ui`、overlay 与 settings 消费方中保持一致。
  - `SettingsInlineError` / `SettingsSwitch` 在共享文件中被收敛为 `@tabora/ui` 导出别名，避免调用点签名漂移。
