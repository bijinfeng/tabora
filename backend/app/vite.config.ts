import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { tanstackStart } from "@tanstack/solid-start/plugin/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

import { taboraBrandFavicon } from "@tabora/brand/vite"
import { createTaboraStylexVitePlugin } from "@tabora/stylex-config"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const backendDevPrefixes = ["/admin", "/api", "/_serverFn"]

function isBackendDevRequest(pathname: string): boolean {
  return backendDevPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export default defineConfig(({ command }) => ({
  // 开发时使用独立资源前缀，避免与被代理的 playground Vite HMR 端点冲突。
  // 生产资源保持根级，由 playground 的 /playground/ 资源前缀避开冲突。
  base: process.env.TABORA_PLAYGROUND_DEV_PROXY === "true" ? "/admin/" : "/",
  ...(process.env.TABORA_PLAYGROUND_DEV_PROXY === "true"
    ? {
        server: {
          proxy: {
            "/": {
              target: "http://127.0.0.1:5173",
              changeOrigin: true,
              ws: true,
              bypass(request) {
                const pathname = new URL(request.url ?? "/", "http://localhost").pathname
                return isBackendDevRequest(pathname) ? request.url : undefined
              },
            },
          },
        },
      }
    : {}),
  plugins: [
    createTaboraStylexVitePlugin({
      rootDir: workspaceRoot,
      dev: command === "serve",
      devMode: command === "serve" ? "full" : "off",
    }),
    tanstackStart({
      router: {
        // 管理页路由本身位于 /admin；保持 router basepath 在根路径，确保 /api 不被前缀化。
        basepath: "/",
      },
      spa: {
        enabled: true,
      },
    }),
    solid({ ssr: true }),
    taboraBrandFavicon(),
  ],
}))
