import { describe, expect, it } from "vitest"

import {
  analyzeTestSource,
  buildTestInventoryReport,
  collectTestInventory,
} from "../../scripts/lib/testInventory.mjs"

describe("test inventory", () => {
  it("flags mock-heavy tests as review candidates without declaring them invalid", () => {
    expect(
      analyzeTestSource({
        filePath: "packages/example/src/runtime.test.ts",
        source: `
          vi.mock("./a", () => ({}))
          vi.mock("./b", () => ({}))
          vi.mock("./c", () => ({}))

          it("initializes runtime", () => {
            expect(createRuntime()).toEqual({ ready: true })
          })
        `,
      }),
    ).toMatchObject({
      filePath: "packages/example/src/runtime.test.ts",
      mockCount: 3,
      reviewReasons: ["3 module mocks"],
    })
  })

  it("flags tests that only verify collaborator calls", () => {
    expect(
      analyzeTestSource({
        filePath: "packages/example/src/controller.test.ts",
        source: `
          it("runs the controller", () => {
            runController()
            expect(save).toHaveBeenCalledTimes(1)
          })
        `,
      }).reviewReasons,
    ).toEqual(["only asserts collaborator calls"])
  })

  it("does not flag a test that combines a collaborator assertion with observable behavior", () => {
    expect(
      analyzeTestSource({
        filePath: "packages/example/src/controller.test.ts",
        source: `
          it("saves and shows the completed state", () => {
            runController()
            expect(save).toHaveBeenCalledTimes(1)
            expect(screen.getByText("Saved")).toBeInTheDocument()
          })
        `,
      }).reviewReasons,
    ).toEqual([])
  })

  it("recognizes DOM truthy assertions as observable behavior", () => {
    expect(
      analyzeTestSource({
        filePath: "packages/example/src/boundary.test.tsx",
        source: `
          expect(host.querySelector("[data-testid='safe']")).toBeTruthy()
          expect(onError).toHaveBeenCalled()
        `,
      }).reviewReasons,
    ).toEqual([])
  })

  it("flags snapshot-heavy tests as candidates for intent review", () => {
    expect(
      analyzeTestSource({
        filePath: "packages/example/src/view.test.tsx",
        source: `
          expect(first).toMatchSnapshot()
          expect(second).toMatchInlineSnapshot()
          expect(third).toMatchSnapshot()
        `,
      }).reviewReasons,
    ).toEqual(["3 snapshot assertions"])
  })

  it("does not treat fixture strings as executable test signals", () => {
    expect(
      analyzeTestSource({
        filePath: "tooling/vitest/example.test.ts",
        source: `
          const fixture = 'vi.mock("./dependency", () => ({}))'
          const snapshotFixture = "expect(view).toMatchSnapshot()"
          expect(result).toBe(true)
        `,
      }),
    ).toMatchObject({
      mockCount: 0,
      snapshotCount: 0,
      reviewReasons: [],
    })
  })

  it("collects tracked test files while excluding generated and dependency directories", async () => {
    const entries = await collectTestInventory(".")

    expect(entries.some((entry) => entry.filePath === "tooling/vitest/testInventory.test.ts")).toBe(
      true,
    )
    expect(entries.some((entry) => entry.filePath.includes("node_modules"))).toBe(false)
  })

  it("summarizes candidates and makes their reasons reviewable", () => {
    expect(
      buildTestInventoryReport([
        {
          filePath: "packages/example/src/controller.test.ts",
          mockCount: 0,
          snapshotCount: 0,
          collaboratorAssertionCount: 1,
          observableAssertionCount: 0,
          reviewReasons: ["only asserts collaborator calls"],
        },
        {
          filePath: "packages/example/src/runtime.test.ts",
          mockCount: 0,
          snapshotCount: 0,
          collaboratorAssertionCount: 0,
          observableAssertionCount: 1,
          reviewReasons: [],
        },
      ]),
    ).toContain("- test files: 2")
    expect(
      buildTestInventoryReport([
        {
          filePath: "packages/example/src/controller.test.ts",
          mockCount: 0,
          snapshotCount: 0,
          collaboratorAssertionCount: 1,
          observableAssertionCount: 0,
          reviewReasons: ["only asserts collaborator calls"],
        },
      ]),
    ).toContain("packages/example/src/controller.test.ts: only asserts collaborator calls")
  })
})
