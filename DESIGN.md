---
name: Tabora
description: Plugin-first personal workbench for a browser new tab page.
design_version: "2.0"
style: refined-sage
sources:
  implementation_mapping: docs/product/tabora-design-system.md
visual_references:
  workbench_prototype: docs/design/workbench-prototype.html
  site_preview: docs/design/landing.html
  download_preview: docs/design/download.html
colors:
  light:
    page: "#F6F7F4"
    page_muted: "#F1F3EF"
    surface: "#FFFFFF"
    surface_soft: "#FAFAF8"
    surface_hover: "#F2F4F0"
    text: "#1C1E1C"
    text_muted: "#6B6E6A"
    text_subtle: "#949792"
    line: "#E6E8E3"
    line_strong: "#D1D4CE"
    accent: "#1A9070"
    accent_hover: "#15785C"
    accent_soft: "#EAF5F0"
    focus: "#1A9070"
    success: "#2D8A5E"
    warning: "#A66A12"
    danger: "#C94545"
    info: "#3D7BA8"
  dark:
    page: "#191C1A"
    page_muted: "#1F2321"
    surface: "#252927"
    surface_soft: "#2A2E2C"
    surface_hover: "#323734"
    text: "#EDF0ED"
    text_muted: "#B6BAB6"
    text_subtle: "#868B86"
    line: "#3B403C"
    line_strong: "#535954"
    accent: "#34D19E"
    accent_hover: "#5CE0B6"
    accent_soft: "#1A2E26"
    focus: "#34D19E"
    success: "#4FC49A"
    warning: "#D5A14A"
    danger: "#EF8B8B"
    info: "#7FB7DF"
typography:
  font_family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif
  mono_family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace
  scale:
    display: { size: 32px, line_height: 1.2, weight: 700 }
    title_1: { size: 24px, line_height: 1.25, weight: 700 }
    title_2: { size: 20px, line_height: 1.3, weight: 650 }
    title_3: { size: 16px, line_height: 1.4, weight: 650 }
    body: { size: 14px, line_height: 1.45, weight: 400 }
    body_sm: { size: 13px, line_height: 1.4, weight: 400 }
    caption: { size: 12px, line_height: 1.35, weight: 400 }
    micro: { size: 11px, line_height: 1.3, weight: 500 }
spacing:
  "0": 0
  "1": 2px
  "2": 4px
  "3": 8px
  "4": 12px
  "5": 16px
  "6": 20px
  "7": 24px
  "8": 32px
  "10": 48px
radii:
  "1": 4px
  "2": 6px
  control: 8px
  card: 8px
  panel: 12px
  pill: 999px
shadows:
  none: none
  raised: top-level panels and raised cards
  floating: dialogs, drawers, popovers, menus
  dragging: active dragged widget cards
motion:
  duration_fast: 120ms
  duration_normal: 180ms
  duration_slow: 240ms
  ease_standard: cubic-bezier(0.2, 0, 0, 1)
  ease_emphasized: cubic-bezier(0.05, 0.7, 0.1, 1)
breakpoints:
  sm: 480px
  md: 768px
  lg: 1024px
  xl: 1280px
icons:
  library: lucide-solid
  content_size: 16px
  navigation_size: 20px
  stroke_width: 2px
---

# Tabora Design

## Overview

Tabora 是一个插件优先的个人工作台新标签页产品。界面应像每天打开数十次的工具：安静、清晰、稳定、可重复使用。页面第一屏必须是可用工作台，不是 landing page。

平台视觉基于 Refined Sage。绿色只是低频强调色，不是大面积主题色。默认气质是暖白页面、清晰边框、克制表面、紧凑排印和稳定卡片。

`DESIGN.md` 是 Tabora 视觉语言、token、基础组件语义、宿主容器视觉、交互模式和可访问性规则的单一事实源。本文件按 `google-labs-code/design.md` 的格式生成，用于让 AI 和工程实现快速读取关键 token、布局规则、组件语义和禁忌。

`docs/design/workbench-prototype.html`、`docs/design/landing.html` 和 `docs/design/download.html` 只作为可视原型或静态预览资产，不再承载规范事实。若预览与本文件冲突，以本文件为准，并同步更新预览或实现。

## Colors

Tabora 使用三层 token：原始值、语义 token、组件 token。主题定义可以使用原始值；组件、插件、布局只使用语义或组件 token。

核心语义 token：

- `--tabora-color-page`：页面底色。
- `--tabora-color-surface`：卡片、输入框、弹窗表面。
- `--tabora-color-surface-hover`：hover 弱背景。
- `--tabora-color-text`：主文本。
- `--tabora-color-text-muted`：说明文字和辅助文本。
- `--tabora-color-text-subtle`：占位、禁用、非关键提示。
- `--tabora-color-inverse`：强填充按钮、勾选态、品牌圆标等强色块上的前景色。
- `--tabora-color-shadow`：通用浮层、菜单和控件阴影的中性 RGB 基色。
- `--tabora-color-shadow-strong`：大面板、拖拽态等更深层级阴影的 RGB 基色。
- `--tabora-color-scrim`：遮罩层和背景压暗使用的 RGB 基色。
- `--tabora-color-line`：默认边框。
- `--tabora-color-line-strong`：hover 或更强分隔。
- `--tabora-color-accent`：主操作、选中态、焦点环。
- `--tabora-color-accent-soft`：选中背景、轻强调底色。

强调色占可视面积必须低于 5%。强调色只能用于主按钮、导航激活态、焦点环、已勾选态、选中边框和小型数据高亮。不要用强调色做正文、大面积背景、装饰块或卡片底色。

边框是主要层级手段。默认卡片使用 1px `line` 边框且无阴影；hover 只切换到 `line-strong`，不改变尺寸；选中态用 `accent` 边框加 `accent-soft` 背景。

## Typography

使用单一字体 Inter，并回退到系统无衬线栈。整体是 productive type scale，不使用展示级 hero 字号，不做衬线配对。

排印层级：

- `display`：32px / 1.2 / 700，用于页面标题、设置主页标题。
- `title-1`：24px / 1.25 / 700，用于设置面板标题、全屏视图标题。
- `title-2`：20px / 1.3 / 650，用于面板标题、弹窗标题。
- `title-3`：16px / 1.4 / 650，用于卡片标题、设置分组标题。
- `body`：14px / 1.45 / 400，用于默认正文、列表、搜索建议。
- `body-sm`：13px / 1.4 / 400，用于卡片内辅助正文、控件文本、描述。
- `caption`：12px / 1.35 / 400，用于标签、时间戳、元信息、帮助文本。
- `micro`：11px / 1.3 / 500，用于状态标签、快捷键、极端紧凑场景。

等宽字体只用于插件 ID、键盘快捷键、代码片段、调试信息和色值。正文与 UI 标签不得使用等宽字体。

## Layout

默认工作台是三区结构：左侧轻 rail、内容区、页面背景。内容区在仪表盘式布局中包含常驻命令搜索和主网格；在流式布局中通过 `⌘K` 唤起命令搜索，并使用双列流式内容区。

桌面行为：

- rail 宽 56-64px。
- 搜索栏高 48-56px。
- 主网格 4 列，gap 12-16px。
- 页面边距 24-32px。
- 卡片过多时主网格纵向滚动。

平板行为：

- rail 宽 48px。
- 搜索栏高 44-52px。
- 主网格 3 列。
- 页面边距 20px。

移动行为：

- rail 折叠为底部工具栏。
- 搜索栏高 44px。
- 主网格 1 列。
- 页面边距 16px。

任何断点都不能出现默认横向滚动。不要为了塞进更多卡片而压缩到不可读；新卡片追加到网格末尾，用户通过拖拽排序和尺寸调整管理优先级。

组件内部使用 padding。布局容器使用 flex/grid gap 分隔子元素。可复用组件不要设置外部 margin。

## Elevation & Depth

Tabora 的默认层级靠边框、表面色和空间关系表达，不靠重阴影。

- `shadow-none`：默认卡片、行内元素。
- `shadow-raised`：顶级面板、浮起卡片。
- `shadow-floating`：弹窗、抽屉、弹出菜单。
- `shadow-dragging`：正在拖拽的卡片。

阴影和遮罩统一基于 `color-shadow`、`color-shadow-strong`、`color-scrim` 这组三元色 token，再按场景叠加各自透明度；不要继续在组件或宿主样式里写死 `rgba(0, 0, 0, ...)` 一类字面量。

弱 glow、内高光和聚焦抬升直接复用 `color-text`、`color-accent`、`color-inverse` 这类已有语义 token 并叠加透明度，不为单个组件继续写死额外 `rgba(...)` 色值。

浮层的视觉顺序应与交互顺序一致：菜单和 popover 低于 drawer/dialog，拖拽态高于普通卡片。不要同时打开多个主浮层；Dialog 负责确认，Drawer 负责上下文设置或详情。

## Shapes

圆角保持克制：

- `4px`：小标签、勾选框、内部微元素。
- `6px`：小型控件、图标按钮。
- `8px`：按钮、输入框、下拉选择、列表行、卡片。
- `12px`：设置宿主、弹窗、页面级面板。
- `999px`：标签、分段指示器、胶囊按钮。

卡片和重复项默认不超过 8px 圆角。宿主级 panel、dialog、drawer 可使用 12px。不要把页面区块包装成漂浮大卡片，不要嵌套卡片。

## Components

`@tabora/ui` 承载插件内容区基础组件和低层可访问 primitive，例如 `Dialog`、`Drawer`、`Popover`、`ContextMenu`、`Toast`、通用 `CommandPalette`。Tabora 宿主级容器，例如 `WidgetCardShell`、全局 `ModalHost`、`FullscreenHost`、`SettingsHost`、`WorkbenchRail`、`WorkbenchGrid`、shell 全局命令面板，由 shell 或 layout host 提供，不放入 `@tabora/ui`。

基础组件规则：

- Button：主操作触发器。每个可视区域最多一个 primary。支持变体、尺寸、loading、disabled。
- IconButton：用于仅图标动作，必须有 `aria-label` 或 tooltip。
- Input / Textarea：必须有 label 或 aria label；placeholder 不是 label。
- Select：5 个以上选项使用 Select；2-4 个互斥短选项使用 SegmentedControl。
- Combobox：用于搜索选择或大量选项。
- Checkbox：表示可勾选完成或多选状态，待办完成必须用 checkbox。
- Switch：表示二元启用/禁用设置，不用于执行一次性动作。
- RadioGroup：3-5 个互斥选项。
- Tabs：切换同一容器内的内容视图。
- DropdownMenu / ContextMenu：承载尺寸、展开、移除等动作。危险动作要有明确样式。
- Dialog：模态确认或通知。危险确认使用 destructive 变体。
- Drawer：设置、详情查看等需要保持上下文但需要更多空间的场景。
- CommandPalette：`@tabora/ui` 可提供通用 primitive；Tabora 全局命令、搜索、卡片和 provider 切换入口由 shell 组合并持有状态。
- Toast：非阻塞反馈，自动消失，最多一个操作。需要确认的错误使用 Dialog 或 InlineError。
- Banner / Alert / InlineError：用于页面、区域或字段级状态。
- Spinner / Skeleton / Progress：用于加载和进度反馈，不能造成布局跳动。
- EmptyState：用于空数据或无匹配结果，提供下一步动作。
- ListRow / CardSection / Table：用于密集、可扫描的信息组织。

完整设计 catalog 包含：Button、IconButton、Input、Textarea、Select、Combobox、Link、Kbd、TagInput、Breadcrumb、Checkbox、Switch、RadioGroup、SegmentedControl、ToggleGroup、Tabs、DropdownMenu、ContextMenu、Dialog、Drawer、Popover、HoverCard、CommandPalette、Tooltip、Toast、Banner、Alert、Field、Badge、InlineError、Spinner、Skeleton、Progress、ScrollArea、Divider、Chip、Avatar、Accordion、Collapsible、Slider、Pagination、Table、TreeView、Menubar、Steps、Timeline、EmptyState、ListRow、CardSection、CopyButton、Truncate、VisuallyHidden。

官方插件内容区优先复用 `@tabora/ui`。插件不能直接创建全局 modal、fullscreen、settings 容器、toast 层或右键菜单宿主；必须通过 runtime context、extension registry 或 host API。

## Interactions

命令搜索支持实时建议、分组结果、方向键导航、`Enter` 执行、`Esc` 关闭。搜索源切换支持 `@provider` 语法和可见提示。外部打开必须经过 `external-open` 权限桥。

Widget 支持多实例、多尺寸、拖拽排序、右键尺寸菜单、双击展开和状态持久化。Widget 内容过长时在内部滚动或截断，不撑破卡片。hover、focus、拖拽、loading 不得改变外部尺寸。

设置中心是轻量 settings host：左侧分类导航，右侧内容区。MVP 面板包含插件只读信息、外观主题与背景、默认搜索源和搜索源启用状态。

关键操作使用 Toast 提供非阻塞反馈。快捷键必须可发现，至少包含参考入口或提示面板。

## Accessibility

目标为 WCAG 2.2 AA。所有面向用户的控件必须可键盘操作，焦点顺序与视觉顺序一致，焦点状态可见。

最低要求：

- 普通文本对比度不低于 4.5:1。
- 非文本元素、边框、图标和焦点环对比度不低于 3:1。
- 图标不能单独表达错误、成功或危险状态，必须配合文字或可访问名称。
- 交互目标至少 24x24px；更小视觉目标需要足够间距。
- 动画必须尊重 `prefers-reduced-motion: reduce`。
- Dialog、Drawer、CommandPalette 打开后管理焦点，并在关闭后返回触发元素。

## Motion

动效是反馈，不是装饰。使用 120ms、180ms、240ms 三档时长，默认缓动为 `cubic-bezier(0.2, 0, 0, 1)`。

不要在 hover 上使用 scale。不要做连续装饰动画。不要动画化会触发重排的属性，例如 margin、padding、border-width。加载状态必须预留稳定尺寸。

## Icons

默认图标库是 `lucide-solid`。内容区图标 16px，rail 和导航图标 20px，描边宽度 2px，颜色继承 `currentColor`。

图标必须匹配动作语义。新增 UI 不使用 emoji 作为功能图标；天气等领域图标可以使用自定义 SVG。

## Do's and Don'ts

Do:

- 使用 theme token 和 CSS custom properties。
- 保持第一屏是可用工作台。
- 让布局、搜索源、背景、主题、widget、设置面板来自插件贡献。
- 使用边框和间距表达层级。
- 保持卡片尺寸稳定，hover/focus/drag 不造成布局跳动。
- 在移动端折叠为单列并保留实例 `size` 状态。
- 使用 lucide 图标、语义控件、label、aria label 和 focus-visible。
- 让插件错误局部化，widget 失败只影响该实例。

Don't:

- 不硬编码大面积颜色或直接消费原始 token。
- 不做 landing page、营销式 hero 或装饰性大图。
- 不把所有官方卡片强行塞进一屏。
- 不使用横向滚动作为默认溢出方案。
- 不嵌套卡片，不把页面 section 做成漂浮卡片。
- 不用阴影、渐变或大面积强调色制造层级。
- 不在 hover 上缩放，不通过 border-width 改变尺寸。
- 不让插件直接 `window.open`、创建全局宿主容器或访问宿主内部 store。
- 不用 emoji 做功能图标。
