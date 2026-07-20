import { existsSync } from "node:fs"
import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const siteSrcDir = dirname(fileURLToPath(import.meta.url))
const siteRootDir = resolve(siteSrcDir, "..")
const removedLegacyPaths = [
  "home/components/Cta.tsx",
  "home/components/LayoutsSection.tsx",
  "home/components/PluginsSection.tsx",
  "home/components/ProductStage.tsx",
  "home/components/StartSection.tsx",
  "home/components/UiFragment.tsx",
  "home/components/WorkbenchSections.tsx",
  "home/homeContent.ts",
  "download/components/DownloadConsole.tsx",
  "download/downloadContent.ts",
  "../shared/prototypeContent.ts",
  "../shared/Footer.tsx",
  "../shared/SectionHead.tsx",
  "../shared/workbenchScreenshot.ts",
]

const requiredSlices = [
  "home/homePrototypeContent.ts",
  "home/components/HeroSection.tsx",
  "home/components/WorkbenchPreview.tsx",
  "home/components/FeatureSections.tsx",
  "home/components/CommandDialog.tsx",
  "download/downloadPrototypeContent.ts",
  "download/components/DownloadHero.tsx",
  "download/components/PlatformSection.tsx",
  "download/components/InstallSection.tsx",
  "download/components/DownloadSupport.tsx",
  "docs/components/DocsGuideSections.tsx",
  "docs/components/DocsCodeBlock.tsx",
  "../shared/SiteFooter.tsx",
  "../shared/SiteToast.tsx",
  "../shared/codeHighlight.ts",
]

const maxEntryLines = 160
const routeFilesWithoutHashDocsLinks = [
  "download/DownloadPage.tsx",
  "download/components/DownloadHero.tsx",
  "download/components/PlatformSection.tsx",
]

const lineCount = (relativePath: string) => {
  return readFileSync(resolve(siteSrcDir, relativePath), "utf8").trimEnd().split("\n").length
}

function productionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name)
    if (entry.isDirectory()) return productionTsxFiles(entryPath)
    if (!entry.name.endsWith(".tsx")) return []
    if (entry.name.endsWith(".test.tsx") || entry.name.endsWith(".spec.tsx")) return []
    return [entryPath]
  })
}

const requiredStableSelectors = new Map([
  ["home/HomePage.tsx", "data-site-home"],
  ["home/components/WorkbenchPreview.tsx", "data-site-workbench-preview"],
  ["home/components/CommandDialog.tsx", "data-site-command-dialog"],
  ["download/DownloadPage.tsx", "data-site-download"],
  ["download/components/DownloadSupport.tsx", "data-site-faq-item"],
  ["docs/DocsShell.tsx", "data-docs-shell"],
  ["docs/DocsHomePage.tsx", "data-docs-sidebar"],
  ["docs/ComponentDocCard.tsx", "data-component-doc"],
  ["docs/components/DocsGuideSections.tsx", "data-docs-demo"],
  ["docs/components/DocsCodeBlock.tsx", "data-docs-code"],
])

describe("site route slices", () => {
  it("does not keep the previous standalone marketing UI implementation", () => {
    expect(
      removedLegacyPaths.filter((relativePath) => existsSync(resolve(siteSrcDir, relativePath))),
    ).toEqual([])
  })

  it("keeps public site routes split into vertical slices", () => {
    expect(
      requiredSlices.filter((relativePath) => !existsSync(resolve(siteSrcDir, relativePath))),
    ).toEqual([])

    expect(lineCount("home/HomePage.tsx")).toBeLessThanOrEqual(maxEntryLines)
    expect(lineCount("download/DownloadPage.tsx")).toBeLessThanOrEqual(maxEntryLines)
    expect(lineCount("docs/DocsHomePage.tsx")).toBeLessThanOrEqual(maxEntryLines)
  })

  it("does not keep hash-based docs quickstart links", () => {
    expect(
      routeFilesWithoutHashDocsLinks.filter((relativePath) =>
        readFileSync(resolve(siteSrcDir, relativePath), "utf8").includes("/docs#quickstart"),
      ),
    ).toEqual([])
  })

  it("keeps route interactions on stable data selectors", () => {
    const missingSelectors = [...requiredStableSelectors].filter(([relativePath, selector]) => {
      return !readFileSync(resolve(siteSrcDir, relativePath), "utf8").includes(selector)
    })

    expect(missingSelectors).toEqual([])
  })

  it("uses component-local StyleX instead of static semantic classes", () => {
    const violations = productionTsxFiles(siteRootDir).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8")
      const findings: string[] = []
      const relativePath = filePath.slice(siteRootDir.length + 1)

      if (/\bclass\s*=/.test(source)) findings.push(`${relativePath}: class`)
      if (/\bclassName\s*=/.test(source)) findings.push(`${relativePath}: className`)
      if (/\bclassList\s*=/.test(source)) findings.push(`${relativePath}: classList`)

      return findings
    })

    expect(violations).toEqual([])
  })
})
