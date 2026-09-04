import { describe, expect, it } from "vitest"

import {
  BUILTIN_PROVIDER_PRESETS,
  builtinModelCapabilitiesFor,
} from "./builtinProviderCapabilities"

describe("built-in provider capability catalogue", () => {
  it("supplies the endpoint shape and explicit capability contract for a built-in model", () => {
    const provider = BUILTIN_PROVIDER_PRESETS.find((preset) => preset.id === "deepseek")
    expect(provider).toMatchObject({ api: "responses" })
    expect(builtinModelCapabilitiesFor(provider!, "deepseek-v4-flash")).toEqual({
      id: "deepseek-v4-flash",
      inputModalities: ["text", "image"],
      reasoning: { effort: true, summary: true, continuation: true },
    })
  })

  it("does not infer capabilities for an unknown model or a custom connection", () => {
    expect(
      builtinModelCapabilitiesFor(
        { id: "openai", baseUrl: "https://gateway.example/v1", api: "responses" },
        "gpt-5-mini",
      ),
    ).toBeUndefined()
    expect(
      builtinModelCapabilitiesFor(
        BUILTIN_PROVIDER_PRESETS.find((preset) => preset.id === "openai")!,
        "future-model",
      ),
    ).toBeUndefined()
  })
})
