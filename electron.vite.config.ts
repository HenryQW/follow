import fs from "node:fs"
import { resolve } from "node:path"

import { sentryVitePlugin } from "@sentry/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared/src"),
        "@env": resolve("./src/env.ts"),
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        "@env": resolve("./src/env.ts"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared/src"),
        "@pkg": resolve("./package.json"),
        "@env": resolve("./src/env.ts"),
      },
    },
    plugins: [
      react(),
      sentryVitePlugin({
        org: "follow-rg",
        project: "follow",
        disable: process.env.NODE_ENV === "development",
        bundleSizeOptimizations: {
          excludeDebugStatements: true,
          // Only relevant if you added `browserTracingIntegration`
          excludePerformanceMonitoring: true,
          // Only relevant if you added `replayIntegration`
          excludeReplayIframe: true,
          excludeReplayShadowDom: true,
          excludeReplayWorker: true,
        },
        moduleMetadata: {
          appVersion:
            process.env.NODE_ENV === "development" ? "dev" : pkg.version,
        },
      }),
    ],
    define: {
      APP_VERSION: JSON.stringify(pkg.version),
      APP_NAME: JSON.stringify(pkg.name),
      APP_DEV_CWD: JSON.stringify(process.cwd()),
    },
  },
})
