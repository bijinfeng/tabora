import { describe, expect, it } from "vitest"

import {
  buildAgentEvaluationReport,
  validateAgentEvaluationCases,
} from "../../scripts/lib/agentEvaluation.mjs"

describe("agent evaluation cases", () => {
  it("accepts a case with bounded scope, evidence, and a scoring rubric", () => {
    const cases = [
      {
        id: "test-cleanup",
        title: "清理重复测试",
        prompt: "清理已证明重复的测试。",
        allowedPaths: ["packages/workbench-app/src/**"],
        requiredEvidence: ["pnpm test", "pnpm check"],
        forbiddenOutcomes: ["删除未审查的候选测试"],
        scoring: [
          { criterion: "行为覆盖不回退", points: 5 },
          { criterion: "说明删除依据", points: 5 },
        ],
      },
    ]

    expect(validateAgentEvaluationCases(cases)).toEqual([])
    expect(buildAgentEvaluationReport(cases)).toContain("- total cases: 1")
    expect(buildAgentEvaluationReport(cases)).toContain("- test-cleanup: 10 points")
  })

  it("rejects cases that cannot constrain or grade an agent run", () => {
    expect(
      validateAgentEvaluationCases([
        {
          id: "incomplete",
          title: "不完整",
          prompt: "做点事",
          allowedPaths: [],
          requiredEvidence: [],
          forbiddenOutcomes: [],
          scoring: [],
        },
      ]),
    ).toEqual([
      'case "incomplete" requires at least one allowed path',
      'case "incomplete" requires at least one evidence command',
      'case "incomplete" requires at least one forbidden outcome',
      'case "incomplete" requires at least one scoring criterion',
    ])
  })
})
