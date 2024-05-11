import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import UnoCss from "unocss/vite";
import path from "node:path";
import { qrcode } from "vite-plugin-qrcode";
import legacy from "@vitejs/plugin-legacy";

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const envDir = "env";
  const env = loadEnv(mode, path.resolve(process.cwd(), envDir));

  console.log(mode, env);

  return defineConfig({
    server: {
      host: true,
      proxy: {
        // "/api": {
        //   target: "http://localhost:8080",
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/api/, "")
        // }
      }
    },
    envDir,
    base: "/",
    resolve: {
      alias: {
        "@": resolve("src")
      }
    },
    plugins: [react(), UnoCss(), qrcode(), legacy()],
    esbuild: {
      drop: mode === "prod" ? ["console", "debugger"] : []
    },
    build: {
      sourcemap: mode !== "prod",
      target: "esnext"
    }
  });
};
