import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]

const IMPORT_SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs"])
const QUALITY_SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".mjs"])
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/

const PLUGIN_IMPORT_RULES = [
  {
    matches: (specifier) =>
      specifier === "@tabora/workbench-shell" || specifier.startsWith("@tabora/workbench-shell/"),
    reason: "plugins must not import host shell internals",
  },
  {
    matches: (specifier) =>
      specifier === "@tabora/storage" || specifier.startsWith("@tabora/storage/"),
    reason: "plugins must use host-provided runtime data ports",
  },
  {
    matches: (specifier) =>
      specifier.includes("apps/") ||
      specifier.startsWith("app/") ||
      specifier === "@tabora/playground" ||
      specifier.startsWith("@tabora/playground/") ||
      specifier === "@tabora/extension" ||
      specifier.startsWith("@tabora/extension/"),
    reason: "plugins must not import app source paths",
  },
]

const UI_IMPORT_RULES = [
  {
    matches: (specifier) =>
      specifier === "@tabora/platform-kernel" || specifier.startsWith("@tabora/platform-kernel/"),
    reason: "@tabora/ui must not import platform kernel",
  },
  {
    matches: (specifier) =>
      specifier === "@tabora/storage" || specifier.startsWith("@tabora/storage/"),
    reason: "@tabora/ui must not import storage",
  },
  {
    matches: (specifier) =>
      specifier === "@tabora/official-plugins" || specifier.startsWith("@tabora/official-plugins/"),
    reason: "@tabora/ui must not import official plugin packages",
  },
  {
    matches: (specifier) =>
      specifier.includes("apps/") ||
      specifier === "@tabora/playground" ||
      specifier.startsWith("@tabora/playground/") ||
      specifier === "@tabora/extension" ||
      specifier.startsWith("@tabora/extension/"),
    reason: "@tabora/ui must not import app source paths",
  },
]

const UI_DEPENDENCY_RULES = [
  {
    matches: (dependency) =>
      dependency === "@tabora/platform-kernel" || dependency.startsWith("@tabora/platform-kernel/"),
    reason: "@tabora/ui must not depend on platform kernel",
  },
  {
    matches: (dependency) =>
      dependency === "@tabora/storage" || dependency.startsWith("@tabora/storage/"),
    reason: "@tabora/ui must not depend on storage",
  },
  {
    matches: (dependency) =>
      dependency === "@tabora/official-plugins" ||
      dependency.startsWith("@tabora/official-plugins/"),
    reason: "@tabora/ui must not depend on official plugin packages",
  },
  {
    matches: (dependency) =>
      dependency === "@tabora/playground" ||
      dependency.startsWith("@tabora/playground/") ||
      dependency === "@tabora/extension" ||
      dependency.startsWith("@tabora/extension/"),
    reason: "@tabora/ui must not depend on app packages",
  },
]

const SHELL_APP_ALLOWED_PRODUCTION_DEPENDENCIES = new Set([
  "@tabora/builtin-plugin-registry",
  "@tabora/host-adapters",
  "@tabora/ui",
  "@tabora/workbench-app",
  "@tabora/workbench-shell",
  "solid-js",
])

const SHELL_APP_FORBIDDEN_PRODUCTION_DEPENDENCIES = [
  {
    matches: isBuiltinPluginDependency,
    reason:
      "shell app production dependencies must enter builtin plugins through @tabora/builtin-plugin-registry",
  },
  {
    matches: isCoreRuntimeDependency,
    reason:
      "shell app production dependencies must use @tabora/workbench-app and host adapters instead of core runtime packages",
  },
  {
    matches: (dependency) =>
      dependency.startsWith("@tabora/") &&
      !SHELL_APP_ALLOWED_PRODUCTION_DEPENDENCIES.has(dependency) &&
      !isBuiltinPluginDependency(dependency) &&
      !isCoreRuntimeDependency(dependency),
    reason:
      "shell app production dependencies must be limited to host composition packages and shell styles",
  },
]

const ORCHESTRATOR_FORBIDDEN_DEPENDENCIES = [
  {
    matches: (dependency) =>
      dependency === "@tabora/storage" ||
      dependency.startsWith("@tabora/storage/") ||
      dependency === "solid-js" ||
      dependency.startsWith("solid-js/"),
    reason: "@tabora/orchestrator must stay UI- and infrastructure-free",
  },
]

function isBuiltinPluginDependency(dependency) {
  return (
    dependency === "@tabora/official-plugins" ||
    dependency.startsWith("@tabora/official-plugins/") ||
    dependency.startsWith("@tabora/layout-") ||
    dependency.startsWith("@tabora/plugin-")
  )
}

function isCoreRuntimeDependency(dependency) {
  return (
    dependency === "@tabora/brand" ||
    dependency.startsWith("@tabora/brand/") ||
    dependency === "@tabora/orchestrator" ||
    dependency.startsWith("@tabora/orchestrator/") ||
    dependency === "@tabora/platform-kernel" ||
    dependency.startsWith("@tabora/platform-kernel/") ||
    dependency === "@tabora/plugin-api" ||
    dependency.startsWith("@tabora/plugin-api/") ||
    dependency === "@tabora/storage" ||
    dependency.startsWith("@tabora/storage/") ||
    dependency === "@tabora/theme" ||
    dependency.startsWith("@tabora/theme/")
  )
}

const CORE_PACKAGE_APP_IMPORT_RULES = [
  {
    matches: (specifier) =>
      specifier.includes("apps/") ||
      specifier === "@tabora/playground" ||
      specifier.startsWith("@tabora/playground/") ||
      specifier === "@tabora/extension" ||
      specifier.startsWith("@tabora/extension/"),
    reason: "packages must not import app source or app packages",
  },
]

const APP_SOURCE_IMPORT_RULES = [
  {
    matches: (specifier) =>
      specifier.includes("apps/") ||
      specifier.includes("playground/src/") ||
      specifier.includes("extension/entrypoints/") ||
      specifier === "@tabora/playground" ||
      specifier.startsWith("@tabora/playground/") ||
      specifier === "@tabora/extension" ||
      specifier.startsWith("@tabora/extension/"),
    reason: "apps must not import other app source or app packages",
  },
]

const RAW_COLOR_PATTERN =
  /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(\s*(?!var\()[^)]+\)|hsla?\(\s*(?!var\()[^)]+\)|!important\b/g
const TYPE_ESCAPE_PATTERN = /\bas any\b|@ts-expect-error|@ts-ignore/g
const ISSUE_MARKER_PATTERN = /\b(?:TODO|FIXME|HACK)\b|console\.(?:log|debug|info)\b/g
const SEARCH_FALLBACK_PATTERNS = [
  {
    pattern:
      /defaultProviderId\s*(?:\|\||\?\?)\s*(?:[A-Za-z_$][\w$.]*\.)?providers(?:\(\))?(?:\?\.)?\[\s*0\s*\]\??\.(?:id|value)/g,
    reason: "search settings must not fall back from defaultProviderId to the first provider",
  },
  {
    pattern:
      /defaultProviderId\s*(?:\|\||\?\?)\s*(?:[A-Za-z_$][\w$.]*\.)?enabledProviders(?:\(\))?(?:\?\.)?\[\s*0\s*\](?:\??\.(?:id|value))?/g,
    reason:
      "search settings must not fall back from defaultProviderId to the first enabled provider",
  },
  {
    pattern: /enabledProviderIds\s*\?\?\s*[A-Za-z_$][\w$]*(?:\(\))?\.map\(/g,
    reason: "search settings must not backfill enabledProviderIds from all providers",
  },
]
const WIDGET_REGION_FALLBACK_PATTERN = /\?\?\s*(?:"mainGrid"|'mainGrid')/g
const DEPRECATED_LAYOUT_ID_PATTERN = /\bofficial\.layout\.dashboard\b/g
const WORKBENCH_APP_EXPORT_PATTERN =
  /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']@tabora\/workbench-app["'];?/g
const PLUGIN_EXTERNAL_OPEN_PATTERN = /window\.open|target="_blank"|target='_blank'/g
const WINDOW_OPEN_PATTERN = /window\.open/g
const REQUIRED_BROWSER_SMOKE_PATHS = [
  "apps/playground/**",
  "apps/extension/**",
  "packages/**",
  "plugins/**",
  "scripts/**",
  "tooling/**",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "vitest.e2e.config.ts",
  ".github/workflows/**",
]
const QUALITY_EXTERNAL_OPEN_PATTERN =
  /window\.open|target="_blank"|target='_blank'|openExternal|external-open/g
const ALLOWED_WINDOW_OPEN_FILES = new Set([
  "packages/workbench-app/src/shell/WorkbenchShellApp.tsx",
])
const EXTERNAL_OPEN_SIGNAL_ORDER = [
  "host-execution",
  "manifest-declaration",
  "runtime-method-reference",
  "test-fixture",
  "bypass-risk",
]
const TEST_MODE_PATTERNS = [
  {
    pattern: /\b(?:it|test|describe)\.only\b/g,
    reason: "focused tests must not be committed",
  },
  {
    pattern: /\.skip\(/g,
    reason: "skipped tests must not be committed",
  },
]
const RAW_COLOR_CATEGORY_ORDER = ["workbench", "background-preset", "site", "test-fixture"]
const WORKBENCH_RAW_COLOR_DEBT_ORDER = [
  "inverse-foreground",
  "shadow-overlay",
  "glow-highlight",
  "important-override",
]
const WORKBENCH_AVOIDABLE_STYLE_PATTERNS = [
  {
    pattern: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0(?:\.0+)?\s*\)/g,
    reason: "use transparent instead of zero-alpha rgba",
  },
  {
    pattern:
      /var\(\s*--color-[a-z0-9-]+\s*,\s*(?:#[0-9a-fA-F]{3,8}|\d{1,3}(?:\s+\d{1,3}){2})\s*\)/gi,
    reason: "workbench theme variables must not carry literal color fallbacks",
  },
]
const WORKBENCH_RAW_COLOR_BASELINE = new Set()
const SOURCE_INVARIANT_FILES = [
  "packages/workbench-shell/src/CommandPalette.tsx",
  "packages/workbench-app/src/layout/WorkbenchShellLayoutHost.ts",
  "packages/platform-kernel/src/runtimeContext.ts",
  "packages/workbench-app/src/surface/WorkbenchShellChrome.tsx",
]

export function resolveRepositoryRoot(startDir) {
  if (existsSync(path.join(startDir, "pnpm-workspace.yaml"))) {
    return startDir
  }

  return path.resolve(startDir, "../..")
}

export async function readRepositoryText(rootDir, relativePath) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  return readFile(path.join(repositoryRoot, relativePath), "utf8")
}

export function extractImportSpecifiers(source) {
  const specifiers = []
  const importPattern =
    /(?:import\s+(?:type\s+)?(?:[^"'()]+?\s+from\s+)?|export\s+(?:type\s+)?[^"'()]+?\s+from\s+|import\s*\()\s*["']([^"']+)["']/g

  for (const match of source.matchAll(importPattern)) {
    if (match[1]) {
      specifiers.push(match[1])
    }
  }

  return specifiers
}

export function findForbiddenPluginImports(options) {
  return findForbiddenImports(options, PLUGIN_IMPORT_RULES)
}

export function findForbiddenPluginDependencies(options) {
  return findForbiddenDependencies(options, PLUGIN_IMPORT_RULES)
}

export function findForbiddenUiImports(options) {
  return findForbiddenImports(options, UI_IMPORT_RULES)
}

export function findForbiddenUiDependencies(options) {
  return findForbiddenDependencies(options, UI_DEPENDENCY_RULES)
}

export function findForbiddenShellAppDependencies(options) {
  return findForbiddenDependencies(
    {
      filePath: options.filePath,
      manifest: {
        dependencies: options.manifest.dependencies,
      },
    },
    SHELL_APP_FORBIDDEN_PRODUCTION_DEPENDENCIES,
  )
}

export function findForbiddenOrchestratorDependencies(options) {
  return findForbiddenDependencies(options, ORCHESTRATOR_FORBIDDEN_DEPENDENCIES)
}

export function findSourceInvariantViolations(options) {
  if (options.filePath === "packages/workbench-shell/src/CommandPalette.tsx") {
    const hasObjectShapedOpen =
      /openExternalForPlugin\?:\s*\(\s*request:\s*\{\s*pluginId:\s*string;\s*url:\s*string\s*\}\s*\)\s*=>\s*boolean/.test(
        options.source,
      )
    const hasUrlOnlyOpen = /openExternal\?:\s*\(\s*url:\s*string\s*\)\s*=>\s*boolean/.test(
      options.source,
    )

    if (!hasObjectShapedOpen || hasUrlOnlyOpen) {
      return [
        {
          filePath: options.filePath,
          match: "CommandPaletteProps.openExternal",
          reason: "CommandPalette external open callback must be owner-aware and object-shaped",
        },
      ]
    }
  }

  if (
    options.filePath === "packages/workbench-app/src/layout/WorkbenchShellLayoutHost.ts" &&
    !/surface\s*===\s*["']menu["']/.test(options.source)
  ) {
    return [
      {
        filePath: options.filePath,
        match: 'surface === "menu"',
        reason: "layout host must expose the menu global actions surface",
      },
    ]
  }

  if (options.filePath === "packages/platform-kernel/src/runtimeContext.ts") {
    return [...options.source.matchAll(/\b(?:getConfig|setConfig)\b/g)].map((match) => ({
      filePath: options.filePath,
      match: match[0],
      reason: "runtime context must not expose stale getConfig/setConfig APIs",
    }))
  }

  if (
    options.filePath === "packages/workbench-app/src/surface/WorkbenchShellChrome.tsx" &&
    !/data-tabora-plugin-id=\{instance\.pluginId\}/.test(options.source)
  ) {
    return [
      {
        filePath: options.filePath,
        match: "data-tabora-plugin-id",
        reason: "safe layout fallback must preserve plugin style scope around widget views",
      },
    ]
  }

  return []
}

export function findCorePackageAppImports(options) {
  return findForbiddenImports(options, CORE_PACKAGE_APP_IMPORT_RULES)
}

export function findCrossAppSourceImports(options) {
  return findForbiddenImports(options, APP_SOURCE_IMPORT_RULES)
}

export function findPackageExportViolations(options) {
  const exportsMap = normalizeExportMap(options.manifest.exports)
  const publishExportsMap = normalizeExportMap(options.manifest.publishConfig?.exports)
  const findings = []
  const buildScript = options.manifest.scripts?.build

  if (typeof buildScript === "string" && buildScript.includes("vp pack")) {
    findings.push(
      ...extractVpPackEntrypoints(buildScript).flatMap((entryPath) => {
        const expected = buildExpectedExports(entryPath)
        if (!expected) {
          return []
        }

        const entryFindings = []

        if (exportsMap[expected.exportKey] !== expected.sourceTarget) {
          entryFindings.push({
            filePath: options.filePath,
            match: `exports["${expected.exportKey}"]`,
            reason: `missing or incorrect export for build entry "${entryPath}"; expected "${expected.sourceTarget}"`,
          })
        }

        if (publishExportsMap[expected.exportKey] !== expected.publishTarget) {
          entryFindings.push({
            filePath: options.filePath,
            match: `publishConfig.exports["${expected.exportKey}"]`,
            reason: `missing or incorrect publish export for build entry "${entryPath}"; expected "${expected.publishTarget}"`,
          })
        }

        return entryFindings
      }),
    )
  }

  for (const exportKey of Object.keys(exportsMap)) {
    if (exportKey.endsWith(".css") && publishExportsMap[exportKey] === undefined) {
      findings.push({
        filePath: options.filePath,
        match: `publishConfig.exports["${exportKey}"]`,
        reason: `missing publish export for stylesheet subpath "${exportKey}"; packages must declare publish CSS targets explicitly`,
      })
    }
  }

  return findings
}

export function findTypeEscapeViolations(options) {
  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: TYPE_ESCAPE_PATTERN,
    reason: "type escapes must not be committed in production source",
  })
}

export function findForbiddenSearchFallbacks(options) {
  if (isTestFile(options.filePath)) {
    return []
  }

  return SEARCH_FALLBACK_PATTERNS.flatMap(({ pattern, reason }) =>
    collectPatternMatches({
      filePath: options.filePath,
      source: options.source,
      pattern,
      reason,
    }),
  )
}

export function findWidgetRegionFallbackViolations(options) {
  if (isTestFile(options.filePath)) {
    return []
  }

  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: WIDGET_REGION_FALLBACK_PATTERN,
    reason: 'widget region resolution must not fall back to "mainGrid"',
  })
}

export function findDeprecatedLayoutIdViolations(options) {
  if (isTestFile(options.filePath)) {
    return []
  }

  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: DEPRECATED_LAYOUT_ID_PATTERN,
    reason: "deprecated layout id official.layout.dashboard must not appear in production source",
  })
}

export function findPassThroughWorkbenchAppExports(options) {
  if (isTestFile(options.filePath) || !options.filePath.startsWith("apps/")) {
    return []
  }

  const matches = [...options.source.matchAll(WORKBENCH_APP_EXPORT_PATTERN)].map(
    (match) => match[0],
  )
  if (matches.length === 0) {
    return []
  }

  const strippedSource = options.source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(WORKBENCH_APP_EXPORT_PATTERN, "")
    .replace(/\s+/g, "")
    .replace(/;+$/g, "")

  if (strippedSource.length > 0) {
    return []
  }

  return matches.map((match) => ({
    filePath: options.filePath,
    match,
    reason: "apps must not keep pure pass-through compatibility wrappers for @tabora/workbench-app",
  }))
}

export function findBrowserSmokeWorkflowViolations(options) {
  if (options.filePath !== ".github/workflows/ci.yml") {
    return []
  }

  const findings = []

  for (const workflowPath of REQUIRED_BROWSER_SMOKE_PATHS) {
    if (!options.source.includes(`- "${workflowPath}"`)) {
      findings.push({
        filePath: options.filePath,
        match: "pull_request.paths",
        reason: "CI pull_request workflow must gate browser smoke by the required Tabora path set",
      })
      break
    }
  }

  if (
    !/browser-smoke:\s*[\s\S]*?\bif:\s*github\.event_name\s*==\s*['"]pull_request['"]/.test(
      options.source,
    )
  ) {
    findings.push({
      filePath: options.filePath,
      match: "jobs.browser-smoke.if",
      reason: "CI browser smoke job must run only for pull_request events",
    })
  }

  if (!options.source.includes("pnpm exec playwright install --with-deps chromium")) {
    findings.push({
      filePath: options.filePath,
      match: "pnpm exec playwright install --with-deps chromium",
      reason: "CI browser smoke job must install Playwright Chromium before pnpm test:e2e",
    })
  }

  if (!/browser-smoke:\s*[\s\S]*?- run: pnpm test:e2e/.test(options.source)) {
    findings.push({
      filePath: options.filePath,
      match: "pnpm test:e2e",
      reason: "CI browser smoke job must execute pnpm test:e2e",
    })
  }

  return findings
}

export function findWorkbenchRawColorViolations(options) {
  if (classifyRawColorMatch(options.filePath) !== "workbench") {
    return []
  }

  return findRawColorMatches(options)
    .filter((finding) => !WORKBENCH_RAW_COLOR_BASELINE.has(serializeRawColorFinding(finding)))
    .map((finding) => ({
      ...finding,
      reason: "new workbench raw colors must be tokenized or added to the reviewed baseline",
    }))
}

export function findWorkbenchAvoidableStyleViolations(options) {
  if (classifyRawColorMatch(options.filePath) !== "workbench") {
    return []
  }

  return WORKBENCH_AVOIDABLE_STYLE_PATTERNS.flatMap(({ pattern, reason }) =>
    collectPatternMatches({
      filePath: options.filePath,
      source: options.source,
      pattern,
      reason,
    }),
  )
}

export function findWindowOpenViolations(options) {
  if (isTestFile(options.filePath) || ALLOWED_WINDOW_OPEN_FILES.has(options.filePath)) {
    return []
  }

  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: WINDOW_OPEN_PATTERN,
    reason: "window.open must stay in the shell host execution path",
  })
}

export function findPluginExternalOpenViolations(options) {
  if (isTestFile(options.filePath)) {
    return []
  }

  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: PLUGIN_EXTERNAL_OPEN_PATTERN,
    reason: "plugins must not bypass the external-open permission bridge",
  })
}

export function findTestModeViolations(options) {
  return TEST_MODE_PATTERNS.flatMap(({ pattern, reason }) =>
    collectPatternMatches({
      filePath: options.filePath,
      source: options.source,
      pattern,
      reason,
    }),
  )
}

export function findTypeEscapeMatches(options) {
  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: TYPE_ESCAPE_PATTERN,
  })
}

export function findIssueMarkerMatches(options) {
  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: ISSUE_MARKER_PATTERN,
  })
}

export function findRawColorMatches(options) {
  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: RAW_COLOR_PATTERN,
  })
}

export function classifyRawColorMatch(filePath) {
  if (isTestFile(filePath)) {
    return "test-fixture"
  }

  if (filePath.startsWith("apps/site/")) {
    return "site"
  }

  if (filePath === "packages/official-plugins/src/background-basic.ts") {
    return "background-preset"
  }

  return "workbench"
}

export function summarizeRawColorMatches(findings) {
  const summary = {
    workbench: 0,
    "background-preset": 0,
    site: 0,
    "test-fixture": 0,
  }

  for (const finding of findings) {
    summary[classifyRawColorMatch(finding.filePath)] += 1
  }

  return summary
}

export function classifyWorkbenchRawColorDebt(finding) {
  if (classifyRawColorMatch(finding.filePath) !== "workbench") {
    return null
  }

  if (finding.match === "#fff") {
    return "inverse-foreground"
  }

  if (finding.match === "!important") {
    return "important-override"
  }

  if (
    /^rgba\(\s*(?:255\s*,\s*255\s*,\s*255|26\s*,\s*144\s*,\s*112|28\s*,\s*30\s*,\s*28)\s*,/i.test(
      finding.match,
    )
  ) {
    return "glow-highlight"
  }

  if (
    /^rgba\(\s*(?:0\s*,\s*0\s*,\s*0|8\s*,\s*10\s*,\s*8|15\s*,\s*23\s*,\s*18)\s*,/i.test(
      finding.match,
    )
  ) {
    return "shadow-overlay"
  }

  return null
}

export function summarizeWorkbenchRawColorDebt(findings) {
  const summary = {
    "inverse-foreground": 0,
    "shadow-overlay": 0,
    "glow-highlight": 0,
    "important-override": 0,
  }

  for (const finding of findings) {
    const category = classifyWorkbenchRawColorDebt(finding)
    if (category) {
      summary[category] += 1
    }
  }

  return summary
}

export function findExternalOpenMatches(options) {
  return collectPatternMatches({
    filePath: options.filePath,
    source: options.source,
    pattern: QUALITY_EXTERNAL_OPEN_PATTERN,
  })
}

export function classifyExternalOpenMatch(finding) {
  if (isTestFile(finding.filePath)) {
    return "test-fixture"
  }

  if (ALLOWED_WINDOW_OPEN_FILES.has(finding.filePath)) {
    return "host-execution"
  }

  if (
    finding.match === "window.open" ||
    finding.match === 'target="_blank"' ||
    finding.match === "target='_blank'"
  ) {
    return "bypass-risk"
  }

  if (finding.match === "external-open") {
    return "manifest-declaration"
  }

  return "runtime-method-reference"
}

export function summarizeExternalOpenMatches(findings) {
  const summary = {
    "host-execution": 0,
    "manifest-declaration": 0,
    "runtime-method-reference": 0,
    "test-fixture": 0,
    "bypass-risk": 0,
  }
  const seen = new Set()

  for (const finding of findings) {
    const category = classifyExternalOpenMatch(finding)
    const key = `${category}::${finding.filePath}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    summary[category] += 1
  }

  return summary
}

export function rankFilesByLineCount(entries, limit = 20) {
  return [...entries]
    .sort(
      (left, right) =>
        right.lineCount - left.lineCount || left.filePath.localeCompare(right.filePath),
    )
    .slice(0, limit)
}

export async function scanPluginSourceBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "packages", "official-plugins", "src"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath)) && !isTestFile(filePath),
  )

  return scanFiles(repositoryRoot, files, findForbiddenPluginImports)
}

export async function scanPluginPackageBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = [
    path.join(repositoryRoot, "packages", "official-plugins", "package.json"),
    ...(await collectFiles(
      [path.join(repositoryRoot, "plugins")],
      (filePath) => path.basename(filePath) === "package.json",
    )),
  ]

  return scanPackageFiles(repositoryRoot, uniquePaths(files), findForbiddenPluginDependencies)
}

export async function scanUiSourceBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [path.join(repositoryRoot, "packages", "ui", "src")],
    (filePath) => IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath)) && !isTestFile(filePath),
  )

  return scanFiles(repositoryRoot, files, findForbiddenUiImports)
}

export async function scanUiPackageBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  return scanPackageFiles(
    repositoryRoot,
    [path.join(repositoryRoot, "packages", "ui", "package.json")],
    findForbiddenUiDependencies,
  )
}

export async function scanShellAppPackageBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  return scanPackageFiles(
    repositoryRoot,
    [
      path.join(repositoryRoot, "apps", "playground", "package.json"),
      path.join(repositoryRoot, "apps", "extension", "package.json"),
    ],
    findForbiddenShellAppDependencies,
  )
}

export async function scanOrchestratorPackageBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  return scanPackageFiles(
    repositoryRoot,
    [path.join(repositoryRoot, "packages", "orchestrator", "package.json")],
    findForbiddenOrchestratorDependencies,
  )
}

export async function scanSourceInvariantBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = SOURCE_INVARIANT_FILES.map((filePath) => path.join(repositoryRoot, filePath))

  return scanFiles(repositoryRoot, files, findSourceInvariantViolations)
}

export async function scanPluginExternalOpenBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles([path.join(repositoryRoot, "plugins")], (filePath) =>
    IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath)),
  )

  return scanFiles(repositoryRoot, files, findPluginExternalOpenViolations)
}

export async function scanTestModeBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath)) && isTestFile(filePath),
  )

  return scanFiles(repositoryRoot, files, findTestModeViolations)
}

export async function scanCorePackageAppImportBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles([path.join(repositoryRoot, "packages")], (filePath) => {
    if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
      return false
    }

    if (isTestFile(filePath)) {
      return false
    }

    return filePath.includes(`${path.sep}src${path.sep}`)
  })

  return scanFiles(repositoryRoot, files, findCorePackageAppImports)
}

export async function scanAppSourceBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps", "playground", "src"),
      path.join(repositoryRoot, "apps", "extension", "entrypoints"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      return !isTestFile(filePath)
    },
  )

  return scanFiles(repositoryRoot, files, findCrossAppSourceImports)
}

export async function scanPackageExportBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles([path.join(repositoryRoot, "packages")], (filePath) => {
    return path.basename(filePath) === "package.json"
  })

  return scanPackageFiles(repositoryRoot, files, findPackageExportViolations)
}

export async function scanTypeEscapeBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findTypeEscapeViolations)
}

export async function scanSearchFallbackBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findForbiddenSearchFallbacks)
}

export async function scanWidgetRegionFallbackBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findWidgetRegionFallbackViolations)
}

export async function scanAppWorkbenchPassThroughBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps", "playground", "src"),
      path.join(repositoryRoot, "apps", "extension", "entrypoints"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      return !isTestFile(filePath)
    },
  )

  return scanFiles(repositoryRoot, files, findPassThroughWorkbenchAppExports)
}

export async function scanDeprecatedLayoutIdBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findDeprecatedLayoutIdViolations)
}

export async function scanWindowOpenBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!IMPORT_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findWindowOpenViolations)
}

export async function scanBrowserSmokeWorkflowBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const workflowPath = path.join(repositoryRoot, ".github", "workflows", "ci.yml")

  if (!existsSync(workflowPath)) {
    return []
  }

  return scanFiles(repositoryRoot, [workflowPath], findBrowserSmokeWorkflowViolations)
}

export async function scanWorkbenchRawColorBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!QUALITY_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findWorkbenchRawColorViolations)
}

export async function scanWorkbenchAvoidableStyleBoundaries(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const files = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => {
      if (!QUALITY_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
        return false
      }

      if (isTestFile(filePath)) {
        return false
      }

      return filePath.includes(`${path.sep}src${path.sep}`)
    },
  )

  return scanFiles(repositoryRoot, files, findWorkbenchAvoidableStyleViolations)
}

export async function scanArchitecture(rootDir) {
  const findings = [
    ...(await scanPluginSourceBoundaries(rootDir)),
    ...(await scanPluginPackageBoundaries(rootDir)),
    ...(await scanUiSourceBoundaries(rootDir)),
    ...(await scanUiPackageBoundaries(rootDir)),
    ...(await scanShellAppPackageBoundaries(rootDir)),
    ...(await scanOrchestratorPackageBoundaries(rootDir)),
    ...(await scanPluginExternalOpenBoundaries(rootDir)),
    ...(await scanTestModeBoundaries(rootDir)),
    ...(await scanCorePackageAppImportBoundaries(rootDir)),
    ...(await scanAppSourceBoundaries(rootDir)),
    ...(await scanPackageExportBoundaries(rootDir)),
    ...(await scanTypeEscapeBoundaries(rootDir)),
    ...(await scanSearchFallbackBoundaries(rootDir)),
    ...(await scanWidgetRegionFallbackBoundaries(rootDir)),
    ...(await scanDeprecatedLayoutIdBoundaries(rootDir)),
    ...(await scanAppWorkbenchPassThroughBoundaries(rootDir)),
    ...(await scanWindowOpenBoundaries(rootDir)),
    ...(await scanBrowserSmokeWorkflowBoundaries(rootDir)),
    ...(await scanWorkbenchRawColorBoundaries(rootDir)),
    ...(await scanWorkbenchAvoidableStyleBoundaries(rootDir)),
    ...(await scanSourceInvariantBoundaries(rootDir)),
  ]

  return findings.sort(compareFindings)
}

export async function scanQuality(rootDir) {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const qualityFiles = await collectFiles(
    [
      path.join(repositoryRoot, "apps"),
      path.join(repositoryRoot, "packages"),
      path.join(repositoryRoot, "plugins"),
    ],
    (filePath) => QUALITY_SOURCE_EXTENSIONS.has(path.extname(filePath)),
  )

  const typeEscapes = await scanFiles(repositoryRoot, qualityFiles, findTypeEscapeMatches)
  const issueMarkers = await scanFiles(repositoryRoot, qualityFiles, findIssueMarkerMatches)
  const rawColors = await scanFiles(repositoryRoot, qualityFiles, findRawColorMatches)
  const externalOpenPatterns = await scanFiles(
    repositoryRoot,
    qualityFiles.filter((filePath) => path.extname(filePath) !== ".css"),
    findExternalOpenMatches,
  )
  const largeFiles = rankFilesByLineCount(
    await Promise.all(
      qualityFiles.map(async (filePath) => ({
        filePath: path.relative(repositoryRoot, filePath),
        lineCount: countLines(await readFile(filePath, "utf8")),
      })),
    ),
  )

  return {
    typeEscapes,
    issueMarkers,
    largeFiles,
    rawColors,
    rawColorSummary: summarizeRawColorMatches(rawColors),
    workbenchRawColorDebtSummary: summarizeWorkbenchRawColorDebt(rawColors),
    externalOpenPatterns,
  }
}

export function buildArchitectureFailureReport(findings) {
  const lines = ["Architecture check failed:"]

  for (const finding of findings) {
    lines.push(`- ${formatArchitectureFinding(finding)}`)
  }

  return lines.join("\n")
}

export function buildQualityReport(result) {
  const rawColorSummary = result.rawColorSummary ?? summarizeRawColorMatches(result.rawColors)
  const workbenchRawColorDebtSummary =
    result.workbenchRawColorDebtSummary ?? summarizeWorkbenchRawColorDebt(result.rawColors)
  const externalOpenSummary =
    result.externalOpenSummary ?? summarizeExternalOpenMatches(result.externalOpenPatterns)
  const externalOpenBypassRiskSamples = summarizeBypassRiskSamples(result.externalOpenPatterns)
  const lines = [
    "Quality report",
    `- Type escapes: ${result.typeEscapes.length}`,
    ...formatMatchSamples(result.typeEscapes),
    `- Issue markers: ${result.issueMarkers.length}`,
    ...formatMatchSamples(result.issueMarkers),
    "- Large files top 20:",
    ...formatLargeFiles(result.largeFiles),
    `- Raw CSS colors / !important: ${result.rawColors.length}`,
    ...formatRawColorSummary(rawColorSummary),
    ...formatWorkbenchRawColorDebtSummary(workbenchRawColorDebtSummary),
    ...formatMatchSamples(orderRawColorMatchesForReport(result.rawColors)),
    ...formatExternalOpenSummary(externalOpenSummary),
    ...formatMatchSamples(externalOpenBypassRiskSamples),
  ]

  return lines.join("\n")
}

function findForbiddenImports(options, rules) {
  const specifiers = extractImportSpecifiers(options.source)

  return specifiers.flatMap((specifier) =>
    rules
      .filter((rule) => rule.matches(specifier))
      .map((rule) => ({
        filePath: options.filePath,
        specifier,
        reason: rule.reason,
      })),
  )
}

function findForbiddenDependencies(options, rules) {
  return DEPENDENCY_SECTIONS.flatMap((section) =>
    Object.keys(options.manifest[section] ?? {}).flatMap((dependency) =>
      rules
        .filter((rule) => rule.matches(dependency))
        .map((rule) => ({
          filePath: options.filePath,
          dependency,
          section,
          reason: rule.reason,
        })),
    ),
  )
}

function collectPatternMatches(options) {
  const matches = []

  for (const match of options.source.matchAll(options.pattern)) {
    if (match[0]) {
      matches.push({
        filePath: options.filePath,
        match: match[0],
        ...(options.reason ? { reason: options.reason } : {}),
      })
    }
  }

  return matches
}

function normalizeExportMap(exportsField) {
  if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(exportsField).flatMap(([exportKey, target]) =>
      typeof target === "string" ? [[exportKey, target]] : [],
    ),
  )
}

function extractVpPackEntrypoints(buildScript) {
  const match = buildScript.match(/\bvp\s+pack\b([\s\S]*)/)

  if (!match) {
    return []
  }

  const tokens = match[1]
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
  const entries = []

  for (const token of tokens) {
    if (token === "&&" || token === "||") {
      break
    }

    if (token.startsWith("-")) {
      continue
    }

    if (/\.[cm]?[jt]sx?$/.test(token)) {
      entries.push(token)
    }
  }

  return [...new Set(entries)]
}

function buildExpectedExports(entryPath) {
  const normalizedPath = entryPath.replaceAll("\\", "/")

  if (!normalizedPath.startsWith("src/")) {
    return null
  }

  const extension = path.extname(normalizedPath)
  const relativeEntry = normalizedPath.slice("src/".length, -extension.length)

  if (relativeEntry.length === 0) {
    return null
  }

  const exportKey =
    relativeEntry === "index"
      ? "."
      : relativeEntry.endsWith("/index")
        ? `./${relativeEntry.slice(0, -"/index".length)}`
        : `./${relativeEntry}`

  return {
    exportKey,
    sourceTarget: `./${normalizedPath}`,
    publishTarget: `./dist/${relativeEntry}.js`,
  }
}

async function collectFiles(roots, matcher) {
  const files = []

  for (const root of roots) {
    await walk(root, files, matcher)
  }

  return uniquePaths(files)
}

async function walk(dir, files, matcher) {
  if (!existsSync(dir)) {
    return
  }

  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === "dist" || entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue
    }

    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(entryPath, files, matcher)
      continue
    }

    if (matcher(entryPath)) {
      files.push(entryPath)
    }
  }
}

async function scanFiles(repositoryRoot, files, finder) {
  const findings = []

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8")
    findings.push(
      ...finder({
        filePath: path.relative(repositoryRoot, filePath),
        source,
      }),
    )
  }

  return uniqueFindings(findings)
}

async function scanPackageFiles(repositoryRoot, files, finder) {
  const findings = []

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      continue
    }

    const manifest = JSON.parse(await readFile(filePath, "utf8"))
    findings.push(
      ...finder({
        filePath: path.relative(repositoryRoot, filePath),
        manifest,
      }),
    )
  }

  return uniqueFindings(findings)
}

function uniquePaths(paths) {
  return [...new Set(paths)]
}

function uniqueFindings(findings) {
  const seen = new Set()
  const result = []

  for (const finding of findings) {
    const key = JSON.stringify(finding)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(finding)
  }

  return result
}

function compareFindings(left, right) {
  return formatArchitectureFinding(left).localeCompare(formatArchitectureFinding(right))
}

function formatArchitectureFinding(finding) {
  if ("specifier" in finding) {
    return `${finding.filePath} imports ${finding.specifier}: ${finding.reason}`
  }

  if ("dependency" in finding) {
    return `${finding.filePath} depends on ${finding.dependency} (${finding.section}): ${finding.reason}`
  }

  return `${finding.filePath} contains ${finding.match}: ${finding.reason}`
}

function formatMatchSamples(findings, limit = 10) {
  return findings.slice(0, limit).map((finding) => `  - ${finding.filePath}: ${finding.match}`)
}

function formatRawColorSummary(summary) {
  return [
    `  - workbench production: ${summary.workbench}`,
    `  - generated backgrounds: ${summary["background-preset"]}`,
    `  - site styles: ${summary.site}`,
    `  - test fixtures: ${summary["test-fixture"]}`,
  ]
}

function formatExternalOpenSummary(summary) {
  const labels = {
    "host-execution": "host execution paths",
    "manifest-declaration": "manifest declarations",
    "runtime-method-reference": "runtime method references",
    "test-fixture": "test fixtures",
    "bypass-risk": "potential bypass paths",
  }

  return [
    "- External open signals:",
    ...EXTERNAL_OPEN_SIGNAL_ORDER.map(
      (category) => `  - ${labels[category]}: ${summary[category]}`,
    ),
  ]
}

function summarizeBypassRiskSamples(findings) {
  const matchesByFile = new Map()

  for (const finding of findings) {
    if (classifyExternalOpenMatch(finding) !== "bypass-risk") {
      continue
    }

    const matches = matchesByFile.get(finding.filePath) ?? new Set()
    matches.add(finding.match)
    matchesByFile.set(finding.filePath, matches)
  }

  return [...matchesByFile.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filePath, matches]) => ({
      filePath,
      match: [...matches].sort((left, right) => left.localeCompare(right)).join(", "),
    }))
}

function formatWorkbenchRawColorDebtSummary(summary) {
  const total = Object.values(summary).reduce((count, value) => count + value, 0)
  if (total === 0) {
    return []
  }

  return [
    "- Workbench raw color debt:",
    ...WORKBENCH_RAW_COLOR_DEBT_ORDER.map((category) => {
      const label = category.replaceAll("-", " ")
      return `  - ${label}: ${summary[category]}`
    }),
  ]
}

function formatLargeFiles(entries) {
  return entries.map((entry) => `  - ${entry.filePath} (${entry.lineCount} lines)`)
}

function orderRawColorMatchesForReport(findings) {
  return [...findings].sort((left, right) => {
    const leftCategory = classifyRawColorMatch(left.filePath)
    const rightCategory = classifyRawColorMatch(right.filePath)

    return (
      RAW_COLOR_CATEGORY_ORDER.indexOf(leftCategory) -
        RAW_COLOR_CATEGORY_ORDER.indexOf(rightCategory) ||
      left.filePath.localeCompare(right.filePath) ||
      left.match.localeCompare(right.match)
    )
  })
}

function serializeRawColorFinding(finding) {
  return `${finding.filePath}::${finding.match}`
}

function isTestFile(filePath) {
  return TEST_FILE_PATTERN.test(filePath)
}

function countLines(source) {
  if (source.length === 0) {
    return 0
  }

  return source.split(/\r?\n/).length
}
