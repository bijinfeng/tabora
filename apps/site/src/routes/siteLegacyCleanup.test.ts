import { existsSync } from "node:fs"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const siteSrcDir = dirname(fileURLToPath(import.meta.url))
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

const lineCount = (relativePath: string) => {
  return readFileSync(resolve(siteSrcDir, relativePath), "utf8").trimEnd().split("\n").length
}

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
})
