import { createFileRoute } from "@tanstack/solid-router"

import { getSessionUserId, json } from "../../../server/http"
import { getRuntime } from "../../../server/runtime"
import { uploadAttachment } from "../../../server/attachmentRoutes"

/** 用户附件上传：multipart/form-data，登录用户可用。 */
export const Route = createFileRoute("/api/attachments/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { auth, handle, storage } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { message: "未登录" } }, 401)
        const form = await request.formData()
        const entityType = form.get("entity_type")
        const result = await uploadAttachment(handle, storage, {
          file: form.get("file"),
          entityType: typeof entityType === "string" ? entityType : "",
        })
        return json(result.body, result.status)
      },
    },
  },
})
