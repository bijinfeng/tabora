import solid from "vite-plugin-solid"
import type { InlineConfig } from "vite"
import type { StorybookConfig } from "storybook-solidjs-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-themes"],
  framework: {
    name: "storybook-solidjs-vite",
    options: {},
  },
  core: {
    builder: "@storybook/builder-vite",
  },
  viteFinal: async (config: InlineConfig) => {
    return {
      ...config,
      esbuild: {
        jsx: "preserve",
        jsxImportSource: "solid-js",
        ...(config.esbuild ?? {}),
      },
      plugins: [...(config.plugins ?? []), solid()],
      resolve: {
        ...config.resolve,
        conditions: ["solid", ...(config.resolve?.conditions ?? [])],
      },
    }
  },
  staticDirs: [],
}

export default config
