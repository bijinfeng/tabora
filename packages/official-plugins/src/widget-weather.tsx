import { createSignal, onCleanup, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Badge, CardSection } from "@tabora/ui"

type WeatherData = {
  city: string
  temp: number
  condition: string
  humidity: number
  windSpeed: number
}

type WeatherProviderConfig = {
  city: string
  unit: "celsius" | "fahrenheit"
  refreshIntervalMs: number
  mode: "demo" | "live"
}

const conditionIcons: Record<string, string> = {
  晴: "☀",
  多云: "⛅",
  阴: "☁",
  小雨: "🌧",
  晴间多云: "🌤",
}

function getConfig(config: Record<string, unknown>): WeatherProviderConfig {
  return {
    city: typeof config.city === "string" ? config.city : "北京",
    unit: config.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    refreshIntervalMs:
      typeof config.refreshIntervalMs === "number" ? config.refreshIntervalMs : 60000,
    mode: "demo",
  }
}

function mockWeather(city: string): WeatherData {
  const conditions = ["晴", "多云", "阴", "小雨", "晴间多云"] as const
  const condition = conditions[Math.floor(Math.random() * conditions.length)]!
  return {
    city,
    temp: Math.floor(Math.random() * 15) + 15,
    condition,
    humidity: Math.floor(Math.random() * 40) + 30,
    windSpeed: Math.floor(Math.random() * 20) + 5,
  }
}

export function WeatherCard(props: WidgetViewProps) {
  const config = () => getConfig(props.config)
  const [weather, setWeather] = createSignal<WeatherData>(mockWeather(config().city))
  const [error, setError] = createSignal<string | null>(null)

  onMount(() => {
    const interval = setInterval(() => {
      try {
        setWeather(mockWeather(config().city))
        setError(null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "天气数据获取失败")
      }
    }, config().refreshIntervalMs)
    onCleanup(() => clearInterval(interval))
  })

  const w = weather()
  const unitLabel = () => (config().unit === "fahrenheit" ? "°F" : "°C")

  return (
    <div class="weather-widget">
      <CardSection
        title={w.city}
        trailing={
          <div class="weather-badges">
            <Badge variant="warning">demo</Badge>
            {error() ? <Badge variant="danger">错误</Badge> : null}
          </div>
        }
      >
        <div class="weather-main">
          <span class="weather-icon">{conditionIcons[w.condition] ?? ""}</span>
          <span class="weather-temp">
            {w.temp}
            {unitLabel()}
          </span>
        </div>
        <div class="weather-detail">
          {w.condition}
          {error() ? <span class="weather-error"> · {error()}</span> : null}
        </div>
        <div class="weather-extra">
          湿度 {w.humidity}% · 风速 {w.windSpeed}km/h
        </div>
      </CardSection>
    </div>
  )
}
