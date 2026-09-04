import { createFileRoute } from "@tanstack/solid-router"

import { cloudAiModelsResponse } from "../../../server/ai"
import { getRuntime } from "../../../server/runtime"

/** Platform-paid models are visible only to a signed-in Tabora user. */
export const Route = createFileRoute("/api/ai/models")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return cloudAiModelsResponse(await getRuntime(), request)
      },
    },
  },
})
