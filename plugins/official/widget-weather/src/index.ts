import type { PluginModule } from "@tabora/plugin-api/sdk"
import { createComponent } from "solid-js"
import { WeatherCard } from "./weather-card"
import { WeatherExpand } from "./weather-expand"
import { fetchWeather, formatUpdatedAt, weatherCodeToText } from "./weather-data"
import { officialPluginWeatherManifest } from "./manifest"

export const officialPluginWeather: PluginModule = {
  manifest: officialPluginWeatherManifest,
  activate(context) {
    context.views.register("official.widgets.weather.card", (props) =>
      createComponent(WeatherCard, { ...props, network: context.network }),
    )
    context.views.register("official.widgets.weather.expand", (props) =>
      createComponent(WeatherExpand, { ...props, network: context.network }),
    )
    context.aiTools?.register(
      "official.widgets.weather.query-weather",
      async ({ args, context: toolContext }) => {
        const params = args as { city?: unknown; unit?: unknown }
        const city =
          typeof params.city === "string" && params.city.trim().length > 0 ? params.city : "北京"
        const unit = params.unit === "fahrenheit" ? "fahrenheit" : "celsius"
        const snapshot = await fetchWeather(city, toolContext.network)
        const toUnit = (c: number) => (unit === "fahrenheit" ? Math.round((c * 9) / 5 + 32) : c)
        const label = weatherCodeToText(snapshot.code)
        const forecast = snapshot.days
          .map(
            (d) =>
              `${d.label}：${label} ${toUnit(d.low)}~${toUnit(d.high)}°（降水${d.precipitation}%）`,
          )
          .join("；")
        const aqiText = snapshot.aqi === null ? "无数据" : `${snapshot.aqi}`
        return {
          city: snapshot.city,
          district: snapshot.district,
          unit,
          temperature: toUnit(snapshot.temp),
          feelsLike: toUnit(snapshot.feelsLike),
          humidity: snapshot.humidity,
          windSpeedKmH: snapshot.windSpeed,
          precipitation: snapshot.precipitation,
          aqi: snapshot.aqi,
          weather: label,
          updatedAt: formatUpdatedAt(snapshot.updatedAt),
          summary:
            `${snapshot.city}${snapshot.district ? `（${snapshot.district}）` : ""}${formatUpdatedAt(snapshot.updatedAt)}天气：${label}，` +
            `气温 ${toUnit(snapshot.temp)}°${unit === "fahrenheit" ? "F" : "C"}，体感 ${toUnit(snapshot.feelsLike)}°，湿度 ${snapshot.humidity}%，风速 ${snapshot.windSpeed} km/h，` +
            `降水概率 ${snapshot.precipitation}%，AQI ${aqiText}。未来3天：${forecast}。`,
        }
      },
    )
  },
}
