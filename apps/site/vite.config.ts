import tailwindcss from "@tailwindcss/vite"
import { readFileSync } from "node:fs"
import { defineConfig, type Plugin, type ViteDevServer } from "vite"
import solid from "vite-plugin-solid"

import { taboraAppIconPath } from "@tabora/brand/assetPaths"

function taboraBrandFavicon(): Plugin {
  const faviconSource = readFileSync(taboraAppIconPath, "utf8")

  return {
    name: "tabora-brand-favicon",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/favicon.svg") {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader("Content-Type", "image/svg+xml")
        res.end(faviconSource)
      })
    },
    transformIndexHtml(html: string) {
      return html.replace(
        "</head>",
        '    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n  </head>',
      )
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "favicon.svg",
        source: faviconSource,
      })
    },
  }
}

export default defineConfig({
  plugins: [solid(), tailwindcss(), taboraBrandFavicon()],
})
