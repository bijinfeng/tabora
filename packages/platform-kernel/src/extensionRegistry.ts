export type ViewComponent = (...args: any[]) => unknown
export type ViewRegistrationDisposer = () => void

export type ViewRegistry = {
  register(viewId: string, view: ViewComponent): ViewRegistrationDisposer
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
        return () => {
          if (views.get(viewId) === view) {
            views.delete(viewId)
          }
        }
      },
      get(viewId) {
        const view = views.get(viewId)
        if (!view) throw new Error(`View not registered: ${viewId}`)
        return view
      },
      has(viewId) {
        return views.has(viewId)
      },
    },
  }
}
