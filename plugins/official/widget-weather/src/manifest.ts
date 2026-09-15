import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const officialPluginWeatherManifest: PluginManifest = {
  id: "official.widgets.weather",
  name: "Weather Widget",
  version: "1.0.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  requiredCapabilities: ["network"],
  permissions: [
    {
      type: "network",
      hosts: [
        "geocoding-api.open-meteo.com",
        "api.open-meteo.com",
        "air-quality-api.open-meteo.com",
      ],
    },
    { type: "ai", access: ["tools"] },
  ],
  contributes: {
    widgets: [
      {
        id: "weather",
        title: "天气",
        icon: "weather",
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
    aiTools: [
      {
        id: "official.widgets.weather.query-weather",
        name: "查询天气",
        description: "按城市名和单位查询当前温度、体感、湿度、风速与天气描述",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称，支持中英文" },
            unit: {
              type: "string",
              description: "温度单位：celsius（摄氏度）或 fahrenheit（华氏度）",
              enum: ["celsius", "fahrenheit"],
            },
          },
          required: ["city"],
          additionalProperties: false,
        },
        requiresNetwork: true,
      },
    ],
  },
}
