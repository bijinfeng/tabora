import { render } from "solid-js/web"
import "@tabora/ui/styles.css"
import "@tabora/workbench-shell/styles.css"

import { App } from "./App"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(() => <App />, root)
