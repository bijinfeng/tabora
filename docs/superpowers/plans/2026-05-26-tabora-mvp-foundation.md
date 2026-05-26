# Tabora MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Tabora foundation: a Vite+ pnpm monorepo, Solid playground app, plugin API, plugin kernel, workspace state, IndexedDB persistence, and a minimal official plugin pack that renders a default plugin-assembled workbench.

**Architecture:** The first implementation uses a standalone `apps/playground` shell before introducing WXT. Platform code lives in packages and contains no concrete business UI. The default user experience comes from official plugins registered through manifest, contributions, runtime context, and view registry.

**Tech Stack:** Vite+ / `vp`, Solid, TypeScript, pnpm workspace, Tailwind CSS v4 tokens, Vitest, Dexie, Zod, tsdown.

---

## Scope Decisions For This Plan

- First shell: `apps/playground`, not a browser extension.
- WXT integration is outside this first plan.
- Weather and RSS use local mock adapters in this plan.
- Core boundaries are physical packages from the start.
- Drag grid uses a simple deterministic CSS grid placement layer first; pointer drag behavior comes after the kernel is proven.

## File Structure

```txt
package.json
pnpm-workspace.yaml
tsconfig.base.json
vite.config.ts

apps/
  playground/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      App.tsx
      bootstrap.tsx
      app.css

packages/
  plugin-api/
    package.json
    tsconfig.json
    src/
      index.ts
      manifest.ts
      manifestSchema.ts
      manifestSchema.test.ts
      workspace.ts
  platform-kernel/
    package.json
    tsconfig.json
    src/
      index.ts
      eventBus.ts
      eventBus.test.ts
      extensionRegistry.ts
      extensionRegistry.test.ts
      pluginKernel.ts
      pluginKernel.test.ts
      runtimeContext.ts
  storage/
    package.json
    tsconfig.json
    src/
      database.ts
      workspaceRepository.ts
      workspaceRepository.test.ts
  theme/
    package.json
    tsconfig.json
    src/
      applyThemeTokens.ts
      applyThemeTokens.test.ts
  official-plugins/
    package.json
    tsconfig.json
    src/
      index.ts
      layout-top-search-grid.tsx
      search-command-bar.tsx
      theme-default-pack.ts
      widgets-productivity.tsx
```

## Task 1: Create Vite+ Monorepo Scaffold

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vite.config.ts`
- Create: `apps/playground/package.json`
- Create: `apps/playground/tsconfig.json`
- Create: `apps/playground/vite.config.ts`
- Create: `apps/playground/index.html`
- Create: `packages/*/package.json`
- Create: `packages/*/tsconfig.json`

- [ ] **Step 1: Write workspace metadata**

Create `package.json`:

```json
{
  "name": "tabora",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "vp dev apps/playground",
    "check": "vp check",
    "test": "vp test",
    "build": "vp run -r build",
    "pack": "vp pack"
  },
  "devDependencies": {
    "@tailwindcss/vite": "latest",
    "fake-indexeddb": "latest",
    "happy-dom": "latest",
    "tailwindcss": "latest",
    "tsdown": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vite-plus": "latest",
    "vite-plugin-solid": "latest",
    "vitest": "latest"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@tabora/plugin-api": ["packages/plugin-api/src/index.ts"],
      "@tabora/platform-kernel": ["packages/platform-kernel/src/index.ts"],
      "@tabora/storage": ["packages/storage/src/index.ts"],
      "@tabora/theme": ["packages/theme/src/index.ts"],
      "@tabora/official-plugins": ["packages/official-plugins/src/index.ts"]
    }
  }
}
```

- [ ] **Step 2: Write root Vite+ config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite-plus"

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.tsx"],
  },
  lint: {
    plugins: ["typescript"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        plugins: ["typescript", "vitest"],
        rules: {
          "vitest/no-disabled-tests": "error",
        },
      },
    ],
  },
  fmt: {
    singleQuote: false,
    semi: false,
  },
  pack: {
    dts: true,
    exports: true,
  },
})
```

- [ ] **Step 3: Create playground app package**

Create `apps/playground/package.json`:

```json
{
  "name": "@tabora/playground",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/official-plugins": "workspace:*",
    "@tabora/platform-kernel": "workspace:*",
    "@tabora/plugin-api": "workspace:*",
    "@tabora/storage": "workspace:*",
    "@tabora/theme": "workspace:*",
    "@kobalte/core": "latest",
    "lucide-solid": "latest",
    "solid-js": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "vite": "latest",
    "vite-plugin-solid": "latest"
  }
}
```

Create `apps/playground/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `apps/playground/vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

export default defineConfig({
  plugins: [solid(), tailwindcss()],
})
```

Create `apps/playground/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tabora Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/bootstrap.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create package metadata**

For `packages/plugin-api/package.json`:

```json
{
  "name": "@tabora/plugin-api",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsdown src/index.ts --dts --exports",
    "test": "vitest"
  },
  "dependencies": {
    "zod": "latest"
  }
}
```

For `packages/platform-kernel/package.json`:

```json
{
  "name": "@tabora/platform-kernel",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsdown src/index.ts --dts --exports",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*"
  }
}
```

For `packages/storage/package.json`:

```json
{
  "name": "@tabora/storage",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsdown src/index.ts --dts --exports",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*",
    "dexie": "latest"
  },
  "devDependencies": {
    "fake-indexeddb": "latest"
  }
}
```

For `packages/theme/package.json`:

```json
{
  "name": "@tabora/theme",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsdown src/index.ts --dts --exports",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*"
  }
}
```

For `packages/official-plugins/package.json`:

```json
{
  "name": "@tabora/official-plugins",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsdown src/index.ts --dts --exports",
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/platform-kernel": "workspace:*",
    "@tabora/plugin-api": "workspace:*",
    "solid-js": "latest"
  }
}
```

For each package, create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
vp install
```

Expected: lockfile is created and all workspace dependencies install successfully.

- [ ] **Step 6: Run first workspace check**

Run:

```bash
vp check
```

Expected: FAIL because source entry files do not exist yet. The failure confirms the workspace is wired and ready for implementation tasks.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vite.config.ts apps packages
git commit -m "chore: scaffold Tabora Vite+ workspace"
```

## Task 2: Define Plugin API Types And Manifest Validation

**Files:**

- Create: `packages/plugin-api/src/manifest.ts`
- Create: `packages/plugin-api/src/workspace.ts`
- Create: `packages/plugin-api/src/manifestSchema.ts`
- Create: `packages/plugin-api/src/manifestSchema.test.ts`
- Create: `packages/plugin-api/src/index.ts`

- [ ] **Step 1: Write failing manifest schema tests**

Create `packages/plugin-api/src/manifestSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { pluginManifestSchema } from "./manifestSchema"

describe("pluginManifestSchema", () => {
  it("accepts a plugin that contributes a widget", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "official.notes.card", modal: "official.notes.modal" },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects a widget whose default size is not supported", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.widgets",
      name: "Bad Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S"],
            defaultSize: "XL",
            allowMultipleInstances: true,
            views: { card: "bad.notes.card" },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
vp test packages/plugin-api/src/manifestSchema.test.ts
```

Expected: FAIL with an import error for `./manifestSchema`.

- [ ] **Step 3: Implement API types**

Create `packages/plugin-api/src/manifest.ts`:

```ts
export type ExtensionPoint =
  | "layout"
  | "widget"
  | "search"
  | "search-provider"
  | "background-provider"
  | "background-renderer"
  | "theme"
  | "settings-panel"

export type WidgetSize = "S" | "M" | "L" | "XL"

export type PluginPermission =
  | { type: "storage"; scope: "plugin" }
  | { type: "workspace"; access: "read" | "write" }
  | { type: "network"; hosts: string[] }
  | { type: "clipboard"; access: "read" | "write" }
  | { type: "local-file"; access: "read" | "write" }
  | { type: "external-open"; hosts: string[] }

export type WidgetContribution = {
  id: string
  title: string
  icon?: string
  supportedSizes: WidgetSize[]
  defaultSize: WidgetSize
  allowMultipleInstances: boolean
  defaultConfig?: Record<string, unknown>
  views: {
    card: string
    modal?: string
    fullscreen?: string
    settings?: string
  }
}

export type LayoutRegion = {
  id: string
  title: string
  accepts: ExtensionPoint[]
  required?: boolean
  maxInstances?: number
}

export type PluginInstanceRef = {
  instanceId: string
}

export type LayoutContribution = {
  id: string
  title: string
  preview?: string
  regions: LayoutRegion[]
  defaultRegions: Record<string, PluginInstanceRef[]>
  supportsResponsive: boolean
}

export type SearchContribution = {
  id: string
  title: string
  defaultProviderIds?: string[]
  supportsSuggestions?: boolean
  view: string
}

export type SearchProviderContribution = {
  id: string
  title: string
  icon?: string
  urlTemplate: string
  suggestionEndpoint?: string
  shortcut?: string
}

export type BackgroundProviderContribution = {
  id: string
  title: string
  sourceType: "local" | "remote" | "generated" | "collection"
}

export type BackgroundRendererContribution = {
  id: string
  title: string
  accepts: Array<"image" | "video" | "gradient" | "canvas" | "webgl">
  view: string
}

export type ThemeTokenSet = Record<string, string>

export type ThemeContribution = {
  id: string
  title: string
  tokens: ThemeTokenSet
}

export type SettingsPanelContribution = {
  id: string
  title: string
  view: string
}

export type PluginManifest = {
  id: string
  name: string
  version: string
  publisher?: string
  description?: string
  icon?: string
  entry: string
  engine: {
    platform: string
  }
  permissions?: PluginPermission[]
  contributes: {
    layouts?: LayoutContribution[]
    widgets?: WidgetContribution[]
    searches?: SearchContribution[]
    searchProviders?: SearchProviderContribution[]
    backgroundProviders?: BackgroundProviderContribution[]
    backgroundRenderers?: BackgroundRendererContribution[]
    themes?: ThemeContribution[]
    settingsPanels?: SettingsPanelContribution[]
  }
}
```

Create `packages/plugin-api/src/workspace.ts`:

```ts
import type { ExtensionPoint, PluginManifest, PluginPermission, WidgetSize } from "./manifest"

export type GridPlacement = {
  x: number
  y: number
  colSpan: number
  rowSpan: number
  locked?: boolean
}

export type RegionState = {
  regionId: string
  accepts: ExtensionPoint[]
  instances: Array<{ instanceId: string }>
}

export type Workspace = {
  id: string
  name: string
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundProviderId?: string
  activeBackgroundRendererId?: string
  regions: Record<string, RegionState>
  createdAt: string
  updatedAt: string
}

export type PluginInstance = {
  id: string
  pluginId: string
  contributionId: string
  extensionPoint: ExtensionPoint
  regionId: string
  enabled: boolean
  size?: WidgetSize
  grid?: GridPlacement
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type PluginRecord = {
  id: string
  version: string
  source: "builtin" | "local" | "remote"
  enabled: boolean
  installedAt: string
  updatedAt: string
  manifest: PluginManifest
  grantedPermissions: PluginPermission[]
}
```

- [ ] **Step 4: Implement manifest schema**

Create `packages/plugin-api/src/manifestSchema.ts`:

```ts
import { z } from "zod"

const widgetSizeSchema = z.enum(["S", "M", "L", "XL"])

const extensionPointSchema = z.enum([
  "layout",
  "widget",
  "search",
  "search-provider",
  "background-provider",
  "background-renderer",
  "theme",
  "settings-panel",
])

const widgetContributionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    icon: z.string().optional(),
    supportedSizes: z.array(widgetSizeSchema).min(1),
    defaultSize: widgetSizeSchema,
    allowMultipleInstances: z.boolean(),
    defaultConfig: z.record(z.string(), z.unknown()).optional(),
    views: z.object({
      card: z.string().min(1),
      modal: z.string().min(1).optional(),
      fullscreen: z.string().min(1).optional(),
      settings: z.string().min(1).optional(),
    }),
  })
  .refine((value) => value.supportedSizes.includes(value.defaultSize), {
    message: "defaultSize must be included in supportedSizes",
    path: ["defaultSize"],
  })

const layoutRegionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  accepts: z.array(extensionPointSchema).min(1),
  required: z.boolean().optional(),
  maxInstances: z.number().int().positive().optional(),
})

const instanceRefSchema = z.object({ instanceId: z.string().min(1) })

export const pluginManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  publisher: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  entry: z.string().min(1),
  engine: z.object({ platform: z.string().min(1) }),
  permissions: z.array(z.unknown()).optional(),
  contributes: z.object({
    layouts: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          preview: z.string().optional(),
          regions: z.array(layoutRegionSchema).min(1),
          defaultRegions: z.record(z.string(), z.array(instanceRefSchema)),
          supportsResponsive: z.boolean(),
        }),
      )
      .optional(),
    widgets: z.array(widgetContributionSchema).optional(),
    searches: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          defaultProviderIds: z.array(z.string()).optional(),
          supportsSuggestions: z.boolean().optional(),
          view: z.string().min(1),
        }),
      )
      .optional(),
    searchProviders: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          icon: z.string().optional(),
          urlTemplate: z.string().min(1),
          suggestionEndpoint: z.string().optional(),
          shortcut: z.string().optional(),
        }),
      )
      .optional(),
    backgroundProviders: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          sourceType: z.enum(["local", "remote", "generated", "collection"]),
        }),
      )
      .optional(),
    backgroundRenderers: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          accepts: z.array(z.enum(["image", "video", "gradient", "canvas", "webgl"])).min(1),
          view: z.string().min(1),
        }),
      )
      .optional(),
    themes: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          tokens: z.record(z.string(), z.string()),
        }),
      )
      .optional(),
    settingsPanels: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          view: z.string().min(1),
        }),
      )
      .optional(),
  }),
})
```

Create `packages/plugin-api/src/index.ts`:

```ts
export * from "./manifest"
export * from "./manifestSchema"
export * from "./workspace"
```

- [ ] **Step 5: Run tests**

Run:

```bash
vp test packages/plugin-api/src/manifestSchema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Plugin API**

```bash
git add packages/plugin-api
git commit -m "feat: define plugin API manifest schema"
```

## Task 3: Build Registry, Event Bus, And Kernel Activation

**Files:**

- Create: `packages/platform-kernel/src/eventBus.ts`
- Create: `packages/platform-kernel/src/eventBus.test.ts`
- Create: `packages/platform-kernel/src/extensionRegistry.ts`
- Create: `packages/platform-kernel/src/extensionRegistry.test.ts`
- Create: `packages/platform-kernel/src/runtimeContext.ts`
- Create: `packages/platform-kernel/src/pluginKernel.ts`
- Create: `packages/platform-kernel/src/pluginKernel.test.ts`
- Create: `packages/platform-kernel/src/index.ts`

- [ ] **Step 1: Write failing event bus test**

Create `packages/platform-kernel/src/eventBus.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createEventBus } from "./eventBus"

describe("createEventBus", () => {
  it("delivers emitted payloads to subscribers", () => {
    const events = createEventBus()
    const received: unknown[] = []

    const unsubscribe = events.on("theme.changed", (payload) => received.push(payload))
    events.emit("theme.changed", { themeId: "official.theme.light" })
    unsubscribe()
    events.emit("theme.changed", { themeId: "official.theme.dark" })

    expect(received).toEqual([{ themeId: "official.theme.light" }])
  })
})
```

Run:

```bash
vp test packages/platform-kernel/src/eventBus.test.ts
```

Expected: FAIL with an import error for `./eventBus`.

- [ ] **Step 2: Implement event bus**

Create `packages/platform-kernel/src/eventBus.ts`:

```ts
export type EventHandler = (payload: unknown) => void

export type EventBus = {
  emit(eventName: string, payload: unknown): void
  on(eventName: string, handler: EventHandler): () => void
}

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>()

  return {
    emit(eventName, payload) {
      for (const handler of handlers.get(eventName) ?? []) {
        handler(payload)
      }
    },
    on(eventName, handler) {
      const eventHandlers = handlers.get(eventName) ?? new Set<EventHandler>()
      eventHandlers.add(handler)
      handlers.set(eventName, eventHandlers)

      return () => {
        eventHandlers.delete(handler)
      }
    },
  }
}
```

Run:

```bash
vp test packages/platform-kernel/src/eventBus.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write failing registry test**

Create `packages/platform-kernel/src/extensionRegistry.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createExtensionRegistry } from "./extensionRegistry"

describe("createExtensionRegistry", () => {
  it("registers and retrieves views by id", () => {
    const registry = createExtensionRegistry()
    const view = () => null

    registry.views.register("official.notes.card", view)

    expect(registry.views.get("official.notes.card")).toBe(view)
  })

  it("throws when a view id is missing", () => {
    const registry = createExtensionRegistry()

    expect(() => registry.views.get("missing.view")).toThrow("View not registered: missing.view")
  })
})
```

Run:

```bash
vp test packages/platform-kernel/src/extensionRegistry.test.ts
```

Expected: FAIL with an import error for `./extensionRegistry`.

- [ ] **Step 4: Implement extension registry**

Create `packages/platform-kernel/src/extensionRegistry.ts`:

```ts
export type ViewComponent = (props: Record<string, unknown>) => unknown

export type ViewRegistry = {
  register(viewId: string, view: ViewComponent): void
  get(viewId: string): ViewComponent
  has(viewId: string): boolean
}

export type ExtensionRegistry = {
  views: ViewRegistry
}

export function createExtensionRegistry(): ExtensionRegistry {
  const views = new Map<string, ViewComponent>()

  return {
    views: {
      register(viewId, view) {
        views.set(viewId, view)
      },
      get(viewId) {
        const view = views.get(viewId)
        if (!view) {
          throw new Error(`View not registered: ${viewId}`)
        }
        return view
      },
      has(viewId) {
        return views.has(viewId)
      },
    },
  }
}
```

Run:

```bash
vp test packages/platform-kernel/src/extensionRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing kernel activation test**

Create `packages/platform-kernel/src/pluginKernel.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { PluginManifest } from "@tabora/plugin-api"
import { createPluginKernel } from "./pluginKernel"

describe("createPluginKernel", () => {
  it("activates enabled plugins and exposes registered views", async () => {
    const manifest: PluginManifest = {
      id: "official.test",
      name: "Official Test",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate(context) {
          context.registry.views.register("official.test.view", () => null)
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.test.view")).toBe(true)
  })
})
```

Run:

```bash
vp test packages/platform-kernel/src/pluginKernel.test.ts
```

Expected: FAIL with an import error for `./pluginKernel`.

- [ ] **Step 6: Implement runtime context and plugin kernel**

Create `packages/platform-kernel/src/runtimeContext.ts`:

```ts
import type { EventBus } from "./eventBus"
import type { ExtensionRegistry } from "./extensionRegistry"

export type RuntimeConfigScope =
  | { type: "plugin" }
  | { type: "instance"; instanceId: string }
  | { type: "workspace" }

export type PluginRuntimeContext = {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  logger: {
    warn(message: string): void
    error(message: string): void
  }
  getConfig<T = unknown>(scope: RuntimeConfigScope): T | undefined
  setConfig<T = unknown>(scope: RuntimeConfigScope, value: T): Promise<void>
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
}): PluginRuntimeContext {
  const config = new Map<string, unknown>()

  function keyFor(scope: RuntimeConfigScope): string {
    if (scope.type === "instance") {
      return `instance:${scope.instanceId}`
    }
    return scope.type
  }

  return {
    pluginId: options.pluginId,
    events: options.events,
    registry: options.registry,
    logger: {
      warn(message) {
        console.warn(`[${options.pluginId}] ${message}`)
      },
      error(message) {
        console.error(`[${options.pluginId}] ${message}`)
      },
    },
    getConfig(scope) {
      return config.get(keyFor(scope)) as unknown
    },
    async setConfig(scope, value) {
      config.set(keyFor(scope), value)
    },
  }
}
```

Create `packages/platform-kernel/src/pluginKernel.ts`:

```ts
import type { PluginManifest } from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { createPluginRuntimeContext, type PluginRuntimeContext } from "./runtimeContext"

export type BuiltinPlugin = {
  manifest: PluginManifest
  enabled: boolean
  activate(context: PluginRuntimeContext): void | Promise<void>
}

export type PluginKernel = {
  registry: ReturnType<typeof createExtensionRegistry>
  discover(plugins: BuiltinPlugin[]): Promise<void>
  activateEnabledPlugins(): Promise<void>
}

export function createPluginKernel(): PluginKernel {
  const events = createEventBus()
  const registry = createExtensionRegistry()
  const plugins: BuiltinPlugin[] = []

  return {
    registry,
    async discover(discoveredPlugins) {
      plugins.splice(0, plugins.length, ...discoveredPlugins)
    },
    async activateEnabledPlugins() {
      for (const plugin of plugins) {
        if (!plugin.enabled) {
          continue
        }
        const context = createPluginRuntimeContext({
          pluginId: plugin.manifest.id,
          events,
          registry,
        })
        await plugin.activate(context)
      }
    },
  }
}
```

Create `packages/platform-kernel/src/index.ts`:

```ts
export * from "./eventBus"
export * from "./extensionRegistry"
export * from "./pluginKernel"
export * from "./runtimeContext"
```

Run:

```bash
vp test packages/platform-kernel/src
```

Expected: PASS.

- [ ] **Step 7: Commit kernel**

```bash
git add packages/platform-kernel
git commit -m "feat: add plugin kernel registry"
```

## Task 4: Add Workspace State, Size Mapping, And IndexedDB Repositories

**Files:**

- Create: `packages/storage/src/database.ts`
- Create: `packages/storage/src/workspaceRepository.ts`
- Create: `packages/storage/src/workspaceRepository.test.ts`
- Create: `packages/storage/src/index.ts`

- [ ] **Step 1: Write failing repository test**

Create `packages/storage/src/workspaceRepository.test.ts`:

```ts
import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import type { Workspace } from "@tabora/plugin-api"
import { createTaboraDatabase } from "./database"
import { createWorkspaceRepository } from "./workspaceRepository"

describe("createWorkspaceRepository", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("tabora-test")
  })

  it("saves and loads a workspace", async () => {
    const database = createTaboraDatabase("tabora-test")
    const repository = createWorkspaceRepository(database)
    const workspace: Workspace = {
      id: "default",
      name: "默认",
      activeLayoutId: "official.layout.top-search-grid",
      activeThemeId: "official.theme.light",
      regions: {},
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    }

    await repository.save(workspace)

    await expect(repository.get("default")).resolves.toEqual(workspace)
  })
})
```

Run:

```bash
vp test packages/storage/src/workspaceRepository.test.ts
```

Expected: FAIL with an import error for `./database`.

- [ ] **Step 2: Implement Dexie database and repository**

Create `packages/storage/src/database.ts`:

```ts
import Dexie, { type Table } from "dexie"
import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"

export type PluginDataRow = {
  id: string
  pluginId: string
  instanceId?: string
  key: string
  value: unknown
  updatedAt: string
}

export class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances: "id, pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, instanceId, key",
    })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
```

Create `packages/storage/src/workspaceRepository.ts`:

```ts
import type { Workspace } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type WorkspaceRepository = {
  get(id: string): Promise<Workspace | undefined>
  save(workspace: Workspace): Promise<void>
}

export function createWorkspaceRepository(database: TaboraDatabase): WorkspaceRepository {
  return {
    get(id) {
      return database.workspaces.get(id)
    },
    async save(workspace) {
      await database.workspaces.put(workspace)
    },
  }
}
```

Create `packages/storage/src/index.ts`:

```ts
export * from "./database"
export * from "./workspaceRepository"
```

Run:

```bash
vp test packages/storage/src/workspaceRepository.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit storage**

```bash
git add packages/storage
git commit -m "feat: add workspace persistence"
```

## Task 5: Add Theme Token Application

**Files:**

- Create: `packages/theme/src/applyThemeTokens.ts`
- Create: `packages/theme/src/applyThemeTokens.test.ts`
- Create: `packages/theme/src/index.ts`

- [ ] **Step 1: Write failing theme token test**

Create `packages/theme/src/applyThemeTokens.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { applyThemeTokens } from "./applyThemeTokens"

describe("applyThemeTokens", () => {
  it("writes token values as CSS custom properties", () => {
    const element = document.createElement("div")

    applyThemeTokens(element, {
      "color-surface": "255 255 255",
      "radius-card": "12px",
    })

    expect(element.style.getPropertyValue("--color-surface")).toBe("255 255 255")
    expect(element.style.getPropertyValue("--radius-card")).toBe("12px")
  })
})
```

Run:

```bash
vp test packages/theme/src/applyThemeTokens.test.ts
```

Expected: FAIL with an import error for `./applyThemeTokens`.

- [ ] **Step 2: Implement token application**

Create `packages/theme/src/applyThemeTokens.ts`:

```ts
import type { ThemeTokenSet } from "@tabora/plugin-api"

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenSet): void {
  for (const [name, value] of Object.entries(tokens)) {
    element.style.setProperty(`--${name}`, value)
  }
}
```

Create `packages/theme/src/index.ts`:

```ts
export * from "./applyThemeTokens"
```

Run:

```bash
vp test packages/theme/src/applyThemeTokens.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit theme package**

```bash
git add packages/theme
git commit -m "feat: add theme token bridge"
```

## Task 6: Create Minimal Official Plugin Pack

**Files:**

- Create: `packages/official-plugins/src/theme-default-pack.ts`
- Create: `packages/official-plugins/src/search-command-bar.tsx`
- Create: `packages/official-plugins/src/layout-top-search-grid.tsx`
- Create: `packages/official-plugins/src/widgets-productivity.tsx`
- Create: `packages/official-plugins/src/index.ts`

- [ ] **Step 1: Write official theme plugin**

Create `packages/official-plugins/src/theme-default-pack.ts`:

```ts
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export const officialThemeDefaultPack: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.theme.default-pack",
    name: "Tabora Default Theme Pack",
    version: "0.0.0",
    entry: "./theme-default-pack",
    engine: { platform: "^0.1.0" },
    contributes: {
      themes: [
        {
          id: "official.theme.light",
          title: "明亮工作台",
          tokens: {
            "color-page": "237 241 238",
            "color-surface": "255 255 255",
            "color-text": "31 35 32",
            "color-muted": "102 112 105",
            "color-accent": "35 113 89",
            "color-line": "210 218 213",
            "radius-card": "16px",
          },
        },
      ],
    },
  },
  activate() {},
}
```

- [ ] **Step 2: Write official search plugin**

Create `packages/official-plugins/src/search-command-bar.tsx`:

```tsx
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function SearchCommandBar() {
  return (
    <form class="search-bar" onSubmit={(event) => event.preventDefault()}>
      <select aria-label="搜索源" class="search-provider">
        <option>Google</option>
        <option>Bing</option>
        <option>百度</option>
      </select>
      <input class="search-input" placeholder="输入搜索内容" aria-label="搜索内容" />
    </form>
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
    contributes: {
      searches: [
        {
          id: "official.search.command-bar",
          title: "搜索栏",
          defaultProviderIds: ["official.search.google", "official.search.bing"],
          supportsSuggestions: false,
          view: "official.search.command-bar.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.search.command-bar.view", SearchCommandBar)
  },
}
```

- [ ] **Step 3: Write official layout plugin**

Create `packages/official-plugins/src/layout-top-search-grid.tsx`:

```tsx
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function TopSearchGridLayout(props: { topbar: unknown; mainGrid: unknown }) {
  return (
    <main class="workbench-shell">
      <section class="topbar-region">{props.topbar}</section>
      <section class="main-grid-region">{props.mainGrid}</section>
    </main>
  )
}

export const officialLayoutTopSearchGrid: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.top-search-grid",
    name: "Top Search Grid Layout",
    version: "0.0.0",
    entry: "./layout-top-search-grid",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.top-search-grid",
          title: "顶部搜索 + 网格工作台",
          regions: [
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: true,
              maxInstances: 1,
            },
            { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          ],
          defaultRegions: {
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [{ instanceId: "quick-links-1" }, { instanceId: "notes-1" }],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.layout.top-search-grid.view", TopSearchGridLayout)
  },
}
```

- [ ] **Step 4: Write official widgets plugin**

Create `packages/official-plugins/src/widgets-productivity.tsx`:

```tsx
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function QuickLinksCard() {
  return (
    <article class="widget-card">
      <h2>快捷入口</h2>
      <div class="quick-links">
        <a href="https://github.com" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="https://viteplus.dev" target="_blank" rel="noreferrer">
          Vite+
        </a>
      </div>
    </article>
  )
}

export function NotesCard() {
  return (
    <article class="widget-card">
      <h2>便签</h2>
      <p>今天先把插件内核跑通。</p>
    </article>
  )
}

export const officialWidgetsProductivity: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.productivity",
    name: "Productivity Widgets",
    version: "0.0.0",
    entry: "./widgets-productivity",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "quick-links",
          title: "快捷入口",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.quick-links.card" },
        },
        {
          id: "notes",
          title: "便签",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.notes.card", modal: "official.widgets.notes.modal" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.quick-links.card", QuickLinksCard)
    context.registry.views.register("official.widgets.notes.card", NotesCard)
    context.registry.views.register("official.widgets.notes.modal", NotesCard)
  },
}
```

- [ ] **Step 5: Export official plugins**

Create `packages/official-plugins/src/index.ts`:

```ts
export { officialLayoutTopSearchGrid } from "./layout-top-search-grid"
export { officialSearchCommandBar } from "./search-command-bar"
export { officialThemeDefaultPack } from "./theme-default-pack"
export { officialWidgetsProductivity } from "./widgets-productivity"

import { officialLayoutTopSearchGrid } from "./layout-top-search-grid"
import { officialSearchCommandBar } from "./search-command-bar"
import { officialThemeDefaultPack } from "./theme-default-pack"
import { officialWidgetsProductivity } from "./widgets-productivity"

export const officialPlugins = [
  officialThemeDefaultPack,
  officialLayoutTopSearchGrid,
  officialSearchCommandBar,
  officialWidgetsProductivity,
]
```

- [ ] **Step 6: Run package tests**

Run:

```bash
vp test packages/official-plugins/src
```

Expected: PASS or "No test files found" depending on Vitest configuration. No TypeScript compile error should be reported by the next check.

- [ ] **Step 7: Commit official plugins**

```bash
git add packages/official-plugins
git commit -m "feat: add official plugin pack"
```

## Task 7: Render Plugin-Assembled Workbench In Solid Playground

**Files:**

- Create: `apps/playground/src/bootstrap.tsx`
- Create: `apps/playground/src/App.tsx`
- Create: `apps/playground/src/app.css`

- [ ] **Step 1: Write Solid bootstrap**

Create `apps/playground/src/bootstrap.tsx`:

```tsx
import { render } from "solid-js/web"
import { App } from "./App"
import "./app.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(() => <App />, root)
```

- [ ] **Step 2: Render registered plugin views**

Create `apps/playground/src/App.tsx`:

```tsx
import { createSignal, For, Show } from "solid-js"
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginKernel } from "@tabora/platform-kernel"
import { applyThemeTokens } from "@tabora/theme"

type WorkbenchCard = {
  id: string
  title: string
  viewId: string
  size: "S" | "M" | "L" | "XL"
}

const cards: WorkbenchCard[] = [
  {
    id: "quick-links-1",
    title: "快捷入口",
    viewId: "official.widgets.quick-links.card",
    size: "M",
  },
  { id: "notes-1", title: "便签", viewId: "official.widgets.notes.card", size: "M" },
]

export function App() {
  const [kernelReady, setKernelReady] = createSignal(false)
  const kernel = createPluginKernel()

  void kernel.discover(officialPlugins).then(async () => {
    await kernel.activateEnabledPlugins()
    applyThemeTokens(document.documentElement, {
      "color-page": "237 241 238",
      "color-surface": "255 255 255",
      "color-text": "31 35 32",
      "color-muted": "102 112 105",
      "color-accent": "35 113 89",
      "color-line": "210 218 213",
      "radius-card": "16px",
    })
    setKernelReady(true)
  })

  const SearchView = () => kernel.registry.views.get("official.search.command-bar.view")

  return (
    <div class="tabora-root">
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        <header class="topbar">{SearchView()({})}</header>
        <section class="workbench-grid">
          <For each={cards}>
            {(card) => {
              const View = kernel.registry.views.get(card.viewId)
              return (
                <div class={`grid-item size-${card.size.toLowerCase()}`} aria-label={card.title}>
                  {View({})}
                </div>
              )
            }}
          </For>
        </section>
      </Show>
    </div>
  )
}
```

- [ ] **Step 3: Add token-driven styling**

Create `apps/playground/src/app.css`:

```css
@import "tailwindcss";

:root {
  --color-page: 237 241 238;
  --color-surface: 255 255 255;
  --color-text: 31 35 32;
  --color-muted: 102 112 105;
  --color-accent: 35 113 89;
  --color-line: 210 218 213;
  --radius-card: 16px;
}

body {
  margin: 0;
  min-height: 100vh;
  color: rgb(var(--color-text));
  background:
    linear-gradient(135deg, rgba(35, 113, 89, 0.18), transparent 32%), rgb(var(--color-page));
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.tabora-root {
  min-height: 100vh;
  padding: 40px;
}

.loading {
  display: grid;
  min-height: 60vh;
  place-items: center;
  color: rgb(var(--color-muted));
}

.topbar {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.search-bar {
  display: grid;
  grid-template-columns: 128px minmax(260px, 680px);
  width: min(840px, 100%);
  overflow: hidden;
  border: 1px solid rgb(var(--color-line));
  border-radius: 18px;
  background: rgba(var(--color-surface), 0.88);
  box-shadow: 0 18px 48px rgba(31, 35, 32, 0.12);
}

.search-provider,
.search-input {
  min-height: 56px;
  border: 0;
  background: transparent;
  color: rgb(var(--color-text));
  font: inherit;
}

.search-provider {
  padding: 0 16px;
  border-right: 1px solid rgb(var(--color-line));
}

.search-input {
  padding: 0 18px;
  outline: none;
}

.workbench-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 16px;
  max-width: 1080px;
  margin: 0 auto;
}

.grid-item {
  min-height: 150px;
}

.size-m {
  grid-column: span 2;
}

.widget-card {
  height: 100%;
  padding: 20px;
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-card);
  background: rgba(var(--color-surface), 0.88);
  box-shadow: 0 16px 36px rgba(31, 35, 32, 0.1);
}

.widget-card h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.widget-card p {
  margin: 0;
  color: rgb(var(--color-muted));
}

.quick-links {
  display: flex;
  gap: 10px;
}

.quick-links a {
  color: rgb(var(--color-accent));
  text-decoration: none;
}

@media (max-width: 760px) {
  .tabora-root {
    padding: 20px;
  }

  .search-bar {
    grid-template-columns: 1fr;
  }

  .search-provider {
    border-right: 0;
    border-bottom: 1px solid rgb(var(--color-line));
  }

  .workbench-grid {
    grid-template-columns: 1fr;
  }

  .size-m {
    grid-column: span 1;
  }
}
```

- [ ] **Step 4: Run playground dev server**

Run:

```bash
vp dev apps/playground
```

Expected: dev server starts and prints a local URL.

- [ ] **Step 5: Verify app builds**

Run:

```bash
vp build apps/playground
```

Expected: PASS and `apps/playground/dist` is created.

- [ ] **Step 6: Commit playground**

```bash
git add apps/playground
git commit -m "feat: render plugin assembled playground"
```

## Task 8: Run Full Verification And Update Design Notes

**Files:**

- Modify: `docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md`

- [ ] **Step 1: Run static checks**

Run:

```bash
vp check
```

Expected: PASS. If formatting changes are applied, inspect them and include them in the verification commit.

- [ ] **Step 2: Run all tests**

Run:

```bash
vp test
```

Expected: PASS.

- [ ] **Step 3: Run workspace build**

Run:

```bash
vp run -r build
```

Expected: PASS for all packages with `build` scripts.

- [ ] **Step 4: Build playground**

Run:

```bash
vp build apps/playground
```

Expected: PASS.

- [ ] **Step 5: Add implementation note to design spec**

Append this section to `docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md`:

```md
## 15. 第一阶段实现记录

第一阶段选择先实现 `apps/playground`，不直接引入 WXT。这样可以先验证插件内核、官方插件装配、主题 token、工作台网格和本地持久化模型。

天气、RSS 和浏览器扩展壳在后续阶段接入。第一阶段的目标是让默认工作台完全通过官方插件包装配出来，并通过 `vp check`、`vp test`、`vp run -r build` 和 `vp build apps/playground` 验证。
```

- [ ] **Step 6: Commit verification note**

```bash
git add docs/superpowers/specs/2026-05-26-plugin-workbench-new-tab-design.md
git commit -m "docs: record Tabora foundation implementation scope"
```

## Self-Review Checklist

- Spec coverage: this plan covers Vite+ scaffold, Solid playground, plugin API, manifest validation, kernel activation, registry, event bus, IndexedDB workspace persistence, theme tokens, official plugins, and default workbench rendering.
- Deliberate exclusions: WXT, remote plugin market, sandbox runtime, pointer drag behavior, real weather network source, real RSS network source, modal/fullscreen host. These are not part of this first foundation plan.
- Test coverage: every package with behavior has a failing test before implementation.
- Verification commands: `vp check`, `vp test`, `vp run -r build`, and `vp build apps/playground`.
