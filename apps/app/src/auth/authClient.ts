import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/solid"

/**
 * better-auth 客户端（Solid 专用）+ admin 插件。
 * 同域部署：baseURL 无需配置，默认指向当前 origin。
 */
export const authClient = createAuthClient({
  plugins: [adminClient()],
})
