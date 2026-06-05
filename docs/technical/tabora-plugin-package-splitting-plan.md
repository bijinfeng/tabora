# 插件包拆分方案

版本：V1.0

日期：2026-05-30

状态：历史方案参考；当前包边界事实源以 V2 技术方案和实际目录结构为准

> Agent 注意：本文用于追溯插件拆包讨论，不作为当前实施计划。修改插件包边界时先读 `docs/README.md` 和 V2 技术方案。

关联文档：

- V2 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- V2 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`

## 1. 现状诊断

### 1.1 当前结构

```
packages/official-plugins/
  src/
    index.ts                       # 9 个插件集中 re-export + officialPlugins 数组
    layout-workbench-dashboard.tsx # Dashboard 布局
    layout-top-search-grid.tsx     # 旧版布局
    search-command-bar.tsx         # 命令搜索
    search-providers-basic.ts      # 搜索源
    background-basic.ts            # 背景
    theme-default-pack.ts          # 主题
    widgets-productivity.tsx       # TodayFocus + Notes（2 个 widget 混在一起）
    widget-todo.tsx                # Todo widget
    widget-weather.tsx             # Weather widget
    widget-quick-links.tsx         # Quick Links widget
    plugin-manager.tsx             # 插件管理设置面板
    plugin-manager-entry.ts        # 插件管理入口
    settings-workspace.tsx         # 工作区设置面板
```

15 个源文件，1876 行代码。1 个测试文件。

### 1.2 核心问题

| 问题                                   | 详情                                                                                                 | 后果                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **同一版本号**                         | 9 个插件共用一个 `package.json` version。改 Todo 的 bugfix，Weather 也跟着 bump                      | 版本语义混乱，无法追踪单个插件变更                   |
| **无法独立安装**                       | 消费者必须装整个 `@tabora/official-plugins`                                                          | 用户即使只用 Todo 也要加载 Weather、Notes 等全部代码 |
| **目录膨胀**                           | 所有插件源码在一个 `src/` 目录平铺                                                                   | 未来 20+ 插件时，15 个文件变 40+，不可维护           |
| **测试耦合**                           | 所有插件测试混在一个 vitest 运行中                                                                   | 单个插件测试失败需要排查是哪个插件的测试             |
| **违背"一切皆插件"哲学**               | 官方插件包是一个单体，不像独立插件                                                                   | 与 PRD 中"每个能力都是独立插件"的原则矛盾            |
| **widgets-productivity.tsx 是伪包**    | 一个文件承载 TodayFocus + Notes 两个 widget 的 manifest + 组件，内部 import todo/quick-links/weather | 既不是真单体也不是真拆分，结构混乱                   |
| **plugin-manager-entry.ts 模块级状态** | `let pluginSummaryProvider` 模块级可变变量，由 `index.ts` 初始化                                     | 隐式初始化顺序依赖                                   |

## 2. 目标架构

### 2.1 目录结构

```
plugins/                              # 根目录新建
  widget-todo/                        # 独立插件包
    package.json                      # name: "@tabora/plugin-todo"
    tsconfig.json
    src/
      index.ts                        # BuiltinPlugin 导出
      todo-card.tsx                   # Widget 卡片组件
    tests/
      todo-card.test.tsx

  widget-weather/
    package.json                      # name: "@tabora/plugin-weather"
    src/
      index.ts
      weather-card.tsx

  widget-notes/
  widget-quick-links/
  widget-today-focus/

  layout-workbench-dashboard/
  layout-workbench-stream/

  search-command-bar/
  search-providers-basic/

  theme-default-pack/
  background-basic/

  plugin-manager/
  settings-workspace/
```

### 2.2 独立插件包标准

每个插件包遵循统一结构：

```json
// plugins/widget-todo/package.json
{
  "name": "@tabora/plugin-todo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*",
    "@tabora/platform-kernel": "workspace:*",
    "@tabora/ui": "workspace:*"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*",
    "solid-js": "catalog:ui",
    "vitest": "catalog:test"
  }
}
```

```json
// plugins/widget-todo/tsconfig.json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src", "tests"]
}
```

```ts
// plugins/widget-todo/src/index.ts
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodoCard } from "./todo-card"

export const officialPluginTodo: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.todo",
    name: "Todo",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "official.widgets.todo.card",
          title: "待办",
          supportedSizes: ["S", "M"],
          defaultSize: "S",
          allowMultipleInstances: true,
          views: {
            card: "official.widgets.todo.card.view",
          },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.todo.card.view", TodoCard)
  },
}
```

### 2.3 依赖关系

每个插件包只依赖它需要的包：

```
@tabora/plugin-todo
  ├── @tabora/plugin-api      (类型)
  ├── @tabora/platform-kernel  (BuiltinPlugin 类型)
  └── @tabora/ui              (Button, Checkbox, Input 等)

@tabora/plugin-weather
  ├── @tabora/plugin-api
  ├── @tabora/platform-kernel
  └── @tabora/ui

@tabora/plugin-layout-dashboard
  ├── @tabora/plugin-api
  ├── @tabora/platform-kernel
  └── solid-js                (布局组件只需 Solid，不需要 UI 组件)

@tabora/plugin-theme-default
  ├── @tabora/plugin-api
  └── @tabora/platform-kernel
  (不依赖 @tabora/ui —— 主题只贡献 token，不渲染 UI)
```

### 2.4 workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "plugins/*" # 新增
  - "tooling/*"
```

### 2.5 装配包（可选）

为了避免 playground 每次新增插件都要手动 import，创建装配包：

```
packages/plugin-assembly/
  package.json         # name: "@tabora/plugin-assembly"
  src/
    index.ts           # 聚合所有官方插件 + defaultPlugins 数组
```

```ts
// packages/plugin-assembly/src/index.ts
export { officialPluginTodo } from "@tabora/plugin-todo"
export { officialPluginWeather } from "@tabora/plugin-weather"
export { officialPluginNotes } from "@tabora/plugin-notes"
export { officialPluginQuickLinks } from "@tabora/plugin-quick-links"
export { officialPluginTodayFocus } from "@tabora/plugin-today-focus"
export { officialLayoutDashboard } from "@tabora/plugin-layout-dashboard"
export { officialLayoutStream } from "@tabora/plugin-layout-stream"
export { officialSearchCommandBar } from "@tabora/plugin-search-command-bar"
export { officialSearchProviders } from "@tabora/plugin-search-providers"
export { officialThemeDefaultPack } from "@tabora/plugin-theme-default"
export { officialBackgroundBasic } from "@tabora/plugin-background-basic"
export { officialPluginManager } from "@tabora/plugin-manager"
export { officialSettingsWorkspace } from "@tabora/plugin-settings-workspace"

import { officialPluginTodo, officialPluginWeather /* ... */ } from "./index"

export const defaultPlugins = [
  officialThemeDefaultPack,
  officialBackgroundBasic,
  officialLayoutDashboard,
  officialLayoutStream,
  officialSearchCommandBar,
  officialSearchProviders,
  officialPluginTodo,
  officialPluginWeather,
  officialPluginNotes,
  officialPluginQuickLinks,
  officialPluginTodayFocus,
  officialPluginManager,
  officialSettingsWorkspace,
]
```

Playground 使用：

```ts
import { defaultPlugins } from "@tabora/plugin-assembly"
// kernel.discover(defaultPlugins)
```

不需要装配包时，playground 直接逐个 import：

```ts
import { officialPluginTodo } from "@tabora/plugin-todo"
import { officialPluginWeather } from "@tabora/plugin-weather"
// ...
```

## 3. 拆分粒度

### 3.1 原则

| 原则                                   | 说明                                         |
| -------------------------------------- | -------------------------------------------- |
| **一个 extension point 贡献 = 一个包** | 如果 plug A 贡献 widget + search，拆成两个包 |
| **一个包只做一件事**                   | Todo 插件不应该包含 Weather 的组件           |
| **共享工具进 `@tabora/plugin-api`**    | 多个插件需要的类型/工具提升到公共层          |

### 3.2 具体拆分

| 拆分后包名                          | 内容                              | 代码量  | 说明                                                         |
| ----------------------------------- | --------------------------------- | ------- | ------------------------------------------------------------ |
| `@tabora/plugin-todo`               | Todo widget (card view)           | ~190 行 | 从 `widget-todo.tsx` 拆出                                    |
| `@tabora/plugin-weather`            | Weather widget                    | ~98 行  | 从 `widget-weather.tsx` 拆出                                 |
| `@tabora/plugin-notes`              | Notes widget (card + modal views) | ~110 行 | 从 `widgets-productivity.tsx` 拆出                           |
| `@tabora/plugin-quick-links`        | Quick Links widget                | ~268 行 | 从 `widget-quick-links.tsx` 拆出                             |
| `@tabora/plugin-today-focus`        | Today Focus widget                | ~60 行  | 从 `widgets-productivity.tsx` 拆出                           |
| `@tabora/plugin-layout-dashboard`   | Dashboard layout                  | ~79 行  | 从 `layout-workbench-dashboard.tsx` 拆出                     |
| `@tabora/plugin-layout-stream`      | Stream layout（新增）             | ~80 行  | V2 新增                                                      |
| `@tabora/plugin-search-command-bar` | 命令搜索                          | ~257 行 | 从 `search-command-bar.tsx` 拆出                             |
| `@tabora/plugin-search-providers`   | 搜索源                            | ~48 行  | 从 `search-providers-basic.ts` 拆出                          |
| `@tabora/plugin-theme-default`      | 默认主题 pack                     | ~43 行  | 从 `theme-default-pack.ts` 拆出                              |
| `@tabora/plugin-background-basic`   | 基础背景                          | ~36 行  | 从 `background-basic.ts` 拆出                                |
| `@tabora/plugin-manager`            | 插件管理器                        | ~200 行 | 从 `plugin-manager.tsx` + `plugin-manager-entry.ts` 合并拆出 |
| `@tabora/plugin-settings-workspace` | 工作区设置                        | ~324 行 | 从 `settings-workspace.tsx` 拆出                             |

**总计：13 个独立插件包，~1983 行代码（拆后代码量基本不变，但结构更清晰）。**

### 3.3 哪些保持合并

| 合并项                  | 原因                                     |
| ----------------------- | ---------------------------------------- |
| Background basic 一个包 | Provider + Renderer 紧密耦合，分开无意义 |
| Theme default 一个包    | 明亮/暗色通常成对发布                    |

## 4. 共享基础设施

### 4.1 widget 共享 Hooks

多个 widget 有重复模式（localStorage 迁移、编辑/确认/取消状态管理、数据持久化）。提取为共享 hooks：

```ts
// packages/plugin-api/src/widget-helpers.ts（新增文件）
import type { WidgetViewData } from "./manifest"

/** localStorage → IndexedDB 迁移辅助 */
export function createWidgetDataMigration(
  instanceId: string,
  storageKey: string,
  data: WidgetViewData,
) {
  const existing = localStorage.getItem(storageKey)
  if (existing) {
    data.save(JSON.parse(existing)).catch(console.error)
    localStorage.removeItem(storageKey)
  }
}

/** 编辑状态管理 */
export function createEditState() {
  const [editing, setEditing] = createSignal(false)
  const start = () => setEditing(true)
  const cancel = () => setEditing(false)
  return { editing, start, cancel }
}
```

### 4.2 插件 manifest 工具

```ts
// packages/plugin-api/src/manifest-helpers.ts（新增文件）
import type { PluginManifest, WidgetContribution } from "./manifest"

/** 创建标准 widget contribution */
export function createWidgetContribution(opts: {
  id: string
  title: string
  sizes: ("S" | "M" | "L" | "XL")[]
  defaultSize: "S" | "M" | "L" | "XL"
  views: { card: string; modal?: string; fullscreen?: string }
}): WidgetContribution {
  return {
    id: opts.id,
    title: opts.title,
    supportedSizes: opts.sizes,
    defaultSize: opts.defaultSize,
    allowMultipleInstances: true,
    views: opts.views,
  }
}
```

### 4.3 测试基础设施

每个插件包独立测试，但共享 vitest 配置：

```ts
// tooling/vitest/plugin-config.ts（新增）
import { defineConfig } from "vitest/config"

export const pluginTestConfig = defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: [],
  },
})
```

每个插件包的 `vitest.config.ts`：

```ts
import { pluginTestConfig } from "@tabora/vitest-config"

export default pluginTestConfig
```

## 5. 迁移路径

### Phase 1: 基础设施（0.5 天）

1. 更新 `pnpm-workspace.yaml`，添加 `plugins/*`
2. 创建 `tooling/vitest/plugin-config.ts`
3. 创建 `plugins/widget-weather/` 作为第一个独立包
4. 验证独立包可以构建、可以测试、playground 可以引用

### Phase 2: Widget 插件迁移（1-2 天）

| 顺序 | 插件               | 复杂度                   |
| ---- | ------------------ | ------------------------ |
| 1    | plugin-weather     | 低（最简单，验证模式）   |
| 2    | plugin-today-focus | 低                       |
| 3    | plugin-todo        | 中                       |
| 4    | plugin-notes       | 中（有 modal view）      |
| 5    | plugin-quick-links | 中（有 fullscreen view） |

### Phase 3: 系统插件迁移（1 天）

| 顺序 | 插件                    |
| ---- | ----------------------- |
| 6    | plugin-theme-default    |
| 7    | plugin-background-basic |
| 8    | plugin-search-providers |

### Phase 4: 复合插件迁移（1-2 天）

| 顺序 | 插件                      | 复杂度                         |
| ---- | ------------------------- | ------------------------------ |
| 9    | plugin-layout-dashboard   | 中                             |
| 10   | plugin-layout-stream      | 中（新增）                     |
| 11   | plugin-search-command-bar | 高（依赖 search-providers）    |
| 12   | plugin-manager            | 高（依赖所有其他插件）         |
| 13   | plugin-settings-workspace | 高（依赖 theme/search/layout） |

### Phase 5: 装配与清理（1 天）

1. 创建 `packages/plugin-assembly/` 装配包
2. 更新 playground 的 import 路径
3. 运行全量测试确保无回归
4. 删除旧 `packages/official-plugins/` 目录

## 6. 源码管理策略

### 6.1 当前

```
packages/official-plugins/
  src/**/*.tsx  (15 files)
```

所有代码在一个目录，混淆了插件边界。

### 6.2 目标

```
plugins/widget-todo/         → 独立的开发和测试上下文
plugins/widget-weather/      → 可以独立修改、独立发布
plugins/layout-dashboard/    → 出问题时只影响该插件
```

### 6.3 插件间依赖

如果插件需要依赖另一个插件的能力（如 search-command-bar 需要 search-providers），通过 manifest 声明 + runtime context 获取：

```ts
// 不推荐：插件 A import 插件 B
import { something } from "@tabora/plugin-b" // ❌ 硬依赖，强耦合

// 推荐：通过 runtime context 获取
function activate(context: PluginRuntimeContext) {
  // 通过 registry 查找其他插件提供的贡献
  const providers = context.getContributions("search-provider") // ✅ 松耦合
}
```

## 7. 风险与应对

| 风险                                                  | 应对                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| 13 个包增加 workspace 管理复杂度                      | pnpm workspace 天然支持多包，`pnpm --filter` 可精确控制              |
| 插件间交叉依赖导致循环依赖                            | 插件间不直接 import，通过 runtime context + extension point 通信     |
| 迁移期间 playground 不可用                            | 先建新包，并行运行，验证通过后再删除旧包                             |
| 测试分散到 13 个包后难统一运行                        | `pnpm -r test` 递归运行所有包的测试                                  |
| plugin-manager 和 settings-workspace 依赖其他所有插件 | 它们通过 contribution 查询（runtime context）获取信息，不直接 import |
