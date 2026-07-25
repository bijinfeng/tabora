import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"
import { TaboraMark } from "./TaboraMark"

describe("TaboraMark", () => {
  it("renders the canonical app-icon asset", () => {
    const host = document.createElement("div")
    const dispose = render(() => <TaboraMark />, host)

    const mark = host.querySelector("img")
    expect(mark).toBeTruthy()
    const source = decodeURIComponent(mark?.getAttribute("src") ?? "")
    expect(source).toMatch(/viewBox=['"]0 0 628 628['"]/)
    expect(source).toMatch(/rx=['"]152['"] fill=['"]#1c1e1c['"]/)
    expect(source).toMatch(/x=['"]362['"] y=['"]362['"] width=['"]142['"] height=['"]142['"]/)
    expect(mark?.getAttribute("aria-hidden")).toBe("true")

    dispose()
  })
})
