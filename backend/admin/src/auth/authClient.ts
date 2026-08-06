import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/solid"

import { ADMIN_API_BASE_URL } from "../config"

/** better-auth client（Solid 专用）+ admin 插件。 */
export const authClient = createAuthClient({
  baseURL: ADMIN_API_BASE_URL,
  plugins: [adminClient()],
})
