# Tabora 回归治理 Roadmap Implementation Plan

> **归档状态：** 本计划已完成并归档。仅在用户明确要求复盘或审查该计划时使用；当前事实源以 `docs/README.md` 登记的 PRD、设计、技术方案 V2 和回归基准为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `docs/technical/tabora-regression-baseline.md` §10-§11 的已知债务和后续治理建议落成可执行、可验证、可持续扩展的工程治理体系。

**Architecture:** 治理分为三条线并行推进：先修复会破坏安全底线的 P0/P1 架构债务，再把高信号检查固化为 `pnpm check:architecture` / `pnpm quality`，最后把 CI、E2E、发布前回归和 agent 输出模板接入同一套分层基准。实现上优先用小脚本和 Vitest contract tests 承接自动化，不引入重量级治理平台。

**Tech Stack:** pnpm workspace、TypeScript、Vitest、Vite+、Solid、Dexie、Zod、GitHub Actions、rg。

---

## 治理原则

- 安全底线优先：权限桥绕过、插件白屏、数据丢失和发布不可用一律不能以 known debt 放行。
- 文档不是待办仓库：本计划执行完成后，新的事实必须同步到 PRD、官方插件设计、技术方案 V2 或回归基准。
- 自动化优先：能用脚本、测试或 CI 固化的检查，不长期依赖人工 `rg`。
- 分层门禁：本地快速检查、PR 基础门禁、nightly 深度回归、release 强门禁职责不同，不把所有检查塞进每次普通提交。
- 小步治理：每个阶段必须产生独立可验证收益，避免一次性重构 shell、权限、CI 和文档。

## 目标治理模型

| 层级    | 目标                                    | 执行入口                                          | 放行标准                           |
| ------- | --------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| Local   | 开发者和 agent 修改前后快速发现边界问题 | `pnpm check:architecture`、`pnpm quality`         | 无 P0/P1 违规；新增命中有解释      |
| PR      | 基础正确性和包边界稳定                  | `pnpm check`、`pnpm test`、`pnpm build`、架构扫描 | 全部通过                           |
| Nightly | 浏览器关键路径和视觉/交互风险           | `pnpm test:e2e`、browser smoke                    | 默认工作台、权限、布局、设置不回归 |
| Release | 发布包可用和回归摘要可审计              | L8 发布前命令矩阵                                 | 产物可用，摘要完整                 |

## 文件结构

- Create: `scripts/check-architecture.mjs`  
  负责 L2/L6/L7 的高信号静态扫描：插件禁用依赖、裸外部打开、focused/skipped tests、核心包禁用依赖、CSS/token 风险。
- Create: `scripts/quality-report.mjs`  
  负责汇总 `check-architecture`、`rg` 扫描、文件复杂度和 package manifest 风险，输出 human-readable report。
- Modify: `package.json`  
  新增 `check:architecture` 和 `quality` 脚本。
- Modify: `packages/plugin-api/src/manifestSchema.ts`  
  将 `permissions` 从 `z.unknown()` 收紧为 discriminated union schema。
- Modify: `packages/plugin-api/src/manifestSchema.test.ts`  
  增加权限 schema contract tests。
- Modify: `packages/platform-kernel/src/runtimeContext.ts`  
  让权限判断支持统一 URL host 校验，并暴露可复用 permission guard。
- Modify: `packages/platform-kernel/src/runtimeContext.test.ts`  
  覆盖拒绝、通配、非法 URL、host 不匹配。
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`  
  shell 注入 `openExternal` 时按 `instance.pluginId` 校验权限；后续阶段再迁入共享 controller。
- Modify: `plugins/official/widget-quick-links/src/quick-links-card.tsx`  
  移除裸 `<a target="_blank">`，改用 `props.host.openExternal`。
- Modify: `plugins/official/widget-quick-links/src/index.ts`  
  manifest 声明 `external-open`。
- Modify: `plugins/official/widget-quick-links/src/quick-links-card.test.tsx`  
  覆盖 Quick Links 通过 host 打开和权限拒绝 UI。
- Modify: `packages/orchestrator/src/layout-switcher.ts`
- Modify: `packages/orchestrator/src/layout-switcher.test.ts`  
  修正 snapshot 必须在迁移前生成。
- Create: `packages/workbench-app/src/shellController.ts`
- Create: `packages/workbench-app/src/shellController.test.ts`  
  承接 playground / extension 共享 shell 状态机的第一批纯逻辑。
- Modify: `.github/workflows/ci.yml`  
  增加 architecture job；后续加 nightly e2e。
- Modify: `docs/technical/tabora-regression-baseline.md`  
  同步治理脚本入口、已解决债务和 CI 策略变化。
- Modify: `docs/README.md`  
  登记本计划入口，且保持非默认事实源定位。

## Phase 0: 治理入口和优先级冻结

**Files:**

- Create: `docs/superpowers/plans/2026-06-06-regression-governance-roadmap.md`
- Modify: `docs/README.md`

- [ ] **Step 1: 登记计划入口**

在 `docs/README.md` 的“非默认入口”表格中登记：

```md
| `docs/superpowers/plans/2026-06-06-regression-governance-roadmap.md` | 回归治理实施计划 | 用户要求执行回归治理、自动化门禁或债务收口时 |
```

- [ ] **Step 2: 验证入口可检索**

Run:

```bash
rg -n "2026-06-06-regression-governance-roadmap" docs/README.md docs/superpowers/plans/2026-06-06-regression-governance-roadmap.md
```

Expected: 两个文件都有命中。

- [ ] **Step 3: 文档变更基础验证**

Run:

```bash
pnpm check
```

Expected: exit 0.

## Phase 1: P0 权限桥收口

**Files:**

- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Modify: `packages/plugin-api/src/manifestSchema.test.ts`
- Modify: `packages/platform-kernel/src/runtimeContext.ts`
- Modify: `packages/platform-kernel/src/runtimeContext.test.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`
- Modify: `plugins/official/widget-quick-links/src/index.ts`
- Modify: `plugins/official/widget-quick-links/src/quick-links-card.tsx`
- Modify: `plugins/official/widget-quick-links/src/quick-links-card.test.tsx`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: 为 permission schema 写失败测试**

Add tests in `packages/plugin-api/src/manifestSchema.test.ts`:

```ts
it("accepts declared external-open permissions", () => {
  const result = pluginManifestSchema.safeParse({
    id: "official.search.command-bar",
    name: "Search",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["github.com"] }],
    contributes: {},
  })

  expect(result.success).toBe(true)
})

it("rejects malformed plugin permissions", () => {
  const result = pluginManifestSchema.safeParse({
    id: "bad.permissions",
    name: "Bad Permissions",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: "github.com" }],
    contributes: {},
  })

  expect(result.success).toBe(false)
})
```

Run:

```bash
pnpm --filter @tabora/plugin-api test
```

Expected: FAIL because permissions currently accepts unknown objects.

- [ ] **Step 2: 收紧 permission schema**

In `packages/plugin-api/src/manifestSchema.ts`, replace `permissions: z.array(z.unknown()).optional()` with a union equivalent to:

```ts
const pluginPermissionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("external-open"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("storage"),
    scope: z.enum(["plugin", "workspace", "instance"]),
  }),
  z.object({
    type: z.literal("workspace"),
    access: z.enum(["read", "write"]),
  }),
  z.object({
    type: z.literal("network"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("clipboard"),
    access: z.enum(["read", "write"]),
  }),
  z.object({
    type: z.literal("local-file"),
    access: z.enum(["read", "write"]),
  }),
])
```

Expected: plugin-api tests pass after implementation.

- [ ] **Step 3: 为 shell 注入外部打开写回归测试**

Add or update app-level tests so a widget without `external-open` receives `false` from `host.openExternal("https://example.com")`, while a widget with matching permission receives `true`.

Run:

```bash
pnpm --filter @tabora/playground test
```

Expected: FAIL before shell callback is guarded.

- [ ] **Step 4: 统一 shell external-open guard**

Update both shell entries so `buildWidgetViewProps(...).host.openExternal(url)` checks the owning plugin manifest permission before emitting `host.external.open`.

The target behavior:

```ts
async openExternal(url) {
  return openExternalForPlugin(instance.pluginId, url)
}
```

`openExternalForPlugin(pluginId, url)` must:

- find the plugin by `plugin.manifest.id`.
- reject invalid URL.
- reject if no `external-open` permission matches `hostname` or `"*"`.
- emit `host.external.open` only after approval.

- [ ] **Step 5: Quick Links 改走 host capability**

Replace the link anchor with a button:

```tsx
<button class="link-anchor" type="button" onClick={() => void props.host.openExternal(link.url)}>
  <span class="link-icon">{link.title.slice(0, 1).toUpperCase()}</span>
  <span class="link-label">{link.title}</span>
</button>
```

Add `permissions: [{ type: "external-open", hosts: ["*"] }]` to the Quick Links plugin manifest.

- [ ] **Step 6: 静态扫描确认没有裸外部打开**

Run:

```bash
rg -n "window\\.open|target=\"_blank|target='_blank'" apps packages plugins
```

Expected:

- `window.open` only appears in host execution path after permission approval.
- No plugin source renders `target="_blank"` / `target='_blank'`.

- [ ] **Step 7: 验证并同步债务状态**

Run:

```bash
pnpm --filter @tabora/plugin-api test
pnpm --filter @tabora/platform-kernel test
pnpm --filter @tabora/playground test
pnpm --filter @tabora/plugin-quick-links test
pnpm test
pnpm check
pnpm build
```

Update `docs/technical/tabora-regression-baseline.md` §10:

- Mark `host.openExternal()` bypass as resolved with date.
- Mark Quick Links naked external link as resolved with date.
- Keep L6 static scan as ongoing guard.

## Phase 2: P1 布局 snapshot 与 shell 复用边界

**Files:**

- Modify: `packages/orchestrator/src/layout-switcher.ts`
- Modify: `packages/orchestrator/src/layout-switcher.test.ts`
- Create: `packages/workbench-app/src/shellController.ts`
- Create: `packages/workbench-app/src/shellController.test.ts`
- Modify: `packages/workbench-app/src/index.ts`
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/extension/entrypoints/newtab/App.tsx`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: 锁定 snapshot 失败用例**

Add a test in `packages/orchestrator/src/layout-switcher.test.ts`:

```ts
test("snapshot captures the pre-switch instances before migration", () => {
  const plan = createLayoutSwitchPlan({
    workspace: {
      id: "default",
      name: "Default",
      activeLayoutId: "old.layout",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      config: {},
      regions: {
        oldRegion: {
          regionId: "oldRegion",
          accepts: ["widget"],
          instances: [{ instanceId: "todo-1" }],
        },
      },
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
    },
    instances: [
      {
        id: "todo-1",
        workspaceId: "default",
        pluginId: "official.widgets.todo",
        contributionId: "todo",
        extensionPoint: "widget",
        regionId: "oldRegion",
        enabled: true,
        size: "S",
        config: {},
        createdAt: "2026-06-06T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z",
      },
    ],
    targetLayout: {
      id: "new.layout",
      title: "New Layout",
      view: "new.layout.view",
      regions: [{ id: "newRegion", title: "New", accepts: ["widget"] }],
      defaultRegions: {},
      supportsResponsive: true,
    },
  })

  expect(plan.snapshot.layoutId).toBe("old.layout")
  expect(plan.snapshot.instances[0]?.regionId).toBe("oldRegion")
  expect(plan.placedInstances[0]?.regionId).toBe("newRegion")
})
```

Run:

```bash
pnpm --filter @tabora/orchestrator test
```

Expected: FAIL if snapshot is generated from migrated instances.

- [ ] **Step 2: 修正 snapshot 时机**

Ensure `createLayoutSwitchPlan()` builds snapshot from the input `workspace.regions` and input `instances` before any shell reassigns instances. Then update app code so it does not call `createLayoutSwitchPlan()` a second time with already migrated instances.

- [ ] **Step 3: 建立 shell controller 第一批纯模型**

Create `packages/workbench-app/src/shellController.ts` with pure helpers for duplicated shell behavior:

```ts
export type ExternalOpenDecision = {
  allowed: boolean
  reason?: "invalid-url" | "plugin-not-found" | "permission-missing"
}

export function canPluginOpenExternal(options: {
  pluginId: string
  url: string
  plugins: Array<{
    manifest: { id: string; permissions?: Array<{ type: string; hosts?: string[] }> }
  }>
}): ExternalOpenDecision {
  let hostname: string
  try {
    hostname = new URL(options.url).hostname
  } catch {
    return { allowed: false, reason: "invalid-url" }
  }

  const plugin = options.plugins.find((item) => item.manifest.id === options.pluginId)
  if (!plugin) return { allowed: false, reason: "plugin-not-found" }

  const allowed = (plugin.manifest.permissions ?? []).some(
    (permission) =>
      permission.type === "external-open" &&
      Array.isArray(permission.hosts) &&
      permission.hosts.some((host) => host === "*" || host === hostname),
  )

  return allowed ? { allowed: true } : { allowed: false, reason: "permission-missing" }
}
```

Add tests covering invalid URL, missing plugin, missing permission and wildcard host.

- [ ] **Step 4: 用共享模型替换双 app 中重复权限判断**

Import `canPluginOpenExternal()` in both app shell files. Keep DOM-specific `window.open` only in the host execution listener.

- [ ] **Step 5: 复用边界验证**

Run:

```bash
diff -u apps/playground/src/App.tsx apps/extension/entrypoints/newtab/App.tsx | wc -l
pnpm --filter @tabora/workbench-app test
pnpm --filter @tabora/orchestrator test
pnpm test
pnpm check
pnpm build
```

Expected:

- workbench-app and orchestrator tests pass.
- Full commands exit 0.
- Remaining App diff is documented as shell platform wiring, not pure duplicated behavior.

## Phase 3: 架构扫描脚本化

**Files:**

- Create: `scripts/check-architecture.mjs`
- Create: `scripts/quality-report.mjs`
- Modify: `package.json`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: 新增 architecture check 脚本**

Create `scripts/check-architecture.mjs` that scans:

- plugin source importing `@tabora/workbench-shell`, `@tabora/storage`, app source or app package.
- plugin package manifests depending on forbidden host internals.
- `@tabora/ui` importing kernel/storage/official plugins/apps.
- plugin source containing `window.open` or `target="_blank"`.
- focused tests: `it.only`, `test.only`, `describe.only`.
- skipped tests: `.skip(`.
- core packages importing app source.

Expected output on failure:

```txt
Architecture check failed:
- plugins/official/example/src/index.ts imports @tabora/storage: plugins must use host-provided runtime data ports
```

- [ ] **Step 2: 新增 quality report 脚本**

Create `scripts/quality-report.mjs` that runs high-signal scans from L7 and prints grouped sections:

```txt
Quality report
- Type escapes: N
- TODO/FIXME/HACK: N
- Large files top 20: ...
- CSS raw colors: N
- External open signals:
  - host execution paths: N
  - manifest declarations: N
  - runtime method references: N
  - test fixtures: N
  - potential bypass paths: N
```

This script may warn without failing; `check-architecture` owns hard failures.

- [ ] **Step 3: 接入 package scripts**

Modify `package.json`:

```json
{
  "scripts": {
    "check:architecture": "node scripts/check-architecture.mjs",
    "quality": "node scripts/quality-report.mjs"
  }
}
```

- [ ] **Step 4: 验证脚本**

Run:

```bash
pnpm check:architecture
pnpm quality
pnpm check
```

Expected:

- `pnpm check:architecture` exits 0 on current clean baseline after P0 fixes.
- `pnpm quality` prints report and exits 0.
- `pnpm check` exits 0.

- [ ] **Step 5: 同步回归基准**

Update `docs/technical/tabora-regression-baseline.md`:

- L2 suggested command becomes `pnpm check:architecture`.
- L7 suggested command includes `pnpm quality`.
- §5 marks L2/L6/L7 high-signal scans as scripted.

## Phase 4: CI 分层门禁

**Files:**

- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/nightly-regression.yml`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: PR CI 增加 architecture job**

Add a CI job:

```yaml
architecture:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 11.3.0
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm check:architecture
```

- [ ] **Step 2: nightly e2e workflow**

Create `.github/workflows/nightly-regression.yml`:

```yaml
name: Nightly Regression

on:
  schedule:
    - cron: "0 18 * * *"
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.3.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

- [ ] **Step 3: 验证 workflow YAML 和本地命令**

Run:

```bash
pnpm check:architecture
pnpm test:e2e
pnpm check
```

Expected: all exit 0 locally before relying on CI.

- [ ] **Step 4: 同步回归基准**

Update §5:

- CI 已覆盖 `pnpm check:architecture`.
- `pnpm test:e2e` 已进入 nightly.
- PR 是否强制 e2e 仍按路径触发策略后续推进。

## Phase 5: Browser smoke 和关键路径断言

**Files:**

- Modify: `apps/playground/src/workbenchDashboard.e2e.test.tsx`
- Create: `apps/playground/src/workbenchGovernance.e2e.test.tsx`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: 增加权限路径 browser smoke**

Add E2E coverage:

- Search command bar can open an allowed provider.
- Permission-denied path shows inline error or toast.
- Quick Links opens through host callback, not naked anchor.

Run:

```bash
pnpm test:e2e
```

Expected: FAIL until the test hooks and UI behavior are wired.

- [ ] **Step 2: 增加 no-horizontal-scroll 断言**

For viewports `1280x900`, `768x900`, `390x844`, assert:

```ts
expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
  document.documentElement.clientWidth,
)
```

- [ ] **Step 3: 增加 layout fallback 断言**

Trigger a layout view error and assert:

- safe layout renders.
- command/search entry remains reachable.
- settings entry remains reachable.
- error does not white-screen the page.

- [ ] **Step 4: 验证并同步**

Run:

```bash
pnpm test:e2e
pnpm test
pnpm check
```

Update §5 and L4/L5 to reference the new browser smoke coverage.

## Phase 6: 发布前回归摘要自动化

**Files:**

- Create: `scripts/regression-summary.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-playground.yml`
- Modify: `.github/workflows/release-extension.yml`
- Modify: `docs/technical/tabora-regression-baseline.md`

- [ ] **Step 1: 新增 regression summary 脚本**

Create `scripts/regression-summary.mjs` that prints:

```txt
Regression Baseline Summary
- git status:
- changed files:
- required levels:
- commands to run:
- known debt touched:
```

The script should inspect `git diff --name-only` and map paths to change types from §3.

- [ ] **Step 2: package script**

Add:

```json
{
  "scripts": {
    "regression:summary": "node scripts/regression-summary.mjs"
  }
}
```

- [ ] **Step 3: release workflow runs summary before packaging**

In release workflows, run:

```yaml
- name: Regression summary
  run: pnpm regression:summary
```

- [ ] **Step 4: 验证**

Run:

```bash
pnpm regression:summary
pnpm check
pnpm test
pnpm build
```

Expected: summary prints without failing on clean workspace; check/test/build pass.

## Phase 7: 文档收口和债务基线更新

**Files:**

- Modify: `docs/technical/tabora-regression-baseline.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- Modify: `docs/product/tabora-official-plugins-design.md`
- Modify: `docs/README.md`
- Modify: `docs/superpowers/plans/2026-06-06-regression-governance-roadmap.md`

- [ ] **Step 1: 回归基准同步**

Update:

- §5 current automation coverage.
- §10 resolved / remaining debt.
- §11 remove completed short-term items or mark done with date.
- §8 report template includes `pnpm check:architecture`, `pnpm quality`, `pnpm regression:summary`.

- [ ] **Step 2: 技术方案同步**

Update technical design V2:

- shell external-open guard is unified.
- orchestrator dependency boundary is enforced by architecture check.
- shell controller extraction status.
- CI / nightly governance status.

- [ ] **Step 3: 官方插件设计同步**

Update Quick Links section:

- external link opening goes through permission bridge.
- manifest declares `external-open`.
- no naked target blank external link.

- [ ] **Step 4: 计划归档**

When all phases are complete, add at the top of this plan:

```md
> **归档状态：** 本计划已完成并归档。仅在用户明确要求复盘或审查该计划时使用；当前事实源以 `docs/README.md` 登记的 PRD、设计、技术方案 V2 和回归基准为准。
```

- [ ] **Step 5: 最终验证**

Run:

```bash
pnpm check:architecture
pnpm quality
pnpm test
pnpm check
pnpm build
pnpm test:e2e
```

Expected: all required commands exit 0.

## 执行顺序建议

1. Phase 1 必须先做，因为权限桥绕过是 P0，不能被自动化或 shell 重构掩盖。
2. Phase 2 处理 P1：snapshot 和 shell 复用边界，降低后续重复修 bug 的概率。
3. Phase 3 再脚本化扫描，避免把当前已知 P0 作为新脚本的初始失败基线。
4. Phase 4 接 CI，先 PR architecture，再 nightly e2e。
5. Phase 5 增 browser smoke，把关键路径从人工检查迁入可重复断言。
6. Phase 6/7 做发布摘要和文档事实源收口。

## 验收标准

- `external-open` 权限无法被 widget host callback 或裸外链绕过。
- Quick Links、Search Command Bar 外部打开都走权限桥。
- `permissions` runtime 类型和 manifest schema 一致。
- layout switch snapshot 保存切换前状态。
- playground / extension 的共享纯逻辑进入 `@tabora/workbench-app`，剩余重复只限平台渲染差异。
- `pnpm check:architecture` 能阻止 P0/P1 跨层依赖和裸外部打开。
- `pnpm quality` 能输出 L7 高信号扫描报告。
- PR CI 覆盖 architecture check。
- nightly 覆盖 `pnpm test:e2e`。
- 回归基准 §10/§11 与实际完成状态一致。
