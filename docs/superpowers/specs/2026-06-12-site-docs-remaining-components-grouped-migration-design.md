# Site Docs 剩余组件分组迁移设计

## 背景

当前站点 `/docs` 已经完成首批 `@tabora/ui` 组件迁移：

- 输入控件：`button`、`input`、`textarea`
- 选择控件：`select`、`checkbox`、`switch`、`radio`
- 浮层与菜单：`tabs`、`dialog`、`drawer`、`tooltip`
- 反馈与通知：`toast`、`progress`、`skeleton`、`empty`
- 标签与结构：`badge`、`table`、`card`

这些组件已经统一到同一套文档机制：

- 真实 Solid 组件 demo，可交互
- demo 与组件源码 colocate
- 一个组件一个 `*.demo.tsx`
- 预览与展示代码来自同一份 demo 源码
- `docsExamples.tsx` 作为显式注册表
- `docsPageContent.ts` 作为 docs 内容事实源

当前 `packages/ui/src/styled` 中仍有一批组件尚未进入 `/docs`。本轮目标是继续迁移这些剩余组件，但不再按零散追加方式推进，而是按组件类型扩展 docs 信息架构，避免导航和内容模型越来越混乱。

## 目标

- 继续将 `packages/ui/src/styled` 中剩余的可文档化组件接入站点 `/docs`
- 保持现有单一来源机制不变，不引入第二套 demo 或代码展示体系
- 按组件类型而不是零散堆叠的方式扩展 docs 导航和内容分组
- 让后续新增组件仍可沿用同一模式继续接入

## 非目标

- 不改动已完成组件的 demo 来源机制
- 不引入 `import.meta.glob`、自动发现、自动注册或约定式扫描
- 不在这一轮拆分 `docsPageContent.ts` 为多文件结构
- 不重写现有 docs 页面框架或返回 prototype HTML 渲染路径
- 不把 `packages/ui/src/component-docs/` 另做一套站点文档数据源

## 设计原则

- **单一来源：** 每个组件的预览和代码展示必须来自同一个 `*.demo.tsx`
- **垂直切片：** demo 文件继续与组件源码 colocate
- **显式优先：** 组件注册保持显式 import + 显式 registry，便于排查和 review
- **场景分组：** docs 面向使用者按组件类型组织，而不是机械映射源码目录
- **渐进迁移：** 一批一批接入，每一批都能独立验证和交付

## 信息架构

在保留现有 5 个组件分组的基础上，新增 5 个组件分组，用于承接剩余组件。

### 新增分组 1：导航与信息架构

用于承载页面结构、路径感知、层级浏览和流程表达类组件：

- `accordion`
- `breadcrumb`
- `pagination`
- `steps`
- `timeline`
- `treeView`

### 新增分组 2：数据录入增强

用于承载比基础输入控件更复杂的输入、分段选择和数据录入辅助组件：

- `combobox`
- `field`
- `slider`
- `tagInput`
- `segmentedControl`
- `toggleGroup`

### 新增分组 3：浮层与命令菜单

用于承载命令触发、菜单交互和补充信息浮层组件：

- `commandPalette`
- `contextMenu`
- `dropdownMenu`
- `hoverCard`
- `menubar`
- `popover`

### 新增分组 4：展示与状态

用于承载轻量展示、信息提醒和状态表达组件：

- `avatar`
- `callout`
- `chip`
- `inlineError`
- `link`
- `listRow`

### 新增分组 5：工具与基础能力

用于承载辅助交互、可访问性和底层展示能力组件：

- `copyButton`
- `divider`
- `scrollArea`
- `spinner`
- `truncate`
- `visuallyHidden`

## 内容模型

本轮继续使用当前 docs 内容模型，不新增新的文档系统。

### `docsPageContent.ts`

继续作为组件文档内容事实源，扩展 `componentSpecs`，新增 5 个数组字段：

- `navigationComponents`
- `enhancedInputComponents`
- `menuAndCommandComponents`
- `displayAndStatusComponents`
- `utilityComponents`

每个数组元素继续使用 `DocsComponentSpec`，不新增新的 spec 类型。

### `DocsComponentSpec`

保持结构不变，继续承载：

- `id`
- `title`
- `description`
- `metaTags`
- `anatomyTitle` / `anatomyItems`
- `demos`
- `table`
- `doTitle` / `doBody`
- `dontTitle` / `dontBody`
- `pluginExample`

每个新组件仍以：

```ts
demos: [{ title: "示例", exampleId: "..." }]
```

或英文：

```ts
demos: [{ title: "Example", exampleId: "..." }]
```

的方式接入。

### `docsExamples.tsx`

继续只负责 demo 源码与渲染注册：

- `?raw` 读取 demo 文件源码
- `lazy()` 加载同一个 demo 组件
- `registerExample(source, DemoComponent)` 维持显式 registry

本轮只扩展 `DocsExampleId` 和 registry 条目，不改变其设计。

### `DocsHomePage.tsx`

继续沿用当前的分组渲染模式：

- sidebar 新增 5 个导航分组
- 页面内容新增 5 组 `componentSpecs` 的顺序渲染

不引入新的动态布局系统，不做组件目录自动推断。

## 迁移批次

由于剩余组件数量较多，本轮不一次性全量落地，而是按类型分 5 批推进。每一批都单独完成：

- demo 注册
- docs 内容补充
- sidebar 接入
- 测试与验证

### 第 1 批：导航与信息架构

- `accordion`
- `breadcrumb`
- `pagination`
- `steps`
- `timeline`
- `treeView`

这批优先跑通新增分组的导航和内容结构。

### 第 2 批：数据录入增强

- `combobox`
- `field`
- `slider`
- `tagInput`
- `segmentedControl`
- `toggleGroup`

这批用于补齐表单与录入能力。

### 第 3 批：浮层与命令菜单

- `commandPalette`
- `contextMenu`
- `dropdownMenu`
- `hoverCard`
- `menubar`
- `popover`

这批包含较多浮层和焦点交互，应在前两批稳定后接入。

### 第 4 批：展示与状态

- `avatar`
- `callout`
- `chip`
- `inlineError`
- `link`
- `listRow`

这批相对轻量，适合在浮层类组件之后推进。

### 第 5 批：工具与基础能力

- `copyButton`
- `divider`
- `scrollArea`
- `spinner`
- `truncate`
- `visuallyHidden`

这批偏基础能力，适合最后统一收尾。

## 组件接入规则

每个新组件接入 `/docs` 时，必须满足以下规则：

- 组件已有或补齐单独的 `*.demo.tsx`
- docs 页面渲染该 demo 的真实 Solid 组件，而非 HTML 字符串
- docs 页面展示的代码来自同一个 `*.demo.tsx?raw`
- 新组件必须在中英文内容中都提供对应 spec
- 不允许为某个组件临时回退到 prototype HTML 或独立 code snippet

对于交互型组件，例如菜单、命令面板、弹层和输入增强组件：

- docs demo 应保留可交互行为
- 键盘与焦点相关行为按组件现有实现展示
- 不为了文档接入而将 demo 降级成静态截图式内容

## 测试与验证

### 数据层验证

继续扩展现有测试，而不是引入新的测试体系：

- `docsPageContent.test.ts`
  - 验证新增分组的 spec 使用 `exampleId`
  - 验证中英文内容结构完整
- `docsExamples.test.ts`
  - 验证新增 example 的 `source`
  - 验证关键组件 `render` 可调用

### 工程验证

每一批至少运行：

```bash
pnpm test
pnpm check
```

跨较多组件或一整批结束时追加：

```bash
pnpm build
```

### 体验验证

每一批接入后，需要确认：

- docs sidebar 能看到对应新分组
- 组件条目可正常定位
- demo 可真实渲染并交互
- 代码展示与 preview 源自同一个 demo 文件
- 中英文切换正常
- 不新增 prototype HTML 回退路径

## 风险与取舍

### 风险 1：`docsPageContent.ts` 继续膨胀

这是当前事实源集中化模式的自然代价。为了避免在这一轮引入额外重构，本设计接受这个代价，不在本轮拆分文件。

### 风险 2：docs 导航变长

通过按组件类型分组来控制，而不是按源码目录平铺。这样虽然组数增加，但仍然保持用户视角可理解。

### 风险 3：部分组件交互复杂

浮层、命令菜单、录入增强组件在 docs 中的交互验证成本更高。因此采用分批推进，避免一次性大范围回归。

## 结果预期

完成本轮设计后，站点 `/docs` 将从“首批核心组件文档”扩展为“覆盖 `@tabora/ui` 剩余主要组件的完整文档体系”，同时保持：

- 单一 demo 源
- 垂直切片 colocate
- 真实交互预览
- 显式注册表
- 稳定的中英文 docs 内容模型

后续新增组件也可以继续沿用本设计，在对应分组中增量接入，而不需要再发明新的文档机制。
