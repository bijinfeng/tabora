import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { WeatherCard } from "./weather-card"
import { WeatherExpand } from "./weather-expand"

export const officialPluginWeather: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.weather",
    name: "Weather Widget",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "network", hosts: ["open-meteo.com"] }],
    contributes: {
      widgets: [
        {
          id: "weather",
          title: "天气",
          icon: "sun",
          description: "查看本地天气与预报",
          supportedSizes: ["S", "M"],
          defaultSize: "S",
          allowMultipleInstances: true,
          defaultConfig: { city: "北京", unit: "celsius" },
          views: {
            card: "official.widgets.weather.card",
            expand: "official.widgets.weather.expand",
          },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.weather.card", WeatherCard)
    context.registry.views.register("official.widgets.weather.expand", WeatherExpand)
  },
}
