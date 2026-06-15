import type { DashboardLayoutState, RailGroup } from "./types"

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isStoredRailGroup(value: unknown): value is RailGroup {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<RailGroup>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.icon === "string" &&
    typeof candidate.isDefault === "boolean" &&
    isStringArray(candidate.widgets)
  )
}

export function normalizeDashboardLayoutState(
  value: unknown,
  fallbackDefaultGroup: RailGroup,
): DashboardLayoutState {
  const raw =
    value && typeof value === "object"
      ? (value as Partial<{ groups: unknown; activeGroupId: unknown }>)
      : {}
  const storedGroups = Array.isArray(raw.groups) ? raw.groups.filter(isStoredRailGroup) : []
  const storedDefault = storedGroups.find((group) => group.id === "default")
  const defaultGroup = {
    ...fallbackDefaultGroup,
    ...(storedDefault
      ? { name: storedDefault.name, icon: storedDefault.icon, widgets: storedDefault.widgets }
      : {}),
    id: "default",
    isDefault: true,
  }
  const customGroups = storedGroups.filter((group) => group.id !== "default" && !group.isDefault)
  const groups = [defaultGroup, ...customGroups]
  const activeGroupId =
    typeof raw.activeGroupId === "string" && groups.some((group) => group.id === raw.activeGroupId)
      ? raw.activeGroupId
      : "default"

  return { groups, activeGroupId }
}

export function resolveSetterValue<T>(previous: T, value: T | ((previous: T) => T)): T {
  return typeof value === "function" ? (value as (previous: T) => T)(previous) : value
}
