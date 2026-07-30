import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { pruneProductionFiles } from "../scripts/prune-production-files.mjs"

const temporaryRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  )
})

describe("pruneProductionFiles", () => {
  it("removes development artifacts while keeping executable code and licenses", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "tabora-strapi-prune-"))
    temporaryRoots.push(root)
    await mkdir(path.join(root, "package", "tests"), { recursive: true })
    await writeFile(path.join(root, "package", "index.js"), "export const value = 1\n")
    await writeFile(path.join(root, "package", "index.js.map"), "map")
    await writeFile(path.join(root, "package", "index.d.ts"), "declare const value: number\n")
    await writeFile(path.join(root, "package", "source.ts"), "export const source = true\n")
    await writeFile(path.join(root, "package", "history.js"), "export const history = true\n")
    await writeFile(path.join(root, "package", "README.md"), "documentation\n")
    await writeFile(path.join(root, "package", "LICENSE"), "license\n")
    await writeFile(path.join(root, "package", "tests", "index.test.js"), "test\n")

    await pruneProductionFiles(root)

    await expect(readFile(path.join(root, "package", "index.js"), "utf8")).resolves.toContain(
      "value",
    )
    await expect(readFile(path.join(root, "package", "LICENSE"), "utf8")).resolves.toContain(
      "license",
    )
    await expect(readFile(path.join(root, "package", "history.js"), "utf8")).resolves.toContain(
      "history",
    )
    await expect(
      readFile(path.join(root, "package", "index.js.map"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" })
    await expect(readFile(path.join(root, "package", "index.d.ts"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(readFile(path.join(root, "package", "source.ts"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(readFile(path.join(root, "package", "README.md"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(
      readFile(path.join(root, "package", "tests", "index.test.js"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("removes native packages that are incompatible with the target runtime", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "tabora-strapi-prune-"))
    temporaryRoots.push(root)

    const muslPackage = await writePackage(root, "@native/tool-musl", {
      os: ["linux"],
      cpu: ["x64"],
      libc: ["musl"],
    })
    const glibcPackage = await writePackage(root, "@native/tool-glibc", {
      os: ["linux"],
      cpu: ["x64"],
      libc: ["glibc"],
    })
    const armPackage = await writePackage(root, "@native/tool-arm64", {
      os: ["linux"],
      cpu: ["arm64"],
    })
    const portablePackage = await writePackage(root, "portable-package", {
      os: ["!win32"],
    })

    await pruneProductionFiles(root, { os: "linux", cpu: "x64", libc: "musl" })

    await expect(readFile(path.join(muslPackage, "index.js"), "utf8")).resolves.toContain("value")
    await expect(readFile(path.join(portablePackage, "index.js"), "utf8")).resolves.toContain(
      "value",
    )
    await expect(readFile(path.join(glibcPackage, "index.js"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(readFile(path.join(armPackage, "index.js"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    })
  })
})

async function writePackage(
  root: string,
  name: string,
  constraints: { os?: string[]; cpu?: string[]; libc?: string[] },
) {
  const directory = path.join(root, "node_modules", ...name.split("/"))
  await mkdir(directory, { recursive: true })
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name, version: "1.0.0", ...constraints }),
  )
  await writeFile(path.join(directory, "index.js"), "export const value = 1\n")
  return directory
}
