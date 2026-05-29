# Tabora 阶段执行路线图

日期：2026-05-29

状态：基于当前 PRD、官方插件设计、技术方案、仓库实现状态，以及 playground / shell 边界复盘整理；用于后续 Superpowers 拆解实施任务。

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

## 3. 当前基线和边界泄漏

截至 2026-05-29，仓库最近提交显示已经完成：

- 工作台布局插件：`official.layout.workbench-dashboard` 已贡献轻 rail、topbar、mainGrid 语义。
- `@tabora/ui`：基础内容区组件包已交付，官方插件已开始复用。
- 轻量 settings host：插件、外观、搜索面板已可从 rail 进入。
- 搜索源：命令搜索已从 `search-provider` contribution 动态读取 provider。
- 权限桥：`external-open` 已通过 runtime context 和 host event 打通。
- 错误隔离：插件视图边界已覆盖主要视图容器。

当前最需要先处理的 shell 边界泄漏：

- `apps/playground/src/App.tsx` 中仍硬编码 `LIGHT_TOKENS` / `DARK_TOKENS`，而主题 token 应来自 `theme` contribution。
- `apps/playground/src/App.tsx` 中仍硬编码 `BACKGROUNDS`、`DEFAULT_BACKGROUND_ID` 和 CSS 背景映射，而背景应来自 `background-provider` + `background-renderer`。
- `apps/playground/src/App.tsx` 中仍硬编码默认 workspace 和默认 widget 实例 ID。默认装配可以存在，但应来自官方插件包或协议化 seed，而不是 playground 自己拥有业务装配。
- `apps/playground/src/App.tsx` 中仍有默认搜索源 fallback 到 `official.search.google` 的宿主逻辑，应收敛为搜索插件 / workspace 配置 / provider contribution 的组合结果。

其他关键实现差距：

- 插件数据隔离不完整：`TodayFocusCard` 和 `NotesCard` 仍使用 `localStorage`；`TodoCard` 使用 plugin data 但 key 是插件级共享，没有 instance scope。
- `PluginDataRepository` 类型中已有 `instanceId` row 字段，但 API 仍只有 pluginId + key，不能表达实例数据、共享数据和迁移。
- 插件记录未真正作为运行事实源：`PluginRecord` 类型存在，plugin manager 主要读取内置插件 summary，启用/禁用和错误状态没有闭环。
- permission grants 没有持久化授权记录；runtime 仍从 manifest permissions 直接给 granted permissions。
- 天气仍是 mock 北京天气，并使用天气符号；真实 provider、配置和网络权限尚未建立。
- 快捷入口仍硬编码 GitHub / Vite+；缺少实例配置和 plugin data。
- 搜索没有历史记录、快捷前缀解析和 provider 启用状态。
- 工作区导入 / 导出、多 workspace、插件版本迁移和布局迁移尚未进入实现。
- 浏览器扩展 shell 尚未建立。

## 4. 阶段总览

推荐执行顺序：

1. Phase A：Shell 去业务化与插件协议收口。
2. Phase B：插件数据边界与核心 widget 存储迁移。
3. Phase C：插件管理、设置和权限闭环。
4. Phase D：真实内容能力。
5. Phase E：工作区可搬迁和迁移机制。
6. Phase F：浏览器 Extension Shell。
7. Phase G：本地插件生态准备。
8. Phase H：第三方插件市场前置安全架构。

Phase A-B 是 MVP 收尾，优先修正 playground 边界泄漏和插件数据隔离。Phase C 对应官方插件设计 P1 和技术方案阶段 3 的管理 / 权限剩余工作。Phase D 对应官方插件设计 P2。Phase E 对应 PRD V1.1 的数据和迁移前置能力。Phase F 对应技术方案阶段 4。Phase G-H 对应技术方案阶段 5 和 PRD V1.5/V2 的前置路径。

## 5. Phase A：Shell 去业务化与插件协议收口

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

## 6. Phase B：插件数据边界与核心 Widget 存储迁移

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

## 7. Phase C：插件管理、设置和权限闭环

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

## 8. Phase D：真实内容能力

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

## 9. Phase E：工作区可搬迁和迁移机制

目标：进入 PRD V1.1，把本地工作台状态变成可导出、可导入、可迁移、可多工作区管理的数据模型。

进入条件：

- Phase C 完成，plugin records 和 permission grants 已有稳定存储。
- Phase B-D 至少完成 widget 数据隔离，避免导入 / 导出时混淆实例业务数据。

主要任务：

- 定义导出格式版本，包含 workspace、plugin instances、plugin data、plugin records、permission grants 的最小可搬迁集合。
- 实现 workspace export：生成 JSON，包含 schemaVersion、exportedAt、sourceAppVersion 和数据校验信息。
- 实现 workspace import：校验 JSON、处理 ID 冲突、缺失插件、未知 contribution、权限 grants 和损坏数据。
- 增加 storage schema version 和 migration 测试，覆盖从当前 version 迁移到新 version。
- 建立 layout migration 规则：贡献 ID 变化、region 变化、widget size 不兼容时如何降级。
- 引入多 workspace 数据模型：workspace 列表、active workspace、创建、重命名、切换、删除。
- 明确多 workspace 与 plugin data 的关系：默认 plugin data 跟 workspace 走，只有明确共享的数据使用 plugin-level shared scope。
- 设置中心新增工作区面板，承载导入 / 导出和多 workspace 的最小 UI。
- 同步 PRD V1.1、技术方案存储章节和文档地图。

验收标准：

- 导出后清空 IndexedDB，再导入可以恢复工作区布局、实例、插件数据、主题、背景和搜索设置。
- 导入包含未知插件的文件时，工作台不崩溃，显示缺失插件占位。
- 多 workspace 切换后，各自实例布局和插件数据互不串扰。
- storage migration tests 覆盖成功、缺字段、安全默认 workspace 和损坏数据回退。
- `pnpm test`、`pnpm check`、`pnpm build` 通过。

后续拆计划建议：

- 先拆 `workspace-export-import-format`。
- 再拆 `storage-versioning-and-migrations`。
- 再拆 `multi-workspace-model-and-switching`。
- 最后拆 `workspace-settings-panel-for-portability`。

## 10. Phase F：浏览器 Extension Shell

目标：把 playground 验证过的核心 packages 接入真实浏览器新标签页 shell，同时保持平台 / 插件 / shell 边界。

进入条件：

- Phase A 完成，playground 已证明 shell 可以不持有业务硬编码。
- Phase E 的数据模型至少稳定到可迁移。
- MVP 默认工作台、settings host 和权限桥在 playground 中可靠。

主要任务：

- 引入 WXT，新增 `apps/extension`。
- 配置 Chrome MV3 new tab override，保持标题、入口和权限声明最小化。
- 复用 `@tabora/plugin-api`、`@tabora/platform-kernel`、`@tabora/storage`、`@tabora/theme`、`@tabora/ui`、`@tabora/official-plugins`。
- 抽取 playground 与 extension 可共享的 workbench shell 编排代码，避免复制大型 `App.tsx`。
- 建立 Tabora plugin permissions 到浏览器 manifest permissions / host permissions 的映射层。
- 适配 `external-open`：浏览器 shell 使用 extension API 或安全 window/tab 行为，不能让插件直接 `window.open`。
- 检查 IndexedDB 在 extension new tab context 下的行为，补充 quota、eviction、失败回退策略。
- 增加 extension shell smoke tests 和手动验证清单。
- 保留 playground 作为开发和测试 shell，不让 extension 绑死核心平台。

验收标准：

- 安装本地扩展后，新标签页显示 Tabora 工作台。
- 主题、背景、实例布局、插件数据在扩展新标签页中持久化。
- 搜索外部打开、settings host、modal、添加 widget 在扩展 shell 中可用。
- 浏览器 manifest 权限和 Tabora 插件权限映射有文档说明。
- `pnpm test`、`pnpm check`、`pnpm build` 通过，extension 可本地构建。

后续拆计划建议：

- 先拆 `wxt-extension-shell-scaffold`。
- 再拆 `shared-workbench-shell-extraction`。
- 再拆 `extension-permission-adapter`。
- 最后拆 `extension-storage-and-new-tab-validation`。

## 11. Phase G：本地插件生态准备

目标：支持可信本地插件开发和安装，为后续第三方生态建立 SDK、模板、调试和审计基础。

进入条件：

- Phase F 至少完成 extension shell 或明确仍以 playground 作为本地插件开发宿主。
- plugin records、permissions、storage migration 已稳定。

主要任务：

- 定义本地插件安装格式：目录、manifest、entry、资产路径和版本约束。
- 实现本地插件加载流程，仍限定可信本地插件，不执行远程市场安装。
- 建立 plugin SDK：类型导出、示例插件、manifest schema 使用方式、runtime context 使用规范。
- 提供插件模板脚手架，覆盖 widget、settings panel、search provider 的最小例子。
- 增加插件调试面板：activation logs、lastError、contributions、permissions、storage keys。
- 建立插件权限审计视图：请求权限、已授权权限、使用记录和撤销入口。
- 增加 crash reports / event logs 的最小数据表和展示。
- 文档补充插件开发者指南，明确官方插件也必须遵守同一协议。

验收标准：

- 一个本地示例插件可被发现、校验、记录、启用、禁用和渲染。
- 插件开发者可以从模板创建 widget 插件并在 playground 或 extension shell 中运行。
- 插件调试面板能定位 activation error 和 view render error。
- 权限审计能展示外部打开、network 等权限请求和授权。
- `pnpm test`、`pnpm check`、`pnpm build` 通过。

后续拆计划建议：

- 先拆 `local-plugin-loading-contract`。
- 再拆 `plugin-sdk-and-templates`。
- 再拆 `plugin-debug-panel-and-crash-reports`。
- 最后拆 `permission-audit-ui`。

## 12. Phase H：第三方插件市场前置安全架构

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

## 13. 后续 Superpowers 使用方式

当要进入下一批实现时，按下面方式使用本文：

1. 选择一个阶段，例如 Phase A。
2. 若阶段过大，先选择本文给出的一个“后续拆计划建议”子项目。
3. 为该阶段或子项目运行 Superpowers brainstorming / writing-plans，计划文件必须引用本文和对应事实源。
4. 计划执行时不要跨阶段引入后续能力。
5. 阶段完成后更新本文的“当前基线”和对应阶段状态。

建议的近期顺序：

1. `shell-boundary-contract-and-default-workspace-seed`
2. `theme-contribution-application`
3. `background-provider-renderer-contract`
4. `search-default-and-provider-enabled-state`
5. `widget-view-props-and-plugin-data-scope`
6. `today-focus-notes-plugin-data-migration`
7. `todo-instance-storage-migration`
8. `quick-links-default-config-and-permission-feedback`
9. `plugin-record-repository-and-kernel-lifecycle`
10. `plugin-enable-disable-flow`
11. `permission-grants-and-plugin-manager-details`

这个顺序先修正 shell 边界，再修正插件数据模型，然后进入插件管理和真实内容能力，能最大限度降低后续返工。
