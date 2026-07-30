export function validateAgentEvaluationCases(cases) {
  const violations = []
  const ids = new Set()

  for (const evaluationCase of cases) {
    const prefix = `case "${evaluationCase.id ?? "unknown"}"`

    if (!evaluationCase.id || ids.has(evaluationCase.id)) {
      violations.push(`${prefix} requires a unique id`)
    }
    ids.add(evaluationCase.id)

    if (!Array.isArray(evaluationCase.allowedPaths) || evaluationCase.allowedPaths.length === 0) {
      violations.push(`${prefix} requires at least one allowed path`)
    }
    if (!Array.isArray(evaluationCase.requiredEvidence) || evaluationCase.requiredEvidence.length === 0) {
      violations.push(`${prefix} requires at least one evidence command`)
    }
    if (
      !Array.isArray(evaluationCase.forbiddenOutcomes) ||
      evaluationCase.forbiddenOutcomes.length === 0
    ) {
      violations.push(`${prefix} requires at least one forbidden outcome`)
    }
    if (!Array.isArray(evaluationCase.scoring) || evaluationCase.scoring.length === 0) {
      violations.push(`${prefix} requires at least one scoring criterion`)
    }
  }

  return violations
}

export function buildAgentEvaluationReport(cases) {
  return [
    "Agent Evaluation Cases",
    `- total cases: ${cases.length}`,
    ...cases.map(
      (evaluationCase) =>
        `- ${evaluationCase.id}: ${evaluationCase.scoring.reduce((total, item) => total + item.points, 0)} points`,
    ),
  ].join("\n")
}
