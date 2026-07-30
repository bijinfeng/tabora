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
