import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/contentScript.ts")
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "content") {
            return "contentScript.js";
          }
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: assetInfo => {
          if (assetInfo.name === "index.html") {
            return "popup.html";
          }
          return "assets/[name][extname]";
        }
      }
    }
  }
});
