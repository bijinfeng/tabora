import { describe, expect, it } from "vitest"

import {
  buildRegressionSummary,
  collectChangedFiles,
  collectChangeTypes,
  collectFocusedTestCommands,
  collectKnownDebtTouched,
  collectReportableGitStatusLines,
  collectRequiredLevels,
  collectSuggestedCommands,
} from "../../scripts/lib/regressionSummary.mjs"
import {
  collectChangedFiles as collectRuntimeChangedFiles,
  collectReportableGitStatusLines as collectRuntimeReportableGitStatusLines,
} from "../../scripts/lib/regressionSummaryRuntime.mjs"

describe("regression summary helpers", () => {
  it("classifies changed files into baseline change types", () => {
    expect(
      collectChangeTypes([
        "docs/technical/tabora-regression-baseline.md",
        "packages/plugin-api/src/manifestSchema.ts",
        "packages/orchestrator/src/drag-sort-model.ts",
        ".github/workflows/ci.yml",
        "scripts/check-architecture.mjs",
      ]),
    ).toEqual(["docs", "protocol", "orchestrator", "quality", "release"])
  })

  it("classifies agent instruction and delivery template changes as docs governance", () => {
    expect(
      collectChangeTypes([
        ".claude/CLAUDE.md",
        ".github/copilot-instructions.md",
        ".github/pull_request_template.md",
        "GEMINI.md",
      ]),
    ).toEqual(["docs"])
  })

  it("collects required levels and suggested commands conservatively", () => {
    const changeTypes = ["docs", "orchestrator", "shell", "release"]

    expect(collectRequiredLevels(changeTypes)).toEqual([
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "L7",
      "L8",
    ])

    expect(
      collectSuggestedCommands({
        changedFiles: [
          "apps/playground/src/App.tsx",
          ".github/workflows/release-extension.yml",
          ".github/workflows/deploy-playground.yml",
        ],
        changeTypes,
      }),
    ).toEqual([
      "pnpm check:architecture",
      "pnpm quality",
      "pnpm test",
      "pnpm check",
      "pnpm build",
      "pnpm test:e2e",
      "pnpm --filter @tabora/playground build",
      "pnpm --filter @tabora/extension zip",
      "pnpm --filter @tabora/extension zip:firefox",
    ])
  })

  it("recommends focused test projects from changed package paths", () => {
    expect(
      collectFocusedTestCommands([
        "packages/plugin-api/src/manifestSchema.ts",
        "packages/workbench-app/src/shell/WorkbenchShellApp.tsx",
        "plugins/official/widget-notes/src/notes-card.tsx",
      ]),
    ).toEqual([
      "pnpm --dir packages/plugin-api exec vitest run --config vitest.config.ts",
      "pnpm --dir packages/workbench-app exec vitest run --config vitest.config.ts",
      "pnpm --dir plugins/official/widget-notes exec vitest run --config vitest.config.ts",
    ])
  })

  it("reports touched known debt and renders a readable summary", () => {
    const summary = buildRegressionSummary({
      gitStatusLines: [
        " M packages/orchestrator/src/drag-sort-model.ts",
        "?? scripts/regression-summary.mjs",
      ],
      changedFiles: [
        "packages/orchestrator/src/drag-sort-model.ts",
        "scripts/regression-summary.mjs",
      ],
    })

    expect(collectKnownDebtTouched(["packages/orchestrator/src/drag-sort-model.ts"])).toEqual([
      "拖拽未实现 5px 阈值、实时交换、触屏策略",
    ])
    expect(summary).toContain("Regression Baseline Summary")
    expect(summary).toContain("packages/orchestrator/src/drag-sort-model.ts")
    expect(summary).toContain("required levels: L1, L2, L3, L4, L7")
    expect(summary).toContain("known debt touched: 拖拽未实现 5px 阈值、实时交换、触屏策略")
  })

  it("prints none markers on a clean workspace", () => {
    const summary = buildRegressionSummary({
      gitStatusLines: [],
      changedFiles: [],
    })

    expect(summary).toContain("git status: clean")
    expect(summary).toContain("changed files: none")
    expect(summary).toContain("required levels: none")
    expect(summary).toContain("commands to run: none")
    expect(summary).toContain("known debt touched: none")
  })

  it("ignores local package-manager store noise in status and changed files", () => {
    const gitStatusLines = [
      "?? .pnpm-store/v11/index.db",
      "?? .pnpm-store/v11/index.db-shm",
      "?? .pnpm-store/v11/index.db-wal",
    ]

    expect(collectReportableGitStatusLines(gitStatusLines)).toEqual([])
    expect(
      collectChangedFiles({
        gitStatusLines,
        trackedDiffOutput: ".pnpm-store/v11/index.db\n",
      }),
    ).toEqual([])
    expect(
      buildRegressionSummary({
        gitStatusLines,
        changedFiles: [".pnpm-store/v11/index.db"],
      }),
    ).toContain("git status: clean")
  })

  it("re-exports reportable change helpers for the CLI runtime entry", () => {
    expect(collectRuntimeReportableGitStatusLines(["?? .pnpm-store/v11/index.db"])).toEqual([])
    expect(
      collectRuntimeChangedFiles({
        gitStatusLines: [" M docs/README.md"],
        trackedDiffOutput: "",
      }),
    ).toEqual(["docs/README.md"])
  })
})
