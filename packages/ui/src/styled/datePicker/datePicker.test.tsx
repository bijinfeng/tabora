import { describe, expect, it } from "vitest"
import { createSignal } from "solid-js"
import { render } from "solid-js/web"
import { DatePicker } from "./datePicker.styled"

describe("DatePicker", () => {
  it("exposes the selected date as an active calendar cell", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <DatePicker year={2026} month={7} value="2026-08-11" today="2026-08-28" />, root)

    expect(
      root.querySelector("button[aria-label='2026年8月11日']")?.getAttribute("aria-pressed"),
    ).toBe("true")
    expect(
      root.querySelector("button[aria-label='2026年8月12日']")?.getAttribute("aria-pressed"),
    ).toBe("false")
    root.remove()
  })

  it("updates the active cell when the controlled value changes", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const [value, setValue] = createSignal("2026-08-11")
    render(() => <DatePicker year={2026} month={7} value={value()} today="2026-08-28" />, root)

    setValue("2026-08-14")

    expect(
      root.querySelector("button[aria-label='2026年8月11日']")?.getAttribute("aria-pressed"),
    ).toBe("false")
    expect(
      root.querySelector("button[aria-label='2026年8月14日']")?.getAttribute("aria-pressed"),
    ).toBe("true")
    root.remove()
  })

  it("adds a marker when marked dates load after the calendar", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const [markedDates, setMarkedDates] = createSignal<string[]>([])
    render(
      () => <DatePicker year={2026} month={7} markedDates={markedDates()} today="2026-08-28" />,
      root,
    )

    const day = root.querySelector("button[aria-label='2026年8月11日']") as HTMLButtonElement
    const initialClassName = day.className
    setMarkedDates(["2026-08-11"])

    expect(day.className).not.toBe(initialClassName)
    root.remove()
  })
})
