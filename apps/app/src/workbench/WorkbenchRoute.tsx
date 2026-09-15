import { createSignal, lazy, onMount, Show } from "solid-js"

const WorkbenchApp = lazy(() => import("./App").then(({ App }) => ({ default: App })))

/** 在客户端挂载依赖浏览器存储与嵌套路由的工作台。 */
export function WorkbenchRoute() {
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))

  return (
    <Show when={mounted()}>
      <WorkbenchApp />
    </Show>
  )
}
