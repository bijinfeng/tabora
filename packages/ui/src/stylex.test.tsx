import * as stylex from "@stylexjs/stylex"
import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"

const styles = stylex.create({
  root: {
    display: "flex",
  },
  active: {
    color: "rgb(var(--tbr-color-accent))",
  },
  width: (value: number) => ({
    width: value,
  }),
})

describe("Solid StyleX authoring", () => {
  it("spreads class and serialized inline style onto a Solid host element", () => {
    const root = document.createElement("div")

    render(() => <div {...stylex.attrs(styles.root, styles.active, styles.width(120))} />, root)

    const host = root.firstElementChild as HTMLElement
    expect(host.className.length).toBeGreaterThan(0)
    expect(host.getAttribute("style")).toMatch(/120(?:px)?/)
    expect("className" in stylex.attrs(styles.root)).toBe(false)
  })
})
