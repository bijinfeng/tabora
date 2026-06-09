# Tabora 架构优化建议

版本：V1.0

日期：2026-06-09

状态：当前架构审查建议事实源；用于 `docs/README.md` 中“架构优化建议”入口。

关联文档：

- 文档地图：`docs/README.md`
- 技术方案：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归基准：`docs/technical/tabora-regression-baseline.md`

## 1. 本轮已收口项

### 1.1 文档入口恢复

`docs/README.md` 已把本文档登记为架构审查入口。本文档补齐后，架构 review 不再指向缺失路径。

### 1.2 编排层依赖收紧

`@tabora/orchestrator` 保持纯模型和编排职责，不再承接 JSX 布局渲染桥，也不依赖 `@tabora/storage` 或 `solid-js`。布局 view 渲染所需的 `createLayoutEngine` 已归入 `@tabora/workbench-app`，由 shell runtime 负责把 `PluginCatalog`、实例 renderer 和 `LayoutHostAPI` 组装成 Solid 可渲染的 `RegionSlot`。

### 1.3 协议层 renderer 解耦

`@tabora/plugin-api` 的 `RegionSlot` / `LayoutViewProps` 改为泛型渲染结果契约。协议层不再直接 import Solid JSX；Solid layout 插件和 workbench shell 在使用点显式声明 `LayoutViewProps<JSX.Element>`。

### 1.4 Widget geometry 单一事实源

`WidgetSize -> grid span` 映射已收敛到 `@tabora/plugin-api` 的 `widgetGeometry`。`@tabora/workbench-app` 的网格持久化、`@tabora/workbench-shell` 的卡片壳 CSS 变量、`@tabora/orchestrator` 的拖拽排序计划都从同一 helper 读取，避免视觉布局、排序模型和持久化状态漂移。

### 1.5 Shell app 生产依赖收紧

playground / extension 的生产依赖只保留真实宿主入口需要的 host composition 包、`@tabora/ui` / `@tabora/workbench-shell` 样式包和 Solid。官方插件、layout package、core runtime package 统一通过 `@tabora/builtin-plugin-registry` 与 `@tabora/workbench-app` 间接进入 shell。

### 1.6 自动化守卫补齐

`pnpm check:architecture` 新增守卫：

- shell app 生产依赖不能直接声明官方插件、layout package、插件 package 或 core runtime package。
- `@tabora/orchestrator` 不能依赖 `@tabora/storage` 或 `solid-js`。

## 2. 后续建议

### 2.1 继续收薄 `WorkbenchShellApp`

当前 `WorkbenchShellApp` 已是组合根，但仍集中创建 signal cluster、workspace controller、host runtime、controller runtime、layout runtime 和 surface props。建议后续按生命周期拆成更小的 composition unit：

- runtime / kernel wiring
- workspace session state
- shell interaction state
- surface props composer

拆分时应保持现有 helper API 和测试覆盖，不做无行为收益的大重构。

### 2.2 统一搜索 surface 的受控状态

inline search 已走宿主注入状态机；`CommandPalette` 仍维护本地 query / active index。建议后续把 command palette 改为受控 surface，复用 `SearchViewProps` 或同源 search surface model，降低 inline / palette 行为分叉风险。

### 2.3 保持协议层无 UI runtime 依赖

新增扩展点 contract 时，优先使用泛型、结构化数据和 host callback contract。只有具体 renderer 包或 shell 包可以绑定 Solid / JSX / DOM 类型。

## 3. 验证入口

本类架构治理变更至少运行：

```bash
pnpm check:architecture
pnpm test
pnpm check
pnpm build
```

如果触碰 layout / shell 渲染路径，还应追加 workbench-app、layout package 的定向测试；前端交互变更追加 playground 浏览器检查。
