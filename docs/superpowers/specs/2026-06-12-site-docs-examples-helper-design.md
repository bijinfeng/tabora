# Site Docs 示例注册表 Helper 收敛设计

**目标：** 在不改变 `/docs` 示例加载行为的前提下，收敛 `apps/site/src/routes/docs/docsExamples.tsx` 中重复的 `componentExample + Suspense + lazy component` 注册样板代码。

**范围：**

- 仅修改 `apps/site/src/routes/docs/docsExamples.tsx`
- 按最小回归需要调整 `apps/site/src/routes/docs/docsExamples.test.ts`

**非目标：**

- 不调整 `DocsExampleId`、`DocsExample`、`getDocsExample()` 的对外接口
- 不改 `docsPageContent.ts`、`DocsHomePage.tsx` 或任何 `*.demo.tsx`
- 不引入自动扫描、自动注册、`import.meta.glob` 或新的运行时行为
- 不处理现有构建中的 `INEFFECTIVE_DYNAMIC_IMPORT` 警告

---

## 现状

当前 `docsExamples.tsx` 的重复主要有三层：

- 每个 demo 一条 `?raw` import
- 每个 demo 一段 `lazy(() => import(...).then(...))`
- 每个 `docsExamples[id]` 一段完全同形的：

```tsx
componentExample(source, () => (
  <Suspense fallback={null}>
    <Demo />
  </Suspense>
))
```

其中前两层是静态导入层面的显式依赖声明，虽然重复，但可读性和类型边界都比较稳定；第三层则是纯样板代码，最适合先收敛。

---

## 方案对比

### 方案 A：保持现状

- 优点：零风险
- 缺点：每新增一个 demo 都要改三处，注册表继续膨胀

### 方案 B：提取薄 helper

- 新增 `renderLazy()` 和 `registerExample()` 两个 helper
- 保留显式 `?raw` import 与显式 `lazy()` 声明
- `docsExamples` 对象只保留 `id -> registerExample(source, Demo)` 映射

**推荐该方案。**

原因：

- 改动集中在一个文件内
- 不引入新的隐式规则
- 去掉最多的重复，同时保留当前显式依赖关系
- 便于后续继续扩组件时复用

### 方案 C：descriptor 表生成 registry

- 将 `source`、`DemoComponent` 和 `id` 放到统一 descriptor 表，再自动生成 `docsExamples`
- 比方案 B 更整齐，但会多一层间接跳转

不选原因：

- 这轮只想解决样板代码重复，不想增加新的抽象层
- 对一个规模不大的 registry 来说，额外描述层收益有限

---

## 设计

### 1. helper 形态

在 `docsExamples.tsx` 内新增两个局部 helper：

```tsx
const renderLazy = (DemoComponent: Component<{}>) => {
  return () => (
    <Suspense fallback={null}>
      <DemoComponent />
    </Suspense>
  )
}

const registerExample = (source: string, DemoComponent: Component<{}>): DocsExample => {
  return componentExample(source, renderLazy(DemoComponent))
}
```

约束：

- helper 只服务当前文件，不抽到共享模块
- `fallback` 继续固定为 `null`
- 仍通过既有 `componentExample()` 包装 `.docs-render`

### 2. 保留显式依赖声明

以下内容保持显式，不做自动化：

- 顶部 `?raw` import
- 顶部 `lazy()` 组件声明
- `DocsExampleId` 联合类型

原因：

- 这三部分都直接表达了“有哪些 demo 参与站点 docs”
- 保持显式更利于搜索、类型补全和代码审查

### 3. registry 收敛结果

`docsExamples` 从：

```tsx
button: componentExample(buttonDemoSource, () => (
  <Suspense fallback={null}>
    <ButtonDemo />
  </Suspense>
))
```

收敛为：

```tsx
button: registerExample(buttonDemoSource, ButtonDemo)
```

这样每个条目只保留真正重要的两件信息：

- 源码字符串
- 对应 demo 组件

---

## 文件影响

- `apps/site/src/routes/docs/docsExamples.tsx`
  - 新增局部 helper
  - 将 `docsExamples` 对象改为声明式注册
- `apps/site/src/routes/docs/docsExamples.test.ts`
  - 仅保留回归测试，确保重构未影响 `source` 和 `render`

---

## 测试策略

- 运行现有 `docsExamples.test.ts`
  - 验证 `getDocsExample("button")` 仍返回 `tsx` 源码
  - 验证 `getDocsExample("dialog")`、`getDocsExample("toast")`、`getDocsExample("table")` 仍可获取相同 demo 源码
- 回归验证：
  - `pnpm vitest run --config vitest.config.ts apps/site/src/routes/docs/docsExamples.test.ts`
  - `pnpm check`

由于这轮是无行为变更的局部收敛，不要求再跑 `pnpm build` 或全量 `pnpm test`，除非实现中触发了超出预期的改动。

---

## 风险与处理

- helper 类型如果写得过度泛化，可能让 Solid 组件类型变复杂
  - 处理：只接受最窄的组件类型，保持 helper 局部、简单
- 过度抽象导致阅读门槛上升
  - 处理：只抽掉重复 JSX，不做 descriptor 表或自动扫描
- 后续若继续扩 demo，顶部 import 数量仍会增长
  - 处理：接受这一点；本轮目标是“减样板”，不是“隐藏依赖”
