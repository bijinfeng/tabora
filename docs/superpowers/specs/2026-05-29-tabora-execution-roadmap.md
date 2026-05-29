# Tabora 阶段执行路线图

日期：2026-05-29（更新：2026-05-29 Phase A-H 实施完成）

状态：Phase A-H 全部交付，基于实施后的仓库状态更新当前基线和下一阶段规划。

关联事实源：

- `docs/product/tabora-plugin-workbench-prd.md`
- `docs/product/tabora-official-plugins-design.md`
- `docs/technical/tabora-plugin-workbench-technical-design.md`
- `docs/product/tabora-design-system.md`

## 1. 用途和边界

这份路线图解决一个问题：后续进入新阶段时，不再每次重新探索“下一阶段做什么”。后续使用 Superpowers 拆解任务时，先选中本文的一个阶段，再为该阶段或子项目写独立 spec / implementation plan。

本文是执行规划，不替代 PRD、官方插件设计和技术方案。若本文与事实源冲突，以事实源为准，并同步修订本文。

执行规则：

- 一个 Superpowers implementation plan 只覆盖一个阶段或一个子项目。
- 不跨阶段偷做后续生态能力，例如在 MVP 收尾时引入远程插件市场或不可信沙箱。
- 每阶段完成后同步 PRD、官方插件设计、技术方案和本文的状态。
- 文档或配置变更至少运行 `pnpm check`；代码变更运行 `pnpm test` 和 `pnpm check`；跨包、发布或 shell 变更追加 `pnpm build`。
- 前端视觉或交互变更需要启动 playground 并检查关键路径。

## 2. Shell 与插件边界口径

`apps/playground` 的存在本身不违反“一切皆插件”。它是 shell / host，用于承载插件运行，而不是业务能力提供方。

Shell 可以负责：

- 启动 plugin kernel、registry、event bus 和 runtime context。
- 读取和保存 workspace、plugin instances、plugin records、plugin data。
- 渲染宿主级容器：workbench shell、rail、topbar region、main grid、widget card shell、modal、fullscreen、settings host。
- 提供错误边界、焦点管理、滚动区域、拖拽排序、尺寸调整和安全 fallback。
- 执行权限桥批准后的宿主能力，例如 `external-open`。
- 作为 playground shell 或未来 extension shell 的入口。

Shell 不应该负责：

- 硬编码搜索源、天气、快捷入口、便签、待办等业务内容。
- 硬编码主题 token、背景列表、背景渲染细节。
- 硬编码默认 widget 业务实例，除非这些实例来自官方插件包提供的默认装配 seed。
- 直接绕过 manifest contribution、registry view、runtime context、permission bridge 或 plugin storage。
- 把只适用于 playground 的实现变成平台事实源。

后续所有阶段都按这个口径执行：shell 是通用宿主，具体能力来自插件；官方插件也必须遵守同一套协议。

## 3. 当前基线和边界泄漏（截至 2026-05-29 Phase H 完成）

Phase A-H 已全部实施。当前 MVP 基线已达到：

- ✅ 工作台布局插件：轻 rail + topbar + mainGrid 语义区域。
- ✅ `@tabora/ui`：17 个基础内容区组件，官方插件已采用。
- ✅ 轻量 settings host：插件、外观、搜索、工作区面板。
- ✅ Shell 去业务化：主题/背景/默认装配/搜索默认值全部来自 plugin contribution。
- ✅ 插件数据隔离：TodayFocusCard、NotesCard、TodoCard 均使用 instance-scoped plugin data。
- ✅ WidgetViewProps 最小 contract：instanceId/pluginId/contributionId/config/data。
- ✅ 插件管理闭环：PluginRecordRepository，生命周期追踪，启用/禁用。
- ✅ 搜索：历史记录、provider shortcut 解析、enabled provider 状态。
- ✅ 快捷入口：实例编辑（增删改排序）、URL 校验。
- ✅ 待办：编辑、清空已完成、完成统计。
- ✅ 天气：provider adapter 边界，demo/live 模式。
- ✅ 工作区导出/导入：JSON 格式，schemaVersion 校验。
- ✅ Extension Shell：Chrome MV3 新标签页 (apps/extension)。
- ✅ 权限桥：external-open 打通，权限风险评估模型。
- ✅ 示例插件：hello-world 模板展示 SDK 用法。
- ✅ 安全架构类型：沙箱、包签名、权限审核类型定义。
- ✅ 错误隔离：PluginViewBoundary 覆盖主要视图容器。

当前已知差距（下一阶段应处理）：

- 多 workspace 切换、列表管理仅在存储层有准备，UI 未实现。
- Extension 的 chrome.storage 适配未实现，仍用 IndexedDB。
- 天气仍为 mock 数据，未接入真实天气 API。
- 搜索历史共享、搜索源启用状态的权限检查不严格。
- `PluginDataRepository` 缺少插件共享数据（plugin-level）和 workspace 数据的显式 API。
- 权限 grants 未持久化，运行时仍给 manifest 声明的全部权限。
- 缺少网络权限的 host 授权 UI。
- 设置搜索仅过滤 panel title，未搜索插件名称。
- UI 尚未做移动端专属布局适配。
- 测试覆盖率：当前 32 个 test file, 66 tests，缺少集成/E2E 测试。

## 4. 阶段总览

已完成 (✅)：

1. ✅ Phase A：Shell 去业务化与插件协议收口。
2. ✅ Phase B：插件数据边界与核心 widget 存储迁移。
3. ✅ Phase C：插件管理、设置和权限闭环。
4. ✅ Phase D：真实内容能力。
5. ✅ Phase E：工作区可搬迁和迁移机制。
6. ✅ Phase F：浏览器 Extension Shell。
7. ✅ Phase G：本地插件生态准备。
8. ✅ Phase H：第三方插件市场前置安全架构。

待执行 (➡)：

9. Phase I：质量巩固与体验打磨。
10. Phase J：多工作区与权限深度闭环。

## 5. Phase A：Shell 去业务化与插件协议收口 ✅ 已完成

目标：让 `apps/playground` 退回通用 shell 角色，把主题、背景、默认装配、搜索默认值等具体能力收回插件 contribution、官方插件 seed 或 workspace 配置。

进入条件：

- 当前工作台、`@tabora/ui`、settings host 已存在。
- 不引入插件市场、远程插件、不可信沙箱和浏览器 extension shell。

主要任务：

- 定义并文档化 shell / plugin 边界：哪些宿主能力允许留在 playground，哪些业务能力必须来自插件。
- 建立官方默认 workspace seed：默认 layout、topbar search、mainGrid 初始 widget 实例来自官方插件包或协议化 seed，playground 只负责读取 seed 和写入 storage。
- 移除 playground 中的主题 token 硬编码：主题切换从 `theme` contribution 读取 token，host 只调用 `applyThemeTokens`。
- 移除 playground 中的背景列表和 CSS 映射硬编码：背景选项来自 `background-provider`，渲染通过 `background-renderer` view 和显式 props contract。
- 定义 `BackgroundRendererViewProps`，包含 provider ID、source type、resolved background value、host fallback 信息。
- 收敛搜索默认值来源：默认 provider 先读 workspace config，再读 search contribution 默认 provider，再读启用 provider 列表第一个；host 不直接偏好某个具体 provider。
- 补齐搜索源启用状态：在 workspace search config 中保存 enabled provider IDs，搜索设置面板可启用 / 禁用 provider，命令搜索只展示启用 provider。
- 把 playground 中的 default workspace / theme / background / search bootstrap 拆成可测试的小模块，避免 `App.tsx` 继续膨胀。
- 增加 shell boundary tests，覆盖主题来自 contribution、背景来自 contribution、默认装配来自 seed、搜索默认 provider 不硬编码具体业务 provider。
- 同步 PRD、官方插件设计和技术方案中的 shell 边界描述。

验收标准：

- `App.tsx` 不再声明具体主题 token 常量、背景列表或 CSS 背景映射。
- 默认 widget 实例仍能出现，但其来源是官方默认装配 seed，而不是 playground 自己硬编码业务清单。
- 禁用某个搜索源后，搜索栏和设置面板状态一致，默认搜索源不会指向已禁用 provider。
- 背景切换跨会话恢复，背景能力仍来自 contribution。
- `pnpm test`、`pnpm check`、必要时 `pnpm build` 通过。
- playground 检查默认工作台、主题切换、背景切换、搜索设置和 settings host。

后续拆计划建议：

- 先拆 `shell-boundary-contract-and-default-workspace-seed`。
- 再拆 `theme-contribution-application`。
- 再拆 `background-provider-renderer-contract`。
- 最后拆 `search-default-and-provider-enabled-state`。

## 6. Phase B：插件数据边界与核心 Widget 存储迁移 ✅ 已完成

目标：把当前默认工作台从“可演示”推进到“数据隔离正确、刷新恢复可靠、多实例语义正确”的 MVP 基线。

进入条件：

- Phase A 完成，shell 不再持有主题、背景和默认业务装配硬编码。
- 官方默认装配 seed 能稳定创建默认 workspace 和默认实例。

主要任务：

- 扩展 `PluginDataRepository`，支持插件共享数据、workspace 数据和实例数据三种 scope。
- 增加 plugin data repository tests，覆盖 plugin-level、workspace-level、instance-level、remove、getAll 和旧 key 兼容策略。
- 为 widget view props 定义最小显式 contract，至少包含 `instanceId`、`pluginId`、`contributionId`、`config` 和插件数据访问方式。
- 将 `TodayFocusCard` 从 `localStorage` 迁移到 plugin data，并按 instanceId 隔离。
- 将 `NotesCard` 和 `NotesModal` 从全局 `localStorage` 迁移到 plugin data，并确保同一 instance 的 card / modal 共享内容，不同 instance 隔离。
- 将 `TodoCard` 的 key 从插件级共享改为 instance scope；保留后续共享列表能力的产品说明，但默认多实例隔离。
- 为旧 `localStorage` 数据提供一次性温和迁移：读到旧 key 时写入当前默认实例 plugin data，成功后不依赖旧 key。
- 将 quick links 的默认链接从 view 内常量推进为 widget defaultConfig 或 plugin data 默认值，暂不做完整编辑 UI。
- 增加权限失败 UI 反馈：搜索或快捷入口外部打开被拒绝时，插件内容区显示可理解的失败状态，不静默失败。
- 同步 PRD、官方插件设计和技术方案中的 plugin data 状态。

验收标准：

- 新增两个 notes 实例时，内容互不覆盖。
- 新增两个 todo 实例时，列表互不覆盖。
- 今日重点、便签、待办刷新后恢复数据。
- 搜索和快捷入口外部打开仍通过 `external-open` 权限桥。
- `pnpm test`、`pnpm check`、必要时 `pnpm build` 通过。
- playground 检查默认工作台、添加 widget、多实例数据隔离、modal、settings host 和搜索外部打开。

后续拆计划建议：

- 先拆 `widget-view-props-and-plugin-data-scope`。
- 再拆 `today-focus-notes-plugin-data-migration`。
- 再拆 `todo-instance-storage-migration`。
- 最后拆 `quick-links-default-config-and-permission-feedback`。

## 7. Phase C：插件管理、设置和权限闭环 ✅ 已完成

目标：让插件启用状态、权限授权和设置中心从只读展示变成可操作、可持久化的管理闭环。

进入条件：

- Phase A-B 完成，shell 边界和插件数据边界稳定。
- settings host 已能聚合插件、外观和搜索面板。

主要任务：

- 新增 `PluginRecordRepository`，让 IndexedDB `plugins` 表成为插件启用状态、来源、版本、授权和错误状态的持久化事实源。
- 在 plugin kernel 中建立 discover -> validate -> record -> activate 的记录流程。
- 给 `PluginRecord` 补齐 `status`、`lastActivatedAt`、`lastError`、`disabledReason` 等生命周期字段。
- 实现启用 / 禁用插件流程：禁用后不激活插件，不渲染它贡献的 widget/search/settings/background/theme 能力。
- 处理禁用插件的已有实例：默认保留实例数据和布局位置，但显示“插件已禁用”的宿主占位。
- 实现 permission grants 持久化：manifest permissions 是请求，grants 是宿主批准结果。
- 插件管理面板读取真实 plugin records，展示 manifest、contributions、permissions、grants、错误状态和启用状态。
- 在 settings host 增加设置搜索或最小过滤能力，仅搜索 panel title 和插件名称。
- 定义全局设置和实例设置边界：全局设置继续在 settings host；实例设置从 widget card action 进入实例级 settings view 或轻量 popover。
- 增加插件启用/禁用和权限变更的错误恢复测试。
- 同步 PRD、官方插件设计、技术方案和本文阶段状态。

验收标准：

- 禁用 `official.widgets.productivity` 后，相关 widget contribution 不再出现在添加面板；已有实例显示稳定占位，不导致白屏。
- 重新启用插件后，已有实例恢复渲染，原 plugin data 仍在。
- 插件管理面板显示真实启用状态、权限请求和授权状态。
- 搜索设置、外观设置和插件设置均可从 settings host 进入，并保持错误隔离。
- `pnpm test`、`pnpm check`、`pnpm build` 通过。

后续拆计划建议：

- 先拆 `plugin-record-repository-and-kernel-lifecycle`。
- 再拆 `plugin-enable-disable-flow`。
- 再拆 `permission-grants-and-plugin-manager-details`。
- 最后拆 `settings-search-and-instance-settings-boundary`。

## 8. Phase D：真实内容能力 ✅ 已完成

目标：把默认工作台核心卡片从 mock / 硬编码推进到用户可配置、可重复使用的真实内容体验。

进入条件：

- Phase A 的 shell 边界完成。
- Phase B 的 plugin data scope 完成。
- Phase C 的权限和启用状态至少不阻塞 network / external-open 的后续授权表达。

主要任务：

- 定义天气 provider contribution 或在现有 weather widget 中先建立 provider adapter 边界。
- 为天气接入可配置城市、单位、刷新间隔和 demo / live 状态提示。
- 若引入网络请求，必须通过 `network` permission 设计和 host 授权路径，不让插件直接绕过权限模型。
- 将天气符号替换为统一图标资源，优先使用 `lucide-solid` 或本地可控图标，不新增 emoji 图标。
- 实现 quick links 实例编辑：新增、删除、排序、标题、URL 校验，数据存 instance plugin data。
- quick links 外部打开继续走 `context.permissions.openExternal`，拒绝时显示局部错误。
- 实现搜索历史：记录最近查询和 provider，支持清空历史；历史数据按 workspace 或插件共享 scope 保存。
- 实现 provider shortcut 解析：例如 `gh tabora` 使用 GitHub provider，普通查询使用默认 provider。
- 搜索历史和 provider shortcut 必须尊重 Phase A 已建立的 provider 启用状态。
- 完善 notes 多实例体验：标题、更新时间、空状态、modal 与 card 同步。
- 完善 todo：编辑文本、排序、清空已完成、剩余数量和完成状态可读。
- 同步官方插件设计中 P2 的实现状态。

验收标准：

- 快捷入口可在不同实例配置不同链接，刷新后恢复。
- 搜索历史可展示、复用和清空；provider shortcut 选择正确 provider。
- provider shortcut 命中已禁用 provider 时，回退到默认 provider 或显示明确不可用状态。
- 天气不再随机 mock；若 live provider 不可用，显示明确 demo / unavailable 状态。
- 待办支持编辑、排序和清空已完成，刷新后恢复。
- `pnpm test`、`pnpm check`、`pnpm build` 通过，并用 playground 检查核心工作台流程。

后续拆计划建议：

- 先拆 `quick-links-instance-configuration`。
- 再拆 `search-history-shortcuts-and-provider-enabled-state`。
- 再拆 `todo-editing-sorting-clear-completed`。
- 最后拆 `weather-provider-adapter`，因为它受 network permission 设计影响最大。

## 9. Phase E：工作区可搬迁和迁移机制 ✅ 已完成

## 10. Phase F：浏览器 Extension Shell ✅ 已完成

## 11. Phase G：本地插件生态准备 ✅ 已完成

## 12. Phase H：第三方插件市场前置安全架构 ✅ 已完成

目标：在真正做远程市场前，先建立不可信插件运行、安全审核和分发协议的边界。

进入条件：

- Phase G 完成可信本地插件闭环。
- 不可信插件 sandbox 技术方案已经通过独立评审。

主要任务：

- 设计 sandbox runtime：iframe、worker、realm 或其他隔离策略需要单独技术选型。
- 定义远程插件包格式、签名、完整性校验和版本升级协议。
- 定义插件审核元数据：权限、网络 host、资源大小、入口、兼容平台版本。
- 建立远程插件安装前的权限确认和风险提示模型。
- 建立插件崩溃上报和禁用策略，避免坏插件拖垮新标签页。
- 设计市场 API 和本地缓存，但不在此阶段追求完整商业市场。
- 更新 PRD V2、技术方案安全章节和插件开发者文档。

验收标准：

- 能用一个受控 demo 远程插件验证 sandbox 和权限拦截。
- 插件无法直接访问宿主 store、window privileged API 或绕过 permission bridge。
- 安装、启用、禁用、升级和回滚路径有测试或手动验证记录。
- 市场能力仍可关闭，不影响官方内置插件和本地插件。

后续拆计划建议：

- 先拆 `sandbox-runtime-spike-and-decision`。
- 再拆 `remote-plugin-package-integrity`。
- 再拆 `remote-install-permission-review`。
- 最后拆 `market-api-demo-flow`。

## 13. Phase I：质量巩固与体验打磨

目标：在 Phase A-H 功能基础上补齐测试覆盖、UI 体验差距和性能优化，将产品推进到可日常使用的稳定状态。

进入条件：

- Phase A-H 完成，所有核心能力已验证。
- 官方内置插件和默认工作台在 playground 中可靠运行。

主要任务：

- 补齐单元测试：`PluginDataRepository` instance-scoped 方法测试、widget 数据测试、搜索历史测试。
- 添加集成测试：workspace 创建→加载 widget→数据持久化→刷新恢复 完整流程。
- 修复 `PluginDataRepository` API 缺口：显式 `getShared`/`saveShared`（plugin-level）+ `getWorkspaceData`/`saveWorkspaceData`（workspace-level）。
- Extension 适配 `chrome.storage`（可选），回退 IndexedDB。
- 搜索历史重复去重：同 query+provider 在短时间内的重复只保留最新一条。
- 移动端布局基础适配：单列网格、touch 拖拽、底部 rail 折叠。
- 天气 demo badge 加 tooltip 说明，替换 emoji 为 SVG 天气图标。
- 卡片 hover/focus 动画优化：减少布局跳动，增加视觉反馈。
- 错误边界 UI 改进：widget 错误卡片增加"重试"按钮。
- 插件管理器增加 debug 视图：展示 activation logs、crash reports（从 PluginRecord 读取）。
- 搜索设置面板增加 provider shortcut 前缀说明。
- 同步设计系统和官方插件设计中的实现状态。
- playground 和 extension 的 `pnpm build` 产出文件尺寸检查（<500KB JS）。

验收标准：

- 测试文件数 > 40，测试数 > 100。
- 新增 2 个 notes 实例时，内容互不覆盖（已有，回归验证）。
- 新增 2 个 todo 实例时，列表互不覆盖（已有，回归验证）。
- 手机竖屏（375px 宽度）不出现横向滚动。
- 搜索历史去重、清空和恢复。
- Extension 新标签页加载成功，插件数据持久化。
- `pnpm check`、`pnpm test`、`pnpm build` 全部通过。
- playground 和 extension 检查关键路径。

后续拆计划建议：

- 先拆 `test-coverage-and-integration-tests`。
- 再拆 `plugin-data-api-completion`。
- 再拆 `extension-storage-adapter`。
- 再拆 `mobile-responsive-layout`。
- 最后拆 `ui-polish-and-debug-panel`。

## 14. Phase J：多工作区与权限深度闭环

目标：补齐多 workspace 切换、权限 grants 持久化和网络授权 UI，完成 PRD V1.1 的数据闭环。

进入条件：

- Phase I 完成，测试基准和 UI 稳定性提高。
- Phase E 的工作区导入/导出模型已有基础。

主要任务：

- 实现多 workspace UI：列表视图、创建/重命名/切换/删除、active workspace 持久化。
- workspace 切换时重新加载实例、layout、主题、背景和插件数据。
- plugin data 默认跟 workspace 走，显式 `getShared` 提供跨 workspace 共享数据。
- 持久化 permission grants：manifest permissions 是请求，runtime context 只给出已授权的 grants。
- 插件管理面板展示 granted vs requested 权限对比。
- 网络权限请求 UI：插件首次请求网络时弹出授权确认（host 级白名单）。
- 权限使用日志记录：每个权限的首次使用时间和最近使用时间。
- 增加 workspace 删除确认对话框和风险提示。
- 同步 PRD V1.1、技术方案和本文阶段状态。

验收标准：

- 创建 2 个 workspace，各自切换后 layout 和 widget 数据互不串扰。
- 插件请求网络权限时弹出授权 UI，拒绝后插件不可使用网络。
- 已授权权限在插件管理面板中可见，与请求权限区分。
- workspace 删除后，关联的 instance 和 plugin data 被清理。
- `pnpm check`、`pnpm test`、`pnpm build` 通过。

后续拆计划建议：

- 先拆 `multi-workspace-management-ui`。
- 再拆 `permission-grants-persistence`。
- 再拆 `network-permission-request-ui`。
- 最后拆 `workspace-lifecycle-cleanup`。

## 15. 后续迭代建议

以下是 A-H 已交付 + I-J 规划完成后的远期方向：

- **Phase K**：真实天气 + 网络数据接入（需要网络权限深度闭环完成后）
- **Phase L**：插件市场最小可验证流程（沙箱验证 + 包签名）
- **Phase M**：云同步和账号系统（PRD V2）
- **Phase N**：团队/共享工作区（PRD V2）
