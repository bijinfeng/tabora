import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { WeatherCard } from "./weather-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(overrides?: Partial<WidgetViewProps>): WidgetViewProps {
  return {
    instanceId: "weather-1",
    pluginId: "official.widgets.weather",
    contributionId: "weather",
    config: { city: "北京", unit: "celsius", refreshIntervalMs: 60000 },
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  } as WidgetViewProps
}

describe("WeatherCard", () => {
  it("renders with city name", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <WeatherCard {...makeProps()} />, root)
    expect(root.textContent).toContain("北京")
    expect(root.querySelector(".weather-display")).toBeTruthy()
    root.remove()
  })

  it("renders temperature and humidity", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <WeatherCard {...makeProps()} />, root)
    const text = root.textContent ?? ""
    expect(text).toMatch(/湿度/)
    expect(text).toMatch(/风速/)
    root.remove()
  })
})
