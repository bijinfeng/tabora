# Site Docs 剩余组件交互 Demo 替换实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `/docs` 页面剩余 11 个组件规范区块全部切换为真实的 Solid 组件 demo，并保证预览与代码展示来自同一份 `*.demo.tsx` 源文件。

**架构：** 继续沿用现有 `docsExamples.tsx` 注册表模式：站点侧用 `lazy()` + `Suspense` 加载 `@tabora/ui` 的 demo 组件，用 `?raw` 读取同一 demo 文件源码。`docsPageContent.ts` 不再维护 `previewHtml + codeBlock`，只保留 `exampleId`。若现有 `@tabora/ui` demo 交互不足，则在对应 `*.demo.tsx` 内补最小本地状态逻辑。

**技术栈：** Solid、TypeScript、Vite `?raw`、Vitest

---

## 文件结构

**修改：**

- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/tabs/tabs.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/dialog/dialog.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/drawer/drawer.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/tooltip/tooltip.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/toast/toast.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/progress/progress.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/skeleton/skeleton.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/emptyState/emptyState.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/badge/badge.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/table/table.demo.tsx`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/cardSection/cardSection.demo.tsx`

**参考：**

- `/home/kebai/桌面/tabora/docs/superpowers/specs/2026-06-12-site-docs-remaining-interactive-demos-design.md`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/DocsHomePage.tsx`

---

### 任务 1：锁定剩余 11 个组件的 docs 契约

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`
- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts`

- [ ] **步骤 1：为注册表补失败测试**

```ts
it("loads remaining overlay and feedback examples from component demo files", () => {
  expect(getDocsExample("dialog")?.language).toBe("tsx")
  expect(getDocsExample("toast")?.source).toContain("export function ToastDemo")
  expect(getDocsExample("table")?.source).toContain("export function TableDemo")
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts`
预期：FAIL，提示 `getDocsExample("dialog")` 等返回 `undefined` 或断言不匹配。

- [ ] **步骤 3：为页面内容补失败测试**

```ts
it("migrates overlays, feedback, and structure sections to example ids", () => {
  const content = getDocsPageContent("zh-CN")

  expect(content.componentSpecs.overlayControls[0]?.demos[0]).toEqual(
    expect.objectContaining({ exampleId: "tabs" }),
  )
  expect(content.componentSpecs.feedbackControls[0]?.demos[0]).toEqual(
    expect.objectContaining({ exampleId: "toast" }),
  )
  expect(content.componentSpecs.structureControls[2]?.demos[0]).toEqual(
    expect.objectContaining({ exampleId: "card" }),
  )
})
```

- [ ] **步骤 4：运行测试验证失败**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts`
预期：FAIL，提示 `overlayControls / feedbackControls / structureControls` 不存在，或对应 demo 仍是 legacy 数据。

- [ ] **步骤 5：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts
git commit -m "test(site-docs): lock remaining interactive demo migration"
```

---

### 任务 2：增强 `@tabora/ui` 剩余 demo 的真实交互

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/tabs/tabs.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/dialog/dialog.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/drawer/drawer.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/tooltip/tooltip.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/toast/toast.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/progress/progress.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/skeleton/skeleton.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/emptyState/emptyState.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/badge/badge.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/table/table.demo.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/ui/src/styled/cardSection/cardSection.demo.tsx`

- [ ] **步骤 1：读取并评估现有 demo，确认哪些需要补状态**

运行：`sed -n '1,220p' packages/ui/src/styled/{tabs,dialog,drawer,tooltip,toast,progress,skeleton,emptyState,badge,table,cardSection}/*.demo.tsx`
预期：看到 11 个现有 demo 文件；记录哪些已具备 `createSignal()` 或打开/关闭逻辑，哪些仅为静态展示。

- [ ] **步骤 2：为交互组件补最小本地状态实现**

```tsx
export function DialogDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="docs-control-stack">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        打开确认对话框
      </Button>
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title="移除这个插件？"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              确认移除
            </Button>
          </>
        }
      >
        该操作会移除当前工作区中的插件实例。
      </Dialog>
    </div>
  )
}
```

- [ ] **步骤 3：为轻交互组件补“真实组件渲染”而非字符串拼装**

```tsx
export function BadgeDemo() {
  return (
    <div class="docs-row">
      <Badge tone="neutral">默认</Badge>
      <Badge tone="accent">插件</Badge>
      <Badge tone="success">已启用</Badge>
      <Badge tone="danger">危险</Badge>
    </div>
  )
}
```

- [ ] **步骤 4：运行局部诊断与单测前置检查**

运行：`pnpm vitest run --config vitest.config.ts packages/ui`
预期：PASS；若无覆盖到这些 demo 文件，至少确认命令不报语法/导入错误。

- [ ] **步骤 5：Commit**

```bash
git add /home/kebai/桌面/tabora/packages/ui/src/styled/tabs/tabs.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/dialog/dialog.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/drawer/drawer.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/tooltip/tooltip.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/toast/toast.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/progress/progress.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/skeleton/skeleton.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/emptyState/emptyState.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/badge/badge.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/table/table.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/cardSection/cardSection.demo.tsx
git commit -m "feat(ui): enhance remaining docs demos for interaction"
```

---

### 任务 3：扩展站点示例注册表到剩余 11 个组件

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`
- 测试：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：为 11 个组件补 `DocsExampleId` 和 raw import**

```tsx
import dialogDemoSource from "../../../../../packages/ui/src/styled/dialog/dialog.demo.tsx?raw"
import tabsDemoSource from "../../../../../packages/ui/src/styled/tabs/tabs.demo.tsx?raw"

export type DocsExampleId =
  | "button"
  | "input"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "radio"
  | "tabs"
  | "dialog"
  | "drawer"
  | "tooltip"
  | "toast"
  | "progress"
  | "skeleton"
  | "empty"
  | "badge"
  | "table"
  | "card"
```

- [ ] **步骤 2：为 11 个组件补懒加载渲染条目**

```tsx
const DialogDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/dialog/dialog.demo").then((module) => ({
    default: module.DialogDemo,
  })),
)

const docsExamples: Record<DocsExampleId, DocsExample> = {
  dialog: componentExample(dialogDemoSource, () => (
    <Suspense fallback={null}>
      <DialogDemo />
    </Suspense>
  )),
}
```

- [ ] **步骤 3：运行 docs 示例注册表测试验证通过**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts`
预期：PASS，新增 example id 均能返回 `tsx` 源码与渲染函数。

- [ ] **步骤 4：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts
git commit -m "feat(site-docs): register remaining interactive component demos"
```

---

### 任务 4：将 `/docs` 页面剩余 11 个组件改为 `exampleId`

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts`
- 测试：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts`

- [ ] **步骤 1：先读取 `docsPageContent.ts` 中剩余 legacy 区块边界**

运行：`rg -n "previewHtml|codeBlock" /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts`
预期：能看到 `tabs`、`dialog`、`drawer`、`tooltip`、`toast`、`progress`、`skeleton`、`empty`、`badge`、`table`、`card` 相关条目。

- [ ] **步骤 2：将中文内容改成单一 demo 引用**

```ts
componentSpecs: {
  inputControls: DocsComponentSpec[]
  selectionControls: DocsComponentSpec[]
  overlayControls: DocsComponentSpec[]
  feedbackControls: DocsComponentSpec[]
  structureControls: DocsComponentSpec[]
}
```

```ts
{
  id: "dialog",
  title: "Dialog 对话框",
  description: "...",
  metaTags: ["模态", "确认", "危险操作"],
  demos: [{ title: "示例", exampleId: "dialog" }],
  table: { ... },
  doTitle: "✓ 应当",
  doBody: "...",
  dontTitle: "✗ 不应",
  dontBody: "...",
}
```

- [ ] **步骤 3：将英文内容改成单一 demo 引用**

```ts
{
  id: "dialog",
  title: "Dialog",
  description: "...",
  metaTags: ["Modal", "Confirmation", "Destructive"],
  demos: [{ title: "Example", exampleId: "dialog" }],
  table: { ... },
  doTitle: "✓ Do",
  doBody: "...",
  dontTitle: "✗ Don't",
  dontBody: "...",
}
```

- [ ] **步骤 4：扩展页面内容测试并验证通过**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsPageContent.test.ts`
预期：PASS，断言这些组件不再包含 `previewHtml`，而是落到 `exampleId`。

- [ ] **步骤 5：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts
git commit -m "refactor(site-docs): migrate remaining component specs to demo registry"
```

---

### 任务 5：全量验证并整理收尾

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`（如验证中发现接线问题）
- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts`（如验证中发现遗漏）

- [ ] **步骤 1：运行完整单元测试**

运行：`pnpm test`
预期：PASS；若出现 `@dnd-kit/solid` sourcemap 警告，可忽略，但命令必须以 0 退出。

- [ ] **步骤 2：运行规范校验**

运行：`pnpm check`
预期：PASS；如仅格式失败，先运行 `pnpm check:fix`，再重新执行 `pnpm check` 直到通过。

- [ ] **步骤 3：运行构建验证**

运行：`pnpm build`
预期：PASS；允许出现 chunk size / ineffective dynamic import 警告，但不能构建失败。

- [ ] **步骤 4：检查工作区状态**

运行：`git status --short --untracked-files=all`
预期：只剩本轮预期修改；若有意外文件，先阅读确认来源，再决定是否纳入。

- [ ] **步骤 5：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts \
        /home/kebai/桌面/tabora/packages/ui/src/styled/tabs/tabs.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/dialog/dialog.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/drawer/drawer.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/tooltip/tooltip.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/toast/toast.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/progress/progress.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/skeleton/skeleton.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/emptyState/emptyState.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/badge/badge.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/table/table.demo.tsx \
        /home/kebai/桌面/tabora/packages/ui/src/styled/cardSection/cardSection.demo.tsx
git commit -m "refactor(site-docs): migrate remaining docs components to interactive demos"
```
