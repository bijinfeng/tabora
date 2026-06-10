import { taboraAppIconPath } from "@tabora/brand/assetPaths"

type Middleware = (
  req: { url?: string },
  res: {
    statusCode: number
    setHeader(name: string, value: string): void
    end(body: string): void
  },
  next: () => void,
) => void

interface ViteDevServerLike {
  middlewares: {
    use(handler: Middleware): void
  }
}

interface PluginContextLike {
  emitFile(asset: { type: "asset"; fileName: string; source: string }): void
}

export interface TaboraBrandFaviconPlugin {
  name: "tabora-brand-favicon"
  configureServer(server: ViteDevServerLike): void
  transformIndexHtml(html: string): string
  generateBundle(this: PluginContextLike): void
}

function readSvgSource(assetPath: string) {
  const encodedSvgPrefixes = ["data:image/svg+xml,", "image/svg+xml,"]
  const encodedSvgSource = encodedSvgPrefixes.find((prefix) => assetPath.startsWith(prefix))

  if (encodedSvgSource) {
    return decodeURIComponent(assetPath.slice(encodedSvgSource.length))
  }

  return process.getBuiltinModule("fs").readFileSync(assetPath, "utf8")
}

export function taboraBrandFavicon(): TaboraBrandFaviconPlugin {
  const faviconSource = readSvgSource(taboraAppIconPath)

  return {
    name: "tabora-brand-favicon",
    configureServer(server: ViteDevServerLike) {
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
