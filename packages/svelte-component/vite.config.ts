import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      entry: 'src/App.svelte',
      name: "App",
      formats: ['es', 'umd', 'iife'],
      cssFileName: 'style',
    },
    rollupOptions: {
      // Externalize Svelte for the ES and UMD builds
      external: ['svelte'],
      output: {
        // Provide global variable for Svelte in UMD build
        globals: {
          svelte: 'Svelte',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: "esbuild"
  },
});