import { QueryClientProvider } from "@tanstack/solid-query"
import { render } from "solid-js/web"

import "./stylexDev"
import "@tabora/theme/global.css"
import "@tabora/ui/styles.css"
import { App } from "./App"
import { queryClient } from "./queryClient"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ),
  root,
)
