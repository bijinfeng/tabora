import type { PluginModule } from "@tabora/plugin-api/sdk"
import { createComponent } from "solid-js"
import { WeatherCard } from "./weather-card"
import { WeatherExpand } from "./weather-expand"
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
  },
}
