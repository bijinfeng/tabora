import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const siteSrcDir = dirname(fileURLToPath(import.meta.url))
const legacyPaths = [
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
  "../shared/Footer.tsx",
  "../shared/SectionHead.tsx",
  "../shared/workbenchScreenshot.ts",
]

describe("site legacy UI cleanup", () => {
  it("does not keep the previous standalone marketing UI implementation", () => {
    expect(
      legacyPaths.filter((relativePath) => existsSync(resolve(siteSrcDir, relativePath))),
    ).toEqual([])
  })
})
