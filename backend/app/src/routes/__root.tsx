import type { QueryClient } from "@tanstack/solid-query"
import { QueryClientProvider } from "@tanstack/solid-query"
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/solid-router"

import "@tabora/theme/global.css"
import "@tabora/ui/styles.css"

export type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Tabora Admin" },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootDocument />
        <Scripts />
      </body>
    </html>
  )
}

function RootDocument() {
  const { queryClient } = Route.useRouteContext()()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
