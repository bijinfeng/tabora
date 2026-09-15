// @refresh reload

import type { QueryClient } from "@tanstack/solid-query"
import { QueryClientProvider } from "@tanstack/solid-query"
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/solid-router"
import { Suspense, type JSX } from "solid-js"
import { HydrationScript } from "solid-js/web"

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
    // TanStack Start 用根组件渲染 HTML，没有 index.html，StyleX 插件的
    // transformIndexHtml 注入不会触发。dev 下手动接入插件的虚拟 CSS 端点与运行时（供 HMR）；
    // 生产构建时 StyleX 规则已合入被 import 的样式产物，无需这些虚拟入口。
    links: import.meta.env.DEV
      ? [{ rel: "stylesheet", href: `${import.meta.env.BASE_URL}virtual:stylex.css` }]
      : [],
    scripts: import.meta.env.DEV
      ? [{ type: "module", src: `${import.meta.env.BASE_URL}@id/virtual:stylex:runtime` }]
      : [],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument(props: { children: JSX.Element }) {
  return (
    <html lang="zh-CN">
      <head>
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        <Suspense>{props.children}</Suspense>
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext()()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
