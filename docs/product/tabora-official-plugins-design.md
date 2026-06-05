# Tabora 官方内置插件设计说明

版本：V2.0

日期：2026-06-02

状态：按 V2 设计规范与交互参考复核更新，确保官方插件规格与双布局工作台原型一致

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 设计事实源：`DESIGN.md`
- 工作台原型参考：`docs/design/03-工作台交互原型.html`
- 设计实现映射：`docs/product/tabora-design-system.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 文档地图：`docs/README.md`

## 1. 文档目标

本文档用于把 PRD 中的“官方内置插件”拆解成可设计、可实现、可验收的产品规格。

它回答四类问题：

- 官方内置插件分别承担什么产品职责。
- 每个插件应该如何交互、如何展示、如何处理状态。
- 官方插件的视觉语言、信息密度和体验参考是什么。
- 哪些能力属于 MVP，哪些能力只预留协议或进入后续版本。

官方插件不是平台的硬编码功能集合，而是 Tabora 插件体系的第一批标准样板。它们既要组成默认个人工作台体验，也要证明未来第三方插件可以用同一套 manifest、contribution、runtime context、permissions、storage 和 host container 协议接入。

## 2. 官方插件设计原则

### 2.1 插件即默认体验

Tabora 打开后的第一屏必须来自官方插件装配，而不是平台直接渲染固定功能。用户感知到的左侧轻 rail、命令搜索、布局、背景、主题、今日重点、快捷入口、便签、待办、天气和插件管理，都应能追溯到明确的插件 manifest 和 contribution。

### 2.2 平台只做通用能力

平台负责：

- 插件发现、校验、启用和注册。
- 扩展点协议。
- 工作区、区域和实例状态。
- 宿主容器、弹窗、全屏、错误边界。
- 权限桥和安全回退。
- IndexedDB 持久化。
- 主题 token 应用。

官方插件负责具体业务能力。即使是内置插件，也不能绕过平台协议直接操作宿主私有状态。

### 2.3 工作台优先，逐步增强

首次打开时，用户不需要配置就能使用：

- 左侧轻 rail。
- 顶部命令搜索。
- 基础搜索源。
- 主工作台网格。
- 今日重点。
- 快捷入口。
- 便签。
- 待办。
- 基础主题和背景。

天气和插件管理可以作为默认候选卡片，也可以在添加卡片面板或设置中心中出现。默认体验应克制但不空，避免用户打开后只看到“平台框架”的感觉。

### 2.4 官方插件也是生态示例

官方插件要给后续开发者示范：

- 如何声明 contribution。
- 如何按实例保存配置。
- 如何使用插件私有数据。
- 如何请求宿主 UI 能力。
- 如何请求外部打开权限。
- 如何处理空状态、错误状态和权限不足。

### 2.5 状态必须局部化

任何一个官方插件失败，都不能拖垮整个工作台：

- widget 失败：只显示该实例错误卡片。
- search 失败：顶部区域显示搜索不可用占位。
- background 失败：回退到安全纯色背景。
- theme 失败：回退到默认 token。
- plugin manager 失败：不影响其他插件使用。

## 3. 全局设计语言

Tabora 的视觉与交互事实源以根目录 `DESIGN.md` 为准。`docs/design/03-工作台交互原型.html` 只作为可交互原型参考，`docs/product/tabora-design-system.md` 只负责把这些事实映射到当前仓库实现。本章保留官方插件层面的摘要，用于说明内置插件如何遵守统一视觉、token、基础组件和宿主容器规范。

### 3.1 产品气质

Tabora 的官方体验应是“安静、清晰、可重复使用的个人工作台”，而不是营销页、内容门户或装饰型仪表盘。

关键词：

- 安静：视觉层次明确，不用夸张渐变和大面积装饰。
- 工作感：核心控件容易扫描，重复使用不疲劳。
- 可组合：每个卡片像一个稳定模块，而不是孤立装饰元素。
- 轻量：默认信息足够有用，不制造复杂配置压力。
- 可恢复：用户刷新、关闭、重开后，状态尽量原样回来。

### 3.2 视觉结构

V2 原型确认官方默认体验不是单一页面结构，而是两种并行成立的布局壳体：

```txt
dashboard
  rail
    home / add widget / plugins / settings
  workbench
    search command bar
    mainGrid
      widget instances
  modal / fullscreen host
  settings host

stream
  floating / compact toolbar
    settings / layout switch / theme
  command palette (⌘K)
  dual-column widget stream
  expand / context-menu / toast / settings host
```

设计要求：

- 仪表盘式布局使用左侧 rail + 顶部常驻搜索，流式布局使用 `⌘K` 浮层搜索和更沉浸的内容流；两种布局都必须保持官方插件能力完整可达。
- 主区域的卡片尺寸稳定，拖拽、hover、focus、双击展开和右键菜单都不能造成布局跳动。
- 主区域允许纵向延展；卡片过多时通过页面滚动访问，不为了塞进首屏牺牲可读性。
- 添加卡片、插件管理、设置、布局切换和主题切换入口要么在 rail / 工具条中可见，要么通过命令面板和快捷键始终可达。
- 弹窗、展开视图、Toast、快捷键面板和设置中心都由宿主统一提供容器，插件只渲染内容。
- 设置中心遵循原型中的左侧分类导航 + 右侧内容区结构，不作为常驻右侧栏。

### 3.3 色彩与主题

当前官方主题包提供：

| 主题                   | 用途           | 核心观感                                       |
| ---------------------- | -------------- | ---------------------------------------------- |
| `official.theme.light` | 默认明亮工作台 | 温和浅绿灰页面、白色表面、深色文本、绿色强调色 |
| `official.theme.dark`  | 暗色工作台     | 深灰页面、深色表面、浅色文本、青绿色强调色     |

设计语言：

- 使用主题 token，不在插件里硬编码大面积品牌色。
- 强调色只用于可点击状态、当前状态和少量关键数字。
- 背景可以有轻微层次，但不能影响卡片文字对比度。
- 卡片、搜索栏、弹窗都应在明亮和暗色主题下保持清晰边界。

建议 token 角色：

| Token           | 角色                     |
| --------------- | ------------------------ |
| `color-page`    | 页面底色                 |
| `color-surface` | 卡片、输入框、弹窗表面   |
| `color-text`    | 主文本                   |
| `color-muted`   | 次级文本、说明、辅助信息 |
| `color-accent`  | 主操作、选中态、链接     |
| `color-line`    | 边框、分割线             |
| `radius-card`   | 卡片和宿主容器半径       |

### 3.4 字体与信息密度

字体策略：

- 使用系统无衬线字体，保证中英文混排清晰。
- 页面不使用随视口宽度变化的字体。
- 卡片标题保持 14-16px，正文保持 12-14px。
- 搜索输入可稍大，但不做超大标题式输入。

信息密度：

- 默认卡片应可一眼扫完。
- S 尺寸只显示核心状态。
- M 尺寸显示核心状态加一组操作。
- L/XL 尺寸可显示列表、详情或编辑区。
- 卡片内部不堆叠第二层卡片。

### 3.5 控件语言与 `@tabora/ui`

`@tabora/ui` 已作为 MVP 基础组件包交付，目标是统一插件内容区控件的视觉、状态、可访问性和 theme token 使用方式。

边界：

- `@tabora/ui` 只提供插件内容区基础组件。
- `@tabora/ui` 可以依赖 `solid-js` 和 `@tabora/theme`。
- `@tabora/ui` 不能依赖 `@tabora/platform-kernel`、`@tabora/storage` 或任何官方插件。
- `@tabora/ui` 不提供 `WidgetCard`、`Modal`、`FullscreenHost`、`SettingsHost`、`WorkbenchRail` 等宿主级容器。
- 宿主级容器仍由 playground / extension shell 统一提供，插件只渲染容器内部内容。

统一控件建议：

| 场景         | 推荐控件                         |
| ------------ | -------------------------------- |
| 搜索源选择   | select 或后续 combobox           |
| 搜索快捷建议 | 小号 tag button                  |
| 主题切换     | icon button 或 segmented control |
| 背景切换     | select 或 popover grid           |
| 卡片尺寸     | select 或 segmented control      |
| 添加卡片     | icon + text button               |
| 删除卡片     | icon button，悬停显示危险态      |
| 展开弹窗     | icon button                      |
| 待办完成     | checkbox                         |
| 插件启用状态 | switch                           |
| 权限状态     | badge + 详情按钮                 |

MVP 组件清单：

| 组件               | 用途                               |
| ------------------ | ---------------------------------- |
| `Button`           | 文本或图标+文本操作                |
| `IconButton`       | 卡片操作、rail 操作、关闭/展开     |
| `Input`            | 单行输入                           |
| `Textarea`         | 便签、长文本输入                   |
| `Select`           | 搜索源、主题、背景等选项           |
| `Checkbox`         | 待办完成状态                       |
| `Switch`           | 插件启用状态                       |
| `SegmentedControl` | 尺寸、视图模式、简单二选一/多选一  |
| `Tabs`             | 设置面板内部分组                   |
| `Tooltip`          | 解释纯图标按钮                     |
| `Field`            | label、说明、错误的表单组合        |
| `Badge`            | 插件状态、权限状态、demo 标记      |
| `InlineError`      | 局部错误信息                       |
| `Spinner`          | 加载状态                           |
| `EmptyState`       | 卡片内轻量空状态                   |
| `ListRow`          | 插件列表、待办列表、设置列表项     |
| `CardSection`      | 插件卡片内部内容分区，不是卡片外壳 |

按钮必须有：

- pointer 光标。
- hover 状态。
- focus-visible 状态。
- 可读的 aria label 或可见文本。
- 固定尺寸，避免图标、文字或状态变化导致布局跳动。

官方插件新增 UI 时，默认优先使用 `@tabora/ui`。只有当某个插件有明确业务视觉需求时，才在插件内部补充局部样式；补充样式仍必须使用 theme token。

### 3.6 动效与反馈

动效应轻：

- hover 反馈 150-200ms。
- 弹窗出现可以淡入或轻微位移。
- 拖拽时只改变透明度、边框或阴影，不改变卡片实际尺寸。
- 尊重 `prefers-reduced-motion`。

反馈状态：

- 保存中：可使用细小状态文本或禁用态。
- 保存成功：不需要频繁 toast，保持安静。
- 保存失败：在对应控件附近显示错误。
- 权限拒绝：显示明确原因和下一步，而不是静默失败。

### 3.7 可访问性

所有官方插件都应满足：

- 键盘可聚焦。
- 表单输入有 label 或 aria label。
- 颜色不是唯一状态表达。
- 文本和背景对比度足够。
- 删除、外部打开、权限授权等操作有清晰语义。
- 弹窗打开后焦点进入弹窗，关闭后回到触发按钮。

## 4. 官方插件矩阵

| 插件 ID                               | 插件名称                   | 扩展点                                       | 默认启用 | 当前状态                                                                                 | 产品职责                                           |
| ------------------------------------- | -------------------------- | -------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `official.theme.default-pack`         | Tabora Default Theme Pack  | `theme`                                      | 是       | 已按 V2 原型 Refined Sage token 对齐明亮/暗色主题                                        | 提供明亮、暗色工作台主题                           |
| `official.background.basic`           | Basic Background           | `background-provider`, `background-renderer` | 是       | 已实现基础 provider 和 renderer view                                                     | 提供基础背景源和 CSS 背景渲染能力                  |
| `official.layout.workbench-dashboard` | Workbench Dashboard Layout | `layout`                                     | 是       | 已由独立 layout package 和 layout contribution 驱动                                      | 定义轻 rail + 命令搜索 + 主网格的默认布局          |
| `official.search.command-bar`         | Tabora Command Search      | `search`                                     | 是       | 已实现基础 UI 和外部打开权限桥；已使用 `@tabora/ui` 控件                                 | 提供命令搜索、搜索源选择和快捷建议                 |
| `official.search-providers.basic`     | Basic Search Providers     | `search-provider`                            | 是       | 已实现基础搜索源声明                                                                     | 提供 Google、Bing、百度、DuckDuckGo、GitHub 搜索源 |
| `official.widgets.today-focus`        | Today Focus Widget         | `widget`                                     | 是       | MVP 新增；已使用 `@tabora/ui` 控件                                                       | 提供今日重点，建立个人工作台心智                   |
| `official.widgets.quick-links`        | Quick Links Widget         | `widget`                                     | 是       | 当前在 productivity 包内；已使用 `@tabora/ui` 控件                                       | 提供快捷入口，验证外部打开和实例配置               |
| `official.widgets.notes`              | Notes Widget               | `widget`                                     | 是       | 当前在 productivity 包内；已使用 `@tabora/ui` 控件                                       | 提供便签和弹窗编辑，验证插件数据和 modal           |
| `official.widgets.todo`               | Todo Widget                | `widget`                                     | 是       | 当前在 productivity 包内；已使用 `@tabora/ui` 控件                                       | 提供待办列表，验证交互型 widget 和持久化           |
| `official.widgets.weather`            | Weather Widget             | `widget`                                     | 是       | 当前在 productivity 包内                                                                 | 提供天气摘要，按 `DESIGN.md` 进入默认工作台        |
| `official.plugin-manager`             | Plugin Manager             | `widget`, `settings-panel`                   | 是       | 已实现只读列表；已使用 `@tabora/ui` 控件                                                 | 展示插件状态、贡献能力和权限摘要                   |
| `official.settings.workspace`         | Workspace Settings         | `settings-panel`                             | 是       | 已实现轻量 settings host 面板贡献：外观、搜索；插件面板由 `official.plugin-manager` 贡献 | 聚合插件、外观、搜索等全局设置面板                 |

## 5. 默认装配方案

### 5.1 首次打开默认实例

建议默认装配：

| 区域       | 实例              | 来源插件                              | 尺寸         | 说明                                         |
| ---------- | ----------------- | ------------------------------------- | ------------ | -------------------------------------------- |
| `rail`     | `rail-main`       | `official.layout.workbench-dashboard` | 固定左侧区域 | 主页、添加卡片、切换主题、设置等工作台级入口 |
| `topbar`   | `search-main`     | `official.search.command-bar`         | 固定顶部区域 | 命令搜索入口                                 |
| `mainGrid` | `today-focus-1`   | `official.widgets.today-focus`        | M            | 今日重点，默认首屏第一张核心卡片             |
| `mainGrid` | `quick-links-1`   | `official.widgets.quick-links`        | M            | 快捷入口                                     |
| `mainGrid` | `todo-1`          | `official.widgets.todo`               | S            | 待办列表                                     |
| `mainGrid` | `notes-1`         | `official.widgets.notes`              | L            | 快速记录，按原型占据主编辑区域               |
| `mainGrid` | `weather-1`       | `official.widgets.weather`            | S            | 天气摘要，按原型进入默认工作台               |
| `mainGrid` | `plugin-status-1` | `official.plugin-manager`             | S            | 插件状态摘要，位于核心卡片之后               |
| `settings` | `plugin-manager`  | `official.plugin-manager`             | 设置面板     | 从设置中心进入完整插件管理                   |

当前实现由 `plugins/layout-dashboard` 中的 `official.layout.workbench-dashboard` 贡献整体布局 view。布局 contribution 的实例 region 为 `topbar` 和 `mainGrid`；左侧 rail 不承载插件实例，而由 layout view 通过 `LayoutHostAPI.getGlobalActions("rail")` 渲染主页、添加卡片、切换主题、设置等宿主动作用于对齐原型。Dashboard layout view 负责 `.workbench-grid` 容器，`WidgetCardShell` 负责按 widget size 设置 grid span 和稳定卡片高度。主网格默认按原型样张包含 `today-focus-1`、`quick-links-1`、`todo-1`、`notes-1`、`weather-1` 和 `plugin-status-1`。

默认工作台以 `DESIGN.md` 的工作台规则为视觉事实源，并以 `docs/design/03-工作台交互原型.html` 的仪表盘样张作为参考：首屏优先呈现命令搜索、今日重点、快捷入口、待办、便签和天气摘要。插件状态作为 S 尺寸摘要卡片进入默认主网格，但排在核心工作卡片之后，不抢占首屏核心位置；完整插件管理仍从设置中心进入。

### 5.2 默认插件加载顺序

建议顺序：

```txt
theme -> background -> layout -> search providers -> command search -> widgets -> plugin manager -> settings
```

原因：

- theme 和 background 先准备好视觉环境。
- layout 决定区域。
- search providers 先于 search command bar，方便搜索 UI 读取可用搜索源。
- widgets 在布局区域准备后渲染。
- plugin manager 和 settings 属于管理能力，可在默认工作台之后加载，但 MVP 需要提供可打开的轻量设置中心来验证 `settings-panel` 扩展点闭环。

### 5.3 默认页面交互示例

首次打开：

1. 平台发现并启用官方插件。
2. 主题插件提供默认明亮 token。
3. 背景插件提供默认背景源。
4. 布局插件提供 rail 宿主入口、`topbar` 搜索 region 和 `mainGrid` 网格 region。
5. 搜索插件渲染顶部命令搜索栏。
6. Widget 插件渲染今日重点、快捷入口、便签和待办。
7. 用户可以直接搜索、打开快捷链接、记录便签、处理待办。

刷新页面：

1. 平台恢复 workspace。
2. 平台恢复插件实例顺序、尺寸和配置。
3. 插件业务数据从 plugin storage 或实例存储中恢复。
4. 失败插件显示局部错误，其余区域继续可用。

## 6. `official.layout.workbench-dashboard`

### 6.1 产品定位

默认布局插件定义 Tabora 的基础页面骨架：左侧轻 rail、顶部命令搜索区和下方主网格。它不拥有任何具体业务内容，只规定区域结构、可接受的扩展点、默认实例引用和响应式能力。

### 6.2 Contribution

扩展点：`layout`

当前声明：

| 字段                  | 值                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------- |
| layout id             | `official.layout.workbench-dashboard`                                                    |
| title                 | `工作台仪表盘布局`                                                                       |
| regions               | `topbar`, `mainGrid`                                                                     |
| rail                  | 由 layout view 消费 `LayoutHostAPI.getGlobalActions("rail")` 渲染，不作为插件实例 region |
| `topbar.accepts`      | `search`                                                                                 |
| `topbar.maxInstances` | 1                                                                                        |
| `mainGrid.accepts`    | `widget`                                                                                 |
| `supportsResponsive`  | true                                                                                     |

### 6.3 信息架构

```txt
workbench-shell
  rail host actions
    home / add widget / plugins / settings
  content-region
    topbar-region
      search instance
    main-grid-region
      workbench-grid
      widget instances
```

布局插件只负责区域，不负责：

- 搜索框具体样式。
- 卡片内容。
- 添加卡片逻辑。
- 卡片拖拽排序。
- 插件管理和设置面板内容。
- 主题和背景。

这些能力由宿主或其他插件负责。

### 6.4 卡片溢出策略

当 `mainGrid` 中的 widget 实例超过一屏容量时，MVP 采用纵向工作区策略：

- 主网格继续自动换行并向下扩展。
- 页面允许纵向滚动。
- 不使用横向滚动作为默认方案。
- 不把所有卡片强行压缩到一屏。
- 新增卡片追加到网格末尾。
- 用户通过拖拽排序调整优先级，把高频卡片移动到上方。
- 用户通过尺寸选择把低频卡片调成 S 或 M。
- 刷新后保留顺序、尺寸和位置。

后续可增强：

- 卡片分组。
- 折叠区域或收纳区。
- 未放置卡片列表。
- 多 workspace。
- 卡片搜索和快速跳转。

### 6.5 交互示例

用户打开新标签页：

1. 布局插件被激活。
2. 宿主读取 layout contribution。
3. 布局 view 渲染 rail 宿主入口，并创建 `topbar` 和 `mainGrid` 渲染区。
4. 宿主在 `rail` 中渲染主页、添加卡片、插件和设置入口。
5. 宿主把 `search-main` 放入 `topbar`。
6. 宿主把 widget 实例放入 `mainGrid`。

用户切换未来另一个布局：

1. 用户进入布局设置。
2. 选择另一个 layout contribution。
3. 宿主检查新区能否接收现有实例。
4. 可迁移实例进入新区域。
5. 不可迁移实例进入“未放置”队列。
6. 用户确认后保存工作区。

布局失败：

1. 宿主发现布局 view 未注册或渲染失败。
2. 回退到官方默认布局。
3. 记录失败 layout id。
4. 用户仍可操作主工作台。

卡片过多：

1. 用户持续添加 widget 实例。
2. 主网格高度超过视口。
3. 新卡片追加到末尾。
4. 用户向下滚动访问低优先级卡片。
5. 用户把常用卡片拖到上方，并把低频卡片调小。

### 6.6 设计语言

布局应保持“工作台”而不是“落地页”：

- 左侧 rail 宽度控制在 56-64px，固定、低干扰。
- 顶部命令搜索在内容区顶部，宽度受限，方便快速聚焦。
- 主网格宽度稳定，默认桌面 4 列。
- 主网格不固定一屏高度，允许自然纵向滚动。
- 首屏优先展示今日重点、快捷入口、便签和待办。
- 移动端单列，卡片按顺序堆叠。
- 移动端 rail 折叠为底部工具条或顶部紧凑操作区。
- 移动端不出现横向滚动。
- 区域之间保持明确间距，但不使用大段说明文字。

### 6.7 参考对象

参考对象用于交互模式借鉴，不要求视觉复刻：

| 参考对象                     | 借鉴点                     |
| ---------------------------- | -------------------------- |
| Vivaldi Start Page Dashboard | 可排列 widget 和仪表盘区域 |
| Raycast / Spotlight          | 顶部命令入口和键盘优先     |
| Notion dashboard             | 模块化工作区和轻量信息块   |
| iOS / macOS Widget Gallery   | 语义尺寸和组件化卡片       |
| Windows Widgets              | 信息卡片可组合的仪表盘感   |

### 6.8 验收标准

- 默认布局由 manifest 声明，不由宿主硬编码业务区域。
- `rail` 提供主页、添加卡片、插件和设置等工作台级入口。
- `topbar` 只接收 search 实例。
- `mainGrid` 只接收 widget 实例。
- 移动端布局不产生横向滚动。
- 卡片超过首屏时，主网格可纵向滚动且不压缩卡片到不可读。
- layout 失败时有安全回退。

## 6b. `official.layout.workbench-stream`（流式布局 · V2 新增）

### 6b.1 产品职责

Stream 是 MVP 第二种官方布局插件，用于验证布局协议的通用性和不同结构范式下的平台可靠性。它采用全屏流式设计，适合专注型用户和移动端场景。

与 Dashboard 的关键差异：

| 维度     | Dashboard            | Stream                           |
| -------- | -------------------- | -------------------------------- |
| Rail     | 固定左侧 56px 图标栏 | 可折叠顶部工具条（仅含设置入口） |
| 搜索     | 常驻搜索栏           | ⌘K 浮层唤起                      |
| 卡片排列 | 4 列自适应网格       | 桌面双列 / 移动单列流式          |
| 首屏     | 搜索 + 网格直接可见  | 大标题 hero + 下方滚动呈现卡片   |
| 信息密度 | 高（并行多卡片）     | 中（专注少卡片）                 |

### 6b.2 布局结构

```txt
stream-layout
  toolbar（可折叠）
    logo / ⌘K 搜索触发 / 添加卡片 / 设置
  hero
    greeting + date + search-mini
  stream（双列流式区域）
    widget instances
```

### 6b.3 区域定义

| 区域 ID   | 接受扩展点 | 说明                                     |
| --------- | ---------- | ---------------------------------------- |
| `toolbar` | `layout`   | 顶部可折叠工具条，仅含设置入口和搜索触发 |
| `stream`  | `widget`   | 双列（桌面）/ 单列（移动）卡片流式区域   |

### 6b.4 交互模式（V2 原型中验证）

- **⌘K 全局搜索**：Stream 下搜索栏不常驻，完全通过 ⌘K 浮层唤起。⌘K 由平台注册为全局快捷键。
- **双击卡片展开**：双击卡片弹出展开视图，每种卡片类型有定制化内容布局（今日重点→大号输入框，便签→全高文本域，待办→可交互列表等）。
- **拖拽实时换位**：卡片可直接拖拽排序，悬停到目标位时实时交换位置，无需占位符。
- **右键上下文菜单**：右键卡片弹出尺寸选择 + 展开 + 移除操作。
- **搜索内联建议**：搜索栏输入实时过滤命令/卡片/搜索，分组显示结果，↑↓ 键盘导航。
- **设置侧栏导航**：左侧分类导航（通用 · 外观 · 搜索 · 插件 · 关于）+ 右侧内容区。
- **Toast 堆叠**：多条通知叠加显示，新通知滑入，超过 3 条自动清理。

详细交互规格以 `DESIGN.md` 为准；可交互原型参考见 `docs/design/03-工作台交互原型.html`。

## 7. `official.search.command-bar`

### 7.1 产品定位

搜索命令栏是 Tabora 的主要启动入口。它负责让用户用最少动作完成搜索、跳转或后续命令式能力。MVP 先聚焦搜索，后续可以演进为搜索 + 命令入口。

### 7.2 Contribution

扩展点：`search`

当前声明：

| 字段                | 值                                               |
| ------------------- | ------------------------------------------------ |
| search id           | `official.search.command-bar`                    |
| title               | `搜索栏`                                         |
| defaultProviderIds  | `official.search.google`, `official.search.bing` |
| supportsSuggestions | true                                             |
| view                | `official.search.command-bar.view`               |
| permission          | `external-open`                                  |

### 7.3 交互结构

```txt
dashboard
  search-wrapper
    search-bar
      provider indicator / selector
      query input
    suggestions
      grouped results

stream
  command-palette (⌘K)
    query input
    provider hint / token
    grouped results
```

MVP 控件：

- Dashboard 常驻搜索栏。
- Stream / 全局 `⌘K` 命令面板搜索表面。
- 搜索源指示器或选择器。
- 搜索输入框。
- 分组结果列表。
- `@provider` 提示与当前搜索源状态。

后续控件：

- 搜索历史。
- 多搜索源并发预览。
- 更复杂的本地命令系统。

### 7.4 交互示例

基础搜索：

1. 用户点击搜索输入框。
2. 输入 `solidjs signal`。
3. 按 Enter。
4. 搜索插件读取当前搜索源。
5. 插件把 query 注入 URL template。
6. 插件通过 `context.permissions.openExternal(url)` 请求外部打开。
7. 宿主权限桥校验 host。
8. 校验通过后宿主打开外部搜索结果。

空查询：

1. 用户聚焦输入框但不输入内容。
2. 用户按 Enter。
3. 搜索插件不触发任何外部打开。
4. 输入框保持聚焦，不显示错误。

Dashboard 内联建议：

1. 用户聚焦空输入框。
2. 搜索区域显示分组建议，如常用命令、最近搜索、推荐搜索源或核心卡片入口。
3. 用户按 `ArrowDown` 进入结果列表。
4. 按 `Enter` 执行当前高亮项。
5. 外部打开或内部命令都走宿主统一执行路径。

`@provider` 切换搜索源：

1. 用户输入 `@github vite-plus`。
2. 搜索插件识别 `@github` 为搜索源 token，并在 UI 中显示当前 provider。
3. 剩余 query 为 `vite-plus`。
4. 用户按 `Enter`。
5. 跳转到 GitHub 搜索 URL。

Stream 搜索：

1. 用户位于流式布局。
2. 按 `⌘K` 打开命令面板。
3. 输入 `theme` 或 `@bing 天气`。
4. 面板实时显示分组结果，支持键盘导航。
5. `Enter` 执行高亮命令或搜索。

权限被拒绝：

1. 插件请求打开外部 URL。
2. 权限桥发现 host 不在允许范围内。
3. `openExternal` 返回失败。
4. 搜索栏显示“无法打开该搜索源，请检查插件权限”。
5. 用户可进入插件管理查看权限。

### 7.5 输入与键盘行为

| 按键      | 行为                                     |
| --------- | ---------------------------------------- |
| Enter     | 提交当前查询或执行当前高亮结果           |
| Esc       | 关闭面板、收起建议或清空当前瞬时状态     |
| ArrowDown | 进入建议列表并移动到下一项               |
| ArrowUp   | 返回输入框或移动到上一条建议             |
| Tab       | 按正常焦点顺序移动，不劫持浏览器默认行为 |

输入规则：

- query 提交前 trim。
- 空 query 不触发搜索。
- 支持 `@provider` 语法临时切换搜索源。
- `@provider` 单独输入时进入待补全 / 待输入 query 的提示状态。
- URL 中 query 必须 encode。
- 外部打开必须走权限桥。

### 7.6 状态设计

| 状态               | UI 表达                                        |
| ------------------ | ---------------------------------------------- |
| 默认               | 搜索源指示器 + 输入框                          |
| 聚焦空输入         | 显示分组建议 / 收藏命令 / 推荐入口             |
| 输入中             | 实时过滤结果并高亮当前项                       |
| `@provider` 待补全 | 显示 provider token 已识别的提示态             |
| 提交中             | 可短暂禁用输入或保持无感                       |
| 权限拒绝           | 输入框下方显示小号错误文本或 Toast             |
| provider 不可用    | 搜索源指示器禁用并显示占位                     |
| view 错误          | Dashboard 顶部区域或 ⌘K 面板显示搜索不可用占位 |

### 7.7 设计语言

搜索栏是首屏主控件：

- 宽度桌面建议 720-840px。
- 高度建议 52-60px。
- 使用清晰边框和轻阴影。
- 搜索源指示器和输入框之间用细分割线或弱分组。
- 建议列表使用清晰分组标题、紧凑但可扫描的结果行。
- 搜索栏不使用大面积品牌渐变。
- `⌘K` 面板沿用 V2 原型中的 CommandPalette / Dialog 视觉语言，不把它做成第二套风格。

### 7.8 参考对象

| 参考对象            | 借鉴点                    |
| ------------------- | ------------------------- |
| Raycast             | 搜索和命令入口合一的心智  |
| macOS Spotlight     | 快速聚焦、键盘优先        |
| Chrome 新标签页搜索 | 新标签页第一入口          |
| Arc Command Bar     | 浏览器内命令式入口        |
| GitHub 搜索         | provider 作为具体搜索目标 |

### 7.9 MVP 与后续

MVP：

- 搜索输入。
- Dashboard 内联建议。
- Stream 通过 `⌘K` 唤起搜索。
- 搜索源选择与状态指示。
- 搜索 provider 从 registry 动态读取。
- 默认搜索源设置和持久化。
- `@provider` 临时切换。
- 分组结果与键盘导航。
- 外部打开权限桥。
- 空查询保护。

V1.1：

- 搜索历史。
- 更复杂的本地命令系统。

V1.5：

- 多搜索源并发预览。
- 搜索建议接口增强。
- 搜索历史权重与个性化排序。

### 7.10 验收标准

- 搜索 UI 来自 `search` contribution。
- 搜索源来自 `search-provider` contribution。
- Dashboard 提供实时内联建议；Stream 仅通过 `⌘K` 唤起搜索。
- 支持 `@provider` 临时切换搜索源，并在 UI 中可理解地反馈当前 provider。
- 支持 `↑/↓`、`Enter`、`Esc` 等键盘交互。
- 外部打开必须通过 `context.permissions.openExternal`。
- 空 query 不触发外部打开。
- 切换搜索源后 URL template 正确生效。
- 权限拒绝有用户可理解的反馈。

## 8. `official.search-providers.basic`

### 8.1 产品定位

基础搜索源插件提供常用搜索目标。它只声明搜索源元数据，不渲染 UI，也不自己打开 URL。这样搜索 UI 可以替换，而搜索源能力保持复用。

### 8.2 Contribution

扩展点：`search-provider`

当前搜索源：

| Provider ID                  | 名称       | Shortcut | URL Template                              |
| ---------------------------- | ---------- | -------- | ----------------------------------------- |
| `official.search.google`     | Google     | `g`      | `https://www.google.com/search?q={query}` |
| `official.search.bing`       | Bing       | `b`      | `https://www.bing.com/search?q={query}`   |
| `official.search.baidu`      | 百度       | `d`      | `https://www.baidu.com/s?wd={query}`      |
| `official.search.duckduckgo` | DuckDuckGo | `dd`     | `https://duckduckgo.com/?q={query}`       |
| `official.search.github`     | GitHub     | `gh`     | `https://github.com/search?q={query}`     |

### 8.3 交互示例

用户设置默认搜索源：

1. 用户进入搜索设置。
2. 搜索设置读取所有 `search-provider` contribution。
3. 用户把 `Bing` 设为默认。
4. workspace 或插件配置保存默认 provider id。
5. 下次打开时搜索栏默认选中 Bing。

用户使用 `@token`：

1. 用户输入 `@github solid router`。
2. 搜索栏识别 `@github` 为 GitHub provider token。
3. query 变成 `solid router`。
4. 跳转到 GitHub 搜索。

禁用搜索源：

1. 用户进入搜索源管理。
2. 关闭 `百度`。
3. 搜索栏 provider 列表移除百度。
4. 已保存为默认时，自动回退到第一个可用搜索源。

### 8.4 设计语言

搜索源在 UI 中应轻量呈现：

- 列表中显示名称、shortcut 和 host。
- 默认搜索源用选中态表示。
- 禁用态不删除用户配置。
- provider 图标后续应使用统一图标集或真实品牌图标，不用随意 emoji。

### 8.5 参考对象

| 参考对象               | 借鉴点                                |
| ---------------------- | ------------------------------------- |
| 浏览器默认搜索引擎设置 | 默认搜索源、搜索源启用和 URL template |
| Raycast extensions     | shortcut 快速选择目标                 |
| Alfred Web Search      | keyword + query 模式                  |
| VS Code settings       | 设置项可搜索、可恢复默认              |

### 8.6 MVP 与后续

MVP：

- 声明基础搜索源。
- 搜索栏可使用 URL template。
- provider 动态注册和读取。
- 默认搜索源持久化。
- 权限声明支持外部打开。

V1.1：

- 启用/禁用搜索源。

V1.5：

- 自定义搜索源。
- 搜索建议 endpoint。
- provider 图标。
- provider 分组，例如 Web、代码、文档、购物。

### 8.7 验收标准

- 搜索源插件不渲染搜索 UI。
- URL template 必须包含 `{query}`。
- query 必须被 encode 后注入。
- 搜索源禁用后不出现在搜索栏中。
- 默认搜索源不可用时有回退。

## 9. `official.background.basic`

### 9.1 产品定位

基础背景插件提供低风险、低复杂度的背景能力。MVP 先用纯色和渐变证明背景 provider 和 renderer 协议，避免过早引入图片版权、远程加载、视频和 WebGL 复杂度。

### 9.2 Contribution

扩展点：

- `background-provider`
- `background-renderer`

当前 provider：

| Provider ID                 | 名称     | sourceType  | source                      |
| --------------------------- | -------- | ----------- | --------------------------- |
| `background.solid-green`    | 纯色绿底 | `generated` | `{ type: "css", css }`      |
| `background.solid-dark`     | 纯色暗底 | `generated` | `{ type: "css", css }`      |
| `background.gradient-green` | 渐变绿底 | `generated` | `{ type: "gradient", css }` |
| `background.gradient-blue`  | 渐变蓝底 | `generated` | `{ type: "gradient", css }` |

当前 renderer：

| Renderer ID                        | 名称           | accepts           |
| ---------------------------------- | -------------- | ----------------- |
| `official.background.css-renderer` | CSS 背景渲染器 | `css`, `gradient` |

### 9.3 交互示例

切换背景：

1. 用户打开背景选择控件。
2. 宿主读取 `background-provider` contributions。
3. 用户选择 `渐变蓝底`。
4. 宿主保存 `activeBackgroundProviderId`。
5. 宿主找到兼容的 background renderer。
6. 背景层更新，不影响卡片实例。

背景渲染失败：

1. renderer view 抛错或不可用。
2. 宿主移除背景层或使用 `color-page`。
3. 工作台卡片继续渲染。
4. 背景选择器显示失败状态。

未来上传本地背景：

1. 用户点击“添加背景”。
2. 宿主发起本地文件授权流程。
3. provider 保存用户选择的图片引用。
4. renderer 使用 image 渲染。
5. 若文件不可访问，回退到默认背景。

### 9.4 状态设计

| 状态            | UI 表达                        |
| --------------- | ------------------------------ |
| 当前背景        | 背景列表选中态                 |
| 预览            | 小色块或缩略图                 |
| 加载中          | 背景列表项 skeleton 或 spinner |
| 渲染失败        | 使用页面底色，设置中显示错误   |
| 不兼容 renderer | 禁用该背景源并显示原因         |

### 9.5 设计语言

背景要服务可读性：

- 默认背景低对比，不干扰文字。
- 渐变不要太饱和。
- 背景和卡片之间要有足够层次。
- 不使用离散装饰光斑或大面积装饰元素作为默认背景。
- 背景切换不应造成内容重排。

### 9.6 参考对象

| 参考对象             | 借鉴点                   |
| -------------------- | ------------------------ |
| macOS Wallpaper 设置 | 背景预览、选择和持久化   |
| Arc Browser 主题     | 浏览器工作空间的背景氛围 |
| Windows 个性化设置   | 背景源和渲染模式分离     |
| VS Code 主题生态     | 视觉资源由贡献项声明     |

### 9.7 MVP 与后续

MVP：

- 纯色和渐变背景源。
- CSS renderer。
- 背景选择持久化。
- 渲染失败回退。

V1.1：

- 背景预览网格。
- 图片背景 provider。
- 背景亮度/模糊/遮罩配置。

V1.5：

- 本地图片集合。
- 每日背景。
- 收藏背景。
- 远程背景源。

V2：

- 视频、Canvas、WebGL renderer。
- 第三方背景插件。
- 背景权限审计。

### 9.8 验收标准

- 背景源来自 `background-provider` contribution。
- 背景渲染来自 `background-renderer` contribution。
- 背景选择跨会话保留。
- renderer 失败时工作台仍可用。
- 背景不能降低主要文本可读性。

## 10. `official.theme.default-pack`

### 10.1 产品定位

默认主题包定义 Tabora 的基础视觉 token。它是所有官方插件共享的视觉契约，也是未来第三方主题插件的示例。

### 10.2 Contribution

扩展点：`theme`

当前主题：

| Theme ID               | 名称       | 用途         |
| ---------------------- | ---------- | ------------ |
| `official.theme.light` | 明亮工作台 | 默认明亮主题 |
| `official.theme.dark`  | 暗色工作台 | 暗色环境     |

### 10.3 Token 说明

| Token           | 明亮主题      | 暗色主题      | 说明       |
| --------------- | ------------- | ------------- | ---------- |
| `color-page`    | `237 241 238` | `18 18 18`    | 页面底色   |
| `color-surface` | `255 255 255` | `30 30 30`    | 卡片和弹窗 |
| `color-text`    | `31 35 32`    | `230 230 230` | 主文本     |
| `color-muted`   | `102 112 105` | `140 140 140` | 次级文本   |
| `color-accent`  | `35 113 89`   | `80 200 160`  | 强调色     |
| `color-line`    | `210 218 213` | `50 50 50`    | 边框线     |
| `radius-card`   | `16px`        | `16px`        | 卡片半径   |

### 10.4 交互示例

切换主题：

1. 用户点击主题切换按钮。
2. 宿主读取 `theme` contribution。
3. 用户选择 `暗色工作台`。
4. 宿主把 token 应用到 workspace root。
5. 宿主保存 `activeThemeId`。
6. 所有官方插件使用 CSS variables 自动更新。

主题失败：

1. 主题 token 缺失或非法。
2. 宿主回退到内置安全 token。
3. 显示“主题加载失败，已使用默认主题”。
4. 插件内容继续可用。

### 10.5 设计语言

主题包应保证“安静专业”：

- 明亮主题不能过白刺眼，页面底色可略带灰绿。
- 暗色主题不能纯黑，使用深灰降低疲劳。
- accent 只用于链接、选中、主按钮和关键状态。
- 卡片透明度要控制，明亮主题下避免低透明导致边界不可见。

### 10.6 参考对象

| 参考对象              | 借鉴点                   |
| --------------------- | ------------------------ |
| VS Code themes        | token 化主题生态         |
| Linear                | 高密度工作产品的克制视觉 |
| Notion                | 中性表面和内容优先       |
| macOS light/dark mode | 系统级明暗切换心智       |

### 10.7 MVP 与后续

MVP：

- 明亮主题。
- 暗色主题。
- CSS variables 应用。
- 主题选择持久化。

V1.1：

- 主题预览。
- 跟随系统。
- 高对比主题。

V1.5：

- 主题编辑器。
- 导入/导出主题。
- 第三方主题包。

### 10.8 验收标准

- 官方插件样式使用 token，不依赖硬编码大面积颜色。
- 切换主题不刷新页面。
- 主题选择跨会话恢复。
- 明亮和暗色主题下文本可读。
- token 缺失时有安全回退。

## 11. `official.widgets.productivity`

### 11.1 产品定位

生产力插件包提供默认工作台的基础内容卡片。它不是一个单一 widget，而是一组同源生产力 widget 的官方集合。

产品口径上，MVP 应把这些能力视为独立官方 widget：`today-focus`、`quick-links`、`notes`、`todo` 和 `weather`。工程上可以暂时继续放在 `official.widgets.productivity` 包内，但 manifest、文档和验收需要按独立 widget 能力理解，避免把“生产力包”变成新的业务大杂烩。

当前实现包含：

- 快捷入口。
- 便签。
- 待办。
- 天气。

MVP 目标新增：

- 今日重点。

规划可扩展：

- 日历。
- 倒计时。
- RSS。
- 书签集合。
- 最近访问。
- 剪贴板片段。

### 11.2 Contribution

扩展点：`widget`

MVP widget 清单：

| Widget ID     | 名称     | 支持尺寸    | 默认尺寸 | 允许多实例 | Views       | MVP 默认 |
| ------------- | -------- | ----------- | -------- | ---------- | ----------- | -------- |
| `today-focus` | 今日重点 | S, M, L     | M        | 是         | card        | 是       |
| `quick-links` | 快捷入口 | S, M, L     | M        | 是         | card        | 是       |
| `notes`       | 便签     | S, M, L     | M        | 是         | card, modal | 是       |
| `todo`        | 待办     | S, M, L, XL | M        | 是         | card        | 是       |
| `weather`     | 天气     | S, M        | S        | 是         | card        | 是       |

### 11.3 统一卡片规范

每个 widget 卡片应遵循：

- 标题由宿主卡片 header 渲染。
- 插件 view 只负责 body 内容。
- 支持尺寸必须由 manifest 声明。
- 卡片内操作不影响宿主布局尺寸。
- 多实例数据应按实例隔离，除非产品明确要求全局共享。
- 内容过长时使用内部滚动或截断，不撑破卡片。

### 11.4 Widget 尺寸语义

| 尺寸 | 用途                      | 示例                     |
| ---- | ------------------------- | ------------------------ |
| S    | 一个核心状态或 1-2 个入口 | 天气温度、单个快捷入口组 |
| M    | 默认工作卡片              | 便签、待办、快捷入口     |
| L    | 详情更多、列表更多        | 长便签、多链接、多待办   |
| XL   | 复杂列表或全宽视图        | 待办计划、RSS、日历      |

### 11.5 今日重点 `today-focus`

#### 产品定位

今日重点是 Tabora 从“高级新标签页”转向“个人工作台”的关键心智卡片。它只记录用户今天最想推进的一件事或一组极少量重点，不做日程、不做项目管理、不做跨插件复杂聚合。

#### 交互示例

设置今日重点：

1. 用户点击今日重点卡片中的输入区域。
2. 输入 `完成工作台 MVP 布局评审`。
3. 插件自动保存到当前实例数据。
4. 卡片展示重点内容和更新时间。

标记完成：

1. 用户点击完成 checkbox 或完成按钮。
2. 卡片状态变为已完成。
3. 文本弱化，保留当天记录。
4. 用户可以重新打开或清空。

空状态：

1. 用户首次打开工作台。
2. 卡片显示一个短输入位，例如 `今天最重要的一件事`。
3. 不展示大段引导文案。

#### 设计语言

- M 尺寸显示一句重点和完成状态。
- S 尺寸只显示重点摘要或完成状态。
- L 尺寸可以展示一条补充说明或最近更新时间。
- 不使用进度环、日程表和复杂统计，避免产品过重。

#### 参考对象

| 参考对象               | 借鉴点                 |
| ---------------------- | ---------------------- |
| Momentum Focus         | 每日重点心智           |
| Things Today           | 当天工作焦点           |
| Notion dashboard       | 工作台里的轻量文本模块 |
| Apple Reminders widget | 小尺寸完成状态表达     |

#### MVP 与后续

MVP：

- 单条今日重点。
- 完成/取消完成。
- 本地持久化。

V1.1：

- 重点历史。
- 每日自动重置策略。
- 与待办卡片建立轻关联。

V1.5：

- 多重点。
- 简单模板。
- 与日历或任务插件集成。

#### 验收标准

- 默认首屏出现今日重点卡片。
- 空状态可直接输入，不需要先配置。
- 刷新后内容和完成状态恢复。
- 不引入复杂日程或任务管理能力。

### 11.6 快捷入口 `quick-links`

#### 产品定位

快捷入口是用户最常用站点、工具和工作路径的启动器。MVP 当前提供 GitHub 和 Vite+ 示例链接，后续应支持用户自定义。

#### 交互示例

打开链接：

1. 用户点击 `GitHub`。
2. 插件请求或直接打开外部链接。
3. 后续应改为通过权限桥打开，保证官方插件也遵守 external-open 协议。

添加快捷入口：

1. 用户点击卡片内添加按钮。
2. 弹出编辑表单。
3. 用户输入标题、URL、图标或颜色。
4. 插件校验 URL。
5. 保存到当前实例配置或 plugin data。
6. 新入口出现在该卡片中。

编辑入口：

1. 用户悬停某个入口。
2. 显示编辑和删除按钮。
3. 点击编辑。
4. 修改标题或 URL。
5. 保存后卡片即时更新。

空状态：

1. 用户删除所有入口。
2. 卡片显示“添加第一个入口”按钮。
3. 不显示解释性大段文案。

#### 设计语言

- 入口可以使用图标 + 短标题。
- S 尺寸最多显示 2-4 个入口。
- M 尺寸建议 4-8 个入口。
- L 尺寸可以分组。
- 链接按钮大小稳定，hover 不改变布局。
- 后续图标优先使用真实站点图标或统一 icon，不使用随意 emoji。

#### 参考对象

| 参考对象                | 借鉴点                   |
| ----------------------- | ------------------------ |
| Chrome 新标签页快捷方式 | 快速站点入口             |
| Raindrop.io collections | 收藏分组和视觉入口       |
| Arc Favorites           | 浏览器工作流中的常用入口 |
| iOS Home Screen widgets | 小尺寸入口密度           |

#### MVP 与后续

MVP：

- 展示默认链接。
- 点击打开链接。

V1.1：

- 自定义链接。
- 实例级链接列表。
- 外部打开走权限桥。

V1.5：

- 分组。
- favicon。
- 导入浏览器书签。
- 拖拽排序。

#### 验收标准

- 链接列表不写死在宿主。
- 多实例之间链接配置可隔离。
- URL 非法时不能保存。
- 外部链接打开符合权限模型。

### 11.7 便签 `notes`

#### 产品定位

便签用于快速记录临时想法、待复制文本或当天提示。它应比完整笔记应用更轻，不追求复杂文档编辑。

#### 当前实现

当前卡片和弹窗都使用 `localStorage` 的 `notes-content`，属于全局共享便签内容。后续应迁移到 plugin data，并支持按实例隔离。

#### 交互示例

快速记录：

1. 用户点击便签卡片文本区域。
2. 输入内容。
3. 内容自动保存。
4. 刷新页面后内容恢复。

打开弹窗编辑：

1. 用户点击卡片 header 的展开按钮。
2. 宿主打开 modal。
3. 插件渲染 `official.widgets.notes.modal`。
4. 用户在更大的编辑区输入。
5. 自动保存。
6. 关闭弹窗后卡片内容同步更新。

清空内容：

1. 用户选择更多菜单中的清空。
2. 系统二次确认。
3. 清空当前实例便签。
4. 显示空 textarea。

保存失败：

1. 用户输入内容。
2. IndexedDB 保存失败。
3. 文本区域保留当前输入。
4. 卡片底部显示“暂未保存”。
5. 恢复后自动重试或用户手动重试。

#### 状态设计

| 状态     | UI 表达                   |
| -------- | ------------------------- |
| 空       | placeholder `写点什么...` |
| 编辑中   | 文本区域聚焦边界          |
| 已保存   | 默认不提示                |
| 保存中   | 可显示细小 pending 状态   |
| 保存失败 | 底部小号错误文本          |
| 弹窗编辑 | 更大编辑区，保留同一内容  |

#### 设计语言

- 卡片内 textarea 无边框或弱边框，像轻量纸张。
- 行高舒适，适合中文短句。
- 不使用富文本工具栏作为 MVP。
- 弹窗编辑区可有边框，强化可编辑区域。
- 长内容在卡片内滚动或截断，不能撑破布局。

#### 参考对象

| 参考对象               | 借鉴点               |
| ---------------------- | -------------------- |
| Apple Notes Quick Note | 随手记录             |
| Google Keep            | 轻量便签和卡片心智   |
| Notion text block      | 低干扰输入           |
| Windows Sticky Notes   | 简单、持续存在的便签 |

#### MVP 与后续

MVP：

- 卡片内编辑。
- 弹窗编辑。
- 自动保存。

V1.1：

- 使用 plugin data。
- 按实例隔离。
- 保存状态反馈。
- 清空操作。

V1.5：

- 多便签列表。
- Markdown 预览。
- 固定便签颜色。
- 搜索便签。

#### 验收标准

- 内容刷新后恢复。
- modal 和 card 内容同步。
- 多实例策略明确，建议实例隔离。
- 保存失败不丢当前输入。
- 长文本不破坏卡片布局。

### 11.8 待办 `todo`

#### 产品定位

待办卡片用于管理短周期任务，不替代完整项目管理软件。它应支持快速添加、完成、删除和查看完成度。

#### 当前实现

当前待办使用 `@tabora/storage` 的 plugin data repository，保存 `todo/items`。后续应加入 instanceId，避免多个待办实例共享同一列表，除非用户选择“共享列表”。

#### 交互示例

添加待办：

1. 用户在输入框输入 `整理插件文档`。
2. 按 Enter 或点击加号按钮。
3. 插件创建 todo item。
4. 输入框清空。
5. 列表显示新项目。
6. 数据保存到 plugin storage。

完成待办：

1. 用户点击 checkbox。
2. item 状态切换为 done。
3. 文本显示删除线和 muted 色。
4. 底部完成数更新，例如 `1/3 完成`。
5. 数据保存。

删除待办：

1. 用户悬停 todo item。
2. 删除按钮显示。
3. 用户点击删除。
4. item 从列表移除。
5. 数据保存。

空状态：

1. 列表为空。
2. 只显示输入框。
3. 可在下方显示轻量 placeholder，例如“今天先写一件事”。

保存失败：

1. 用户添加或切换状态。
2. 保存失败。
3. UI 可先保持乐观更新。
4. 底部显示“同步失败，稍后重试”。
5. 后续需要提供重试或回滚策略。

#### 状态设计

| 状态     | UI 表达                      |
| -------- | ---------------------------- |
| 空列表   | 输入框 + 轻量空提示          |
| 有列表   | checkbox + 文本 + hover 删除 |
| 已完成   | 删除线 + muted 文本          |
| 输入为空 | 加号按钮可禁用或点击无效     |
| 保存失败 | footer 错误提示              |
| 列表过长 | 内部滚动                     |

#### 设计语言

- 输入框和加号按钮尺寸一致。
- checkbox 使用 accent 色。
- 删除按钮默认弱化，hover 显示。
- 列表行高紧凑但可点击区域足够。
- footer 保持小号，不抢主内容。

#### 参考对象

| 参考对象               | 借鉴点                 |
| ---------------------- | ---------------------- |
| Todoist                | 快速添加和完成任务     |
| Things                 | 安静、低噪音的任务列表 |
| Microsoft To Do        | 简洁 checkbox 心智     |
| Apple Reminders widget | 小尺寸展示完成状态     |

#### MVP 与后续

MVP：

- 添加。
- 完成/取消完成。
- 删除。
- 完成计数。
- 持久化。

V1.1：

- 按实例隔离数据。
- 编辑 todo 文本。
- 清空已完成。
- 保存失败反馈。

V1.5：

- 分组。
- 日期。
- 优先级。
- 拖拽排序。
- 多列表。

#### 验收标准

- 空输入不能创建 item。
- 添加后刷新可恢复。
- 完成状态刷新可恢复。
- 删除后刷新不再出现。
- 多实例数据隔离策略明确并实现。

### 11.9 天气 `weather`

#### 产品定位

天气卡片提供环境信息，不应成为复杂天气应用。MVP 可使用 mock 数据验证 widget 和状态刷新，真实发布前应接入可配置天气 provider。

#### 当前实现

当前天气显示北京 mock 数据，并每 30 秒随机刷新。当前 UI 使用天气符号作为视觉图标；后续应迁移为统一图标组件或天气图标资源。

#### 交互示例

查看天气：

1. 用户看到天气卡片。
2. 卡片显示温度、城市、天气状况、湿度、风速。
3. S 尺寸显示核心温度和城市。
4. M 尺寸显示更多指标。

切换城市：

1. 用户打开天气卡片设置。
2. 输入城市，例如 `上海`。
3. 插件请求天气 provider。
4. 保存城市配置。
5. 卡片刷新展示上海天气。

定位授权：

1. 用户点击“使用当前位置”。
2. 宿主触发位置权限请求。
3. 用户授权后保存粗略位置或城市。
4. 天气插件刷新数据。
5. 用户拒绝时，保留手动城市输入。

天气加载失败：

1. 插件请求天气数据失败。
2. 卡片保留上次成功数据。
3. 显示“更新失败”小号提示。
4. 后续自动重试。

#### 状态设计

| 状态        | UI 表达                      |
| ----------- | ---------------------------- |
| mock / demo | 可在开发环境显示 demo 标记   |
| 加载中      | 温度位置 skeleton            |
| 有数据      | 温度、城市、状况、湿度、风速 |
| 无城市      | 设置城市入口                 |
| 无权限      | 手动城市输入提示             |
| 网络失败    | 保留旧数据 + 小号错误        |

#### 设计语言

- 天气卡片要紧凑，避免大图标占满卡片。
- S 尺寸显示温度优先。
- M 尺寸增加湿度和风速。
- 图标风格要和系统 icon 统一。
- 不使用复杂背景图，避免和页面背景竞争。

#### 参考对象

| 参考对象                  | 借鉴点               |
| ------------------------- | -------------------- |
| iOS Weather widget        | 小尺寸核心天气信息   |
| Windows Widgets weather   | 温度、城市、状态组合 |
| Google Weather card       | 简洁指标排布         |
| Apple Watch complications | 极小空间的天气摘要   |

#### MVP 与后续

MVP：

- mock 数据展示。
- 基础 weather card。
- 定时刷新示例。

V1.1：

- 城市配置。
- 真实天气 provider。
- 加载/失败状态。
- 天气图标资源统一。

V1.5：

- 多城市。
- 逐小时预报。
- 空气质量。
- 定位授权。

#### 验收标准

- 无真实数据时不得伪装成真实精确天气。
- 加载失败不导致卡片崩溃。
- 城市配置跨会话保存。
- 图标和文本不溢出卡片。

## 12. `official.plugin-manager`

### 12.1 产品定位

插件管理器是 Tabora 插件生态的可见入口。MVP 先展示已安装官方插件、启用状态和贡献能力；后续承载启用/禁用、权限、版本、调试和本地插件管理。

### 12.2 Contribution

扩展点：

- `widget`
- `settings-panel`

当前声明：

| 字段                   | 值                          |
| ---------------------- | --------------------------- |
| widget id              | `plugin-status`             |
| title                  | `插件状态`                  |
| supportedSizes         | S                           |
| defaultSize            | S                           |
| allowMultipleInstances | false                       |
| settings panel id      | `official.settings.plugins` |

### 12.3 信息结构

每个插件列表项建议显示：

- 插件名称。
- 插件 ID。
- 版本。
- 来源：builtin、local、remote。
- 启用状态。
- 贡献能力摘要。
- 权限摘要。
- 错误状态。
- 操作入口。

当前实现已展示：

- 插件名称。
- 插件 ID。
- 贡献能力摘要。
- 启用状态。

### 12.4 交互示例

查看插件列表：

1. 用户打开插件管理卡片或设置面板。
2. 插件管理器读取 official plugin registry。
3. 列表显示插件名称、ID、贡献能力和启用状态。
4. 用户可快速理解默认体验由哪些插件组成。

查看插件详情：

1. 用户点击某个插件项。
2. 右侧或弹窗打开详情。
3. 详情显示 manifest、贡献点、权限、版本和状态。
4. 用户可以复制插件 ID 或查看错误日志。

禁用插件：

1. 用户关闭插件开关。
2. 宿主检查是否为关键插件。
3. 若禁用会影响当前工作区，显示影响范围。
4. 用户确认。
5. 插件记录变为 disabled。
6. 已有实例进入禁用占位状态，数据保留。

权限查看：

1. 用户打开插件详情。
2. 权限区域显示 `external-open: *` 等权限。
3. 对高风险权限显示清晰说明。
4. 后续可支持撤销授权。

插件错误：

1. 某插件实例渲染失败。
2. 插件管理器在该插件项显示错误标识。
3. 用户打开详情查看失败实例 ID 和错误信息。
4. 用户可以移除实例或重新加载插件。

### 12.5 状态设计

| 状态     | UI 表达                         |
| -------- | ------------------------------- |
| 已启用   | 绿色或 accent badge / switch on |
| 已禁用   | muted badge / switch off        |
| 有错误   | warning badge                   |
| 权限敏感 | permission badge                |
| 关键插件 | lock 或“核心默认体验”标记       |
| 更新可用 | version badge，后续             |

### 12.6 设计语言

插件管理器是操作型工具：

- 信息密度可以高于普通 widget。
- 使用列表而不是大卡片堆叠。
- badge 文案短，颜色克制。
- 插件 ID 用等宽字体。
- 操作按钮固定在右侧或详情区。
- 危险操作需要确认。

### 12.7 参考对象

| 参考对象           | 借鉴点                         |
| ------------------ | ------------------------------ |
| VS Code Extensions | 插件列表、详情、启用状态       |
| Chrome Extensions  | 权限和启用/禁用管理            |
| Figma Plugins      | 插件作为产品能力入口           |
| Raycast Extensions | 插件能力、命令和权限的组合展示 |

### 12.8 MVP 与后续

MVP：

- 展示官方插件列表。
- 展示启用状态。
- 展示贡献能力摘要。

V1.1：

- 插件详情。
- 权限展示。
- 插件错误展示。
- 启用/禁用流程。

V1.5：

- 本地插件安装。
- 插件更新。
- 插件调试信息。
- 插件数据清理。

V2：

- 第三方插件市场。
- 评分、审核、权限审计。
- 远程插件安装和升级。

### 12.9 验收标准

- 插件管理器从 registry / plugin records 读取数据，不维护重复真相。
- 单实例，不允许重复添加多个插件管理器。
- 插件 ID、版本、贡献能力可见。
- 后续禁用插件时保留数据和实例配置。
- 权限展示不隐藏高风险信息。

## 13. `official.settings.workspace`

### 13.1 产品定位

工作区设置插件用于聚合设置入口。根据 MVP 决策，它应进入 MVP 范围，但只做轻量版本：宿主提供 settings host，插件贡献设置面板，官方设置插件组织插件、外观和搜索三个最小入口。

设置中心不是完整偏好设置产品。MVP 目标是验证 `settings-panel` 扩展点、统一设置入口、设置面板错误隔离和关键全局配置持久化，复杂能力延后。

### 13.2 建议 Contribution

扩展点：`settings-panel`

MVP settings panels：

| Panel ID                                 | 标题 | 内容                                             | MVP 目标         |
| ---------------------------------------- | ---- | ------------------------------------------------ | ---------------- |
| `official.settings.plugins`              | 插件 | 插件名称、ID、版本、启用状态、贡献能力、权限摘要 | 只读展示         |
| `official.settings.workspace.appearance` | 外观 | 当前主题、可用主题、当前背景、可用背景           | 可切换并持久化   |
| `official.settings.workspace.search`     | 搜索 | 默认搜索源、已启用搜索源、搜索源 shortcut        | 可选择默认搜索源 |

后续 settings panels：

| Panel ID                                  | 标题   | 内容                     |
| ----------------------------------------- | ------ | ------------------------ |
| `official.settings.workspace.general`     | 工作区 | 名称、默认布局、导入导出 |
| `official.settings.workspace.widgets`     | 卡片   | 默认卡片、未放置实例     |
| `official.settings.workspace.permissions` | 权限   | 插件权限和授权记录       |

### 13.3 交互示例

打开设置：

1. 用户点击工具栏设置按钮。
2. 宿主打开 settings host。
3. settings host 读取已启用插件贡献的 `settings-panel`。
4. 设置插件组织左侧导航。
5. 默认打开“插件”面板。
6. 面板内容通过 view registry 渲染。

切换主题：

1. 用户进入“外观”。
2. 选择主题。
3. 右侧即时预览。
4. 点击应用或直接保存。
5. 工作区 token 更新。
6. workspace 保存 `activeThemeId`。

切换背景：

1. 用户进入“外观”。
2. 选择背景 provider。
3. settings host 调用工作区更新能力。
4. 背景层即时变化。
5. workspace 保存 `activeBackgroundProviderId` 和 renderer 信息。

配置默认搜索源：

1. 用户进入“搜索”。
2. 面板读取 `search-provider` contributions。
3. 用户选择默认搜索源。
4. 搜索配置保存到 workspace 或 search 插件配置。
5. 命令搜索栏默认 provider 更新。

导出工作区：

1. 用户进入“工作区”。
2. 点击导出。
3. 宿主生成 workspace JSON。
4. 用户保存文件。
5. 插件数据是否包含在内由用户选择。

### 13.4 设计语言

设置是工具型界面，MVP 要保持轻：

- 宿主容器建议使用 modal 或 drawer，桌面端可采用左侧导航 + 右侧内容。
- 移动端可采用顶部 tabs 或单列导航。
- 表单项密度适中，避免营销式说明。
- 使用开关、select、segmented control、button。
- 不使用介绍性长文案。
- 危险操作放在独立区域。
- 设置面板之间视觉一致，但具体内容由插件 view 渲染。

### 13.5 参考对象

| 参考对象           | 借鉴点                    |
| ------------------ | ------------------------- |
| VS Code Settings   | 可搜索、分组清晰          |
| Chrome Settings    | 浏览器级设置心智          |
| Linear Preferences | 克制、清晰、高密度设置    |
| Notion Settings    | workspace 和 account 分层 |

### 13.6 MVP 与后续

MVP：

- settings host。
- workspace settings 插件。
- 插件面板只读展示。
- 外观面板支持主题和背景切换。
- 搜索面板支持默认搜索源选择。
- 设置面板错误隔离。

V1.1：

- 插件管理面板迁入设置。
- 插件启用 / 禁用。
- 更完整的权限说明。
- 设置搜索。
- 卡片和实例设置面板。

V1.5：

- 导入导出。
- 多 workspace。
- 权限授权记录。
- 插件调试信息。

### 13.7 验收标准

- 设置入口由 `settings-panel` contribution 组成。
- 设置面板不直接依赖某个 shell。
- 每个设置项有明确持久化位置。
- 设置变更有即时反馈或明确保存按钮。
- 单个设置面板失败时，其他设置面板继续可用。

## 14. 跨插件关键流程

### 14.1 搜索流程

```txt
search command bar
  -> read enabled search providers
  -> build URL from provider urlTemplate
  -> context.permissions.openExternal(url)
  -> permission bridge validates host
  -> event bus emits host.external.open
  -> host opens URL
```

关键要求：

- 搜索栏不应硬编码 provider 列表。
- provider 不应自己打开 URL。
- 外部打开必须由权限桥决定。

### 14.2 添加卡片流程

```txt
add widget panel
  -> list enabled widget contributions
  -> user selects widget
  -> host creates PluginInstance
  -> host assigns region/grid/size
  -> registry resolves card view
  -> PluginViewBoundary renders plugin view
  -> instance persisted
```

关键要求：

- 同一 widget 可多实例，除非 contribution 禁止。
- 尺寸只能来自 supportedSizes。
- 添加后立即可见。
- 刷新后恢复。

### 14.3 调整尺寸流程

```txt
widget header size control
  -> read contribution.supportedSizes
  -> user selects size
  -> host maps semantic size to grid span
  -> instance.size/grid updated
  -> persisted
```

关键要求：

- 不展示插件未声明的尺寸。
- 尺寸变化不破坏其他卡片。
- 移动端尺寸可被布局折叠，但语义尺寸保留。

### 14.4 打开弹窗流程

```txt
widget header expand
  -> check contribution.views.modal
  -> context.ui.openModal(viewId, props)
  -> host modal container
  -> PluginViewBoundary
  -> plugin modal view
```

关键要求：

- 插件只声明 view。
- 宿主负责 overlay、关闭、焦点和层级。
- modal 失败只影响 modal 内容。

### 14.5 主题和背景流程

```txt
appearance control
  -> read theme/background contributions
  -> user selects option
  -> workspace updates active IDs
  -> host applies tokens/background
  -> persist workspace
```

关键要求：

- 主题和背景选择存 workspace。
- token 应用和背景 source 解析是宿主职责；renderer 按 `source.type` 与 `accepts` 匹配。
- 插件只贡献数据和 renderer view。

### 14.6 插件错误流程

```txt
plugin view throws
  -> PluginViewBoundary catches
  -> fallback card/modal/fullscreen
  -> record instanceId/viewId/error
  -> other plugin instances continue
```

关键要求：

- 错误信息对用户克制，对开发者可定位。
- 插件管理器能看到错误摘要。
- 不出现整页白屏。

## 15. 官方插件验收清单

### 15.1 产品验收

- 默认工作台完全由官方插件装配。
- 默认工作台使用左侧轻 rail + 顶部命令搜索 + 主网格。
- 默认首屏出现今日重点、快捷入口、便签和待办中的核心模块。
- 用户无需配置即可搜索、打开快捷入口、记录便签、处理待办。
- 用户可以添加、删除、调整 widget 实例。
- 用户可以切换主题和背景。
- 插件管理器能解释当前默认体验由哪些插件组成。
- 插件失败时，页面其他区域继续可用。

### 15.2 交互验收

- 所有可点击元素有 hover 和 focus-visible。
- 表单输入有 label 或 aria label。
- 空状态不使用大段说明文案。
- 删除、禁用、清空等危险操作有确认或可恢复策略。
- 弹窗打开和关闭符合键盘焦点规则。
- 移动端不出现横向滚动。

### 15.3 技术验收

- 官方插件通过 manifest/contribution 声明能力。
- 官方插件通过 registry 注册 view。
- 外部打开通过 permission bridge。
- 插件业务数据进入 plugin data 或明确的实例配置，不混入 workspace 装配数据。
- widget 渲染包裹在错误边界中。
- `pnpm check`、`pnpm test`、`pnpm build` 通过。

### 15.4 设计验收

- 明亮和暗色主题都可读。
- 卡片尺寸稳定，状态变化不造成布局跳动。
- 默认页面不是单色块堆叠，有层次但不喧宾夺主。
- 控件符合场景：checkbox 用于待办，select/combobox 用于搜索源，switch 用于插件启用状态。
- 图标体系统一，后续替换当前 demo 符号和文字按钮。

## 16. 实现差距清单

基于当前代码，建议后续补齐：

| 领域          | 当前情况                                                                                                                          | 建议                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 默认布局      | 已由独立 `plugins/layout-dashboard` 贡献整体布局；rail 走 host actions，topbar/mainGrid 走 region slot，主网格由 layout view 包裹 | 继续补齐更完整响应式与视觉细节              |
| UI 基础组件   | 控件样式主要在 app.css 和插件内                                                                                                   | 新增 `@tabora/ui`，官方插件优先复用基础组件 |
| 今日重点      | 已实现基础 `today-focus` widget，并默认进入首屏                                                                                   | 迁移到 plugin data，并完善多实例数据隔离    |
| 搜索源读取    | 已从 `search-provider` contribution 动态读取                                                                                      | —                                           |
| 快捷入口      | 链接写在插件 view 内                                                                                                              | 支持实例配置和 plugin data                  |
| 便签存储      | 使用 `localStorage` 全局 key                                                                                                      | 迁移到 plugin data，并支持实例隔离          |
| 待办存储      | 使用 pluginId + key，全实例共享                                                                                                   | 加入 instanceId 或明确共享列表策略          |
| 天气数据      | mock 北京天气                                                                                                                     | 接入天气 provider，标明 demo 状态           |
| 天气图标      | 使用天气符号                                                                                                                      | 换成统一图标资源                            |
| 插件管理器    | 只读官方插件列表                                                                                                                  | 接入 plugin records、权限、错误和启用/禁用  |
| 设置插件      | 已实现 MVP 轻量 settings host；插件、外观、搜索面板显式声明 `section/scope` 并经 settings navigator 进入                          | 新增权限详情、设置搜索                      |
| 权限反馈      | 搜索外部打开已有桥；插件管理器可展示 required capabilities / supported platforms / skipped reason                                 | 增加更完整权限详情                          |
| 背景 renderer | 已建立 `BackgroundSourceValue` 和 source 优先解析；CSS renderer 覆盖 css/gradient，失败时回退安全背景                             | 后续补图片/视频/canvas renderer             |
| 默认装配      | 官方默认 workspace 已迁为 `workspacePresets` contribution，创建新 workspace 时应用；已有 workspace 不做 backfill 或历史迁移       | 后续增加用户选择 preset 的 UI               |
| 命令和快捷键  | 官方 shell 命令与快捷键已通过 command catalog / shortcut registry 消费，插件可声明 command/keybinding/context menu contribution   | 后续开放更完整用户自定义快捷键              |

## 17. 推荐推进优先级

### P0：默认体验闭环

- 搜索栏读取真实 `search-provider` contributions。
- 新增工作台仪表盘布局：轻 rail + 命令搜索 + 主网格。
- 新增 `@tabora/ui` 基础组件包，并让官方插件逐步迁移到统一控件。
- 新增今日重点卡片，默认进入首屏。
- 快捷入口、便签、待办使用统一 plugin storage。
- 默认工作台按交互原型样张包含命令搜索、今日重点、快捷入口、待办、便签、天气和多实例样张卡片。
- 插件错误边界覆盖 card、modal、fullscreen。
- 提供轻量设置中心，聚合插件、外观和搜索面板。

### P1：管理和设置闭环

- 插件管理器读取真实 plugin records。
- 插件详情展示 manifest、contributions、permissions。
- 启用/禁用插件。
- 更完整的权限说明和设置搜索。
- 卡片实例设置与全局设置边界。

### P2：真实内容能力

- 真实天气 provider。
- 自定义快捷入口。
- 搜索历史和 provider shortcut。
- 便签多实例隔离。
- 待办编辑、排序、清空已完成。

### P3：生态准备

- 本地插件安装。
- 插件 SDK。
- 插件权限审计。
- 插件调试面板。
- 第三方插件市场前置协议。

## 18. 参考对象总览

参考对象只用于体验模式和交互心智，不代表 Tabora 需要复刻其视觉。

| 能力         | 参考对象                                              | 核心借鉴                 |
| ------------ | ----------------------------------------------------- | ------------------------ |
| 工作台仪表盘 | Vivaldi Start Page Dashboard, Notion dashboard        | 模块区域、widget 排列    |
| 新标签页入口 | Chrome / Edge 新标签页                                | 搜索优先、常用入口       |
| 命令式搜索   | Raycast, Spotlight, Arc Command Bar                   | 键盘优先、快速提交       |
| 插件生态     | VS Code Extensions, Chrome Extensions                 | 插件列表、权限、启用管理 |
| 卡片工作台   | iOS widgets, Windows Widgets                          | 模块化、语义尺寸         |
| 今日重点     | Momentum Focus, Things Today                          | 轻量工作焦点             |
| 快捷入口     | Chrome shortcuts, Raindrop.io, Arc Favorites          | 站点入口、收藏分组       |
| 便签         | Apple Notes Quick Note, Google Keep, Sticky Notes     | 轻量记录、自动保存       |
| 待办         | Todoist, Things, Microsoft To Do                      | 添加、完成、删除、完成度 |
| 天气         | iOS Weather widget, Windows weather widget            | 小尺寸天气摘要           |
| 主题         | VS Code themes, macOS light/dark mode                 | token 化、明暗切换       |
| 背景         | macOS Wallpaper, Windows Personalization, Arc themes  | 背景源、预览、持久化     |
| 设置         | VS Code Settings, Chrome Settings, Linear Preferences | 高密度、分组、可搜索     |

## 19. 开放问题

- 天气是否首屏默认加入，还是只提供在添加面板中。
- 天气真实数据使用哪个 provider，是否需要 network 权限和用户授权。
- 快捷入口默认数据是官方推荐、用户空状态，还是导入浏览器书签。
- 便签和待办多实例默认隔离，还是允许用户选择共享数据。
- 插件管理器是否同时作为卡片出现，还是 MVP 只在设置中心出现。
- 插件禁用关键能力时，是否允许禁用布局、主题、搜索这类结构级插件。
- 背景 renderer 的 props contract 如何标准化。
- 权限提示采用安装时确认、使用时确认，还是两者结合。
