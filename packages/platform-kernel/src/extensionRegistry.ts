export type ViewComponent = (...args: any[]) => unknown

export type ViewRegistry = {
  register(viewId: string, view: ViewComponent): void
  get(viewId: string): ViewComponent
  has(viewId: string): boolean
}

export type ExtensionRegistry = {
  views: ViewRegistry
}

export function createExtensionRegistry(): ExtensionRegistry {
  const views = new Map<string, ViewComponent>()

  return {
    views: {
      register(viewId, view) {
        views.set(viewId, view)
      },
      get(viewId) {
        const view = views.get(viewId)
        if (!view) {
          throw new Error(`View not registered: ${viewId}`)
        }
        return view
      },
      has(viewId) {
        return views.has(viewId)
      },
    },
  }
}
