import solid from "vite-plugin-solid"
import type { InlineConfig } from "vite"

const config = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "storybook-solidjs",
    options: {},
  },
  core: {
    builder: "@storybook/builder-vite",
  },
  viteFinal: async (config: InlineConfig) => {
    return {
      ...config,
      plugins: [...(config.plugins ?? []), solid()],
      resolve: {
        ...config.resolve,
        conditions: ["solid", ...(config.resolve?.conditions ?? [])],
      },
    }
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: [],
}

export default config
