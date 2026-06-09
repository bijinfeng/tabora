# Tabora Architecture Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the main architecture gaps found in the 2026-06-09 review: contribution ownership, permission-safe external opening, plugin lifecycle semantics, layout host contract coverage, and stale API/documentation drift.

**Architecture:** Keep `@tabora/plugin-api` as the protocol source, `@tabora/orchestrator` as the pure contribution catalog/model layer, `@tabora/platform-kernel` as lifecycle/registry owner, and `@tabora/workbench-app` as shell composition/runtime glue. The highest-priority changes add explicit owner metadata to runtime contribution descriptors and make plugin enable/disable remove capabilities from the active runtime graph instead of only updating metadata.

**Tech Stack:** pnpm workspace, Solid, TypeScript, Vitest, Dexie, Zod, Vite+.

---

## File Map

- `packages/plugin-api/src/manifest.ts`: add owned runtime descriptor types for search providers and future contribution ownership.
- `packages/plugin-api/src/index.ts`: continue exporting protocol/runtime descriptor types.
- `packages/orchestrator/src/plugin-catalog.ts`: return owner-aware descriptors from catalog list/find methods and filter active contributions.
- `packages/orchestrator/src/plugin-catalog.test.ts`: cover owner metadata and disabled plugin filtering.
- `packages/workbench-app/src/search/WorkbenchInlineSearchViewProps.ts`: use provider owner for external-open permission checks.
- `packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.ts`: pass only permission-checked open functions to search surfaces.
- `packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.test.ts`: verify CommandPalette uses provider owner.
- `packages/workbench-shell/src/CommandPalette.tsx`: change `openExternal` prop to accept provider owner.
- `packages/workbench-shell/src/CommandPalette.test.tsx`: verify web search passes `provider.pluginId`.
- `packages/platform-kernel/src/extensionRegistry.ts`: make view registration disposable.
- `packages/platform-kernel/src/pluginKernel.ts`: track activation disposers, unregister plugin views, avoid duplicate activation.
- `packages/platform-kernel/src/pluginKernel.test.ts`: cover enable/disable lifecycle.
- `packages/platform-kernel/src/runtimeContext.ts`: remove or formalize unused config APIs; first pass removes them because widget `props.data` is the real storage path.
- `packages/platform-kernel/src/runtimeContext.test.ts`: remove config assumptions and keep permission tests.
- `packages/workbench-app/src/layout/WorkbenchShellLayoutHost.ts`: implement `menu` global actions.
- `packages/workbench-app/src/layout/WorkbenchShellLayoutHost.test.ts`: cover `menu` surface.
- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`: add plugin scope wrapper in safe layout fallback.
- `packages/workbench-app/src/layout/WorkbenchShellLayoutRenderer.test.tsx` or `packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx`: cover safe layout scoped rendering.
- `packages/storage/src/database.ts`: decide whether unused tables stay as explicit future ports or are removed before release.
- `docs/technical/tabora-plugin-workbench-technical-design-v2.md`: sync architecture facts after implementation.
- `docs/technical/tabora-architecture-optimization-recommendations.md`: record this round of optimization and remaining deferrals.
- `AGENTS.md`, `docs/technical/extension-github-actions-publish.md`, `package.json`: align pnpm version.

---

## Phase 1: Contribution Ownership And Permission-Safe Search

### Task 1: Add owner-aware search provider descriptors

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/orchestrator/src/plugin-catalog.ts`
- Test: `packages/orchestrator/src/plugin-catalog.test.ts`

- [ ] **Step 1: Write failing catalog tests**

Add tests proving search providers carry owner metadata and disabled plugins do not contribute active providers:

```ts
it("lists search providers with owner metadata", () => {
  const catalog = createPluginCatalog([
    plugin({
      id: "plugin.search",
      contributes: {
        searchProviders: [
          {
            id: "provider.search",
            title: "Provider",
            urlTemplate: "https://example.com?q={query}",
          },
        ],
      },
    }),
  ])

  expect(catalog.listSearchProviders()).toEqual([
    expect.objectContaining({
      id: "provider.search",
      pluginId: "plugin.search",
      pluginName: "Plugin Search",
    }),
  ])
})

it("excludes disabled plugins from active contribution lists but keeps summaries", () => {
  const disabled = plugin({
    id: "plugin.disabled",
    enabled: false,
    contributes: {
      searchProviders: [
        {
          id: "provider.disabled",
          title: "Disabled",
          urlTemplate: "https://disabled.example?q={query}",
        },
      ],
      widgets: [
        {
          id: "disabled-widget",
          title: "Disabled Widget",
          supportedSizes: ["S"],
          defaultSize: "S",
          allowMultipleInstances: true,
          views: { card: "disabled.view" },
        },
      ],
    },
  })

  const catalog = createPluginCatalog([disabled])

  expect(catalog.listSearchProviders()).toEqual([])
  expect(catalog.listWidgetContributions()).toEqual([])
  expect(catalog.pluginSummaries()).toEqual([
    expect.objectContaining({ id: "plugin.disabled", enabled: false }),
  ])
})
```

Run:

```bash
pnpm --filter @tabora/orchestrator test -- plugin-catalog
```

Expected: FAIL because providers do not yet include `pluginId` / `pluginName` and active lists do not filter disabled plugins.

- [ ] **Step 2: Add descriptor type**

In `packages/plugin-api/src/manifest.ts`, add:

```ts
export type OwnedContributionDescriptor = {
  pluginId: string
  pluginName: string
}

export type SearchProviderDescriptor = SearchProviderContribution & OwnedContributionDescriptor
```

- [ ] **Step 3: Update plugin catalog**

In `packages/orchestrator/src/plugin-catalog.ts`, import `SearchProviderDescriptor`, add an enabled helper, and update active contribution lists:

```ts
function activePlugins() {
  return plugins.filter((plugin) => plugin.enabled)
}

function listSearchProviders(): SearchProviderDescriptor[] {
  return activePlugins().flatMap((plugin) =>
    (plugin.manifest.contributes.searchProviders ?? []).map((provider) => ({
      ...provider,
      pluginId: plugin.manifest.id,
      pluginName: plugin.manifest.name,
    })),
  )
}
```

Apply the same `activePlugins()` source to `listThemes`, `listBackgroundProviders`, `listLayouts`, `listWidgetContributions`, and `listSettingsPanels`. Keep `pluginSummaries()` based on all `plugins`.

- [ ] **Step 4: Run catalog tests**

Run:

```bash
pnpm --filter @tabora/orchestrator test -- plugin-catalog
```

Expected: PASS.

### Task 2: Route inline search and command palette through provider owner permissions

**Files:**

- Modify: `packages/workbench-app/src/search/WorkbenchInlineSearchViewProps.ts`
- Modify: `packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.ts`
- Modify: `packages/workbench-shell/src/CommandPalette.tsx`
- Test: `packages/workbench-app/src/search/WorkbenchShellSearchSurfaces.test.ts`
- Test: `packages/workbench-shell/src/CommandPalette.test.tsx`

- [ ] **Step 1: Write failing CommandPalette test**

Add a test that proves provider owner is used:

```ts
it("opens web search through the selected provider owner", () => {
  const openExternal = vi.fn(() => true)
  render(() => (
    <CommandPalette
      isOpen
      query="tabora"
      activeIdx={0}
      onQueryChange={vi.fn()}
      onActiveIdxChange={vi.fn()}
      onClose={vi.fn()}
      commands={[]}
      providers={[
        {
          id: "provider.github",
          pluginId: "plugin.github-provider",
          pluginName: "GitHub Provider",
          title: "GitHub",
          urlTemplate: "https://github.com/search?q={query}",
        },
      ]}
      defaultProviderId="provider.github"
      openExternal={openExternal}
    />
  ), root)

  fireEvent.keyDown(root.querySelector(".cmd-input")!, { key: "Enter" })

  expect(openExternal).toHaveBeenCalledWith(
    "plugin.github-provider",
    "https://github.com/search?q=tabora",
  )
})
```

Run:

```bash
pnpm --filter @tabora/workbench-shell test -- CommandPalette
```

Expected: FAIL because `openExternal` currently only receives URL.

- [ ] **Step 2: Update CommandPalette prop contract**

Change:

```ts
openExternal?: (url: string) => boolean
```

to:

```ts
openExternal?: (pluginId: string, url: string) => boolean
```

Update `runWebSearch`:

```ts
function runWebSearch(provider: SearchProviderDescriptor, searchQuery: string) {
  const trimmed = searchQuery.trim()
  if (!trimmed) return
  if (!props.openExternal?.(provider.pluginId, buildSearchUrl(provider, trimmed))) return
  void props.onSaveHistory?.({ query: trimmed, providerId: provider.id })
}
```

- [ ] **Step 3: Update shell surface wiring**

In `WorkbenchShellSearchSurfaces.ts`, remove the direct host-open prop from CommandPalette and wire permission-checked owner open:

```ts
openExternal: options.openExternalForPlugin,
```

Then remove `openExternal: (url: string) => boolean` from `createWorkbenchSearchSurfaces` options if no longer needed.

- [ ] **Step 4: Update inline search to use target provider owner**

In `WorkbenchInlineSearchViewProps.ts`, replace:

```ts
const opened = options.openExternal(options.pluginId, buildSearchUrl(targetProvider, targetQuery))
```

with:

```ts
const opened = options.openExternal(
  targetProvider.pluginId,
  buildSearchUrl(targetProvider, targetQuery),
)
```

After this, `pluginId` in `buildWorkbenchInlineSearchViewProps` is only needed for the search view identity. Remove it from the open path, not necessarily from all props.

- [ ] **Step 5: Run targeted tests**

Run:

```bash
pnpm --filter @tabora/workbench-shell test -- CommandPalette
pnpm --filter @tabora/workbench-app test -- WorkbenchShellSearchSurfaces WorkbenchInlineSearchViewProps
pnpm --filter @tabora/orchestrator test -- search-model command-palette-model
```

Expected: PASS.

---

## Phase 2: Plugin Lifecycle And Active Runtime Graph

### Task 3: Make registry registration disposable and kernel disable real

**Files:**

- Modify: `packages/platform-kernel/src/extensionRegistry.ts`
- Modify: `packages/platform-kernel/src/runtimeContext.ts`
- Modify: `packages/platform-kernel/src/pluginKernel.ts`
- Test: `packages/platform-kernel/src/extensionRegistry.test.ts`
- Test: `packages/platform-kernel/src/pluginKernel.test.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Add tests:

```ts
it("unregisters plugin views when plugin is disabled", async () => {
  const plugin: BuiltinPlugin = {
    enabled: true,
    manifest: manifest({ id: "plugin.lifecycle" }),
    activate(context) {
      context.registry.views.register("plugin.lifecycle.view", () => "view")
    },
  }

  const kernel = createPluginKernel()
  await kernel.discover([plugin])
  await kernel.activateEnabledPlugins()

  expect(kernel.registry.views.has("plugin.lifecycle.view")).toBe(true)

  await kernel.setPluginEnabled("plugin.lifecycle", false)

  expect(kernel.registry.views.has("plugin.lifecycle.view")).toBe(false)
})

it("does not activate an already active plugin twice", async () => {
  const activate = vi.fn()
  const plugin: BuiltinPlugin = {
    enabled: true,
    manifest: manifest({ id: "plugin.once" }),
    activate,
  }

  const kernel = createPluginKernel()
  await kernel.discover([plugin])
  await kernel.activateEnabledPlugins()
  await kernel.setPluginEnabled("plugin.once", true)

  expect(activate).toHaveBeenCalledTimes(1)
})
```

Run:

```bash
pnpm --filter @tabora/platform-kernel test -- pluginKernel extensionRegistry
```

Expected: FAIL.

- [ ] **Step 2: Return disposer from `views.register`**

In `extensionRegistry.ts`:

```ts
export type ViewRegistry = {
  register(viewId: string, view: ViewComponent): () => void
  get(viewId: string): ViewComponent
  has(viewId: string): boolean
}
```

Implementation:

```ts
register(viewId, view) {
  views.set(viewId, view)
  return () => {
    if (views.get(viewId) === view) {
      views.delete(viewId)
    }
  }
}
```

- [ ] **Step 3: Scope plugin registrations in runtime context**

Add an optional registration collector:

```ts
registrationDisposers?: Array<() => void>
```

Wrap `registry.views.register` so plugin registrations are tracked:

```ts
const scopedRegistry: ExtensionRegistry = {
  ...options.registry,
  views: {
    ...options.registry.views,
    register(viewId, view) {
      const dispose = options.registry.views.register(viewId, view)
      options.registrationDisposers?.push(dispose)
      return dispose
    },
  },
}
```

Return `registry: scopedRegistry` from the context.

- [ ] **Step 4: Track activation disposers in kernel**

Change plugin activation type:

```ts
export type PluginActivationDispose = () => void

export type BuiltinPlugin = {
  manifest: PluginManifest
  styleAssetUrls?: Record<string, string>
  enabled: boolean
  activate(
    context: PluginRuntimeContext,
  ): void | PluginActivationDispose | Promise<void | PluginActivationDispose>
}
```

Inside `createPluginKernel`, maintain:

```ts
const activeDisposers = new Map<string, () => void>()
```

Activation helper:

```ts
async function activatePlugin(plugin: BuiltinPlugin) {
  if (activeDisposers.has(plugin.manifest.id)) return
  const registrationDisposers: Array<() => void> = []
  const context = createPluginRuntimeContext({
    pluginId: plugin.manifest.id,
    events,
    registry,
    grantedPermissions: plugin.manifest.permissions ?? [],
    registrationDisposers,
  })
  const explicitDispose = await plugin.activate(context)
  activeDisposers.set(plugin.manifest.id, () => {
    if (typeof explicitDispose === "function") explicitDispose()
    for (const dispose of registrationDisposers.toReversed()) dispose()
  })
}
```

Disable path:

```ts
if (!enabled) {
  activeDisposers.get(pluginId)?.()
  activeDisposers.delete(pluginId)
}
```

- [ ] **Step 5: Run lifecycle tests**

Run:

```bash
pnpm --filter @tabora/platform-kernel test -- pluginKernel extensionRegistry runtimeContext
```

Expected: PASS.

### Task 4: Make active catalog reflect plugin enabled state

**Files:**

- Modify: `packages/orchestrator/src/plugin-catalog.ts`
- Modify: `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- Test: `packages/orchestrator/src/plugin-catalog.test.ts`
- Test: `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.test.ts`

- [ ] **Step 1: Extend tests**

Add assertions that disabled plugin widgets disappear from add-widget modal and settings panels disappear from active panel list, while plugin manager summaries remain.

Use catalog-level tests first:

```ts
expect(catalog.listSettingsPanels()).toEqual([])
expect(catalog.pluginSummaries()).toHaveLength(1)
```

- [ ] **Step 2: Ensure skipped incompatible plugins become inactive**

In `pluginKernel.ts`, when compatibility check fails in `discover()` or activation, mutate the in-memory plugin:

```ts
if (reason) {
  plugin.enabled = false
}
```

This keeps active catalog filtering and persisted record status aligned.

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm --filter @tabora/platform-kernel test -- pluginKernel
pnpm --filter @tabora/orchestrator test -- plugin-catalog
pnpm --filter @tabora/workbench-app test -- WorkbenchShellWorkspaceController WorkbenchShellSurfaceProps
```

Expected: PASS.

---

## Phase 3: Layout Host Contract And Fallback Isolation

### Task 5: Implement `menu` global actions

**Files:**

- Modify: `packages/workbench-app/src/layout/WorkbenchShellLayoutHost.ts`
- Test: `packages/workbench-app/src/layout/WorkbenchShellLayoutHost.test.ts`
- Test: `plugins/community/layout-diy-masonry/src/index.test.tsx`

- [ ] **Step 1: Write failing host test**

Add:

```ts
it("builds menu actions for layouts without rail or toolbar", () => {
  const setCommandPaletteOpen = vi.fn()
  const setAddWidgetOpen = vi.fn()
  const openSettings = vi.fn()
  const switchLayout = vi.fn()
  const switchTheme = vi.fn()

  const host = createWorkbenchLayoutHostAPI(
    makeHostOptions({
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      switchLayout,
      switchTheme,
    }),
  )

  const menuActions = host.getGlobalActions("menu")
  expect(menuActions.map((action) => action.id)).toEqual([
    "command",
    "add-widget",
    "layout-switch",
    "theme",
    "settings",
  ])

  menuActions[0]!.run()
  menuActions[1]!.run()
  menuActions[4]!.run()

  expect(setCommandPaletteOpen).toHaveBeenCalledWith(true)
  expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
  expect(openSettings).toHaveBeenCalled()
})
```

Run:

```bash
pnpm --filter @tabora/workbench-app test -- WorkbenchShellLayoutHost
```

Expected: FAIL because `menu` returns `[]`.

- [ ] **Step 2: Add menu action list**

In `WorkbenchShellLayoutHost.ts`, add:

```ts
if (surface === "menu") {
  return [
    {
      id: "command",
      label: "命令",
      icon: "⌘K",
      shortcut: "⌘K",
      run: () => options.setCommandPaletteOpen(true),
    },
    {
      id: "add-widget",
      label: "添加卡片",
      icon: "+",
      run: () => options.setAddWidgetOpen(true),
    },
    layoutToggle,
    {
      id: "theme",
      label: options.isDark() ? "明亮" : "暗色",
      icon: options.isDark() ? "☀" : "☾",
      shortcut: "⌘T",
      run: () => {
        options.switchTheme(
          resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
        )
      },
    },
    {
      id: "settings",
      label: "设置",
      icon: "⚙",
      run: () => options.openSettings(options.shellConfig.settingsPanelIds.appearance),
    },
  ]
}
```

- [ ] **Step 3: Run layout tests**

Run:

```bash
pnpm --filter @tabora/workbench-app test -- WorkbenchShellLayoutHost WorkbenchShellLayoutRuntime
pnpm --filter @tabora/layout-diy-masonry test
```

Expected: PASS.

### Task 6: Preserve plugin style scope in safe layout fallback

**Files:**

- Modify: `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`
- Test: `packages/workbench-app/src/layout/WorkbenchShellLayoutRenderer.test.tsx`

- [ ] **Step 1: Write failing safe-layout scope test**

Add a test that renders safe layout with one widget and expects:

```ts
expect(host.querySelector('[data-tabora-plugin-id="plugin.widget"]')).toBeTruthy()
```

Expected: FAIL because safe layout currently renders the widget view directly.

- [ ] **Step 2: Add scope wrapper**

In `SafeWorkbenchLayout`, replace:

```tsx
<PluginViewBoundary instanceId={instance.id} title={model.title}>
  {View(props.buildWidgetViewProps(instance, model))}
</PluginViewBoundary>
```

with:

```tsx
<PluginViewBoundary instanceId={instance.id} title={model.title}>
  <div data-tabora-plugin-id={instance.pluginId}>
    {View(props.buildWidgetViewProps(instance, model))}
  </div>
</PluginViewBoundary>
```

- [ ] **Step 3: Run fallback tests**

Run:

```bash
pnpm --filter @tabora/workbench-app test -- WorkbenchShellLayoutRenderer
```

Expected: PASS.

---

## Phase 4: Remove Stale Or Misleading API Surface

### Task 7: Remove unused runtime config API

**Files:**

- Modify: `packages/platform-kernel/src/runtimeContext.ts`
- Modify: `packages/platform-kernel/src/runtimeContext.test.ts`
- Check: all plugin packages under `plugins/official/**` and `packages/official-plugins/src/**`

- [ ] **Step 1: Confirm no production callers**

Run:

```bash
rg -n "getConfig\\(|setConfig\\(|configStore|RuntimeConfigScope|RuntimeConfigStore" packages plugins apps
```

Expected: only `runtimeContext.ts` definitions appear.

- [ ] **Step 2: Remove config types and fields**

Delete:

```ts
export type RuntimeConfigScope = ...
export type RuntimeConfigStore = ...
getConfig<T = unknown>(scope: RuntimeConfigScope): T | undefined
setConfig<T = unknown>(scope: RuntimeConfigScope, value: T): Promise<void>
configStore?: RuntimeConfigStore
const config = new Map<string, unknown>()
function keyFor(...)
```

Keep widget persistence through `WidgetViewProps["data"]`.

- [ ] **Step 3: Run kernel and workspace tests**

Run:

```bash
pnpm --filter @tabora/platform-kernel test -- runtimeContext pluginKernel
pnpm --filter @tabora/workbench-app test -- WorkbenchShellViewRuntime WorkbenchShellInstanceRenderer
```

Expected: PASS.

### Task 8: Decide `@tabora/ui` boundary and make it explicit

**Files:**

- Modify: `DESIGN.md`
- Modify: `docs/product/tabora-design-system.md`
- Optional Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Choose the boundary**

Use this decision for MVP:

```txt
@tabora/ui may export low-level accessible primitives such as Dialog, Drawer, Popover, ContextMenu, Toast.
@tabora/ui must not export Tabora-specific host containers such as WorkbenchRail, WorkbenchGrid, SettingsHost, WidgetCardShell, global CommandPalette, or shell-owned ToastHost.
```

- [ ] **Step 2: Update docs**

Update `DESIGN.md` and `docs/product/tabora-design-system.md` to clarify primitive vs host container naming. Keep `SettingsHost`, `WidgetCardShell`, `ToastHost`, and shell `CommandPalette` in `@tabora/workbench-shell`.

- [ ] **Step 3: Add architecture guard if needed**

If the docs say `@tabora/ui` must not export `CommandPalette`, either remove that export or add an explicit exception for generic primitive command palette. Do not leave docs and exports contradictory.

- [ ] **Step 4: Run checks**

Run:

```bash
pnpm check
```

Expected: PASS.

---

## Phase 5: Data Model And Documentation Drift

### Task 9: Resolve storage table drift

**Files:**

- Modify: `packages/storage/src/database.ts`
- Modify: `packages/storage/src/database.test.ts`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`

- [ ] **Step 1: Pick MVP table policy**

Recommended MVP policy:

```txt
Keep tables only when they have a repository or an active runtime path.
Remove permissionGrants, eventLogs, searchHistory, shortcutBindings until the corresponding ports exist.
Continue storing current search history in pluginData because it is plugin-owned workspace data.
```

- [ ] **Step 2: Update Dexie schema and tests**

Remove unused table properties and store entries from `database.ts`, then update `database.test.ts` expected table list.

- [ ] **Step 3: Run storage tests**

Run:

```bash
pnpm --filter @tabora/storage test
```

Expected: PASS.

### Task 10: Sync docs and toolchain facts

**Files:**

- Modify: `AGENTS.md`
- Modify: `docs/technical/extension-github-actions-publish.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- Modify: `docs/technical/tabora-architecture-optimization-recommendations.md`

- [ ] **Step 1: Align pnpm version**

Choose `package.json` as source of truth for package manager:

```txt
pnpm 11.5.2
```

Update `AGENTS.md` and extension publish docs from `11.3.0` to `11.5.2`.

- [ ] **Step 2: Record architecture changes**

In technical design V2, add short notes for:

- search providers are owner-aware runtime descriptors;
- external open from search uses provider owner permission;
- plugin disable disposes registered views and filters active contributions;
- layout host `menu` surface is a first-class global action surface;
- runtime config API removed in favor of explicit widget data props.

- [ ] **Step 3: Update optimization recommendations**

Move completed review items into a new `2026-06-09 optimization round` section and list deferred items, if any.

- [ ] **Step 4: Run docs/config check**

Run:

```bash
pnpm check
```

Expected: PASS.

---

## Phase 6: Regression Guardrails

### Task 11: Add architecture checks for the new invariants

**Files:**

- Modify: `scripts/lib/governance.mjs`
- Test: `tooling/vitest/governance.test.ts`

- [ ] **Step 1: Add guard tests**

Add tests covering:

```txt
- CommandPaletteProps.openExternal must not be typed as (url: string) => boolean.
- createWorkbenchLayoutHostAPI must contain an explicit `surface === "menu"` branch.
- runtimeContext production source must not expose getConfig/setConfig.
- SafeWorkbenchLayout must include data-tabora-plugin-id around plugin views.
```

- [ ] **Step 2: Implement scanners**

Add pattern checks in `governance.mjs` for the four invariants above. Keep them narrow and file-scoped to avoid false positives.

- [ ] **Step 3: Run architecture tests**

Run:

```bash
pnpm --filter @tabora/vitest test -- governance
pnpm check:architecture
```

Expected: PASS.

---

## Final Verification

Run the full regression set after all phases:

```bash
pnpm check:architecture
pnpm test
pnpm check
pnpm build
```

For the frontend/runtime behavior touched here, also run:

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

Manual smoke:

- default dashboard renders;
- CommandPalette web search opens only through provider-owner permission;
- inline search still opens enabled providers;
- disabling a widget plugin removes its add-widget contribution and unregisters views;
- DIY Masonry menu shows command/add/layout/theme/settings actions;
- forced layout error falls back to safe layout and widget plugin styles still apply.

---

## Execution Order Recommendation

1. Phase 1 first: closes the permission/security architecture gap.
2. Phase 2 second: makes plugin enable/disable semantics honest.
3. Phase 3 third: small user-visible contract fix with low blast radius.
4. Phase 4 and 5 fourth: cleanup and docs, after behavior is stable.
5. Phase 6 last: freeze the new invariants in governance checks.
