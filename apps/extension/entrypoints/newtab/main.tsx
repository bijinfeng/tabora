import { render } from "solid-js/web"
import "@tabora/ui/styles.css"

import { App } from "@tabora/playground/src/App"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(() => <App />, root)
