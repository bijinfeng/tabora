import { describe, expect, it } from "vitest"

import {
  buildQualityReport,
  findCorePackageAppImports,
  findForbiddenPluginDependencies,
  findForbiddenPluginImports,
  findForbiddenUiDependencies,
  findForbiddenUiImports,
  findPluginExternalOpenViolations,
  findRawColorMatches,
  findTestModeViolations,
  rankFilesByLineCount,
} from "../../scripts/lib/governance.mjs"

describe("governance rules", () => {
  it("detects forbidden plugin imports and dependencies", () => {
    expect(
      findForbiddenPluginImports({
        filePath: "plugins/example/src/index.ts",
        source: `
          import { SettingsHost } from "@tabora/workbench-shell"
          import type { WorkspaceRepository } from "@tabora/storage"
          import { helper } from "../../apps/playground/src/helper"
        `,
      }),
    ).toEqual([
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "@tabora/workbench-shell",
        reason: "plugins must not import host shell internals",
      },
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "@tabora/storage",
        reason: "plugins must use host-provided runtime data ports",
      },
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "../../apps/playground/src/helper",
        reason: "plugins must not import app source paths",
      },
    ])

    expect(
      findForbiddenPluginDependencies({
        filePath: "plugins/example/package.json",
        manifest: {
          dependencies: {
            "@tabora/workbench-shell": "workspace:*",
            "@tabora/storage": "workspace:*",
            "@tabora/playground": "workspace:*",
          },
        },
      }),
    ).toEqual([
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/workbench-shell",
        section: "dependencies",
        reason: "plugins must not import host shell internals",
      },
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/storage",
        section: "dependencies",
        reason: "plugins must use host-provided runtime data ports",
      },
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/playground",
        section: "dependencies",
        reason: "plugins must not import app source paths",
      },
    ])
  })

  it("detects forbidden ui imports and dependencies", () => {
    expect(
      findForbiddenUiImports({
        filePath: "packages/ui/src/index.ts",
        source: `
          import { createRuntimeContext } from "@tabora/platform-kernel"
          import { registry } from "@tabora/official-plugins"
          import { helper } from "../../apps/playground/src/helper"
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/ui/src/index.ts",
        specifier: "@tabora/platform-kernel",
        reason: "@tabora/ui must not import platform kernel",
      },
      {
        filePath: "packages/ui/src/index.ts",
        specifier: "@tabora/official-plugins",
        reason: "@tabora/ui must not import official plugin packages",
      },
      {
        filePath: "packages/ui/src/index.ts",
        specifier: "../../apps/playground/src/helper",
        reason: "@tabora/ui must not import app source paths",
      },
    ])

    expect(
      findForbiddenUiDependencies({
        filePath: "packages/ui/package.json",
        manifest: {
          dependencies: {
            "@tabora/platform-kernel": "workspace:*",
            "@tabora/official-plugins": "workspace:*",
            "@tabora/playground": "workspace:*",
          },
        },
      }),
    ).toEqual([
      {
        filePath: "packages/ui/package.json",
        dependency: "@tabora/platform-kernel",
        section: "dependencies",
        reason: "@tabora/ui must not depend on platform kernel",
      },
      {
        filePath: "packages/ui/package.json",
        dependency: "@tabora/official-plugins",
        section: "dependencies",
        reason: "@tabora/ui must not depend on official plugin packages",
      },
      {
        filePath: "packages/ui/package.json",
        dependency: "@tabora/playground",
        section: "dependencies",
        reason: "@tabora/ui must not depend on app packages",
      },
    ])
  })

  it("detects raw external open paths in plugin production source but ignores tests", () => {
    expect(
      findPluginExternalOpenViolations({
        filePath: "plugins/official/example/src/index.tsx",
        source: `
          export function Example() {
            return <a href="https://example.com" target="_blank">Example</a>
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "plugins/official/example/src/index.tsx",
        match: 'target="_blank"',
        reason: "plugins must not bypass the external-open permission bridge",
      },
    ])

    expect(
      findPluginExternalOpenViolations({
        filePath: "plugins/official/example/src/index.test.tsx",
        source: `expect(container.innerHTML).toContain('target="_blank"')`,
      }),
    ).toEqual([])
  })

  it("detects focused and skipped tests", () => {
    expect(
      findTestModeViolations({
        filePath: "packages/example/src/example.test.ts",
        source: `
          describe.only("focused", () => {})
          it.skip("skipped", () => {})
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/example/src/example.test.ts",
        match: "describe.only",
        reason: "focused tests must not be committed",
      },
      {
        filePath: "packages/example/src/example.test.ts",
        match: ".skip(",
        reason: "skipped tests must not be committed",
      },
    ])
  })

  it("detects core packages importing app source", () => {
    expect(
      findCorePackageAppImports({
        filePath: "packages/platform-kernel/src/runtimeContext.ts",
        source: `
          import { bootstrap } from "../../apps/playground/src/bootstrap"
          import("@tabora/extension/runtime")
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/platform-kernel/src/runtimeContext.ts",
        specifier: "../../apps/playground/src/bootstrap",
        reason: "packages must not import app source or app packages",
      },
      {
        filePath: "packages/platform-kernel/src/runtimeContext.ts",
        specifier: "@tabora/extension/runtime",
        reason: "packages must not import app source or app packages",
      },
    ])
  })

  it("reports literal colors but ignores token-based rgb(var()) usage", () => {
    expect(
      findRawColorMatches({
        filePath: "packages/example/src/styles.css",
        source: `
          .card {
            background: rgb(var(--color-surface));
            color: #fff;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/example/src/styles.css",
        match: "#fff",
      },
      {
        filePath: "packages/example/src/styles.css",
        match: "rgba(0, 0, 0, 0.18)",
      },
    ])
  })

  it("builds a grouped quality report", () => {
    const report = buildQualityReport({
      typeEscapes: [{ filePath: "packages/storage/src/repository.ts", match: "as any" }],
      issueMarkers: [{ filePath: "packages/ui/src/index.ts", match: "TODO" }],
      largeFiles: rankFilesByLineCount([
        { filePath: "apps/playground/src/App.tsx", lineCount: 1578 },
        { filePath: "packages/workbench-shell/src/styles.css", lineCount: 912 },
      ]),
      rawColors: [{ filePath: "packages/ui/src/button.css", match: "#fff" }],
      externalOpenPatterns: [{ filePath: "apps/playground/src/App.tsx", match: "window.open" }],
    })

    expect(report).toContain("Quality report")
    expect(report).toContain("Type escapes: 1")
    expect(report).toContain("Issue markers: 1")
    expect(report).toContain("Large files top 20")
    expect(report).toContain("apps/playground/src/App.tsx (1578 lines)")
    expect(report).toContain("Raw CSS colors / !important: 1")
    expect(report).toContain("External open paths: 1")
  })
})
