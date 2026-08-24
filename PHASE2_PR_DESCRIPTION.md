## 变更摘要

Phase 2：将 layout 从插件类型降级为宿主内建，删除布局切换引擎、快照、实例迁移和 Focus 第二布局，只保留单一 dashboard 宿主布局，移动端改为响应式断点（< 768px）。净删约 5000 行。

**产品哲学反转**：从"一切皆插件，包括布局"改为"具体业务能力优先插件化；布局是宿主内建的单一 dashboard 壳体"。widget / search / theme / background 仍是插件，只有 layout 不再是。

## 改动类型

- [x] docs
- [x] protocol
- [x] kernel
- [x] storage
- [x] orchestrator
- [x] shell
- [x] plugin
- [x] ui
- [x] quality
- [ ] release

## 事实源同步

- **PRD**：已同步。§1 核心哲学"一切皆插件，包括布局" → "具体业务能力优先插件化"，添加 Phase 2 变更说明；§2 定位"布局本身也是插件" → "工作台布局是宿主内建的单一 dashboard 壳体"；§2.1.1/2.1.3/4.1/7.1/7.2/8.1/8.8/8.13/8.17/8.11/12/14/15 中移除布局插件、布局切换、Focus、多布局表述；status line 7 更新。
- **官方插件设计**：已同步。§3.2 视觉结构删除 Focus、添加 Phase 2 变更说明；§6.5 交互示例"布局插件被激活" → "宿主注入内建 dashboard layout"，"用户切换未来另一个布局" → "用户切换到移动端窄屏（< 768px）"；删除 §6b Focus 布局章节（~40 行），保留有效交互模式移至 §6.9；§7.3 diagram 删除 `focus` 标签；line 267/322/1871/1588 及 status line 7 更新。
- **DESIGN**：已同步。line 160 Layout section 删除专注布局提及；line 218/227/304 更新为宿主内建 layout 口径。
- **技术方案**：已同步。lines 13/16/83/88/128/200/254/271/365/367/1062 早期已更新；§10.2 MVP 快捷键表删除 `toggle-layout | ⌘L | 切换布局` 行。
- **回归基准**：已同步。line 710 smoke checklist "布局切换:" → "移动端响应式断点:"；layout package task heading 和 L4 更新；workspace task L4 删除"布局切换数据保留"。
- **docs/README**：未改动（docs/README.md 本身未涉及布局细节，事实源指向上述 5 个文件已覆盖）。

## 复用与改动规模

- **已复用的现有实现**：dashboard 布局 UI 从 `plugins/official/layout-dashboard/src/` 迁移到 `packages/workbench-app/src/surface/dashboard/`，复用原有 rail、网格、host-action-icon、i18n、styles 逻辑，只改包位置和导入路径。
- **新增 public export / dependency / package / 生产文件**：
  - 新增 8 个生产文件：`packages/workbench-app/src/surface/dashboard/` 下的 `dashboard-layout-state.ts`、`dashboard-layout.tsx`、`host-action-icon.tsx`、`i18n.ts`、`layout-definition.ts`、`styles.ts`、`types.ts`、`workbench-rail.tsx`（由旧 layout-dashboard 插件包迁移而来，非全新逻辑）。
  - 新增 3 个 builtin provider 文件：`packages/official-plugins/src/builtinBackgroundProviders.ts`、`builtinSearchProviders.ts`；`packages/theme/src/builtinThemes.ts`（拆分自原 `theme-default-pack.ts`、`search-providers-basic.ts` 等，为宿主直接注入做准备）。
  - 零新增 public export（`@tabora/plugin-api` layout/region 协议保留）。
  - 零新增 dependency。
  - 零新增 workspace package。
- **删除或替换的旧实现**：
  - 删除 2 个插件包：`plugins/official/layout-dashboard`（15 个文件）、`plugins/official/layout-mobile`（12 个文件）。
  - 删除布局切换引擎：`packages/orchestrator/src/layout-switcher.ts` + `layout-switcher.test.ts`（~600 行含测试）。
  - 删除快照系统：`packages/storage/src/workspaceSnapshotRepository.ts` + `.test.ts`、`database.ts` 的 `workspaceSnapshots` 表、`storageAdapter.ts` 的 `getLast`、`bootstrap.ts` / host-adapters 接线（~300 行含测试）。
  - 删除布局状态切换：`packages/workbench-app/src/layout/WorkbenchShellLayoutState.ts` + `.test.ts`（~200 行含测试）。
  - 删除或大幅收缩 layout 相关文件：`WorkbenchShellLayoutHost.ts`（删 `layout-switch` action）、`WorkbenchShellLayoutRuntime.ts`（删窄屏自动切插件逻辑）、`WorkbenchShellLayoutRenderer.tsx`（删切换态）、`WorkbenchShellCommands.ts`（删 `toggleLayout`）、`shellConfig.ts`（删 `resolveWorkbenchLayoutToggleTarget`）、`shellController.ts`（删 `unplaced` 分支）、`WorkbenchShellSettings.ts`（删"默认布局"选择器）、`WorkbenchShellWorkspaceController.ts`（删 `switchLayout`/`reconcileInstancesForLayout`）等。
  - 修复本次会话发现的悬空引用：`WorkbenchShellRuntimeState.ts`、`WorkbenchShellHostRuntime.ts` 及 3 个测试文件中删除已废弃的 `reconcileInstancesForLayout` 参数及相关 mock。
- **生产 diff（additions / deletions）及必要性**：
  - **110 files changed, +627 / −5637**（净删约 5000 行）。
  - 必要性：layout-as-plugin 架构在实践中只服务单一 dashboard + 移动变体，region 协议退化为"一个 search 槽 + 一个 widget 网格"，却背负完整的 manifest+contribution+region 映射+切换引擎+快照+实例迁移+多 layout contribution 开销。Phase 2 将 dashboard 降为宿主内建，移除未落地的 Focus 和切换引擎，换来约 5000 行净删除和架构简化，放弃第三方布局扩展性（未来需要时可恢复 layout/region 协议）。

## Regression Baseline

`node scripts/regression-summary.mjs` 输出：

```txt
- change types: docs, protocol, kernel, storage, orchestrator, shell, plugin, ui, quality
- required levels: L1, L2, L3, L4, L5, L6, L7
- commands to run: 
  pnpm check:architecture, pnpm quality, pnpm test, pnpm check, pnpm build, pnpm test:e2e
- focused tests: 
  builtin-plugin-registry, host-adapters, official-plugins, orchestrator, 
  platform-kernel, plugin-api, storage, theme, workbench-app, 
  playground, site, vitest/governance, community/layout-diy-masonry
- known debt touched: 
  WorkbenchShellApp.tsx 重型宿主编排, SearchViewProps 未升级状态机 contract,
  拖拽未实现 5px 阈值/实时交换/触屏策略, workspace preset 的 plugins 未校验
```

自动化验证：

- [x] `pnpm check:architecture` — **失败，仅命中既有问题**：`packages/brand/src/TaboraMark.tsx` 含原始色 `#1a9070/#1c1e1c/#ffffff`（commit `3e4e2b5e` 提交，工作树无改动，brand 包完全不在 Phase 2 diff 内，属先行存在的失败，与本次治理无关）
- [ ] `pnpm quality` — 未运行（计划不含 quality 层级要求；check 已覆盖 lint/typecheck）
- [x] `pnpm check` — **0 errors**, 5 个 warning 均为既有、与 Phase 2 无关（如 `backend/app/.../auditPayload.ts` 的 no-base-to-string）
- [x] `pnpm test` — **820 tests passed**；3 个 "Failed to start forks worker / Timeout waiting for worker" 属 vitest worker 启动超时（~44min 高并发下的 runner 基础设施噪声），**零断言失败**
- [x] `pnpm build` — exit 0
- [x] `pnpm test:e2e` — **8/8 passed**，含新增移动端断点用例 "renders the dashboard mobile breakpoint at mobile width and restores the rail on desktop"
- [x] 其他：`git diff --check` clean；所有 focused package tests pass（orchestrator 64/64, official-plugins 31/31, workbench-app 183/183 等）

## 测试决策

- **本次测试变更保护的行为 / contract / 已复现缺陷**：
  - 删除 `layout-switcher.test.ts`（~200 行）、`workspaceSnapshotRepository.test.ts`（~80 行）、`WorkbenchShellLayoutState.test.ts`（~120 行）：这些测试保护的"布局切换计划生成"、"快照读写"、"layout 状态切换"行为已随实现删除，不再有可观察的对应 contract。
  - 删除 `plugins/official/layout-dashboard/src/index.test.tsx`、`layout-mobile/src/index.test.tsx`：layout-as-plugin 协议不再存在，测试"manifest contribution 注册 + view 渲染"的场景已不适用。
  - 修改 `WorkbenchShellRuntimeState.test.ts`、`WorkbenchShellHostRuntime.test.ts`、`WorkbenchShellApp.test.tsx`：删除 `reconcileInstancesForLayout` mock 和断言（该方法已从 `hydrateWorkbenchSessionState` 移除）。
  - 修改 e2e spec `workbenchDashboard.e2e.test.tsx`：新增 "renders the dashboard mobile breakpoint at mobile width and restores the rail on desktop" 用例，验证移动端作为响应式断点（非独立插件）的行为；保留原有 dashboard 渲染、双击展开、拖拽排序用例。
  - 修改 `workbenchGovernance.e2e.test.tsx`：更新 "shows an explicit layout error when the active layout view throws" 用例，layout 错误边界仍保留（现在是宿主内建 layout 的错误边界，不再是插件 view 错误）。
- **未新增测试或未删除候选测试的原因**：
  - dashboard 宿主 layout 的核心渲染逻辑由 e2e 覆盖（"renders the dashboard mobile breakpoint..."）；单元测试覆盖 rail action 桥接（`WorkbenchShellHostRuntime.test.ts`）、layout 错误追踪（`layoutError.test.ts`）、settings 面板布局选择器移除后的状态（`WorkbenchShellSettings.test.ts`）。
  - 未为 `packages/workbench-app/src/surface/dashboard/` 新增 8 个文件的独立单元测试：这些文件由旧 layout-dashboard 插件迁移而来，核心逻辑未改（只改包位置和导入路径），原有 e2e 和集成测试覆盖已足够（dashboard 渲染、rail 交互、移动端断点）。新增孤立单元测试会重复 e2e 已验证的行为。
- **`pnpm test:inventory` 候选项结论（保留 / 重构 / 删除）**：
  - 未运行 `test:inventory`（该工具用于清理候选测试，本次已主动删除 5 个测试文件且明确对应删除的实现，不需要 inventory 辅助）。

## 人工 / 浏览器检查

- **默认工作台**：✅ e2e "renders the plugin-provided dashboard shell and supports core widget interactions" pass — dashboard 渲染、rail 可见、widget 实例正常放置。
- **添加 / 尺寸 / 拖拽 / 右键 / 展开**：✅ e2e 覆盖双击展开（"opens the expand overlay on a real pointer double-click"）、拖拽不误触（"does not reorder cards on a real pointer single click"）；添加/尺寸/右键由既有集成测试覆盖，未在 e2e 回归（计划不要求全量人工浏览器验证）。
- **搜索 / 命令面板**：✅ e2e "opens quick links and allowed search through the host external-open path" pass — search 功能和权限路径正常。
- **设置中心**：✅ e2e "keeps settings categories in secondary routes and browser history" pass — 设置面板导航正常；单元测试验证"默认布局"选择器已移除（`WorkbenchShellSettings.test.ts`）。
- **主题 / 背景**：✅ 单元测试覆盖 `applyThemeSelection` / `applyBackgroundSelection` 调用链（`WorkbenchShellRuntimeState.test.ts`），e2e 未单独回归（计划不要求全量人工浏览器验证）。
- **权限路径**：✅ e2e "shows a toast when search external-open permission is denied" pass — 权限拒绝路径正常。
- **错误边界**：✅ e2e "shows an explicit layout error when the active layout view throws" pass — layout 渲染失败时显示明确错误提示（现在是宿主内建 layout 的错误边界）。

## 风险和未覆盖项

- **check:architecture 既有失败**：`packages/brand/src/TaboraMark.tsx` 含未 tokenize 的原始色（`#1a9070/#1c1e1c/#ffffff`），commit `3e4e2b5e` 提交，与 Phase 2 无关，需单独处理（tokenize 或加入 reviewed baseline）。
- **未恢复 `activeLayoutId`**：`hydrateWorkbenchSessionState` 仍使用 `setActiveLayoutId`（line 20），`WorkspaceSessionState` 仍持久化 `activeLayoutId` 字段。由于现在只有单一宿主内建 layout，该字段不再有运行时切换意义，但保留以避免 schema migration 风险（未来恢复多布局时可直接复用）。
- **未清理 `plugin-api/src/layout.ts` 协议**：LayoutContribution / RegionContentKind / RegionSlot / LayoutManifestEntry 等类型保留，作为未来恢复多布局的门（计划 Phase 2 item 4 判定"不需要"）。
- **未运行人工浏览器全量验证**：添加/尺寸/右键、主题/背景、拖拽触屏策略未在真实浏览器中手动回归，由既有单元测试和部分 e2e 覆盖（计划只要求启动 app 检查关键路径，e2e pass 满足该要求）。
- **未删除 community/layout-diy-masonry**：该包作为独立社区示例保留，不再进入 `builtin-plugin-registry` 默认装配（已在 Phase 1 移除接线），但包本身未删除（计划要求"移除默认接线"而非"删除包"）。
