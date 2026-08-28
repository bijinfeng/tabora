import { createFileRoute } from "@tanstack/solid-router"

import { cloudAiStreamResponse } from "../../../server/ai"
import { getRuntime } from "../../../server/runtime"

export const Route = createFileRoute("/api/ai/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return cloudAiStreamResponse(await getRuntime(), request)
      },
    },
  },
})
