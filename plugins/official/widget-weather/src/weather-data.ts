// Open-Meteo 数据接入与格式化。所有函数保持纯粹或仅依赖 fetch，便于单测 mock。
// 三个免 key、支持 CORS 的公开端点：
//  - geocoding：城市名 → 经纬度/时区/行政区
//  - forecast：当前 + 逐小时 + 逐日
//  - air-quality：US AQI

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search"
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
const AIR_QUALITY_ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality"

export const DEFAULT_CITY = "北京"

export type WeatherHour = {
  time: string // HH:mm
  temp: number
  code: number
  precipitation: number // 降水概率 %
}

export type WeatherDay = {
  label: string // 今天/明天/后天
  high: number
  low: number
  code: number
  precipitation: number
}

export type WeatherSnapshot = {
  city: string
  district: string
  updatedAt: string // ISO
  temp: number
  feelsLike: number
  code: number
  humidity: number
  windSpeed: number // km/h
  windDirection: number // 角度
  precipitation: number // 当前小时降水概率
  aqi: number | null
  hours: WeatherHour[]
  days: WeatherDay[]
}

export type GeoLocation = {
  name: string
  admin: string
  latitude: number
  longitude: number
  timezone: string
}

// WMO weather code → 中文描述
const WEATHER_CODE_TEXT: Record<number, string> = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  56: "冻毛毛雨",
  57: "强冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨",
  85: "阵雪",
  86: "强阵雪",
  95: "雷阵雨",
  96: "雷阵雨伴冰雹",
  99: "强雷阵雨伴冰雹",
}

// WMO weather code → lucide 图标名（在组件里映射为具体 icon 组件）
const WEATHER_CODE_ICON: Record<number, string> = {
  0: "sun",
  1: "sun",
  2: "cloud-sun",
  3: "cloud",
  45: "cloud-fog",
  48: "cloud-fog",
  51: "cloud-drizzle",
  53: "cloud-drizzle",
  55: "cloud-drizzle",
  56: "cloud-drizzle",
  57: "cloud-drizzle",
  61: "cloud-rain",
  63: "cloud-rain",
  65: "cloud-rain",
  66: "cloud-rain",
  67: "cloud-rain",
  71: "cloud-snow",
  73: "cloud-snow",
  75: "cloud-snow",
  77: "cloud-snow",
  80: "cloud-rain",
  81: "cloud-rain",
  82: "cloud-rain",
  85: "cloud-snow",
  86: "cloud-snow",
  95: "cloud-lightning",
  96: "cloud-lightning",
  99: "cloud-lightning",
}

export function weatherCodeToText(code: number): string {
  return WEATHER_CODE_TEXT[code] ?? "未知"
}

export function weatherCodeToIcon(code: number): string {
  return WEATHER_CODE_ICON[code] ?? "cloud"
}

export function windDirectionLabel(degree: number): string {
  const dirs = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"]
  const index = Math.round((degree % 360) / 45) % 8
  return dirs[index] ?? "微风"
}

// US AQI 数值 → 中文等级
export function aqiLabel(aqi: number | null): string {
  if (aqi === null) return "—"
  if (aqi <= 50) return "空气优"
  if (aqi <= 100) return "空气良"
  if (aqi <= 150) return "轻度污染"
  if (aqi <= 200) return "中度污染"
  if (aqi <= 300) return "重度污染"
  return "严重污染"
}

function dayLabel(index: number): string {
  return index === 0 ? "今天" : index === 1 ? "明天" : index === 2 ? "后天" : `第 ${index + 1} 天`
}

function toHourLabel(iso: string): string {
  const timePart = iso.split("T")[1] ?? "00:00"
  return timePart.slice(0, 5)
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, signal ? { signal } : undefined)
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }
  return (await response.json()) as T
}

type GeocodingResponse = {
  results?: Array<{
    name: string
    admin1?: string
    admin2?: string
    latitude: number
    longitude: number
    timezone: string
  }>
}

export async function geocodeCity(city: string, signal?: AbortSignal): Promise<GeoLocation> {
  const url = `${GEOCODING_ENDPOINT}?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`
  const data = await fetchJson<GeocodingResponse>(url, signal)
  const first = data.results?.[0]
  if (!first) {
    throw new Error(`未找到城市「${city}」`)
  }
  return {
    name: first.name,
    admin: first.admin2 ?? first.admin1 ?? "",
    latitude: first.latitude,
    longitude: first.longitude,
    timezone: first.timezone,
  }
}

type ForecastResponse = {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
    precipitation_probability?: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
}

type AirQualityResponse = {
  current?: { us_aqi?: number }
}

// 从逐小时数组里挑出「当前时刻起未来 N 小时」
function pickUpcomingHours(hourly: ForecastResponse["hourly"], count: number): WeatherHour[] {
  const now = Date.now()
  const entries = hourly.time.map((time, index) => ({
    ts: new Date(time).getTime(),
    hour: {
      time: toHourLabel(time),
      temp: Math.round(hourly.temperature_2m[index] ?? 0),
      code: hourly.weather_code[index] ?? 0,
      precipitation: Math.round(hourly.precipitation_probability[index] ?? 0),
    } satisfies WeatherHour,
  }))

  const upcoming = entries.filter((entry) => entry.ts >= now - 60 * 60 * 1000)
  const source = upcoming.length >= count ? upcoming : entries
  return source.slice(0, count).map((entry) => entry.hour)
}

export async function fetchWeather(city: string, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const location = await geocodeCity(city, signal)

  const forecastUrl =
    `${FORECAST_ENDPOINT}?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=3&timezone=auto`
  const airUrl =
    `${AIR_QUALITY_ENDPOINT}?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=us_aqi&timezone=auto`

  const [forecast, air] = await Promise.all([
    fetchJson<ForecastResponse>(forecastUrl, signal),
    // AQI 是增强信息，失败不应阻断主天气
    fetchJson<AirQualityResponse>(airUrl, signal).catch(() => ({}) as AirQualityResponse),
  ])

  const days: WeatherDay[] = forecast.daily.time.slice(0, 3).map((_, index) => ({
    label: dayLabel(index),
    high: Math.round(forecast.daily.temperature_2m_max[index] ?? 0),
    low: Math.round(forecast.daily.temperature_2m_min[index] ?? 0),
    code: forecast.daily.weather_code[index] ?? 0,
    precipitation: Math.round(forecast.daily.precipitation_probability_max[index] ?? 0),
  }))

  return {
    city: location.name,
    district: location.admin,
    updatedAt: new Date().toISOString(),
    temp: Math.round(forecast.current.temperature_2m),
    feelsLike: Math.round(forecast.current.apparent_temperature),
    code: forecast.current.weather_code,
    humidity: Math.round(forecast.current.relative_humidity_2m),
    windSpeed: Math.round(forecast.current.wind_speed_10m),
    windDirection: forecast.current.wind_direction_10m,
    precipitation: Math.round(forecast.current.precipitation_probability ?? 0),
    aqi: typeof air.current?.us_aqi === "number" ? Math.round(air.current.us_aqi) : null,
    hours: pickUpcomingHours(forecast.hourly, 5),
    days,
  }
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  const hh = `${date.getHours()}`.padStart(2, "0")
  const mm = `${date.getMinutes()}`.padStart(2, "0")
  return `今天 ${hh}:${mm}`
}
