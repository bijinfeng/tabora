# Tabora 个人工作台设计体系

版本：V1.0（当前实现参考）

日期：2026-05-27

状态：基于当前 PRD、官方插件设计、技术方案、用户认可的浅绿灰工作台视觉方向，以及成熟设计体系实践抽离。

> **V2 设计体系已发布**，包含完整的 Refined Sage 色彩方案、52 个基础组件规范、可交互双布局工作台原型。
> 详见 `docs/design/` 目录：
>
> - `01-设计体系规范.html` — 完整 Token、原则、布局、动效、可访问性规范
> - `02-基础组件规范.html` — 52 个组件全状态/变体/尺寸文档
> - `03-工作台交互原型.html` — 双布局可交互产品原型

关联文档：

- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design.md`
- 静态视觉预览：`docs/product/tabora-design-system-preview.html`
- 文档地图：`docs/README.md`

## 1. 文档目标

本文档是 Tabora 的视觉、交互和基础组件设计事实源。它用于指导：

- `@tabora/theme` 的 token 命名、语义和默认值。
- `@tabora/ui` 基础组件包（已交付）。
- Playground / extension shell 的宿主容器视觉。
- 官方插件内容区 UI。
- 后续第三方插件的设计约束和验收标准。

它不替代 PRD、技术方案或插件协议。产品范围仍以 PRD 为准，架构边界仍以技术方案为准；本文档只回答“Tabora 应该长什么样、组件如何一致、交互如何保持专业和可访问”。

## 2. 设计定位

Tabora 的设计目标是“安静、清晰、可重复使用的个人工作台”。

关键词：

- 安静：低噪声、少装饰、少营销式表达。
- 清晰：布局、层级、状态和操作一眼可扫。
- 工作感：适合每天多次打开和重复使用，不制造视觉疲劳。
- 模块化：每张卡片都是稳定模块，可以组合、排序、调整尺寸。
- 可扩展：官方插件和未来第三方插件共享同一套 token、组件和宿主边界。
- 可恢复：刷新、关闭、重开后，视觉和状态都尽量保持连续。

Tabora 不追求“漂亮的营销页”或“沉浸式壁纸入口”。第一屏应该是可用工作台，而不是 hero page。

## 3. 外部参考与吸收原则

这些参考对象只用于提炼设计方法，不用于复刻视觉：

| 参考体系             | 吸收点                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| Material Design 3    | 语义化 design tokens、颜色角色、状态层级和组件状态设计。               |
| Carbon Design System | 背景 / layer / field / border / text token 分层，2/4/8 spacing scale。 |
| Fluent 2             | 中性表面建立层级、系统字体栈、清晰 type ramp、跨平台熟悉感。           |
| Apple HIG Widgets    | Widget 应该 glanceable、focused、quickly consumable。                  |
| Windows Widgets      | 信息卡片应模块化、可组合，避免把完整应用塞进单张卡片。                 |
| Radix Themes         | 12-step 色阶、accent / gray 分离、radius / shadow / component API。    |
| Open UI / WAI APG    | 组件 anatomy、键盘交互、语义角色、可访问名称和状态。                   |
| WCAG 2.2             | 对比度、键盘可达、焦点可见、非文本对比、目标尺寸和可理解反馈。         |

设计吸收原则：

- 借方法，不借品牌视觉。
- 借 token 分层，不照搬色值。
- 借组件 anatomy，不照搬组件库 API。
- 借可访问性标准，不把它当作后补检查项。

## 4. 视觉方向

Tabora 默认明亮主题应接近用户认可的方案模板气质：

- 页面底色为浅绿灰，不使用纯白大底。
- 卡片和输入表面以白色或近白色为主。
- 层级主要靠边框、留白、弱阴影和背景差建立。
- 强调色为克制的青绿色，只用于主操作、选中态、当前状态和少量关键数字。
- 信息密度偏工作台，不做营销式大标题和大按钮。
- 卡片是模块，不是装饰容器；卡片内部不再嵌套第二层卡片。
- 页面可以有轻微背景层次，但不能影响卡片和文字对比。

避免：

- 大面积紫色、蓝紫渐变、霓虹色。
- 大面积米色、棕色、咖啡色或暖橙色。
- 纯黑暗色主题。
- heavy glass、强模糊、强投影。
- 过圆、过软、玩具化的卡片。
- 把 landing page hero、营销说明或产品介绍放进第一屏。
- 用 emoji 做 UI 图标。

## 5. Design Tokens

### 5.1 Token 分层

Tabora 使用三层 token：

| 层级            | 用途                                   | 示例                                             |
| --------------- | -------------------------------------- | ------------------------------------------------ |
| Primitive token | 原始色值、尺寸、阴影，不直接给业务用   | `--tabora-green-9`、`--tabora-space-4`           |
| Semantic token  | 语义角色，组件和布局主要使用           | `--tabora-color-surface`、`--tabora-color-text`  |
| Component token | 单个组件的局部语义，可从 semantic 映射 | `--tabora-button-primary-bg`、`--tabora-card-bg` |

规则：

- 组件和插件默认只用 semantic / component token。
- 原始色值只能出现在主题包、token 定义文件和视觉预览里。
- 官方插件不得硬编码大面积颜色。
- 新主题必须完整提供 semantic token，缺失时宿主回退到安全默认 token。

### 5.2 明亮主题建议值

初始明亮主题建议：

| Token                          | 建议值    | 用途                       |
| ------------------------------ | --------- | -------------------------- |
| `--tabora-color-page`          | `#f3f7f2` | 页面底色                   |
| `--tabora-color-page-muted`    | `#eef4ee` | 次级页面底色、大片背景层   |
| `--tabora-color-surface`       | `#ffffff` | 卡片、输入框、弹窗表面     |
| `--tabora-color-surface-soft`  | `#f8fbf8` | 弱表面、列表 hover、空状态 |
| `--tabora-color-surface-hover` | `#edf5ee` | hover 表面                 |
| `--tabora-color-text`          | `#0d1f1b` | 主文本                     |
| `--tabora-color-text-muted`    | `#5f6f69` | 次级文本                   |
| `--tabora-color-text-subtle`   | `#87958f` | 占位、辅助说明             |
| `--tabora-color-line`          | `#d9e3dc` | 普通边框                   |
| `--tabora-color-line-strong`   | `#c8d5cc` | 强边框、选中边框           |
| `--tabora-color-accent`        | `#0f7b68` | 主操作、选中态             |
| `--tabora-color-accent-hover`  | `#095f51` | 主操作 hover               |
| `--tabora-color-accent-soft`   | `#dff2ec` | 选中背景、轻强调背景       |
| `--tabora-color-focus`         | `#0f7b68` | focus-visible ring         |
| `--tabora-color-success`       | `#237a57` | 成功                       |
| `--tabora-color-warning`       | `#a66a12` | 警告、demo 标记            |
| `--tabora-color-danger`        | `#b94343` | 删除、错误                 |
| `--tabora-color-info`          | `#2d6f9f` | 信息提示                   |

### 5.3 暗色主题建议值

暗色主题不使用纯黑，应保持深灰和低饱和青绿色：

| Token                          | 建议值    | 用途                   |
| ------------------------------ | --------- | ---------------------- |
| `--tabora-color-page`          | `#171c1a` | 页面底色               |
| `--tabora-color-page-muted`    | `#1d2421` | 次级页面底色           |
| `--tabora-color-surface`       | `#232b27` | 卡片、输入框、弹窗表面 |
| `--tabora-color-surface-soft`  | `#28322e` | 弱表面                 |
| `--tabora-color-surface-hover` | `#303b36` | hover 表面             |
| `--tabora-color-text`          | `#edf4ef` | 主文本                 |
| `--tabora-color-text-muted`    | `#b4c1ba` | 次级文本               |
| `--tabora-color-text-subtle`   | `#83928b` | 占位、辅助说明         |
| `--tabora-color-line`          | `#3b4742` | 普通边框               |
| `--tabora-color-line-strong`   | `#52625b` | 强边框                 |
| `--tabora-color-accent`        | `#4fc3aa` | 主操作、选中态         |
| `--tabora-color-accent-hover`  | `#78dcc7` | 主操作 hover           |
| `--tabora-color-accent-soft`   | `#173b34` | 选中背景、轻强调背景   |
| `--tabora-color-focus`         | `#78dcc7` | focus-visible ring     |
| `--tabora-color-success`       | `#6fc49a` | 成功                   |
| `--tabora-color-warning`       | `#d5a14a` | 警告                   |
| `--tabora-color-danger`        | `#ef8b8b` | 删除、错误             |
| `--tabora-color-info`          | `#7fb7df` | 信息提示               |

### 5.4 色彩使用规则

- 页面中绿色强调色的视觉占比应保持低，不让界面变成单色绿色主题。
- 主文本必须优先使用 `--tabora-color-text`，不要用 accent 色写大段正文。
- muted 文本也必须满足可读性，不使用过浅灰。
- 错误、警告、成功不能只靠颜色表达，必须配合文案、图标或结构。
- 边框是 Tabora 的主要层级手段，阴影只用于浮层和顶级容器。
- 任何 theme contribution 都必须提供 light / dark 下的可读 token 组合。

## 6. Typography

### 6.1 字体栈

默认字体使用系统无衬线，保证中英文混排和跨平台熟悉感：

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  "PingFang SC",
  "Microsoft YaHei",
  sans-serif;
```

等宽字体：

```css
font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

### 6.2 Type scale

Tabora 是工具型产品，默认使用 productive type scale。

| Token                   | Size / Line-height | Weight | 用途                       |
| ----------------------- | ------------------ | ------ | -------------------------- |
| `--tabora-font-display` | `32px / 40px`      | `700`  | 文档、预览、少量一级标题   |
| `--tabora-font-title-1` | `24px / 32px`      | `700`  | 设置中心或全屏视图主标题   |
| `--tabora-font-title-2` | `20px / 28px`      | `650`  | 面板标题                   |
| `--tabora-font-title-3` | `16px / 24px`      | `650`  | 卡片标题、设置分组标题     |
| `--tabora-font-body`    | `14px / 20px`      | `400`  | 默认正文、列表文本         |
| `--tabora-font-body-sm` | `13px / 18px`      | `400`  | 卡片辅助正文、控件文本     |
| `--tabora-font-caption` | `12px / 16px`      | `400`  | badge、提示、时间、元信息  |
| `--tabora-font-micro`   | `11px / 14px`      | `500`  | 极少量状态标签，不用于正文 |

规则：

- 字号不随 viewport width 连续缩放。
- letter spacing 默认为 `0`。
- 禁止使用全大写强调中文或长英文。
- 卡片内不使用 hero 级字体。
- semibold 用于标题和关键数值，不用于大段正文。
- 等宽字体只用于插件 ID、代码、快捷键或 debug 信息。

## 7. Spacing、Grid 与尺寸

### 7.1 间距 scale

以 4px 为基础，允许 2px 用于细节微调：

| Token               | px  | 用途                     |
| ------------------- | --- | ------------------------ |
| `--tabora-space-0`  | 0   | 无间距                   |
| `--tabora-space-1`  | 2   | 细节微调                 |
| `--tabora-space-2`  | 4   | 图标与文字小间距         |
| `--tabora-space-3`  | 8   | 控件内部紧凑间距         |
| `--tabora-space-4`  | 12  | 卡片内小组间距           |
| `--tabora-space-5`  | 16  | 卡片 padding、组件组间距 |
| `--tabora-space-6`  | 20  | 中等内容间距             |
| `--tabora-space-7`  | 24  | 页面区块间距             |
| `--tabora-space-8`  | 32  | 页面外边距、较大分组     |
| `--tabora-space-9`  | 40  | 大区块间距               |
| `--tabora-space-10` | 48  | 全屏视图大分隔           |
| `--tabora-space-12` | 64  | 桌面宽屏大留白           |

规则：

- 组件内部使用 padding，外部布局用 parent gap 管理。
- 不依赖子组件 margin 拼布局。
- 页面可以密，但不能挤；需要给搜索区、核心卡片和设置面板留清晰呼吸。
- 移动端可以在断点处降一级 spacing，但 token 本身不随视口连续变化。

### 7.2 工作台布局

桌面端默认结构：

```txt
workbench-shell
  rail: 56-64px
  content
    command-search
    main-grid
```

建议尺寸：

| 区域           | 桌面端建议                              | 移动端建议                       |
| -------------- | --------------------------------------- | -------------------------------- |
| Page padding   | `24-32px`                               | `16px`                           |
| Rail width     | `56-64px`                               | 折叠为底部工具条或顶部紧凑操作区 |
| Search height  | `48-56px`                               | `44-52px`                        |
| Grid gap       | `12-16px`                               | `12px`                           |
| Card min width | `180-220px`                             | 单列                             |
| Settings width | drawer `520-720px` 或 modal `720-960px` | 全屏或近全屏                     |

### 7.3 Widget 语义尺寸

语义尺寸由插件声明，宿主映射到当前布局：

| Size | 桌面网格建议 | 产品语义                   |
| ---- | ------------ | -------------------------- |
| `S`  | `1 x 1`      | 摘要、状态、短数值         |
| `M`  | `2 x 1`      | 默认工作卡片               |
| `L`  | `2 x 2`      | 列表、编辑、更多内容       |
| `XL` | `4 x 2`      | 复杂编辑、宽内容、全局概览 |

规则：

- 移动端可以折叠为单列，但保留实例语义 `size`。
- hover、loading、error 不得改变卡片外部尺寸。
- 卡片内容过长时内部滚动或截断，不撑破主网格。
- 卡片过多时主网格纵向滚动，不横向滚动，不压缩到不可读。

## 8. Shape、Border 与 Elevation

### 8.1 Radius

| Token                     | px    | 用途                                       |
| ------------------------- | ----- | ------------------------------------------ |
| `--tabora-radius-1`       | 4     | 小标签、内部细节                           |
| `--tabora-radius-2`       | 6     | 小控件、小图标按钮                         |
| `--tabora-radius-control` | 8     | button、input、select、list row            |
| `--tabora-radius-card`    | 8     | widget 卡片、重复卡片项                    |
| `--tabora-radius-panel`   | 12    | settings host、modal、页面级面板、预览容器 |
| `--tabora-radius-popover` | 12    | tooltip、popover、menu                     |
| `--tabora-radius-pill`    | 999px | badge、segmented indicator、pill button    |

说明：

- 重复出现的业务卡片默认不超过 8px，保持工具产品的专业感。
- 页面级宿主容器可以使用 12px，形成轻微柔和的工作台气质。
- 不使用过大的 20px+ 圆角作为默认卡片语言。

### 8.2 Border

边框是 Tabora 的主要层级语言：

| Token                    | 用途                       |
| ------------------------ | -------------------------- |
| `--tabora-border-subtle` | 普通卡片、输入、列表行     |
| `--tabora-border-strong` | active、selected、分隔重点 |
| `--tabora-border-focus`  | focus-visible              |
| `--tabora-border-danger` | 危险操作、错误输入         |

规则：

- 卡片默认有 1px subtle border。
- 可操作卡片 hover 时改变 border 或背景，不改变尺寸。
- selected 状态使用 strong border + soft accent background。
- 不用阴影代替所有边界。

### 8.3 Elevation

| Token                      | 用途                   |
| -------------------------- | ---------------------- |
| `--tabora-shadow-none`     | 普通卡片               |
| `--tabora-shadow-raised`   | 顶级面板、浮起卡片     |
| `--tabora-shadow-floating` | modal、drawer、popover |
| `--tabora-shadow-dragging` | 拖拽中的 widget        |

规则：

- 主网格卡片默认无大阴影，只保留边框。
- modal / drawer 可以有明显但柔和的阴影。
- 拖拽态只增强边框、透明度或阴影，不改变卡片大小。

## 9. Motion 与反馈

### 9.1 Motion

| Token                      | 建议值     | 用途                |
| -------------------------- | ---------- | ------------------- |
| `--tabora-duration-fast`   | `120ms`    | hover、pressed      |
| `--tabora-duration-normal` | `180ms`    | popover、状态切换   |
| `--tabora-duration-slow`   | `240ms`    | modal / drawer 出现 |
| `--tabora-ease-standard`   | `ease-out` | 默认缓动            |

规则：

- 动效是反馈，不是装饰。
- 禁止大幅 scale 造成布局错觉。
- 尊重 `prefers-reduced-motion`。
- 保存成功默认安静，不频繁 toast。

### 9.2 Feedback

| 状态       | 表达方式                                 |
| ---------- | ---------------------------------------- |
| Hover      | 背景或边框轻微变化                       |
| Pressed    | 背景加深或 inset 感                      |
| Focus      | 2-3px focus ring，不能只变颜色           |
| Loading    | 局部 spinner / skeleton，不移动布局      |
| Empty      | 简短文案 + 一个明确操作，不放长说明      |
| Error      | `InlineError` + 可恢复动作，不让整页崩溃 |
| Permission | 说明被拒绝的能力和下一步，不静默失败     |

## 10. 宿主容器规范

宿主容器由 shell / host 提供，不进入 `@tabora/ui`。

### 10.1 Workbench Shell

- 第一屏直接展示工作台。
- 页面背景使用 `color-page`，不使用纯白。
- content 区域承载搜索和主网格。
- 页面纵向滚动由 shell 控制。

### 10.2 Rail

- 桌面端宽度 `56-64px`。
- 入口包括主页、添加卡片、插件、设置。
- 使用图标按钮，必须有 tooltip 或 aria label。
- active 状态使用 soft accent background 和 strong border。
- 不承载具体业务内容。
- 移动端折叠为底部工具条或顶部紧凑操作区。

### 10.3 Command Search

- 是第一操作入口，但不做 hero。
- 高度 `48-56px`。
- 可显示当前搜索源、快捷键和简短提示。
- 搜索源、快捷建议和命令来自插件 contribution。
- 不硬编码 provider。

### 10.4 Widget Card Shell

- 宿主渲染卡片外壳、header、尺寸菜单、删除、展开入口。
- 插件只渲染 card body。
- header 高度稳定。
- 卡片有固定 padding 和边框。
- error fallback 仍保持卡片尺寸稳定。

### 10.5 Settings Host

- 用 drawer 或 modal 打开，不常驻右侧栏。
- 桌面端推荐左侧导航 + 右侧内容。
- 移动端全屏或近全屏。
- 每个 settings panel 单独错误隔离。
- 打开后焦点进入 settings，关闭后回到触发按钮。

### 10.6 Modal / Fullscreen Host

- overlay、焦点、关闭、层级由宿主负责。
- 插件只提供内容 view。
- modal 不允许插件自己创建全局固定层。
- fullscreen 用于内容密度明显超过 modal 的场景。

## 11. `@tabora/ui` 基础组件规范

`@tabora/ui` 是插件内容区组件包，不拥有宿主容器。

### 11.1 包边界

允许：

- 依赖 `solid-js`。
- 依赖 `@tabora/theme`。
- 导出基础组件、组件类型、样式入口。
- 使用 CSS custom properties。

禁止：

- 依赖 `@tabora/platform-kernel`。
- 依赖 `@tabora/storage`。
- 依赖 `@tabora/official-plugins`。
- 打开 modal / fullscreen / settings host。
- 直接执行外部打开、网络请求或权限请求。

### 11.2 组件 API 总原则

- Props 使用稳定语义：`variant`、`size`、`disabled`、`loading`、`invalid`、`data-state`。
- 图标使用 slot，不把图标库绑定进核心 API。
- 所有纯图标操作必须支持 `aria-label`。
- 组件尺寸必须稳定，状态变化不引起布局跳动。
- 组件内部不使用业务文案。
- 组件默认不带 margin。

### 11.3 MVP 组件清单

| 组件               | 主要用途                         | 关键要求                                            |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| `Button`           | 文本或图标 + 文本操作            | `primary`、`secondary`、`subtle`、`danger`、loading |
| `IconButton`       | 卡片操作、rail 操作、关闭 / 展开 | 固定尺寸、tooltip、aria label                       |
| `Input`            | 单行输入                         | label 绑定、invalid、placeholder 可读               |
| `Textarea`         | 便签、长文本                     | 自身滚动，不撑破卡片                                |
| `Select`           | 搜索源、主题、背景               | 键盘可用，选中态清晰                                |
| `Checkbox`         | 待办完成                         | label 点击区域明确                                  |
| `Switch`           | 插件启用状态                     | on/off 文案或 aria 状态明确                         |
| `SegmentedControl` | 尺寸、视图模式                   | roving focus 或等效键盘支持                         |
| `Tabs`             | 设置内部分组                     | ARIA tabs 语义                                      |
| `Tooltip`          | 解释图标按钮                     | hover / focus 可触发，不遮挡操作                    |
| `Field`            | 表单组合                         | label、description、error                           |
| `Badge`            | 状态、权限、demo                 | 短文案，颜色克制                                    |
| `InlineError`      | 局部错误                         | 绑定对应控件或区域                                  |
| `Spinner`          | 加载                             | 尺寸稳定，有 accessible name                        |
| `EmptyState`       | 轻量空状态                       | 一句说明 + 一个主操作                               |
| `ListRow`          | 插件列表、待办、设置项           | 高度稳定，可选 leading / trailing slot              |
| `CardSection`      | 卡片内部区块                     | 不是卡片外壳，不嵌套视觉卡片                        |

### 11.4 Button

尺寸：

| Size | Height | 用途                    |
| ---- | ------ | ----------------------- |
| `sm` | 28px   | 卡片内次级动作          |
| `md` | 36px   | 默认按钮                |
| `lg` | 44px   | modal / settings 主动作 |

Variant：

- `primary`：只用于当前主要动作。
- `secondary`：普通提交或次操作。
- `subtle`：低强调操作。
- `ghost`：图标或 toolbar 上的弱操作。
- `danger`：删除、清空、禁用。

规则：

- 一个局部区域默认最多一个 primary。
- loading 时保持按钮宽度。
- danger 不使用大面积红色背景，除非是确认弹窗里的主危险动作。

### 11.5 Form Components

- 表单项必须有可见 label 或明确 aria label。
- description 和 error 由 `Field` 统一组合。
- invalid 状态不能只靠红色边框。
- placeholder 不是 label。
- 保存失败显示在对应字段附近。

### 11.6 Selection Components

- `Checkbox` 用于多选或完成态。
- `Switch` 用于启用 / 禁用，不用于普通选择。
- `SegmentedControl` 用于少量互斥选项。
- `Select` 用于 5 个以上选项或动态 provider 列表。
- 后续 `Combobox` 进入 V1.1 或更晚，MVP 不强制。

## 12. 插件内容规范

### 12.1 通用卡片内容

- 卡片标题由宿主 header 渲染。
- 插件内容区第一屏应 glanceable。
- S 尺寸只展示核心状态。
- M 尺寸展示核心状态和 1 组操作。
- L/XL 可以展示列表、编辑器或更多设置入口。
- 内容过长时内部滚动或截断，不撑破卡片。
- 空状态文案不超过两行。

### 12.2 今日重点

- 应是首屏最具“个人工作台”心智的卡片。
- 默认状态展示一个短输入或当前重点。
- 不做复杂日程、不做项目管理、不跨插件聚合。
- 完成态要清晰但安静。

### 12.3 快捷入口

- 使用小型图标或字母标识，不使用 emoji。
- 链接按钮尺寸稳定。
- 空状态引导添加第一个入口。
- 外部打开失败要显示权限反馈。

### 12.4 便签

- 文本区域像轻量纸张，不做复杂富文本工具栏。
- 自动保存反馈安静。
- 长文本在卡片内截断或滚动。
- modal 中可以提供更宽编辑区。

### 12.5 待办

- 行高稳定，checkbox 和文本对齐。
- 完成态使用文本弱化 + checkbox，不只靠颜色。
- 删除和清空已完成需要明确可恢复或确认策略。

### 12.6 天气

- 作为辅助信息卡，不抢主视觉。
- 不用大图标撑满卡片。
- 真实数据失败时保留上次成功数据或明确 fallback。

### 12.7 插件管理和设置

- 使用列表，不用大卡片堆叠。
- 插件 ID 用等宽字体。
- 权限和状态使用 badge + 详情。
- 设置界面高密度但不拥挤。

## 13. 可访问性

Tabora 的基础目标是满足 WCAG 2.2 AA 中与 Web app UI 直接相关的要求，并遵循 WAI-ARIA Authoring Practices 中的组件模式。

### 13.1 必须满足

- 所有可点击元素键盘可达。
- 所有可聚焦元素有清晰 focus-visible。
- 文本对比度：普通文本至少 4.5:1，大文本至少 3:1。
- 非文本 UI 边界和状态至少满足 3:1。
- 颜色不是唯一状态表达。
- 表单有 label 或 aria label。
- icon button 有 accessible name。
- modal / settings host 有焦点管理和 Escape 关闭策略。
- 拖拽排序必须提供非拖拽替代方式或后续键盘操作路径。
- respect `prefers-reduced-motion`。

### 13.2 Focus ring

建议：

```css
outline: 2px solid var(--tabora-color-focus);
outline-offset: 2px;
box-shadow: 0 0 0 4px color-mix(in srgb, var(--tabora-color-focus) 18%, transparent);
```

规则：

- focus ring 不能被 overflow 隐藏。
- focus ring 不能只出现在鼠标点击时。
- settings / modal 打开后，初始焦点进入容器内第一个合理控件。

## 14. 响应式规则

断点建议：

| Token                     | px   | 用途          |
| ------------------------- | ---- | ------------- |
| `--tabora-breakpoint-sm`  | 480  | 小屏手机      |
| `--tabora-breakpoint-md`  | 768  | 平板 / 大手机 |
| `--tabora-breakpoint-lg`  | 1024 | 桌面          |
| `--tabora-breakpoint-xl`  | 1280 | 宽桌面        |
| `--tabora-breakpoint-2xl` | 1536 | 超宽桌面      |

规则：

- 移动端主网格单列。
- 移动端不出现横向滚动。
- rail 折叠为底部工具条或顶部紧凑入口。
- settings host 移动端近全屏。
- 卡片内容在窄屏下优先保留核心信息，次要操作进入菜单。

## 15. 图标和插图

- 新 UI 图标优先使用 `lucide-solid`。
- 图标尺寸默认 16px 或 20px，rail 可用 20px。
- 不使用 emoji 作为功能图标。
- 天气等特殊图标后续使用统一图标资源或自定义 SVG，不混用文字符号。
- 不为工作台背景添加装饰性 orb、bokeh 或大面积 SVG 插画。
- 如果后续使用图片背景，必须保证卡片文本对比和可读性。

## 16. 实现约束

### 16.1 CSS 变量命名

命名建议：

```css
--tabora-color-page
--tabora-color-surface
--tabora-color-text
--tabora-color-line
--tabora-color-accent
--tabora-space-5
--tabora-radius-card
--tabora-shadow-floating
--tabora-duration-fast
```

组件 token：

```css
--tabora-button-bg
--tabora-button-text
--tabora-button-border
--tabora-input-bg
--tabora-card-bg
```

### 16.2 文件和包

建议后续实现：

```txt
packages/theme/src/
  tokens.ts
  applyThemeTokens.ts
  defaultLightTheme.ts
  defaultDarkTheme.ts

packages/ui/src/
  styles.css
  components/
    button.tsx
    input.tsx
    field.tsx
    ...
```

### 16.3 禁止项

- 组件内部硬编码具体业务文案。
- 插件跳过 `@tabora/ui` 重复实现基础按钮、输入、错误状态。
- 在 `@tabora/ui` 放宿主容器。
- 用全局 CSS 类名泄漏到插件外。
- 用 hover scale 改变布局。
- 用透明玻璃效果牺牲明亮主题边界。

## 17. 验收清单

### 17.1 视觉验收

- 页面第一屏是工作台，不是 landing page。
- 明亮主题不刺眼，暗色主题不纯黑。
- 卡片边界清晰，不依赖重阴影。
- 主网格卡片尺寸稳定。
- 卡片过多时纵向滚动，无横向滚动。
- 颜色不读成单一绿色主题。
- 无 emoji 功能图标。

### 17.2 组件验收

- `@tabora/ui` 组件使用 token。
- 组件没有默认 margin。
- hover、pressed、disabled、loading、focus-visible 状态完整。
- `IconButton` 有 aria label 或 tooltip。
- 表单项有 label / description / error 组合。
- loading 不改变按钮或列表行尺寸。

### 17.3 可访问性验收

- 关键路径可键盘完成。
- focus ring 可见且不被遮挡。
- 普通文本对比度至少 4.5:1。
- 非文本边界和状态至少 3:1。
- 颜色不是唯一状态表达。
- modal / settings host 焦点进入和返回正确。

### 17.4 文档和实现验收

- 修改 token 时同步本文档和 `@tabora/theme`。
- 新增基础组件时同步 `@tabora/ui` 文档或 Story 示例；当前仓库组件文档站入口为 `apps/storybook/`。
- 新增官方插件 UI 时优先复用 `@tabora/ui`。
- 若实际实现偏离本文档，需要先更新设计体系并说明原因。
- 文档整理后至少运行 `pnpm check`。

## 18. 版本演进

MVP：

- 建立默认 light / dark token。
- `@tabora/ui` 基础组件包已交付，包含 `Button` / `IconButton` / `Input` / `Textarea` / `Select` / `Checkbox` / `Switch` / `SegmentedControl` / `Tabs` / `Tooltip` / `Field` / `Badge` / `InlineError` / `Spinner` / `EmptyState` / `ListRow` / `CardSection` 17 个内容区控件，基于 `@kobalte/core` 提供 a11y 底层，使用 theme token 作为视觉契约。
- `apps/storybook` 作为 `@tabora/ui` 的示例与文档站已接入 workspace，用于承载组件变体、交互状态和组合示例。
- 官方插件已迁移到 `@tabora/ui`。
- 宿主容器按本文档统一 rail、search、grid、settings、modal 的视觉。

V1.1：

- 增加组件示例页或 Storybook / playground demo。
- 增加高对比主题。
- 增加导入 / 导出主题 token。
- 完善键盘拖拽或替代排序操作。

V1.5+：

- 第三方插件设计规范。
- 主题市场或主题包开发指南。
- 插件 UI 审核清单。

## 19. 参考资料

- Material Design 3 Design Tokens: https://m3.material.io/foundations/design-tokens/overview
- Material Design 3 Color Roles: https://m3.material.io/styles/color/roles
- Carbon Design System Color Tokens: https://carbondesignsystem.com/elements/color/tokens/
- Carbon Design System Spacing: https://carbondesignsystem.com/elements/spacing/overview/
- Carbon Design System Typography: https://carbondesignsystem.com/elements/typography/overview/
- Fluent 2 Color: https://fluent2.microsoft.design/color
- Fluent 2 Typography: https://fluent2.microsoft.design/typography
- Radix Themes Color: https://www.radix-ui.com/themes/docs/theme/color
- Radix Themes Radius: https://www.radix-ui.com/themes/docs/theme/radius
- Apple Human Interface Guidelines Widgets: https://developer.apple.com/design/human-interface-guidelines/widgets
- WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Open UI: https://open-ui.org/
