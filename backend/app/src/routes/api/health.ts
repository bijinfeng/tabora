import { createFileRoute } from "@tanstack/solid-router"

import { json } from "../../server/http"

/** 健康检查：公开端点。保留对外 HTTP 契约。 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () => json({ status: "ok" }),
    },
  },
})
