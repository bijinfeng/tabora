import { createFileRoute } from "@tanstack/solid-router"

import { getSessionUserId, json } from "../../../../server/http"
import { getRuntime } from "../../../../server/runtime"
import { accessAttachment } from "../../../../server/attachmentRoutes"

/** 访问附件 URL：仅拥有引用的用户可取，登录用户可用。 */
export const Route = createFileRoute("/api/attachments/$id/access")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { auth, handle, storage } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { message: "未登录" } }, 401)
        const result = await accessAttachment(handle, storage, userId, Number(params.id))
        return json(result.body, result.status)
      },
    },
  },
})
