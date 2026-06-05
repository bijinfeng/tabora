# Tabora 插件系统可扩展性收尾 Implementation Plan

> **归档状态：** 本计划已完成并归档。仅在用户明确要求复盘或审查该计划时使用；当前事实源以 `docs/README.md` 登记的 PRD、设计、技术方案 V2 和回归基准为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 连续完成 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md` 中剩余 X3-X8 插件扩展性改造，不再每个阶段等待人工继续。

**Architecture:** 以 `@tabora/orchestrator` 承接纯编排模型，`@tabora/plugin-api` 承接协议类型与 schema，`@tabora/platform-kernel` 承接运行时能力与加载兼容检查，`@tabora/workbench-shell` 和 apps 只消费 view model 与 host callbacks。每个任务使用 TDD，保持现有用户行为，任务完成后验证并提交。

**Tech Stack:** pnpm workspace、Vite+、Solid、TypeScript、Vitest、Dexie、Zod、tsdown。

---

## 执行规则

- 使用 `superpowers:subagent-driven-development` 连续执行；如果当前平台无法使用子代理，则使用 `superpowers:executing-plans`。
- 每个任务按 TDD 执行：先写失败测试，确认 RED，再实现 GREEN，再必要 refactor。
- 每个任务完成后至少运行相关 package test；跨包或协议变更追加 `pnpm test`、`pnpm check`、`pnpm build`。
- 每个任务独立提交；除非遇到真实 blocker、验证失败无法解决、或产品决策缺口，否则不要暂停等待人工继续。
- 不回滚用户或其他 agent 的改动；提交前检查 `git status --short --untracked-files=all`。

## 当前基线

- X1、X1.5、X2 已完成。
- X3 已完成：
  - settings navigator 下沉到 `@tabora/orchestrator`。
  - CommandPalette 结果模型下沉到 `@tabora/orchestrator`。
  - widget context menu 默认 size / expand / remove 菜单模型下沉到 `@tabora/orchestrator`。
- 剩余重点：
  - X3 layout switcher、drag sort、shared shell helpers。
  - X4 command / keybinding / context menu contribution。
  - X5 settings section/scope 与 widget instance settings。
  - X6 workspace presets。
  - X7 host capability、storage adapter、background source。
  - X8 plugin loader、package format、compatibility、dependency boundary guard。

## Task 1: 文档计划入口

**Files:**

- Create: `docs/superpowers/plans/2026-06-05-plugin-extensibility-completion.md`
- Modify: `docs/README.md`

- [ ] **Step 1: 确认计划文件存在**

Run:

```bash
test -f docs/superpowers/plans/2026-06-05-plugin-extensibility-completion.md
```

Expected: exit 0.

- [ ] **Step 2: 在文档地图登记计划入口**

在 `docs/README.md` 的 “Phase X1: Shell 工程边界收口 Implementation Plan” 后添加：

```md
### 插件系统可扩展性收尾 Implementation Plan

- `docs/superpowers/plans/2026-06-05-plugin-extensibility-completion.md`

用途：

- 把 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md` 中剩余 X3-X8 拆成连续执行的工程任务。
- 作为 layout switcher、drag sort、command/keybinding/context menu contribution、settings protocol、workspace presets、host capability、storage adapter、plugin loader 和依赖边界收尾的实施入口。
```

- [ ] **Step 3: 验证文档入口**

Run:

```bash
rg -n "2026-06-05-plugin-extensibility-completion" docs/README.md docs/superpowers/plans/2026-06-05-plugin-extensibility-completion.md
```

Expected: 两个文件都能找到该路径。

- [ ] **Step 4: 提交**

Run:

```bash
git add docs/README.md docs/superpowers/plans/2026-06-05-plugin-extensibility-completion.md
git commit -m "docs: add plugin extensibility completion plan"
```

## Task 2: Finish Phase X3 - Layout Switcher

**Files:**

- Create: `packages/orchestrator/src/layout-switcher.ts`
- Create: `packages/orchestrator/src/layout-switcher.test.ts`
- Modify: `packages/orchestrator/src/index.ts`
- Modify: `packages/orchestrator/package.json`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing tests**

Create tests for:

- same region id is preserved.
- widget migrates to first compatible widget region.
- search does not migrate into widget region.
- incompatible instance is returned as unplaced without deletion.
- snapshot captures previous regions and instances.

Run:

```bash
pnpm --filter @tabora/orchestrator test
```

Expected: FAIL because `layout-switcher` does not exist.

- [ ] **Step 2: Implement minimal layout switcher**

Implement `createLayoutSwitchPlan(options)` returning:

```ts
{
  nextRegions: Workspace["regions"]
  migratedInstances: PluginInstance[]
  unplacedInstances: PluginInstance[]
  snapshot: {
    layoutId: string
    regions: Workspace["regions"]
    instances: PluginInstance[]
  }
}
```

Migration rules:

- If target layout has same `regionId` and accepts instance extensionPoint, keep it.
- Otherwise choose first target region whose `accepts` includes instance extensionPoint.
- If no compatible region exists, keep instance unchanged in `unplacedInstances`.
- `nextRegions` only includes instances in compatible target regions.

- [ ] **Step 3: Wire apps**

Replace duplicated layout switching logic in playground and extension with the orchestrator switch plan. Preserve current persistence behavior and toast text.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm --filter @tabora/orchestrator test
pnpm test
pnpm check
pnpm build
git add packages/orchestrator apps/playground/src/App.tsx apps/extension/entrypoints/newtab/App.tsx
git commit -m "refactor: move layout switching into orchestrator"
```

## Task 3: Finish Phase X3 - Drag Sort Model

**Files:**

- Create: `packages/orchestrator/src/drag-sort-model.ts`
- Create: `packages/orchestrator/src/drag-sort-model.test.ts`
- Modify: `packages/orchestrator/src/index.ts`
- Modify: `packages/orchestrator/package.json`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing tests**

Cover:

- same-region source/target reorder.
- cross-region drag returns unchanged order.
- disabled instances are not included in reorder output.
- updated grid order is stable and deterministic.

Run:

```bash
pnpm --filter @tabora/orchestrator test
```

Expected: FAIL because `drag-sort-model` does not exist.

- [ ] **Step 2: Implement drag sort model**

Implement `createDragSortPlan(options)`:

```ts
{
  sourceId: string
  targetId: string
  instances: PluginInstance[]
}
```

Return:

```ts
{
  changed: boolean
  instances: PluginInstance[]
}
```

Rules:

- If source/target missing, disabled, or region mismatch, return `changed:false`.
- Move source before target in the same region.
- Reassign grid order using existing grid shape where possible.

- [ ] **Step 3: Wire apps**

Replace inline drop ordering with `createDragSortPlan`. Keep current toast “排序已更新”.

- [ ] **Step 4: Verify and commit**

Run package tests, full test/check/build, then commit:

```bash
git commit -m "refactor: move drag sort model into orchestrator"
```

## Task 4: Finish Phase X3 - Shared Shell Helpers

**Files:**

- Create: `packages/workbench-app/src/shellHelpers.ts`
- Create: `packages/workbench-app/src/shellHelpers.test.ts`
- Modify: `packages/workbench-app/src/index.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing tests**

Cover pure helpers:

- searchable widgets builder.
- enabled search providers resolver.
- default search provider resolver.
- widget title / icon label fallback.

- [ ] **Step 2: Implement helpers**

Move only pure logic. Do not move app signals, repositories, DOM, or large state.

- [ ] **Step 3: Wire apps**

Replace duplicated helper functions in playground and extension with `@tabora/workbench-app` helpers.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm --filter @tabora/workbench-app test
pnpm test
pnpm check
pnpm build
git commit -m "refactor: share shell workbench helpers"
```

## Task 5: Phase X4 - Command Contribution Protocol

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Create: `packages/orchestrator/src/command-catalog.ts`
- Create: `packages/orchestrator/src/command-catalog.test.ts`
- Modify: `packages/orchestrator/src/index.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing schema/model tests**

Test `commands` contribution with:

```ts
{
  id: "official.command.add-widget",
  title: "添加卡片",
  category: "workspace",
  defaultShortcut: "mod+n",
}
```

Expected schema accepts it and command catalog returns a CommandPalette entry.

- [ ] **Step 2: Add API types and schema**

Add `CommandContribution`:

```ts
export type CommandContribution = {
  id: string
  title: string
  description?: string
  icon?: string
  category: string
  keywords?: string[]
  defaultShortcut?: string
  requiredCapabilities?: string[]
}
```

Add `commands?: CommandContribution[]` to manifest contributes.

- [ ] **Step 3: Implement command catalog**

Merge platform commands and plugin command contributions into `SearchCommandEntry[]`.

Skip plugin commands whose required capabilities are not supported.

- [ ] **Step 4: Wire shell commands**

Move hardcoded add widget / settings / theme / layout switch / shortcuts command definitions into command catalog inputs.

- [ ] **Step 5: Verify and commit**

Run `pnpm test`, `pnpm check`, `pnpm build`, commit:

```bash
git commit -m "feat: add command contribution model"
```

## Task 6: Phase X4 - Keybinding Registry

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Create: `packages/orchestrator/src/shortcut-registry.ts`
- Create: `packages/orchestrator/src/shortcut-registry.test.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing tests**

Cover conflict detection, platform filtering, disabled conflict winner, command ID lookup.

- [ ] **Step 2: Add API types and schema**

Add:

```ts
export type KeybindingContribution = {
  id: string
  commandId: string
  key: string
  platform?: "web" | "extension" | "desktop-webview"
  when?: string
  editable?: boolean
}
```

- [ ] **Step 3: Implement registry**

`createShortcutRegistry({ keybindings, commands, platform })` returns enabled bindings and conflicts.

- [ ] **Step 4: Wire app keyboard handler**

App keydown reads registry and executes command by command ID.

- [ ] **Step 5: Verify and commit**

Commit:

```bash
git commit -m "feat: add keybinding registry"
```

## Task 7: Phase X4 - Plugin Context Menu Contributions

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Modify: `packages/orchestrator/src/context-menu-model.ts`
- Modify: `packages/orchestrator/src/context-menu-model.test.ts`

- [ ] **Step 1: Write failing tests**

Cover plugin context menu item merge, order, missing command skip, danger flag.

- [ ] **Step 2: Add contribution type**

Add:

```ts
export type WidgetContextMenuContribution = {
  id: string
  label: string
  commandId?: string
  order?: number
  danger?: boolean
  when?: string
}
```

Add `contextMenus?: WidgetContextMenuContribution[]` to `WidgetContribution`.

- [ ] **Step 3: Extend context menu model**

Merge plugin items after default size/expand and before remove. Render only if command ID resolves.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add widget context menu contributions"
```

## Task 8: Phase X5 - Settings Protocol

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Modify: `packages/orchestrator/src/settings-navigator.ts`
- Modify: `packages/orchestrator/src/settings-navigator.test.ts`
- Modify official settings plugin manifests.

- [ ] **Step 1: Write failing tests**

Cover explicit section/scope priority and old id fallback.

- [ ] **Step 2: Add section/scope types**

Extend `SettingsPanelContribution`:

```ts
section?: "general" | "appearance" | "search" | "plugins" | "about"
scope?: "global" | "workspace" | "plugin" | "instance"
```

Defaults:

- `section`: old id inference.
- `scope`: `"workspace"`.

- [ ] **Step 3: Update official settings panels**

Declare explicit section/scope for plugin manager and workspace settings.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add explicit settings panel sections"
```

## Task 9: Phase X5 - Widget Instance Settings Path

**Files:**

- Modify: `packages/orchestrator/src/context-menu-model.ts`
- Modify: `packages/orchestrator/src/context-menu-model.test.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`

- [ ] **Step 1: Write failing tests**

Context menu includes “实例设置” only when widget has registered `views.settings`.

- [ ] **Step 2: Extend context menu model**

Add optional instance settings action before remove.

- [ ] **Step 3: Wire app settings surface**

Open instance settings view using existing plugin view boundary and instance-scoped plugin data.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add widget instance settings path"
```

## Task 10: Phase X6 - Workspace Presets

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Create: `packages/orchestrator/src/workspace-preset.ts`
- Create: `packages/orchestrator/src/workspace-preset.test.ts`
- Modify: `apps/playground/src/defaultWorkspaceSeed.ts`
- Modify official plugins / builtin registry as needed.

- [ ] **Step 1: Write failing tests**

Official preset generates current default workspace and instances.

- [ ] **Step 2: Add API type**

Add `WorkspacePresetContribution` and `workspacePresets?: WorkspacePresetContribution[]`.

- [ ] **Step 3: Implement preset applier**

Generate workspace + instances from preset without overwriting existing workspace.

- [ ] **Step 4: Convert official default seed**

Represent current default workspace as official preset contribution.

- [ ] **Step 5: Verify and commit**

Commit:

```bash
git commit -m "feat: add workspace presets"
```

## Task 11: Phase X7 - Host Capabilities

**Files:**

- Modify: `packages/host-adapters/src/index.ts`
- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Modify: `packages/platform-kernel/src/pluginKernel.ts`
- Modify plugin manager summary code/tests.

- [ ] **Step 1: Write failing compatibility tests**

Cover supported platform, required capabilities, skipped reason.

- [ ] **Step 2: Extend types**

Add:

- `apiVersion`
- `supportedPlatforms`
- `requiredCapabilities`
- expanded `HostCapabilities`.

- [ ] **Step 3: Implement compatibility check**

Kernel discover/activate records skipped incompatible plugins.

- [ ] **Step 4: Display compatibility in plugin manager**

Plugin manager shows skipped reason.

- [ ] **Step 5: Verify and commit**

Commit:

```bash
git commit -m "feat: add host capability compatibility checks"
```

## Task 12: Phase X7 - Storage Adapter Port

**Files:**

- Modify: `packages/storage/src/database.ts`
- Modify repository factories in `packages/storage/src/*Repository.ts`
- Modify: `packages/workbench-app/src/bootstrap.ts`
- Add storage adapter tests.

- [ ] **Step 1: Write failing adapter tests**

Default web adapter and fake adapter both satisfy repository tests.

- [ ] **Step 2: Add `StorageAdapter`**

Keep `createTaboraDatabase` compatibility export.

- [ ] **Step 3: Wire bootstrap**

`createWorkbenchRuntimeBootstrap` accepts optional storage adapter.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "refactor: introduce storage adapter port"
```

## Task 13: Phase X7 - Background Source Contract

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Modify background resolver files in apps/workbench helpers.
- Add tests.

- [ ] **Step 1: Write failing tests**

Cover css, image, video, gradient source and renderer fallback.

- [ ] **Step 2: Add `BackgroundSourceValue`**

Provider source supports `css | image | video | gradient | canvas`.

- [ ] **Step 3: Update resolver**

Prefer `source`; fallback to `defaultCss`.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add background source contract"
```

## Task 14: Phase X8 - Plugin Loader Abstraction

**Files:**

- Create: `packages/platform-kernel/src/pluginLoader.ts`
- Create: `packages/platform-kernel/src/pluginLoader.test.ts`
- Modify: `packages/platform-kernel/src/index.ts`
- Modify builtin registry bootstrap as needed.

- [ ] **Step 1: Write failing loader tests**

Cover builtin loader output, invalid manifest rejection, source recording.

- [ ] **Step 2: Implement loader abstraction**

Add `PluginLoader`, `PluginLoadResult`, `PluginSource`.

- [ ] **Step 3: Wire builtin path**

Current builtin plugins go through builtin loader.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add plugin loader abstraction"
```

## Task 15: Phase X8 - Package Format + API Compatibility

**Files:**

- Modify: `packages/platform-kernel/src/pluginLoader.ts`
- Add compatibility helper tests.
- Modify builtin plugin manifests to include `apiVersion`.

- [ ] **Step 1: Write failing compatibility tests**

Compatible loads, future major skipped, missing apiVersion warns for builtin legacy.

- [ ] **Step 2: Add package manifest shape**

Trusted local plugin package has package metadata + Tabora manifest + entry path.

- [ ] **Step 3: Add apiVersion helper**

Implement semver-major compatibility check for platform API.

- [ ] **Step 4: Verify and commit**

Commit:

```bash
git commit -m "feat: add plugin api compatibility checks"
```

## Task 16: Phase X8 - Dependency Boundary Guard

**Files:**

- Create: `packages/orchestrator/src/plugin-boundary.test.ts` or `tooling` test.

- [ ] **Step 1: Write failing boundary test**

Scan plugin source imports and forbid:

- `@tabora/workbench-shell`
- `@tabora/storage`
- app source paths

- [ ] **Step 2: Implement boundary scanner**

Allow:

- `@tabora/plugin-api`
- `@tabora/platform-kernel`
- `@tabora/ui`
- `solid-js`
- declared UI libs

- [ ] **Step 3: Verify and commit**

Commit:

```bash
git commit -m "test: guard plugin dependency boundaries"
```

## Task 17: Docs + Final Verification

**Files:**

- Modify: `docs/README.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- Modify: `docs/product/tabora-plugin-workbench-prd.md` when product surface changed.
- Modify: `docs/product/tabora-official-plugins-design.md` for official preset/settings/commands.
- Modify: `AGENTS.md` if architecture rules changed.

- [ ] **Step 1: Sync docs**

Update current status and new facts from Tasks 2-16.

- [ ] **Step 2: Run final verification**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

If UI surface changed, also start playground and inspect default workbench, settings, command palette, context menu, layout switch, and drag sorting.

- [ ] **Step 3: Commit**

Commit:

```bash
git commit -m "docs: sync plugin extensibility completion status"
```
