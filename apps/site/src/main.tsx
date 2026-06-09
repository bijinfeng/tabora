import { render } from "solid-js/web"
import { Route, Router } from "@solidjs/router"
import "@tabora/ui/styles.css"
import "./styles.css"
import { AppShell } from "./app/AppShell"
import { siteRoutes } from "./routes/siteRoutes"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(
  () => (
    <Router root={AppShell}>
      {siteRoutes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
    </Router>
  ),
  root,
)
