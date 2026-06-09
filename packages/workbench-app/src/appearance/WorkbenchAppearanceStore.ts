import { createStore } from "solid-js/store"

import { isWorkbenchDarkTheme } from "../shared/shellConfig"

export type CreateWorkbenchAppearanceStoreOptions = {
  initialLayoutId: string
  initialThemeId: string
  initialBackgroundId: string
  darkThemeId: string
}

type WorkbenchAppearanceStoreState = {
  activeLayoutId: string
  themeId: string
  backgroundId: string
}

export function createWorkbenchAppearanceStore(options: CreateWorkbenchAppearanceStoreOptions) {
  const [store, setStore] = createStore<WorkbenchAppearanceStoreState>({
    activeLayoutId: options.initialLayoutId,
    themeId: options.initialThemeId,
    backgroundId: options.initialBackgroundId,
  })

  return {
    activeLayoutId: () => store.activeLayoutId,
    setActiveLayoutId: (layoutId: string) => setStore("activeLayoutId", layoutId),
    themeId: () => store.themeId,
    setThemeId: (themeId: string) => setStore("themeId", themeId),
    backgroundId: () => store.backgroundId,
    setBackgroundId: (backgroundId: string) => setStore("backgroundId", backgroundId),
    isDark: () => isWorkbenchDarkTheme(store.themeId, options.darkThemeId),
  }
}

export type WorkbenchAppearanceStore = ReturnType<typeof createWorkbenchAppearanceStore>
