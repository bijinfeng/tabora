# Settings Host Workspace Settings Implementation Plan

> **归档状态：** 本计划已不在默认实施路径中。仅在用户明确要求继续或审查该计划时使用；当前事实源以 `docs/README.md` 登记的 PRD、设计、技术方案 V2 和回归基准为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the MVP settings host so Tabora opens plugin-contributed settings panels for plugins, appearance, and search from the workbench rail.

**Architecture:** `@tabora/plugin-api` owns the settings panel contract and lightweight view props. `@tabora/official-plugins` contributes official settings panels and keeps panel content inside plugin views. `apps/playground` remains the host: it opens/closes the settings container, gathers settings panel contributions, wires workspace mutations, passes explicit props to plugin views, and keeps modal/fullscreen/settings containers outside `@tabora/ui`.

**Tech Stack:** Solid, TypeScript, pnpm workspace, Vite+, Vitest, Vitest Browser Mode + Playwright provider, Dexie/IndexedDB, `@tabora/ui`.

**Coordination note:** Do not auto-commit unless the user explicitly asks. The root `package.json` may already contain user edits; avoid unrelated changes to it.

---

## File Structure

- Modify: `packages/plugin-api/src/manifest.ts`
  - Add `order?: number` to `SettingsPanelContribution`.
  - Export `SettingsPanelViewProps`, `SearchViewProps`, and `WorkbenchSearchSettings`.
- Modify: `packages/plugin-api/src/manifestSchema.ts`
  - Accept optional `settingsPanels[].order`.
- Modify: `packages/plugin-api/src/manifestSchema.test.ts`
  - Cover an ordered settings panel contribution.
- Create: `packages/official-plugins/src/settings-workspace.tsx`
  - Export `AppearanceSettingsPanel`, `SearchSettingsPanel`, and `officialSettingsWorkspace`.
- Modify: `packages/official-plugins/src/plugin-manager.tsx`
  - Accept plugin list through props; keep `officialPlugins` fallback for widget/modal compatibility.
  - Render permissions summary.
- Modify: `packages/official-plugins/src/plugin-manager-entry.ts`
  - Add `order: 10` to `official.settings.plugins`.
- Modify: `packages/official-plugins/src/search-command-bar.tsx`
  - Remove hardcoded provider source from the view.
  - Read providers/default provider from props.
  - Build search URLs from `SearchProviderContribution.urlTemplate`.
- Modify: `packages/official-plugins/src/index.ts`
  - Export and register `officialSettingsWorkspace`.
- Create: `apps/playground/src/settingsHost.tsx`
  - Host-level settings container, navigation, close button, and panel rendering.
- Create: `apps/playground/src/settingsHost.test.tsx`
  - Unit tests for panel collection/sorting, default selection, and panel error containment.
- Modify: `apps/playground/src/workbenchShell.ts`
  - Change rail action model so plugins/settings open settings host panels instead of plugin-manager modal.
- Modify: `apps/playground/src/workbenchShell.test.tsx`
  - Update rail action expectations.
- Modify: `apps/playground/src/App.tsx`
  - Gather settings panels, themes, backgrounds, and search providers from plugin contributions.
  - Pass settings host props.
  - Persist `workspace.config.search.defaultProviderId`.
  - Pass `SearchViewProps` into command search.
  - Remove or keep only temporary top toolbar controls depending on final UI polish in this task.
- Modify: `apps/playground/src/app.css`
  - Add settings host shell styles.
  - Keep host container styles in playground, not `@tabora/ui`.
- Modify: `apps/playground/src/workbenchDashboard.e2e.test.tsx`
  - Cover opening settings, switching appearance/search panels, changing default search provider, and mobile no-horizontal-overflow.
- Modify: `docs/product/tabora-plugin-workbench-prd.md`
  - Mark lightweight settings host as implemented for MVP.
- Modify: `docs/product/tabora-official-plugins-design.md`
  - Update official settings workspace and implementation gap tables.
- Modify: `docs/technical/tabora-plugin-workbench-technical-design.md`
  - Record settings host props, host responsibilities, and remaining follow-ups.

---

## Task 1: Extend Settings Panel Contract

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Test: `packages/plugin-api/src/manifestSchema.test.ts`

- [ ] **Step 1: Write the failing schema test**

Add this test to `packages/plugin-api/src/manifestSchema.test.ts`:

```ts
it("accepts an ordered settings panel contribution", () => {
  const result = pluginManifestSchema.safeParse({
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    entry: "./settings-workspace",
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.workspace.appearance",
          title: "外观",
          view: "official.settings.workspace.appearance.view",
          order: 20,
        },
      ],
    },
  })

  expect(result.success).toBe(true)
  expect(result.success ? result.data.contributes.settingsPanels?.[0]?.order : undefined).toBe(20)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm test -- packages/plugin-api/src/manifestSchema.test.ts
```

Expected: FAIL because `settingsPanels[].order` is not accepted yet.

- [ ] **Step 3: Add settings panel props and order to the TypeScript contract**

Update `packages/plugin-api/src/manifest.ts`:

```ts
export type WorkbenchSearchSettings = {
  defaultProviderId: string
}

export type SearchViewProps = {
  providers: SearchProviderContribution[]
  defaultProviderId: string
  openExternal?: (url: string) => void
  onDefaultProviderChange?: (providerId: string) => void | Promise<void>
}

export type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
  host: {
    close(): void
    setDirty(isDirty: boolean): void
    switchTheme(themeId: string): Promise<void>
    switchBackground(backgroundId: string): Promise<void>
    setDefaultSearchProvider(providerId: string): Promise<void>
  }
  workspace: Workspace
  themes: ThemeContribution[]
  backgrounds: BackgroundProviderContribution[]
  searchProviders: SearchProviderContribution[]
  searchSettings: WorkbenchSearchSettings
  plugins: Array<{
    id: string
    name: string
    version: string
    enabled: boolean
    permissions: PluginPermission[]
    contributes: PluginManifest["contributes"]
  }>
}

export type SettingsPanelContribution = {
  id: string
  title: string
  view: string
  order?: number
}
```

`SettingsPanelViewProps` references `Workspace`, which is exported later from `workspace.ts`. Keep type-only cycles safe by adding this import at the top of `manifest.ts`:

```ts
import type { Workspace } from "./workspace"
```

- [ ] **Step 4: Add `order` to the Zod schema**

Update the `settingsPanels` object in `packages/plugin-api/src/manifestSchema.ts`:

```ts
settingsPanels: z
  .array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      view: z.string().min(1),
      order: z.number().int().optional(),
    }),
  )
  .optional(),
```

- [ ] **Step 5: Re-run the focused test and verify it passes**

Run:

```bash
pnpm test -- packages/plugin-api/src/manifestSchema.test.ts
```

Expected: PASS.

---

## Task 2: Add Official Workspace Settings Panels

**Files:**

- Create: `packages/official-plugins/src/settings-workspace.tsx`
- Modify: `packages/official-plugins/src/plugin-manager.tsx`
- Modify: `packages/official-plugins/src/plugin-manager-entry.ts`
- Modify: `packages/official-plugins/src/index.ts`
- Test: package typecheck through `pnpm check`

- [ ] **Step 1: Create the workspace settings plugin**

Create `packages/official-plugins/src/settings-workspace.tsx`:

```tsx
import { For } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { Badge, CardSection, Field, ListRow, Select } from "@tabora/ui"

function backgroundOptions(props: SettingsPanelViewProps) {
  return props.backgrounds.map((background) => ({
    value: background.id,
    label: background.title,
  }))
}

function themeOptions(props: SettingsPanelViewProps) {
  return props.themes.map((theme) => ({
    value: theme.id,
    label: theme.title,
  }))
}

function searchProviderOptions(props: SettingsPanelViewProps) {
  return props.searchProviders.map((provider) => ({
    value: provider.id,
    label: provider.shortcut ? `${provider.title} (${provider.shortcut})` : provider.title,
  }))
}

export function AppearanceSettingsPanel(props: SettingsPanelViewProps) {
  const themes = () => themeOptions(props)
  const backgrounds = () => backgroundOptions(props)
  const themeValue = () => props.workspace.activeThemeId
  const backgroundValue = () =>
    props.workspace.activeBackgroundProviderId ?? backgrounds()[0]?.value ?? ""

  return (
    <CardSection title="外观">
      <div class="settings-panel-stack">
        <Field label="主题" htmlFor="settings-theme-select">
          <Select
            id="settings-theme-select"
            value={themeValue()}
            options={themes()}
            onChange={(value) => void props.host.switchTheme(value)}
            aria-label="选择主题"
          />
        </Field>
        <Field label="背景" htmlFor="settings-background-select">
          <Select
            id="settings-background-select"
            value={backgroundValue()}
            options={backgrounds()}
            onChange={(value) => void props.host.switchBackground(value)}
            aria-label="选择背景"
          />
        </Field>
      </div>
    </CardSection>
  )
}

export function SearchSettingsPanel(props: SettingsPanelViewProps) {
  const providers = () => searchProviderOptions(props)
  const value = () => props.searchSettings.defaultProviderId || providers()[0]?.value || ""

  return (
    <CardSection title="搜索">
      <div class="settings-panel-stack">
        <Field label="默认搜索源" htmlFor="settings-search-provider-select">
          <Select
            id="settings-search-provider-select"
            value={value()}
            options={providers()}
            onChange={(providerId) => void props.host.setDefaultSearchProvider(providerId)}
            aria-label="选择默认搜索源"
          />
        </Field>
        <ul class="settings-provider-list">
          <For each={props.searchProviders}>
            {(provider) => (
              <li>
                <ListRow
                  primary={provider.title}
                  secondary={provider.urlTemplate}
                  trailing={
                    provider.id === value() ? (
                      <Badge variant="accent">默认</Badge>
                    ) : provider.shortcut ? (
                      <Badge>{provider.shortcut}</Badge>
                    ) : null
                  }
                />
              </li>
            )}
          </For>
        </ul>
      </div>
    </CardSection>
  )
}

export const officialSettingsWorkspace: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.settings.workspace",
    name: "Workspace Settings",
    version: "0.0.0",
    entry: "./settings-workspace",
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.workspace.appearance",
          title: "外观",
          view: "official.settings.workspace.appearance.view",
          order: 20,
        },
        {
          id: "official.settings.workspace.search",
          title: "搜索",
          view: "official.settings.workspace.search.view",
          order: 30,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.settings.workspace.appearance.view",
      AppearanceSettingsPanel,
    )
    context.registry.views.register("official.settings.workspace.search.view", SearchSettingsPanel)
  },
}
```

- [ ] **Step 2: Update plugin manager props while preserving fallback**

Replace `packages/official-plugins/src/plugin-manager.tsx` with:

```tsx
import { For } from "solid-js"
import type { PluginManifest, PluginPermission, SettingsPanelViewProps } from "@tabora/plugin-api"
import { Badge, CardSection, ListRow } from "@tabora/ui"
import { officialPlugins } from "./index"

type PluginSummary = SettingsPanelViewProps["plugins"][number]

type PluginManagerCardProps = Partial<Pick<SettingsPanelViewProps, "plugins">>

function contributionLabels(contributes: PluginManifest["contributes"]): string[] {
  const extensions: string[] = []
  if (contributes.layouts?.length) extensions.push("布局")
  if (contributes.widgets?.length) extensions.push(`卡片 (${contributes.widgets.length})`)
  if (contributes.searches?.length) extensions.push("搜索")
  if (contributes.searchProviders?.length) extensions.push("搜索源")
  if (contributes.backgroundProviders?.length) extensions.push("背景")
  if (contributes.backgroundRenderers?.length) extensions.push("背景渲染")
  if (contributes.themes?.length) extensions.push("主题")
  if (contributes.settingsPanels?.length) extensions.push("设置")
  return extensions
}

function permissionLabel(permission: PluginPermission): string {
  switch (permission.type) {
    case "external-open":
      return `外部打开: ${permission.hosts.join(", ")}`
    case "storage":
      return `存储: ${permission.scope}`
    case "workspace":
      return `工作区: ${permission.access}`
    case "network":
      return `网络: ${permission.hosts.join(", ")}`
    case "clipboard":
      return `剪贴板: ${permission.access}`
    case "local-file":
      return `本地文件: ${permission.access}`
  }
}

function fallbackPlugins(): PluginSummary[] {
  return officialPlugins.map((plugin) => ({
    id: plugin.manifest.id,
    name: plugin.manifest.name,
    version: plugin.manifest.version,
    enabled: plugin.enabled,
    permissions: plugin.manifest.permissions ?? [],
    contributes: plugin.manifest.contributes,
  }))
}

export function PluginManagerCard(props: PluginManagerCardProps = {}) {
  const plugins = () => props.plugins ?? fallbackPlugins()

  return (
    <CardSection title="官方插件">
      <ul class="plugin-list">
        <For each={plugins()}>
          {(plugin) => {
            const extensions = contributionLabels(plugin.contributes)
            const permissions = plugin.permissions.map(permissionLabel)
            return (
              <li class="plugin-item">
                <ListRow
                  primary={plugin.name}
                  secondary={
                    <span>
                      <span class="plugin-id-mono">{plugin.id}</span>
                      <span> · v{plugin.version}</span>
                      {extensions.length > 0 ? <span> · {extensions.join(" · ")}</span> : null}
                      {permissions.length > 0 ? (
                        <span> · 权限 {permissions.join(" / ")}</span>
                      ) : null}
                    </span>
                  }
                  trailing={
                    <Badge variant={plugin.enabled ? "accent" : "neutral"}>
                      {plugin.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  }
                />
              </li>
            )
          }}
        </For>
      </ul>
    </CardSection>
  )
}
```

- [ ] **Step 3: Add plugin panel order**

Update the `settingsPanels` entry in `packages/official-plugins/src/plugin-manager-entry.ts`:

```ts
settingsPanels: [
  {
    id: "official.settings.plugins",
    title: "插件",
    view: "official.plugin-manager.card",
    order: 10,
  },
],
```

- [ ] **Step 4: Register the workspace settings plugin in the official pack**

Update `packages/official-plugins/src/index.ts`:

```ts
export { officialSettingsWorkspace } from "./settings-workspace"
```

Add the import:

```ts
import { officialSettingsWorkspace } from "./settings-workspace"
```

Add the plugin after `officialPluginManager` in `officialPlugins`:

```ts
export const officialPlugins = [
  officialThemeDefaultPack,
  officialBackgroundBasic,
  officialLayoutWorkbenchDashboard,
  officialLayoutTopSearchGrid,
  officialSearchCommandBar,
  officialSearchProvidersBasic,
  officialWidgetsProductivity,
  officialPluginManager,
  officialSettingsWorkspace,
]
```

- [ ] **Step 5: Run workspace check for type errors**

Run:

```bash
pnpm check
```

Expected: may FAIL if `SettingsPanelViewProps` has not been wired into playground yet. If the only failures are downstream missing props in `App.tsx`, continue to Task 3 before claiming success.

---

## Task 3: Add Settings Host Utilities And Container

**Files:**

- Create: `apps/playground/src/settingsHost.tsx`
- Create: `apps/playground/src/settingsHost.test.tsx`
- Modify: `apps/playground/src/app.css`

- [ ] **Step 1: Write settings host unit tests**

Create `apps/playground/src/settingsHost.test.tsx`:

```tsx
import { createComponent, createRoot } from "solid-js"
import type { SettingsPanelContribution } from "@tabora/plugin-api"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  SettingsHost,
  collectSettingsPanels,
  resolveInitialSettingsPanelId,
  type SettingsPanelDescriptor,
} from "./settingsHost"

const mounts: Array<{ root: HTMLElement; dispose: () => void }> = []

afterEach(() => {
  for (const { dispose, root } of mounts.splice(0)) {
    dispose()
    root.remove()
  }
})

function mount(view: () => Element) {
  const root = document.createElement("div")
  document.body.append(root)
  let dispose = () => {}
  createRoot((rootDispose) => {
    dispose = rootDispose
    root.append(view())
  })
  mounts.push({ root, dispose })
  return root
}

function panel(id: string, order?: number): SettingsPanelContribution {
  return { id, title: id, view: `${id}.view`, order }
}

describe("settings host composition", () => {
  it("collects settings panels sorted by order and title", () => {
    const plugins = [
      {
        manifest: {
          id: "plugin-b",
          contributes: { settingsPanels: [panel("search", 30), panel("appearance", 20)] },
        },
      },
      {
        manifest: {
          id: "plugin-a",
          contributes: { settingsPanels: [panel("plugins", 10), panel("fallback")] },
        },
      },
    ]

    expect(collectSettingsPanels(plugins).map((item) => item.id)).toEqual([
      "plugins",
      "appearance",
      "search",
      "fallback",
    ])
  })

  it("uses requested panel when available and falls back to the first panel", () => {
    const panels: SettingsPanelDescriptor[] = [
      { ...panel("plugins", 10), pluginId: "plugin-a" },
      { ...panel("search", 30), pluginId: "plugin-b" },
    ]

    expect(resolveInitialSettingsPanelId(panels, "search")).toBe("search")
    expect(resolveInitialSettingsPanelId(panels, "missing")).toBe("plugins")
  })

  it("keeps the settings container open when a panel view fails", () => {
    const panels: SettingsPanelDescriptor[] = [
      { id: "broken", title: "Broken", view: "broken.view", order: 10, pluginId: "plugin-a" },
    ]
    const views = new Map<string, any>([
      [
        "broken.view",
        () => {
          throw new Error("settings exploded")
        },
      ],
    ])

    const root = mount(() =>
      createComponent(SettingsHost, {
        open: true,
        panels,
        activePanelId: "broken",
        onPanelChange: vi.fn(),
        onClose: vi.fn(),
        getView: (viewId) => views.get(viewId),
        panelProps: () => ({
          panelId: "broken",
          pluginId: "plugin-a",
          host: {
            close: vi.fn(),
            setDirty: vi.fn(),
            switchTheme: vi.fn(),
            switchBackground: vi.fn(),
            setDefaultSearchProvider: vi.fn(),
          },
          workspace: {
            id: "default",
            name: "默认工作区",
            activeLayoutId: "official.layout.workbench-dashboard",
            activeThemeId: "official.theme.light",
            regions: {},
            createdAt: "",
            updatedAt: "",
          },
          themes: [],
          backgrounds: [],
          searchProviders: [],
          searchSettings: { defaultProviderId: "official.search.google" },
          plugins: [],
        }),
      }),
    )

    expect(root.querySelector(".settings-host")).toBeTruthy()
    expect(root.textContent).toContain("Plugin view failed")
    expect(root.textContent).toContain("broken")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm test -- apps/playground/src/settingsHost.test.tsx
```

Expected: FAIL because `settingsHost.tsx` does not exist.

- [ ] **Step 3: Implement the settings host**

Create `apps/playground/src/settingsHost.tsx`:

```tsx
import { createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  PluginManifest,
  SettingsPanelContribution,
  SettingsPanelViewProps,
} from "@tabora/plugin-api"
import { PluginViewBoundary } from "./PluginViewBoundary"

type PluginLike = {
  manifest: Pick<PluginManifest, "id" | "contributes">
}

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
}

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  activePanelId: string | null
  onPanelChange: (panelId: string) => void
  onClose: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  panelProps: (panel: SettingsPanelDescriptor) => SettingsPanelViewProps
}

export function collectSettingsPanels(plugins: PluginLike[]): SettingsPanelDescriptor[] {
  const panels: SettingsPanelDescriptor[] = []

  for (const plugin of plugins) {
    for (const panel of plugin.manifest.contributes.settingsPanels ?? []) {
      panels.push({ ...panel, pluginId: plugin.manifest.id })
    }
  }

  return panels.sort(
    (left, right) =>
      (left.order ?? 10_000) - (right.order ?? 10_000) || left.title.localeCompare(right.title),
  )
}

export function resolveInitialSettingsPanelId(
  panels: SettingsPanelDescriptor[],
  requestedPanelId?: string | null,
): string | null {
  if (requestedPanelId && panels.some((panel) => panel.id === requestedPanelId)) {
    return requestedPanelId
  }
  return panels[0]?.id ?? null
}

export function SettingsHost(props: SettingsHostProps) {
  const activePanel = createMemo(() => {
    const requested = props.activePanelId
    return props.panels.find((panel) => panel.id === requested) ?? props.panels[0] ?? null
  })

  function renderPanel(panel: SettingsPanelDescriptor) {
    const View = props.getView(panel.view)
    if (!View) {
      return (
        <div class="settings-panel-missing" role="alert">
          设置面板不可用：{panel.id}
        </div>
      )
    }

    return (
      <PluginViewBoundary instanceId={panel.id} title={panel.title}>
        {View(props.panelProps(panel))}
      </PluginViewBoundary>
    )
  }

  return (
    <Show when={props.open}>
      <div class="settings-overlay" onClick={props.onClose}>
        <section
          class="settings-host"
          role="dialog"
          aria-modal="true"
          aria-label="设置"
          onClick={(event) => event.stopPropagation()}
        >
          <header class="settings-host-header">
            <div>
              <h2>设置</h2>
              <p>管理工作台、插件和搜索偏好</p>
            </div>
            <button
              class="settings-close"
              type="button"
              aria-label="关闭设置"
              onClick={props.onClose}
            >
              ×
            </button>
          </header>
          <div class="settings-host-body">
            <nav class="settings-nav" aria-label="设置面板">
              <For each={props.panels}>
                {(panel) => (
                  <button
                    class="settings-nav-item"
                    classList={{ active: activePanel()?.id === panel.id }}
                    type="button"
                    aria-current={activePanel()?.id === panel.id ? "page" : undefined}
                    onClick={() => props.onPanelChange(panel.id)}
                  >
                    {panel.title}
                  </button>
                )}
              </For>
            </nav>
            <main class="settings-panel-region">
              <Show
                when={activePanel()}
                fallback={<div class="settings-panel-missing">暂无设置面板</div>}
              >
                {(panel) => renderPanel(panel())}
              </Show>
            </main>
          </div>
        </section>
      </div>
    </Show>
  )
}
```

- [ ] **Step 4: Add host-level settings styles**

Add to `apps/playground/src/app.css` near the modal styles:

```css
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 24px;
  background: rgba(0, 0, 0, 0.36);
}

.settings-host {
  width: min(920px, 100%);
  max-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-card);
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.settings-host-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-line));
}

.settings-host-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
}

.settings-host-header p {
  margin: 4px 0 0;
  color: rgb(var(--color-muted));
  font-size: 13px;
}

.settings-close {
  width: 32px;
  height: 32px;
  border: 1px solid rgb(var(--color-line));
  border-radius: 8px;
  background: rgb(var(--color-surface));
  color: rgb(var(--color-muted));
  cursor: pointer;
}

.settings-close:hover,
.settings-close:focus-visible {
  color: rgb(var(--color-text));
  border-color: rgb(var(--color-accent));
  outline: none;
}

.settings-host-body {
  min-height: 0;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  flex: 1;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-right: 1px solid rgb(var(--color-line));
  background: rgba(var(--color-page), 0.58);
}

.settings-nav-item {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--color-muted));
  text-align: left;
  cursor: pointer;
}

.settings-nav-item:hover,
.settings-nav-item:focus-visible,
.settings-nav-item.active {
  border-color: rgb(var(--color-line));
  background: rgba(var(--color-accent), 0.1);
  color: rgb(var(--color-text));
  outline: none;
}

.settings-panel-region {
  min-width: 0;
  overflow-y: auto;
  padding: 20px;
}

.settings-panel-stack {
  display: grid;
  gap: 16px;
}

.settings-provider-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.settings-panel-missing {
  padding: 16px;
  color: rgb(var(--color-muted));
}
```

Add to the existing mobile media block:

```css
.settings-overlay {
  padding: 16px;
}

.settings-host {
  max-height: calc(100vh - 32px);
}

.settings-host-body {
  grid-template-columns: 1fr;
}

.settings-nav {
  flex-direction: row;
  overflow-x: auto;
  border-right: 0;
  border-bottom: 1px solid rgb(var(--color-line));
}

.settings-nav-item {
  flex: 0 0 auto;
}
```

- [ ] **Step 5: Re-run the focused test**

Run:

```bash
pnpm test -- apps/playground/src/settingsHost.test.tsx
```

Expected: PASS.

---

## Task 4: Wire Settings Host Into Playground Shell

**Files:**

- Modify: `apps/playground/src/workbenchShell.ts`
- Modify: `apps/playground/src/workbenchShell.test.tsx`
- Modify: `apps/playground/src/App.tsx`
- Test: `apps/playground/src/workbenchShell.test.tsx`, `apps/playground/src/settingsHost.test.tsx`

- [ ] **Step 1: Update rail action test expectation**

In `apps/playground/src/workbenchShell.test.tsx`, replace the rail action expectation with:

```ts
expect(WORKBENCH_RAIL_ACTIONS).toEqual([
  expect.objectContaining({ id: "home", isActive: true }),
  expect.objectContaining({ id: "add-widget", targetId: "add-widgets" }),
  expect.objectContaining({ id: "plugins", settingsPanelId: "official.settings.plugins" }),
  expect.objectContaining({
    id: "settings",
    settingsPanelId: "official.settings.workspace.appearance",
  }),
])
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run:

```bash
pnpm test -- apps/playground/src/workbenchShell.test.tsx
```

Expected: FAIL because rail actions still use `modalViewId`.

- [ ] **Step 3: Update rail action type and constants**

Update `apps/playground/src/workbenchShell.ts`:

```ts
export type WorkbenchRailAction = {
  id: "home" | "add-widget" | "plugins" | "settings"
  ariaLabel: string
  label: string
  isActive?: boolean
  targetId?: string
  settingsPanelId?: string
}
```

Update `WORKBENCH_RAIL_ACTIONS`:

```ts
export const WORKBENCH_RAIL_ACTIONS: WorkbenchRailAction[] = [
  {
    id: "home",
    ariaLabel: "主页",
    label: "主页",
    isActive: true,
  },
  {
    id: "add-widget",
    ariaLabel: "添加卡片",
    label: "添加",
    targetId: "add-widgets",
  },
  {
    id: "plugins",
    ariaLabel: "插件",
    label: "插件",
    settingsPanelId: "official.settings.plugins",
  },
  {
    id: "settings",
    ariaLabel: "设置",
    label: "设置",
    settingsPanelId: "official.settings.workspace.appearance",
  },
]
```

- [ ] **Step 4: Add workspace config to the workspace type**

In `packages/plugin-api/src/workspace.ts`, add an optional config field:

```ts
config?: Record<string, unknown>
```

The `Workspace` type becomes:

```ts
export type Workspace = {
  id: string
  name: string
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundProviderId?: string
  activeBackgroundRendererId?: string
  config?: Record<string, unknown>
  regions: Record<string, RegionState>
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 5: Wire settings host state into `App.tsx`**

Update imports in `apps/playground/src/App.tsx`:

```ts
import type {
  BackgroundProviderContribution,
  PluginInstance,
  SearchProviderContribution,
  SettingsPanelViewProps,
  ThemeContribution,
  ThemeTokenSet,
  WidgetSize,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { SettingsHost, collectSettingsPanels, resolveInitialSettingsPanelId } from "./settingsHost"
```

Add signals in `App()`:

```ts
const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
const [settingsOpen, setSettingsOpen] = createSignal(false)
const [activeSettingsPanelId, setActiveSettingsPanelId] = createSignal<string | null>(null)
const [searchSettings, setSearchSettings] = createSignal<WorkbenchSearchSettings>({
  defaultProviderId: "official.search.google",
})
```

After loading workspace, keep it in state:

```ts
setWorkspaceState(workspace)
setSearchSettings(readSearchSettings(workspace, searchProviders()))
```

Add helper functions inside `App()`:

```ts
function themes(): ThemeContribution[] {
  return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.themes ?? [])
}

function searchProviders(): SearchProviderContribution[] {
  return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.searchProviders ?? [])
}

function backgrounds(): BackgroundProviderContribution[] {
  return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.backgroundProviders ?? [])
}

function pluginSummaries(): SettingsPanelViewProps["plugins"] {
  return officialPlugins.map((plugin) => ({
    id: plugin.manifest.id,
    name: plugin.manifest.name,
    version: plugin.manifest.version,
    enabled: plugin.enabled,
    permissions: plugin.manifest.permissions ?? [],
    contributes: plugin.manifest.contributes,
  }))
}

function readSearchSettings(
  workspace: Workspace,
  providers: SearchProviderContribution[],
): WorkbenchSearchSettings {
  const saved = workspace.config?.search
  const defaultProviderId =
    typeof saved === "object" &&
    saved !== null &&
    "defaultProviderId" in saved &&
    typeof saved.defaultProviderId === "string"
      ? saved.defaultProviderId
      : (providers[0]?.id ?? "official.search.google")

  return { defaultProviderId }
}

async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
  const current = await workspaceRepo.get("default")
  if (!current) return
  const updated = mutator({ ...current, config: { ...(current.config ?? {}) } })
  updated.updatedAt = new Date().toISOString()
  await workspaceRepo.save(updated)
  setWorkspaceState(updated)
}

function openSettings(panelId?: string) {
  const panels = collectSettingsPanels(officialPlugins)
  setActiveSettingsPanelId(resolveInitialSettingsPanelId(panels, panelId))
  setSettingsOpen(true)
}

async function setDefaultSearchProvider(providerId: string) {
  if (!searchProviders().some((provider) => provider.id === providerId)) return
  await updateWorkspace((workspace) => {
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { defaultProviderId: providerId },
    }
    return workspace
  })
  setSearchSettings({ defaultProviderId: providerId })
}

function buildSettingsPanelProps(panel: { id: string; pluginId: string }): SettingsPanelViewProps {
  const workspace = workspaceState()
  if (!workspace) {
    throw new Error("Workspace is not ready")
  }
  return {
    panelId: panel.id,
    pluginId: panel.pluginId,
    host: {
      close: () => setSettingsOpen(false),
      setDirty: () => {},
      switchTheme,
      switchBackground,
      setDefaultSearchProvider,
    },
    workspace,
    themes: themes(),
    backgrounds: backgrounds(),
    searchProviders: searchProviders(),
    searchSettings: searchSettings(),
    plugins: pluginSummaries(),
  }
}
```

Update `switchTheme` and `switchBackground` so they also call `setWorkspaceState` after saving:

```ts
setWorkspaceState({ ...workspace })
```

Update `runRailAction`:

```ts
if (action.settingsPanelId) {
  openSettings(action.settingsPanelId)
}
```

Remove the old `modalViewId` rail branch.

Render settings host before the modal overlay:

```tsx
<SettingsHost
  open={settingsOpen()}
  panels={collectSettingsPanels(officialPlugins)}
  activePanelId={activeSettingsPanelId()}
  onPanelChange={setActiveSettingsPanelId}
  onClose={() => setSettingsOpen(false)}
  getView={(viewId) => viewOrUndefined(viewId) as any}
  panelProps={buildSettingsPanelProps}
/>
```

- [ ] **Step 6: Re-run focused tests**

Run:

```bash
pnpm test -- apps/playground/src/workbenchShell.test.tsx apps/playground/src/settingsHost.test.tsx
```

Expected: PASS.

---

## Task 5: Make Command Search Use Dynamic Providers

**Files:**

- Modify: `packages/official-plugins/src/search-command-bar.tsx`
- Modify: `apps/playground/src/App.tsx`
- Test: package/unit check through `pnpm test`

- [ ] **Step 1: Replace hardcoded providers in search command bar**

Replace `packages/official-plugins/src/search-command-bar.tsx` with:

```tsx
import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SearchProviderContribution, SearchViewProps } from "@tabora/plugin-api"
import { Button, Input, Select } from "@tabora/ui"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]

const FALLBACK_PROVIDER: SearchProviderContribution = {
  id: "official.search.google",
  title: "Google",
  urlTemplate: "https://www.google.com/search?q={query}",
  shortcut: "g",
}

function providerOptions(providers: SearchProviderContribution[]) {
  return providers.map((provider) => ({
    value: provider.id,
    label: provider.title,
  }))
}

function buildSearchUrl(provider: SearchProviderContribution, query: string): string {
  return provider.urlTemplate.replace("{query}", encodeURIComponent(query.trim()))
}

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() =>
    props.providers.length > 0 ? props.providers : [FALLBACK_PROVIDER],
  )
  const [query, setQuery] = createSignal("")
  const [providerId, setProviderId] = createSignal(props.defaultProviderId || providers()[0]!.id)
  const [focused, setFocused] = createSignal(false)

  const activeProvider = () =>
    providers().find((provider) => provider.id === providerId()) ?? providers()[0]!

  function doSearch(q: string) {
    const provider = activeProvider()
    const url = buildSearchUrl(provider, q)
    props.openExternal?.(url)
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId)
    void props.onDefaultProviderChange?.(nextProviderId)
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    const q = query().trim()
    if (!q) return
    doSearch(q)
    setQuery("")
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const q = query().trim()
      if (q) {
        doSearch(q)
        setQuery("")
      }
    }
  }

  function handleTagClick(tag: string) {
    setQuery(tag)
    doSearch(tag)
  }

  const showSuggestions = () => focused() && query().length === 0

  return (
    <div class="search-wrapper">
      <form class="search-bar" onSubmit={handleSubmit}>
        <Select
          value={activeProvider().id}
          options={providerOptions(providers())}
          onChange={handleProviderChange}
          aria-label="搜索源"
          size="sm"
        />
        <Input
          value={query()}
          onInput={setQuery}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="输入搜索内容"
          aria-label="搜索内容"
          type="search"
        />
        <Button type="submit" variant="primary" size="sm">
          搜索
        </Button>
      </form>
      <Show when={showSuggestions()}>
        <div class="search-suggestions">
          <span class="suggestions-label">快捷搜索：</span>
          <For each={QUICK_TAGS}>
            {(tag) => (
              <Button variant="ghost" size="sm" onClick={() => handleTagClick(tag)}>
                {tag}
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

export const officialSearchCommandBar: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.search.command-bar",
    name: "Tabora Search Command Bar",
    version: "0.0.0",
    entry: "./search-command-bar",
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["*"] }],
    contributes: {
      searches: [
        {
          id: "official.search.command-bar",
          title: "搜索栏",
          defaultProviderIds: ["official.search.google", "official.search.bing"],
          supportsSuggestions: true,
          view: "official.search.command-bar.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.search.command-bar.view", (props: SearchViewProps) =>
      SearchCommandBar({
        ...props,
        openExternal: (url) => {
          context.permissions.openExternal(url)
        },
      }),
    )
  },
}
```

- [ ] **Step 2: Pass search props from playground**

In `apps/playground/src/App.tsx`, replace:

```tsx
const topbar = <div class="topbar">{SearchView()({})}</div>
```

with:

```tsx
const topbar = (
  <div class="topbar">
    {SearchView()({
      providers: searchProviders(),
      defaultProviderId: searchSettings().defaultProviderId,
      onDefaultProviderChange: setDefaultSearchProvider,
    })}
  </div>
)
```

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm test
```

Expected: PASS, or failures that point to type or test expectations changed by dynamic search props. Fix only those directly related failures.

---

## Task 6: Add Settings Host Browser Coverage

**Files:**

- Modify: `apps/playground/src/workbenchDashboard.e2e.test.tsx`

- [ ] **Step 1: Extend the E2E test**

Add these assertions after the notes modal section in `apps/playground/src/workbenchDashboard.e2e.test.tsx`:

```ts
clickRequired('.workbench-rail button[aria-label="设置"]')
await waitFor(() => expect(document.querySelector(".settings-host")).toBeTruthy())
expect(document.querySelector(".settings-nav-item.active")?.textContent).toContain("外观")

clickRequired(".settings-nav", "button:nth-child(3)")
await waitFor(() =>
  expect(document.querySelector(".settings-nav-item.active")?.textContent).toContain("搜索"),
)

const searchSelect = document.querySelector<HTMLElement>("#settings-search-provider-select")
expect(searchSelect).toBeTruthy()

clickRequired(".settings-close")
await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())

clickRequired('.workbench-rail button[aria-label="插件"]')
await waitFor(() => expect(document.querySelector(".settings-host")).toBeTruthy())
expect(document.querySelector(".settings-nav-item.active")?.textContent).toContain("插件")
clickRequired(".settings-close")
```

If Kobalte Select portal interaction is too brittle in this existing e2e harness, keep provider change persistence in unit/component tests and cover opening/navigation/close in E2E.

- [ ] **Step 2: Run browser tests**

Run:

```bash
pnpm test:e2e
```

Expected: PASS. If this fails because local Chrome/Playwright is unavailable, record the exact failure and run `pnpm test` + `pnpm check` instead.

---

## Task 7: Update Product And Technical Docs

**Files:**

- Modify: `docs/product/tabora-plugin-workbench-prd.md`
- Modify: `docs/product/tabora-official-plugins-design.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design.md`

- [ ] **Step 1: Update PRD current wording**

In `docs/product/tabora-plugin-workbench-prd.md`, update the settings host bullets so they say the MVP now includes:

```md
- 轻量设置中心：宿主提供 settings host，聚合插件、外观、搜索三个 settings-panel contribution；插件启停、权限审计、导入导出后移。
```

Keep the non-goals unchanged.

- [ ] **Step 2: Update official plugin design matrix and gap table**

In `docs/product/tabora-official-plugins-design.md`, change the `official.settings.workspace` matrix row from `MVP 需补齐轻量设置中心` to:

```md
已实现轻量 settings host 面板贡献：外观、搜索；插件面板由 `official.plugin-manager` 贡献
```

In the implementation gap table, change the settings plugin row from `未实现` to:

```md
已实现 MVP 轻量 settings host；插件、外观、搜索面板可进入
```

Keep V1.1 items such as plugin enable/disable and settings search as follow-ups.

- [ ] **Step 3: Update technical settings host section**

In `docs/technical/tabora-plugin-workbench-technical-design.md`, update §11.4 to mention:

```md
当前实现：playground 提供 settings host 容器；`official.plugin-manager` 贡献 `official.settings.plugins`；`official.settings.workspace` 贡献外观和搜索面板。宿主传入 workspace、theme/background/search-provider contributions 和最小 host actions。
```

Add a follow-up note:

```md
后续仍需补齐 focus trap、Escape 关闭、插件启停、权限详情和设置搜索。
```

- [ ] **Step 4: Run docs-inclusive check**

Run:

```bash
pnpm check
```

Expected: PASS.

---

## Task 8: Final Verification

**Files:**

- No new files unless verification reveals a targeted fix.

- [ ] **Step 1: Run unit tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run full check**

Run:

```bash
pnpm check
```

Expected: PASS.

- [ ] **Step 3: Run build because this is cross-package frontend work**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Start playground for manual browser verification**

Run:

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

Expected: dev server starts on `http://127.0.0.1:5173/`.

Manually verify:

- Default workbench renders with rail, topbar, and four default cards.
- Rail Settings opens settings host on 外观.
- Rail Plugins opens settings host on 插件.
- Search panel lists providers from `official.search-providers.basic`.
- Changing default search provider affects the top command search provider.
- Appearance theme/background changes persist after reload.
- Mobile viewport has no horizontal overflow.

Stop the dev server before final response.

- [ ] **Step 5: Summarize residual risks**

Include these known follow-ups in the final response:

- Settings host still needs full focus trap and Escape close if not implemented in this pass.
- Search provider enable/disable remains deferred.
- Plugin enable/disable and permission audit remain deferred.
- Notes/todo/quick-links instance-scoped plugin data remains the next stage.

---

## Self-Review Notes

- Spec coverage: The plan covers the approved next phase: settings host container, plugin/appearance/search panels, rail entry routing, dynamic search providers, persistence, tests, and docs.
- Scope control: This plan intentionally does not migrate notes/todo/quick-links plugin data and does not implement plugin enable/disable, settings search, import/export, or permission audit.
- Type consistency: `SettingsPanelContribution.order`, `SettingsPanelViewProps`, `SearchViewProps`, and `WorkbenchSearchSettings` are defined in Task 1 and used consistently in later tasks.
- Placeholder scan: No task contains open-ended implementation placeholders; deferred capabilities are explicitly out of scope.
