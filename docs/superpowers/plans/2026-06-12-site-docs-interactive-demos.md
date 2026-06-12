# Site Docs 交互式 Solid Demo（单组件单 Demo 文件）实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** `/docs` 组件规范区块的示例预览改为“真实 Solid 组件 demo（可交互）”，并保证“预览渲染”和“代码展示/复制”来自同一份 demo 源文件。

**架构：**

- demo 源文件与组件源码同目录（垂直切片），每个组件一个 `*.demo.tsx` 文件。
- 站点侧示例注册表只引用 demo 源文件：预览用动态 import 加载 demo 组件，代码展示用 `?raw` 读取同文件源码字符串。

**技术栈：** Solid、Vite `?raw`、Solid `lazy`/`Suspense`

---

## 文件结构

**修改：**

- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.tsx`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.ts`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsExamples.test.ts`
- `/home/kebai/桌面/tabora/apps/site/src/routes/docs/docsPageContent.test.ts`
- `/home/kebai/桌面/tabora/packages/ui/src/styled/button/button.demo.tsx`

**删除：**

- `/home/kebai/桌面/tabora/packages/ui/src/component-docs/examples/**`

---

## 任务 1：站点侧示例注册表改为 demo 组件 + raw 源码

- [ ] **步骤 1：把 `docsExamples` 改为每组件单 demo id**
  - `DocsExampleId` 变为 `"button" | "input" | "textarea" | "select" | "checkbox" | "switch" | "radio"`
- [ ] **步骤 2：预览使用 `lazy(() => import(...))` 动态加载 demo 组件**
  - 避免 Vitest / Node 环境在导入注册表时立即执行 demo 的依赖（例如 `.jsx` 依赖）
  - 渲染处用 `<Suspense fallback={null}>`
- [ ] **步骤 3：代码展示使用同一 demo 文件的 `?raw`**
  - `import source from ".../xxx.demo.tsx?raw"`
  - `DocsExample.source` 直接返回该字符串

---

## 任务 2：`docsPageContent` 去掉双份维护 demo

- [ ] **步骤 1：`button/select/checkbox/switch/radio` 每个组件只保留 1 个 demo**
  - `demos: [{ title: "...", exampleId: "button" }]` 等
- [ ] **步骤 2：同步把 `input/textarea` 从 legacy `previewHtml + codeBlock` 改成 registry demo**
  - `exampleId: "input" | "textarea"`

---

## 任务 3：让 demo 确实“可交互”

- [ ] **步骤 1：确保 `ButtonDemo` 有真实交互反馈**
  - 例如点击次数、最近点击 variant 展示

---

## 任务 4：测试与验证

- [ ] **步骤 1：更新站点测试用例**
  - `docsExamples.test.ts`：验证 `language === "tsx"`，且源码包含 demo 导出函数名
  - `docsPageContent.test.ts`：验证新的 `exampleId` 使用单组件 id
- [ ] **步骤 2：运行验证命令**
  - `pnpm test`
  - `pnpm check`（如失败先 `pnpm check:fix`）
  - `pnpm build`
