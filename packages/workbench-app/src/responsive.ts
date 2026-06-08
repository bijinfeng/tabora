import { createMediaQuery } from "@solid-primitives/media"

const MOBILE_QUERY = "(max-width: 768px)"

export type WorkbenchResponsiveState = {
  isMobile: () => boolean
}

export function createWorkbenchResponsiveState(query = MOBILE_QUERY): WorkbenchResponsiveState {
  const isMobile = createMediaQuery(query, false)
  return { isMobile }
}
