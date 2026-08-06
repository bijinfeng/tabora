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
  configResolved(config: { base: string }): void
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
  let faviconHref = "/favicon.svg"
  let faviconPath = faviconHref

  return {
    name: "tabora-brand-favicon",
    configResolved(config) {
      const base = config.base.endsWith("/") ? config.base : `${config.base}/`
      faviconHref = `${base}favicon.svg`
      faviconPath = faviconHref.startsWith("http")
        ? new URL(faviconHref).pathname
        : faviconHref.startsWith("./")
          ? `/${faviconHref.slice(2)}`
          : faviconHref
    },
    configureServer(server: ViteDevServerLike) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?", 1)[0] !== faviconPath) {
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
        `    <link rel="icon" type="image/svg+xml" href="${faviconHref}" />\n  </head>`,
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
