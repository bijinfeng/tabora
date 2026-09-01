# Tabora 官方内置插件设计说明

本文档是官方内置插件的产品事实源：把 PRD 中的“官方内置插件”拆解成可设计、可实现、可验收的产品规格。字段级细节（manifest、contribution schema、token 取值、storage 数据形状）以 `@tabora/plugin-api`、各插件 manifest 和 `DESIGN.md` 为准。

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 设计事实源：`DESIGN.md`
- 工作台原型参考：`docs/design/workbench-prototype.html`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 文档地图：`docs/README.md`

## 1. 文档目标

本文档回答四类问题：每个官方插件承担什么产品职责、如何交互展示与处理状态、视觉与体验参考是什么、哪些能力属于 MVP 还是后续版本。

官方插件不是平台硬编码功能集合，而是 Tabora 插件体系的第一批标准样板：既组成默认工作台体验，也证明第三方插件能用同一套 manifest、contribution、runtime context、permissions、storage 和 host container 协议接入。

## 2. 官方插件设计原则

### 2.1 插件即默认体验

Tabora 打开后的第一屏必须来自官方插件装配，而不是平台直接渲染固定功能。用户感知到的左侧轻 rail、命令搜索、布局、背景、主题、快捷入口、便签、待办、天气和插件管理，都应能追溯到明确的插件 manifest 和 contribution。

### 2.2 平台与插件的共享模型

平台负责通用机制：插件发现/校验/启用/注册、扩展点协议、工作区与区域和实例状态、宿主容器（弹窗/全屏/错误边界）、权限桥与安全回退、IndexedDB 持久化、主题 token 应用。官方插件负责具体业务能力，即使内置也不能绕过平台协议直接操作宿主私有状态。

这是所有官方插件共享的接入模型，后续各插件章节不再重复：插件只通过 manifest、contribution、runtime context、permissions 和 storage contract 接入；外部打开一律走权限桥（`context.permissions.openExternal` / `host.openExternal`），不裸用 `window.open`。

### 2.3 工作台优先，逐步增强

首次打开无需配置即可使用左侧轻 rail、顶部命令搜索、基础搜索源、主网格、快捷入口、便签、待办和基础主题背景。天气和插件管理可作为默认候选卡片，或在添加卡片面板/设置中心出现。默认体验应克制但不空，避免只看到“平台框架”的感觉。

### 2.4 官方插件也是生态示例

官方插件要示范：如何声明 contribution、按实例保存配置、使用插件私有数据、请求宿主 UI 能力、请求外部打开权限，以及处理空状态、错误状态和权限不足。

### 2.5 状态必须局部化

任何官方插件失败都不能拖垮整个工作台：widget 失败只显示该实例错误卡片、search 失败顶部显示搜索不可用占位、background 失败回退安全纯色、theme 失败回退默认 token、plugin manager 失败不影响其他插件。此错误局部化是共享约束，各插件章节不再重述。

## 3. 全局设计语言

视觉、token、字体密度、控件语言（`@tabora/ui`）、动效与可访问性统一以 `DESIGN.md` 为事实源，`docs/design/workbench-prototype.html` 只作可交互原型参考。官方插件层面的约束：产品气质是“安静、清晰、可重复使用的个人工作台”；默认体验是单一宿主内建 dashboard 壳体（左侧轻 rail + 顶部常驻搜索 + 主网格），移动端在同一 layout view 内以响应式断点折叠 rail 为底部导航；插件内容区复用 `@tabora/ui` 基础组件并使用 theme token，宿主级容器（WidgetCard、Modal、FullscreenHost、SettingsHost、Rail）由宿主提供，插件只渲染内容。后续各插件的“设计语言”仅记录该插件特有约束，通用视觉规则不再重复。

## 4. 官方插件矩阵

| 插件 ID                               | 插件名称                   | 扩展点                                       | 默认启用 | 当前状态                                                                                 | 产品职责                                           |
| ------------------------------------- | -------------------------- | -------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `official.theme.default-pack`         | Tabora Default Theme Pack  | `theme`                                      | 是       | 已按 V2 原型 Refined Sage token 对齐明亮/暗色主题                                        | 提供明亮、暗色工作台主题                           |
| `official.background.basic`           | Basic Background           | `background-provider`, `background-renderer` | 是       | 已实现基础 provider 和 renderer view                                                     | 提供基础背景源和 CSS 背景渲染能力                  |
| `official.layout.workbench-dashboard` | Workbench Dashboard Layout | `layout`                                     | 是       | 已改为宿主内建 layout 注入（非独立插件包）                                              | 定义轻 rail + 命令搜索 + 主网格的默认布局          |
| `official.search.command-bar`         | Tabora Command Search      | `search`                                     | 是       | 已实现基础 UI 和外部打开权限桥；已使用 `@tabora/ui` 控件                                 | 提供命令搜索、搜索源选择和快捷建议                 |
| `official.search-providers.basic`     | Basic Search Providers     | `search-provider`                            | 是       | 已实现基础搜索源声明                                                                     | 提供 Google、Bing、百度、DuckDuckGo、GitHub 搜索源 |
| `official.widgets.quick-links`        | Quick Links Widget         | `widget`                                     | 是       | 已由独立 `@tabora/plugin-quick-links` package 提供；已使用 `@tabora/ui` 控件              | 提供快捷入口，验证外部打开和实例配置               |
| `official.widgets.notes`              | Notes Widget               | `widget`                                     | 是       | 已由独立 `@tabora/plugin-notes` package 提供；已使用 `@tabora/ui` 控件                    | 提供便签和弹窗编辑，验证插件数据和 modal           |
| `official.widgets.todo`               | Todo Widget                | `widget`                                     | 是       | 已由独立 `@tabora/plugin-todo` package 提供；已使用 `@tabora/ui` 控件                     | 提供待办列表，验证交互型 widget 和持久化           |
| `official.widgets.weather`            | Weather Widget             | `widget`                                     | 是       | 已接入 Open-Meteo 真实数据；卡片 + 展开弹窗                                              | 提供天气摘要与预报，按 `DESIGN.md` 进入默认工作台  |
| `official.widgets.ai-chat`            | AI Chat Widget             | `widget`                                     | 是       | 已由独立 `@tabora/plugin-ai-chat` package 提供；基于 `@tanstack/ai-solid-ui`（编译 dist）+ `@tabora/ui` 控件；经 `context.ai.createChatConnection` 走平台 AI Gateway；已支持多会话管理（切换/重命名/删除）与实例数据持久化 | 提供多轮模型对话，产品口径见 `tabora-ai-chat-plugin-prd.md` |
| `official.plugin-manager`             | Plugin Manager             | `settings-panel`                             | 是       | 已实现只读列表；已使用 `@tabora/ui` 控件                                                 | 展示插件贡献能力                         |
| `official.settings.workspace`         | Workspace Settings         | `settings-panel`                             | 是       | 已实现轻量 settings host 面板贡献：外观、搜索；插件面板由 `official.plugin-manager` 贡献 | 聚合插件、外观、搜索等全局设置面板                 |
| `official.account-sync`                | Tabora Account & Sync      | `settings-panel`                             | 按宿主选择 | Playground 始终装配，API 地址可配置覆盖；FNOS 完全本地时不装配                         | 提供账号与数据同步两个设置面板，并管理同步 lifecycle |

## 5. 默认装配方案

### 5.1 首次打开默认实例

建议默认装配：

| 区域       | 实例             | 来源插件                              | 尺寸         | 说明                                         |
| ---------- | ---------------- | ------------------------------------- | ------------ | -------------------------------------------- |
| `rail`     | `rail-main`      | `official.layout.workbench-dashboard` | 固定左侧区域 | 主页、添加卡片、切换主题、设置等工作台级入口 |
| `topbar`   | `search-main`    | `official.search.command-bar`         | 固定顶部区域 | 命令搜索入口                                 |
| `mainGrid` | `quick-links-1`  | `official.widgets.quick-links`        | M            | 快捷入口，默认首屏第一张核心卡片             |
| `mainGrid` | `todo-1`         | `official.widgets.todo`               | S            | 待办列表                                     |
| `mainGrid` | `notes-1`        | `official.widgets.notes`              | M            | 快速记录，默认与快捷入口同宽                 |
| `mainGrid` | `weather-1`      | `official.widgets.weather`            | S            | 天气摘要，按原型进入默认工作台               |
| `mainGrid` | `ai-chat-1`      | `official.widgets.ai-chat`            | M            | AI 对话入口，用户可移除或调整尺寸            |
| `settings` | `plugin-manager` | `official.plugin-manager`             | 设置面板     | 从设置中心进入完整插件管理                   |

当前实现由 host builtin layout `official.layout.workbench-dashboard` 贡献整体布局 view（Phase 2 后改为宿主内建注入，非独立插件包）。实例 region 为 `topbar` 和 `mainGrid`；左侧 rail 不承载插件实例，由 layout view 通过 `LayoutHostAPI.getGlobalActions("rail")` 渲染主页、添加卡片、切换主题、设置等宿主动作。Dashboard layout view 负责 10 列主网格容器和行高同步，`WidgetCardShell` 按 widget size 设置 grid span、提供无头部卡片外壳和移除按钮；从非默认分组打开添加卡片面板时经 `LayoutHostAPI.openAddWidget(context)` 追加新实例到目标分组。移动端是同一 layout view 的响应式断点，窄屏时 rail 折叠为底部导航栏。默认工作台以 `DESIGN.md` 为视觉事实源、原型样张为参考，首屏优先命令搜索、快捷入口、待办、便签和天气摘要；完整插件管理从设置中心进入。

### 5.2 默认插件加载顺序

建议顺序：

```txt
theme -> background -> layout -> search providers -> command search -> widgets -> plugin manager -> settings -> account-sync（可选）
```

原因：theme/background 先准备视觉环境、layout 决定区域、search providers 先于 command bar 以便搜索 UI 读取可用源、widgets 在区域准备后渲染；plugin manager 和 settings 属管理能力可后加载，但 MVP 需提供轻量设置中心验证 `settings-panel` 闭环；`official.account-sync` 由具备网络与本地同步能力的宿主装配（Playground 始终显示账号和同步设置，FNOS 等完全本地宿主不加载也不显示）。

### 5.3 默认页面交互示例

- 首次打开：平台按加载顺序启用官方插件，主题/背景准备视觉环境，dashboard layout 提供 rail 入口与 `topbar`/`mainGrid` region，搜索栏与 widget 渲染后用户即可搜索、打开快捷链接、记录便签、处理待办。
- 刷新页面：平台恢复 workspace、实例顺序/尺寸/配置，插件业务数据从 plugin storage 恢复；失败插件局部报错，其余区域继续可用。

## 6. `official.layout.workbench-dashboard`

### 6.1 产品定位

Dashboard builtin layout 定义 Tabora 的基础页面骨架：左侧轻 rail、顶部命令搜索区和下方主网格。它不拥有任何具体业务内容，只规定区域结构、可接受的扩展点、默认实例引用和响应式能力。移动端（< 768px）在同一 layout view 内折叠 rail 为底部导航栏，不是独立的 layout contribution。

> **Phase 2 变更**：Dashboard 不再是独立插件包（`plugins/official/layout-dashboard`），改为 host builtin layout 注入，与 theme/background/search 对齐。

### 6.2 Contribution

扩展点：`layout`。layout id、regions（`topbar` 接 search 且 maxInstances=1、`mainGrid` 接 widget）、rail（由 layout view 消费 `LayoutHostAPI.getGlobalActions("rail")` 渲染，不作为实例 region）与 `supportsResponsive` 等字段以 layout manifest 为准。Dashboard layout 只负责区域结构，不负责搜索框样式、卡片内容、添加卡片逻辑、拖拽排序、设置面板内容和主题背景，这些由宿主或其他插件负责。

### 6.3 卡片溢出策略

当 `mainGrid` widget 超过一屏时，MVP 采用纵向工作区策略：主网格自动换行向下扩展、页面纵向滚动、不用横向滚动、不强压一屏、新卡片追加末尾，用户通过拖拽排序和尺寸选择调整优先级，刷新后保留顺序/尺寸/位置。分组、收纳区、未放置卡片列表、多 workspace 等为后续增强。

### 6.4 交互示例

- 打开新标签页：宿主注入 dashboard layout，渲染 rail 宿主入口并创建 `topbar`/`mainGrid`，把 `search-main` 放入 topbar、widget 实例放入 mainGrid。
- 切换移动端窄屏（< 768px）：同一 layout view 命中断点，rail 折叠为底部导航、主网格单列堆叠，实例/区域/数据不变。
- 布局失败：显示“布局不可用”和失败原因并记录 layout id，不用其他内容冒充当前布局。

### 6.5 设计语言

rail 低干扰固定、命令搜索宽度受限便于聚焦；主网格默认桌面 10 列逻辑网格、高度不固定允许纵向滚动、首屏优先快捷入口/便签/待办；移动端单列堆叠、rail 折叠、无横向滚动。具体尺寸取值见 `DESIGN.md`。

### 6.6 验收标准

- 默认布局由宿主内建 dashboard layout 提供，区域结构在 layout contribution 中声明。
- `rail` 提供主页、添加卡片、插件和设置等工作台级入口。
- `topbar` 只接收 search 实例。
- `mainGrid` 只接收 widget 实例。
- Dashboard 尺寸跨度固定为 `S=1x1`、`M=2x1`、`L=2x2`、`XL=4x2`。
- 移动端布局不产生横向滚动。
- 卡片超过首屏时，主网格可纵向滚动且不压缩卡片到不可读。
- layout 失败时有明确的布局不可用提示和失败原因。

### 6.7 交互模式

核心交互（详细规格以 `DESIGN.md` 为准，原型见 `docs/design/workbench-prototype.html`）：`⌘K` 全局命令面板（由平台注册为全局快捷键，不依赖布局）、双击卡片展开（每类卡片有定制内容布局）、拖拽实时换位、右键上下文菜单（尺寸/展开/移除）、搜索内联建议（分组结果 + ↑↓ 导航）、设置侧栏导航、Toast 堆叠（超过 3 条自动清理）。

## 7. `official.search.command-bar`

### 7.1 产品定位

搜索命令栏是 Tabora 的主要启动入口。它负责让用户用最少动作完成搜索、跳转或后续命令式能力。MVP 先聚焦搜索，后续可以演进为搜索 + 命令入口。

### 7.2 Contribution

扩展点：`search`。search id、title、`defaultProviderIds`、`supportsSuggestions`、view 和 `external-open` permission 等字段以 search manifest 为准。MVP 控件为 Dashboard 常驻搜索栏、全局 `⌘K` 命令面板、搜索源指示器/选择器、输入框、分组结果列表和 `@provider` 状态提示；搜索历史、多源并发预览、更复杂本地命令系统为后续。

### 7.3 交互示例

- 基础搜索：输入 query 后 Enter，插件读取当前搜索源、把 encode 后的 query 注入 URL template，经 `context.permissions.openExternal(url)` 由权限桥校验 host 后打开。
- 空查询：聚焦不输入按 Enter 不触发外部打开，输入框保持聚焦不报错。
- Dashboard 内联建议：聚焦空输入显示分组建议，`ArrowDown` 进入列表、`Enter` 执行高亮项，外部/内部命令都走宿主统一执行路径。
- `@provider` 切换：输入 `@github vite-plus` 识别 provider token 并显示当前 provider，剩余 query 跳转对应搜索。
- 命令面板搜索：`⌘K` 唤起浮层，实时分组结果 + 键盘导航，`Enter` 执行。
- 权限被拒绝：host 不在允许范围时 `openExternal` 失败，搜索栏提示“无法打开该搜索源，请检查插件权限”。

### 7.4 输入与键盘行为

| 按键      | 行为                                     |
| --------- | ---------------------------------------- |
| Enter     | 提交当前查询或执行当前高亮结果           |
| Esc       | 关闭面板、收起建议或清空当前瞬时状态     |
| ArrowDown | 进入建议列表并移动到下一项               |
| ArrowUp   | 返回输入框或移动到上一条建议             |
| Tab       | 按正常焦点顺序移动，不劫持浏览器默认行为 |

输入规则：query 提交前 trim、空 query 不触发搜索、支持 `@provider` 临时切换搜索源（单独输入时进入待补全提示态）、URL query 必须 encode、外部打开走权限桥。

### 7.5 状态设计

产品级状态：聚焦空输入显示分组建议/收藏命令/推荐入口；`@provider` 待补全显示已识别的 provider 提示态；权限拒绝在输入框下方显示小号错误文本或 Toast；provider 不可用时搜索源指示器禁用并显示占位；view 错误时 Dashboard 顶部区域或 ⌘K 面板显示搜索不可用占位。

### 7.6 设计语言

搜索栏是首屏主控件：清晰边框和轻阴影、搜索源指示器与输入框之间用细分割线弱分组、建议列表用清晰分组标题与紧凑可扫描的结果行、不使用大面积品牌渐变；`⌘K` 面板沿用原型的 CommandPalette / Dialog 视觉语言。具体宽高取值见 `DESIGN.md`。

### 7.7 验收标准

- 搜索 UI 来自 `search` contribution。
- 搜索源来自 `search-provider` contribution。
- Dashboard 提供实时内联建议；Focus 通过居中命令入口或 `⌘K` 唤起搜索。
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

扩展点：`search-provider`。MVP 声明 Google（`g`）、Bing（`b`）、百度（`d`）、DuckDuckGo（`dd`）、GitHub（`gh`）五个搜索源；各 provider id、shortcut 和 URL template 以 provider manifest 为准。

### 8.3 交互示例

- 设置默认搜索源：搜索设置读取所有 `search-provider` contribution，用户选中后保存默认 provider id，下次打开默认选中。
- `@token`：输入 `@github solid router` 识别 GitHub provider，query 变为 `solid router` 后跳转。
- 禁用搜索源：关闭某源后搜索栏 provider 列表移除它；若为已保存默认则回退到第一个可用源。

### 8.4 设计语言

- 列表显示名称、shortcut 和 host，默认源用选中态表示，禁用态不删除用户配置。
- provider 图标后续使用统一图标集或真实品牌图标，不用随意 emoji。

### 8.5 验收标准

- 搜索源插件不渲染搜索 UI。
- URL template 必须包含 `{query}`。
- query 必须被 encode 后注入。
- 搜索源禁用后不出现在搜索栏中。
- 默认搜索源不可用时有回退。

## 9. `official.background.basic`

### 9.1 产品定位

基础背景插件提供低风险、低复杂度的背景能力。MVP 先用纯色和渐变证明背景 provider 和 renderer 协议，避免过早引入图片版权、远程加载、视频和 WebGL 复杂度。

### 9.2 Contribution

扩展点：`background-provider` 与 `background-renderer`。MVP 提供纯色（绿/暗）和渐变（绿/蓝/紫）共 5 个 generated provider，以及一个接受 `css`/`gradient` 的 CSS renderer；provider id、sourceType 和 source 形状以 background manifest 为准。

### 9.3 交互示例

- 切换背景：宿主读取 `background-provider` contributions，用户选中后保存 `activeBackgroundProviderId`，匹配兼容 renderer 更新背景层，不影响卡片实例。
- 渲染失败：renderer view 抛错时宿主回退 `color-page`，卡片继续渲染，背景选择器显示失败状态。

### 9.4 状态设计

产品级状态：当前背景在列表中选中、预览用小色块或缩略图、渲染失败时使用页面底色并在设置中显示错误、不兼容 renderer 时禁用该背景源并显示原因。

### 9.5 设计语言

背景服务可读性：默认低对比不干扰文字、渐变不过饱和、背景与卡片有足够层次、不用离散装饰光斑或大面积装饰作默认背景、切换不造成内容重排。

### 9.6 验收标准

- 背景源来自 `background-provider` contribution。
- 背景渲染来自 `background-renderer` contribution。
- 背景选择跨会话保留。
- renderer 失败时工作台仍可用。
- 背景不能降低主要文本可读性。

## 10. `official.theme.default-pack`

### 10.1 产品定位

默认主题包定义 Tabora 的基础视觉 token。它是所有官方插件共享的视觉契约，也是未来第三方主题插件的示例。

### 10.2 Contribution

扩展点：`theme`。MVP 提供 `official.theme.light`（默认明亮）和 `official.theme.dark`（暗色）。token 角色（`color-page`/`color-surface`/`color-text`/`color-muted`/`color-accent`/`color-line`/`radius-card`）及其明暗取值以 theme manifest 和 `DESIGN.md` 为准。

### 10.3 交互示例

- 切换主题：宿主读取 `theme` contribution，用户选中后把 token 应用到 workspace root 并保存 `activeThemeId`，官方插件经 CSS variables 自动更新。
- 主题失败：token 缺失或非法时回退内置安全 token，提示“主题加载失败，已使用默认主题”，插件内容继续可用。

### 10.4 设计语言

- 明亮主题不过白刺眼、页面底色可略带灰绿；暗色主题不纯黑、用深灰降低疲劳。
- accent 只用于链接、选中、主按钮和关键状态；卡片透明度受控，避免明亮主题下边界不可见。

### 10.5 验收标准

- 官方插件样式使用 token，不依赖硬编码大面积颜色。
- 切换主题不刷新页面。
- 主题选择跨会话恢复。
- 明亮和暗色主题下文本可读。
- token 缺失时有安全回退。

## 11. `official.widgets.productivity`

### 11.1 产品定位

生产力插件包提供默认工作台的基础内容卡片。它不是单一 widget，而是一组同源生产力 widget 的官方集合。产品口径上 MVP 把 `quick-links`、`notes`、`todo`、`weather` 视为独立官方 widget（工程上可暂放同一包内，但 manifest、文档和验收按独立 widget 能力理解）。后续可扩展日历、倒计时、RSS、书签集合、最近访问、剪贴板片段等。

### 11.2 Contribution

扩展点：`widget`

MVP widget 清单：

| Widget ID     | 名称     | 支持尺寸    | 默认尺寸 | 允许多实例 | Views                      | MVP 默认 |
| ------------- | -------- | ----------- | -------- | ---------- | -------------------------- | -------- |
| `quick-links` | 快捷入口 | S, M, L     | M        | 是         | card, expand, expandFooter | 是       |
| `notes`       | 便签     | S, M, L     | M        | 是         | card, modal                | 是       |
| `todo`        | 待办     | S, M, L, XL | M        | 是         | card                       | 是       |
| `weather`     | 天气     | S, M        | S        | 是         | card, expand               | 是       |

### 11.3 统一卡片规范

每个 widget 卡片应遵循：宿主卡片外壳不渲染标题 header（标题仅作可访问名称和展开视图标题来源）、插件 card view 负责完整内容区（含留白/滚动/截断）、支持尺寸由 manifest 声明、卡片内操作不影响宿主布局尺寸、多实例数据按实例隔离（除非产品要求全局共享）、内容过长时内部滚动或截断不撑破卡片。

### 11.4 Widget 尺寸语义

| 尺寸 | 用途                           | 示例                     |
| ---- | ------------------------------ | ------------------------ |
| S    | 1x1，一个核心状态或 1-2 个入口 | 天气温度、单个快捷入口组 |
| M    | 2x1，默认横向工作卡片          | 便签、待办、快捷入口     |
| L    | 2x2，详情更多、列表更多        | 长便签、多链接、多待办   |
| XL   | 4x2，复杂列表或宽视图          | 待办计划、RSS、日历      |

### 11.6 快捷入口 `quick-links`

#### 产品定位

快捷入口是用户最常用站点、工具和工作路径的启动器。MVP 当前提供 GitHub 和 Vite+ 示例链接，后续应支持用户自定义。

#### 交互示例

- 打开链接：通过 `WidgetViewProps.host.openExternal(url)` 经权限桥校验（manifest 声明 `external-open`）打开。
- 添加/编辑入口：卡片内表单输入标题/URL/图标，校验后保存到实例配置或 plugin data，卡片即时更新；悬停显示编辑和删除按钮。
- 空状态：删除所有入口后显示“添加第一个入口”按钮。
- 展开弹窗：宿主打开统一 expand overlay 渲染 `expand` 主体（常用入口/管理分组/添加入口三面板 + 右侧配置），操作按钮经 `expandFooter` 注入外层统一 footer，主体与 footer 共享按 instanceId 的会话 store 同步瞬时状态。

#### 设计语言

入口用图标 + 短标题（S 显示 2-4 个、M 显示 4-8 个、L 可分组）；链接按钮大小稳定、hover 不改变布局。

#### 验收标准

- 链接列表不写死在宿主。
- 多实例之间链接配置可隔离。
- URL 非法时不能保存。
- 外部链接打开符合权限模型。

### 11.7 便签 `notes`

#### 产品定位

便签用于快速记录临时想法、待复制文本或当天提示，比完整笔记应用更轻，不追求复杂文档编辑。当前卡片和弹窗都通过宿主实例级 `props.data` 读写内容，同一实例内共享、多实例默认隔离。

#### 交互示例

- 快速记录：点击卡片文本区输入，内容自动保存，刷新后恢复。
- 展开编辑：双击或右键展开，宿主打开 expand overlay 渲染 `notes.expand`，更大编辑区输入并自动保存，关闭后卡片同步。
- 清空：更多菜单选清空并二次确认后清空当前实例便签。
- 保存失败：IndexedDB 保存失败时保留当前输入，卡片底部显示“暂未保存”，恢复后自动或手动重试。

#### 状态设计

产品级状态：空态显示 placeholder `写点什么...`；保存失败在底部显示小号错误文本并保留当前输入；弹窗编辑提供更大编辑区并保留同一内容。

#### 设计语言

卡片内 textarea 无边框或弱边框、行高舒适适合中文短句、MVP 不用富文本工具栏、弹窗编辑区可有边框强化可编辑区域、长内容内部滚动或截断不撑破布局。

#### 验收标准

- 内容刷新后恢复。
- modal 和 card 内容同步。
- 多实例策略明确，建议实例隔离。
- 保存失败不丢当前输入。
- 长文本不破坏卡片布局。

### 11.8 待办 `todo`

#### 产品定位

待办卡片用于管理短周期任务，不替代完整项目管理软件，支持快速添加、完成、删除和查看完成度。当前通过宿主实例级 `props.data` 保存 `v2_items` 和 `v2_groups`，多实例默认使用独立列表。

#### 交互示例

- 添加待办：输入框输入后 Enter 或加号按钮创建 item，输入框清空、列表显示新项、数据保存。
- 完成待办：点击 checkbox 切换 done，文本显示删除线和 muted 色，底部完成数（如 `1/3 完成`）更新并保存。
- 删除待办：悬停显示删除按钮，点击后 item 移除并保存。
- 空状态：列表为空时只显示输入框，可显示轻量 placeholder。
- 保存失败：可先乐观更新，底部显示“同步失败，稍后重试”，后续提供重试或回滚。

#### 状态设计

产品级状态：空列表只显示输入框加轻量提示；已完成项用删除线加 muted 文本；输入为空时加号按钮禁用或点击无效；保存失败在 footer 显示错误提示；列表过长时内部滚动。

#### 设计语言

输入框与加号按钮尺寸一致、checkbox 用 accent 色、删除按钮默认弱化 hover 显示、列表行高紧凑但可点击区域足够、footer 保持小号不抢主内容。

#### 验收标准

- 空输入不能创建 item。
- 添加后刷新可恢复。
- 完成状态刷新可恢复。
- 删除后刷新不再出现。
- 多实例数据隔离策略明确并实现。

### 11.9 天气 `weather`

#### 产品定位

天气卡片提供环境信息，不应成为复杂天气应用。已接入真实天气 provider（Open-Meteo，免 key、支持 CORS），卡片展示当前天气与小时趋势，展开弹窗提供逐小时、三日趋势、生活建议和城市配置。

#### 当前实现

- 数据源：Open-Meteo geocoding + forecast（当前/逐小时/三日）+ air-quality（US AQI），manifest 声明 `network` 权限，不请求地理定位。
- 城市来自实例配置 `config.city`（默认「北京」），展开弹窗通过 `Select` 切换并写回 `host.updateConfig`；首次渲染先读实例缓存即时展示再请求刷新，网络失败回退缓存、无缓存才显示错误与重试。
- 天气图标用 `lucide-solid` 按 WMO code 映射；卡片 S 显示当前天气块、M 显示指标与小时趋势，展开弹窗左右分区（主区趋势/建议 + 侧栏城市与关注指标）。

#### 交互示例

- 查看天气：卡片显示温度、城市、状况、湿度、风速；S 显示核心温度和城市，M 显示更多指标。
- 切换城市：展开弹窗侧栏城市 `Select` 切换后请求 Open-Meteo 数据，保存到实例配置（`host.updateConfig`），卡片与弹窗刷新。
- 加载失败：请求失败时卡片保留上次成功数据并显示“更新失败”提示，后续自动重试。

#### 状态设计

产品级状态：加载中显示温度位置 skeleton；有数据显示温度/城市/状况/湿度/风/AQI；网络失败回退缓存，无缓存才显示错误 + 重试。

#### 设计语言

天气卡片紧凑、避免大图标占满卡片；S 优先显示温度、M 增加湿度和风速；图标与系统 icon 统一；不用复杂背景图与页面背景竞争。

#### 验收标准

- 无真实数据时不得伪装成真实精确天气。
- 加载失败不导致卡片崩溃。
- 城市配置跨会话保存。
- 图标和文本不溢出卡片。

## 12. `official.plugin-manager`

### 12.1 产品定位

插件管理器是 Tabora 插件生态的可见入口。MVP 先展示已安装官方插件、启用状态和贡献能力；后续承载启用/禁用、权限、版本、调试和本地插件管理。

### 12.2 Contribution

扩展点：`settings-panel`（panel id 以 manifest 为准）。列表项建议显示插件名称、ID、版本、来源（当前只有 `builtin`）、启用状态、贡献能力摘要、错误状态和操作入口；当前实现已展示名称、ID、贡献能力摘要和启用状态。

### 12.3 交互示例

- 查看列表/详情：读取 official plugin registry 展示名称/ID/贡献能力/启用状态，点击项在右侧或弹窗打开 manifest/贡献点/权限/版本/状态详情，可复制 ID 或查看错误日志。
- 禁用插件：关闭开关时宿主检查是否关键插件，影响当前工作区则显示影响范围并二次确认；禁用后已有实例进入禁用占位，数据保留。
- 权限查看：详情权限区显示 `external-open: *` 等权限并对高风险权限给出说明（后续支持撤销授权）；实例渲染失败时该项显示错误标识，详情可查看失败实例 ID 和错误信息。

### 12.4 状态设计

产品级状态用 badge/switch 表达：已启用、已禁用、有错误（warning）、权限敏感（permission）、关键插件（lock / “核心默认体验”标记）、更新可用（version，后续）。

### 12.5 设计语言

插件管理器是操作型工具：信息密度可高于普通 widget、用列表而非大卡片堆叠、badge 文案短且颜色克制、插件 ID 用等宽字体、操作按钮固定右侧或详情区、危险操作需确认。

### 12.6 验收标准

- 插件管理器从 registry / plugin records 读取数据，不维护重复真相。
- 单实例，不允许重复添加多个插件管理器。
- 插件 ID、版本、贡献能力可见。
- 后续禁用插件时保留数据和实例配置。
- 权限展示不隐藏高风险信息。

## 13. `official.settings.workspace`

### 13.1 产品定位

工作区设置插件用于提供外观、搜索和工作区等通用面板。宿主提供 settings host 与官方 schema renderer，orchestrator 按已启用插件的 contributions 组织导航；宿主内建 layout 不负责设置弹窗。

当前官方设置面板均声明支持 `desktop` 和 `mobile`。第三方设置插件必须通过 manifest 的非空 `surfaces` 显式声明目标端；宿主按当前端过滤，不为未声明的端静默兜底。设置中心使用 `/settings/<section>` 路由，每个可用分类是一个二级路由；provider context 和 custom-view props 会收到当前 `surface`，移动端由宿主提供全屏单列设置容器。

设置中心不是完整偏好设置产品。MVP 目标是验证 `settings-panel` 扩展点、统一设置入口、设置面板错误隔离和关键全局配置持久化，复杂能力延后。

### 13.2 建议 Contribution

扩展点：`settings-panel`。MVP 面板为插件（只读）、外观（主题/背景可切换持久化）、搜索（可选默认搜索源），账号与数据同步面板仅账号插件装配时显示；后续增加工作区、卡片、权限面板。各 panel id、`section/order`、`surfaces` 等字段以 manifest 为准。

### 13.3 交互示例

- 打开设置：宿主导航到 `/settings/<section>` 打开 settings host，读取已启用插件的 `settings-panel`，orchestrator 按当前 `surface` 过滤再按 `section/order` 组织导航（无 contribution 的分类不显示），默认打开“插件”面板；`schema` panel 走 provider registry + 官方 renderer，`custom-view` panel 走 view registry。
- 切换主题/背景：在“外观”选中后即时生效，workspace 保存 `activeThemeId` / `activeBackgroundProviderId` 与 renderer 信息。
- 配置默认搜索源：在“搜索”读取 `search-provider` contributions，选中后保存到 workspace 或 search 插件配置，命令搜索栏默认 provider 更新。
- 导出工作区：在“工作区”导出 workspace JSON，插件数据是否包含由用户选择。

### 13.4 设计语言

设置是工具型界面，MVP 保持轻：宿主容器用 modal 或 drawer（桌面端左侧导航 + 右侧内容，移动端顶部 tabs 或单列导航）、表单项密度适中无营销式长文案、使用开关/select/segmented control/button、危险操作放独立区域。默认由官方 schema renderer 使用 `@tabora/ui` 保持视觉一致，插件只提供语义模型、状态机和 actions，不在 schema 中携带样式；设置行支持只读说明、状态 meta 和行内 action，供账号与同步等面板复用。schema 不足表达的复杂面板可显式使用 `custom-view`，但仍用统一宿主容器和错误边界。

### 13.5 验收标准

- 设置入口由 `settings-panel` contribution 组成。
- 设置面板不直接依赖某个 shell。
- settings host 不包含账号、同步或其他插件的业务特例。
- schema 严格拒绝样式逃生字段，密码只存在 renderer 内存中。
- 每个设置项有明确持久化位置。
- 设置变更有即时反馈或明确保存按钮。
- 单个设置面板失败时，其他设置面板继续可用。

## 14. 跨插件关键流程

- 搜索：搜索栏读取已启用 provider、按 urlTemplate 构建 URL，经权限桥校验 host 后打开。搜索栏不硬编码 provider 列表，provider 不自行打开 URL。
- 添加卡片：从已启用 widget contributions 选择后宿主创建 PluginInstance、分配 region/grid/size、经 PluginViewBoundary 渲染并持久化。同一 widget 可多实例（除非禁止），尺寸只能来自 supportedSizes，刷新后恢复。
- 调整尺寸：从 `contribution.supportedSizes` 读取，宿主映射语义尺寸到 grid span 并持久化，不展示未声明尺寸，尺寸变化不破坏其他卡片。
- 打开展开：检查 `contribution.views.expand`，宿主提供 expand overlay 经 PluginViewBoundary 渲染。插件只声明 view，宿主负责 overlay/关闭/焦点/层级。
- 主题和背景：读取 theme/background contributions，用户选中后 workspace 更新 active IDs 并持久化。token 应用与 source 解析是宿主职责，插件只贡献数据和 renderer view。
- 插件错误：plugin view 抛错时 PluginViewBoundary 捕获、fallback card/modal/fullscreen 并记录 instanceId/viewId/error，其他实例继续，不出现整页白屏。

## 15. 官方插件验收清单

### 15.1 产品验收

- 默认工作台完全由官方插件装配，使用左侧轻 rail + 顶部命令搜索 + 主网格，首屏出现快捷入口/便签/待办核心模块。
- 用户无需配置即可搜索、打开快捷入口、记录便签、处理待办，并可添加/删除/调整 widget 实例、切换主题和背景。
- 插件管理器能解释默认体验由哪些插件组成；插件失败时页面其他区域继续可用。

### 15.2 交互验收

- 所有可点击元素有 hover 和 focus-visible，表单输入有 label 或 aria label，空状态不使用大段说明文案。
- 删除/禁用/清空等危险操作有确认或可恢复策略，弹窗打开关闭符合键盘焦点规则，移动端不出现横向滚动。

### 15.3 技术验收

- 官方插件通过 manifest/contribution 声明能力、通过 registry 注册 view，外部打开走 permission bridge。
- 插件业务数据进入 plugin data 或明确的实例配置，不混入 workspace 装配数据；widget 渲染包裹在错误边界中。
- `pnpm check`、`pnpm test`、`pnpm build` 通过。

### 15.4 设计验收

- 明亮和暗色主题都可读，卡片尺寸稳定、状态变化不造成布局跳动，默认页面有层次但不喧宾夺主。
- 控件符合场景（checkbox 用于待办、select/combobox 用于搜索源、switch 用于插件启用状态），图标体系统一。

## 16. 实现状态与推进优先级

各插件当前实现状态见 §4 官方插件矩阵的“当前状态”列。后续推进按下列优先级组织。

- 已完成（默认体验闭环）：搜索栏读取真实 `search-provider` contributions；仪表盘布局提供轻 rail、命令搜索和主网格；`@tabora/ui` 基础组件通过稳定 subpath 复用；快捷入口/便签/待办/天气使用实例级 plugin data；默认工作台包含命令搜索/快捷入口/待办/便签/天气卡片；插件错误边界覆盖 card/modal/fullscreen；提供聚合插件/外观/搜索的轻量设置中心。
- P1（管理和设置闭环）：插件管理器读取真实 plugin records；插件详情展示 manifest/contributions/permissions；启用/禁用插件；更完整的权限说明和设置搜索；卡片实例设置与全局设置边界。
- P2（真实内容能力增强）：多城市天气和更丰富天气信息；导入浏览器书签与 favicon；标签/置顶和更丰富的便签编辑；待办编辑/排序/清空已完成。
- P3（生态准备）：本地插件安装；插件 SDK；插件权限审计；插件调试面板；第三方插件市场前置协议。

## 18. 参考对象总览

参考对象只用于体验模式和交互心智，不代表 Tabora 需要复刻其视觉。

| 能力         | 参考对象                                              | 核心借鉴                 |
| ------------ | ----------------------------------------------------- | ------------------------ |
| 工作台仪表盘 | Vivaldi Start Page Dashboard, Notion dashboard        | 模块区域、widget 排列    |
| 新标签页入口 | Chrome / Edge 新标签页                                | 搜索优先、常用入口       |
| 命令式搜索   | Raycast, Spotlight, Arc Command Bar                   | 键盘优先、快速提交       |
| 插件生态     | VS Code Extensions, Chrome Extensions                 | 插件列表、权限、启用管理 |
| 卡片工作台   | iOS widgets, Windows Widgets                          | 模块化、语义尺寸         |
| 快捷入口     | Chrome shortcuts, Raindrop.io, Arc Favorites          | 站点入口、收藏分组       |
| 便签         | Apple Notes Quick Note, Google Keep, Sticky Notes     | 轻量记录、自动保存       |
| 待办         | Todoist, Things, Microsoft To Do                      | 添加、完成、删除、完成度 |
| 天气         | iOS Weather widget, Windows weather widget            | 小尺寸天气摘要           |
| 主题         | VS Code themes, macOS light/dark mode                 | token 化、明暗切换       |
| 背景         | macOS Wallpaper, Windows Personalization, Arc themes  | 背景源、预览、持久化     |
| 设置         | VS Code Settings, Chrome Settings, Linear Preferences | 高密度、分组、可搜索     |

## 19. 开放问题

- 天气是否首屏默认加入，还是只提供在添加面板中。
- 快捷入口默认数据是官方推荐、用户空状态，还是导入浏览器书签。
- 插件管理器是否同时作为卡片出现，还是 MVP 只在设置中心出现。
- 插件禁用关键能力时，是否允许禁用布局、主题、搜索这类结构级插件。
- 背景 renderer 的 props contract 如何标准化。
- 权限提示采用安装时确认、使用时确认，还是两者结合。
