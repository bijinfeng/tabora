import tailwindcss from "@tailwindcss/vite"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"
import solid from "vite-plugin-solid"

export default defineConfig({
  root: "apps/playground",
  plugins: [solid(), tailwindcss()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.e2e.test.tsx"],
    testTimeout: 45_000,
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
