# Site Docs 单一源码示例实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 `apps/site` 的 `/docs` 页面建立“示例渲染代码与展示代码来自同一份文件”的 PoC，并先把 `button` 与 `select` 两组示例迁移到新模型。

**架构：** `/docs` 的页面文案、表格和段落结构继续留在 `docsPageContent.ts`，但 demo 不再内联维护 `previewHtml + codeBlock.code` 两份内容。改为由 `docsExamples.ts` 统一注册示例文件，页面层按 `exampleId` 同时拿到 `render()` 和 `source`；PoC 先用独立 `.html` 示例文件承载原型类名结构，后续如果需要再扩展到 `.tsx` 示例文件。

**技术栈：** Solid、TypeScript、Vite `?raw`、Vitest、happy-dom、pnpm workspace

---

## 文件结构

### 本轮新增文件

- `apps/site/src/routes/docs/docsExamples.ts`
  - `/docs` 示例注册表。
  - 暴露 `getDocsExample()`，把 `exampleId` 映射到 `language`、`source`、`render()`。
- `apps/site/src/routes/docs/docsExamples.test.ts`
  - 锁定注册表示例是否存在、源码是否来自独立文件、源码字符串是否可直接展示。
- `apps/site/src/routes/docs/examples/button/button-variants.html`
  - `button` 的“变体”示例单一源码文件。
- `apps/site/src/routes/docs/examples/button/button-sizes.html`
  - `button` 的“尺寸”示例单一源码文件。
- `apps/site/src/routes/docs/examples/button/button-disabled-full.html`
  - `button` 的“禁用与全宽”示例单一源码文件。
- `apps/site/src/routes/docs/examples/button/button-group-icon.html`
  - `button` 的“按钮组与图标按钮”示例单一源码文件。
- `apps/site/src/routes/docs/examples/select/select-base-sizes.html`
  - `select` 的“基础与尺寸”示例单一源码文件。
- `apps/site/src/routes/docs/examples/select/select-groups-disabled.html`
  - `select` 的“分组与禁用”示例单一源码文件。

### 本轮修改文件

- `apps/site/src/routes/docs/docsPageContent.ts`
  - 把 PoC 范围内的 demo 从双份内联改成 `exampleId`。
  - 暂停继续扩张错误方向的 `selectionControls` 双份数据，仅保留 `select` 的组件化 PoC。
- `apps/site/src/routes/docs/docsPageContent.test.ts`
  - 把断言调整为 PoC 真实范围，锁定 `button/select` 走单一源码模型。
- `apps/site/src/routes/docs/DocsHomePage.tsx`
  - 新增按 `exampleId` 渲染与展示源码的路径。
  - 保留 legacy demo 分支给未迁移区块。
  - 把 prototype tail 的起点从 `select` 后移到 `checkbox`，避免重复渲染 `select`。

### 本轮不动的文件

- `apps/site/src/routes/docs/ComponentDocsPage.tsx`
- `packages/ui/src/component-docs/**`

这些文件当前同样存在“渲染代码”和“展示代码”分离的问题，但不属于本轮 `/docs` PoC 的变更范围，避免跨两套文档系统同时施工。

---

### 任务 1：锁定 `/docs` 新 demo 契约

**文件：**

- 修改：`apps/site/src/routes/docs/docsPageContent.test.ts`
- 创建：`apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：先写失败测试，明确 PoC 只迁移 `button` 和 `select`**

```ts
it("uses example ids instead of duplicated inline preview html for button demos", () => {
  const content = getDocsPageContent("en")
  const button = content.componentSpecs.inputControls.find((spec) => spec.id === "button")

  expect(button?.demos[0]).toEqual(
    expect.objectContaining({
      title: "Variants",
      exampleId: "button.variants",
    }),
  )
  expect("previewHtml" in (button?.demos[0] ?? {})).toBe(false)
})
```

```ts
it("keeps selection-control PoC scoped to select while the sidebar still lists the full group", () => {
  const content = getDocsPageContent("zh-CN")

  expect(content.sidebarGroups.find((group) => group.title === "选择控件")?.items).toHaveLength(4)
  expect(content.componentSpecs.selectionControls).toHaveLength(1)
  expect(content.componentSpecs.selectionControls[0]?.id).toBe("select")
  expect(content.componentSpecs.selectionControls[0]?.demos[0]).toEqual(
    expect.objectContaining({
      exampleId: "select.base-sizes",
    }),
  )
})
```

```ts
it("loads docs examples from the registry with a single source payload", () => {
  const example = getDocsExample("button.variants")

  expect(example?.language).toBe("html")
  expect(example?.source).toContain('<button class="btn btn-primary btn-md">')
  expect(typeof example?.render).toBe("function")
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts apps/site/src/routes/docs/docsExamples.test.ts
```

预期：FAIL，提示 `exampleId` / `getDocsExample` 不存在，且现有 `selectionControls` 长度与新 PoC 断言不一致。

- [ ] **步骤 3：定义最小的新 demo 类型**

在 `apps/site/src/routes/docs/docsPageContent.ts` 中把 demo 结构改成新旧并存的显式联合，禁止继续对 PoC 范围写双份数据：

```ts
export type DocsRegisteredDemo = {
  title: string
  exampleId: DocsExampleId
}

export type DocsLegacyDemo = {
  title: string
  previewHtml: string
  codeBlock: DocsCodeBlock
}

export type DocsComponentDemo = DocsRegisteredDemo | DocsLegacyDemo
```

并把 `DocsComponentSpec` 的 `demos` 改为：

```ts
demos: DocsComponentDemo[]
```

- [ ] **步骤 4：运行测试确认新的类型缺口已经暴露到实现层**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts apps/site/src/routes/docs/docsExamples.test.ts
```

预期：仍然 FAIL，但错误收敛到“缺少注册表实现”或“数据尚未迁移”，不再是类型定义缺失。

- [ ] **步骤 5：Commit**

```bash
git add apps/site/src/routes/docs/docsPageContent.test.ts apps/site/src/routes/docs/docsExamples.test.ts apps/site/src/routes/docs/docsPageContent.ts
git commit -m "test(site): lock docs single-source demo contract"
```

### 任务 2：创建示例注册表和 PoC 示例文件

**文件：**

- 创建：`apps/site/src/routes/docs/docsExamples.ts`
- 创建：`apps/site/src/routes/docs/examples/button/button-variants.html`
- 创建：`apps/site/src/routes/docs/examples/button/button-sizes.html`
- 创建：`apps/site/src/routes/docs/examples/button/button-disabled-full.html`
- 创建：`apps/site/src/routes/docs/examples/button/button-group-icon.html`
- 创建：`apps/site/src/routes/docs/examples/select/select-base-sizes.html`
- 创建：`apps/site/src/routes/docs/examples/select/select-groups-disabled.html`
- 测试：`apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：先补最小失败测试，要求 registry 返回同一份源码**

```ts
it("returns the same source string for rendering and code display", () => {
  const example = getDocsExample("select.groups-disabled")

  expect(example?.source).toContain('<select class="sel">')
  expect(example?.source).toContain('<optgroup label="布局类">')
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts
```

预期：FAIL，`select.groups-disabled` 尚未注册或源码文件不存在。

- [ ] **步骤 3：实现 registry 与示例文件**

在 `apps/site/src/routes/docs/docsExamples.ts` 中使用原始文件导入注册：

```ts
import buttonVariantsSource from "./examples/button/button-variants.html?raw"
import selectGroupsDisabledSource from "./examples/select/select-groups-disabled.html?raw"

export type DocsExampleId =
  | "button.variants"
  | "button.sizes"
  | "button.disabled-full"
  | "button.group-icon"
  | "select.base-sizes"
  | "select.groups-disabled"

type DocsExample = {
  language: "html"
  source: string
  render: () => JSX.Element
}

const htmlExample = (source: string): DocsExample => ({
  language: "html",
  source,
  render: () => <div innerHTML={source} />,
})
```

注册表主体：

```ts
const docsExamples: Record<DocsExampleId, DocsExample> = {
  "button.variants": htmlExample(buttonVariantsSource),
  "button.sizes": htmlExample(buttonSizesSource),
  "button.disabled-full": htmlExample(buttonDisabledFullSource),
  "button.group-icon": htmlExample(buttonGroupIconSource),
  "select.base-sizes": htmlExample(selectBaseSizesSource),
  "select.groups-disabled": htmlExample(selectGroupsDisabledSource),
}

export function getDocsExample(id: DocsExampleId) {
  return docsExamples[id]
}
```

示例文件内容直接来自原型，不在 TS 字符串里重写。比如 `button-variants.html`：

```html
<div class="demo-row">
  <button class="btn btn-primary btn-md">主要</button>
  <button class="btn btn-secondary btn-md">次要</button>
  <button class="btn btn-subtle btn-md">柔和</button>
  <button class="btn btn-ghost btn-md">幽灵</button>
  <button class="btn btn-danger btn-md">危险</button>
  <button class="btn btn-danger-subtle btn-md">危险柔和</button>
</div>
```

以及 `select-groups-disabled.html`：

```html
<div class="demo-row" style="flex-direction: column; gap: 12px">
  <select class="sel">
    <option value="">请选择插件类型</option>
    <optgroup label="布局类">
      <option>sidebar</option>
      <option>panel</option>
    </optgroup>
    <optgroup label="功能类">
      <option>widget</option>
      <option>searchProvider</option>
    </optgroup>
  </select>
  <select class="sel" disabled>
    <option>禁用状态</option>
  </select>
  <select class="sel sel-error">
    <option value="">必选 — 错误状态</option>
  </select>
</div>
```

- [ ] **步骤 4：运行测试确认 registry 成立**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts
```

预期：PASS，能读取 `source`，且 registry 为每个 `exampleId` 暴露 `render()`。

- [ ] **步骤 5：Commit**

```bash
git add apps/site/src/routes/docs/docsExamples.ts apps/site/src/routes/docs/docsExamples.test.ts apps/site/src/routes/docs/examples
git commit -m "feat(site): add single-source docs example registry"
```

### 任务 3：把 `button` 与 `select` 接到 registry，并后移 prototype tail

**文件：**

- 修改：`apps/site/src/routes/docs/docsPageContent.ts`
- 修改：`apps/site/src/routes/docs/DocsHomePage.tsx`
- 测试：`apps/site/src/routes/docs/docsPageContent.test.ts`
- 测试：`apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：先写失败测试，锁定页面从 `exampleId` 渲染**

```ts
it("maps button and select demos to the example registry ids", () => {
  const content = getDocsPageContent("en")
  const button = content.componentSpecs.inputControls.find((spec) => spec.id === "button")
  const select = content.componentSpecs.selectionControls.find((spec) => spec.id === "select")

  expect(button?.demos.map((demo) => ("exampleId" in demo ? demo.exampleId : "legacy"))).toEqual([
    "button.variants",
    "button.sizes",
    "button.disabled-full",
    "button.group-icon",
  ])

  expect(select?.demos.map((demo) => ("exampleId" in demo ? demo.exampleId : "legacy"))).toEqual([
    "select.base-sizes",
    "select.groups-disabled",
  ])
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts
```

预期：FAIL，`docsPageContent.ts` 仍然在输出 `previewHtml` 与 `codeBlock.code`。

- [ ] **步骤 3：实现数据接线与页面渲染**

在 `apps/site/src/routes/docs/docsPageContent.ts` 中把 `button` 和 `select` 改成：

```ts
demos: [
  { title: "变体", exampleId: "button.variants" },
  { title: "尺寸", exampleId: "button.sizes" },
  { title: "禁用 & 全宽", exampleId: "button.disabled-full" },
  { title: "按钮组 & 图标按钮", exampleId: "button.group-icon" },
]
```

```ts
selectionControls: [
  {
    id: "select",
    // ...
    demos: [
      { title: "基础 & 尺寸", exampleId: "select.base-sizes" },
      { title: "分组 & 禁用", exampleId: "select.groups-disabled" },
    ],
  },
]
```

在 `apps/site/src/routes/docs/DocsHomePage.tsx` 中新增 registry 分支：

```tsx
import { getDocsExample } from "./docsExamples"
```

```tsx
function DocsComponentDemoSection(props: { demo: DocsComponentDemo }) {
  if ("exampleId" in props.demo) {
    const example = getDocsExample(props.demo.exampleId)
    if (!example) return null

    return (
      <>
        <div class="demo-body">{example.render()}</div>
        <DocsCodeBlock
          block={{
            label: example.language.toUpperCase(),
            copyLabel: "复制",
            copiedLabel: "已复制",
            code: example.source,
          }}
        />
      </>
    )
  }

  return (
    <>
      <div class="demo-body">
        <div innerHTML={props.demo.previewHtml} />
      </div>
      <DocsCodeBlock block={props.demo.codeBlock} />
    </>
  )
}
```

并把 prototype tail 起点从 `select` 改成 `checkbox`：

```ts
const tail =
  withoutScripts.match(/<section class="comp-spec" id="checkbox"[\s\S]*?(?=<\/main>)/)?.[0] ?? ""
```

- [ ] **步骤 4：运行针对性测试确认通过**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts apps/site/src/routes/docs/docsExamples.test.ts
```

预期：PASS，且 `select` 不再重复出现在 prototype tail 与组件化区块中。

- [ ] **步骤 5：Commit**

```bash
git add apps/site/src/routes/docs/docsPageContent.ts apps/site/src/routes/docs/DocsHomePage.tsx apps/site/src/routes/docs/docsPageContent.test.ts apps/site/src/routes/docs/docsExamples.test.ts
git commit -m "refactor(site): source docs demos from example files"
```

### 任务 4：完整验证并为后续批量迁移留出基线

**文件：**

- 修改：最近编辑文件
- 诊断：`apps/site/src/routes/docs/DocsHomePage.tsx`

- [ ] **步骤 1：运行 site 相关测试**

运行：

```bash
pnpm vitest run --config apps/site/vitest.config.ts
```

预期：PASS，`apps/site` 全部测试通过。

- [ ] **步骤 2：运行仓库级校验**

运行：

```bash
pnpm test
pnpm check
pnpm --filter @tabora/site build
```

预期：

- `pnpm test` PASS
- `pnpm check` PASS
- `pnpm --filter @tabora/site build` PASS

- [ ] **步骤 3：检查最近编辑文件诊断**

运行 VS Code diagnostics，重点查看：

```txt
apps/site/src/routes/docs/DocsHomePage.tsx
apps/site/src/routes/docs/docsPageContent.ts
apps/site/src/routes/docs/docsExamples.ts
apps/site/src/routes/docs/docsExamples.test.ts
```

预期：无新增类型错误、JSX 错误或未使用导入。

- [ ] **步骤 4：手动验证 `/docs` PoC 交互**

运行：

```bash
pnpm --filter @tabora/site exec vite --host 127.0.0.1 --port 4173 --strictPort
```

手动检查：

- `button` 4 个 demo 的视觉与原型一致
- `select` 2 个 demo 的视觉与原型一致
- 复制按钮复制的是示例文件源码，而不是另一份手写字符串
- 语法高亮仍然作用在新 code block 上
- 页面中只出现一份 `select` 章节，`checkbox/switch/radio` 仍由 tail 正常显示

- [ ] **步骤 5：Commit**

```bash
git add apps/site/src/routes/docs
git commit -m "test(site): verify docs single-source demo poc"
```

---

## 自检结果

- 规格覆盖度：已覆盖单一源码模型、PoC 范围、页面接线、验证命令和保留 legacy 分支的过渡策略。
- 占位符扫描：未使用 `TODO`、`后续补充`、`适当处理` 之类占位表达；后续扩展仅以“PoC 之后可继续批量迁移”作为明确范围外说明。
- 类型一致性：统一使用 `DocsExampleId`、`DocsRegisteredDemo`、`DocsLegacyDemo`、`getDocsExample()`；`button/select` 的 example id 在测试与实现步骤中保持一致。

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-06-11-site-docs-single-source-demos.md`。两种执行方式：

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

选哪种方式？
