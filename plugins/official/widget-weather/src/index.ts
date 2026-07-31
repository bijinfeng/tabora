import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { WeatherCard } from "./weather-card"
import { WeatherExpand } from "./weather-expand"
import { officialPluginWeatherManifest } from "./manifest"

export const officialPluginWeather: BuiltinPlugin = {
  enabled: true,
  manifest: officialPluginWeatherManifest,
  activate(context) {
    context.registry.views.register("official.widgets.weather.card", WeatherCard)
    context.registry.views.register("official.widgets.weather.expand", WeatherExpand)
  },
}
