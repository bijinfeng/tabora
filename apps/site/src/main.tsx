import { render } from "solid-js/web"
import { Route, Router } from "@solidjs/router"
import "./styles.css"
import "@tabora/ui/styles.css"
import { AppShell } from "./app/AppShell"
import { siteRoutes } from "./routes/siteRoutes"

const root = document.getElementById("root")
const routerBase =
  import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(
  () => (
    <Router root={AppShell} base={routerBase}>
      {siteRoutes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
    </Router>
  ),
  root,
)
