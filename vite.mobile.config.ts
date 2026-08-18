import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "mobile",
  base: "./",
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  build: {
    outDir: "../dist-mobile",
    emptyOutDir: true,
  },
});
