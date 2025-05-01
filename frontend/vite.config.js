import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), splitVendorChunkPlugin()],
    base: env.VITE_BASE_PATH,
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_DEBUG),
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
        "/ai": {
          target: env.VITE_AI_BASE_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: "terser",
      sourcemap: env.VITE_DEBUG === "true",
      chunkSizeWarningLimit: 1200, // Increase warning limit to 1000KB
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("@reduxjs") || id.includes("react-redux")) {
                return "vendor-redux";
              }
              if (id.includes("axios") || id.includes("lodash")) {
                return "vendor-utils";
              }
              return "vendor";
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: env.VITE_DEBUG !== "true", // Remove console.log in production
        },
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@reduxjs/toolkit",
        "axios",
      ],
    },
  };
});
