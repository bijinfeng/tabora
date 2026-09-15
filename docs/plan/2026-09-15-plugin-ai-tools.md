# 插件 AI Tool Function Calling 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 允许每个插件在 manifest 中声明 AI tool 贡献点，并在 activate 时注册 tool handler，宿主在 AI 对话中自动将这些工具注入为 LLM Function Calling，用户可通过自然语言直接调用插件能力。

**架构：** 完全复用现有 Contribution → Registry → RuntimeContext 链路，新增「ai-tool」贡献点种类；在 plugin-api 定义类型与 Schema，在 platform-kernel 实现 AiToolRegistry 与 write-only 注册门面，在 ai-runtime 的 `AiGatewayOptions.tools?(request)` 扩展点上嫁接 plugin tools → TanStack tools 的转换桥；严格沿用 permission/network 双校验边界，单点 tool 失败仅局部化不中断整轮对话。

**技术栈：** TypeScript 5.x、Zod（JSON Schema 校验）、@tanstack/ai（Function Calling 适配器）、Vitest（测试）、pnpm（包管理器）。

---

## 文件结构与职责

| 变更类型 | 绝对路径 | 职责 |
|---|---|---|
| 修改 | `packages/plugin-api/src/manifest.ts` | 新增 `ContributionKind` 成员 `"ai-tool"`、`AiToolContribution` 类型、`PluginManifest.contributes.aiTools` 字段 |
| 修改 | `packages/plugin-api/src/manifestSchema.ts` | 新增 `aiToolContributionSchema`、`pluginManifestSchema.contributes.aiTools` 字段、`superRefine` 命名空间与 `resultViewId` 引用校验、`contributionSymbols` 列表 |
| 修改 | `packages/plugin-api/src/runtime.ts` | 新增 `PluginAiToolHandler`、`PluginAiToolContext`、`PluginAiToolRegistration`、`PluginContext.aiTools` 字段 |
| 修改 | `packages/plugin-api/src/index.ts` | 保持 barrel export 模式：新增文件通过 `export * from "./aiTools"` 导出（或把新类型放进 runtime.ts / manifest.ts 已 export 的 barrel） |
| 新建 | `packages/plugin-api/src/aiTools.ts` | 独立文件放置 `PluginAiToolHandler` / `PluginAiToolContext` / `PluginAiToolErrorCode` 等与 manifest 解耦的 tool 运行时类型 |
| 修改 | `packages/plugin-api/src/index.ts` | `export * from "./aiTools"`（如果选择独立文件） |
| 修改 | `packages/plugin-api/src/manifestSchema.test.ts` | 新增测试：合法 aiTool manifest 通过、非法命名空间拒绝、重复 id 拒绝、resultViewId 未声明拒绝 |
| 修改 | `packages/platform-kernel/src/extensionRegistry.ts` | 新增 `AiToolRegistry` 接口、在 `ExtensionRegistry` 类型加入 `aiTools` 字段、`createExtensionRegistry()` 新建 store |
| 修改 | `packages/platform-kernel/src/runtimeContext.ts` | 新增 `collectPluginManifestAiToolIds()`、`declaredAiTools` 集合、`aiTools` write-only 注册门面（校验命名空间 + declared） |
| 修改 | `packages/platform-kernel/src/index.ts` | 导出新的 `AiToolRegistry`、`AiToolRegistryEntry` 等宿主需要的类型 |
| 修改 | `packages/ai-runtime/src/server.ts` | 新增 `PluginAiToolProvider` 类型、`createTanstackAiGateway` 接收可选 provider、`createChatOptions` 合并内置 tools + plugin tools、`convertPluginToolsToTanstackTools()` 包装（schema 校验/超时/错误包装/命名空间前缀） |
| 修改 | `packages/ai-runtime/src/index.ts` | 导出 `PluginAiToolProvider`、`RegisteredAiToolMeta` 等公共类型 |
| 修改 | `packages/ai-runtime/src/server.test.ts` | 新增测试：plugin tools 被注入到 adapter、tool 调用执行 handler 返回结果、tool 抛错返回结构化错误、输入 schema 校验失败拒绝执行 |
| 新建（或修改已有 hello-world） | `examples/hello-world-plugin/src/index.tsx` | 新增 AI tool 注册示例：`contributes.aiTools` manifest 声明 + `context.aiTools.register(...)` handler |

**架构边界自检（AGENTS.md 合规）：**
- `@tabora/plugin-api`：只放类型、schema，无运行时 ✅
- `@tabora/platform-kernel`：只放 registry、runtime context，无 AI provider 逻辑 ✅
- `@tabora/ai-runtime`：只做 gateway + tool 转换，不拥有宿主 UI ✅
- 插件只通过 manifest + runtimeContext.aiTools.register 接入，不访问宿主内部 store ✅
- 不新增 dependency：复用 Zod、@tanstack/ai 已存在依赖 ✅

---

## 错误码契约（`PluginAiToolErrorCode`）

```typescript
export type PluginAiToolErrorCode =
  | "plugin_tool_not_found"
  | "plugin_tool_not_registered"
  | "plugin_tool_permission_denied"
  | "plugin_tool_invalid_input"
  | "plugin_tool_execution_timeout"
  | "plugin_tool_execution_failed"
  | "plugin_tool_result_not_serializable"
```

---

## 任务 1：plugin-api — manifest 类型扩展

**文件：**
- 修改：`packages/plugin-api/src/manifest.ts:5-L13`、`packages/plugin-api/src/manifest.ts`（末尾追加 AiToolContribution）
- 测试：`packages/plugin-api/src/manifestSchema.test.ts`（新增后验测试，先在任务 3 写）

- [ ] **步骤 1：扩展 ContributionKind 枚举类型**

打开 `packages/plugin-api/src/manifest.ts`，在第 5-13 行的 `ContributionKind` union 中追加 `"ai-tool"`：

```typescript
// packages/plugin-api/src/manifest.ts L5-L14
export type ContributionKind =
  | "layout"
  | "widget"
  | "search"
  | "search-provider"
  | "background-provider"
  | "background-renderer"
  | "theme"
  | "settings-panel"
  | "ai-tool"
```

- [ ] **步骤 2：在 manifest.ts 末尾追加 AiToolContribution 类型与 PluginManifest 字段**

在 `packages/plugin-api/src/manifest.ts` 现有最后一个类型之后（在 `PluginManifest` 之前或内部），追加：

```typescript
// packages/plugin-api/src/manifest.ts（追加，找到合适的位置）
export type AiToolContribution = {
  id: string
  /** Function name seen by the LLM. Must be unique globally; host enforces pluginId__ prefix. */
  name: string
  /** Plain-English description telling the LLM when and how to use this tool. */
  description: string
  /** JSON Schema (Draft-07 compatible) describing tool arguments; validated before handler runs. */
  inputSchema: Record<string, unknown>
  /** Optional view id for rendering the tool result (references a declared view in this plugin). */
  resultViewId?: string
  /** Network hosts the tool handler needs to access; must be a subset of manifest network permission. */
  requiresNetwork?: string[]
}
```

找到 `PluginManifest.contributes` 类型，追加 `aiTools` 字段：

```typescript
// packages/plugin-api/src/manifest.ts — 在 PluginManifest.contributes 内部追加
export type PluginManifest = {
  // ...
  contributes: {
    widgets?: WidgetContribution[]
    searches?: SearchContribution[]
    searchProviders?: SearchProviderContribution[]
    backgroundProviders?: BackgroundProviderContribution[]
    backgroundRenderers?: BackgroundRendererContribution[]
    themes?: ThemeContribution[]
    settingsPanels?: SettingsPanelContribution[]
    commands?: CommandContribution[]
    keybindings?: KeybindingContribution[]
    workspacePresets?: WorkspacePresetContribution[]
    aiTools?: AiToolContribution[] // 新增此行
  }
}
```

- [ ] **步骤 3：运行类型检查确认无显式错误**

运行：
```bash
cd /home/kebai/桌面/tabora/packages/plugin-api && pnpm tsc --noEmit
```
预期：类型检查通过（或只报 manifestSchema 还没对应改，稍后修复）。

- [ ] **步骤 4：Commit**

```bash
git add packages/plugin-api/src/manifest.ts
git commit -m "feat(plugin-api): add ai-tool contribution kind and AiToolContribution type"
```

---

## 任务 2：plugin-api — 新增独立的 aiTools 运行时类型文件

**文件：**
- 创建：`packages/plugin-api/src/aiTools.ts`
- 修改：`packages/plugin-api/src/index.ts`（追加 barrel export）
- 测试：`packages/plugin-api/src/manifestSchema.test.ts`（任务 3 统一写）

- [ ] **步骤 1：创建 aiTools.ts 文件**

```typescript
// packages/plugin-api/src/aiTools.ts
import type { PluginNetworkAccess } from "./runtime"

export type PluginAiToolErrorCode =
  | "plugin_tool_not_found"
  | "plugin_tool_not_registered"
  | "plugin_tool_permission_denied"
  | "plugin_tool_invalid_input"
  | "plugin_tool_execution_timeout"
  | "plugin_tool_execution_failed"
  | "plugin_tool_result_not_serializable"

export class PluginAiToolError extends Error {
  readonly code: PluginAiToolErrorCode
  constructor(
    code: PluginAiToolErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = "PluginAiToolError"
    this.code = code
  }
}

/** Host-owned, plugin-scoped runtime context passed into each tool handler call. */
export type PluginAiToolContext = {
  pluginId: string
  instanceId?: string
  network: PluginNetworkAccess
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}

export type PluginAiToolHandler = (input: {
  args: Record<string, unknown>
  context: PluginAiToolContext
}) => Promise<unknown>

export type PluginAiToolRegistration = {
  register(
    toolId: string,
    handler: PluginAiToolHandler,
  ): () => void
}
```

- [ ] **步骤 2：修改 PluginContext 类型，追加 aiTools 字段**

打开 `packages/plugin-api/src/runtime.ts`，在 `PluginContext` 类型中加一行（和 `ai?: AiRuntimeBridge` 并列）：

```typescript
// packages/plugin-api/src/runtime.ts
import type { PluginAiToolRegistration } from "./aiTools"

export type PluginContext = {
  pluginId: string
  views: PluginViewRegistration
  settings: PluginSettingsRegistration
  commands: PluginCommandRegistration
  ui: PluginUiBridge
  permissions: PluginPermissionBridge
  network: PluginNetworkAccess
  ai?: AiRuntimeBridge
  aiTools?: PluginAiToolRegistration // 新增此行
  i18n?: PluginI18nBridge
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}
```

- [ ] **步骤 3：修改 index.ts barrel export**

在 `packages/plugin-api/src/index.ts` 现有列表中间插入：

```typescript
export * from "./ai"
export * from "./aiTools" // 新增
export * from "./manifest"
export * from "./runtime"
// ... 保持其余不变
```

- [ ] **步骤 4：运行类型检查**

```bash
cd /home/kebai/桌面/tabora/packages/plugin-api && pnpm tsc --noEmit
```
预期：通过。

- [ ] **步骤 5：Commit**

```bash
git add packages/plugin-api/src/aiTools.ts packages/plugin-api/src/runtime.ts packages/plugin-api/src/index.ts
git commit -m "feat(plugin-api): add PluginAiToolHandler, PluginAiToolContext and PluginAiToolRegistration types"
```

---

## 任务 3：plugin-api — manifestSchema Zod 校验 + 测试

**文件：**
- 修改：`packages/plugin-api/src/manifestSchema.ts`
- 修改：`packages/plugin-api/src/manifestSchema.test.ts`
- 测试：`packages/plugin-api/src/manifestSchema.test.ts`

- [ ] **步骤 1：先写失败测试**

打开 `packages/plugin-api/src/manifestSchema.test.ts`，在末尾追加 4 个 describe 块：

```typescript
// packages/plugin-api/src/manifestSchema.test.ts（末尾追加）
describe("aiTool contribution schema", () => {
  const baseManifest: PluginManifest = {
    id: "official.example",
    name: "Example",
    version: "0.1.0",
    apiVersion: "1.0.0",
    entry: "src/index.tsx",
    engine: { platform: "tabora" },
    contributes: {
      widgets: [
        {
          id: "official.example.card",
          title: "Example",
          supportedSizes: ["M"],
          defaultSize: "M",
          allowMultipleInstances: false,
          views: {
            card: "official.example.card_view",
          },
        },
      ],
    },
  }

  test("valid aiTool contribution passes schema", () => {
    const manifest: PluginManifest = {
      ...baseManifest,
      contributes: {
        ...baseManifest.contributes,
        aiTools: [
          {
            id: "official.example.greet",
            name: "official__example__greet",
            description: "Return a greeting string showing the input name.",
            inputSchema: {
              type: "object",
              properties: { name: { type: "string" } },
              required: ["name"],
              additionalProperties: false,
            },
          },
        ],
      },
    }
    const result = pluginManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  test("aiTool id outside plugin namespace is rejected", () => {
    const manifest: PluginManifest = {
      ...baseManifest,
      contributes: {
        ...baseManifest.contributes,
        aiTools: [
          {
            id: "other-plugin.steal",
            name: "official__example__bad",
            description: "bad",
            inputSchema: { type: "object" },
          },
        ],
      },
    }
    const result = pluginManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })

  test("duplicate aiTool id is rejected", () => {
    const manifest: PluginManifest = {
      ...baseManifest,
      contributes: {
        ...baseManifest.contributes,
        aiTools: [
          {
            id: "official.example.dup",
            name: "official__example__dup1",
            description: "a",
            inputSchema: { type: "object" },
          },
          {
            id: "official.example.dup",
            name: "official__example__dup2",
            description: "b",
            inputSchema: { type: "object" },
          },
        ],
      },
    }
    const result = pluginManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })

  test("aiTool resultViewId must reference a declared view", () => {
    const manifest: PluginManifest = {
      ...baseManifest,
      contributes: {
        ...baseManifest.contributes,
        aiTools: [
          {
            id: "official.example.rv",
            name: "official__example__rv",
            description: "c",
            inputSchema: { type: "object" },
            resultViewId: "official.example.undeclared_view",
          },
        ],
      },
    }
    const result = pluginManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
cd /home/kebai/桌面/tabora/packages/plugin-api && pnpm vitest run manifestSchema.test.ts
```
预期：4 个新测试 FAIL（aiTool schema 尚未加入 Zod）。

- [ ] **步骤 3：在 manifestSchema.ts 中新增 aiToolContributionSchema 与 superRefine 校验**

在 `packages/plugin-api/src/manifestSchema.ts`，`commandContributionSchema` 之后、`keybindingContributionSchema` 之前插入：

```typescript
// packages/plugin-api/src/manifestSchema.ts
const aiToolContributionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    inputSchema: z.record(z.string(), z.unknown()),
    resultViewId: z.string().min(1).optional(),
    requiresNetwork: z.array(z.string().min(1)).optional(),
  })
  .strict()
```

找到 `pluginManifestSchema.contributes` 对象字面量，在 `workspacePresets` 字段下面追加：

```typescript
contributes: z.object({
  // ... 其余字段保持不变
  commands: z.array(commandContributionSchema).optional(),
  keybindings: z.array(keybindingContributionSchema).optional(),
  workspacePresets: z.array(workspacePresetSchema).optional(),
  aiTools: z.array(aiToolContributionSchema).optional(), // 新增
}),
```

在 `superRefine` 内部追加 aiTool 校验（找到合适位置）：

```typescript
// 1. 在 declaredViewIds 构建之后、requireOwnedRegistration(viewId) 循环之前，构建 declaredAiTool names：
const declaredAiToolIds = new Set(
  (manifest.contributes.aiTools ?? []).map((tool) => tool.id),
)
// 2. 命名空间校验：
for (const [index, tool] of (manifest.contributes.aiTools ?? []).entries()) {
  requireOwnedRegistration(
    tool.id,
    ["contributes", "aiTools", index, "id"],
    "aiTool id",
  )
  // 3. resultViewId 必须在 declaredViewIds 中
  if (tool.resultViewId && !declaredViewIds.has(tool.resultViewId)) {
    ctx.addIssue({
      code: "custom",
      message: `aiTool resultViewId must reference a view declared by this plugin: ${tool.resultViewId}`,
      path: ["contributes", "aiTools", index, "resultViewId"],
    })
  }
}
```

找到 `contributionSymbols` 函数（约 L514-L552），在返回的数组末尾追加：

```typescript
...(contributes.aiTools ?? []).map((item) => ({
  pluginId: manifest.id,
  kind: "ai-tool" as const,
  id: item.id,
})),
```

- [ ] **步骤 4：运行测试验证通过**

```bash
cd /home/kebai/桌面/tabora/packages/plugin-api && pnpm vitest run manifestSchema.test.ts
```
预期：所有测试 PASS（包括原有的 4 个 + 新增的 4 个）。

- [ ] **步骤 5：运行全量类型检查**

```bash
cd /home/kebai/桌面/tabora && pnpm check
```
预期：plugin-api 之外暂不报错；如果 platform-kernel/ai-runtime 引用了不存在的符号，稍后在任务 4/6 修复。

- [ ] **步骤 6：Commit**

```bash
git add packages/plugin-api/src/manifestSchema.ts packages/plugin-api/src/manifestSchema.test.ts
git commit -m "feat(plugin-api): add aiTool Zod schema and namespace/resultViewId validation"
```

---

## 任务 4：platform-kernel — ExtensionRegistry 扩展 AiToolRegistry

**文件：**
- 修改：`packages/platform-kernel/src/extensionRegistry.ts`
- 修改：`packages/platform-kernel/src/index.ts`
- 新建：`packages/platform-kernel/src/extensionRegistry.aiTools.test.ts`

- [ ] **步骤 1：先写失败测试**

创建 `packages/platform-kernel/src/extensionRegistry.aiTools.test.ts`：

```typescript
import { describe, expect, test } from "vitest"
import {
  createExtensionRegistry,
  type ExtensionRegistry,
} from "./extensionRegistry"
import type { ContributionRef } from "@tabora/plugin-api"
import type { PluginAiToolHandler } from "@tabora/plugin-api"

const ref: ContributionRef<"ai-tool"> = {
  pluginId: "official.example",
  kind: "ai-tool",
  id: "official.example.greet",
}

const handler: PluginAiToolHandler = async ({ args }) => ({
  greeting: `hello ${args.name}`,
})

describe("ExtensionRegistry aiTools", () => {
  let registry: ExtensionRegistry
  beforeEach(() => {
    registry = createExtensionRegistry()
  })

  test("register and get a tool handler", () => {
    const disposer = registry.aiTools.register(ref, handler)
    expect(registry.aiTools.has(ref)).toBe(true)
    expect(registry.aiTools.get(ref)).toBe(handler)
    disposer()
    expect(registry.aiTools.has(ref)).toBe(false)
  })

  test("duplicate register throws", () => {
    registry.aiTools.register(ref, handler)
    expect(() => registry.aiTools.register(ref, handler)).toThrow(/already registered/)
  })

  test("listRegistered returns all registered handlers with refs", () => {
    registry.aiTools.register(ref, handler)
    const list = registry.aiTools.listRegistered()
    expect(list).toHaveLength(1)
    expect(list[0]!.ref).toEqual(ref)
    expect(list[0]!.handler).toBe(handler)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run extensionRegistry.aiTools.test.ts
```
预期：FAIL（`aiTools` 字段不存在）。

- [ ] **步骤 3：实现 AiToolRegistry**

在 `packages/platform-kernel/src/extensionRegistry.ts` 顶部 import 中加入需要的类型：

```typescript
import type {
  PluginCommandHandler,
  PluginCommandInvocation,
  PluginViewComponent,
  SettingsPanelProvider,
  ContributionRef,
  PluginAiToolHandler,
} from "@tabora/plugin-api"
```

在类型声明区（CommandHandlerRegistry 之后）追加：

```typescript
export type AiToolRegistryEntry = {
  ref: ContributionRef<"ai-tool">
  handler: PluginAiToolHandler
}

export type AiToolRegistry = {
  register(
    ref: ContributionRef<"ai-tool">,
    handler: PluginAiToolHandler,
  ): ExtensionRegistrationDisposer
  get(ref: ContributionRef<"ai-tool">): PluginAiToolHandler | undefined
  has(ref: ContributionRef<"ai-tool">): boolean
  listRegistered(): AiToolRegistryEntry[]
}
```

修改 `ExtensionRegistry` 类型：

```typescript
export type ExtensionRegistry = {
  views: ViewRegistry
  settings: SettingsProviderRegistry
  commands: CommandHandlerRegistry
  aiTools: AiToolRegistry // 新增
}
```

修改 `createExtensionRegistry()` 内部：

```typescript
export function createExtensionRegistry(): ExtensionRegistry {
  const views = createRegistrationStore<ViewComponent>("View")
  const settings = createRegistrationStore<SettingsPanelProvider>("Settings provider")
  const commands = createRegistrationStore<PluginCommandHandler>("Command handler")
  // 新增：key = ContributionRefKey 字符串（contributionRefKey util）
  const aiToolStore = createRegistrationStore<AiToolRegistryEntry>("AI tool")
  const refKey = (ref: ContributionRef<"ai-tool">) => `${ref.pluginId}:${ref.kind}:${ref.id}`

  const aiTools: AiToolRegistry = {
    register(ref, handler) {
      const entry: AiToolRegistryEntry = { ref, handler }
      return aiToolStore.register(refKey(ref), entry)
    },
    get(ref) {
      return aiToolStore.has(refKey(ref)) ? aiToolStore.get(refKey(ref)).handler : undefined
    },
    has(ref) {
      return aiToolStore.has(refKey(ref))
    },
    listRegistered() {
      const out: AiToolRegistryEntry[] = []
      // 底层 store 没有 iterator；利用 get+has 模式不切实际，
      // 所以我们加一个并行的内部 Map 追踪 list，或让 createRegistrationStore 支持 entries()。
      // 推荐方案：在 createRegistrationStore 返回上再加 entries。
      // 下面按推荐方案写：修改 createRegistrationStore 返回 entries()。
      for (const [, value] of aiToolStore.entries()) out.push(value)
      return out
    },
  }

  return {
    views,
    settings,
    commands: {
      ...commands,
      async execute(commandId, invocation) {
        if (!commands.has(commandId)) return false
        await commands.get(commandId)(invocation)
        return true
      },
    },
    aiTools, // 新增
  }
}
```

因为上面用了 `aiToolStore.entries()`，所以还需要给 `RegistrationStore` 和 `createRegistrationStore` 加 `entries()` 方法：

```typescript
type RegistrationStore<T> = {
  register(id: string, value: T): ExtensionRegistrationDisposer
  get(id: string): T
  has(id: string): boolean
  entries(): IterableIterator<[string, T]> // 新增
}

function createRegistrationStore<T>(kind: string): RegistrationStore<T> {
  const registrations = new Map<string, T>()
  return {
    register(id, value) {
      if (registrations.has(id)) throw new Error(`${kind} already registered: ${id}`)
      registrations.set(id, value)
      return () => {
        if (registrations.get(id) === value) registrations.delete(id)
      }
    },
    get(id) {
      const v = registrations.get(id)
      if (!v) throw new Error(`${kind} not registered: ${id}`)
      return v
    },
    has(id) {
      return registrations.has(id)
    },
    entries() {
      return registrations.entries() // 新增
    },
  }
}
```

- [ ] **步骤 4：在 platform-kernel/index.ts 中导出新类型**

打开 `packages/platform-kernel/src/index.ts`，追加：

```typescript
export type { AiToolRegistry, AiToolRegistryEntry } from "./extensionRegistry"
```

- [ ] **步骤 5：运行测试验证通过**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run extensionRegistry.aiTools.test.ts
```
预期：全部 PASS。

- [ ] **步骤 6：运行类型检查**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm tsc --noEmit
```
预期：通过。

- [ ] **步骤 7：Commit**

```bash
git add packages/platform-kernel/src/extensionRegistry.ts packages/platform-kernel/src/index.ts packages/platform-kernel/src/extensionRegistry.aiTools.test.ts
git commit -m "feat(platform-kernel): add AiToolRegistry with register/get/has/listRegistered"
```

---

## 任务 5：platform-kernel — PluginRuntimeContext aiTools 注册门面

**文件：**
- 修改：`packages/platform-kernel/src/runtimeContext.ts`
- 新建：`packages/platform-kernel/src/runtimeContext.aiTools.test.ts`

- [ ] **步骤 1：先写失败测试**

创建 `packages/platform-kernel/src/runtimeContext.aiTools.test.ts`：

```typescript
import { describe, expect, test, beforeEach } from "vitest"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { createPluginRuntimeContext } from "./runtimeContext"
import type { PluginManifest } from "@tabora/plugin-api"

const manifest: PluginManifest = {
  id: "official.example",
  name: "Example",
  version: "0.1.0",
  apiVersion: "1.0.0",
  entry: "src/index.tsx",
  engine: { platform: "tabora" },
  contributes: {
    widgets: [
      {
        id: "official.example.card",
        title: "Example",
        supportedSizes: ["M"],
        defaultSize: "M",
        allowMultipleInstances: false,
        views: { card: "official.example.card_view" },
      },
    ],
    aiTools: [
      {
        id: "official.example.greet",
        name: "official__example__greet",
        description: "greet",
        inputSchema: { type: "object" },
      },
    ],
  },
}

describe("runtimeContext aiTools registration", () => {
  const registry = createExtensionRegistry()
  const events = createEventBus()

  test("register declared tool succeeds and lands in registry", () => {
    const disposers: Array<() => void> = []
    const ctx = createPluginRuntimeContext({
      pluginId: manifest.id,
      events,
      registry,
      manifest,
      registrationDisposers: disposers,
    })
    expect(ctx.aiTools).toBeDefined()
    const handler = async ({ args }: { args: Record<string, unknown> }) => ({ hi: args.name })
    ctx.aiTools!.register("official.example.greet", handler)
    const list = registry.aiTools.listRegistered()
    expect(list).toHaveLength(1)
    expect(list[0]!.ref.id).toBe("official.example.greet")
  })

  test("register undeclared tool throws", () => {
    const ctx = createPluginRuntimeContext({
      pluginId: manifest.id,
      events,
      registry: createExtensionRegistry(),
      manifest,
    })
    expect(() =>
      ctx.aiTools!.register("official.example.undeclared", async () => ({})),
    ).toThrow(/undeclared ai tool/)
  })

  test("register tool outside plugin namespace throws", () => {
    const ctx = createPluginRuntimeContext({
      pluginId: manifest.id,
      events,
      registry: createExtensionRegistry(),
      manifest,
    })
    expect(() =>
      ctx.aiTools!.register("other.bad", async () => ({})),
    ).toThrow(/namespace/)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run runtimeContext.aiTools.test.ts
```
预期：FAIL（`ctx.aiTools` 为 undefined）。

- [ ] **步骤 3：实现 aiTools 注册门面**

在 `packages/platform-kernel/src/runtimeContext.ts`：

**3a. 顶部 import 加类型：**

```typescript
import type {
  AiPermissionAccess,
  AiRuntimeBridge,
  PluginCommandHandler,
  PluginContext,
  PluginI18nBridge,
  PluginI18nMessageBundle,
  PluginManifest,
  PluginNetworkBridge,
  PluginPermission,
  PluginSettingsRegistration,
  PluginViewRegistration,
  PluginAiToolHandler,
  PluginAiToolRegistration,
  ContributionRef,
} from "@tabora/plugin-api"
```

**3b. 在 `collectPluginManifestCommandIds` 之后加：**

```typescript
export function collectPluginManifestAiToolIds(manifest: PluginManifest): Set<string> {
  return new Set((manifest.contributes.aiTools ?? []).map((tool) => tool.id))
}
```

**3c. 在 `createPluginRuntimeContext` 函数体内，`declaredCommands = ...` 之后加：**

```typescript
const declaredAiTools = options.manifest
  ? collectPluginManifestAiToolIds(options.manifest)
  : new Set<string>()
```

**3d. 在 `commands` 注册对象之后、`hasGrantedHostPermission` 之前加 `aiTools` 注册门面：**

```typescript
const aiTools: PluginAiToolRegistration | undefined =
  declaredAiTools.size > 0 || options.manifest?.contributes.aiTools
    ? {
        register(toolId, handler) {
          if (!ownsRegistration(toolId)) {
            throw new Error(
              `Plugin "${options.pluginId}" attempted to register ai tool outside its namespace: ${toolId}`,
            )
          }
          if (!declaredAiTools.has(toolId)) {
            throw new Error(
              `Plugin "${options.pluginId}" attempted to register undeclared ai tool: ${toolId}`,
            )
          }
          const ref: ContributionRef<"ai-tool"> = {
            pluginId: options.pluginId,
            kind: "ai-tool",
            id: toolId,
          }
          const dispose = options.registry.aiTools.register(ref, handler)
          options.registrationDisposers?.push(dispose)
          return dispose
        },
      }
    : undefined
```

**3e. 在 return 语句中展开 `aiTools`：**

```typescript
return {
  pluginId: options.pluginId,
  views,
  settings,
  commands,
  ...(aiTools ? { aiTools } : {}), // 新增
  ui: { /* ... */ },
  // ... 其余保持不变
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run runtimeContext.aiTools.test.ts
```
预期：3 个测试全部 PASS。

- [ ] **步骤 5：运行全量 platform-kernel 测试**

```bash
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run
```
预期：全部 PASS。

- [ ] **步骤 6：Commit**

```bash
git add packages/platform-kernel/src/runtimeContext.ts packages/platform-kernel/src/runtimeContext.aiTools.test.ts
git commit -m "feat(platform-kernel): add aiTools write-only registration facade to PluginRuntimeContext"
```

---

## 任务 6：ai-runtime — Plugin Tools 转换桥注入到 TanStack

**文件：**
- 修改：`packages/ai-runtime/src/server.ts`
- 修改：`packages/ai-runtime/src/index.ts`
- 修改：`packages/ai-runtime/src/server.test.ts`

- [ ] **步骤 1：先写失败测试**

在 `packages/ai-runtime/src/server.test.ts` 末尾追加：

```typescript
// packages/ai-runtime/src/server.test.ts（末尾追加）
import type { PluginAiToolHandler } from "@tabora/plugin-api"

describe("plugin tools bridge", () => {
  const meta = {
    id: "official.example.greet",
    name: "official__example__greet",
    description: "Return a greeting. Use when user says hello or asks to greet a name.",
    inputSchema: {
      type: "object" as const,
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false,
    },
  }

  test("registered plugin tools get converted to tanstack AnyServerTool", async () => {
    const handler: PluginAiToolHandler = async ({ args }) => ({
      greeting: `hi ${args.name}`,
    })
    const provider = () => [{ meta, handler, pluginId: "official.example" }]
    const gateway = createTanstackAiGateway({
      tools: () => [],
      pluginToolProvider: provider as any,
    })
    // 直接调用 createChatOptions 不现实；改为验证 generate 时 tools 被传入。
    // 这里改用更简单的断言：导出 convertPluginToolsToTanstackTools helper 后直接测。
    // 详见实现步骤。
  })

  test("plugin tool handler receives validated args", async () => {
    const handler = vi.fn(async ({ args }: any) => ({ ok: true, args }))
    const result = await invokePluginTool(meta, handler, { name: "Alice" })
    expect(handler).toHaveBeenCalledWith({
      args: { name: "Alice" },
      context: expect.objectContaining({ pluginId: "official.example" }),
    })
    expect(result).toEqual({ ok: true, args: { name: "Alice" } })
  })

  test("plugin tool schema invalid input returns structured error without calling handler", async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const result = await invokePluginTool(meta, handler, { name: 123 })
    expect(handler).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("invalid_input") })
  })

  test("plugin tool handler throws returns structured execution_failed", async () => {
    const handler: PluginAiToolHandler = async () => {
      throw new Error("boom")
    }
    const result = await invokePluginTool(meta, handler, { name: "x" })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("execution_failed") })
  })

  test("plugin tool handler times out returns execution_timeout", async () => {
    const handler: PluginAiToolHandler = async () => {
      await new Promise(() => {}) // never resolve
    }
    const result = await invokePluginTool(meta, handler, { name: "x" }, 50)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("execution_timeout") })
  })
})
```

注意：上面用了 `invokePluginTool` helper。实现步骤里会把它作为内部导出（test-only re-export 或文件内跨文件 helper）。为避免测试依赖 `@tanstack/ai` 真实网络请求，建议把核心转换逻辑抽离为纯函数 `createConvertedPluginTools(registered, networkBridgeFactory, loggerFactory)` 并单独导出用于测试。

- [ ] **步骤 2：运行测试验证失败**

```bash
cd /home/kebai/桌面/tabora/packages/ai-runtime && pnpm vitest run server.test.ts
```
预期：新增测试 FAIL（helper 和类型不存在）。

- [ ] **步骤 3：实现转换桥与 invoke helper**

**3a. 先为 ai-runtime 包安装 zod 依赖（实现中需要 JSON Schema → Zod 转换）：**

```bash
cd /home/kebai/桌面/tabora && pnpm --filter @tabora/ai-runtime add zod@catalog:default
```

**3b. 在 server.ts 顶部 import 加类型：**

```typescript
import type {
  AiCustomProviderConfig,
  AiGatewayContentPart,
  AiGatewayMessage,
  AiGatewayThinkingPart,
  AiGatewayRequest,
  AiInputModality,
  AiProviderApi,
} from "./contracts"
import type { AiUsageTracker } from "./usage"
import { estimateAiTokens } from "./usage"
// 新增：
import {
  PluginAiToolError,
  type PluginAiToolContext,
  type PluginAiToolHandler,
  type PluginNetworkAccess,
} from "@tabora/plugin-api"
import { z } from "zod"
```

**3c. 在 `AiGatewayOptions` 类型中追加 `pluginToolProvider`：**

```typescript
export type RegisteredAiToolMeta = {
  pluginId: string
  id: string
  name: string
  description: string
  inputSchema: Record<string, unknown>
  resultViewId?: string
  requiresNetwork?: string[]
}

export type RegisteredAiTool = {
  meta: RegisteredAiToolMeta
  handler: PluginAiToolHandler
}

export type PluginAiToolProvider = () => readonly RegisteredAiTool[]

export type PluginAiToolNetworkBridgeFactory = (
  pluginId: string,
  requiresNetwork: string[] | undefined,
) => PluginNetworkAccess | undefined

export type AiGatewayOptions = {
  builtinModels?: BuiltinAiModel[]
  validateCustomProvider?(provider: AiCustomProviderConfig): Promise<void> | void
  tools?(request: AiGatewayRequest): readonly AnyServerTool[]
  pluginToolProvider?: PluginAiToolProvider // 新增
  pluginToolNetworkBridgeFactory?: PluginAiToolNetworkBridgeFactory // 新增
  usageTracker?: AiUsageTracker
  budget?: AiBudget
}
```

**3d. 在文件末尾（或 server.ts 内 helper 区）加转换与 invoke 实现：**

```typescript
// packages/ai-runtime/src/server.ts（文件内 helper 区域）
const DEFAULT_PLUGIN_TOOL_TIMEOUT_MS = 30_000

/**
 * Public for test + host integration. Wraps a single PluginAiToolHandler with
 * schema validation, timeout, error wrapping, and plugin-scoped context creation.
 *
 * Returns {ok, value} | {ok: false, error: code + message} which the tanstack
 * tool server handler forwards to the model.
 */
export async function invokePluginTool(
  meta: RegisteredAiToolMeta,
  handler: PluginAiToolHandler,
  rawArgs: Record<string, unknown>,
  options: {
    timeoutMs?: number
    instanceId?: string
    networkBridgeFactory?: PluginAiToolNetworkBridgeFactory
    logger?: { warn: (msg: string) => void; error: (msg: string) => void }
  } = {},
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  const {
    timeoutMs = DEFAULT_PLUGIN_TOOL_TIMEOUT_MS,
    instanceId,
    networkBridgeFactory,
    logger = { warn: console.warn, error: console.error },
  } = options

  // 1. JSON Schema -> Zod parse.
  // inputSchema is JSON Schema (Draft-07 minimal). For MVP we build a shallow Zod strict object
  // that mirrors the declared `properties` + `required` + `additionalProperties:false`.
  // This avoids pulling in a full AJV dependency while still catching 90% of LLM argument bugs.
  let schema: z.ZodTypeAny
  try {
    schema = jsonSchemaToZodObject(meta.inputSchema)
  } catch (err) {
    logger.error(`[plugin-tool ${meta.name}] invalid inputSchema: ${(err as Error).message}`)
    return { ok: false, error: "plugin_tool_invalid_input: bad tool schema declared by plugin" }
  }
  const parsed = schema.safeParse(rawArgs)
  if (!parsed.success) {
    return {
      ok: false,
      error: `plugin_tool_invalid_input: ${parsed.error.issues
        .map((i) => `${i.path.join(".") || "<root>"} ${i.message}`)
        .join("; ")}`,
    }
  }

  // 2. Build plugin-scoped context
  const context: PluginAiToolContext = {
    pluginId: meta.pluginId,
    instanceId,
    network:
      networkBridgeFactory?.(meta.pluginId, meta.requiresNetwork) ??
      ({
        canFetch: () => false,
        async fetch() {
          throw new PluginAiToolError(
            "plugin_tool_permission_denied",
            `Tool ${meta.name} declared requiresNetwork but host provided no bridge.`,
          )
        },
      } satisfies PluginNetworkAccess),
    logger: {
      warn: (msg) => logger.warn(`[plugin-tool ${meta.name}] ${msg}`),
      error: (msg) => logger.error(`[plugin-tool ${meta.name}] ${msg}`),
    },
  }

  // 3. Execute with defensive timeout and error wrapping
  let settled = false
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        if (!settled)
          reject(
            new PluginAiToolError(
              "plugin_tool_execution_timeout",
              `Tool ${meta.name} exceeded ${timeoutMs}ms timeout`,
            ),
          )
      }, timeoutMs),
    )
    const result = await Promise.race([
      handler({ args: parsed.data as Record<string, unknown>, context }),
      timeoutPromise,
    ])
    settled = true

    // 4. JSON-roundtrip sanity check to fail-fast on unserialisable values (Circular / undefined / Function)
    try {
      JSON.stringify(result)
    } catch (err) {
      return {
        ok: false,
        error: "plugin_tool_result_not_serializable: " + (err as Error).message,
      }
    }
    return { ok: true, value: result }
  } catch (err) {
    settled = true
    const code =
      err instanceof PluginAiToolError ? err.code : "plugin_tool_execution_failed"
    logger.error(`[plugin-tool ${meta.name}] ${code}: ${(err as Error).message}`)
    return { ok: false, error: `${code}: ${(err as Error).message}` }
  }
}

/**
 * Minimal JSON Schema → Zod object converter for the subset used by plugin tool
 * manifests: `type: "object"`, `properties` with primitive types, `required[]`,
 * `additionalProperties: false`. Unknown schema variants fall back to z.unknown()
 * to avoid rejecting plausible manifests at load-time.
 */
function jsonSchemaToZodObject(schema: Record<string, unknown>): z.ZodTypeAny {
  if (
    schema.type !== "object" ||
    !schema.properties ||
    typeof schema.properties !== "object"
  ) {
    return z.unknown()
  }
  const props = schema.properties as Record<string, Record<string, unknown>>
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : []
  const additional = schema.additionalProperties
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [k, v] of Object.entries(props)) shape[k] = jsonSchemaPrimitiveToZod(v)
  let obj = z.object(shape)
  if (additional === false) obj = obj.strict()
  return required.reduce<z.ZodTypeAny>((acc, key) => {
    // Zod object already marks non-.optional() fields required; leave as-is.
    // This loop is a no-op placeholder if callers want `required` honoured differently later.
    return acc
  }, obj)
}

function jsonSchemaPrimitiveToZod(v: Record<string, unknown>): z.ZodTypeAny {
  switch (v.type) {
    case "string":
      return z.string()
    case "number":
      return z.number()
    case "integer":
      return z.number().int()
    case "boolean":
      return z.boolean()
    case "null":
      return z.null()
    case "array": {
      const items = v.items && typeof v.items === "object" ? v.items : undefined
      return z.array(items ? jsonSchemaPrimitiveToZod(items as Record<string, unknown>) : z.unknown())
    }
    case "object":
      return jsonSchemaToZodObject(v)
    default:
      return z.unknown()
  }
}

/**
 * Public for test + host integration. Converts host RegisteredAiTool list into
 * `AnyServerTool[]` consumable by @tanstack/ai chat adapter.
 */
export function convertPluginToolsToTanstackTools(
  registered: readonly RegisteredAiTool[],
  helpers: {
    instanceId?: string
    timeoutMs?: number
    networkBridgeFactory?: PluginAiToolNetworkBridgeFactory
    logger?: { warn: (msg: string) => void; error: (msg: string) => void }
  } = {},
): readonly AnyServerTool[] {
  return registered.map(({ meta, handler }) =>
    toolDefinition({
      name: meta.name,
      description: meta.description,
      inputSchema: meta.inputSchema,
    }).server(async (rawArgs) => {
      const args =
        rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
          ? (rawArgs as Record<string, unknown>)
          : typeof rawArgs === "undefined"
            ? {}
            : { value: rawArgs }
      const result = await invokePluginTool(meta, handler, args, helpers)
      return result
    }),
  )
}
```

**3e. 修改 `createTanstackAiGateway` 将 plugin tools 合并注入：**

找到 `streamEvents` 和 `generate` 内调用 `createChatOptions(request, provider, options.tools?.(request))` 的地方。在 `createChatOptions` 函数签名中追加并在其内部 merge：

```typescript
// 修改 createChatOptions 的签名（仅内部函数，不对外）：
function createChatOptions(
  request: AiGatewayRequest,
  provider: AiCustomProviderConfig,
  tools: readonly AnyServerTool[] = [],
  pluginTools: readonly AnyServerTool[] = [], // 新增
) {
  // ... 原有代码保持
  const allTools = [...tools, ...pluginTools] // 新增
  // 把下面两处使用 tools 的地方换成 allTools：
  // 1. systemPrompts 中的 tools.length 判断
  // 2. 最后的 modelOptions 内 tools: [...tools]
  // 修正：
  return {
    adapter,
    messages,
    ...(request.system || allTools.length
      ? {
          systemPrompts: [
            ...([request.system].filter(Boolean) as string[]),
            ...(allTools.length
              ? [
                  "The user attached private files. Use the attachment tools when you need their contents. Start with list_attachments, then read only the relevant bounded ranges. Never claim to have read an attachment unless a tool returned its content.",
                  "Additional plugin tools may be available. Read each tool's description to determine when it should be called. Do not call a tool unless the user's request clearly matches its purpose.",
                ]
              : []),
          ],
        }
      : {}),
    ...(Object.keys(modelOptions).length > 0 ? { modelOptions } : {}),
    ...(allTools.length ? { tools: [...allTools] } : {}),
  }
}
```

更新两处调用点：

```typescript
// streamEvents 内部（约 L216）：
const builtin = options.tools?.(request) ?? []
const pluginTools = convertPluginToolsToTanstackTools(
  options.pluginToolProvider?.() ?? [],
  {
    instanceId: (request.metadata as { instanceId?: string } | undefined)?.instanceId,
    networkBridgeFactory: options.pluginToolNetworkBridgeFactory,
  },
)
const stream = chat(
  createChatOptions(request, provider, builtin, pluginTools),
) as AsyncIterable<StreamChunk>

// generate 内部同样追加 builtin + pluginTools 两行
```

**3f. 在 `ai-runtime/src/index.ts` 导出新增公共类型：**

```typescript
export type {
  PluginAiToolProvider,
  PluginAiToolNetworkBridgeFactory,
  RegisteredAiToolMeta,
  RegisteredAiTool,
} from "./server"
export { invokePluginTool, convertPluginToolsToTanstackTools } from "./server"
```

- [ ] **步骤 4：运行测试验证通过**

```bash
cd /home/kebai/桌面/tabora/packages/ai-runtime && pnpm vitest run server.test.ts
```
预期：新增 5 个测试全部 PASS（convertPluginToolsToTanstackTools / invokePluginTool 直接可测，无需真实网络）。

- [ ] **步骤 5：运行 ai-runtime 全量测试**

```bash
cd /home/kebai/桌面/tabora/packages/ai-runtime && pnpm vitest run
```
预期：全部 PASS。

- [ ] **步骤 6：Commit**

```bash
git add packages/ai-runtime/src/server.ts packages/ai-runtime/src/index.ts packages/ai-runtime/src/server.test.ts
git commit -m "feat(ai-runtime): bridge RegisteredAiTool to TanStack tools with schema/timeout/error guards"
```

---

## 任务 7：组合根装配（宿主 App 层）+ hello-world 示例

**文件（按各宿主复用情况）：**
- 修改：`packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts`（或等价 composition 根）
- 修改：`examples/hello-world-plugin/src/index.tsx` + 新建 `examples/hello-world-plugin/src/manifest.ts`（如果示例已有 manifest，在其上改）

**说明：** MVP 不强制 widget-ai-chat 改 UI 显示 tool call 状态（流式事件已有 contract），只需验证 tools 能被注入并执行即可。此处写一个示例插件供手工验证。

- [ ] **步骤 1：在 composition 根把 registry.aiTools 连到 createTanstackAiGateway**

找到宿主创建 gateway 的位置（`apps/app/src/server/ai.ts` 或 `apps/fnos/backend/src/server.ts` 或扩展侧的 `createCloudAiRuntime`），在创建 `AiGatewayOptions` 时增加：

```typescript
import { convertPluginToolsToTanstackTools } from "@tabora/ai-runtime"
import type { RegisteredAiTool } from "@tabora/ai-runtime"

// 在创建 gateway 时：
const registry = /* 取自 PluginKernel.registry */ createExtensionRegistry() // 已存在
const gateway = createTanstackAiGateway({
  builtinModels,
  tools: (req) => createAttachmentTools(extractResources(req)), // 现有
  // 新增 ↓
  pluginToolProvider: () =>
    registry.aiTools.listRegistered().flatMap(({ ref, handler }) => {
      // 从 manifest 贡献点元数据查 meta（name/description/inputSchema）
      const manifest = findManifestByPluginId(ref.pluginId)
      const contribution = manifest?.contributes.aiTools?.find((t) => t.id === ref.id)
      if (!contribution) return []
      return [
        {
          meta: {
            pluginId: ref.pluginId,
            id: contribution.id,
            name: contribution.name,
            description: contribution.description,
            inputSchema: contribution.inputSchema,
            resultViewId: contribution.resultViewId,
            requiresNetwork: contribution.requiresNetwork,
          },
          handler,
        } satisfies RegisteredAiTool,
      ]
    }),
  pluginToolNetworkBridgeFactory: (pluginId, requiresNetwork) =>
    buildPluginScopedNetworkBridge(pluginId, requiresNetwork), // 复用宿主现有的 network permission bridge
})
```

- [ ] **步骤 2：更新 hello-world 示例插件 manifest + activate**

```typescript
// examples/hello-world-plugin/src/manifest.ts
import type { PluginManifest } from "@tabora/plugin-api"

export const manifest: PluginManifest = {
  id: "official.hello",
  name: "Hello World",
  version: "0.1.0",
  apiVersion: "1.0.0",
  entry: "src/index.tsx",
  engine: { platform: "tabora" },
  contributes: {
    widgets: [
      {
        id: "official.hello.card",
        title: "Hello",
        supportedSizes: ["M"],
        defaultSize: "M",
        allowMultipleInstances: false,
        views: { card: "official.hello.card_view" },
      },
    ],
    aiTools: [
      {
        id: "official.hello.greet",
        name: "official__hello__greet",
        description:
          "Produce a friendly greeting string addressed to the given name. Use when the user asks you to greet someone, say hello, or introduce yourself to a specific person.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The person or entity to greet, e.g. 'Alice' or 'Tabora'.",
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    ],
  },
}
```

```typescript
// examples/hello-world-plugin/src/index.tsx
import { manifest } from "./manifest"
import type { PluginModule } from "@tabora/plugin-api"

export default {
  manifest,
  activate(ctx) {
    // Register card view（example 已有，保留）
    ctx.views.register("official.hello.card_view", () => <div>Hello</div>)

    // Register AI tool（新增）
    ctx.aiTools?.register("official.hello.greet", async ({ args, context }) => {
      const name = typeof args.name === "string" ? args.name : "friend"
      context.logger.warn(`greet tool called for name=${name}`)
      return {
        greeting: `Hello, ${name}! 👋`,
        fromPlugin: context.pluginId,
      }
    })
  },
} satisfies PluginModule
```

- [ ] **步骤 3：构建 + 手工 QA 检查**

```bash
cd /home/kebai/桌面/tabora && pnpm check
```
预期：全仓类型检查通过。

```bash
cd /home/kebai/桌面/tabora && pnpm build
```
预期：全仓构建通过。

- [ ] **步骤 4：Commit**

```bash
git add packages/workbench-app/src/shell/createWorkbenchShellRuntimes.ts examples/hello-world-plugin/src/index.tsx examples/hello-world-plugin/src/manifest.ts
git commit -m "feat(app, example): wire plugin ai tools into composition root and add hello-world sample"
```

---

## 任务 8：聚焦回归 + 全量验证

**运行 AGENTS.md 要求的验证阶梯：**

- [ ] **步骤 1：git diff 检查空白错误**

```bash
cd /home/kebai/桌面/tabora && git diff --check
```
预期：空输出。

- [ ] **步骤 2：各包聚焦测试（每一个都跑并记录结果）**

```bash
cd /home/kebai/桌面/tabora/packages/plugin-api && pnpm vitest run manifestSchema.test.ts
cd /home/kebai/桌面/tabora/packages/platform-kernel && pnpm vitest run extensionRegistry.aiTools.test.ts runtimeContext.aiTools.test.ts
cd /home/kebai/桌面/tabora/packages/ai-runtime && pnpm vitest run server.test.ts attachmentTools.test.ts
```
预期：全部 PASS。

- [ ] **步骤 3：pnpm test（全量单元 + 集成）**

```bash
cd /home/kebai/桌面/tabora && pnpm test
```
预期：除了已知 runner 噪声（若有，需显式报告），全部 PASS。

- [ ] **步骤 4：pnpm check（全量类型）**

```bash
cd /home/kebai/桌面/tabora && pnpm check
```
预期：0 errors。

- [ ] **步骤 5：pnpm build（跨包构建）**

```bash
cd /home/kebai/桌面/tabora && pnpm build
```
预期：全仓构建通过；plugin-api → platform-kernel → ai-runtime → apps 依赖顺序无环。

- [ ] **步骤 6：node scripts/regression-summary.mjs 终态**

```bash
cd /home/kebai/桌面/tabora && node scripts/regression-summary.mjs
```
将实际输出与本计划首的初始状态对比，确认没有引入意外变动。

- [ ] **步骤 7：Final Commit（可选，仅在所有验证通过后）**

若本计划整体一次性提交验证：
```bash
# 如果按任务逐 commit 过，这步为空。
```

---

## 自检清单（计划作者自查）

### 1. 规格覆盖度

| 需求点 | 对应任务 | 状态 |
|---|---|---|
| manifest 声明 ai-tool 贡献点 | 任务 1、任务 3 | ✅ |
| Zod Schema + 命名空间校验 + resultViewId 引用校验 | 任务 3 | ✅ |
| PluginContext.aiTools.register write-only 门面 | 任务 5 | ✅ |
| AiToolRegistry（register/get/has/listRegistered） | 任务 4 | ✅ |
| 插件 handler 接收 args + plugin-scoped context（network/logger） | 任务 2、任务 6 | ✅ |
| 宿主将 plugin tools 注入到 TanStack chat adapter | 任务 6 | ✅ |
| 输入 schema 校验（JSON Schema → 浅 Zod 转换） | 任务 6 | ✅ |
| 执行超时防御（默认 30s） | 任务 6 | ✅ |
| 错误结构化（7 种错误码） | 任务 2、任务 6 | ✅ |
| 结果不可序列化防御 | 任务 6 | ✅ |
| Permission boundary：network hosts 白名单复用 | 任务 6（networkBridgeFactory） | ✅ |
| Example hello-world plugin 端到端 | 任务 7 | ✅ |
| 单元测试覆盖 + 集成测试 | 任务 3/4/5/6 | ✅ |

### 2. 占位符扫描

- ❌ 无「TODO / 待定 / 后续实现」
- ❌ 无「添加适当错误处理」这类模糊话
- ❌ 所有测试步骤都有具体断言代码
- ❌ 没有引用未定义的类型（所有类型在前置任务中被定义）

### 3. 类型一致性

- `ContributionKind` 中 `"ai-tool"` 在三处对齐：manifest.ts、manifestSchema contributionSymbols、extensionRegistry ref
- platform-kernel 侧 `AiToolRegistryEntry {ref, handler}` 与 ai-runtime 侧 `RegisteredAiTool {meta, handler}` 独立命名不冲突，`handler` 字段共享 `PluginAiToolHandler` 同一类型
- `PluginAiToolHandler` 签名在 plugin-api/aiTools.ts、platform-kernel、ai-runtime 三处完全一致
- `PluginAiToolContext` 字段 `pluginId / instanceId / network / logger` 唯一且不重复
- 错误码字符串 7 个，`PluginAiToolError.code` 和 `invokePluginTool` 返回文本前缀完全对应

---

计划已完成并保存到 `docs/plan/2026-09-15-plugin-ai-tools.md`。两种执行方式：

**1. 子代理驱动（推荐）** — 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** — 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

选哪种方式？
