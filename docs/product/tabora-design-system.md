# Tabora 设计实现映射（V2 桥接）

版本：V2.0

日期：2026-06-02

状态：作为 `DESIGN.md` 到当前仓库实现的桥接文档；不再重复维护完整视觉规范正文

关联文档：

- 设计事实源：`DESIGN.md`
- 工作台原型参考：`docs/design/03-工作台交互原型.html`
- 产品 PRD：`docs/product/tabora-plugin-workbench-prd.md`
- 官方插件设计：`docs/product/tabora-official-plugins-design.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 文档地图：`docs/README.md`

## 1. 文档职责

自 2026-06-04 起，Tabora 的视觉、组件和交互事实源收敛到根目录 `DESIGN.md`：

- `DESIGN.md`：视觉语言、token、基础组件语义、宿主容器视觉、交互模式和可访问性规则。
- `docs/design/03-工作台交互原型.html`：双布局、命令搜索、拖拽、展开、右键菜单、设置导航、Toast、快捷键等可交互原型参考，不再承载规范事实。

本文件不再复刻上述内容，而是回答三个实现问题：

1. 这些设计事实应落到仓库中的哪些包和目录。
2. 当实现与设计有偏差时，应该更新哪些文档或预览资产。
3. 设计变更时，哪些实现资产必须同步检查。

## 2. 事实源优先级

出现冲突时，按以下优先级判定：

1. `DESIGN.md`
   用于视觉语言、token、基础组件语义、宿主容器视觉、交互模式和可访问性规则。
2. 本文件
   只用于说明仓库中的实现映射、同步清单和历史文件定位。
3. `docs/design/03-工作台交互原型.html`、`docs/design/04-官网预览.html`、`docs/design/05-官网下载.html`
   只作为可视原型或静态预览参考。

如果本文件或可视原型资产与 `DESIGN.md` 冲突，以 `DESIGN.md` 为准，并应立即回写对应文档或原型。

## 3. 设计到实现映射

| 设计事实                          | 仓库落点                                                                              | 说明                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Refined Sage 语义 token           | `packages/theme/`                                                                     | `@tabora/theme` 负责把主题贡献应用为 CSS custom properties，不在插件里硬编码大面积颜色。                   |
| 应用品牌图标与 favicon / 扩展图标 | `packages/brand/` + `apps/site/vite.config.ts` + `apps/extension/wxt.config.ts`       | `@tabora/brand` 保存唯一 SVG 图标源；站点 favicon 由 Vite 注入，扩展图标由 `auto-icons` 从同一源自动生成。 |
| 基础组件 API 与状态               | `packages/ui/` + `apps/storybook/`                                                    | `@tabora/ui` 提供插件内容区基础组件；Storybook 负责运行中示例与文档对照。                                  |
| Dashboard / Stream 双布局宿主结构 | `plugins/layout-dashboard/` + `plugins/layout-stream/` + `packages/workbench-shell/`  | 布局壳体由 layout 插件贡献；卡片壳、设置宿主、展开层等通用宿主容器在 shell。                               |
| 命令搜索、`@provider`、键盘导航   | `packages/official-plugins/` + `packages/platform-kernel/` + `packages/orchestrator/` | 搜索 UI 走插件协议；全局快捷键、搜索路由和建议编排走平台/编排层。                                          |
| 拖拽、双击展开、右键菜单          | shell + orchestrator + official widgets                                               | 交互触发与宿主容器由平台负责，插件只声明支持能力并渲染内容。                                               |
| 设置中心左侧导航 + 右侧内容区     | shell settings host + `settings-panel` contributions                                  | 设置容器、焦点管理、错误边界由宿主提供。                                                                   |
| Toast 堆叠与快捷键面板            | shell / runtime context                                                               | 插件不直接挂全局通知系统或快捷键浮层。                                                                     |
| Widget 卡片稳定性和滚动策略       | layout 插件的 `.workbench-grid` + `workbench-shell` 的 `WidgetCardShell`              | layout 插件提供网格容器；`WidgetCardShell` 按实例尺寸设置 grid span，交互不改变外部尺寸。                  |

## 4. 当前实现必须遵守的 V2 规则

以下规则来自 `DESIGN.md`，在代码实现中不得被“临时样式”或“局部特例”绕过：

### 4.1 视觉与 Token

- 明亮 / 暗色主题都以 Refined Sage 色板和语义 token 为准。
- 主文本、次级文本、表面、边框、强调色必须走 theme token。
- 组件和插件默认只消费 semantic / component token，不直接消费原始色值。
- hover、focus、active、selected、loading 只改变颜色、边框、阴影和内容反馈，不改变外部尺寸。

### 4.2 宿主容器

- 仪表盘式布局：`rail + 常驻搜索 + 主网格`。
- 流式布局：`⌘K 命令面板 + 双列流式内容区 + 更轻的工具入口`。
- 设置中心：左侧分类导航，右侧内容区，支持焦点管理和局部错误隔离。
- 展开视图、Dialog、Drawer、Toast、快捷键面板都属于宿主容器，不放入 `@tabora/ui`。

### 4.3 交互模式

- 命令搜索支持实时建议、分组结果、方向键导航、`Enter` 执行、`Esc` 关闭。
- 搜索源切换支持 `@provider` 语法和可见提示。
- Widget 支持拖拽排序；如果提供拖拽，必须有键盘替代方式。
- Widget 支持双击展开；支持右键上下文菜单访问尺寸、展开、移除等动作。
- 关键操作通过 Toast 提供非阻塞反馈。
- 快捷键需要可发现，至少应有参考入口或提示面板。

### 4.4 组件边界

- `@tabora/ui` 只承载插件内容区基础组件，不承载 `WidgetCardShell`、`Modal`、`FullscreenHost`、`SettingsHost`、`WorkbenchRail`、`WorkbenchGrid` 等宿主级容器。
- 官方插件内容区优先复用 `@tabora/ui` 组件，不在各插件中重复实现按钮、输入、选择器、字段包装、错误状态等基础控件。
- Storybook 中的组件示例、状态和组合模式应能追溯到 `DESIGN.md`。

## 5. 设计变更时的同步清单

### 5.1 改 `DESIGN.md` 的视觉 token、形状、动效或响应式规则

同时检查：

- `packages/theme/` 的 token 命名和映射。
- 宿主容器样式、全局 CSS 变量、主题切换逻辑。
- `docs/product/tabora-official-plugins-design.md` 中的视觉摘要是否仍正确。

### 5.2 改 `DESIGN.md` 的组件语义或组件 catalog

同时检查：

- `packages/ui/` 组件实现与导出。
- `apps/storybook/` 中的 stories、状态示例和可访问性说明。
- 官方插件内容区是否仍有重复实现或违反组件语义的 UI。

### 5.3 改 `DESIGN.md` 的交互模式或宿主容器规则

同时检查：

- PRD 的功能需求与验收标准。
- 官方插件设计中的交互示例。
- 技术方案 V2 中的 orchestrator、runtime context 和宿主渲染描述。
- shell / playground 中的搜索、布局切换、设置、Toast、快捷键、展开、右键、拖拽实现。
- `docs/design/03-工作台交互原型.html` 是否仍能作为当前交互参考。

## 6. 视觉验收速查

提交 UI 相关改动前，至少确认：

- 第一屏是可用工作台，不是 landing page。
- 默认布局仍是仪表盘式；流式布局仍可切换并保留卡片数据。
- 移动端无横向滚动。
- 卡片 hover / focus / 拖拽时无布局跳动。
- 命令搜索、设置、添加卡片、插件管理在所有布局下可达。
- 设置中心仍是左侧导航 + 右侧内容区。
- Toast、快捷键提示、展开视图和右键菜单与原型行为一致。

## 7. 历史文件定位

- `docs/design/03-工作台交互原型.html`、`docs/design/04-官网预览.html`、`docs/design/05-官网下载.html`
  这些文件只作为可视原型或静态预览资产，不再作为当前设计事实源。
- 旧版设计体系与组件规范大文档已由 `DESIGN.md` 接管职责，避免双写双维护。

## 8. 维护原则

- 不要把 `DESIGN.md` 的完整规范再拷贝到其他文档中。
- 需要重复时，只保留摘要、实现映射和同步动作。
- 如果实现故意偏离原型或组件规范，必须同时更新 PRD / 官方插件设计 / 技术方案中的对应说明，并在变更说明中明确原因。
