import { defineEndpoint } from "@directus/extensions-sdk"
import { registerAttachmentsEndpoints } from "./attachments"
import { registerAuthEndpoints } from "./auth"
import { registerSessionEndpoints } from "./sessions"
import { registerSyncEndpoints } from "./sync"

export default defineEndpoint({
  id: "tabora",
  handler: (router, context) => {
    registerAuthEndpoints(router, context)
    registerSessionEndpoints(router, context)
    registerAttachmentsEndpoints(router, context)
    registerSyncEndpoints(router, context)
  },
})
