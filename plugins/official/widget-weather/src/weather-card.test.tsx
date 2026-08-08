import { afterEach, describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { WeatherCard } from "./weather-card"
import type { PluginNetworkAccess, WidgetViewProps } from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
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
      { time: "20:00", temp: 18, code: 3, precipitation: 3 },
      { time: "21:00", temp: 17, code: 61, precipitation: 10 },
      { time: "22:00", temp: 16, code: 61, precipitation: 20 },
    ],
    days: [
      { label: "今天", high: 24, low: 17, code: 0, precipitation: 10 },
      { label: "明天", high: 26, low: 18, code: 2, precipitation: 20 },
      { label: "后天", high: 25, low: 19, code: 61, precipitation: 40 },
    ],
    ...overrides,
  }
}

type WeatherViewProps = WidgetViewProps & { network: PluginNetworkAccess }

function makeProps(overrides?: Partial<WeatherViewProps>): WeatherViewProps {
  return {
    ...makeWidgetViewProps({
      instanceId: "weather-1",
      pluginId: "official.widgets.weather",
      contributionId: "weather",
      size: "M",
      supportedSizes: ["S", "M", "L", "XL"],
      config: { city: "北京", unit: "celsius" },
    }),
    network: {
      canFetch: () => true,
      fetch: (url, init) => fetch(url, init),
    },
    ...overrides,
  }
}

async function flush() {
  for (let i = 0; i < 6; i++) await Promise.resolve()
}

// 用缓存快照渲染指定尺寸的卡片，网络请求保持挂起
async function mount(
  overrides?: Partial<WeatherViewProps>,
  snapshotOverrides?: Partial<WeatherSnapshot>,
) {
  const props = makeProps(overrides)
  ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(snapshot(snapshotOverrides))
  props.network.fetch = vi.fn(() => new Promise<Response>(() => {}))
  const root = document.createElement("div")
  document.body.appendChild(root)
  render(() => <WeatherCard {...props} />, root)
  await flush()
  return root
}

describe("WeatherCard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders live weather from the cached snapshot", async () => {
    // 缓存渲染路径：网络请求保持挂起
    const root = await mount()

    expect(root.querySelector("[data-weather-card]")).toBeTruthy()
    expect(root.querySelector(".weather-widget")).toBeNull()
    expect(root.textContent).toContain("22°")
    expect(root.textContent).toContain("北京")
    expect(root.textContent).toContain("晴朗")
    expect(root.querySelector("[data-weather-now]")).toBeTruthy()
    expect(root.querySelector("[data-weather-hours]")).toBeTruthy()
    root.remove()
  })

  it("shows humidity and AQI metrics at size L", async () => {
    // 湿度与空气质量在 L 的四项指标面板中展示
    const root = await mount({ size: "L" }, { humidity: 63, aqi: 80 })

    const metrics = [...root.querySelectorAll("[data-weather-metrics] > div")].map((cell) =>
      [...cell.children].map((node) => node.textContent),
    )
    expect(metrics).toContainEqual(["湿度", "63%"])
    // 列头已是「空气」，值里不再重复前缀
    expect(metrics).toContainEqual(["空气", "良 80"])
    // 实况徽标保留完整等级，且不带数值
    expect(root.querySelector("[data-weather-now] [data-weather-air]")?.textContent).toBe("空气良")
    root.remove()
  })

  it("renders the compact size-specific weather composition", async () => {
    const root = await mount({ size: "S" })

    expect(root.querySelector("[data-weather-variant='S']")).toBeTruthy()
    // S 只保留城市 / 温度 / 状态 / 温度区间，不渲染小时与指标
    expect(root.querySelector("[data-weather-hours]")).toBeNull()
    expect(root.querySelector("[data-weather-metrics]")).toBeNull()
    expect(root.querySelector("[data-weather-daily]")).toBeNull()
    expect(root.textContent).toContain("天气")
    expect(root.textContent).toContain("北京")
    expect(root.textContent).toContain("22°")
    expect(root.textContent).toContain("晴朗")
    expect(root.textContent).toContain("17—24°")
    root.remove()
  })

  it("renders the medium composition with three hourly columns", async () => {
    const root = await mount({ size: "M" })

    expect(root.querySelector("[data-weather-variant='M']")).toBeTruthy()
    expect(root.querySelector("[data-weather-now]")).toBeTruthy()
    expect(root.querySelectorAll("[data-weather-hours] > div")).toHaveLength(3)
    // M 不展示四项指标面板与未来三天
    expect(root.querySelector("[data-weather-metrics]")).toBeNull()
    expect(root.querySelector("[data-weather-daily]")).toBeNull()
    root.remove()
  })

  it("labels the first hourly column 现在 and the rest as H时", async () => {
    const root = await mount({ size: "L" })

    const labels = [...root.querySelectorAll("[data-weather-hours] > div")].map(
      (cell) => cell.firstElementChild?.textContent,
    )
    expect(labels).toEqual(["现在", "18时", "19时", "20时", "21时"])
    root.remove()
  })

  it("drops the district where the column is too narrow for it", async () => {
    // M 的实况列与 XL 左栏放不下「城市 · 区」，只保留城市名
    for (const size of ["M", "XL"] as const) {
      const root = await mount({ size })
      expect(root.querySelector("[data-weather-now] span")?.textContent).toBe("北京")
      root.remove()
    }
    for (const size of ["S", "L"] as const) {
      const root = await mount({ size })
      expect(root.textContent).toContain(size === "S" ? "北京" : "北京 · 海淀区")
      root.remove()
    }
  })

  it("renders the large composition with metric grid and five hourly columns", async () => {
    const root = await mount({ size: "L" })

    expect(root.querySelector("[data-weather-variant='L']")).toBeTruthy()
    expect(root.querySelectorAll("[data-weather-hours] > div")).toHaveLength(5)
    expect(root.querySelector("[data-weather-metrics]")).toBeTruthy()
    expect(root.textContent).toContain("体感")
    expect(root.textContent).toContain("湿度")
    expect(root.textContent).toContain("风速")
    expect(root.textContent).toContain("空气")
    // hero 右侧展示当天温度区间
    expect(root.textContent).toContain("17—24°")
    expect(root.querySelector("[data-weather-daily]")).toBeNull()
    root.remove()
  })

  it("renders the extra large composition with hourly panel and three day forecast", async () => {
    const root = await mount({ size: "XL" })

    expect(root.querySelector("[data-weather-variant='XL']")).toBeTruthy()
    expect(root.querySelectorAll("[data-weather-hours] > div")).toHaveLength(6)
    expect(root.textContent).toContain("逐小时预报")
    expect(root.textContent).toContain("未来 6 小时")

    const daily = root.querySelector("[data-weather-daily]")
    expect(daily).toBeTruthy()
    expect(root.textContent).toContain("未来三天")
    expect(daily!.textContent).toContain("今天")
    expect(daily!.textContent).toContain("明天")
    expect(daily!.textContent).toContain("后天")
    root.remove()
  })

  it("falls back to an error state with retry when no data is available", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    props.network.fetch = vi.fn(async () => new Response("boom", { status: 500 }))

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
