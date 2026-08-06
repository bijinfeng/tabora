import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { taboraAppIconPath } from "@tabora/brand/assetPaths"
import sharp from "sharp"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const shouldCheck = process.argv.includes("--check")

const iconVariants = [
  {
    size: 64,
    paths: ["tabora/ICON.PNG", "tabora/app/ui/images/icon_64.png"],
  },
  {
    size: 256,
    paths: ["tabora/ICON_256.PNG", "tabora/app/ui/images/icon_256.png"],
  },
] as const

async function renderIcon(size: number) {
  return sharp(taboraAppIconPath).resize(size, size).png().toBuffer()
}

async function isCurrent(path: string, contents: Buffer) {
  try {
    return (await readFile(path)).equals(contents)
  } catch {
    return false
  }
}

const stalePaths: string[] = []

for (const variant of iconVariants) {
  const contents = await renderIcon(variant.size)

  for (const relativePath of variant.paths) {
    const outputPath = resolve(packageRoot, relativePath)

    if (shouldCheck) {
      if (!(await isCurrent(outputPath, contents))) stalePaths.push(relativePath)
      continue
    }

    await writeFile(outputPath, contents)
  }
}

if (shouldCheck && stalePaths.length > 0) {
  throw new Error(`FNOS 图标未由 ${taboraAppIconPath} 重新生成：${stalePaths.join(", ")}`)
}
