# Site Docs 示例注册表 Helper 收敛实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在不改变 `/docs` 示例注册表行为的前提下，收敛 `docsExamples.tsx` 中重复的注册样板代码。

**架构：** 保留现有显式 `?raw` import、显式 `lazy()` 声明和 `DocsExampleId` 联合类型，只在 `apps/site/src/routes/docs/docsExamples.tsx` 内提取两个局部 helper：`renderLazy()` 与 `registerExample()`。`docsExamples` registry 从重复的 `componentExample(... <Suspense> ...)` 结构改为声明式注册。测试只做最小回归，确保 `source` 与 `render` 行为未变。

**技术栈：** Solid、TypeScript、Vitest、Vite raw import

---

## 文件结构

**修改：**

- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`

**参考：**

- `/home/kebai/桌面/tabora/docs/superpowers/specs/2026-06-12-site-docs-examples-helper-design.md`

---

### 任务 1：锁定 helper 收敛的最小回归契约

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：补一个失败测试，锁定 registry 在重构后仍返回可调用 render**

```ts
it("keeps render functions available after helper-based registration", () => {
  expect(typeof getDocsExample("dialog")?.render).toBe("function")
  expect(typeof getDocsExample("toast")?.render).toBe("function")
  expect(typeof getDocsExample("table")?.render).toBe("function")
})
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts`
预期：FAIL，因为此时新测试尚未添加或断言尚未满足。

- [ ] **步骤 3：保留现有 source 回归断言**

```ts
it("loads remaining overlay and feedback examples from component demo files", () => {
  expect(getDocsExample("dialog")?.language).toBe("tsx")
  expect(getDocsExample("toast")?.source).toContain("export function ToastDemo")
  expect(getDocsExample("table")?.source).toContain("export function TableDemo")
})
```

- [ ] **步骤 4：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts
git commit -m "test(site-docs): 锁定示例注册表 helper 重构契约"
```

---

### 任务 2：在 `docsExamples.tsx` 提取局部 helper 并收敛 registry

**文件：**

- 修改：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`
- 测试：`/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`

- [ ] **步骤 1：在文件内新增最薄的 helper**

```tsx
import { Suspense, lazy, type Component, type JSX } from "solid-js"

const renderLazy = (DemoComponent: Component): (() => JSX.Element) => {
  return () => (
    <Suspense fallback={null}>
      <DemoComponent />
    </Suspense>
  )
}

const registerExample = (source: string, DemoComponent: Component): DocsExample => {
  return componentExample(source, renderLazy(DemoComponent))
}
```

- [ ] **步骤 2：将 registry 条目改成声明式注册**

```tsx
const docsExamples: Record<DocsExampleId, DocsExample> = {
  badge: registerExample(badgeDemoSource, BadgeDemo),
  button: registerExample(buttonDemoSource, ButtonDemo),
  card: registerExample(cardSectionDemoSource, CardSectionDemo),
  dialog: registerExample(dialogDemoSource, DialogDemo),
  drawer: registerExample(drawerDemoSource, DrawerDemo),
  empty: registerExample(emptyStateDemoSource, EmptyStateDemo),
  input: registerExample(inputDemoSource, InputDemo),
  progress: registerExample(progressDemoSource, ProgressDemo),
  textarea: registerExample(textareaDemoSource, TextareaDemo),
  select: registerExample(selectDemoSource, SelectDemo),
  checkbox: registerExample(checkboxDemoSource, CheckboxDemo),
  switch: registerExample(switchDemoSource, SwitchDemo),
  radio: registerExample(radioGroupDemoSource, RadioGroupDemo),
  skeleton: registerExample(skeletonDemoSource, SkeletonDemo),
  table: registerExample(tableDemoSource, TableDemo),
  tabs: registerExample(tabsDemoSource, TabsDemo),
  toast: registerExample(toastDemoSource, ToastDemo),
  tooltip: registerExample(tooltipDemoSource, TooltipDemo),
}
```

- [ ] **步骤 3：运行最小回归测试验证通过**

运行：`pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts`
预期：PASS，`source` 断言和 `render` 断言均通过。

- [ ] **步骤 4：运行规范检查**

运行：`pnpm check`
预期：PASS；如果仅格式失败，先运行 `pnpm check:fix`，再重新执行 `pnpm check`。

- [ ] **步骤 5：Commit**

```bash
git add /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx \
        /home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts
git commit -m "refactor(site-docs): 收敛示例注册表样板代码"
```
