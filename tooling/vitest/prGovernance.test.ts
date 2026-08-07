import { describe, expect, it } from "vitest"

import { findPullRequestGovernanceViolations } from "../../scripts/lib/prGovernance.mjs"

const completePullRequestBody = `
## 变更摘要

- 修复工作台主题切换持久化。

## 改动类型

- [x] shell

## 事实源同步

- PRD：不涉及
- 官方插件设计：不涉及
- DESIGN：不涉及
- 技术方案：已检查，无需修改
- 回归基准：不涉及
- docs/README：不涉及

## 复用与改动规模

- 已复用的现有实现：扩展现有 theme workspace repository 和设置 action。
- 新增 public export / dependency / package / 生产文件：无。
- 删除或替换的旧实现：删除设置页内重复的 localStorage 写入。
- 生产 diff（additions / deletions）及必要性：+24 / -18，未命中审查信号。

## Regression Baseline

\`node scripts/regression-summary.mjs\` 输出：

\`\`\`txt
Regression Baseline Summary
- change types: shell
\`\`\`

自动化验证：

- [x] \`pnpm check\`

## 测试决策

- 本次测试变更保护的行为 / contract / 已复现缺陷：主题切换后写入 workspace。
- 未新增测试或未删除候选测试的原因：已有回归测试覆盖。
- \`pnpm test:inventory\` 候选项结论（保留 / 重构 / 删除）：不涉及。

## 风险和未覆盖项

- 未执行浏览器冒烟，原因是无视觉改动。
`

describe("pull request governance", () => {
  it("accepts a PR body with completed delivery evidence", () => {
    expect(findPullRequestGovernanceViolations(completePullRequestBody)).toEqual([])
  })

  it("rejects template placeholders and missing regression evidence", () => {
    expect(
      findPullRequestGovernanceViolations(`
        ## 变更摘要

        -

        ## Regression Baseline

        \`node scripts/regression-summary.mjs\` 输出：

        \`\`\`txt

        \`\`\`

        ## 测试决策

        - 本次测试变更保护的行为 / contract / 已复现缺陷：
        - 未新增测试或未删除候选测试的原因：
        - \`pnpm test:inventory\` 候选项结论（保留 / 重构 / 删除）：

        ## 风险和未覆盖项

        -
      `),
    ).toEqual([
      "变更摘要缺少实质内容",
      "复用与改动规模缺少：已复用的现有实现",
      "复用与改动规模缺少：新增 public export / dependency / package / 生产文件",
      "复用与改动规模缺少：删除或替换的旧实现",
      "复用与改动规模缺少：生产 diff（additions / deletions）及必要性",
      "Regression Baseline 缺少 regression-summary 输出",
      "测试决策缺少：本次测试变更保护的行为 / contract / 已复现缺陷",
      "测试决策缺少：未新增测试或未删除候选测试的原因",
      "测试决策缺少：`pnpm test:inventory` 候选项结论（保留 / 重构 / 删除）",
      "风险和未覆盖项缺少实质内容",
    ])
  })

  it("rejects an incomplete reuse and change-size section", () => {
    expect(
      findPullRequestGovernanceViolations(
        completePullRequestBody.replace(
          "- 删除或替换的旧实现：删除设置页内重复的 localStorage 写入。",
          "- 删除或替换的旧实现：",
        ),
      ),
    ).toContain("复用与改动规模缺少：删除或替换的旧实现")
  })
})
