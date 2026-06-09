import { render } from "solid-js/web"
import { Route, Router } from "@solidjs/router"
import "@tabora/ui/styles.css"
import "./styles.css"
import { App, ComponentDocsRoute, DocsHomeRoute, DownloadRoute, HomeRoute } from "./App"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(
  () => (
    <Router root={App}>
      <Route path="/" component={HomeRoute} />
      <Route path="/download" component={DownloadRoute} />
      <Route path="/docs" component={DocsHomeRoute} />
      <Route path="/docs/components" component={ComponentDocsRoute} />
      <Route path="/docs/components/:componentId" component={ComponentDocsRoute} />
    </Router>
  ),
  root,
)
