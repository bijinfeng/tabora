import { playwright } from "@vitest/browser-playwright"
import solid from "vite-plugin-solid"

import { createTaboraStylexVitePlugin, taboraStylexWorkspaceRoot } from "@tabora/stylex-config"
import { defineBrowserE2eConfig } from "./tooling/vitest/e2e"

export default defineBrowserE2eConfig({
  root: "apps/playground",
  plugins: [
    createTaboraStylexVitePlugin({
      rootDir: taboraStylexWorkspaceRoot,
      dev: false,
      devMode: "css-only",
    }),
    solid(),
  ],
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: {
          channel: "chrome",
        },
      }),
      instances: [
        {
          browser: "chromium",
          viewport: {
            height: 900,
            width: 1280,
          },
        },
      ],
    },
  },
})
