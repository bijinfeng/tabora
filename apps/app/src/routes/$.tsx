import { createFileRoute } from "@tanstack/solid-router"

import { WorkbenchRoute } from "../workbench/WorkbenchRoute"

/** Workbench 的设置等客户端路由需要支持直接访问与浏览器刷新。 */
export const Route = createFileRoute("/$")({
  component: WorkbenchRoute,
})
