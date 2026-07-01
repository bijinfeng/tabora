# 技术方案：Widget 展开弹窗自定义 Footer

状态：草案待评审
日期：2026-06-29
范围：`@tabora/plugin-api`、`@tabora/workbench-app`、`@tabora/workbench-shell`、官方插件 `widget-quick-links`
关联事实源：`docs/technical/tabora-plugin-workbench-technical-design-v2.md` §7 卡片展开子系统

## 1. 背景与问题

当前 widget 双击/右键「展开」时，宿主统一渲染 `WorkbenchExpandOverlay`，结构固定为三段：

```
expand-shell
  expand-header   宿主：图标 + 标题 + 关闭按钮
  expand-body     插件：渲染注册的 expand view
  expand-footer   宿主写死：instanceId（左） + Esc 提示（右）
```

快捷入口插件需要在弹窗底部放「管理分组 / 添加入口」操作按钮，并随面板切换文案。由于插件只能渲染 `expand-body`，目前的做法是在 body 内部自己画一条 footer 条，结果是：

- 插件 footer 与宿主 `expand-footer`（`quick-links-1 · Esc 关闭…`）上下堆叠，出现「双 footer」。
- 两条 footer 背景、border、padding 不一致，视觉割裂。
- 插件 footer 不在弹窗的真实底部贴边区域，滚动时行为不统一。

根因：expand 容器没有给插件提供「向宿主 footer 注入内容」的协议。

## 2. 目标与非目标

### 目标

- expand 容器支持插件注入自定义 footer 内容，渲染进宿主统一的 `expand-footer` 区域。
- 保留宿主默认 footer（instanceId + Esc 提示）作为未注入时的回退。
- 快捷入口插件通过该机制把操作按钮放进外层弹窗 footer，删除 body 内自绘 footer，消除双 footer。
- 错误隔离：插件 footer 渲染失败不能让整个 expand 白屏。
- 同步更新技术方案 V2 §7（其中 `ExpandViewProps` 草案与实际 `WidgetViewProps` 不一致，一并纠正）。

### 非目标

- 不改 modal / fullscreen 两条独立通道。
- 不改 settings panel host。
- 不引入通用「slot/region 视图槽」框架，只针对 expand footer 这一个明确需求。
- 不做 footer 的拖拽、多区域分栏等扩展。

## 3. 设计约束（来自现状调研）

1. `@tabora/plugin-api` **不依赖 solid-js**，视图渲染一律用泛型 `TRendered`（见 `layout.ts` 的 `RegionSlot<TRendered>` / `LayoutViewProps<TRendered>`）。footer 注入的协议层类型不能出现 `JSX.Element`。
2. 视图通过 `views: { card, expand?, settings? }` 注册 view id 字符串，宿主用 `registry.views` 解析为组件。footer 应沿用「view id → 组件」这一既有同构模式，而不是让插件把组件实例塞进 props。
3. `ExpandState`（`WorkbenchShellChrome.types.ts`）与 `WorkbenchExpandState`（`WorkbenchShellInteractions.ts`）是字段相同的重复定义，任何 expand state 结构变更要同步两处。
4. 现有 footer 文案走 i18n key `chrome.expand.footerHint`，回退逻辑要保留。
5. 设计稿 `docs/design/卡片展开弹窗原型.html` 的 `.expand-footer` 是 `justify-content: flex-end`，右对齐放操作/提示；自定义 footer 需要兼容这一布局。

## 4. 方案选型

围绕「插件如何把 footer 内容交给宿主」，比较三种方案。

### 方案 A：新增 footer view（`views.expandFooter`）——推荐

在 widget contribution 的 `views` 上新增可选 key `expandFooter`，与 `expand` 同构注册一个独立组件。expand 打开时，宿主除了解析 body view，再解析 footer view；`WorkbenchExpandOverlay` 在 `expand-footer` 区域渲染该 footer view（用 `PluginViewBoundary` 包裹），footer view 拿到的 props 与 body view 同为 `WidgetViewProps`，从而共享 host 能力（`showToast`、`openExternal`、`data` 等）。

优点：

- 完全复用既有「view id → 组件 + registry 解析 + PluginViewBoundary 隔离」链路，与 `card/expand/settings` 一致，认知成本低。
- 协议层零 solid 依赖（只多一个字符串字段）。
- footer 与 body 各自独立的错误边界，footer 崩溃不拖垮 body。

代价：

- footer view 与 body view 是两个组件，需要共享状态（如快捷入口的「当前面板 / 校验错误」）。靠共享 `props.data`（持久层）不够实时。解决见 §5.3「跨视图状态」。

### 方案 B：在 `WidgetViewProps.host` 增加 `setExpandFooter(render)` 命令式 API

body view 在运行时调用 `host.setExpandFooter(() => <内容/>)`，宿主把回调存进 expand state 并渲染。

优点：footer 与 body 天然同一组件、状态共享零成本。

缺点：

- `render` 是 `() => JSX.Element`，协议层会被迫感知 UI 框架，违反约束 1。即便用泛型 `TRendered` 包装，host API 也变成命令式副作用，和现有声明式 `views` 注册风格不一致。
- 生命周期复杂：footer 回调何时失效、body 卸载时怎么清理，都要额外管理。

### 方案 C：expand state 携带 footer 描述符（结构化数据）

插件通过某种方式声明一组结构化按钮（label、variant、actionId），宿主按描述渲染标准按钮。

优点：协议层纯数据，无 UI 依赖。

缺点：

- 快捷入口 footer 文案随面板切换、还有 InlineError 等富内容，纯结构化描述难以覆盖，未来每加一种 footer 形态都要扩协议。表达力不足。

### 结论

采用**方案 A**。它最符合现有架构同构性与「插件只渲染内容、宿主提供容器」的边界，协议改动最小（一个可选字符串字段），错误隔离天然。跨视图状态问题用 §5.3 的方案解决。

## 5. 详细设计（方案 A）

### 5.1 协议层（`@tabora/plugin-api`）

`manifest.ts` 的 `WidgetContribution.views` 增加可选字段：

```ts
views: {
  card: string
  expand?: string
  expandFooter?: string   // 新增：展开弹窗 footer 视图 id
  settings?: string
}
```

`manifestSchema.ts` 同步在 views schema 增加 `expandFooter: z.string().optional()`。

约束：`expandFooter` 仅在声明了 `expand` 时有意义；若只有 `expandFooter` 没有 `expand`，按「无 footer」处理（宿主回退默认 footer），不报错——保持与现有「能力声明不强校验组合」的风格一致。

footer view 复用现有 `WidgetViewProps`，不新增 props 类型。

### 5.2 Expand state 与解析（`@tabora/workbench-app`）

1. 先收敛重复类型：把 `ExpandState`（chrome.types）与 `WorkbenchExpandState`（interactions）统一为一个来源。建议 `WorkbenchShellChrome.types.ts` re-export interactions 的 `WorkbenchExpandState`，或反之，避免两份字段各自演进。本方案在该单一类型上新增可选字段：

```ts
type WorkbenchExpandState = {
  instanceId: string
  title: string
  viewId: string
  footerViewId?: string // 新增
  mode: "expand" | "settings"
  props: WidgetViewProps
}
```

2. `resolveWorkbenchExpandView`（`WorkbenchShellInteractions.ts`）旁边新增/扩展解析逻辑：解析 `widget.views.expandFooter` 且 `hasView(footerViewId)` 为真时，写入 `footerViewId`。`buildWorkbenchWidgetExpandState` 把它放进 expand state。

3. `mode: "settings"` 默认不注入 footer view（实例设置场景维持默认 footer），保持影响面最小。

### 5.3 跨视图状态（关键点）

快捷入口 footer 的按钮文案依赖「当前面板（links/groups/entry）」，body 切换面板时 footer 要同步。两个独立组件如何共享这个瞬时 UI 状态？

采用「每个 expand 实例一个轻量共享 store」：

- body view 与 footer view 渲染时同属一个 expand 会话，宿主在构造 expand state 时为该会话创建一个 scoped 的 solid store/signal 容器，并通过 props 注入给两个 view。
- 但注入点不能污染 `@tabora/plugin-api` 的 `WidgetViewProps`（不能加 solid 类型）。因此共享 store 由**插件自身**在 expand 内部建立：把 `QuickLinksExpand`（body）与 `QuickLinksExpandFooter`（footer）都设计成从同一个插件内部模块拿一个「按 instanceId 建立的会话 store」。

具体落地（插件侧，不进协议）：

- 在 `widget-quick-links` 内新增 `expand-session.ts`：`getExpandSession(instanceId)` 返回该实例的 solid store（含 `panel`、`urlError`、`links`、`groups` 等信号与操作方法），用 `Map<instanceId, session>` 缓存，expand 关闭时清理。
- `QuickLinksExpand`（body）和 `QuickLinksExpandFooter`（footer）都调用 `getExpandSession(props.instanceId)`，于是共享同一份响应式状态。数据持久化仍走 `props.data`。

这样协议保持纯净，跨视图状态在插件内部解决；其它插件若只需要静态 footer，footer view 可以完全无状态。

### 5.4 容器渲染（`@tabora/workbench-app` + `@tabora/workbench-shell`）

`WorkbenchExpandOverlay` 的 footer 段改为：

```tsx
<div class="expand-footer">
  <Show
    when={footerView()}
    fallback={
      <>
        <span class="expand-footer-meta">{expand().instanceId}</span>
        <span class="expand-close-hint">{footerHintCopy}</span>
      </>
    }
  >
    {(View) => (
      <PluginViewBoundary instanceId={expand().instanceId} title={expand().title} ...>
        <div class="expand-footer-plugin" data-tabora-plugin-id={expand().props.pluginId}>
          {View()(expand().props)}
        </div>
      </PluginViewBoundary>
    )}
  </Show>
</div>
```

- `footerView()` 来自 `getView(expand().footerViewId)`，仅当 `footerViewId` 存在且能解析到组件时才走自定义分支。
- footer view 自身崩溃 → `PluginViewBoundary` 局部兜底，body 不受影响。
- `WorkbenchShellSurfaceOverlayProps.tsx` 给 overlay 多传一个 `getFooterView`（或复用同一个 `getView`，直接在 overlay 内用 `expand().footerViewId` 解析）。倾向后者：overlay 已有 `getView`，footer 复用即可，少加一个 prop。

CSS（`expand.css`）：

- `.expand-footer` 保持现有 flex 两端对齐与背景；新增 `.expand-footer:has(.expand-footer-plugin)` 或给容器加修饰类，使注入态下 footer 改为右对齐（贴合设计稿 `flex-end`）并允许插件内容自行布局。
- 插件 footer 的具体按钮样式仍由插件 `data-tabora-plugin-id` scoped 样式提供，宿主只给定位容器。

### 5.5 快捷入口插件改造（`widget-quick-links`）

- 新增 `quick-links-expand-footer.tsx`：渲染「管理分组/完成/取消」+「添加入口/保存入口」按钮和 hint/InlineError，状态读自会话 store。
- 新增 `expand-session.ts`：见 §5.3。
- `quick-links-expand.tsx`（body）删除自绘 `.ql-expand-footer`，改用会话 store；只保留可滚动内容区（main + side）。
- `index.ts` manifest 增加 `views.expandFooter: "official.widgets.quick-links.expand-footer"`，并 `registry.views.register` 注册 footer 组件。
- `styles.css` 调整：body 不再需要贴底 footer 布局；新增 footer 按钮在 `.expand-footer` 容器内的样式。

## 6. 影响面与风险

| 区域                               | 改动                          | 风险                                   |
| ---------------------------------- | ----------------------------- | -------------------------------------- |
| `plugin-api` manifest/schema       | 加可选字段                    | 低；纯增量，旧 manifest 不受影响       |
| expand state 双类型收敛            | 合并/re-export                | 中；多处引用，靠类型检查与现有测试兜底 |
| `WorkbenchExpandOverlay` footer 段 | 条件渲染 + 边界               | 中；有快照/文案测试，需更新断言        |
| `expand.css`                       | footer 注入态样式             | 低                                     |
| 快捷入口插件                       | 新增 footer view + 会话 store | 中；新增跨视图状态，需测试             |

主要风险点：

1. **expand state 类型收敛**可能触及较多引用点，必须先跑 `pnpm check` 的 type check 全绿再继续。
2. **会话 store 生命周期**：expand 关闭/实例移除时若不清理，`Map` 泄漏。需在 `closeExpand` 或 footer/body 的 `onCleanup` 里清理对应 instanceId。
3. **既有测试**：`WorkbenchShellSurfaceHost.test.tsx` 断言了默认 footer 文案（`Esc to close`）。改造后无 footer view 的 widget 仍走默认分支，断言应继续通过；需新增「有 footer view 时渲染插件 footer」用例。

## 7. 测试计划

- 单元（workbench-app）：
  - `buildWorkbenchWidgetExpandState` 在 widget 声明 `expandFooter` 且已注册时，expand state 带 `footerViewId`；未声明或未注册时为空。
  - overlay：有 `footerViewId` 渲染插件 footer 容器、无则渲染默认 meta + hint。
  - footer view 抛错时 `PluginViewBoundary` 兜底，body 仍在。
- 单元（widget-quick-links）：
  - footer view 按 session.panel 显示正确按钮文案。
  - body 切到 groups/entry → footer 文案同步（共享 session）。
  - 保存入口校验错误时 footer 显示 InlineError。
- 视图核查：playground 实机双击打开，确认单一 footer、按钮在外层弹窗底部、滚动时 footer 贴底、面板切换文案同步、无 console error。
- 命令：`pnpm test` + `pnpm check`；跨包改动追加 `pnpm build`。

## 8. 文档同步

实现前/中需要同步：

- `docs/technical/tabora-plugin-workbench-technical-design-v2.md` §7：
  - 用实际 `WidgetViewProps` 纠正 §7.1 过时的 `ExpandViewProps` 草案。
  - §7.2 容器结构补充「ExpandFooter 支持插件注入（`views.expandFooter`），未注入时回退元信息 + esc 提示」。
  - §12.1 Widget 协议补充 `views.expandFooter` 字段说明。
- `docs/product/tabora-official-plugins-design.md`：快捷入口章节说明 footer 通过 `expandFooter` view 注入外层弹窗。
- `DESIGN.md` / `docs/product/tabora-design-system.md`：如 footer 注入态视觉规则需要成文，补一条 expand footer 规范。
- 不新增需在 `docs/README.md` 登记的独立文档；本方案文件本身在 `docs/technical/` 下，评审通过后视情况保留或并入 V2。

## 9. 待确认问题

1. 字段命名：`views.expandFooter` 是否合适？备选 `expandActions`。
2. footer 是否也要对 `mode: "settings"` 开放？本方案默认不开放。
3. 跨视图状态用「插件内部会话 store」是否接受？还是希望宿主提供更正式的 expand-scoped 上下文（更大改动）？
4. 是否要求 footer view 必须声明 `expand` 才生效（本方案：是）。
