import { describe, expect, it } from "vitest"

import {
  buildRegressionSummary,
  collectChangeTypes,
  collectKnownDebtTouched,
  collectRequiredLevels,
  collectSuggestedCommands,
} from "../../scripts/lib/regressionSummary.mjs"

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
})
