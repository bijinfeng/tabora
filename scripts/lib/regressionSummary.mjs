const CHANGE_TYPE_ORDER = [
  "docs",
  "protocol",
  "kernel",
  "storage",
  "orchestrator",
  "shell",
  "plugin",
  "ui",
  "quality",
  "release",
]

const CHANGE_TYPE_RULES = [
  {
    type: "docs",
    matches: (filePath) =>
      filePath === "AGENTS.md" || filePath === "DESIGN.md" || filePath.startsWith("docs/"),
  },
  {
    type: "protocol",
    matches: (filePath) => filePath.startsWith("packages/plugin-api/"),
  },
  {
    type: "kernel",
    matches: (filePath) => filePath.startsWith("packages/platform-kernel/"),
  },
  {
    type: "storage",
    matches: (filePath) => filePath.startsWith("packages/storage/"),
  },
  {
    type: "orchestrator",
    matches: (filePath) => filePath.startsWith("packages/orchestrator/"),
  },
  {
    type: "shell",
    matches: (filePath) =>
      filePath.startsWith("apps/playground/") ||
      filePath.startsWith("apps/extension/") ||
      filePath.startsWith("packages/workbench-app/") ||
      filePath.startsWith("packages/workbench-shell/") ||
      filePath.startsWith("packages/host-adapters/"),
  },
  {
    type: "plugin",
    matches: (filePath) =>
      filePath.startsWith("plugins/") ||
      filePath.startsWith("packages/official-plugins/") ||
      filePath.startsWith("packages/builtin-plugin-registry/"),
  },
  {
    type: "ui",
    matches: (filePath) =>
      filePath.startsWith("packages/ui/") || filePath.startsWith("packages/theme/"),
  },
  {
    type: "quality",
    matches: (filePath) =>
      filePath.startsWith("scripts/") ||
      filePath.startsWith("tooling/") ||
      filePath === "package.json" ||
      filePath === "pnpm-lock.yaml" ||
      filePath === "pnpm-workspace.yaml" ||
      filePath === "vite.config.ts" ||
      filePath === "vitest.config.ts" ||
      filePath === "vitest.e2e.config.ts",
  },
  {
    type: "release",
    matches: (filePath) => filePath.startsWith(".github/workflows/"),
  },
]

const CHANGE_TYPE_LEVELS = {
  docs: ["L1", "L3"],
  protocol: ["L1", "L2", "L3", "L6", "L7"],
  kernel: ["L1", "L2", "L3", "L6", "L7"],
  storage: ["L1", "L2", "L3", "L6", "L7"],
  orchestrator: ["L1", "L2", "L3", "L4", "L7"],
  shell: ["L1", "L2", "L3", "L4", "L5", "L6", "L7"],
  plugin: ["L1", "L2", "L3", "L4", "L5", "L7"],
  ui: ["L1", "L3", "L4", "L5", "L7"],
  quality: ["L1", "L3", "L7"],
  release: ["L1", "L3", "L8"],
}

const LEVEL_ORDER = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"]

const KNOWN_DEBT_RULES = [
  {
    label: "`WorkbenchShellApp.tsx` 仍是重型共享宿主编排",
    matches: (filePath) =>
      filePath === "packages/workbench-app/src/WorkbenchShellApp.tsx" ||
      filePath === "apps/playground/src/App.tsx" ||
      filePath === "apps/extension/entrypoints/newtab/App.tsx",
  },
  {
    label: "`SearchViewProps` 尚未升级到技术方案描述的状态机 contract",
    matches: (filePath) =>
      filePath.startsWith("packages/official-plugins/src/search-command-bar") ||
      filePath.startsWith("apps/playground/src/App.tsx") ||
      filePath.startsWith("apps/extension/entrypoints/newtab/App.tsx"),
  },
  {
    label: "拖拽未实现 5px 阈值、实时交换、触屏策略",
    matches: (filePath) =>
      filePath.startsWith("packages/orchestrator/src/drag-sort-model") ||
      filePath.startsWith("apps/playground/src/workbenchDashboard.e2e.test.tsx") ||
      filePath.startsWith("apps/playground/src/workbenchGovernance.e2e.test.tsx"),
  },
  {
    label: "workspace preset 的 `plugins` 字段未校验，且存在疑似旧 layout id",
    matches: (filePath) =>
      filePath.includes("workspace-default-preset") ||
      filePath.includes("workspacePreset") ||
      filePath.includes("workspace-preset"),
  },
]

export function collectChangeTypes(changedFiles) {
  return sortByOrder(
    unique(
      changedFiles.flatMap((filePath) =>
        CHANGE_TYPE_RULES.filter((rule) => rule.matches(filePath)).map((rule) => rule.type),
      ),
    ),
    CHANGE_TYPE_ORDER,
  )
}

export function collectRequiredLevels(changeTypes) {
  return sortByOrder(
    unique(changeTypes.flatMap((changeType) => CHANGE_TYPE_LEVELS[changeType] ?? [])),
    LEVEL_ORDER,
  )
}

export function collectSuggestedCommands(options) {
  const commands = []
  const hasCodeChange = options.changeTypes.some((changeType) =>
    ["protocol", "kernel", "storage", "orchestrator", "shell", "plugin", "ui", "quality"].includes(
      changeType,
    ),
  )
  const needsArchitecture = options.changeTypes.some((changeType) =>
    ["protocol", "kernel", "storage", "orchestrator", "shell", "plugin"].includes(changeType),
  )
  const needsE2e = options.changeTypes.some((changeType) =>
    ["orchestrator", "shell", "plugin", "ui"].includes(changeType),
  )
  const needsBuild = options.changeTypes.some((changeType) =>
    ["protocol", "kernel", "storage", "orchestrator", "shell", "plugin", "ui", "release"].includes(
      changeType,
    ),
  )

  if (needsArchitecture) {
    commands.push("pnpm check:architecture")
  }
  if (hasCodeChange) {
    commands.push("pnpm quality", "pnpm test")
  }
  if (options.changeTypes.length > 0) {
    commands.push("pnpm check")
  }
  if (needsBuild) {
    commands.push("pnpm build")
  }
  if (needsE2e) {
    commands.push("pnpm test:e2e")
  }

  if (options.changedFiles.includes(".github/workflows/deploy-playground.yml")) {
    commands.push("pnpm --filter @tabora/playground build")
  }
  if (options.changedFiles.includes(".github/workflows/release-extension.yml")) {
    commands.push(
      "pnpm --filter @tabora/extension zip",
      "pnpm --filter @tabora/extension zip:firefox",
    )
  }

  return unique(commands)
}

export function collectKnownDebtTouched(changedFiles) {
  return unique(
    KNOWN_DEBT_RULES.filter((rule) => changedFiles.some((filePath) => rule.matches(filePath))).map(
      (rule) => rule.label,
    ),
  )
}

export function buildRegressionSummary(options) {
  const changedFiles = unique(options.changedFiles)
  const changeTypes = collectChangeTypes(changedFiles)
  const requiredLevels = collectRequiredLevels(changeTypes)
  const commands = collectSuggestedCommands({ changedFiles, changeTypes })
  const debts = collectKnownDebtTouched(changedFiles)

  return [
    "Regression Baseline Summary",
    `- git status: ${options.gitStatusLines.length > 0 ? "dirty" : "clean"}`,
    `- changed files: ${changedFiles.length > 0 ? "" : "none"}`,
    ...formatList(changedFiles),
    `- change types: ${changeTypes.length > 0 ? changeTypes.join(", ") : "none"}`,
    `- required levels: ${requiredLevels.length > 0 ? requiredLevels.join(", ") : "none"}`,
    `- commands to run: ${commands.length > 0 ? "" : "none"}`,
    ...formatList(commands),
    `- known debt touched: ${debts.length > 0 ? debts.join(", ") : "none"}`,
  ].join("\n")
}

export function parseGitStatusLines(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

function unique(values) {
  return [...new Set(values)]
}

function sortByOrder(values, order) {
  return [...values].sort((left, right) => order.indexOf(left) - order.indexOf(right))
}

function formatList(values) {
  return values.map((value) => `  - ${value}`)
}
