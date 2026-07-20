import { afterEach, describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { WeatherCard } from "./weather-card"
import type { WidgetViewProps } from "@tabora/plugin-api"
import type { WeatherSnapshot } from "./weather-data"

function snapshot(overrides?: Partial<WeatherSnapshot>): WeatherSnapshot {
  return {
    city: "北京",
    district: "海淀区",
    updatedAt: new Date().toISOString(),
    temp: 22,
    feelsLike: 20,
    code: 0,
    humidity: 45,
    windSpeed: 12,
    windDirection: 225,
    precipitation: 5,
    aqi: 38,
    hours: [
      { time: "17:00", temp: 22, code: 0, precipitation: 5 },
      { time: "18:00", temp: 21, code: 1, precipitation: 5 },
      { time: "19:00", temp: 19, code: 2, precipitation: 3 },
    ],
    days: [{ label: "今天", high: 24, low: 17, code: 0, precipitation: 10 }],
    ...overrides,
  }
}

function makeProps(overrides?: Partial<WidgetViewProps>): WidgetViewProps {
  return {
    instanceId: "weather-1",
    pluginId: "official.widgets.weather",
    contributionId: "weather",
    size: "M",
    supportedSizes: ["S", "M"],
    config: { city: "北京", unit: "celsius" },
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    host: {
      updateConfig: vi.fn().mockResolvedValue(undefined),
      removeInstance: vi.fn().mockResolvedValue(undefined),
      requestResize: vi.fn().mockResolvedValue(undefined),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(true),
    },
    ...overrides,
  }
}

async function flush() {
  for (let i = 0; i < 6; i++) await Promise.resolve()
}

describe("WeatherCard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders live weather from the cached snapshot", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(snapshot())
    // 让网络请求挂起，只验证缓存渲染
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    )

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <WeatherCard {...props} />, root)
    await flush()

    expect(root.querySelector("[data-weather-card]")).toBeTruthy()
    expect(root.querySelector(".weather-widget")).toBeNull()
    expect(root.textContent).toContain("22°")
    expect(root.textContent).toContain("北京")
    expect(root.textContent).toContain("晴朗")
    expect(root.querySelector("[data-weather-now]")).toBeTruthy()
    expect(root.querySelector("[data-weather-metrics]")).toBeTruthy()
    expect(root.querySelector("[data-weather-hours]")).toBeTruthy()
    root.remove()
  })

  it("shows humidity and AQI metrics", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      snapshot({ humidity: 63, aqi: 80 }),
    )
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    )

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <WeatherCard {...props} />, root)
    await flush()

    expect(root.textContent).toContain("63%")
    expect(root.textContent).toContain("80")
    expect(root.textContent).toContain("空气良")
    root.remove()
  })

  it("falls back to an error state with retry when no data is available", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    )

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <WeatherCard {...props} />, root)
    await flush()
    await flush()

    expect(root.querySelector("[data-weather-error]")).toBeTruthy()
    expect(root.textContent).toContain("重试")
    root.remove()
  })
})
