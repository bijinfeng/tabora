import type { WidgetViewProps } from "@tabora/plugin-api"

type WeatherData = {
  city: string
  temp: number
  condition: string
  humidity: number
  windSpeed: number
}

function getConfig(config: Record<string, unknown>) {
  return {
    city: typeof config.city === "string" ? config.city : "北京",
    unit: config.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    mode: "demo",
  }
}

function demoWeather(city: string): WeatherData {
  return {
    city,
    temp: 22,
    condition: "晴朗",
    humidity: 45,
    windSpeed: 12,
  }
}

export function WeatherCard(props: WidgetViewProps) {
  const config = () => getConfig(props.config)
  const w = () => demoWeather(config().city)
  const unitLabel = () => (config().unit === "fahrenheit" ? "°F" : "°C")
  return (
    <div class="weather-widget">
      <div class="weather-display">
        <span class="weather-temp">
          {w().temp}
          {unitLabel()}
        </span>
        <span class="weather-desc">
          {w().condition} · {w().city}
        </span>
      </div>
    </div>
  )
}
