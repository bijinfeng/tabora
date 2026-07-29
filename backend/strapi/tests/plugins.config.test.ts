import { describe, expect, it } from "vitest"
import type { Core } from "@strapi/strapi"
import pluginsConfig from "../config/plugins"

type Env = Core.Config.Shared.ConfigParams["env"]

const createEnv = (values: Record<string, string> = {}) => {
  const env = ((key: string, fallback?: string) => values[key] ?? fallback ?? "") as unknown as Env

  env.int = (key, fallback) => Number(values[key] ?? fallback)

  return env
}

describe("plugin configuration", () => {
  it("routes development email through Mailpit", () => {
    const config = pluginsConfig({
      env: createEnv({ NODE_ENV: "development" }),
    })

    expect(config.email).toEqual({
      config: {
        provider: "sendmail",
        providerOptions: {
          devHost: "127.0.0.1",
          devPort: 1025,
        },
        settings: {
          defaultFrom: "no-reply@tabora.local",
          defaultReplyTo: "support@tabora.local",
        },
      },
    })
  })

  it("does not enable the development SMTP route in production", () => {
    const config = pluginsConfig({
      env: createEnv({ NODE_ENV: "production" }),
    })

    expect(config.email).toEqual({
      config: {
        provider: "sendmail",
        providerOptions: {},
        settings: {
          defaultFrom: "no-reply@tabora.local",
          defaultReplyTo: "support@tabora.local",
        },
      },
    })
  })
})
