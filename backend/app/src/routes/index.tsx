import { createFileRoute } from "@tanstack/solid-router"

/** The production entry serves playground before the Start handler reaches this fallback route. */
export const Route = createFileRoute("/")({
  component: () => null,
})
