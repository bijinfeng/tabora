import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { WeatherCard } from "./weather-card"

export const officialPluginWeather: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.weather",
    name: "Weather Widget",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "weather",
          title: "天气",
          icon: "sun",
          description: "查看本地天气",
          supportedSizes: ["S", "M"],
          defaultSize: "S",
          allowMultipleInstances: true,
          views: { card: "official.widgets.weather.card" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.weather.card", WeatherCard)
  },
}
