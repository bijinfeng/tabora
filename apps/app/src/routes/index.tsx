import { createFileRoute } from "@tanstack/solid-router"

import { WorkbenchRoute } from "../workbench/WorkbenchRoute"

export const Route = createFileRoute("/")({
  component: WorkbenchRoute,
})
