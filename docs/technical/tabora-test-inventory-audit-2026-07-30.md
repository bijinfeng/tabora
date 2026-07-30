# Tabora 测试盘点审查（2026-07-30）

状态：已完成首批候选审查

本记录审查 `pnpm test:inventory` 在 2026-07-30 输出的候选项。它不是长期事实源；后续运行结果应以实时脚本输出为准。

## 审查结论

| 候选文件 | 结论 | 依据 |
| --- | --- | --- |
| `packages/workbench-app/src/appearance/WorkbenchShellAppearanceState.test.ts` | 保留 | 主题 / 背景切换需要同时保证立即应用和 workspace 持久化。依赖注入断言验证这两个可观察副作用。 |
| `packages/workbench-app/src/layout/WorkbenchShellLayoutRuntime.test.ts` | 保留 | 验证 layout host、engine、renderer 的跨模块组装，以及安全布局的回调桥接；这是 shell 故障回退路径。 |
| `packages/workbench-app/src/runtime/WorkbenchShellRuntimeState.test.ts` | 保留 | 覆盖插件发现、session hydration、kernel ready 顺序，以及事件订阅清理，属于启动生命周期 contract。 |
| `packages/workbench-app/src/shell/WorkbenchShellApp.test.tsx` | 保留 | 覆盖根节点未聚焦时全局快捷键仍可执行，是用户可观察交互。高 mock 数反映当前 shell 体积，不是删除理由。 |
| `packages/workbench-app/src/shell/WorkbenchShellControllerRuntime.test.ts` | 保留 | 覆盖 command、widget、search、drag、view runtime 的桥接；任一漏接会造成宿主功能缺失。 |
| `packages/workbench-app/src/workspace/WorkbenchShellSessionState.test.ts` | 保留 | 覆盖 hydration 期间 workspace、外观、搜索和实例 reconciliation 的状态同步。 |
| `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceState.test.ts` | 保留 | 覆盖导入、当前 workspace 短路、删除后的 default 回退和创建 workspace。 |
| `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.test.ts` | 删除一项，其余保留 | 删除“proxies workspace lifecycle methods”用例：它只确认返回对象原样转发五个 action。底层生命周期行为由 `WorkbenchShellWorkspaceState.test.ts` 覆盖，导入导出数据 contract 由 `apps/playground/src/workspaceTransfer.test.tsx` 覆盖，调用方类型由 TypeScript 检查。 |

## 规则修正

`LayoutBoundary.test.tsx` 原本因 `toBeTruthy()` 未被识别而被误列为“仅协作者调用”。盘点规则现将 `toBeTruthy`、`toBeFalsy`、`toBeNull` 和 `toBeDefined` 视为可观察断言，因此该文件不再进入候选清单。

## 结果

本批只删除 1 个纯代理用例，保留其余高价值编排测试。不要为了压低候选数量进一步删除；`WorkbenchShellApp` 等重型宿主的 mock 数应在后续架构拆分时自然下降。

## 第二批清理

第二批不按 inventory 的 mock 信号筛选，而是审查历史迁移和纯实现细节测试。删除项及替代覆盖如下：

| 已删除测试 | 删除理由 | 替代覆盖 |
| --- | --- | --- |
| `packages/ui/src/primitives/stylexOverlayMigration.test.tsx` | 一次性 StyleX 迁移验收，只检查旧 `tbr-*` class 片段不存在。 | `scanStylexCssBoundaries` 阻止组件 CSS 回流；各 primitive 的行为测试继续覆盖可观察状态。 |
| `packages/ui/src/primitives/stylexOverlayRemainingMigration.test.tsx` | 同上，属于同一次迁移的剩余组件清单。 | 同上。 |
| `packages/ui/src/primitives/stylexContentMigration.test.tsx` | 同上，检查实现生成的 class，而非用户行为。 | 同上。 |
| `packages/ui/src/primitives/stylexDisplayMigration.test.tsx` | 同上，检查实现生成的 class，而非用户行为。 | 同上。 |
| `packages/orchestrator/src/layout-package-boundaries.test.ts` | 重复读取两个 plugin `package.json` 检查依赖。 | `pnpm check:architecture` 的 `scanPluginPackageBoundaries` 扫描所有 plugin package。 |
| `packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx` | 仅断言 barrel export 是 function。 | 生产源码直接导入这些 export，`pnpm check` 和 `pnpm build` 会捕获缺失 export。 |
| `packages/host-adapters/src/index.test.ts` 中的 re-export 用例 | 仅比较 index export 与源文件引用相等。 | playground / extension 的生产 composition 通过 package index 导入，类型检查和构建覆盖该契约。 |

第二批保留了各组件自身的交互、可访问性和状态测试；删除的只是一次性迁移检查、静态 re-export 检查和已被架构扫描覆盖的 package 规则。

## 第三批：标准测试套件精简与提速

本批继续以可观察行为和替代覆盖为准，不按 mock 数量或单文件耗时直接删除测试。

### 删除的测试文件

| 已删除测试 | 删除理由 | 替代覆盖与剩余风险 |
| --- | --- | --- |
| `apps/site/src/routes/siteLegacyCleanup.test.ts` | 只验证一次性站点迁移结果、入口行数和旧文件缺失，属于过程验收。 | `pnpm check:architecture` 持续扫描站点语义 class 边界，站点现有组件测试和构建覆盖有效入口；旧页面文件再次出现仍主要依赖架构扫描和评审。 |
| `packages/ui/src/primitives/tooltip/tooltip.test.tsx` | 只证明 trigger 子节点能渲染，没有断言打开、内容、焦点或可访问性行为。 | 删除不减少有效行为覆盖；Tooltip 的完整交互仍是待补场景，只有在明确保护这些行为时才应新增测试。 |
| `packages/ui/src/primitives/hoverCard/hoverCard.test.tsx` | 同 Tooltip，只验证 trigger 渲染。 | 删除不减少有效行为覆盖；HoverCard 的打开与焦点交互仍未被该测试保护。 |
| `packages/workbench-app/src/workspace/WorkbenchWorkspaceStore.test.ts` | 重复验证 Solid signal 的初值、setter 和 updater。 | workspace hydration、切换和回退由 `WorkbenchShellWorkspaceState.test.ts` 等 shell 状态测试覆盖。 |
| `packages/workbench-app/src/widget/WorkbenchWidgetStore.test.ts` | 只验证 signal 转发，没有 widget 用户行为。 | widget 添加、调整和 shell 桥接由 widget controller / runtime 测试覆盖。 |
| `packages/workbench-app/src/search/WorkbenchSearchStore.test.ts` | 只验证 signal setter 和普通状态切换。 | 搜索 surface、workspace 恢复和 controller 测试继续覆盖可观察搜索行为。 |

### 从保留文件删除的实现细节用例

| 已删除用例 | 删除理由 | 替代覆盖 |
| --- | --- | --- |
| `regressionSummary.test.ts` 的 runtime re-export 比较 | 只比较两个 export 的引用相等。 | CLI 生产入口直接导入 export，类型检查和其余函数行为测试会捕获缺失或错误。 |
| `WorkbenchShellState.test.ts` 的 bundle key 枚举 | 固定私有返回对象的 key 顺序。 | 保留依赖注入、视觉默认值和搜索默认值的行为断言。 |
| `WorkbenchAppearanceStore.test.ts` 的普通 setter 用例 | 重复 Solid signal setter 语义。 | 保留初值注入和暗色主题派生测试；实际外观持久化由 shell appearance state 测试覆盖。 |
| `WorkbenchRuntimeStore.test.ts` 的普通 setter 用例 | 只检查内部状态读写。 | 保留 Toast 自动关闭和 action Toast 不自动关闭两项用户可观察行为。 |
| `WorkbenchRuntimeStore.test.ts` 的 toast manager 注入 seam 用例 | 只证明测试替身可以被注入。 | Toast 的可观察生命周期用例直接覆盖生产路径。 |

### 保留但重构的测试

`packages/workbench-app/src/runtime/syncManager.test.ts` 的 4 项测试保护手动同步完成时机、未登录拒绝、数据库变更自动同步和同步进行中追加变更后的补偿同步，不能删除。原测试真实等待每次 2 秒 debounce，单文件约 10.2 秒，满载时 4 秒轮询窗口会偶发超时。测试现在只把 2 秒 debounce 压缩为 0 毫秒，保留异步边界和真实 Dexie 调度；定向执行为 4/4 通过、测试体约 0.263 秒。

### 运行器调整

- 根单元测试 pool 从默认 `forks` 改为 `threads`；`maxWorkers=4` 的完整实测更慢，未采用。
- `plugin-api`、`platform-kernel`、`orchestrator`、`storage`、`sync`、`auth`、`host-adapters`、`ai-runtime` 改用不加载 happy-dom、Solid 和 StyleX 的 Node 项目配置。定向结果为 37 个文件、243 项通过，Vitest duration 3.15 秒，environment 6 毫秒。
- StyleX Vite 插件在 Vitest 的无 HTTP server 场景不再安装开发 middleware 和 150 毫秒轮询 interval；StyleX transform 仍保留。site、workbench 和 tooling 定向测试均通过，且进程不再额外等待 10 秒关闭。

### 最终结果

- `pnpm test:inventory`：167 个测试文件、8 个审查候选；候选仍是首批已逐项确认的高价值编排测试，继续保留。
- 最终 `pnpm test`：158 个单元 / 集成测试文件、743 项全部通过。
- 最终完整计时：`real 293.28s`，Vitest duration 285.86 秒；transform 累计 1389.29 秒、import 累计 1704.12 秒、tests 累计 14.61 秒。
- 相对 320.35 秒基线，本次最终复测改善约 8.4%，未稳定达到 40% 目标。曾测得 threads 192.92 秒，但重复运行波动明显，不能把单次较快结果作为稳定验收结论。
- `pnpm check` 和 `pnpm build` 通过。`pnpm test:e2e` 连续复现 3 项失败、1 项通过，日志显示同名 `tabora` IndexedDB 连接在测试生命周期中互相关闭；单 worker 仍失败，因此未在本轮单元测试提速任务中顺带修改 E2E 装配。

当前剩余瓶颈是带 StyleX / Solid 的 DOM 项目转换和导入，而不是测试断言本身。继续提速需要拆分共享模块图或减少跨 worker 重复编译；不应通过移出高价值测试、关闭隔离或压低 timeout 达成数字目标。
