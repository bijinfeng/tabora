import type { Component } from "solid-js"

import { DownloadPage } from "./download/DownloadPage"
import { ComponentDocsPage } from "./docs/ComponentDocsPage"
import { DocsHomePage } from "./docs/DocsHomePage"
import { HomePage } from "./home/HomePage"
import { siteRoutePaths } from "./siteRoutePaths"

export type SiteRoute = {
  path: string
  component: Component
}

export const siteRoutes = [
  { path: siteRoutePaths[0], component: HomePage },
  { path: siteRoutePaths[1], component: DownloadPage },
  { path: siteRoutePaths[2], component: DocsHomePage },
  { path: siteRoutePaths[3], component: ComponentDocsPage },
  { path: siteRoutePaths[4], component: ComponentDocsPage },
  { path: siteRoutePaths[5], component: DocsHomePage },
] satisfies SiteRoute[]

export { siteRoutePaths }
