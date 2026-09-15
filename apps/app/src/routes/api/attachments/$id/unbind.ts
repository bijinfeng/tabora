import { createFileRoute } from "@tanstack/solid-router"

import { getSessionUserId, json } from "../../../../server/http"
import { getRuntime } from "../../../../server/runtime"
import { unbindAttachment } from "../../../../server/attachmentRoutes"

/** 解绑附件，登录用户可用。 */
export const Route = createFileRoute("/api/attachments/$id/unbind")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { auth, handle } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { message: "未登录" } }, 401)
        const body = (await request.json().catch(() => null)) as {
          entity_type?: string
          entity_id?: string
        } | null
        const result = await unbindAttachment(handle, userId, Number(params.id), body)
        return json(result.body, result.status)
      },
    },
  },
})
