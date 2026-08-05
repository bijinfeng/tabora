import type {
  BackgroundProviderContributionRef,
  BackgroundProviderContribution,
  ThemeContribution,
  ThemeContributionRef,
  ThemeTokenSet,
  Workspace,
} from "@tabora/plugin-api"

import { resolveBackgroundStyle } from "./backgroundResolver"
import { resolveThemeTokens } from "./themeResolver"

export function applyWorkbenchThemeSelection(options: {
  themeId: string
  themes: ThemeContribution[]
  setThemeId: (themeId: string) => void
  applyTheme: (tokens: ThemeTokenSet) => void
}) {
  options.setThemeId(options.themeId)
  options.applyTheme(resolveThemeTokens(options.themeId, options.themes))
}

export function applyWorkbenchBackgroundSelection(options: {
  backgroundId: string
  backgrounds: BackgroundProviderContribution[]
  setBackgroundId: (backgroundId: string) => void
  applyBackground: (style: Record<string, string>) => void
}) {
  options.setBackgroundId(options.backgroundId)
  options.applyBackground(resolveBackgroundStyle(options.backgroundId, options.backgrounds))
}

export async function switchWorkbenchTheme(options: {
  workspace: Workspace
  theme: ThemeContributionRef
  themes: ThemeContribution[]
  setThemeId: (themeId: string) => void
  applyTheme: (tokens: ThemeTokenSet) => void
  persistTheme: (workspaceId: string, theme: ThemeContributionRef) => Promise<Workspace | null>
  setWorkspaceState: (workspace: Workspace) => void
}) {
  applyWorkbenchThemeSelection({ ...options, themeId: options.theme.id })
  const workspace = await options.persistTheme(options.workspace.id, options.theme)
  if (workspace) {
    options.setWorkspaceState(workspace)
  }
}

export async function switchWorkbenchBackground(options: {
  workspace: Workspace
  background: BackgroundProviderContributionRef
  backgrounds: BackgroundProviderContribution[]
  setBackgroundId: (backgroundId: string) => void
  applyBackground: (style: Record<string, string>) => void
  persistBackground: (
    workspaceId: string,
    background: BackgroundProviderContributionRef,
  ) => Promise<Workspace | null>
  setWorkspaceState: (workspace: Workspace) => void
}) {
  applyWorkbenchBackgroundSelection({ ...options, backgroundId: options.background.id })
  const workspace = await options.persistBackground(options.workspace.id, options.background)
  if (workspace) {
    options.setWorkspaceState(workspace)
  }
}
