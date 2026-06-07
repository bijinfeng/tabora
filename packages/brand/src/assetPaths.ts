const assetUrl = new URL("../assets/tabora-app-icon.svg", import.meta.url)
const assetPath = decodeURIComponent(assetUrl.pathname)

export const taboraAppIconPath =
  process.platform === "win32" && assetPath.startsWith("/") ? assetPath.slice(1) : assetPath
