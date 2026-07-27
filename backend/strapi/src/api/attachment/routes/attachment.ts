export default {
  routes: [
    {
      method: "POST",
      path: "/attachments/prepare",
      handler: "attachment.prepare",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/commit",
      handler: "attachment.commit",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/attachments/:id/access",
      handler: "attachment.access",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/:id/bind",
      handler: "attachment.bind",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/:id/unbind",
      handler: "attachment.unbind",
      config: { policies: [] },
    },
  ],
}
