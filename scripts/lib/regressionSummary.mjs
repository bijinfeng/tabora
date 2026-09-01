const CHANGE_TYPE_ORDER = [
  "docs",
  "protocol",
  "kernel",
  "storage",
  "backend",
  "orchestrator",
  "shell",
  "plugin",
  "ui",
  "quality",
  "release",
]

const AGENT_GOVERNANCE_DOCUMENTS = new Set([
  ".github/copilot-instructions.md",
  ".github/pull_request_template.md",
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
])

const LOCAL_TOOL_NOISE_PREFIXES = [".pnpm-store/"]

const FOCUSED_TEST_RULES = [
  "packages/ai-runtime",
  "packages/auth",
  "packages/brand",
  "packages/builtin-plugin-registry",
  "packages/host-adapters",
  "packages/official-plugins",
  "packages/orchestrator",
  "packages/platform-kernel",
  "packages/plugin-api",
  "packages/storage",
  "packages/sync",
  "packages/theme",
  "packages/ui",
  "packages/workbench-app",
  "packages/workbench-shell",
  "apps/site",
  "apps/app",
  "tooling/stylex",
  "tooling/vitest",
  "plugins/community/layout-diy-masonry",
  "plugins/official/layout-dashboard",
  "plugins/official/widget-notes",
  "plugins/official/widget-quick-links",
  "plugins/official/widget-todo",
  "plugins/official/widget-weather",
].map((directory) => ({
  directory: `${directory}/`,
  command: `pnpm exec vitest run --passWithNoTests ${directory}`,
}))

const CHANGE_TYPE_RULES = [
  {
    type: "docs",
    matches: (filePath) =>
      isAgentGovernanceDocument(filePath) ||
      filePath === "DESIGN.md" ||
      filePath.startsWith(".claude/") ||
      filePath.startsWith(".github/instructions/") ||
      filePath.startsWith(".github/PULL_REQUEST_TEMPLATE/") ||
      filePath.startsWith("docs/"),
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
    type: "backend",
    matches: (filePath) => filePath.startsWith("apps/app/"),
  },
  {
    type: "orchestrator",
    matches: (filePath) => filePath.startsWith("packages/orchestrator/"),
  },
  {
    type: "shell",
    matches: (filePath) =>
      filePath.startsWith("apps/app/src/workbench/") ||
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
      filePath === ".gitignore" ||
      filePath === ".claude/settings.json" ||
      filePath === "pnpm-lock.yaml" ||
      filePath === "pnpm-workspace.yaml" ||
      filePath === "vite.config.ts" ||
      filePath === "vitest.config.ts",
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
  backend: ["L1", "L2", "L3", "L7"],
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
      filePath === "packages/workbench-app/src/shell/WorkbenchShellApp.tsx" ||
      filePath === "apps/app/src/workbench/App.tsx" ||
      filePath === "apps/extension/entrypoints/newtab/App.tsx",
  },
  {
    label: "`SearchViewProps` 尚未升级到技术方案描述的状态机 contract",
    matches: (filePath) =>
      filePath.startsWith("packages/official-plugins/src/search-command-bar") ||
      filePath.startsWith("apps/app/src/workbench/App.tsx") ||
      filePath.startsWith("apps/extension/entrypoints/newtab/App.tsx"),
  },
  {
    label: "拖拽未实现 5px 阈值、实时交换、触屏策略",
    matches: (filePath) => filePath.startsWith("packages/orchestrator/src/drag-sort-model"),
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
      changedFiles
        .filter(isReportableChangedFile)
        .flatMap((filePath) =>
          isAgentGovernanceDocument(filePath)
            ? ["docs"]
            : CHANGE_TYPE_RULES.filter((rule) => rule.matches(filePath)).map((rule) => rule.type),
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
    [
      "protocol",
      "kernel",
      "storage",
      "backend",
      "orchestrator",
      "shell",
      "plugin",
      "ui",
      "quality",
    ].includes(changeType),
  )
  const needsArchitecture = options.changeTypes.some((changeType) =>
    ["protocol", "kernel", "storage", "orchestrator", "shell", "plugin"].includes(changeType),
  )
  const needsBuild = options.changeTypes.some((changeType) =>
    [
      "protocol",
      "kernel",
      "storage",
      "backend",
      "orchestrator",
      "shell",
      "plugin",
      "ui",
      "release",
    ].includes(changeType),
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

  if (options.changedFiles.includes(".github/workflows/release-extension.yml")) {
    commands.push(
      "pnpm --filter @tabora/extension zip",
      "pnpm --filter @tabora/extension zip:firefox",
    )
  }

  return unique(commands)
}

export function collectFocusedTestCommands(changedFiles) {
  const productionChangedFiles = changedFiles.filter(
    (filePath) => !isAgentGovernanceDocument(filePath),
  )

  return FOCUSED_TEST_RULES.filter((rule) =>
    productionChangedFiles.some((filePath) => filePath.startsWith(rule.directory)),
  ).map((rule) => rule.command)
}

export function collectKnownDebtTouched(changedFiles) {
  return unique(
    KNOWN_DEBT_RULES.filter((rule) =>
      changedFiles.filter(isReportableChangedFile).some((filePath) => rule.matches(filePath)),
    ).map((rule) => rule.label),
  )
}

export function collectChangedFiles(options) {
  const fromStatus = options.gitStatusLines.map(extractGitStatusPath)
  const fromDiff = options.trackedDiffOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return unique([...fromDiff, ...fromStatus]).filter(isReportableChangedFile)
}

export function collectReportableGitStatusLines(gitStatusLines) {
  return gitStatusLines.filter((line) => isReportableChangedFile(extractGitStatusPath(line)))
}

export function buildRegressionSummary(options) {
  const gitStatusLines = collectReportableGitStatusLines(options.gitStatusLines)
  const changedFiles = unique(options.changedFiles).filter(isReportableChangedFile)
  const changeTypes = collectChangeTypes(changedFiles)
  const requiredLevels = collectRequiredLevels(changeTypes)
  const commands = collectSuggestedCommands({ changedFiles, changeTypes })
  const focusedTestCommands = collectFocusedTestCommands(changedFiles)
  const debts = collectKnownDebtTouched(changedFiles)

  return [
    "Regression Baseline Summary",
    `- git status: ${gitStatusLines.length > 0 ? "dirty" : "clean"}`,
    `- changed files: ${changedFiles.length > 0 ? "" : "none"}`,
    ...formatList(changedFiles),
    `- change types: ${changeTypes.length > 0 ? changeTypes.join(", ") : "none"}`,
    `- required levels: ${requiredLevels.length > 0 ? requiredLevels.join(", ") : "none"}`,
    `- commands to run: ${commands.length > 0 ? "" : "none"}`,
    ...formatList(commands),
    `- focused tests before the full suite: ${focusedTestCommands.length > 0 ? "" : "none"}`,
    ...formatList(focusedTestCommands),
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

function extractGitStatusPath(gitStatusLine) {
  const filePath = gitStatusLine.slice(3)
  const renameSeparator = " -> "
  return filePath.includes(renameSeparator) ? filePath.split(renameSeparator).at(-1) : filePath
}

function isAgentGovernanceDocument(filePath) {
  return AGENT_GOVERNANCE_DOCUMENTS.has(filePath) || filePath.endsWith("/AGENTS.md")
}

function isReportableChangedFile(filePath) {
  return !LOCAL_TOOL_NOISE_PREFIXES.some((prefix) => filePath.startsWith(prefix))
}
