import { createFileRoute } from "@tanstack/solid-router"
import { summarizeWorkspaceContext } from "@tabora/ai-runtime"
import { z } from "zod"

import { getSessionUserId, json } from "../../../server/http"
import { getRuntime } from "../../../server/runtime"

const widgetSchema = z.object({
  instanceId: z.string().min(1).max(200),
  pluginId: z.string().min(1).max(200),
  contributionId: z.string().min(1).max(200),
  title: z.string().max(300).optional(),
})

const contextSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  workspaceName: z.string().min(1).max(300),
  activeLayoutId: z.string().min(1).max(200),
  widgets: z.array(widgetSchema).max(200),
})

/** Returns a bounded, metadata-only context summary; plugin private data is not accepted. */
export const Route = createFileRoute("/api/ai/context-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { auth } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { code: "ai_auth_required", message: "未登录" } }, 401)

        const parsed = contextSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
          return json({ error: { code: "ai_request_rejected", message: "工作区摘要无效" } }, 400)
        }

        return json(
          summarizeWorkspaceContext(parsed.data as Parameters<typeof summarizeWorkspaceContext>[0]),
        )
      },
    },
  },
})
