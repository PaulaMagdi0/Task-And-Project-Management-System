import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_"]);

  return {
    plugins: [react(), splitVendorChunkPlugin()],
    base: env.VITE_BASE_PATH || "/",
    define: {
      "process.env": {
        VITE_DEBUG: JSON.stringify(env.VITE_DEBUG),
        VITE_APP_NAME: JSON.stringify(env.VITE_APP_NAME),
        VITE_DEFAULT_THEME: JSON.stringify(env.VITE_DEFAULT_THEME),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000", // Proxy to backend base URL
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api"), // Keep /api in path
        },
        "/ai": {
          target: "http://127.0.0.1:8000", // Proxy to backend base URL
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ai/, "/ai"), // Keep /ai in path
        },
        "/ws": {
          target: env.VITE_WS_URL.replace("ws://", "http://"),
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: "terser",
      sourcemap: env.VITE_DEBUG === "true",
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
      terserOptions: {
        compress: {
          drop_console: env.VITE_DEBUG !== "true",
        },
      },
    },
  };
});
