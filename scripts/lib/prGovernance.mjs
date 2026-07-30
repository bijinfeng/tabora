const REQUIRED_TEST_DECISIONS = [
  "本次测试变更保护的行为 / contract / 已复现缺陷",
  "未新增测试或未删除候选测试的原因",
  "`pnpm test:inventory` 候选项结论（保留 / 重构 / 删除）",
]

export function findPullRequestGovernanceViolations(body) {
  const violations = []
  const summary = getSection(body, "变更摘要")
  const regressionBaseline = getSection(body, "Regression Baseline")
  const testDecision = getSection(body, "测试决策")
  const risks = getSection(body, "风险和未覆盖项")

  if (!hasSubstantiveContent(summary)) {
    violations.push("变更摘要缺少实质内容")
  }

  if (!hasRegressionSummaryOutput(regressionBaseline)) {
    violations.push("Regression Baseline 缺少 regression-summary 输出")
  }

  for (const decision of REQUIRED_TEST_DECISIONS) {
    if (!hasCompletedBullet(testDecision, decision)) {
      violations.push(`测试决策缺少：${decision}`)
    }
  }

  if (!hasSubstantiveContent(risks)) {
    violations.push("风险和未覆盖项缺少实质内容")
  }

  return violations
}

function getSection(body, heading) {
  const headingPattern = new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, "m")
  const headingMatch = headingPattern.exec(body)
  if (!headingMatch) return ""

  const startIndex = headingMatch.index + headingMatch[0].length
  const nextHeadingIndex = body.slice(startIndex).search(/^## /m)
  return nextHeadingIndex === -1
    ? body.slice(startIndex)
    : body.slice(startIndex, startIndex + nextHeadingIndex)
}

function hasRegressionSummaryOutput(section) {
  const blocks = [...section.matchAll(/```(?:[a-z0-9_-]+)?\s*\n([\s\S]*?)```/gi)]
  return blocks.some((block) => hasSubstantiveContent(block[1] ?? ""))
}

function hasCompletedBullet(section, label) {
  const bulletPattern = new RegExp(`^\\s*-\\s*${escapeRegExp(label)}\\s*[：:]\\s*(.+)$`, "m")
  const match = bulletPattern.exec(section)
  return Boolean(match?.[1] && hasSubstantiveContent(match[1]))
}

function hasSubstantiveContent(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line.length > 0 && line !== "-" && line !== "```" && !line.endsWith("："))
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
