import { createFileRoute } from "@tanstack/solid-router"

import { getSessionUserId, json } from "../../../server/http"
import { getRuntime } from "../../../server/runtime"
import { pullSyncRecords, pushSyncRecords } from "../../../server/syncRecords"

/** 客户端数据同步端点：POST 批量推送、GET 增量拉取。owner 隔离，登录用户可用。 */
export const Route = createFileRoute("/api/sync/records")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { auth, handle } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { message: "未登录" } }, 401)
        const body = (await request.json().catch(() => null)) as unknown
        const result = await pushSyncRecords(handle, userId, body)
        return json(result.body, result.status)
      },

      GET: async ({ request }) => {
        const { auth, handle } = await getRuntime()
        const userId = await getSessionUserId(auth, request)
        if (!userId) return json({ error: { message: "未登录" } }, 401)
        const since = new URL(request.url).searchParams.get("since")
        const body = await pullSyncRecords(handle, userId, since)
        return json(body)
      },
    },
  },
})
