import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      cssFileName: 'style',
      entry: resolve(__dirname, "./src/main.ts"),
      name: "Arenarium",
    },
    rollupOptions: {
      output: {        
        format: "es",
        entryFileNames: "build.min.js",        
      },      
    },
    minify: "esbuild"
  },
});