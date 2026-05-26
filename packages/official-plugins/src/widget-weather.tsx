import { createSignal, onMount } from "solid-js"

type WeatherData = {
  city: string
  temp: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
}

function mockWeather(): WeatherData {
  const conditions = [
    { condition: "晴", icon: "☀" },
    { condition: "多云", icon: "⛅" },
    { condition: "阴", icon: "☁" },
    { condition: "小雨", icon: "🌧" },
    { condition: "晴间多云", icon: "🌤" },
  ]
  const c = conditions[Math.floor(Math.random() * conditions.length)]!
  return {
    city: "北京",
    temp: Math.floor(Math.random() * 15) + 15,
    condition: c.condition,
    icon: c.icon,
    humidity: Math.floor(Math.random() * 40) + 30,
    windSpeed: Math.floor(Math.random() * 20) + 5,
  }
}

export function WeatherCard() {
  const [weather, setWeather] = createSignal<WeatherData>(mockWeather())

  onMount(() => {
    const interval = setInterval(() => setWeather(mockWeather()), 30000)
    return () => clearInterval(interval)
  })

  const w = weather()

  return (
    <div class="weather-widget">
      <div class="weather-main">
        <span class="weather-icon">{w.icon}</span>
        <span class="weather-temp">{w.temp}°C</span>
      </div>
      <div class="weather-detail">
        {w.city} · {w.condition}
      </div>
      <div class="weather-extra">
        湿度 {w.humidity}% · 风速 {w.windSpeed}km/h
      </div>
    </div>
  )
}
