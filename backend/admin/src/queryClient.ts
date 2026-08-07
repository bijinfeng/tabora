import { QueryClient } from "@tanstack/solid-query"

/** 管理后台全局 QueryClient。数据默认短暂缓存，聚焦时自动重新验证。 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
