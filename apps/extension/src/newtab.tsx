import { render } from "solid-js/web"
import "@tabora/ui/styles.css"

const root = document.getElementById("root")
if (!root) throw new Error("Root element #root was not found")

void import("@tabora/playground/src/App").then((mod) => {
  render(() => mod.App(), root)
})
