import { afterEach, describe, expect, it, vi } from "vitest"
import {
  aqiLabel,
  fetchWeather,
  weatherCodeToIcon,
  weatherCodeToText,
  windDirectionLabel,
} from "./weather-data"

describe("weather-data mappings", () => {
  it("maps WMO codes to Chinese text", () => {
    expect(weatherCodeToText(0)).toBe("晴朗")
    expect(weatherCodeToText(61)).toBe("小雨")
    expect(weatherCodeToText(95)).toBe("雷阵雨")
    expect(weatherCodeToText(999)).toBe("未知")
  })

  it("maps WMO codes to lucide icon names", () => {
    expect(weatherCodeToIcon(0)).toBe("sun")
    expect(weatherCodeToIcon(2)).toBe("cloud-sun")
    expect(weatherCodeToIcon(65)).toBe("cloud-rain")
    expect(weatherCodeToIcon(999)).toBe("cloud")
  })

  it("labels wind direction by degree", () => {
    expect(windDirectionLabel(0)).toBe("北风")
    expect(windDirectionLabel(90)).toBe("东风")
    expect(windDirectionLabel(225)).toBe("西南风")
  })

  it("labels AQI by US AQI thresholds", () => {
    expect(aqiLabel(null)).toBe("—")
    expect(aqiLabel(30)).toBe("空气优")
    expect(aqiLabel(80)).toBe("空气良")
    expect(aqiLabel(120)).toBe("轻度污染")
    expect(aqiLabel(180)).toBe("中度污染")
    expect(aqiLabel(320)).toBe("严重污染")
  })
})

describe("fetchWeather", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("assembles a snapshot from geocoding + forecast + air-quality", async () => {
    const now = new Date()
    const hourIso = (offset: number) => {
      const d = new Date(now.getTime() + offset * 3600 * 1000)
      return `${d.toISOString().slice(0, 13)}:00`
    }

    const fetchMock = vi.fn(async (input: string) => {
      if (input.includes("geocoding-api")) {
        return jsonResponse({
          results: [
            {
              name: "北京",
              admin1: "北京市",
              admin2: "海淀区",
              latitude: 39.9,
              longitude: 116.4,
              timezone: "Asia/Shanghai",
            },
          ],
        })
      }
      if (input.includes("air-quality")) {
        return jsonResponse({ current: { us_aqi: 42 } })
      }
      // forecast
      return jsonResponse({
        current: {
          time: hourIso(0),
          temperature_2m: 21.6,
          apparent_temperature: 20.1,
          relative_humidity_2m: 45,
          weather_code: 0,
          wind_speed_10m: 12.3,
          wind_direction_10m: 225,
          precipitation_probability: 5,
        },
        hourly: {
          time: [hourIso(0), hourIso(1), hourIso(2), hourIso(3), hourIso(4), hourIso(5)],
          temperature_2m: [22, 21, 19, 18, 17, 16],
          weather_code: [0, 1, 2, 3, 61, 61],
          precipitation_probability: [5, 5, 3, 3, 10, 20],
        },
        daily: {
          time: ["2026-07-01", "2026-07-02", "2026-07-03"],
          weather_code: [0, 2, 61],
          temperature_2m_max: [24, 26, 25],
          temperature_2m_min: [17, 18, 19],
          precipitation_probability_max: [10, 20, 40],
        },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const snapshot = await fetchWeather("北京")

    expect(snapshot.city).toBe("北京")
    expect(snapshot.district).toBe("海淀区")
    expect(snapshot.temp).toBe(22)
    expect(snapshot.feelsLike).toBe(20)
    expect(snapshot.humidity).toBe(45)
    expect(snapshot.windSpeed).toBe(12)
    expect(snapshot.aqi).toBe(42)
    expect(snapshot.hours).toHaveLength(5)
    expect(snapshot.days).toHaveLength(3)
    expect(snapshot.days[0]).toMatchObject({ label: "今天", high: 24, low: 17 })
  })

  it("still resolves weather when air-quality request fails", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input.includes("geocoding-api")) {
        return jsonResponse({
          results: [{ name: "上海", latitude: 31.2, longitude: 121.4, timezone: "Asia/Shanghai" }],
        })
      }
      if (input.includes("air-quality")) {
        return new Response("error", { status: 500 })
      }
      return jsonResponse({
        current: {
          time: "2026-07-01T12:00",
          temperature_2m: 27,
          apparent_temperature: 29,
          relative_humidity_2m: 72,
          weather_code: 2,
          wind_speed_10m: 9,
          wind_direction_10m: 135,
          precipitation_probability: 18,
        },
        hourly: {
          time: ["2026-07-01T12:00"],
          temperature_2m: [27],
          weather_code: [2],
          precipitation_probability: [18],
        },
        daily: {
          time: ["2026-07-01"],
          weather_code: [2],
          temperature_2m_max: [29],
          temperature_2m_min: [24],
          precipitation_probability_max: [18],
        },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const snapshot = await fetchWeather("上海")
    expect(snapshot.city).toBe("上海")
    expect(snapshot.aqi).toBeNull()
  })

  it("throws a helpful error when the city is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ results: [] })),
    )
    await expect(fetchWeather("不存在城")).rejects.toThrow(/未找到城市/)
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
