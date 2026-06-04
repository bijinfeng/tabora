import { createExtensionHostAdapter } from "@tabora/host-adapters"
import { builtinPlugins } from "@tabora/builtin-plugin-registry"
import { createWorkbenchComposition, createWorkbenchRuntimeBootstrap } from "@tabora/workbench-app"

export function createExtensionWorkbenchComposition() {
  return createWorkbenchComposition({
    host: createExtensionHostAdapter({
      id: "host.extension.newtab",
    }),
  })
}

export function createExtensionRuntimeBootstrap() {
  const composition = createExtensionWorkbenchComposition()

  return createWorkbenchRuntimeBootstrap({
    host: composition.host,
    plugins: builtinPlugins,
    databaseName: "tabora-extension",
  })
}
