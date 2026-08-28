import { createFileRoute } from "@tanstack/solid-router"

import { cloudAiGenerateResponse } from "../../../server/ai"
import { getRuntime } from "../../../server/runtime"

export const Route = createFileRoute("/api/ai/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return cloudAiGenerateResponse(await getRuntime(), request)
      },
    },
  },
})
