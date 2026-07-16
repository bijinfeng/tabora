import { defineEndpoint } from "@directus/extensions-sdk"
import { registerAttachmentsEndpoints } from "./attachments"
import { registerAuthEndpoints } from "./auth"
import { registerSessionEndpoints } from "./sessions"

export default defineEndpoint((router, context) => {
  registerAuthEndpoints(router, context)
  registerSessionEndpoints(router, context)
  registerAttachmentsEndpoints(router, context)
})
