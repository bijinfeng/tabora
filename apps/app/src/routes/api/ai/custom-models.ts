import { createFileRoute } from "@tanstack/solid-router"

import { customAiModelsResponse } from "../../../server/ai"

export const Route = createFileRoute("/api/ai/custom-models")({
  server: {
    handlers: {
      POST: async ({ request }) => customAiModelsResponse(request),
    },
  },
})
