# Shell 文案国际化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 `workbench-shell` 的首批宿主文案提供可注入 copy，并由 `workbench-app` 基于当前 locale 透传中英文文本。

**架构：** `@tabora/workbench-shell` 只新增轻量 `copy` props，不直接依赖 runtime i18n。`@tabora/workbench-app` 在 surface/runtime 装配层生成 `tabora.shell` 文案对象并下发给 `CommandPalette`、`WidgetCardShell`、`PluginViewBoundary` 的实际使用点。

**技术栈：** Solid、TypeScript、Vitest、pnpm workspace

---

### 任务 1：固定 shell copy 接口

**文件：**

- 修改：`packages/workbench-shell/src/CommandPalette.test.tsx`
- 修改：`packages/workbench-shell/src/WidgetCardShell.test.tsx`
- 修改：`packages/workbench-shell/src/PluginViewBoundary.test.tsx`

- [ ] **步骤 1：编写失败的测试**

```tsx
it("uses injected English copy for the command palette chrome", () => {
  render(() => (
    <Controlled
      commands={[]}
      copy={{
        placeholder: "Search commands, widgets, or type @bing weather",
        empty: "No results found",
      }}
    />
  ))
})
```

```tsx
it("uses an injected remove aria label", () => {
  render(() => (
    <WidgetCardShell
      copy={{ removeAriaLabel: (title) => `Remove ${title}` }}
      ...
    />
  ))
})
```

```tsx
it("uses injected error and retry copy", () => {
  render(() => (
    <PluginViewBoundary
      copy={{ loadFailed: "Plugin view failed to load", retry: "Retry" }}
      ...
    />
  ))
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-shell/src/CommandPalette.test.tsx packages/workbench-shell/src/WidgetCardShell.test.tsx packages/workbench-shell/src/PluginViewBoundary.test.tsx`
预期：FAIL，提示 `copy` 属性不存在或断言仍读取中文硬编码。

- [ ] **步骤 3：编写最少实现代码**

```ts
export type CommandPaletteCopy = {
  placeholder: string
  empty: string
}

export type WidgetCardShellCopy = {
  removeAriaLabel: (title: string) => string
}

export type PluginViewBoundaryCopy = {
  loadFailed: string
  retry: string
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-shell/src/CommandPalette.test.tsx packages/workbench-shell/src/WidgetCardShell.test.tsx packages/workbench-shell/src/PluginViewBoundary.test.tsx`
预期：PASS

### 任务 2：在 workbench-app 组装 shell copy

**文件：**

- 修改：`packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.ts`
- 修改：`packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- 修改：`packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`
- 修改：`packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.tsx`
- 测试：`packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
- 测试：`packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

- [ ] **步骤 1：编写失败的测试**

```tsx
expect(host.querySelector(".cmd-input")?.getAttribute("placeholder")).toBe(
  "Search commands, widgets, or type @bing weather",
)
```

```tsx
expect(host.querySelector("button.card-danger")?.getAttribute("aria-label")).toBe("Remove Notes")
```

```tsx
expect(host.textContent).toContain("Plugin view failed to load")
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
预期：FAIL，surface/runtime 还未向 shell 组件透传 copy。

- [ ] **步骤 3：编写最少实现代码**

```ts
const t = (key: string, vars?: Record<string, string | number>) =>
  runtime.i18n.t("tabora.shell", key, vars)

const widgetCopy = {
  removeAriaLabel: (title: string) => t("widget.removeAriaLabel", { title }),
}
```

```ts
commandPalette: {
  ...controllerRuntime.searchSurfaces.buildCommandPaletteProps(),
  copy: {
    placeholder: t("commandPalette.placeholder"),
    empty: t("commandPalette.empty"),
  },
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm vitest packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
预期：PASS

### 任务 3：补齐 shell message bundle 并做验证

**文件：**

- 修改：`packages/workbench-app/src/runtime/bootstrap.ts`
- 测试：`packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.test.ts`
- 诊断：最近编辑文件

- [ ] **步骤 1：补充中英文消息**

```ts
i18n.registerMessages("tabora.shell", [
  {
    locale: "zh-CN",
    messages: {
      "commandPalette.placeholder": "搜索命令、卡片或输入 @bing 天气",
      "commandPalette.empty": "未找到匹配结果",
      "widget.removeAriaLabel": "移除 {{title}}",
      "pluginView.loadFailed": "插件视图加载失败",
      "pluginView.retry": "重试",
    },
  },
  {
    locale: "en-US",
    messages: {
      "commandPalette.placeholder": "Search commands, widgets, or type @bing weather",
      "commandPalette.empty": "No results found",
      "widget.removeAriaLabel": "Remove {{title}}",
      "pluginView.loadFailed": "Plugin view failed to load",
      "pluginView.retry": "Retry",
    },
  },
])
```

- [ ] **步骤 2：运行针对性测试**

运行：`pnpm vitest packages/workbench-shell/src/CommandPalette.test.tsx packages/workbench-shell/src/WidgetCardShell.test.tsx packages/workbench-shell/src/PluginViewBoundary.test.tsx packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx packages/workbench-app/src/shell/WorkbenchShellInstanceRenderer.test.tsx`
预期：PASS

- [ ] **步骤 3：运行范围校验**

运行：`pnpm test`
运行：`pnpm check`
预期：PASS，无新增 lint/type/format 问题。
