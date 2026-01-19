import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: {
    global: "globalThis",
  },
  build: {
    commonjsOptions: {
      include: [/html-to-rtf-browser/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ["html-to-rtf-browser"],
  },
});
