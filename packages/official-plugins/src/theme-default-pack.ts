import type { BuiltinPlugin } from "@tabora/platform-kernel"

export const officialThemeDefaultPack: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.theme.default-pack",
    name: "Tabora Default Theme Pack",
    version: "0.0.0",
    entry: "./theme-default-pack",
    engine: { platform: "^0.1.0" },
    contributes: {
      themes: [
        {
          id: "official.theme.light",
          title: "明亮工作台",
          tokens: {
            "color-page": "237 241 238",
            "color-surface": "255 255 255",
            "color-text": "31 35 32",
            "color-muted": "102 112 105",
            "color-accent": "35 113 89",
            "color-line": "210 218 213",
            "radius-card": "16px",
          },
        },
      ],
    },
  },
  activate() {},
}
