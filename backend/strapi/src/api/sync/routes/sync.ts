export default {
  routes: [
    {
      method: "GET",
      path: "/sync/records",
      handler: "sync.pull",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/sync/records",
      handler: "sync.push",
      config: { policies: [] },
    },
  ],
}
