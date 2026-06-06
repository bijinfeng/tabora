import { describe, expect, it } from "vitest"

import {
  buildQualityReport,
  classifyExternalOpenMatch,
  classifyRawColorMatch,
  classifyWorkbenchRawColorDebt,
  findCrossAppSourceImports,
  findCorePackageAppImports,
  findForbiddenPluginDependencies,
  findForbiddenPluginImports,
  findPackageExportViolations,
  findForbiddenUiDependencies,
  findForbiddenUiImports,
  findPluginExternalOpenViolations,
  findRawColorMatches,
  findTypeEscapeViolations,
  findTestModeViolations,
  findWorkbenchRawColorViolations,
  findWorkbenchAvoidableStyleViolations,
  findWindowOpenViolations,
  rankFilesByLineCount,
  readRepositoryText,
  summarizeExternalOpenMatches,
  summarizeRawColorMatches,
  summarizeWorkbenchRawColorDebt,
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

  it("detects shell apps importing other app source", () => {
    expect(
      findCrossAppSourceImports({
        filePath: "apps/extension/entrypoints/newtab/App.tsx",
        source: `
          import { helper } from "../../../playground/src/helper"
          import { local } from "./workbenchComposition"
        `,
      }),
    ).toEqual([
      {
        filePath: "apps/extension/entrypoints/newtab/App.tsx",
        specifier: "../../../playground/src/helper",
        reason: "apps must not import other app source or app packages",
      },
    ])

    expect(
      findCrossAppSourceImports({
        filePath: "apps/playground/src/App.tsx",
        source: `
          import { helper } from "./workspaceSession"
        `,
      }),
    ).toEqual([])
  })

  it("detects package export drift from vp pack entrypoints", () => {
    expect(
      findPackageExportViolations({
        filePath: "packages/brand/package.json",
        manifest: {
          scripts: {
            build: "vp pack src/index.ts src/assetPaths.ts",
          },
          exports: {
            ".": "./src/index.ts",
            "./package.json": "./package.json",
          },
          publishConfig: {
            exports: {
              ".": "./dist/index.js",
              "./package.json": "./package.json",
            },
          },
        },
      }),
    ).toEqual([
      {
        filePath: "packages/brand/package.json",
        match: 'exports["./assetPaths"]',
        reason:
          'missing or incorrect export for build entry "src/assetPaths.ts"; expected "./src/assetPaths.ts"',
      },
      {
        filePath: "packages/brand/package.json",
        match: 'publishConfig.exports["./assetPaths"]',
        reason:
          'missing or incorrect publish export for build entry "src/assetPaths.ts"; expected "./dist/assetPaths.js"',
      },
    ])
  })

  it("detects type escapes in production source", () => {
    expect(
      findTypeEscapeViolations({
        filePath: "packages/storage/src/pluginDataRepository.ts",
        source: `
          export function read(value: unknown) {
            return value as any
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/storage/src/pluginDataRepository.ts",
        match: "as any",
        reason: "type escapes must not be committed in production source",
      },
    ])
  })

  it("detects window.open outside the allowed shell execution points", () => {
    expect(
      findWindowOpenViolations({
        filePath: "packages/example/src/runtime.ts",
        source: `
          export function open(url: string) {
            return window.open(url, "_blank")
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/example/src/runtime.ts",
        match: "window.open",
        reason: "window.open must stay in the shell host execution path",
      },
    ])

    expect(
      findWindowOpenViolations({
        filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
        source: `window.open(payload.url, "_blank")`,
      }),
    ).toEqual([])
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

  it("classifies raw color matches by risk bucket", () => {
    expect(classifyRawColorMatch("apps/site/src/styles.css")).toBe("site")
    expect(classifyRawColorMatch("apps/playground/src/backgroundResolver.test.tsx")).toBe(
      "test-fixture",
    )
    expect(classifyRawColorMatch("packages/official-plugins/src/background-basic.ts")).toBe(
      "background-preset",
    )
    expect(classifyRawColorMatch("packages/workbench-shell/src/styles.css")).toBe("workbench")

    expect(
      summarizeRawColorMatches([
        { filePath: "packages/workbench-shell/src/styles.css", match: "rgba(0, 0, 0, 0.12)" },
        { filePath: "packages/official-plugins/src/background-basic.ts", match: "rgb(18, 18, 18)" },
        { filePath: "apps/site/src/styles.css", match: "#111512" },
        { filePath: "apps/playground/src/backgroundResolver.test.tsx", match: "rgb(1, 2, 3)" },
      ]),
    ).toEqual({
      workbench: 1,
      "background-preset": 1,
      site: 1,
      "test-fixture": 1,
    })
  })

  it("flags historical workbench raw colors now that the baseline is zero", () => {
    expect(
      findWorkbenchRawColorViolations({
        filePath: "packages/ui/src/styled/button/styles.css",
        source: `
          .button {
            color: #fff;
            border-color: #123456;
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/ui/src/styled/button/styles.css",
        match: "#fff",
        reason: "new workbench raw colors must be tokenized or added to the reviewed baseline",
      },
      {
        filePath: "packages/ui/src/styled/button/styles.css",
        match: "#123456",
        reason: "new workbench raw colors must be tokenized or added to the reviewed baseline",
      },
    ])

    expect(
      findWorkbenchRawColorViolations({
        filePath: "packages/workbench-shell/src/styles.css",
        source: `
          .overlay {
            background: rgba(0, 0, 0, 0.12);
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "packages/workbench-shell/src/styles.css",
        match: "rgba(0, 0, 0, 0.12)",
        reason: "new workbench raw colors must be tokenized or added to the reviewed baseline",
      },
    ])

    expect(
      findWorkbenchRawColorViolations({
        filePath: "apps/site/src/styles.css",
        source: `
          :root {
            --site-ink: #111512;
          }
        `,
      }),
    ).toEqual([])
  })

  it("flags avoidable workbench style literals but ignores token fallback chains", () => {
    expect(
      findWorkbenchAvoidableStyleViolations({
        filePath: "plugins/community/layout-diy-masonry/src/styles.css",
        source: `
          .menu {
            background: var(--color-surface, #fff);
            color: rgb(var(--color-text, 28 30 28));
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            border-color: rgb(var(--color-line-strong, var(--color-line)));
          }
        `,
      }),
    ).toEqual([
      {
        filePath: "plugins/community/layout-diy-masonry/src/styles.css",
        match: "rgba(0, 0, 0, 0)",
        reason: "use transparent instead of zero-alpha rgba",
      },
      {
        filePath: "plugins/community/layout-diy-masonry/src/styles.css",
        match: "var(--color-surface, #fff)",
        reason: "workbench theme variables must not carry literal color fallbacks",
      },
      {
        filePath: "plugins/community/layout-diy-masonry/src/styles.css",
        match: "var(--color-text, 28 30 28)",
        reason: "workbench theme variables must not carry literal color fallbacks",
      },
    ])

    expect(
      findWorkbenchAvoidableStyleViolations({
        filePath: "packages/official-plugins/src/styles.css",
        source: `
          .search {
            color: rgb(var(--color-subtle, var(--color-muted)));
            border-color: rgb(var(--color-line-strong, var(--color-line)));
          }
        `,
      }),
    ).toEqual([])

    expect(
      findWorkbenchAvoidableStyleViolations({
        filePath: "apps/site/src/styles.css",
        source: `
          .site {
            background: var(--color-surface, #fff);
          }
        `,
      }),
    ).toEqual([])
  })

  it("classifies remaining workbench raw color debt by tokenization strategy", () => {
    expect(
      classifyWorkbenchRawColorDebt({
        filePath: "packages/ui/src/styled/button/styles.css",
        match: "#fff",
      }),
    ).toBe("inverse-foreground")

    expect(
      classifyWorkbenchRawColorDebt({
        filePath: "packages/workbench-shell/src/styles.css",
        match: "rgba(0, 0, 0, 0.12)",
      }),
    ).toBe("shadow-overlay")

    expect(
      classifyWorkbenchRawColorDebt({
        filePath: "packages/official-plugins/src/styles.css",
        match: "rgba(255, 255, 255, 0.45)",
      }),
    ).toBe("glow-highlight")

    expect(
      classifyWorkbenchRawColorDebt({
        filePath: "packages/workbench-shell/src/styles.css",
        match: "!important",
      }),
    ).toBe("important-override")

    expect(
      classifyWorkbenchRawColorDebt({
        filePath: "apps/site/src/styles.css",
        match: "#111512",
      }),
    ).toBe(null)

    expect(
      summarizeWorkbenchRawColorDebt([
        { filePath: "packages/ui/src/styled/button/styles.css", match: "#fff" },
        { filePath: "packages/workbench-shell/src/styles.css", match: "rgba(0, 0, 0, 0.12)" },
        {
          filePath: "packages/official-plugins/src/styles.css",
          match: "rgba(255, 255, 255, 0.45)",
        },
        { filePath: "packages/workbench-shell/src/styles.css", match: "!important" },
      ]),
    ).toEqual({
      "inverse-foreground": 1,
      "shadow-overlay": 1,
      "glow-highlight": 1,
      "important-override": 1,
    })
  })

  it("tokenizes shared inverse foreground styles instead of keeping raw white literals", async () => {
    const targetFiles = [
      "packages/official-plugins/src/styles.css",
      "packages/ui/src/styled/button/styles.css",
      "packages/ui/src/styled/checkbox/styles.css",
      "packages/ui/src/styled/switch/styles.css",
      "plugins/community/layout-diy-masonry/src/styles.css",
    ]

    for (const filePath of targetFiles) {
      const source = await readRepositoryText(".", filePath)
      expect(source).not.toContain("#fff")
    }

    const uiThemeTokens = await readRepositoryText(".", "packages/ui/src/tokens/theme.css")
    expect(uiThemeTokens).toContain("--tbr-color-inverse: 255 255 255;")

    const uiTokenRegistry = await readRepositoryText(".", "packages/ui/src/tokens/tokens.ts")
    expect(uiTokenRegistry).toContain('inverse: "tbr-color-inverse"')

    const workbenchDefaults = await readRepositoryText(
      ".",
      "packages/workbench-shell/src/styles.css",
    )
    expect(workbenchDefaults).toContain("--color-inverse: 255 255 255;")

    const themePack = await readRepositoryText(
      ".",
      "packages/official-plugins/src/theme-default-pack.ts",
    )
    expect(themePack).toContain('"color-inverse": "255 255 255"')
  })

  it("tokenizes shared shadow and scrim styles instead of keeping raw overlay colors", async () => {
    const targetFiles = [
      "packages/official-plugins/src/styles.css",
      "packages/ui/src/styled/combobox/styles.css",
      "packages/ui/src/styled/dialog/styles.css",
      "packages/ui/src/styled/dropdownMenu/styles.css",
      "packages/ui/src/styled/popover/styles.css",
      "packages/ui/src/styled/segmentedControl/styles.css",
      "packages/ui/src/styled/select/styles.css",
      "packages/ui/src/styled/slider/styles.css",
      "packages/ui/src/styled/switch/styles.css",
      "packages/workbench-shell/src/styles.css",
      "plugins/community/layout-diy-masonry/src/styles.css",
    ]

    for (const filePath of targetFiles) {
      const source = await readRepositoryText(".", filePath)
      expect(source).not.toMatch(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/i)
      expect(source).not.toMatch(/rgba\(\s*15\s*,\s*23\s*,\s*18\s*,/i)
      expect(source).not.toMatch(/rgba\(\s*8\s*,\s*10\s*,\s*8\s*,/i)
    }

    const uiThemeTokens = await readRepositoryText(".", "packages/ui/src/tokens/theme.css")
    expect(uiThemeTokens).toContain("--tbr-color-shadow: 0 0 0;")
    expect(uiThemeTokens).toContain("--tbr-color-shadow-strong: 15 23 18;")
    expect(uiThemeTokens).toContain("--tbr-color-scrim: 8 10 8;")

    const uiTokenRegistry = await readRepositoryText(".", "packages/ui/src/tokens/tokens.ts")
    expect(uiTokenRegistry).toContain('shadow: "tbr-color-shadow"')
    expect(uiTokenRegistry).toContain('shadowStrong: "tbr-color-shadow-strong"')
    expect(uiTokenRegistry).toContain('scrim: "tbr-color-scrim"')

    const workbenchDefaults = await readRepositoryText(
      ".",
      "packages/workbench-shell/src/styles.css",
    )
    expect(workbenchDefaults).toContain("--color-shadow: 0 0 0;")
    expect(workbenchDefaults).toContain("--color-shadow-strong: 15 23 18;")
    expect(workbenchDefaults).toContain("--color-scrim: 8 10 8;")

    const themePack = await readRepositoryText(
      ".",
      "packages/official-plugins/src/theme-default-pack.ts",
    )
    expect(themePack).toContain('"color-shadow": "0 0 0"')
    expect(themePack).toContain('"color-shadow-strong": "15 23 18"')
    expect(themePack).toContain('"color-scrim": "8 10 8"')
  })

  it("reuses semantic tokens for glow and highlight treatments", async () => {
    const source = await readRepositoryText(".", "packages/official-plugins/src/styles.css")

    expect(source).not.toContain("rgba(255, 255, 255, 0.45)")
    expect(source).not.toContain("rgba(26, 144, 112, 0.08)")
    expect(source).not.toContain("rgba(28, 30, 28, 0.035)")

    expect(source).toContain("rgb(var(--color-text) / 0.035)")
    expect(source).toContain("rgb(var(--color-inverse) / 0.45)")
    expect(source).toContain("rgb(var(--color-accent) / 0.08)")
  })

  it("builds generated background presets from data instead of inline raw color literals", async () => {
    const source = await readRepositoryText(
      ".",
      "packages/official-plugins/src/background-basic.ts",
    )

    expect(source).not.toContain("rgb(237, 241, 238)")
    expect(source).not.toContain("rgb(18, 18, 18)")
    expect(source).not.toContain("rgba(35, 113, 89, 0.18)")
    expect(source).not.toContain("rgba(66, 133, 244, 0.15)")
    expect(source).not.toContain("rgba(128, 90, 213, 0.15)")
  })

  it("uses local site variables instead of raw site color literals", async () => {
    const source = await readRepositoryText(".", "apps/site/src/styles.css")

    expect(source).not.toContain("#000")
    expect(source).not.toContain("#111512")
    expect(source).not.toContain("#2e718f")
    expect(source).not.toContain("#6fb4d2")
    expect(source).not.toContain("#9b6b16")
    expect(source).not.toContain("#d5a64f")
    expect(source).not.toContain("#f7f8f6")
    expect(source).not.toContain("rgba(0, 0, 0, 0.28)")
    expect(source).not.toContain("rgba(17, 21, 18, 0.1)")

    expect(source).toContain("--site-ink: 17 21 18;")
    expect(source).toContain("--site-shadow-rgb: 17 21 18;")
    expect(source).toContain("rgb(var(--site-ink))")
    expect(source).toContain("rgb(var(--site-blue))")
    expect(source).toContain("rgb(var(--site-amber))")
  })

  it("keeps raw color fixtures out of committed test sources", async () => {
    const backgroundResolverTest = await readRepositoryText(
      ".",
      "apps/playground/src/backgroundResolver.test.tsx",
    )
    expect(backgroundResolverTest).not.toContain("rgba(0,0,0,0.1)")
    expect(backgroundResolverTest).not.toContain("rgb(1, 2, 3)")
    expect(backgroundResolverTest).not.toContain("rgb(4, 5, 6)")

    const manifestSchemaTest = await readRepositoryText(
      ".",
      "packages/plugin-api/src/manifestSchema.test.ts",
    )
    expect(manifestSchemaTest).not.toContain("rgb(1, 2, 3)")
  })

  it("keeps extension shell helpers in shared packages", async () => {
    const extensionApp = await readRepositoryText(".", "apps/extension/entrypoints/newtab/App.tsx")

    expect(extensionApp).not.toContain("../../../playground/src/")
    expect(extensionApp).toContain('from "@tabora/workbench-app"')
  })

  it("keeps shell app entrypoints as thin wrappers", async () => {
    const playgroundApp = await readRepositoryText(".", "apps/playground/src/App.tsx")
    const extensionApp = await readRepositoryText(".", "apps/extension/entrypoints/newtab/App.tsx")

    expect(playgroundApp.split("\n").length).toBeLessThan(200)
    expect(extensionApp.split("\n").length).toBeLessThan(200)
  })

  it("keeps the shared shell root under the current governance threshold", async () => {
    const shellRoot = await readRepositoryText(
      ".",
      "packages/workbench-app/src/WorkbenchShellApp.tsx",
    )

    expect(shellRoot.split("\n").length).toBeLessThan(1265)
  })

  it("builds a grouped quality report", () => {
    expect(
      classifyExternalOpenMatch({
        filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
        match: "window.open",
      }),
    ).toBe("host-execution")

    expect(
      classifyExternalOpenMatch({
        filePath: "packages/official-plugins/src/search-command-bar.tsx",
        match: "external-open",
      }),
    ).toBe("manifest-declaration")

    expect(
      classifyExternalOpenMatch({
        filePath: "packages/official-plugins/src/search-command-bar.tsx",
        match: "openExternal",
      }),
    ).toBe("runtime-method-reference")

    expect(
      classifyExternalOpenMatch({
        filePath: "plugins/example/src/view.tsx",
        match: 'target="_blank"',
      }),
    ).toBe("bypass-risk")

    expect(
      classifyExternalOpenMatch({
        filePath: "apps/playground/src/workbenchGovernance.e2e.test.tsx",
        match: "window.open",
      }),
    ).toBe("test-fixture")

    expect(
      summarizeExternalOpenMatches([
        {
          filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
          match: "window.open",
        },
        {
          filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
          match: "openExternal",
        },
        {
          filePath: "packages/official-plugins/src/search-command-bar.tsx",
          match: "external-open",
        },
        { filePath: "packages/official-plugins/src/search-command-bar.tsx", match: "openExternal" },
        { filePath: "plugins/example/src/view.tsx", match: 'target="_blank"' },
        { filePath: "plugins/example/src/view.tsx", match: "window.open" },
        { filePath: "apps/playground/src/workbenchGovernance.e2e.test.tsx", match: "window.open" },
      ]),
    ).toEqual({
      "host-execution": 1,
      "manifest-declaration": 1,
      "runtime-method-reference": 1,
      "bypass-risk": 1,
      "test-fixture": 1,
    })

    const report = buildQualityReport({
      typeEscapes: [{ filePath: "packages/storage/src/repository.ts", match: "as any" }],
      issueMarkers: [{ filePath: "packages/ui/src/index.ts", match: "TODO" }],
      largeFiles: rankFilesByLineCount([
        { filePath: "apps/playground/src/App.tsx", lineCount: 1578 },
        { filePath: "packages/workbench-shell/src/styles.css", lineCount: 912 },
      ]),
      rawColors: [
        { filePath: "packages/ui/src/button.css", match: "#fff" },
        { filePath: "apps/site/src/styles.css", match: "#111512" },
      ],
      rawColorSummary: {
        workbench: 1,
        "background-preset": 0,
        site: 1,
        "test-fixture": 0,
      },
      externalOpenPatterns: [
        {
          filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
          match: "window.open",
        },
        {
          filePath: "packages/workbench-app/src/WorkbenchShellApp.tsx",
          match: "openExternal",
        },
        {
          filePath: "packages/official-plugins/src/search-command-bar.tsx",
          match: "external-open",
        },
        {
          filePath: "packages/official-plugins/src/search-command-bar.tsx",
          match: "openExternal",
        },
        { filePath: "plugins/example/src/view.tsx", match: 'target="_blank"' },
        { filePath: "plugins/example/src/view.tsx", match: "window.open" },
        { filePath: "apps/playground/src/workbenchGovernance.e2e.test.tsx", match: "window.open" },
      ],
    })

    expect(report).toContain("Quality report")
    expect(report).toContain("Type escapes: 1")
    expect(report).toContain("Issue markers: 1")
    expect(report).toContain("Large files top 20")
    expect(report).toContain("apps/playground/src/App.tsx (1578 lines)")
    expect(report).toContain("Raw CSS colors / !important: 2")
    expect(report).toContain("workbench production: 1")
    expect(report).toContain("site styles: 1")
    expect(report).toContain("Workbench raw color debt")
    expect(report).toContain("inverse foreground: 1")
    expect(report).toContain("External open signals")
    expect(report).toContain("host execution paths: 1")
    expect(report).toContain("manifest declarations: 1")
    expect(report).toContain("runtime method references: 1")
    expect(report).toContain("potential bypass paths: 1")
    expect(report).toContain("test fixtures: 1")
    expect(report).toContain('plugins/example/src/view.tsx: target="_blank", window.open')
    expect(report).not.toContain("packages/workbench-app/src/WorkbenchShellApp.tsx: window.open")
    expect(report).not.toContain(
      "apps/playground/src/workbenchGovernance.e2e.test.tsx: window.open",
    )
  })
})
