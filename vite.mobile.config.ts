import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // This is intentionally independent of the TanStack Start/Nitro config used
  // by the web deployment. It produces browser-only assets for Capacitor.
  root: "mobile",
  base: "./",
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: "../dist-mobile",
    emptyOutDir: true,
  },
});
