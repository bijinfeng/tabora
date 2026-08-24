## 复杂插件架构治理：收敛「布局即插件」

核心诊断（代码实证）：架构分层本身是干净的，真正的复杂度来自 **layout 被做成插件类型** —— 为此背了一整套 region 协议、切换引擎、快照、实例迁移、多 layout contribution，而实际只服务「一个 dashboard + 一个移动变体」。region 协议在实践中退化成「一个 search 槽 + 一个 widget 网格」。这就是让"加个功能要走 manifest+contribution+region 映射+快照"显得繁重的根源。

分两阶段，Phase 1 无论如何都该做，Phase 2 需要你确认接受产品哲学反转。

---

### Phase 1：砍掉 layout 系统里未落地/矛盾的部分（低风险，不反转哲学）

此阶段后 layout 仍是插件，但只剩 dashboard + mobile 两个真实项，切换逻辑大幅变薄。

1. **移除 focus 布局**：删 `plugins/official/layout-dashboard/src/manifest.ts` 的 `official.layout.workbench-focus` 定义及其 view；删 ⌘L 二态切换（`shellConfig.ts:31-36 resolveWorkbenchLayoutToggleTarget`、`WorkbenchShellLayoutHost.ts` 的 `layout-switch` action、`WorkbenchShellCommands.ts` 的 `toggleLayout`）。PRD 本就写"移除 Focus（不在 MVP）"，代码与 PRD 就此对齐。
2. **移除 community masonry 的默认接线**：`builtin-plugin-registry` 不再追加 `layout-diy-masonry`（保留包作为独立示例，不进默认装配）。
3. **删快照只写不读链路**：`layout-switcher.ts` 的 `snapshot` 字段、`WorkbenchShellWorkspaceController.ts:179 saveSnapshot`、`WorkbenchShellLayoutState.ts` 的持久化调用；`storage` 的 `workspaceSnapshotRepository` + schema `workspaceSnapshots` 表、`host-adapters` 导出、`bootstrap.ts` 接线、fnos `localStorageAdapter` 的 `getLast`。连带清理 6 个相关测试文件里只测快照的用例。
4. **删 `unplaced` 死分支**：`layout-switcher.ts:8-9,66-72` 和 `shellController.ts:10,56`。注意：PRD 第 2 节要求"无法匹配区域的实例进入待放置态"，当前实现是写进 regions 但从不渲染=静默丢失。删除会让"切到无兼容区域布局时实例丢失"这个行为更显式；Phase 2 会用单布局根除这个场景。

产出：净删除约 400-600 行 + 对应测试。settings 面板的"默认布局"选择器在此阶段保留（只剩 dashboard 一项时它会退化，Phase 2 移除）。

---

### Phase 2：把 layout 从插件类型降级为宿主内建（结构性，反转产品哲学）

> ⚠️ 这一步删除 PRD 的核心哲学"一切皆插件，包括布局"，并从 `@tabora/plugin-api` 移除 `LayoutContribution` / `RegionContentKind` / `RegionSlot` 公共协议。widget / search / theme / background 仍是插件，只有 layout 不再是。

1. **dashboard 成为内建宿主布局**：把 dashboard 的 rail + 网格渲染从 layout 插件迁到 `workbench-shell`/`workbench-app` 的宿主层，直接渲染「search 槽 + widget 网格」，不再经 region 协议动态映射。
2. **mobile 变体降为响应式断点**：把 `layout-mobile`（921 行）的移动 UI 折叠进同一内建布局的 breakpoint，删除"窄屏自动切 layout 插件"的 `WorkbenchShellLayoutRuntime` 逻辑。
3. **删除编排/引擎残余**：`orchestrator/src/layout-switcher.ts` 整个删除；`workbench-app/src/layout/` 从 6 个实现文件收缩到「渲染 + 错误边界」，删除 LayoutState 的切换态、LayoutHost 的切换 action。
4. **收缩 plugin-api**：移除 layout/region 协议类型；`plugin-catalog` 的 `listLayouts/findLayoutContribution` 删除。
5. **settings**：移除"默认布局"选择器。
6. **文档同步（产品口径）**：改写 `PRD` 第 1、2 节核心哲学与「布局插件」章节、`技术方案 V2` §1-3 的多布局架构、`官方插件设计`、`DESIGN.md` 中相关表述，改为"layout 是宿主内建，其余能力仍插件化"。

产出：净删除约 1500-2500 行（含 mobile 重写为断点），触及 plugin-api 公共协议，反转产品哲学。

---

### 验证

每阶段结束按 `regression-baseline`：跨包+协议变更跑 `node scripts/regression-summary.mjs` → `pnpm test`、`pnpm check`、`pnpm build`；前端交互变更启动 playground/extension 用浏览器验证 dashboard 与移动端关键路径；`git diff --check`。失败/未覆盖项分开如实报告。

### 我的建议

先做 Phase 1（清掉矛盾与死机制，纯收益、不反转哲学），验证通过后再决定是否推进 Phase 2。Phase 2 才是真正的"去平台化"，它换来简单度、但放弃第三方布局扩展性和"布局即插件"的产品卖点 —— 这个取舍由你拍板。
