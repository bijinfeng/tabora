import type { PluginManifest } from "@tabora/plugin-api"

export const officialPluginWeatherManifest: PluginManifest = {
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
        supportedSizes: ["S", "M", "L", "XL"],
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
}
